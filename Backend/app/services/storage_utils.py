import logging
from urllib.parse import urlparse

from supabase import Client

logger = logging.getLogger("lumeniq.storage")

BUCKET_NAME = "business_media"
SIGNED_URL_EXPIRY = 3600


def extract_storage_path(file_url: str, bucket_name: str = BUCKET_NAME) -> str | None:
    """Extract the relative storage path from a Supabase public or signed URL."""
    parsed = urlparse(file_url)
    path = parsed.path

    for kind in ("public", "sign"):
        prefix = f"/storage/v1/object/{kind}/{bucket_name}/"
        if path.startswith(prefix):
            return path[len(prefix):]

    marker = f"/object/public/{bucket_name}/"
    if marker in file_url:
        return file_url.split(marker, 1)[1].split("?", 1)[0]

    return None


def resolve_signed_url(
    admin_client: Client,
    file_url: str,
    bucket_name: str = BUCKET_NAME,
    expires_in: int = SIGNED_URL_EXPIRY,
) -> str:
    """Return a fresh signed URL for the given Supabase storage URL.

    Falls back to the original URL if the path cannot be extracted or signing fails.
    """
    storage_path = extract_storage_path(file_url, bucket_name)
    if not storage_path:
        return file_url

    try:
        result = admin_client.storage.from_(bucket_name).create_signed_url(
            storage_path, expires_in
        )
        signed = result.get("signedURL") or result.get("signedUrl") or ""
        return signed or file_url
    except Exception as exc:
        logger.warning("Signed URL generation failed for %s: %s", storage_path, exc)
        return file_url


def resolve_media_urls(
    admin_client: Client,
    urls: list[str],
    bucket_name: str = BUCKET_NAME,
    expires_in: int = SIGNED_URL_EXPIRY,
) -> list[str]:
    """Resolve a list of Supabase storage URLs to signed URLs."""
    if not urls:
        return urls
    return [resolve_signed_url(admin_client, u, bucket_name, expires_in) for u in urls]
