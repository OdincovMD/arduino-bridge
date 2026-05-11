from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.api.deps import get_current_user
from app.db.session import get_db_session
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.models.user import User
from app.services.auth import authenticate_user


router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_db_session)) -> TokenResponse:
    user = await authenticate_user(session, payload.email, payload.password)
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)
