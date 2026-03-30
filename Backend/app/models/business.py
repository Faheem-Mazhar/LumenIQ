from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field

# Fields stored in `profile_json` rather than top-level table columns.
PROFILE_JSON_FIELDS: frozenset[str] = frozenset(
    {
        "website_url",
        "ideal_customer",
        "description",
        "brand_color",
        "b2b_or_b2c",
        "target_location",
        "products_services",
        "industry_niche",
    }
)


class BusinessBase(BaseModel):
    name: str | None = None
    business_type: str | None = None
    city: str | None = None
    country: str | None = None
    instagram_handle: str | None = None
    website_url: str | None = None
    ideal_customer: str | None = None
    description: str | None = None
    brand_color: str | None = None
    b2b_or_b2c: str | None = None
    target_location: str | None = None
    products_services: str | None = None
    industry_niche: str | None = None

    def split_for_db(self) -> tuple[dict[str, Any], dict[str, Any]]:
        """Split model data into (column_data, profile_json_data)."""
        all_data = self.model_dump(exclude_none=True)
        profile_data = {k: all_data.pop(k) for k in list(all_data) if k in PROFILE_JSON_FIELDS}
        return all_data, profile_data


class BusinessCreate(BusinessBase):
    name: str


class BusinessUpdate(BusinessBase):
    pass


class Business(BusinessBase):
    id: str
    user_id: str
    profile_json: dict[str, Any] = {}
    ig_user_id: str | None = None
    ig_business_account_id: str | None = None
    fb_page_id: str | None = None
    access_token: str | None = None
    token_expires_at: datetime | None = None
    refresh_token: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @classmethod
    def from_db_row(cls, row: dict[str, Any]) -> "Business":
        """Construct a Business, merging profile_json fields into top-level attrs."""
        profile = row.get("profile_json") or {}
        merged = {**row}
        for field in PROFILE_JSON_FIELDS:
            if field not in merged or merged[field] is None:
                merged[field] = profile.get(field)
        return cls(**merged)


class BusinessSummary(BaseModel):
    id: str
    name: str | None = None
    business_type: str | None = None
    city: str | None = None
    country: str | None = None
    instagram_handle: str | None = None
    description: str | None = None
    brand_color: str | None = None
    profile_json: dict[str, Any] | None = Field(default=None, exclude=True)

    @classmethod
    def from_db_row(cls, row: dict[str, Any]) -> "BusinessSummary":
        profile = row.get("profile_json") or {}
        merged = {**row}
        merged.setdefault("description", profile.get("description"))
        merged.setdefault("brand_color", profile.get("brand_color"))
        return cls(**merged)
