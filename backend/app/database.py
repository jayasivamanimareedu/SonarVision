"""SQLite engine + session management via SQLAlchemy."""
from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

# check_same_thread=False is required for SQLite used across FastAPI threads.
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all ORM models."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a scoped DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables if they do not exist."""
    # Import models so they are registered on the metadata before create_all.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Lightweight SQLite migration for projects upgraded from earlier phases.
    # create_all() does not add columns to an existing table.
    if engine.dialect.name == "sqlite":
        existing = {col["name"] for col in inspect(engine).get_columns("detections")}
        additions = {
            "latitude": "FLOAT",
            "longitude": "FLOAT",
            "bbox_width_px": "FLOAT",
            "bbox_height_px": "FLOAT",
        }
        with engine.begin() as conn:
            for column, sql_type in additions.items():
                if column not in existing:
                    conn.execute(text(f"ALTER TABLE detections ADD COLUMN {column} {sql_type}"))
