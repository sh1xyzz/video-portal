# backend/app/main.py

import strawberry
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from app.database import engine, Base, AsyncSessionLocal
from app.graphql.queries import Query
from app.graphql.mutations import Mutation
from app.auth.auth import decode_token
from app.routers.auth_router  import router as auth_router
from app.routers.coins_router import router as coins_router  # ← NEW

# Импортируем все модели
from app.models import course, lesson, testimonial, user  # noqa
from app.models import coins  # noqa  ← NEW


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


async def get_context(request: Request) -> dict:
    db = AsyncSessionLocal()
    current_user = None
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        user_id = decode_token(token)
        if user_id:
            from sqlalchemy import select
            from app.models.user import User as UserModel
            result = await db.execute(select(UserModel).where(UserModel.id == user_id))
            current_user = result.scalar_one_or_none()
    return {"db": db, "user": current_user}


schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_router = GraphQLRouter(schema, context_getter=get_context)

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(coins_router)   # ← NEW
app.include_router(graphql_router, prefix="/graphql")


@app.get("/")
async def root():
    return {"status": "ok"}