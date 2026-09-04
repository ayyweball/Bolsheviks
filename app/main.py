import logging
from typing import Dict, Any
from fastapi import FastAPI, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import setup_cors
from app.core.exceptions import register_exception_handlers
from app.db.session import get_db
from app.api.v1 import api_v1_router
from app.api.v1.schemes import router as legacy_schemes_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("app.main")

# FastAPI application initialization
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-ready backend API and deterministic eligibility engine for Indian Government and MSME schemes.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Setup middleware and exception handlers
setup_cors(app)
register_exception_handlers(app)


@app.get("/", status_code=status.HTTP_200_OK, tags=["Root"])
def root() -> Dict[str, Any]:
    """Root status endpoint."""
    return {
        "message": "Backend functioning well",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
    }


@app.get("/health", status_code=status.HTTP_200_OK, tags=["Health"])
def root_health(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Direct root health endpoint checking database connectivity."""
    try:
        schemes_count = db.execute(text("SELECT COUNT(*) FROM schemes;")).scalar()
        return {
            "status": "healthy",
            "database": "connected",
            "schemes_count": schemes_count,
            "version": settings.VERSION,
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "detail": "Database connection error",
            "version": settings.VERSION,
        }


# Mount versioned API routes under /api/v1
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

# Mount legacy prefix /api/schemes for backwards compatibility
app.include_router(legacy_schemes_router, prefix="/api")
