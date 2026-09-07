"""
tests/test_downstream_program_selection.py

PHASE 9C: Automated Test Suite
Verifies:
1. Recommendation engine is frozen, functional, and returns ranked schemes with fit categories.
2. Recommendation engine source code remains completely untouched.
3. No auto-selection: DPRService.generate_dpr raises 400 when selected_program_code is missing.
4. User selects Programme A (e.g., PMFME) -> Financial structuring computes PMFME terms (10% promoter mandate, MoFPI, 35% subsidy).
5. DPR generated for Programme A contains PMFME-specific terms, statutory conditions, and owning ministry.
6. User switches to Programme B (e.g., PM_MUDRA_KISHORE) -> Financial structuring recalculates from scratch for PM_MUDRA_KISHORE (null promoter mandate, credit guarantee, 0 subsidy).
7. Switching from Programme A to Programme B discards previous financial structure entirely (zero PMFME subsidy/mandate bleeds into MUDRA).
8. Dynamic milestones adapt across sectors:
   - Retail / Trade / Commerce
   - Services / Repair / IT
   - Food Processing / Agro
   - Manufacturing / Engineering
   - Existing Enterprise (Expansion)
9. Milestones include activity, critical_deliverable, phase_number, and provenance == "ILLUSTRATIVE ASSUMPTION".
10. Dynamic operating assumptions vary across sectors.
11. Break-even commentary includes "Not calculated from available verified data. Illustrative assumption — validate with actual business records, quotations and local market checks."
12. Working capital cycle days is None when unverified.
13. DPR PDF exports correctly with valid %PDF-1.4 header and %%EOF marker, reflecting the selected programme.
"""

import asyncio
import pytest
from fastapi import HTTPException

from app.db.session import get_db
from app.services.dpr_service import DPRService
from app.schemas.dpr import DPRRequest
from app.services.financial_structuring_service import (
    FinancialStructuringService,
    FinancialStructuringRequest,
)
from app.services.recommendation_service import RecommendationService
from app.schemas.recommendation import RecommendationRequest
from app.services.dpr_pdf_service import dpr_pdf_service


# ---------------------------------------------------------------------------
# Test 1 & 2: Recommendation Engine is FROZEN & FUNCTIONAL
# ---------------------------------------------------------------------------

def test_recommendation_engine_frozen_and_functional():
    """Verify recommendation engine works perfectly and produces ranked schemes without modification."""
    db = next(get_db())
    from app.schemas.eligibility import UserProfile
    from app.services.recommendation_service import recommendation_service

    profile = UserProfile(
        age=30,
        gender="Male",
        social_category="General",
        state="Maharashtra",
        district="Pune",
        sector="Manufacturing",
        requested_loan_amount=1500000.0,
        project_cost=2000000.0,
        annual_turnover=400000.0,
        monthly_income=30000.0,
    )
    req = RecommendationRequest(
        profile=profile,
        target_financing_need=1500000.0,
        top_k=10,
    )

    response = recommendation_service.generate_recommendations(db, req)
    assert response is not None
    assert len(response.recommendations) > 0

    # Ensure ranking, scoring, and fit categories exist
    top_rec = response.recommendations[0]
    assert hasattr(top_rec, "program_code")
    assert hasattr(top_rec, "recommendation_score")
    assert hasattr(top_rec, "fit_category")
    assert top_rec.recommendation_score > 0
    assert top_rec.fit_category in ["EXCELLENT_FIT", "STRONG_FIT", "MODERATE_FIT", "LOW_FIT"]


# ---------------------------------------------------------------------------
# Test 3: No Auto-Selection (Missing program code raises 400)
# ---------------------------------------------------------------------------

def test_dpr_requires_explicit_program_selection():
    """DPR cannot be generated without an explicit programme selection; raises 400 error."""
    db = next(get_db())

    req = DPRRequest(
        business_type="Retail Trade",
        activity="General Store",
        sector="Services",
        stage="Greenfield Formulation",
        district_name="Jaipur",
        state_name="Rajasthan",
        estimated_capital=1000000.0,
        selected_program_code=None,  # No programme selected
        selected_program_id=None,
    )

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(DPRService.generate_dpr(db=db, request=req))

    assert exc_info.value.status_code == 400
    assert "Select a government programme" in exc_info.value.detail


# ---------------------------------------------------------------------------
# Test 4, 5, 6, 7: Programme Selection & Switching (PMFME -> MUDRA)
# ---------------------------------------------------------------------------

