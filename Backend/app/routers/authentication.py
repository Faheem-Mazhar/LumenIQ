from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.models.user import (
    SignUpRequest,
    SignInRequest,
    TokenResponse,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordUpdateRequest,
    GoogleOAuthRequest,
)
from app.services.authentication_service import AuthenticationService, get_authentication_service

router = APIRouter(prefix="/auth", tags=["Authentication"])
bearer_scheme = HTTPBearer()


@router.post("/signup", response_model=TokenResponse)
async def sign_up(
    request_body: SignUpRequest,
    authentication_service: AuthenticationService = Depends(get_authentication_service),
):
    user_metadata = {}
    if request_body.first_name:
        user_metadata["first_name"] = request_body.first_name
    if request_body.last_name:
        user_metadata["last_name"] = request_body.last_name

    result = authentication_service.sign_up(
        email=request_body.email,
        password=request_body.password,
        user_metadata=user_metadata if user_metadata else None,
    )

    return TokenResponse(
        access_token=result["access_token"] or "",
        refresh_token=result["refresh_token"] or "",
        expires_in=3600,
    )


@router.post("/signin", response_model=TokenResponse)
async def sign_in(
    request_body: SignInRequest,
    authentication_service: AuthenticationService = Depends(get_authentication_service),
):
    result = authentication_service.sign_in(
        email=request_body.email,
        password=request_body.password,
    )

    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        expires_in=result["expires_in"],
    )


@router.post("/signout")
async def sign_out(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    authentication_service: AuthenticationService = Depends(get_authentication_service),
):
    authentication_service.sign_out(credentials.credentials)
    return {"message": "Successfully signed out"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request_body: RefreshTokenRequest,
    authentication_service: AuthenticationService = Depends(get_authentication_service),
):
    result = authentication_service.refresh_session(request_body.refresh_token)

    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        expires_in=result["expires_in"],
    )


@router.post("/oauth/google", response_model=TokenResponse)
async def sign_in_with_google(
    request_body: GoogleOAuthRequest,
    authentication_service: AuthenticationService = Depends(get_authentication_service),
):
    result = authentication_service.sign_in_with_google(id_token=request_body.id_token)

    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        expires_in=result["expires_in"],
    )


# NOTE: /password-reset and /password-update are not wired to any frontend UI yet.
# Re-enable these routes when the password-management flow is built.

# @router.post("/password-reset")
# async def request_password_reset(
#     request_body: PasswordResetRequest,
#     authentication_service: AuthenticationService = Depends(get_authentication_service),
# ):
#     authentication_service.request_password_reset(request_body.email)
#     return {"message": "Password reset email sent if the account exists"}


# @router.post("/password-update")
# async def update_password(
#     request_body: PasswordUpdateRequest,
#     credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
#     authentication_service: AuthenticationService = Depends(get_authentication_service),
# ):
#     authentication_service.update_password(credentials.credentials, request_body.new_password)
#     return {"message": "Password updated successfully"}
