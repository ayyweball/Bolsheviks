from fastapi import APIRouter
from app.api.v1.schemes import router as schemes_router
from app.api.v1.health import router as health_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router)
api_v1_router.include_router(schemes_router)

__all__ = ["api_v1_router"]
