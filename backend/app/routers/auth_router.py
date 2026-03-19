# backend/app/routers/auth_router.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.auth.auth import hash_password, verify_password, create_access_token, decode_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Auth dependency ───────────────────────────────────────────────────────────

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = decode_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if getattr(user, "is_banned", False):
        raise HTTPException(status_code=403, detail="Your account has been banned")
    return user


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterIn(BaseModel):
    name:     str      = Field(min_length=2, max_length=100)
    email:    EmailStr
    password: str      = Field(min_length=6, max_length=100)
    role:     str      = "student"


class LoginIn(BaseModel):
    email:    EmailStr
    password: str


class UpdateProfileIn(BaseModel):
    name:   str | None = None
    bio:    str | None = None
    avatar: str | None = None


class UserOut(BaseModel):
    id:         int
    name:       str
    email:      str
    role:       str
    avatar:     str | None = None
    bio:        str | None = None
    is_banned:  bool       = False
    created_at: str | None = None

    class Config:
        from_attributes = True


class AuthOut(BaseModel):
    token: str
    user:  UserOut


# ── Helper ────────────────────────────────────────────────────────────────────

def _user_out(u: User) -> UserOut:
    return UserOut(
        id         = u.id,
        name       = u.name,
        email      = u.email,
        role       = u.role if isinstance(u.role, str) else u.role.value,
        avatar     = u.avatar,
        bio        = getattr(u, "bio", None),
        is_banned  = getattr(u, "is_banned", False),
        created_at = str(u.created_at) if u.created_at else None,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthOut, status_code=201)
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(
        select(User).where(User.email == body.email.lower())
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    allowed_roles = {"student", "teacher"}
    role = body.role if body.role in allowed_roles else "student"

    user = User(
        name            = body.name.strip(),
        email           = body.email.lower(),
        hashed_password = hash_password(body.password),
        role            = role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    from app.models.coins import UserCoins
    db.add(UserCoins(user_id=user.id, balance=100, total_ever=100))
    await db.commit()

    return AuthOut(token=create_access_token(user.id), user=_user_out(user))


@router.post("/login", response_model=AuthOut)
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    user = (await db.execute(
        select(User).where(User.email == body.email.lower())
        # ✅ убран User.is_active — поля нет в модели
    )).scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ✅ проверка бана — забаненный не может войти
    if getattr(user, "is_banned", False):
        raise HTTPException(status_code=403, detail="Your account has been banned")

    return AuthOut(token=create_access_token(user.id), user=_user_out(user))


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return _user_out(user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: UpdateProfileIn,
    user: User = Depends(get_current_user),
    db:   AsyncSession = Depends(get_db),
):
    if body.name   is not None: user.name   = body.name.strip()
    if body.bio    is not None and hasattr(user, "bio"):   user.bio    = body.bio
    if body.avatar is not None: user.avatar = body.avatar
    await db.commit()
    await db.refresh(user)
    return _user_out(user)