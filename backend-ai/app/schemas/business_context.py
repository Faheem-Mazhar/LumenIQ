from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta


def check_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def check_within_range(
    ts: Optional[datetime],
    max_age_days: float,
    *,
    now: Optional[datetime] = None,) -> bool:
    """True if ts is set and not older than max_age_days relative to now (UTC)."""
    if ts is None:
        return False
    effective_now = now if now is not None else datetime.now(timezone.utc)
    ts_utc = check_utc(ts)
    now_utc = check_utc(effective_now)
    return now_utc - ts_utc <= timedelta(days=max_age_days)


class BusinessContext(BaseModel):
    user_id: str        # Which user is logged in the LumenIQ account
    business_id: str    # Which business of that user we're working on (one user can have many businesses)

    # Collected during onboarding (required) 
    # TODO_: once Supabase is connected, change these to required fields (remove Optional + None default)
    # These are only Optional now because chainlit_app.py creates an empty BusinessContext
    # before loading from DB. Once repo.get_business_context() is wired up properly,
    # these will always be populated from the frontend onboarding form/DB.
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    location: Optional[str] = None
    target_customers: Optional[str] = None

    # Collected during onboarding (optional) 
    instagram_handle: Optional[str] = None
    website: Optional[str] = None

    # Pipeline state flags (router uses these to skip completed steps) 
    has_hashtags: bool = False           # True once business profiler has run 
    has_top_posts: bool = False          # True once competitor list & posts have been scraped + ranked
    has_trend_summary: bool = False      # True once trend analysis is  complete
    has_content_plan: bool = False       # True once content generator has run 
    has_scheduled_posts: bool = False    # True once user has at least one scheduled post in calender

    # Freshness timestamps (for re-run efficiency) 
    hashtags_last_updated: Optional[datetime] = None
    posts_last_scraped: Optional[datetime] = None
    trends_last_updated: Optional[datetime] = None

    # Helper functions to calculate post and trend summaries age and check their validaity - Used in Router.py
    def are_posts_valid(self, max_age_days: float) -> bool:
        return check_within_range(self.posts_last_scraped, max_age_days)

    def are_trends_valid(self, max_age_days: float) -> bool:
        return check_within_range(self.trends_last_updated, max_age_days)
