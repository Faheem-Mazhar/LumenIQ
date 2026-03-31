from supabase import Client

from app.database.supabase_admin import get_supabase_admin_client
from app.models.media import BusinessMedia, BusinessMediaCreate
from app.core.exceptions import NotFoundError, ExternalServiceError
from app.services.storage_utils import resolve_signed_url, BUCKET_NAME


class MediaService:

    def __init__(self):
        self.admin_client: Client = get_supabase_admin_client()
        self.table_name = "business_media"

    def _with_signed_url(self, media: BusinessMedia) -> BusinessMedia:
        media.file_url = resolve_signed_url(self.admin_client, media.file_url)
        return media

    def list_media(self, business_id: str, limit: int = 50, offset: int = 0) -> list[BusinessMedia]:
        try:
            response = (
                self.admin_client.table(self.table_name)
                .select("*")
                .eq("business_id", business_id)
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            media_list = [BusinessMedia(**row) for row in response.data]
            return [self._with_signed_url(m) for m in media_list]
        except Exception as error:
            raise ExternalServiceError("Supabase", str(error)) from error

    def get_media(self, media_id: str) -> BusinessMedia:
        try:
            response = (
                self.admin_client.table(self.table_name)
                .select("*")
                .eq("id", media_id)
                .single()
                .execute()
            )
            media = BusinessMedia(**response.data)
            return self._with_signed_url(media)
        except Exception as error:
            if "No rows found" in str(error) or "0 rows" in str(error):
                raise NotFoundError("Business media", media_id) from error
            raise ExternalServiceError("Supabase", str(error)) from error

    def create_media_record(self, business_id: str, media_data: BusinessMediaCreate) -> BusinessMedia:
        try:
            insert_data = {"business_id": business_id, **media_data.model_dump(exclude_none=True)}
            response = (
                self.admin_client.table(self.table_name)
                .insert(insert_data)
                .execute()
            )
            media = BusinessMedia(**response.data[0])
            return self._with_signed_url(media)
        except Exception as error:
            raise ExternalServiceError("Supabase", str(error)) from error

    def delete_media(self, media_id: str) -> None:
        try:
            self.admin_client.table(self.table_name).delete().eq("id", media_id).execute()
        except Exception as error:
            raise ExternalServiceError("Supabase", str(error)) from error

    def upload_to_storage(self, business_id: str, file_path: str, file_bytes: bytes, content_type: str) -> str:
        """Uploads a file to Supabase Storage and returns the public URL."""
        try:
            storage_path = f"{business_id}/{file_path}"
            self.admin_client.storage.from_(BUCKET_NAME).upload(
                storage_path,
                file_bytes,
                file_options={"content-type": content_type},
            )
            return self.admin_client.storage.from_(BUCKET_NAME).get_public_url(storage_path)
        except Exception as error:
            raise ExternalServiceError("Supabase Storage", str(error)) from error


def get_media_service() -> MediaService:
    return MediaService()
