"""
app/api/v1/research.py

Research Intelligence API endpoints:
- GET /api/v1/research/district-market-context: Unified district geographic, MSME market, and weather context.

IMPORTANT ARCHITECTURAL INVARIANT:
External geography and weather data are research context only.
They do NOT alter recommendation scores or determine statutory scheme eligibility.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.research_context import DistrictResearchContextResponse
from app.services.research_context_service import research_context_service

router = APIRouter(prefix="/research", tags=["Research Intelligence"])


@router.get(
    "/district-market-context",
    response_model=DistrictResearchContextResponse,
    status_code=status.HTTP_200_OK,
    summary="Get unified district research intelligence context",
)
async def get_district_market_context(
    district_name: Optional[str] = Query(
        None, description="Official or colloquial district name (e.g. 'Varanasi', 'Pune')"
    ),
    state_name: Optional[str] = Query(
        None, description="Canonical State / UT name (e.g. 'Uttar Pradesh', 'Maharashtra')"
    ),
    lg_dt_code: Optional[str] = Query(
        None, description="Official Local Government Directory (LGD) district code (e.g. '194')"
    ),
    db: Session = Depends(get_db),
) -> DistrictResearchContextResponse:
    """
    Retrieve unified research intelligence for an Indian district.
    Aggregates:
    - Official geographic centroid coordinates and elevation from PostgreSQL.
    - Empirical Udyam MSME market density, composition shares, and rankings.
    - Observational weather conditions and 3-day forecast snapshots from Open-Meteo / DB cache.
    - Defensible, data-backed operational observations and cautions.

    At least one parameter (`district_name`, `state_name`, or `lg_dt_code`) must be provided.
    """
    if not district_name and not state_name and not lg_dt_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one parameter (district_name, state_name, or lg_dt_code) must be provided.",
        )

    context = await research_context_service.get_district_research_context(
        db=db,
        district_name=district_name,
        state_name=state_name,
        lg_dt_code=lg_dt_code,
    )

    if not context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District research context not found for district='{district_name}', state='{state_name}', lg_dt_code='{lg_dt_code}'.",
        )

    return context