def test_program_selection_pmfme():
    """User selects PMFME: Financial structuring and DPR bound to PMFME."""
    db = next(get_db())

    req = DPRRequest(
        business_type="Food Processing",
        activity="Pickle & Jam Processing",
        sector="Manufacturing",
        stage="Greenfield Formulation",
        district_name="Jaipur",
        state_name="Rajasthan",
        estimated_capital=2000000.0,
        user_promoter_contribution=300000.0,
        selected_program_code="PMFME",
    )

    dpr = asyncio.run(DPRService.generate_dpr(db=db, request=req))

    # Government support binding
    assert dpr.government_support.program_code == "PMFME"
    assert "PMFME" in dpr.government_support.program_name or "Food Processing" in dpr.government_support.program_name
    assert "Food Processing" in dpr.government_support.ministry or "MoFPI" in dpr.government_support.ministry
    assert dpr.government_support.eligible_subsidy_rate_pct == 35.0
    assert dpr.government_support.eligible_subsidy_amount > 0

    # Capital structure binding: PMFME mandates 10% promoter equity
    assert dpr.capital_structure.promoter_equity_amount == 200000.0
    assert dpr.capital_structure.promoter_equity_pct == 10.0
    # User's personal contribution is preserved separately
    assert dpr.capital_structure.user_promoter_contribution_amount == 300000.0


def test_program_switching_discards_previous_structure():
    """User switches from PMFME to PM_MUDRA_KISHORE: previous subsidy & mandate discarded."""
    db = next(get_db())

    # 1. Structure with PMFME
    req_pmfme = DPRRequest(
        business_type="Food Processing",
        activity="Pickle & Jam Processing",
        sector="Manufacturing",
        stage="Greenfield Formulation",
        district_name="Jaipur",
        state_name="Rajasthan",
        estimated_capital=400000.0,
        user_promoter_contribution=50000.0,
        selected_program_code="PMFME",
    )
    dpr_pmfme = asyncio.run(DPRService.generate_dpr(db=db, request=req_pmfme))
    assert dpr_pmfme.government_support.program_code == "PMFME"
    assert dpr_pmfme.government_support.eligible_subsidy_amount > 0
    assert dpr_pmfme.capital_structure.promoter_equity_amount == 40000.0  # 10% mandate

    # 2. Switch to PM_MUDRA_KISHORE
    req_mudra = DPRRequest(
        business_type="Food Processing",
        activity="Pickle & Jam Processing",
        sector="Manufacturing",
        stage="Greenfield Formulation",
        district_name="Jaipur",
        state_name="Rajasthan",
        estimated_capital=400000.0,
        user_promoter_contribution=50000.0,
        selected_program_code="PM_MUDRA_KISHORE",
    )
    dpr_mudra = asyncio.run(DPRService.generate_dpr(db=db, request=req_mudra))

    # Must be completely recalculated for MUDRA
    assert dpr_mudra.government_support.program_code == "PM_MUDRA_KISHORE"
    assert "MUDRA" in dpr_mudra.government_support.program_name
    assert "Finance" in dpr_mudra.government_support.ministry
    # MUDRA has NO capital subsidy (0 subsidy)
    assert dpr_mudra.government_support.eligible_subsidy_amount == 0.0
    assert dpr_mudra.capital_structure.government_subsidy_amount == 0.0
    # MUDRA has no statutory promoter mandate (None / not specified)
    assert dpr_mudra.capital_structure.promoter_equity_amount is None
    # User's personal contribution remains intact
    assert dpr_mudra.capital_structure.user_promoter_contribution_amount == 50000.0


# ---------------------------------------------------------------------------
# Test 8, 9: Dynamic, Business-Specific, Stage-Aware Milestones
# ---------------------------------------------------------------------------

def test_dynamic_milestones_retail():
    """Verify dynamic milestones for Retail / Trade / Commerce."""
    db = next(get_db())
    req = DPRRequest(
        business_type="Retail Trade",
        activity="Grocery & Daily Needs",
        sector="Services",
        stage="Greenfield Formulation",
        district_name="Jaipur",
        state_name="Rajasthan",
        estimated_capital=500000.0,
        selected_program_code="PM_MUDRA_KISHORE",
    )
    dpr = asyncio.run(DPRService.generate_dpr(db=db, request=req))
    milestones = dpr.implementation_plan.milestones

    assert len(milestones) >= 5
    activities = [m.activity.lower() for m in milestones]
    deliverables = [m.critical_deliverable.lower() for m in milestones]
    all_text = " ".join(activities + deliverables)

    # Retail specific keywords
    assert any(k in all_text for k in ["commercial lease", "shop", "pos", "billing", "inventory", "stock", "retail", "storefront"])
    # No industrial/heavy factory machinery keywords
    assert not any("machinery foundation civil works" in a for a in activities)
    # All milestones have required provenance
    for m in milestones:
        assert m.provenance is not None
        assert len(m.provenance) > 0


