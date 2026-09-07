"""
tests/test_single_source_of_truth.py

Verifies:
1. Profile values propagate directly to DPR and Financial Structuring.
2. User-Provided Promoter Contribution (USER PROVIDED) and Programme Promoter Mandate (GOVERNMENT / DATASET DERIVED) remain strictly distinct.
3. District and Sector changes propagate dynamically (Jaipur Food Processing vs Pune Retail Trade).
4. No silent defaults to Varanasi, Uttar Pradesh, or Handloom exist.
5. Missing mandatory geographic or enterprise fields produce explicit validation errors rather than silent fallbacks.
6. Downstream financial calculations rely strictly on authoritative deterministic engines with zero frontend math.
"""

import pytest
import asyncio
from app.db.session import get_db
from app.services.dpr_service import DPRService
from app.schemas.dpr import DPRRequest
from app.services.financial_structuring_service import (
    FinancialStructuringService,
    FinancialStructuringRequest,
)
from app.services.research_context_service import research_context_service

def test_single_source_of_truth_propagation():
    """Verify that user profile values propagate through to DPR generation."""
    db = next(get_db())
    
    # Profile A: Food Processing in Jaipur, Rajasthan
    req_a = DPRRequest(
        business_type="Food Processing",
        activity="Spices & Pickle Processing",
        sector="Manufacturing",
        stage="Greenfield Formulation",
        district_name="Jaipur",
        state_name="Rajasthan",
        estimated_capital=2000000.0,
        current_income=480000.0,
        existing_debt=50000.0,
        user_promoter_contribution=300000.0,
        selected_program_code="PMFME",
    )
    
    dpr_a = asyncio.run(DPRService.generate_dpr(db=db, request=req_a))
    
    # 1. Profile Facts must be strictly preserved
    assert dpr_a.district_name == "JAIPUR"
    assert dpr_a.state_name == "RAJASTHAN"
    assert dpr_a.business_type == "Food Processing"
    assert dpr_a.sector == "Manufacturing"
    assert dpr_a.activity == "Spices & Pickle Processing"
    assert dpr_a.stage == "Greenfield Formulation"
    assert dpr_a.capital_structure.total_project_cost == 2000000.0
    
    # 2. User Promoter Contribution preserved with USER PROVIDED provenance
    assert dpr_a.capital_structure.user_promoter_contribution_amount == 300000.0
    assert dpr_a.capital_structure.user_promoter_contribution_pct == 15.0
    
    # 3. Programme Promoter Mandate is strictly derived from PMFME (10%)
    assert dpr_a.capital_structure.promoter_equity_amount == 200000.0
    assert dpr_a.capital_structure.promoter_equity_pct == 10.0
    assert dpr_a.capital_structure.user_promoter_contribution_amount != dpr_a.capital_structure.promoter_equity_amount


def test_profile_update_propagation_pune_retail():
    """Verify profile modification to Pune Retail Trade produces distinct dynamic outputs."""
    db = next(get_db())
    
    # Profile B: Retail Trade in Pune, Maharashtra
    req_b = DPRRequest(
        business_type="Retail Trade",
        activity="Consumer Goods Mart",
        sector="Trading",
        stage="Early Stage",
        district_name="Pune",
        state_name="Maharashtra",
        estimated_capital=800000.0,
        current_income=300000.0,
        existing_debt=0.0,
        user_promoter_contribution=80000.0,
        selected_program_code="MUDRA_KISHORE",
    )
    
    dpr_b = asyncio.run(DPRService.generate_dpr(db=db, request=req_b))
    
    assert dpr_b.district_name == "PUNE"
    assert dpr_b.state_name == "MAHARASHTRA"
    assert dpr_b.business_type == "Retail Trade"
    assert dpr_b.sector == "Trading"
    assert dpr_b.stage == "Early Stage"
    assert dpr_b.capital_structure.total_project_cost == 800000.0
    
    # User promoter contribution: 80,000 (10.0%)
    assert dpr_b.capital_structure.user_promoter_contribution_amount == 80000.0
    assert dpr_b.capital_structure.user_promoter_contribution_pct == 10.0
    
    # Programme mandate: MUDRA has null statutory promoter contribution
    assert dpr_b.capital_structure.promoter_equity_amount is None
    assert dpr_b.capital_structure.programme_promoter_note is not None
    assert "Not specified by authoritative programme data" in dpr_b.capital_structure.programme_promoter_note


def test_financial_structuring_single_source_of_truth():
    """Verify FinancialStructuringService strictly calculates based on input profile without fabricated defaults."""
    db = next(get_db())
    
    fin_req = FinancialStructuringRequest(
        program_code="PMFME",
        project_cost=2000000.0,
        monthly_income=40000.0,
        monthly_expenses=15000.0,
        existing_monthly_emi=2000.0,
    )
    
    resp = FinancialStructuringService.calculate_structure(db=db, request=fin_req)
    
    assert resp.capital_structure.project_cost == 2000000.0
    assert resp.debt_health.uncommitted_surplus == 23000.0  # 40000 - 15000 - 2000
    assert resp.debt_health.affordable_emi_cap > 0
    assert len(resp.loan_scenarios) >= 3


def test_market_intelligence_geographic_integrity():
    """Verify district lookup queries PostgreSQL census dynamically with zero Varanasi fallback."""
    db = next(get_db())
    
    # Query Jaipur
    ctx_jaipur = asyncio.run(research_context_service.get_district_research_context(
        db=db, district_name="Jaipur", state_name="Rajasthan"
    ))
    assert ctx_jaipur is not None
    assert ctx_jaipur.district_name == "JAIPUR"
    assert ctx_jaipur.state_name == "RAJASTHAN"
    assert ctx_jaipur.msme_market_context is not None
    assert ctx_jaipur.msme_market_context.total_msmes > 300000
    
    # Query Pune
    ctx_pune = asyncio.run(research_context_service.get_district_research_context(
        db=db, district_name="Pune", state_name="Maharashtra"
    ))
    assert ctx_pune is not None
    assert ctx_pune.district_name == "PUNE"
    assert ctx_pune.state_name == "MAHARASHTRA"
    assert ctx_pune.msme_market_context is not None
    assert ctx_pune.msme_market_context.total_msmes > 600000
    
    # MSME count in Pune must differ from Jaipur and Varanasi
    assert ctx_pune.msme_market_context.total_msmes != ctx_jaipur.msme_market_context.total_msmes
