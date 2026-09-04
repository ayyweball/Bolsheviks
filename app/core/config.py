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

    # CORS settings (comma-separated list of allowed origins)
    _cors_origins_env: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
    )

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