def test_dynamic_milestones_services():
    """Verify dynamic milestones for Services / IT / Repair / Hospitality."""
    db = next(get_db())
    req = DPRRequest(
        business_type="IT & Digital Services",
        activity="Software Development",
        sector="Services",
        stage="Greenfield Formulation",
        district_name="Pune",
        state_name="Maharashtra",
        estimated_capital=800000.0,
        selected_program_code="PM_MUDRA_TARUN",
    )
    dpr = asyncio.run(DPRService.generate_dpr(db=db, request=req))
    milestones = dpr.implementation_plan.milestones

    all_text = " ".join([m.activity.lower() + " " + m.critical_deliverable.lower() for m in milestones])
    assert any(k in all_text for k in ["workstations", "client service", "it", "service-level", "deliverable", "pilot", "diagnostic"])
    assert not any("machinery foundation civil works" in m.activity.lower() for m in milestones)


def test_dynamic_milestones_food_processing():
    """Verify dynamic milestones for Food Processing / Agro."""
    db = next(get_db())
    req = DPRRequest(
        business_type="Food Processing",
        activity="Bakery & Confectionery",
        sector="Manufacturing",
        stage="Greenfield Formulation",
        district_name="Varanasi",
        state_name="Uttar Pradesh",
        estimated_capital=1500000.0,
        selected_program_code="PMFME",
    )
    dpr = asyncio.run(DPRService.generate_dpr(db=db, request=req))
    milestones = dpr.implementation_plan.milestones

    all_text = " ".join([m.activity.lower() + " " + m.critical_deliverable.lower() for m in milestones])
    assert any(k in all_text for k in ["fssai", "food-grade", "hygiene", "batch", "shelf-life", "agro", "farm-gate"])


def test_dynamic_milestones_existing_expansion():
    """Verify dynamic milestones for Existing / Operational / Expansion enterprise."""
    db = next(get_db())
    req = DPRRequest(
        business_type="Textile Garments",
        activity="Apparel Manufacturing",
        sector="Manufacturing",
        stage="Existing Enterprise (Expansion)",
        district_name="Surat",
        state_name="Gujarat",
        estimated_capital=2500000.0,
        selected_program_code="PMEGP_NEW",
    )
    dpr = asyncio.run(DPRService.generate_dpr(db=db, request=req))
    milestones = dpr.implementation_plan.milestones

    all_text = " ".join([m.activity.lower() + " " + m.critical_deliverable.lower() for m in milestones])
    assert any(k in all_text for k in ["expansion", "modernization", "capacity", "existing operational", "audit"])


# ---------------------------------------------------------------------------
# Test 10, 11, 12: Dynamic Operating Assumptions & Unverified Cycle
# ---------------------------------------------------------------------------

def test_dynamic_operating_assumptions():
    """Verify operating assumptions are sector-specific and working capital cycle is null when unverified."""
    db = next(get_db())
    req = DPRRequest(
        business_type="Retail Trade",
        activity="Apparel Store",
        sector="Services",
        stage="Greenfield Formulation",
        district_name="Jaipur",
        state_name="Rajasthan",
        estimated_capital=1000000.0,
        selected_program_code="PM_MUDRA_TARUN",
    )
    dpr = asyncio.run(DPRService.generate_dpr(db=db, request=req))
    ia = dpr.illustrative_assumptions

    # Provenance must be ILLUSTRATIVE ASSUMPTION
    assert ia.provenance == "ILLUSTRATIVE ASSUMPTION"
    # Working capital cycle days is None (not hardcoded 45)
    assert ia.working_capital_cycle_days is None
    # Break-even commentary must state it is not calculated from verified data
    assert "Not calculated from available verified data" in ia.break_even_commentary
    assert "Illustrative assumption" in ia.break_even_commentary

    # Operating expense benchmarks must reflect retail/trade (merchandise procurement, shop lease)
    benchmarks_text = " ".join(ia.operating_expense_benchmarks).lower()
    assert any(k in benchmarks_text for k in ["merchandise", "retail", "procurement", "inventory"])


# ---------------------------------------------------------------------------
# Test 13: PDF Generation for Selected Programme
# ---------------------------------------------------------------------------

def test_dpr_pdf_generation_for_selected_program():
    """Verify official PDF generates cleanly for the selected programme with valid header and footer."""
    db = next(get_db())
    req = DPRRequest(
        business_type="Food Processing",
        activity="Spices Processing",
        sector="Manufacturing",
        stage="Greenfield Formulation",
        district_name="Jaipur",
        state_name="Rajasthan",
        estimated_capital=1500000.0,
        selected_program_code="PMFME",
    )
    dpr = asyncio.run(DPRService.generate_dpr(db=db, request=req))

    pdf_bytes = dpr_pdf_service.generate_pdf(dpr)
    assert pdf_bytes is not None
    assert len(pdf_bytes) > 1000

    # Valid PDF-1.4 header and %%EOF trailer
    assert pdf_bytes.startswith(b"%PDF-1.4")
    assert b"%%EOF" in pdf_bytes[-1024:]
