from datetime import datetime, date
from typing import Any
from pydantic import BaseModel

from app.models.enumerations import ScheduledPostStatus


class ContentCalendarWeeklyView(BaseModel):
    id: str
    business_id: str
    week_start_date: date
    meta: dict[str, Any] = {}
    created_at: datetime | None = None
    updated_at: datetime | None = None


class CalendarPostBase(BaseModel):
    caption: str | None = None
    hashtags: list[str] = []
    day_of_the_week: int | None = None


class CalendarPostCreate(CalendarPostBase):
    scheduled_at: datetime | None = None
    status: ScheduledPostStatus = ScheduledPostStatus.DRAFT
    media: list[str] = []
    """media is a list of public URLs pointing to uploaded images/videos."""


class CalendarPostUpdate(BaseModel):
    caption: str | None = None
    hashtags: list[str] | None = None
    scheduled_at: datetime | None = None
    status: ScheduledPostStatus | None = None
    media: list[str] | None = None
    """media is a list of public URLs pointing to uploaded images/videos."""
    day_of_the_week: int | None = None


class CalendarPost(CalendarPostBase):
    id: str
    business_id: str
    status: ScheduledPostStatus = ScheduledPostStatus.DRAFT
    scheduled_at: datetime | None = None
    approved_at: datetime | None = None
    media: list[str] = []
    """media is a list of public URLs pointing to uploaded images/videos.
    The frontend maps this field to ``images`` for display purposes."""
    publish_result: dict[str, Any] | None = None
    last_error: dict[str, Any] | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PublishAttempt(BaseModel):
    id: str
    calendar_post_id: str
    attempt_number: int = 1
    requested_at: datetime | None = None
    response: dict[str, Any] | None = None
    error: dict[str, Any] | None = None
    succeeded: bool = False
