from typing import Optional
from datetime import datetime
from app.db.supabase_client import supabase
from app.schemas.business_context import check_utc


def create_scheduled_post(
    business_id: str,
    caption: str,
    hashtags: list,
    scheduled_at: Optional[str] = None,  # ISO 8601 string — normalized to UTC
    media_type: Optional[str] = None,
    reel_video_url: Optional[str] = None,
    image_url: Optional[str] = None,
    status: str = "scheduled",
) -> list:
    """
    Inserts a new post into calendar_posts for n8n to pick up and publish later.

    media_type: "REELS" for video reels, "IMAGE" for image posts
    reel_video_url: required if media_type is "REELS"
    image_url:      required if media_type is "IMAGE"

    n8n determines media type by checking which key exists:
        { "reel_video_url": "..." }  ->  Reel
        { "url": "..." }            ->  Image
    """
    utc_scheduled_at = (
        check_utc(datetime.fromisoformat(scheduled_at)).isoformat()
        if scheduled_at
        else None
    )

    if status == "draft":
        media_payload = {}
    elif media_type == "REELS":
        if not reel_video_url:
            raise ValueError("reel_video_url is required for REELS")
        media_payload = {"reel_video_url": reel_video_url}
    elif media_type == "IMAGE":
        if not image_url:
            raise ValueError("image_url is required for IMAGE posts")
        media_payload = {"url": image_url}
    else:
        raise ValueError(f"Unsupported media_type: '{media_type}'. Must be 'REELS' or 'IMAGE'.")

    data = {
        "business_id": business_id,
        "caption": caption,
        "media": media_payload,
        "hashtags": hashtags,
        "scheduled_at": utc_scheduled_at,
        "status": status,  # n8n watches for scheduled status only
    }

    response = supabase.table("calendar_posts").insert(data).execute()
    return response.data


def reschedule_post(post_id: str, new_scheduled_at: str) -> list:
    """Changes the scheduled time and resets status to 'scheduled' so n8n picks it up again."""
    utc_scheduled_at = check_utc(datetime.fromisoformat(new_scheduled_at)).isoformat()
    data = {
        "scheduled_at": utc_scheduled_at,
        "status": "scheduled",  # Reset in case it previously failed
    }
    response = (
        supabase.table("calendar_posts")
        .update(data)
        .eq("id", post_id)
        .execute()
    )
    return response.data


def cancel_post(post_id: str) -> list:
    """Sets post status to 'draft' so n8n ignores it. (Enum has no 'canceled', so draft hides it.)"""
    response = (
        supabase.table("calendar_posts")
        .update({"status": "draft"})
        .eq("id", post_id)
        .execute()
    )
    return response.data


def get_latest_content_idea(business_id: str) -> Optional[dict]:
    """
    Fetches the most recently created content idea for a business.
    Used by SchedulerAgent to pull caption, hashtags, and image_url
    when the manager doesn't pass them explicitly.
    """
    response = (
        supabase.table("content_ideas")
        .select("*")
        .eq("business_id", business_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None


def get_latest_scheduled_post(business_id: str) -> Optional[dict]:
    """
    Fetches the most recently created scheduled post for a business.
    Used by SchedulerAgent to get post_id for reschedule/cancel
    when the manager doesn't pass it explicitly.
    """
    response = (
        supabase.table("calendar_posts")
        .select("*")
        .eq("business_id", business_id)
        .eq("status", "scheduled")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None
