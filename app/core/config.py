import os
from functools import lru_cache
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Locate project root and load .env
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"
if ENV_FILE.exists():
    load_dotenv(dotenv_path=ENV_FILE)
else:
    load_dotenv()


class Settings:
    PROJECT_NAME: str = "India MSME Scheme Recommendation Platform API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/goi_schemes",
    )

    # JWT Authentication
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "development_jwt_secret_key_msme_recommendation_platform_2026_super_secure_key",
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    # CORS settings (comma-separated list of allowed origins)
    _cors_origins_env: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
    )

    # Server-Side Anthropic Claude API Key for Qualitative Market Intelligence
    ANTHROPIC_API_KEY: str = os.getenv(
        "ANTHROPIC_API_KEY",
        ""
    )
    if not ANTHROPIC_API_KEY:
        # Check local frontend .env if present during unified local development
        _fe_env = BASE_DIR / "frontend" / ".env"
        if _fe_env.exists():
            load_dotenv(dotenv_path=_fe_env, override=False)
            ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

    @property
    def CORS_ORIGINS(self) -> List[str]:
        if not self._cors_origins_env:
            return ["*"]
        return [origin.strip() for origin in self._cors_origins_env.split(",") if origin.strip()]

    def __repr__(self) -> str:
        # Prevent credential leakage
        return f"<Settings project={self.PROJECT_NAME} env={self.ENVIRONMENT}>"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
