import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db

logger = logging.getLogger("app.api.v1.health")

router = APIRouter(tags=["Health"])


@router.get("/health", status_code=status.HTTP_200_OK)
def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Health check endpoint that verifies database connectivity and returns scheme count."""
    try:
        # Perform lightweight read-only connectivity check
        schemes_count = db.execute(text("SELECT COUNT(*) FROM schemes;")).scalar()
        return {
            "status": "healthy",
            "database": "connected",
            "schemes_count": schemes_count,
            "environment": settings.ENVIRONMENT,
            "version": settings.VERSION,
        }
    except Exception as e:
        logger.error(f"Health check database failure: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "detail": "Could not connect to database",
                "version": settings.VERSION,
            },
        )
