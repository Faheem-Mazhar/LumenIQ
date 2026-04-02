import io
import httpx
import asyncio
import json
import numpy as np
import math
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA
from collections import Counter
from datetime import datetime, timezone
from openai import AsyncOpenAI
from app.agents.base_agent import Agent
from app.db.business_profiler_queries import BusinessProfilerQueries
from app.schemas.agent_results import TrendAnalysisResult
from app.config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, TEXT_EMBEDDING_MODEL, CLIP_MODEL, CLUSTER_LABEL_MODEL


class TrendAnalysisAgent(Agent):

    POSTING_TIME_WINDOWS = [
        (6, 8, "6am-8am"),
        (8, 10, "8am-10am"),
        (10, 12, "10am-12pm"),
        (12, 14, "12pm-2pm"),
        (14, 16, "2pm-4pm"),
        (16, 18, "4pm-6pm"),
        (18, 20, "6pm-8pm"),
        (20, 22, "8pm-10pm")
    ]

    def __init__(self, kernel):
        super().__init__(kernel=kernel, name="trend_analysis_agent")

        self.business_profiler_queries = BusinessProfilerQueries()

        self._client = AsyncOpenAI(
            api_key=OPENROUTER_API_KEY,
            base_url=OPENROUTER_BASE_URL,
        )

        self.clip_model = CLIPModel.from_pretrained(CLIP_MODEL)
        self.clip_processor = CLIPProcessor.from_pretrained(CLIP_MODEL)
        self.clip_model.eval()

    async def run(self, context):

        # Fetching competitors posts
        business_id = context.business_id
        competitor_posts = self.business_profiler_queries.get_competitor_posts(business_id)
        #print(competitor_posts)

        # Generating caption embeddings and saving it in a list of  dicitonaries
        post_ids = []
        captions = []
        caption_data = []
        for post in competitor_posts:
            caption = (post.get("caption") or "").strip()
            if caption:
                post_ids.append(post["id"])
                captions.append(caption)
        if captions:
            caption_embeddings = await self.embed_captions(captions)

            for i, embedding in enumerate(caption_embeddings):
                caption_data.append({"post_id": post_ids[i], "caption": captions[i], "embedding": embedding})
        
        # Debugging 
        #print(caption_data)
        print(len(caption_data))
        #print()
        self.business_profiler_queries.save_caption_embeddings(caption_data)

        # Downloading all images concurrently to reduce downloading bottleneck
        all_urls = []
        for post in competitor_posts:
            for image_url in post.get("image_urls") or []:
                all_urls.append(image_url)
        downloaded_urls = await self.download_all_images(all_urls)

        # Generating image embeddings and saving it in a list of dicitonaries
        image_data = []
        for post in competitor_posts:
            for image_url in post.get("image_urls") or []:
                if image_url in downloaded_urls:
                    image_bytes = downloaded_urls[image_url]
                    image_embedding = self.embed_image(image_bytes)
                    if image_embedding is not None:
                        image_data.append({"post_id": post["id"], "image_url": image_url, "embedding": image_embedding}) 

        # Debugging
        #print (image_data)
        print(len(image_data))
        #print()
        self.business_profiler_queries.save_image_embeddings(image_data)

        # Converting caption and image records to embedding matrices
        caption_embedding_records = []
        for record in caption_data:
            caption_embedding_records.append(record["embedding"])
        caption_embedding_matrix = np.array(caption_embedding_records)

        image_embedding_records = []
        for record in image_data:
            image_embedding_records.append(record["embedding"])
        image_embedding_matrix = np.array(image_embedding_records)

        # Applything PCA to reduce noise in data
        caption_embedding_matrix = self.reduce_dimensions(caption_embedding_matrix)
        image_embedding_matrix = self.reduce_dimensions(image_embedding_matrix)

        # Need to save pca reduced embeddings in image_data to use later on in distance calculation for image cluster labelling using llm
        for i, record in enumerate(image_data):
            record["embedding_reduced"] = image_embedding_matrix[i]

        # Finding the optimal K value for K means 
        caption_cluster_k_value = self.find_best_k(caption_embedding_matrix, 5)
        print(f"Best caption K: {caption_cluster_k_value}")
        image_cluster_k_value = self.find_best_k(image_embedding_matrix, 7)
        print(f"Best Image K: {image_cluster_k_value}")

        # Running K means clustering
        caption_kmeans = KMeans(n_clusters=caption_cluster_k_value, random_state=42, n_init=15)
        image_kmeans = KMeans(n_clusters=image_cluster_k_value, random_state=42, n_init=15)

        caption_preds = caption_kmeans.fit_predict(caption_embedding_matrix)
        image_preds = image_kmeans.fit_predict(image_embedding_matrix)

        # Assigning cluster prediction ids to caption and image data records
        for i, record in enumerate(caption_data):
            record["cluster_id"] = int(caption_preds[i])
        
        for i, record in enumerate(image_data):
            record["cluster_id"] = int(image_preds[i])

        # Assigning a caption and image cluster id to each post 
        post_caption_cluster = {}
        for record in caption_data:
            post_caption_cluster[record["post_id"]] = record["cluster_id"]

        # A single post id can be linked to multiple image clusters ids because one post can have multiple images, each with a seperate cluster id
        # Find the most dominant id in the list of image cluster ids and assign that cluster id to the post
        post_clusters = {}
        for record in image_data:
            post_id = record["post_id"]
            cluster_id = record["cluster_id"]

            if post_id not in post_clusters:
                post_clusters[post_id] = []
            post_clusters[post_id].append(cluster_id)
        
        post_image_cluster = {}
        for post_id in post_clusters:
            clusters_list = post_clusters[post_id]
            post_image_cluster[post_id] = self.assign_dominant_cluster_id(clusters_list)

        # Initialize a dictionary of dictionaries to save capton and image cluster stats, which can be later used to calculate engagement rates and trend scores per clusters
        caption_cluster_stats = {}
        for post in competitor_posts:
            post_id = post["id"]
            caption_cluster_number = post_caption_cluster.get(post_id)

            if caption_cluster_number is not None:
                if caption_cluster_number not in caption_cluster_stats:
                    caption_cluster_stats[caption_cluster_number] = {"engagement_rates": [], "post_count": 0}
                caption_cluster_stats[caption_cluster_number]["engagement_rates"].append(post["engagement_rate"])
                caption_cluster_stats[caption_cluster_number]["post_count"] += 1

        image_cluster_stats = {}
        for post in competitor_posts:
            post_id = post["id"]
            image_cluster_number = post_image_cluster.get(post_id)

            if image_cluster_number is not None:
                if image_cluster_number not in image_cluster_stats:
                    image_cluster_stats[image_cluster_number] = {"engagement_rates": [], "post_count": 0}
                image_cluster_stats[image_cluster_number]["engagement_rates"].append(post["engagement_rate"])
                image_cluster_stats[image_cluster_number]["post_count"] += 1
        
        # Calculate engagement rates and trend scores per cluster
        for cluster_id, stats in caption_cluster_stats.items():
            avg_engagement = sum(stats["engagement_rates"]) / len(stats["engagement_rates"])
            trend_score = avg_engagement * math.log(stats["post_count"] + 1)
            caption_cluster_stats[cluster_id]["avg_engagement"] = avg_engagement
            caption_cluster_stats[cluster_id]["trend_score"] = trend_score
        
        for cluster_id, stats in image_cluster_stats.items():
            avg_engagement = sum(stats["engagement_rates"]) / len(stats["engagement_rates"])
            trend_score = avg_engagement * math.log(stats["post_count"] + 1)
            image_cluster_stats[cluster_id]["avg_engagement"] = avg_engagement
            image_cluster_stats[cluster_id]["trend_score"] = trend_score

        # Debugging
        #print (caption_cluster_stats)
        # print ()
        #print(image_cluster_stats)

        # Getting best hashtags trends per cluster
        hashtag_post_count = {}
        for post in competitor_posts:
            for hashtag in (post.get("hashtags") or []):
                hashtag = hashtag.lower().strip()
                hashtag_post_count[hashtag] = hashtag_post_count.get(hashtag, 0) + 1

        cluster_hashtags = {}
        for post in competitor_posts:
            post_id = post["id"]
            cluster_id = post_image_cluster.get(post_id)
            hashtags = post.get("hashtags")
            engagement = post.get("engagement_rate", 0)

            if cluster_id is not None and hashtags:
                if cluster_id not in cluster_hashtags:
                    cluster_hashtags[cluster_id] = {}

                for hashtag in hashtags:
                    hashtag = hashtag.lower().strip()
                    if hashtag_post_count.get(hashtag, 0) < 3:
                        continue
                    if hashtag not in cluster_hashtags[cluster_id]:
                        cluster_hashtags[cluster_id][hashtag] = 0
                    cluster_hashtags[cluster_id][hashtag] += engagement
        
        best_hashtags = {}
        for cluster_id in cluster_hashtags:
            hashtag_scores = cluster_hashtags[cluster_id]
            sorted_hashtags = sorted(hashtag_scores, key=hashtag_scores.get, reverse=True)
            best_hashtags[cluster_id] = sorted_hashtags[:10]

        # Debugging
        #print()
        #print("Hashtags post count", hashtag_post_count)
        #print()
        #print("Cluster's Hashtags", cluster_hashtags)
        print()
        print("Best hashtags", best_hashtags)

        # Getting best posting time trends per cluster
        cluster_times = {}
        for post in competitor_posts:
            post_id = post["id"]
            cluster_id = post_image_cluster.get(post_id)
            posted_at = post.get("posted_at")
            engagement = post.get("engagement_rate", 0)

            if cluster_id is not None and posted_at:
                dt = datetime.fromisoformat(posted_at.replace(" ", "T"))
                hour = dt.hour
                if 6 <= hour < 22:
                    time_range = self.get_posting_time_window(hour)

                    time_bucket = f"{dt.strftime('%A')} {time_range}"

                    if cluster_id not in cluster_times:
                        cluster_times[cluster_id] = {}
                    if time_bucket not in cluster_times[cluster_id]:
                        cluster_times[cluster_id][time_bucket] = []

                    cluster_times[cluster_id][time_bucket].append(engagement)
        
        best_posting_times = {}
        for cluster_id, buckets in cluster_times.items():
            filtered_buckets = {}
            for bucket, rates in buckets.items():
                if len(rates) >= 2:
                    filtered_buckets[bucket] = rates
            if not filtered_buckets:
                filtered_buckets = buckets
            best_bucket = max(
                filtered_buckets, 
                key=lambda bucket: (sum(filtered_buckets[bucket]) / len(filtered_buckets[bucket])) * math.log(len(filtered_buckets[bucket]) + 1)
                )
            best_posting_times[cluster_id] = best_bucket

        # Debugging
        print()
        #print("Cluster times", cluster_times)
        #print()
        print("Best posting times:", best_posting_times)

        # Label caption clusters via llm
        caption_cluster_labels = {}
        for cluster_id, stats in caption_cluster_stats.items():
            if stats["post_count"] < 5:
                caption_cluster_labels[cluster_id] = {
                    "name": "N/A",
                    "tone_summary": "N/A"
                }
                continue
            label = await self.label_caption_cluster(cluster_id, caption_data)
            caption_cluster_labels[cluster_id] = label

        # Debugging 
        print()
        print(caption_cluster_labels)
     
        # Label image clusters via llm
        image_cluster_labels = {}
        for cluster_id, stats in image_cluster_stats.items():
            if stats["post_count"] < 5:
                image_cluster_labels[cluster_id] = {
                    "name": "N/A",
                    "description": "N/A",
                    "shot_angle": "N/A",
                    "lighting": "N/A",
                    "composition": "N/A",
                    "color_palette": "N/A"
                }
                continue
            label = await self.label_image_cluster(cluster_id, image_data, image_kmeans.cluster_centers_)
            image_cluster_labels[cluster_id] = label

        # Debugging 
        print()
        print(image_cluster_labels)

        # Building the cross analysis matrix
        cross_matrix = {}
        for post in competitor_posts:
            post_id = post["id"]
            image_cluster = post_image_cluster.get(post_id)
            caption_cluster = post_caption_cluster.get(post_id)
            engagement = post.get("engagement_rate", 0)

            if image_cluster is None or caption_cluster is None:
                continue
            if image_cluster_labels.get(image_cluster, {}).get("name") == "N/A":
                continue
            if caption_cluster_labels.get(caption_cluster, {}).get("name") == "N/A":
                continue
            if image_cluster not in cross_matrix:
                cross_matrix[image_cluster] = {}
            if caption_cluster not in cross_matrix[image_cluster]:
                cross_matrix[image_cluster][caption_cluster] = []
            cross_matrix[image_cluster][caption_cluster].append(engagement)
        
        cross_matrix_avg_engagement = {}
        for image_cluster, caption_clusters in cross_matrix.items():
            cross_matrix_avg_engagement[image_cluster] = {}
            for caption_cluster, engagements in caption_clusters.items():
                avg = sum(engagements) / len(engagements)
                weighted_engagement = avg * math.log(len(engagements) + 1)
                cross_matrix_avg_engagement[image_cluster][caption_cluster] = weighted_engagement 

        print()
        print("Cross matrix:", cross_matrix_avg_engagement)

        # Building best combination
        best_combinations = []
        for image_cluster, caption_clusters in cross_matrix_avg_engagement.items():
            image_label = image_cluster_labels.get(image_cluster, {})
            if image_label.get("name") == "N/A":
                continue

            for caption_cluster, weighted_score in caption_clusters.items():
                caption_label = caption_cluster_labels.get(caption_cluster, {})
                if caption_label.get("name") == "N/A":
                    continue
                
                best_combinations.append({
                    "rank": 0,  
                    "engagement_multiplier": round(weighted_score, 4),
                    "image_cluster_id": image_cluster,
                    "caption_cluster_id": caption_cluster,
                    "image_style": image_label.get("name"),
                    "image_style_description": image_label.get("description"),
                    "shot_angle": image_label.get("shot_angle"),
                    "lighting": image_label.get("lighting"),
                    "composition": image_label.get("composition"),
                    "color_palette": image_label.get("color_palette"),
                    "caption_style": caption_label.get("name"),
                    "caption_tone_summary": caption_label.get("tone_summary"),
                    "best_hashtags": best_hashtags.get(image_cluster, []),
                    "best_posting_time": best_posting_times.get(image_cluster, "N/A")
                })

        best_combinations.sort(key=lambda combination: combination["engagement_multiplier"], reverse=True)

        for i, combination in enumerate(best_combinations):
            combination["rank"] = i + 1

        # Debugging
        #print()
        #print(f"Best combinations: {best_combinations}")

        # Building trend summary
        trend_summary = {
            "best_combinations": best_combinations
        }

        print()
        print(json.dumps(trend_summary, indent=2))
        self.business_profiler_queries.save_trend_summary(business_id, trend_summary)

        return TrendAnalysisResult(
            business_id=business_id,
            success=True,
            image_cluster_count=image_cluster_k_value,
            caption_cluster_count=caption_cluster_k_value,
            message=f"Identified {image_cluster_k_value} visual styles and {caption_cluster_k_value} caption styles across {len(competitor_posts)} competitor posts.",
            summary=trend_summary
        )

    # Creating embeddings for all captions
    async def embed_captions(self, captions):
        try:
            response = await self._client.embeddings.create(
                input = captions,
                model = TEXT_EMBEDDING_MODEL
            )
            return [item.embedding for item in response.data]
        except Exception:
            raise

    # Creating embeddings for a single image using catched image bytes
    def embed_image(self, image_bytes):
        try:
            if not image_bytes or len(image_bytes) < 100:
                return None
            
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

            inputs = self.clip_processor(images=image, return_tensors="pt")

            with torch.no_grad():
                image_features = self.clip_model.get_image_features(**inputs)
                image_features = image_features.pooler_output

            image_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)
            image_embedding = image_features.squeeze().tolist()

            return image_embedding      
        except Exception:
            raise

    # Helper function to download images concurrently 
    async def download_all_images(self, urls):
        async with httpx.AsyncClient() as client:
            results = await asyncio.gather(*[self.download_image(client, url) for url in urls])
        return {url: content for url, content in results if content}
    
    # Helper function to download images concurrently 
    async def download_image(self, client, url):
        try:
            response = await client.get(url, timeout=10)
            return url, response.content
        except Exception as e:
            print(f"Failed to download {url}: {e}")
            return url, None
    
    # Finds best k value based on silhouette score
    def find_best_k(self, embeddings, max_k):
        si_scores = []
        for k in range(3,12):
            if k >= len(embeddings):
                break
            model = KMeans(n_clusters=k, random_state=42, n_init=15)
            preds = model.fit_predict(embeddings)
            si_score = silhouette_score(embeddings, preds)
            si_scores.append(si_score)
            print(f"k={k}, silhouette score={si_score:.4f}")
            

        best_k = si_scores.index(max(si_scores)) + 3
        return min(best_k, max_k)
    
    # Applying PCA to reduce noise in data 
    def reduce_dimensions(self, embeddings):
        n_components = 35
        pca = PCA(n_components=n_components, random_state=42)
        return pca.fit_transform(embeddings)

    # Finding the most commonn cluster id from the list of image cluster ids per post
    def assign_dominant_cluster_id(self, cluster_list):
        return Counter(cluster_list).most_common(1)[0][0]
    
    # Getting the posting time window for the posted time
    def get_posting_time_window(self, hour):
        for start, end, label in self.POSTING_TIME_WINDOWS:
            if start <= hour < end:
                return label
        return None
    
    # Calling LLM to assign labels to caption clusters
    async def label_caption_cluster(self, cluster_id, caption_data):
        cluster_captions = []
        for record in caption_data:
            if record["cluster_id"] == cluster_id:
                words = record["caption"].split()
                caption = " ".join(words[:50])
                cluster_captions.append(caption)
            if len(cluster_captions) == 10:
                break
        
        if not cluster_captions:
            return {"name": "N/A", "tone_summary": "N/A"}
        
        try:
            response = await self._client.chat.completions.create(
                model=CLUSTER_LABEL_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": (
                            f"These Instagram captions belong to the same style cluster:\n\n"
                            f"{cluster_captions}\n\n"
                            "Identify their common style and tone.\n"
                            "Return ONLY valid JSON, no markdown, no explanation:\n"
                            '{"name": "3-5 word cluster name", "tone_summary": "2-3 sentence description of tone and style"}'
                        )
                    }
                ],
                max_tokens=200,
                temperature=0
            )
            result = response.choices[0].message.content.strip()
            if result.startswith("```"):
                result = result.split("\n", 1)[1]
                result = result.rsplit("```", 1)[0]

            result = json.loads(result)
   
            return result
        except Exception as e:
            print(f"Caption cluster {cluster_id} labelling failed: {e}")
            return {"name": "N/A", "tone_summary": "N/A"}

    
    # Calling LLM to assign labels to image clusters
    async def label_image_cluster(self, cluster_id, image_data, cluster_centers):
        cluster_images = []
        for record in image_data:
            if record["cluster_id"] == cluster_id:
                cluster_images.append(record)
        
        if not cluster_images:
            return {
                "name": "N/A",
                "description": "N/A", 
                "shot_angle": "N/A", 
                "lighting": "N/A", 
                "composition": "N/A", 
                "color_palette": "N/A"
            }
        
        cluster_centroid = cluster_centers[cluster_id]
        cluster_images.sort(key=lambda r: -np.dot(np.array(r["embedding_reduced"]), cluster_centroid))
        closest_images = cluster_images[:4]

        content = [
            {
                "type": "text",
                "text": (
                    "These Instagram images belong to the same visual cluster.\n"
                    "Analyze what they have in common and describe the visual style.\n\n"
                    "Focus ONLY on:\n"
                    "- Shot angle (overhead, eye-level, close-up, wide)\n"
                    "- Lighting (natural, warm, bright, moody, dark)\n"
                    "- Composition (flat lay, lifestyle, product-focused, environmental)\n"
                    "- Color palette (warm, cool, neutral, vibrant, dark)\n\n"
                    "Return ONLY valid JSON, no markdown, no explanation:\n"
                    '{"name": "3-5 word cluster name", "description": "2-3 sentence visual style description", '
                    '"shot_angle": "one word", "lighting": "one or two words", '
                    '"composition": "one or two words", "color_palette": "two or three words"}'
                )
            }
        ]

        for img in closest_images:
            content.append({
                "type": "image_url",
                "image_url": {"url": img["image_url"]}
            })

        try:
            response = await self._client.chat.completions.create(
                model=CLUSTER_LABEL_MODEL,
                messages=[{"role": "user", "content": content}],
                max_tokens=400,
                temperature=0
            )
            result = response.choices[0].message.content.strip()
            if result.startswith("```"):
                result = result.split("\n", 1)[1]
                result = result.rsplit("```", 1)[0]
            result = json.loads(result)
            return result

        except Exception as e:
            print(f"Image cluster {cluster_id} labelling failed: {e}")
            return {
                "name": "N/A",
                "description": "N/A",
                "shot_angle": "N/A",
                "lighting": "N/A",
                "composition": "N/A",
                "color_palette": "N/A"
            }
