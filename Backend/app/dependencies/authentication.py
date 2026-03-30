from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.exceptions import UnauthorizedError
from app.core.security import decode_token, extract_user_id_from_token

bearer_scheme = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """Validates the Supabase JWT locally (no outbound network call) and returns
    the authenticated user's UUID from the ``sub`` claim.

    Local verification is cryptographically equivalent to calling
    admin_client.auth.get_user() but is instantaneous and does not depend on
    Supabase being reachable. JWT_SECRET_KEY in .env must match the project's
    JWT secret from Supabase Dashboard → Settings → API → JWT Settings.
    """
    try:
        return extract_user_id_from_token(credentials.credentials)
    except ValueError as error:
        raise UnauthorizedError(f"Token validation failed: {error}") from error


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Decodes the Supabase JWT locally and returns id + email + metadata.
    Falls back gracefully if optional claims are absent.
    """
    try:
        payload = decode_token(credentials.credentials)
        return {
            "id": str(payload.get("sub", "")),
            "email": payload.get("email", ""),
            "user_metadata": payload.get("user_metadata", {}),
        }
    except ValueError as error:
        raise UnauthorizedError(f"Token validation failed: {error}") from error
