"""FastAPI application entry point.

Run locally with:
    uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import UPLOADS_DIR, settings
from app.database import init_db
from app.routers import analytics, detections, health, scans

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


# Serve uploaded sonar images back to the frontend for overlay rendering.
app.mount("/storage/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.include_router(health.router)
app.include_router(scans.router)
app.include_router(detections.router)
app.include_router(analytics.router)


@app.get("/")
def root() -> dict:
    return {"service": settings.app_name, "docs": "/docs"}
