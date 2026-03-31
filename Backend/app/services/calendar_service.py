from datetime import date, timedelta, datetime

from postgrest.exceptions import APIError
from supabase import Client

from app.database.supabase_admin import get_supabase_admin_client
from app.models.calendar import (
    ContentCalendarWeeklyView,
    CalendarPost,
    CalendarPostCreate,
    CalendarPostUpdate,
    PublishAttempt,
)
from app.core.exceptions import NotFoundError, ExternalServiceError, ValidationError
from app.services.storage_utils import resolve_media_urls


class CalendarService:

    def __init__(self):
        self.admin_client: Client = get_supabase_admin_client()
        self.calendar_table = "content_calendar_weekly_view"
        self.posts_table = "calendar_posts"
        self.attempts_table = "publish_attempts"

    def _get_or_create_weekly_calendar(
        self, business_id: str, scheduled_at: datetime | None = None
    ) -> str:
        """Return the UUID of the content_calendar_weekly_view row that covers
        the week containing ``scheduled_at`` (defaults to the current week).

        The calendar_posts table requires content_calendar_id NOT NULL, so every
        post must belong to a weekly calendar row. This method finds the existing
        row or creates one automatically so the frontend never has to know about
        this FK.
        """
        target_date = scheduled_at.date() if scheduled_at else date.today()
        # ISO week starts on Monday
        week_start = target_date - timedelta(days=target_date.weekday())

        try:
            response = (
                self.admin_client.table(self.calendar_table)
                .select("id")
                .eq("business_id", business_id)
                .eq("week_start_date", week_start.isoformat())
                .execute()
            )
            if response.data:
                return response.data[0]["id"]

            # No row for this week yet — create one
            insert_response = (
                self.admin_client.table(self.calendar_table)
                .insert({"business_id": business_id, "week_start_date": week_start.isoformat()})
                .execute()
            )
            return insert_response.data[0]["id"]
        except Exception as error:
            raise ExternalServiceError("Supabase", str(error)) from error

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
            insert_data = {"business_id": business_id, **post_data.model_dump(mode="json", exclude_none=True)}

            # calendar_posts.content_calendar_id is NOT NULL in the schema.
            # If the caller didn't supply one, resolve the correct weekly calendar
            # row automatically so the frontend never needs to manage this FK.
            if "content_calendar_id" not in insert_data:
                insert_data["content_calendar_id"] = self._get_or_create_weekly_calendar(
                    business_id, post_data.scheduled_at
                )

            response = (
                self.admin_client.table(self.posts_table)
                .insert(insert_data)
                .execute()
            )
            return self._resolve_post_media(CalendarPost(**response.data[0]))
        except ExternalServiceError:
            raise
        except APIError as error:
            if error.code in ("23514", "23502", "23505", "22P02"):
                raise ValidationError(
                    error.message or f"Database constraint error: {error.details}"
                ) from error
            raise ExternalServiceError("Supabase", str(error)) from error
        except Exception as error:
            raise ExternalServiceError("Supabase", str(error)) from error

    def update_calendar_post(self, post_id: str, updates: CalendarPostUpdate) -> CalendarPost:
        try:
            update_data = updates.model_dump(mode="json", exclude_unset=True)
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
        except APIError as error:
            # Check constraint violations (23514) and other client errors
            # should surface as 422, not 502
            if error.code in ("23514", "23502", "23505", "22P02"):
                raise ValidationError(
                    error.message or f"Database constraint error: {error.details}"
                ) from error
            raise ExternalServiceError("Supabase", str(error)) from error
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
