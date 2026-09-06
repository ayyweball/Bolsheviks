"""
app/repositories/weather_cache_repository.py

Repository for PostgreSQL persistent cache of district-level weather observations and forecasts.
"""

from typing import Optional, Tuple, Dict, Any
from datetime import date, datetime, timedelta
import json
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.research_models import DistrictWeatherCache


class WeatherCacheRepository:
    """Repository for querying and updating persistent weather forecast cache."""

    @classmethod
    def get_cache(
        cls,
        db: Session,
        district_id: int,
        observation_date: date,
        cache_type: str = "FORECAST",
        max_age_hours: int = 24,
    ) -> Tuple[Optional[DistrictWeatherCache], bool]:
        """
        Fetch cache entry by district_id, observation_date, and cache_type.
        Returns: (cache_record, is_fresh)
        """
        record = (
            db.query(DistrictWeatherCache)
            .filter(
                DistrictWeatherCache.district_id == district_id,
                DistrictWeatherCache.observation_date == observation_date,
                DistrictWeatherCache.cache_type == cache_type,
            )
            .first()
        )
        if not record:
            return None, False

        # Freshness calculation based on fetched_at
        is_fresh = False
        if record.fetched_at:
            age = datetime.utcnow() - record.fetched_at
            is_fresh = age < timedelta(hours=max_age_hours)

        return record, is_fresh

    @classmethod
    def get_latest_cache(
        cls,
        db: Session,
        district_id: int,
        cache_type: str = "FORECAST",
    ) -> Optional[DistrictWeatherCache]:
        """Fetch the most recent cache entry for district_id, regardless of freshness (used for fallback)."""
        return (
            db.query(DistrictWeatherCache)
            .filter(
                DistrictWeatherCache.district_id == district_id,
                DistrictWeatherCache.cache_type == cache_type,
            )
            .order_by(DistrictWeatherCache.fetched_at.desc())
            .first()
        )

    @classmethod
    def save_cache(
        cls,
        db: Session,
        district_id: int,
        observation_date: date,
        cache_type: str,
        current_metrics: Optional[Dict[str, Any]],
        daily_forecast: Optional[Dict[str, Any]],
        source: str = "open-meteo",
        is_stale: bool = False,
    ) -> DistrictWeatherCache:
        """
        Upsert weather cache record.
        Uses ON CONFLICT (district_id, observation_date, cache_type) DO UPDATE.
        """
        upsert_sql = text("""
            INSERT INTO district_weather_cache 
                (district_id, cache_type, observation_date, current_metrics, daily_forecast, source, fetched_at, is_stale)
            VALUES 
                (:district_id, :cache_type, :observation_date, :current_metrics, :daily_forecast, :source, NOW(), :is_stale)
            ON CONFLICT (district_id, observation_date, cache_type) DO UPDATE SET
                current_metrics = EXCLUDED.current_metrics,
                daily_forecast = EXCLUDED.daily_forecast,
                source = EXCLUDED.source,
                fetched_at = NOW(),
                is_stale = EXCLUDED.is_stale
            RETURNING id;
        """)

        db.execute(upsert_sql, {
            "district_id": district_id,
            "cache_type": cache_type,
            "observation_date": observation_date,
            "current_metrics": json.dumps(current_metrics) if current_metrics is not None else None,
            "daily_forecast": json.dumps(daily_forecast) if daily_forecast is not None else None,
            "source": source,
            "is_stale": is_stale,
        })
        db.commit()

        return (
            db.query(DistrictWeatherCache)
            .filter(
                DistrictWeatherCache.district_id == district_id,
                DistrictWeatherCache.observation_date == observation_date,
                DistrictWeatherCache.cache_type == cache_type,
            )
            .first()
        )
