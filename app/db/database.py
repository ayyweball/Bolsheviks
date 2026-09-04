from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# SQLAlchemy engine with connection pool pre-ping to detect dropped connections
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

Base = declarative_base()
