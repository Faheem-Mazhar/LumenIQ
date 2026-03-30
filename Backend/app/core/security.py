from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any

import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError, PyJWKClientError
from passlib.context import CryptContext

from app.core.configuration import settings

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return password_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    additional_claims: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.access_token_expire_minutes)

    expire_at = datetime.now(timezone.utc) + expires_delta
    payload: dict[str, Any] = {"sub": subject, "exp": expire_at, "type": "access"}

    if additional_claims:
        payload.update(additional_claims)

    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(
    subject: str,
    expires_delta: timedelta | None = None,
) -> str:
    if expires_delta is None:
        expires_delta = timedelta(days=settings.refresh_token_expire_days)

    expire_at = datetime.now(timezone.utc) + expires_delta
    payload = {"sub": subject, "exp": expire_at, "type": "refresh"}

    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


@lru_cache(maxsize=1)
def _get_jwks_client() -> PyJWKClient:
    """Returns a cached JWKS client pointed at Supabase's public key endpoint.

    PyJWKClient fetches the key set on first use and caches it in memory.
    It re-fetches automatically when it encounters an unknown ``kid``, which
    only happens when Supabase rotates its signing key (very infrequent).
    """
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url)


def decode_token(token: str) -> dict[str, Any]:
    """Verify and decode a JWT issued by Supabase (or internally by this app).

    Supabase now issues ES256 (ECDSA) tokens signed with an asymmetric key
    pair. The public key is fetched from Supabase's JWKS endpoint and cached
    in memory — no per-request network call is needed after the first fetch.

    Legacy HS256 tokens (e.g. any tokens this app itself creates) fall back
    to HMAC verification using ``settings.jwt_secret_key``.

    In both cases ``aud`` verification is skipped because Supabase sets
    ``aud="authenticated"`` which PyJWT rejects unless explicitly passed.
    Signature and expiry are still fully enforced.
    """
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg in ("ES256", "ES384", "RS256", "RS384"):
            # Asymmetric token from Supabase — verify with JWKS public key
            signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
            payload: dict[str, Any] = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                options={"verify_aud": False},
            )
        else:
            # Symmetric HS256 token (internally issued)
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )

        return payload

    except (InvalidTokenError, PyJWKClientError) as error:
        raise ValueError(f"Invalid token: {error}") from error


def extract_user_id_from_token(token: str) -> str:
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise ValueError("Token does not contain a subject claim")
    return str(user_id)
