import logging
import uuid

from fastapi import APIRouter, Depends, Query, UploadFile, File
from app.models.media import BusinessMedia, BusinessMediaCreate
from app.services.media_service import MediaService, get_media_service
from app.dependencies.authentication import get_current_user_id

logger = logging.getLogger("lumeniq.media")
router = APIRouter(prefix="/businesses/{business_id}/media", tags=["Media"])


@router.get("/", response_model=list[BusinessMedia])
async def list_media(
    business_id: str,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    user_id: str = Depends(get_current_user_id),
    media_service: MediaService = Depends(get_media_service),
):
    return media_service.list_media(business_id, limit, offset)


# NOTE: GET /{media_id} has no frontend caller — the frontend works from
# the list. Re-enable when a media-detail view is added.

# @router.get("/{media_id}", response_model=BusinessMedia)
# async def get_media(
#     business_id: str,
#     media_id: str,
#     user_id: str = Depends(get_current_user_id),
#     media_service: MediaService = Depends(get_media_service),
# ):
#     return media_service.get_media(media_id)


@router.post("/upload", response_model=BusinessMedia, status_code=201)
async def upload_media(
    business_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    media_service: MediaService = Depends(get_media_service),
):
    logger.info(
        "Upload request: business=%s, filename=%s, content_type=%s, user=%s",
        business_id, file.filename, file.content_type, user_id,
    )

    file_bytes = await file.read()
    file_extension = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
    storage_file_name = f"{uuid.uuid4()}.{file_extension}"

    public_url = media_service.upload_to_storage(
        business_id=business_id,
        file_path=storage_file_name,
        file_bytes=file_bytes,
        content_type=file.content_type or "application/octet-stream",
    )

    media_record = media_service.create_media_record(
        business_id=business_id,
        media_data=BusinessMediaCreate(
            file_url=public_url,
            file_name=file.filename,
            file_type=file.content_type,
        ),
    )

    return media_record


# NOTE: DELETE /{media_id} has no frontend caller yet.
# Re-enable when media-deletion UI is added to PhotoStoragePage.

# @router.delete("/{media_id}", status_code=204)
# async def delete_media(
#     business_id: str,
#     media_id: str,
#     user_id: str = Depends(get_current_user_id),
#     media_service: MediaService = Depends(get_media_service),
# ):
#     media_service.delete_media(media_id)
