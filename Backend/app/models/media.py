from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class MediaSource(str, Enum):
    user = "user"
    ai = "ai"


class BusinessMediaBase(BaseModel):
    file_name: str | None = None
    file_type: str | None = None
    tags: list[str] = []
    source: MediaSource = MediaSource.user


class BusinessMediaCreate(BusinessMediaBase):
    file_url: str


class BusinessMedia(BusinessMediaBase):
    id: str
    business_id: str
    file_url: str
    file_size: int | None = None
    created_at: datetime | None = None
