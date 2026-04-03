from __future__ import annotations

import asyncio
import json
import logging
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Optional

from app.db.supabase_client import supabase
from app.schemas.agent_results import BusinessProfilerResult, TrendSummary
from app.schemas.business_context import BusinessContext, check_utc

logger = logging.getLogger(__name__)


def parse_dt(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return check_utc(value)
    if isinstance(value, str):
        return check_utc(datetime.fromisoformat(value.replace("Z", "+00:00")))
    return None


def format_location(city: Optional[str], country: Optional[str]) -> Optional[str]:
    parts = [p for p in (city, country) if p and p.strip()]
    return ", ".join(parts) if parts else None


def load_json(raw: Any) -> dict:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        return json.loads(raw)
    return {}


class BusinessProfilerQueries:
    # get_business_context
    # Reads the businesses row, derives pipeline flags from related tables,
    # and builds a BusinessContext used by the router and agents.

    def get_business_context(self, user_id: str, business_id: str) -> BusinessContext:
        business = (
            supabase.table("businesses")
            .select("*")
            .eq("id", business_id)
            .limit(1)
            .execute()
        )
        if not business.data:
            raise LookupError(f"No business found for id={business_id}")
        row = business.data[0]
        profile = load_json(row.get("profile_json"))

        # Freshness: competitor_posts uses latest posted_at of scraped posts for freshness
        posts_ts = (
            supabase.table("competitor_posts")
            .select("posted_at")
            .eq("business_id", business_id)
            .order("posted_at", desc=True)
            .limit(1)
            .execute()
        )
        posts_last_scraped = parse_dt(posts_ts.data[0]["posted_at"]) if posts_ts.data else None

        trends_ts = (
            supabase.table("trend_summaries")
            .select("created_at")
            .eq("business_id", business_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        trends_last_updated = parse_dt(trends_ts.data[0]["created_at"]) if trends_ts.data else None

        hashtags_last_updated = parse_dt(profile.get("hashtags_last_updated"))

        # Pipeline state flags
        has_hashtags = bool(profile.get("primary_hashtags"))
        
        has_top_posts = bool(
            supabase.table("competitor_posts")
            .select("id")
            .eq("business_id", business_id)
            .limit(1)
            .execute()
            .data
        )

        has_trend_summary = bool(
            supabase.table("trend_summaries")
            .select("id")
            .eq("business_id", business_id)
            .limit(1)
            .execute()
            .data
        )

        has_content_plan = bool(
            supabase.table("content_ideas")
            .select("id")
            .eq("business_id", business_id)
            .limit(1)
            .execute()
            .data
        )

        has_scheduled_posts = bool(
            supabase.table("calendar_posts")
            .select("id")
            .eq("business_id", business_id)
            .in_("status", ["scheduled", "published"])
            .limit(1)
            .execute()
            .data
        )

        return BusinessContext(
            user_id=user_id,
            business_id=business_id,
            business_name=row.get("name"),
            business_type=row.get("business_type"),
            location=format_location(row.get("city"), row.get("country")),
            target_customers=row.get("ideal_customer"),
            instagram_handle=row.get("instagram_handle"),
            website=row.get("website_url"),
            has_hashtags=has_hashtags,
            has_top_posts=has_top_posts,
            has_trend_summary=has_trend_summary,
            has_content_plan=has_content_plan,
            has_scheduled_posts=has_scheduled_posts,
            hashtags_last_updated=hashtags_last_updated,
            posts_last_scraped=posts_last_scraped,
            trends_last_updated=trends_last_updated,
        )

    # Save profiler results
    def save_profiler_result(self, result: BusinessProfilerResult) -> None:
        profile_json = {
            "primary_hashtags": result.primary_hashtags,
            "secondary_hashtags": result.secondary_hashtags,
            "location_keywords": result.location_keywords,
            "exclude_accounts": result.exclude_accounts,
            "ideal_follower_min": result.ideal_follower_min,
            "ideal_follower_max": result.ideal_follower_max,
            "brand_voice": result.brand_voice,
            "brand_colors": result.brand_colors,
            "content_style": result.content_style,
            "hashtags_last_updated": datetime.now(timezone.utc).isoformat(),
        }
        resp = (
            supabase.table("businesses")
            .update({"profile_json": json.dumps(profile_json)})
            .eq("id", result.business_id)
            .execute()
        )
        if not resp.data:
            raise RuntimeError(f"Failed to save profiler result for business_id={result.business_id}")

    # Calendar posts
    def get_scheduled_posts(self, day: date, business_id: str) -> list[dict[str, Any]]:
        start = datetime.combine(day, time.min, tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        result = (
            supabase.table("calendar_posts")
            .select("*")
            .eq("business_id", business_id)
            .gte("scheduled_at", start.isoformat())
            .lt("scheduled_at", end.isoformat())
            .order("scheduled_at")
            .execute()
        )
        return result.data or []

    def get_all_scheduled_posts(self, business_id: str) -> list[dict[str, Any]]:
        result = (
            supabase.table("calendar_posts")
            .select("*")
            .eq("business_id", business_id)
            .gte("scheduled_at", datetime.now(timezone.utc).isoformat())
            .order("scheduled_at")
            .execute()
        )
        return result.data or []

    def cancel_scheduled_post(self, post_id: str) -> None:
        supabase.table("calendar_posts").delete().eq("id", post_id).execute()

    def schedule_post(
        self,
        business_id: str,
        scheduled_at: datetime,
        caption: Optional[str] = None,
        media: Optional[dict[str, Any]] = None,
        hashtags: Optional[list[str]] = None,
        day_of_the_week: Optional[int] = None,
        status: str = "scheduled",
    ) -> dict[str, Any]:
        # DB check constraint rejects non-draft posts with empty required fields
        if status != "draft":
            if not caption:
                raise ValueError("caption is required when status is not 'draft'")
            if not media:
                raise ValueError("media is required when status is not 'draft'")
            if not hashtags:
                raise ValueError("hashtags are required when status is not 'draft'")

        payload: dict[str, Any] = {
            "business_id": business_id,
            "scheduled_at": check_utc(scheduled_at).isoformat(),
            "caption": caption,
            "media": media or {},
            "hashtags": hashtags or [],
            "status": status,
        }
        if day_of_the_week is not None:
            payload["day_of_the_week"] = day_of_the_week
        result = supabase.table("calendar_posts").insert(payload).execute()
        if not result.data:
            raise RuntimeError("schedule_post insert returned no data")
        return result.data[0]

    # Competitors
    def get_competitor_list_sync(self, business_id: str) -> list[dict[str, Any]]:
        result = (
            supabase.table("competitors")
            .select("*")
            .eq("business_id", business_id)
            .order("username")
            .execute()
        )
        return result.data or []

    async def get_competitor_list(self, business_id: str) -> list[dict[str, Any]]:
        return await asyncio.to_thread(self.get_competitor_list_sync, business_id)
    
    def get_competitor_posts(self, business_id: str) -> list[dict[str, Any]]:
        result = (
            supabase.table("competitor_posts")
            .select("*")
            .eq("business_id", business_id)
            .order("posted_at", desc=True)
            .execute()
        )
        return result.data or []

    # Hashtags (from competitor_posts.hashtags)
    # Async because manager_agent.py awaits this method.
    def get_competitor_hashtags_sync(self, business_id: str) -> list[str]:
        result = (
            supabase.table("competitor_posts")
            .select("hashtags")
            .eq("business_id", business_id)
            .execute()
        )
        seen: set[str] = set()
        for row in result.data or []:
            for tag in row.get("hashtags") or []:
                if tag and tag.strip():
                    seen.add(tag.strip())
        return sorted(seen)

    async def get_competitor_hashtags(self, business_id: str) -> list[str]:
        return await asyncio.to_thread(self.get_competitor_hashtags_sync, business_id)

    # Trend summary
    # Async because manager_agent.py awaits this method.
    def get_trend_summary_sync(self, business_id: str) -> Optional[TrendSummary]:
        result = (
            supabase.table("trend_summaries")
            .select("*")
            .eq("business_id", business_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        row = result.data[0]
        data = load_json(row.get("summary"))
        if "created_at" not in data and row.get("created_at"):
            data["created_at"] = row["created_at"]
        return TrendSummary.model_validate(data)

    async def get_trend_summary(self, business_id: str) -> Optional[TrendSummary]:
        return await asyncio.to_thread(self.get_trend_summary_sync, business_id)

    def save_trend_summary(self, business_id: str, trend_summary: dict[str, Any]) -> None:
        """Persist a trend summary to the trend_summaries table.

        *trend_summary* is a dict (e.g. {"best_combinations": [...]}).
        It is stored as-is in the ``summary`` jsonb column.
        ``created_at`` is auto-filled by Supabase.
        """
        payload = {
            "business_id": business_id,
            "summary": json.dumps(trend_summary),
        }
        result = (
            supabase.table("trend_summaries")
            .insert(payload)
            .execute()
        )
        if not result.data:
            raise RuntimeError(f"Failed to save trend summary for business_id={business_id}")

    def save_caption_embeddings(self, caption_data: list[dict[str, Any]]) -> None:
        payload = [{
            "post_id": item["post_id"],
            "caption": item["caption"],
            "embedding": item["embedding"],
        }
        for item in caption_data
        ]
        # upsert: if post_id already exists, update the row
        supabase.table("post_caption_embeddings") \
            .upsert(payload, on_conflict="post_id") \
            .execute()

    def save_image_embeddings(self, image_data: list[dict[str, Any]]) -> None:
        
        payload = [{
            "post_id": item["post_id"],
            "image_url": item["image_url"],
            "embedding": item["embedding"],
        }
        for item in image_data
        ]
        supabase.table("post_image_embeddings") \
            .insert(payload) \
            .execute()
        
    def save_content_image(self, business_id, image_url):
        data = {
            "business_id": business_id,
            "file_url": image_url,
            "file_name": image_url.split("/")[-1] or "",
            "file_type": "image/" + image_url.split(".")[-1].lower() 
        }
        results = supabase.table("business_media").insert(data).execute()
        if not results.data:
            raise RuntimeError(f"Failed to save ai generated image to DB for image url:{image_url}")


#scheduler queries
# widescale queires to grab all scheduled posts that are due to be published
# not tied to a specific business or user, but for the entire platform
def get_due_scheduled_posts(now_iso: str):
    response = supabase.table("calendar_posts") \
        .select("*") \
        .eq("status", "scheduled") \
        .lte("scheduled_at", now_iso) \
        .execute()
    return response.data

def mark_post_as_published(post_id: str):
    supabase.table("calendar_posts") \
        .update({"status": "published"}) \
        .eq("id", post_id) \
        .execute()

def log_publish_attempt(post_id: str, succeeded: bool, message: str = ""):
    data = {
        "calendar_post_id": post_id,
        "succeeded": succeeded
    }
    if message:
        data["response"] = {"message": message}
    supabase.table("publish_attempts").insert(data).execute()