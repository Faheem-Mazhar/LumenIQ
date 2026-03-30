import logging
from datetime import date

from supabase import Client

from app.database.supabase_admin import get_supabase_admin_client
from app.models.calendar import (
    ContentCalendarWeeklyView,
    CalendarPost,
    CalendarPostCreate,
    CalendarPostUpdate,
    PublishAttempt,
)
from app.core.exceptions import NotFoundError, ExternalServiceError
from app.services.storage_utils import resolve_media_urls

logger = logging.getLogger("lumeniq.calendar")


class CalendarService:

    def __init__(self):
        self.admin_client: Client = get_supabase_admin_client()
        self.calendar_table = "content_calendar_weekly_view"
        self.posts_table = "calendar_posts"
        self.attempts_table = "publish_attempts"

    def _resolve_post_media(self, post: CalendarPost) -> CalendarPost:
        if post.media:
            post.media = resolve_media_urls(self.admin_client, post.media)
        return post

    def list_weekly_calendars(
        self, business_id: str, week_start: date | None = None
    ) -> list[ContentCalendarWeeklyView]:
        try:
            query = (
                self.admin_client.table(self.calendar_table)
                .select("*")
                .eq("business_id", business_id)
            )
            if week_start:
                query = query.eq("week_start_date", week_start.isoformat())

            response = query.order("week_start_date", desc=True).execute()
            return [ContentCalendarWeeklyView(**row) for row in response.data]
        except Exception as error:
            raise ExternalServiceError("Supabase", str(error)) from error

    def get_weekly_calendar(self, calendar_id: str) -> ContentCalendarWeeklyView:
        try:
            response = (
                self.admin_client.table(self.calendar_table)
                .select("*")
                .eq("id", calendar_id)
                .single()
                .execute()
            )
            return ContentCalendarWeeklyView(**response.data)
        except Exception as error:
            if "No rows found" in str(error) or "0 rows" in str(error):
                raise NotFoundError("Weekly calendar", calendar_id) from error
            raise ExternalServiceError("Supabase", str(error)) from error

    def list_calendar_posts(
        self, business_id: str, calendar_id: str | None = None, status: str | None = None
    ) -> list[CalendarPost]:
        try:
            query = (
                self.admin_client.table(self.posts_table)
                .select("*")
                .eq("business_id", business_id)
            )
            if calendar_id:
                query = query.eq("content_calendar_id", calendar_id)
            if status:
                query = query.eq("status", status)

            response = query.order("scheduled_at", desc=False).execute()
            return [self._resolve_post_media(CalendarPost(**row)) for row in response.data]
        except Exception as error:
            raise ExternalServiceError("Supabase", str(error)) from error

    def get_calendar_post(self, post_id: str) -> CalendarPost:
        try:
            response = (
                self.admin_client.table(self.posts_table)
                .select("*")
                .eq("id", post_id)
                .single()
                .execute()
            )
            return self._resolve_post_media(CalendarPost(**response.data))
        except Exception as error:
            if "No rows found" in str(error) or "0 rows" in str(error):
                raise NotFoundError("Calendar post", post_id) from error
            raise ExternalServiceError("Supabase", str(error)) from error

    def create_calendar_post(self, business_id: str, post_data: CalendarPostCreate) -> CalendarPost:
        try:
            insert_data = {"business_id": business_id, **post_data.model_dump(exclude_none=True)}
            logger.debug("Inserting calendar post: %s", insert_data)
            response = (
                self.admin_client.table(self.posts_table)
                .insert(insert_data)
                .execute()
            )
            return self._resolve_post_media(CalendarPost(**response.data[0]))
        except Exception as error:
            logger.error("Failed to create calendar post: %s", error)
            raise ExternalServiceError("Supabase", str(error)) from error

    def update_calendar_post(self, post_id: str, updates: CalendarPostUpdate) -> CalendarPost:
        try:
            update_data = updates.model_dump(exclude_unset=True)
            response = (
                self.admin_client.table(self.posts_table)
                .update(update_data)
                .eq("id", post_id)
                .execute()
            )
            if not response.data:
                raise NotFoundError("Calendar post", post_id)
            return self._resolve_post_media(CalendarPost(**response.data[0]))
        except NotFoundError:
            raise
        except Exception as error:
            raise ExternalServiceError("Supabase", str(error)) from error

    def delete_calendar_post(self, post_id: str) -> None:
        try:
            self.admin_client.table(self.posts_table).delete().eq("id", post_id).execute()
        except Exception as error:
            raise ExternalServiceError("Supabase", str(error)) from error

    def list_publish_attempts(self, calendar_post_id: str) -> list[PublishAttempt]:
        try:
            response = (
                self.admin_client.table(self.attempts_table)
                .select("*")
                .eq("calendar_post_id", calendar_post_id)
                .order("attempt_no", desc=False)
                .execute()
            )
            return [PublishAttempt(**row) for row in response.data]
        except Exception as error:
            raise ExternalServiceError("Supabase", str(error)) from error


def get_calendar_service() -> CalendarService:
    return CalendarService()
