import asyncio
import json
from datetime import datetime, timezone
from typing import Any, Optional

import requests
from app.agents.base_agent import Agent
from app.schemas.agent_results import ContentGeneratorResult, PhotoDetails, CaptionDetails, HashtagDetails, PostSettings
from app.schemas.business_context import BusinessContext
from app.schemas.agent_results import TrendSummary
from app.config import N8N_CONTENT_WEBHOOK_URL

# n8n flow: POST /content-generator
#
# option_flag routing:
#   1 = Content Strategy  → LLM generates full post brief
#   2 = Image Analysis    → GPT-4o scores & captions an existing photo
#   3 = Image Generation  → KIE API; sub-routed by `generate`
#                             generate=1 → text-to-image
#                             generate=2 → image-to-image (requires image_url)


class ContentGeneratorAgent(Agent):
    def __init__(self, kernel):
        super().__init__(kernel=kernel, name="content_generator_agent")

    async def run(
        self,
        context: BusinessContext,
        trend_summary: Optional[TrendSummary] = None,
        user_prompt: Optional[str] = None,
        image_url: Optional[str] = None,
        generate_image: bool = False,
        analyze_photo: bool = False,
    ) -> ContentGeneratorResult:

        # Map Python flags → n8n option_flag + generate
        if generate_image:
            option_flag = 3
            # image-to-image when a reference image is supplied, otherwise text-to-image
            generate = 2 if image_url else 1
            mode = "generate_image"
        elif analyze_photo:
            option_flag = 2
            generate = 1
            mode = "analyze_photo"
        else:
            option_flag = 1
            generate = 1
            mode = "default"

        payload = {
            "business_id": context.business_id,
            "option_flag": option_flag,
            "generate": generate,
            "user_prompt": user_prompt or "",
            "image_url": image_url or "",
        }

        timeout = 300 if generate_image else 180
        #  https://flow.lumeniq.cloud/webhook/content-generator
        def _call() -> Any:
            response = requests.post("https://flow.lumeniq.cloud/webhook/content-generator", json=payload, timeout=timeout)
            response.raise_for_status()
            return response.json()

        try:
            result = await asyncio.to_thread(_call)
            return self._parse_response(context.business_id, mode, option_flag, result)

        except Exception as e:
            return ContentGeneratorResult(
                business_id=context.business_id,
                success=False,
                mode=mode,
                content_response=f"Content generation failed: {e}",
                generated_at=datetime.now(timezone.utc),
            )

    # ------------------------------------------------------------------
    #  Parse the n8n response into ContentGeneratorResult by mode
    # ------------------------------------------------------------------
    def _parse_response(
        self,
        business_id: str,
        mode: str,
        option_flag: int,
        result: dict,
    ) -> ContentGeneratorResult:

        # ── Mode 1: Content Strategy ──────────────────────────────────
        # n8n returns the LLM output directly as the response body
        if option_flag == 1:
            photo_data = result.get("photo") or {}
            photo = PhotoDetails(
                angle=photo_data.get("angle", ""),
                composition=photo_data.get("composition"),
                lighting=photo_data.get("lighting"),
                props=photo_data.get("props"),
                color_palette=photo_data.get("color_palette"),
                instructions=photo_data.get("instructions", ""),
            ) if photo_data else None

            caption_data = result.get("caption") or {}
            caption = CaptionDetails(
                hook=caption_data.get("hook"),
                body=caption_data.get("body"),
                cta=caption_data.get("cta"),
                full_caption=caption_data.get("full_caption"),
                emoji=caption_data.get("emoji"),
            ) if caption_data else None

            hashtag_data = result.get("hashtags") or {}
            hashtags = HashtagDetails(
                local=hashtag_data.get("local"),
                niche=hashtag_data.get("niche"),
                all=hashtag_data.get("all"),
            ) if hashtag_data else None

            post_data = result.get("post_settings") or {}
            post_settings = PostSettings(
                best_format=post_data.get("best_format"),
                best_time_to_post=post_data.get("best_time_to_post"),
                platform_fit=post_data.get("platform_fit"),
            ) if post_data else None

            return ContentGeneratorResult(
                business_id=business_id,
                success=True,
                mode=mode,
                photo=photo,
                caption=caption,
                hashtags=hashtags,
                post_settings=post_settings,
                generated_at=datetime.now(timezone.utc),
            )

        # ── Mode 2: Image Analysis ────────────────────────────────────
        # n8n returns raw GPT-4o JSON: score, whatIsWorking, improvements,
        # bestTimeToPost, suggestedCaption, hashtags
        if option_flag == 2:
            return ContentGeneratorResult(
                business_id=business_id,
                success=True,
                mode=mode,
                photo_analysis=json.dumps(result),
                caption=result.get("suggestedCaption"),
                hashtags=result.get("hashtags"),
                best_posting_time=result.get("bestTimeToPost"),
                generated_at=datetime.now(timezone.utc),
            )

        # ── Mode 3: Image Generation (text-to-image or image-to-image) ─
        # n8n returns: { success, mode, data: { image_url, cost_time, task_id } }
        if option_flag == 3:
            data = result.get("data") or {}
            success = result.get("success", False)
            error_msg = result.get("error") if not success else None
            return ContentGeneratorResult(
                business_id=business_id,
                success=bool(success),
                mode=mode,
                image_url=data.get("image_url"),
                content_response=error_msg,
                generated_at=datetime.now(timezone.utc),
            )

        # Fallback (should never hit)
        return ContentGeneratorResult(
            business_id=business_id,
            success=False,
            mode=mode,
            content_response=f"Unrecognised option_flag: {option_flag}",
            generated_at=datetime.now(timezone.utc),
        )
