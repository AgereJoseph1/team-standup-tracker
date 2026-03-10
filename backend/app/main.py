from fastapi import FastAPI

from .config import get_settings
from .database import Base, engine
from .routers import auth, standups


settings = get_settings()

app = FastAPI(title=settings.app_name)


@app.on_event("startup")
async def on_startup() -> None:
    # For simplicity, use SQLAlchemy metadata create_all for now.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(standups.router)
