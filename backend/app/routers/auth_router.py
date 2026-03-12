# backend/app/routers/auth_router.py
# REST роуты: POST /auth/register, POST /auth/login, GET /auth/me, PATCH /auth/me

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User
from app.auth.auth import (
    hash_password, verify_password,
    create_access_token, get_current_user_required,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# ── DB dependency ─────────────────────────────────────────────────────────────

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# ── Схемы ─────────────────────────────────────────────────────────────────────

class RegisterIn(BaseModel):
    name:     str        = Field(min_length=2, max_length=100)
    email:    EmailStr
    password: str        = Field(min_length=8, max_length=100)


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
    avatar:     str | None
    bio:        str | None
    created_at: str | None

    class Config:
        from_attributes = True


class AuthOut(BaseModel):
    token: str
    user:  UserOut

# ── Роуты ─────────────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthOut)
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    # Проверяем дубликат email
    existing = (await db.execute(
        select(User).where(User.email == body.email)
    )).scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=body.name,
        email=body.email,
        password=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id)
    return AuthOut(
        token=token,
        user=UserOut(
            id=user.id, name=user.name, email=user.email,
            avatar=user.avatar, bio=user.bio,
            created_at=str(user.created_at),
        ),
    )


@router.post("/login", response_model=AuthOut)
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    user = (await db.execute(
        select(User).where(User.email == body.email)
    )).scalar_one_or_none()

    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return AuthOut(
        token=token,
        user=UserOut(
            id=user.id, name=user.name, email=user.email,
            avatar=user.avatar, bio=user.bio,
            created_at=str(user.created_at),
        ),
    )


@router.get("/me", response_model=UserOut)
async def get_me(
    user_id: int = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    user = (await db.execute(
        select(User).where(User.id == user_id)
    )).scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserOut(
        id=user.id, name=user.name, email=user.email,
        avatar=user.avatar, bio=user.bio,
        created_at=str(user.created_at),
    )


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: UpdateProfileIn,
    user_id: int = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    user = (await db.execute(
        select(User).where(User.id == user_id)
    )).scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.name   is not None: user.name   = body.name
    if body.bio    is not None: user.bio    = body.bio
    if body.avatar is not None: user.avatar = body.avatar

    await db.commit()
    await db.refresh(user)

    return UserOut(
        id=user.id, name=user.name, email=user.email,
        avatar=user.avatar, bio=user.bio,
        created_at=str(user.created_at),
    )