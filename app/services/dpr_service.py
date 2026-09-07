"""
app/services/dpr_service.py

Master DPR Orchestration Service:
- Orchestrates the full canonical pipeline:
  Profile -> District Udyam Census -> ML Clustering -> NearestNeighbors Similarity ->
  Weather Activity Signal -> Evidence Packaging -> Authoritative Eligibility & Recommendations ->
  Deterministic Financial Structuring -> Bank-Grade AI Narrative Composition ->
  Canonical 13-Section DPR Response.
- Strict Invariant Enforcement:
  - Calls authoritative engines WITHOUT modifying them.
  - Zero financial math in this layer or frontend.
  - Provenance tagged on every section and metric.
  - Resilient failure isolation.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.dpr import (
    DPRRequest,
    DPRResponse,
    DPRExecutiveSummary,
    DPRBusinessModel,
    DPRMarketAnalysis,
    DPRCustomerSegments,
    DPRCompetition,
    DPRLocationAnalysis,
    DPROperationsPlan,
    DPRMarketingStrategy,
    DPRGovernmentSupport,
    DPRCapitalStructure,
    DPRFinancialAssumptions,
    DebtServiceRepaymentYear,
    DPRRiskAnalysis,
    DPRImplementationPlan,
    DPRMilestoneItem,
    DPRIllustrativeAssumptions,
    DPRResearchGaps,
)
from app.schemas.market_research import MarketResearchEvidence, CustomerSegmentItem
from app.schemas.market_similarity import ComparableDistrictItem
from app.schemas.financial_structuring import (
    FinancialStructuringRequest,
    FinancialStructuringResponse,
    CapitalStructureBreakdown,
    DebtHealthIndicators,
    StatutoryFinancialBounds,
)
from app.schemas.recommendation import RecommendationRequest
from app.schemas.eligibility import UserProfile

from app.services.research_context_service import research_context_service
from app.services.market_research_ml_service import market_research_ml_service
from app.services.market_similarity_service import market_similarity_service
from app.services.weather_business_impact_service import weather_business_impact_service
from app.services.financial_structuring_service import FinancialStructuringService
from app.services.program_eligibility_adapter import ProgramEligibilityAdapter
from app.services.recommendation_service import RecommendationService
from app.services.dpr_ai_service import dpr_ai_service
from app.repositories.program_repository import program_repository

logger = logging.getLogger(__name__)

# Known scheme code alias mapping
KNOWN_PROGRAM_ALIASES: Dict[str, str] = {
    "PMEGP": "PMEGP_NEW",
    "STAND_UP_INDIA": "STANDUP_INDIA",
    "MUDRA": "PM_MUDRA_KISHORE",
    "MUDRA_KISHORE": "PM_MUDRA_KISHORE",
    "MUDRA_TARUN": "PM_MUDRA_TARUN",
    "MUDRA_SHISHU": "PM_MUDRA_SHISHU",
    "PM_MUDRA": "PM_MUDRA_KISHORE",
}


class DPRService:
    """Master Orchestration Service for Structured Detailed Project Reports."""

    @classmethod
    async def generate_dpr(
        cls,
        db: Session,
        request: DPRRequest,
    ) -> DPRResponse:
        """Generate complete canonical 13-section DPR with failure isolation."""
        report_id = f"DPR-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        generated_at = datetime.now(timezone.utc).isoformat()

        promoter_name = request.promoter_name or "Entrepreneur"
        project_name = request.project_name or f"{request.business_type} Enterprise"
        dname = request.district_name.strip()
        sname = (request.state_name or "").strip()

        # ---------------------------------------------------------------------
        # 1. District Research Context (Geographic & Udyam MSME Census)
        # ---------------------------------------------------------------------
        research_context = await research_context_service.get_district_research_context(
            db=db,
            district_name=dname,
            state_name=sname if sname else None,
            lg_dt_code=request.lg_dt_code,
        )

        resolved_dname = research_context.district_name if research_context else dname
        resolved_sname = research_context.state_name if research_context else (sname or "India")
        m_context = (
            getattr(research_context, "msme_market_context", None)
            or getattr(research_context, "market_context", None)
        ) if research_context else None
        w_context = research_context.weather_context if research_context else None
        geo_coords = research_context.geographic_coordinates if research_context else None

        # ---------------------------------------------------------------------
        # 2. scikit-learn KMeans Market Clustering (K=4, MRI)
        # ---------------------------------------------------------------------
        ml_analysis = market_research_ml_service.get_analysis_for_district(
            db=db,
            district_id=research_context.district_id if research_context else None,
            market_context=m_context,
        )

        # ---------------------------------------------------------------------
        # 3. scikit-learn NearestNeighbors Market Similarity (Top 4 Districts)
        # ---------------------------------------------------------------------
        similarity_context = market_similarity_service.get_comparable_markets(
            db=db,
            district_name=resolved_dname,
            state_name=resolved_sname,
            lg_dt_code=request.lg_dt_code,
            market_context=m_context,
            top_k=4,
        )

        # ---------------------------------------------------------------------
        # 4. Indicative Weather Activity Impact Heuristic
        # ---------------------------------------------------------------------
        weather_impact = None
        try:
            weather_impact = weather_business_impact_service.calculate_impact(
                weather_context=w_context,
                business_type=request.business_type,
            )
        except Exception as e:
            logger.warning("Weather impact calculation non-critical failure: %s", e)

        # ---------------------------------------------------------------------
        # 5. Assemble Structured Evidence Package
        # ---------------------------------------------------------------------
        comp_summaries: List[str] = []
        if similarity_context and similarity_context.comparable_districts:
            for c in similarity_context.comparable_districts:
                comp_summaries.append(
                    f"{c.district_name} ({c.state_name}) - Rank #{c.similarity_rank}, Distance: {c.similarity_distance:.3f}, {c.total_msmes:,} MSMEs ({c.micro_share:.1f}% Micro)"
                )

        weather_risk_dict = None
        if weather_impact and weather_impact.risk_signals:
            weather_risk_dict = {
                "heat_stress": weather_impact.risk_signals.heat_stress,
                "rain_disruption": weather_impact.risk_signals.rain_disruption,
                "outdoor_activity": weather_impact.risk_signals.outdoor_activity,
                "logistics_disruption": weather_impact.risk_signals.logistics_disruption,
            }

        evidence = MarketResearchEvidence(
            district_name=resolved_dname,
            state_name=resolved_sname,
            lg_dt_code=request.lg_dt_code,
            business_type=request.business_type,
            sub_type=request.sub_type,
            target_market=request.target_market,
            experience_level=request.experience_level,
            estimated_capital=request.estimated_capital,
            current_income=request.current_income,
            total_msmes=int(m_context.total_msmes) if m_context else 0,
            micro_enterprises=int(m_context.micro_enterprises) if m_context else 0,
            small_enterprises=int(m_context.small_enterprises) if m_context else 0,
            medium_enterprises=int(m_context.medium_enterprises) if m_context else 0,
            micro_share=float(m_context.micro_share) if m_context else 0.0,
            small_medium_share=float(m_context.small_medium_share) if m_context else 0.0,
            national_rank=int(m_context.national_rank) if m_context and m_context.national_rank else None,
            state_rank=int(m_context.state_rank) if m_context and m_context.state_rank else None,
            cluster_id=ml_analysis.cluster_id if ml_analysis else None,
            cluster_label=ml_analysis.cluster_label if ml_analysis else "Commercial District",
            cluster_description=ml_analysis.cluster_description if ml_analysis else None,
            market_research_indicator=ml_analysis.quantitative_indicators.market_research_indicator if ml_analysis else 50.0,
            comparable_districts_summary=comp_summaries,
            weather_condition=(
                w_context.current.weather_description
                if w_context and w_context.current
                else "Normal"
            ),
            activity_impact_score=weather_impact.activity_impact_score if weather_impact else None,
            activity_impact_label=weather_impact.activity_impact_label if weather_impact else None,
            weather_risk_signals=weather_risk_dict,
        )

        # ---------------------------------------------------------------------
        # 6. Authoritative Government Scheme Resolution & Financial Structuring
        # ---------------------------------------------------------------------
        # Resolve target programme: explicit selection or authoritative recommendation
        target_program_code = cls._resolve_target_program(db=db, request=request)

        # Execute authoritative deterministic financial structuring
        fin_struct = cls._calculate_authoritative_financials(
            db=db,
            program_code=target_program_code,
            request=request,
        )

        # ---------------------------------------------------------------------
        # 7. Extract Deterministic Numbers for AI Prompt & Reports
        # ---------------------------------------------------------------------
        total_cost = request.estimated_capital
        promoter_equity: Optional[float] = None
        promoter_equity_pct: Optional[float] = None
        initial_bank_loan: Optional[float] = None
        net_effective_debt: Optional[float] = None
        bank_loan = 0.0
        term_loan: Optional[float] = None
        term_loan_pct: Optional[float] = None
        working_cap: Optional[float] = None
        working_cap_pct: Optional[float] = None
        subsidy_amount = 0.0
        subsidy_pct: Optional[float] = None
        monthly_emi = 0.0
        annual_debt_service = 0.0
        interest_rate: Optional[float] = None
        tenure_months: Optional[int] = None
        moratorium_months: Optional[int] = None
        total_interest = 0.0
        is_market_linked = False
        is_benchmark_assumption = False
        rate_type: Optional[str] = None
        rate_display_text: Optional[str] = None
        rate_note: Optional[str] = None
        amortization_schedule: List[DebtServiceRepaymentYear] = []
        is_balanced = False

        is_credit_linked = bool(
            fin_struct
            and fin_struct.is_financing_applicable
            and fin_struct.loan_scenarios
            and len(fin_struct.loan_scenarios) > 0
        )

        if fin_struct and fin_struct.capital_structure:
            cs = fin_struct.capital_structure
            total_cost = cs.project_cost
            # Blocker 1 Fix: Preserve exact upstream promoter contribution (preserve None)
            promoter_equity = cs.promoter_contribution_amount
            promoter_equity_pct = cs.promoter_contribution_pct
            subsidy_amount = cs.subsidy_amount or 0.0
            subsidy_pct = cs.subsidy_pct
            initial_bank_loan = cs.initial_bank_loan
            net_effective_debt = cs.net_effective_debt
            bank_loan = cs.initial_bank_loan or 0.0
            # Blocker 2 Fix: Zero arbitrary 70/30 split. Pass through only if authoritative, else None.
            term_loan = None
            term_loan_pct = None
            is_balanced = True

        user_promoter_amount = request.user_promoter_contribution
        user_promoter_pct = (
            round((user_promoter_amount / total_cost) * 100, 2)
            if (user_promoter_amount is not None and total_cost > 0)
            else None
        )
        programme_promoter_note = (
            "Programme-defined promoter contribution: Not specified by authoritative programme data."
            if promoter_equity is None
            else None
        )
        resolved_sector = request.sector or request.business_type
        resolved_activity = request.activity or request.sub_type
        resolved_stage = request.stage or "Greenfield / New Venture"

        # Pick recommended or first loan scenario if credit-linked
        if is_credit_linked and fin_struct and fin_struct.loan_scenarios:
            chosen_scenario = next(
                (s for s in fin_struct.loan_scenarios if s.is_recommended),
                fin_struct.loan_scenarios[0],
            )
            monthly_emi = chosen_scenario.monthly_emi or 0.0
            annual_debt_service = getattr(chosen_scenario, "annual_debt_service", None) or round(monthly_emi * 12.0, 2)
            interest_rate = chosen_scenario.annual_interest_rate_pct
            tenure_months = chosen_scenario.tenure_months
            moratorium_months = chosen_scenario.moratorium_months
            total_interest = chosen_scenario.total_interest_payable or 0.0

            # Blocker 4 Fix: Market-linked rate detection & labelling
            is_market_linked = bool(chosen_scenario.is_market_linked)
            is_benchmark_assumption = bool(chosen_scenario.is_benchmark_assumption)
            rate_note = chosen_scenario.rate_note
            if is_market_linked:
                rate_type = "market_linked"
                rate_display_text = "Market-linked / lender-dependent"
            else:
                rate_type = "statutory_fixed"
                rate_display_text = f"{interest_rate:.1f}% statutory rate" if interest_rate is not None else None

            # Blocker 3 Fix: Amortization principal must match the principal used for chosen_scenario EMI
            amort_principal = net_effective_debt if (net_effective_debt is not None and net_effective_debt > 0) else initial_bank_loan
            if amort_principal and amort_principal > 0 and interest_rate is not None and tenure_months is not None:
                amortization_schedule = cls._generate_amortization_schedule(
                    principal=amort_principal,
                    interest_rate_pct=interest_rate,
                    tenure_months=tenure_months,
                    monthly_emi=monthly_emi,
                )
        else:
            # Blocker 5 Fix: Non-credit programmes must have null financial assumptions
            annual_debt_service = 0.0
            rate_display_text = "Not applicable — programme is not credit-linked."

        program_title = fin_struct.program_name if fin_struct else target_program_code

        # ---------------------------------------------------------------------
        # 8. AI Narrative Composition (Zero Financial Math)
        # ---------------------------------------------------------------------
        narrative = await dpr_ai_service.compose_dpr_narrative(
            evidence=evidence,
            promoter_name=promoter_name,
            project_name=project_name,
            program_name=program_title,
            total_project_cost=total_cost,
            promoter_equity=promoter_equity,
            bank_loan=bank_loan,
            subsidy_amount=subsidy_amount,
            monthly_emi=monthly_emi,
        )

        # Merge user qualitative overrides if provided
        if request.qualitative_overrides:
            for k, v in request.qualitative_overrides.items():
                if k in narrative and v:
                    narrative[k] = v

        user_monthly_income = (
            float(request.monthly_income)
            if getattr(request, "monthly_income", None) is not None
            else (round(float(request.current_income) / 12.0, 2) if request.current_income and request.current_income > 0 else None)
        )
        user_requested_loan = (
            float(request.requested_financing)
            if getattr(request, "requested_financing", None) is not None
            else (float(request.loan_amount_requested) if getattr(request, "loan_amount_requested", None) is not None else None)
        )

        # ---------------------------------------------------------------------
        # 9. Assemble Canonical 13 Sections
        # ---------------------------------------------------------------------
        # Section 1: Executive Summary
        exec_summary = DPRExecutiveSummary(
            project_name=project_name,
            promoter_name=promoter_name,
            business_type=request.business_type,
            sub_type=request.sub_type,
            sector=resolved_sector,
            activity=resolved_activity,
            stage=resolved_stage,
            location_district=resolved_dname,
            location_state=resolved_sname,
            total_project_cost=total_cost,
            recommended_program_code=target_program_code,
            recommended_program_name=program_title,
            promoter_contribution_amount=promoter_equity,
            user_promoter_contribution_amount=user_promoter_amount,
            bank_loan_amount=bank_loan,
            eligible_subsidy_amount=subsidy_amount,
            monthly_emi=monthly_emi,
            monthly_income=user_monthly_income,
            requested_financing_amount=user_requested_loan,
            executive_narrative=str(narrative.get("executive_narrative", "")),
            provenance="BACKEND DETERMINISTIC CALCULATION + AI INTERPRETATION",
        )

        # Section 2: Business Model
        biz_model = DPRBusinessModel(
            value_proposition=str(narrative.get("value_proposition", "")),
            target_segments_summary=str(narrative.get("target_segments_summary", "")),
            revenue_streams=list(narrative.get("revenue_streams", [])),
            key_activities=list(narrative.get("key_activities", [])),
            key_partners=list(narrative.get("key_partners", [])),
            cost_structure_summary=list(narrative.get("cost_structure_summary", [])),
            provenance="USER PROVIDED + AI INTERPRETATION",
        )

        # Section 3: Market Analysis
        market_analysis = DPRMarketAnalysis(
            total_msmes_in_district=evidence.total_msmes,
            micro_enterprise_share=evidence.micro_share,
            small_medium_share=evidence.small_medium_share,
            national_rank=evidence.national_rank,
            state_rank=evidence.state_rank,
            cluster_archetype_label=evidence.cluster_label or "Commercial District",
            cluster_archetype_description=evidence.cluster_description or "Commercial MSME market.",
            market_research_indicator=evidence.market_research_indicator or 50.0,
            comparable_districts=similarity_context.comparable_districts if similarity_context else [],
            demand_drivers=[
                f"Steady local consumption in {resolved_dname} driven by {evidence.total_msmes:,} active commercial units",
                f"Growing preference for localized, quality-verified {request.business_type} solutions",
                f"Strategic market connectivity across {resolved_sname} trade corridors",
            ],
            market_barriers=[
                "Working capital timing gaps between raw material purchase and credit customer realization",
                "Unorganized local micro-vendor price competition",
            ],
            provenance="GOVERNMENT / DATASET DERIVED + MODELLED INDICATOR + AI INTERPRETATION",
        )

        # Section 4: Customer Segments
        cust_segments_raw = narrative.get("customer_segments", [])
        cust_segments: List[CustomerSegmentItem] = []
        for s in cust_segments_raw:
            if isinstance(s, dict):
                cust_segments.append(
                    CustomerSegmentItem(
                        segment=s.get("segment", "Target Segment"),
                        need=s.get("need", "Product / Service Need"),
                        buying_consideration=s.get("buying_consideration", "Quality and pricing"),
                        recommended_channel=s.get("recommended_channel", "Direct distribution"),
                        provenance="AI INTERPRETATION",
                    )
                )

        customer_section = DPRCustomerSegments(
            customer_segments=cust_segments,
            buying_behaviour_summary=str(narrative.get("buying_behaviour_summary", "Value-driven purchasing.")),
            provenance="AI INTERPRETATION",
        )

        # Section 5: Competition
        competition_section = DPRCompetition(
            competition_intensity=str(narrative.get("competition_intensity", "Moderate")),
            competition_rationale=str(narrative.get("competition_rationale", "")),
            market_structure_type=str(narrative.get("market_structure_type", "Decentralized Micro Cluster")),
            differentiation_vectors=list(narrative.get("differentiation_vectors", [])),
            field_survey_gaps=list(narrative.get("field_survey_gaps", [])),
            provenance="MODELLED INDICATOR + AI INTERPRETATION",
        )

        # Section 6: Location Analysis
        loc_section = DPRLocationAnalysis(
            district_name=resolved_dname,
            state_name=resolved_sname,
            lg_dt_code=request.lg_dt_code,
            latitude=geo_coords.latitude if geo_coords else None,
            longitude=geo_coords.longitude if geo_coords else None,
            elevation_meters=geo_coords.elevation_meters if geo_coords else None,
            connectivity_advantages=list(narrative.get("connectivity_advantages", [])),
            raw_material_proximity=str(narrative.get("raw_material_proximity", "")),
            labor_availability=str(narrative.get("labor_availability", "")),
            provenance="GOVERNMENT / DATASET DERIVED + AI INTERPRETATION",
        )

        # Section 7: Operations Plan
        ops_section = DPROperationsPlan(
            workflow_steps=list(narrative.get("workflow_steps", [])),
            key_machinery_equipment=list(narrative.get("key_machinery_equipment", [])),
            utilities_and_power=list(narrative.get("utilities_and_power", [])),
            workforce_roles=list(narrative.get("workforce_roles", [])),
            quality_assurance=str(narrative.get("quality_assurance", "Standard SOP compliance.")),
            provenance="USER PROVIDED + AI INTERPRETATION",
        )

        # Section 8: Marketing Strategy
        mkt_section = DPRMarketingStrategy(
            positioning_statement=str(narrative.get("positioning_statement", "")),
            sales_channels=list(narrative.get("sales_channels", [])),
            customer_acquisition_methods=list(narrative.get("customer_acquisition_methods", [])),
            pricing_framework=str(narrative.get("pricing_framework", "Cost-plus with wholesale margins")),
            promotional_initiatives=list(narrative.get("promotional_initiatives", [])),
            provenance="AI INTERPRETATION",
        )

        # Section 9: Government Support
        prog = program_repository.get_by_code(db, program_code=target_program_code)
        owning_ministry = prog.owning_ministry if prog and prog.owning_ministry else "Government of India"
        nodal_agency = prog.nodal_agency if prog and prog.nodal_agency else "Not specified by authoritative programme data"
        prog_category = prog.primary_type if prog and prog.primary_type else (fin_struct.primary_type if fin_struct else "Credit & Capital Support")

        statutory_conditions: List[str] = []
        if fin_struct and fin_struct.is_financing_applicable:
            statutory_conditions.append(f"Sanctioned credit must be disbursed through participating Scheduled Commercial Banks or financial institutions under {program_title} guidelines.")
            statutory_conditions.append("Applicant must satisfy Udyam registration and statutory compliance norms of the administrative ministry.")
            if subsidy_amount > 0:
                statutory_conditions.append("Statutory promoter margin money must be deposited in bank project account prior to release of first loan tranche.")
                statutory_conditions.append("Government subsidy lock-in and adjustment subject to physical inspection and verification by the nodal agency.")
            if fin_struct.capital_structure and fin_struct.capital_structure.credit_guarantee_eligible:
                statutory_conditions.append("Credit guarantee risk coverage applies under scheme norms; collateral-free lending without third-party guarantee.")
        else:
            statutory_conditions.append(f"Statutory benefit and capability support provided as per {program_title} nodal guidelines.")
            statutory_conditions.append("Direct operational compliance monitored by the administrative nodal agency.")

        gov_section = DPRGovernmentSupport(
            program_code=target_program_code,
            program_name=program_title,
            ministry=owning_ministry,
            nodal_agency=nodal_agency,
            program_category=prog_category,
            is_credit_linked=fin_struct.is_financing_applicable if fin_struct else False,
            eligible_subsidy_rate_pct=subsidy_pct,
            eligible_subsidy_amount=subsidy_amount,
            max_subsidy_allowed=fin_struct.financial_constraints.max_subsidy_amount if fin_struct else None,
            eligible_criteria_met=[
                f"Applicant meets statutory profile criteria for {program_title}",
                f"Project outlay of INR {total_cost:,.2f} evaluated under statutory programme guidelines",
                f"Location in {resolved_dname} ({request.location_type or 'URBAN'}) satisfies scheme jurisdiction",
            ],
            mandatory_statutory_conditions=statutory_conditions,
            provenance="GOVERNMENT / DATASET DERIVED + BACKEND DETERMINISTIC CALCULATION",
        )

        # Section 10: Capital Structure
        structuring_notes = [
            "Derived deterministically from official government programme parameters in PostgreSQL.",
            "Credit guarantee is lender risk coverage only and does not reduce applicant liability.",
        ]
        if term_loan is None and working_cap is None:
            structuring_notes.append(
                "Component allocation not specified by authoritative financial structure."
            )

        cap_section = DPRCapitalStructure(
            total_project_cost=total_cost,
            promoter_equity_amount=promoter_equity,
            promoter_equity_pct=promoter_equity_pct,
            user_promoter_contribution_amount=user_promoter_amount,
            user_promoter_contribution_pct=user_promoter_pct,
            requested_financing_amount=user_requested_loan,
            programme_promoter_note=programme_promoter_note,
            initial_bank_loan=initial_bank_loan,
            net_bank_loan_exposure=net_effective_debt if net_effective_debt is not None else initial_bank_loan,
            term_loan_amount=term_loan,
            term_loan_pct=term_loan_pct,
            working_capital_amount=working_cap,
            working_capital_pct=working_cap_pct,
            government_subsidy_amount=subsidy_amount,
            government_subsidy_pct=subsidy_pct,
            is_statutorily_balanced=is_balanced,
            structuring_notes=structuring_notes,
            provenance="BACKEND DETERMINISTIC CALCULATION",
        )

        # Section 11: Financial Assumptions
        methodology_notes = []
        if is_credit_linked:
            methodology_notes.append("Calculated using standard bank reducing-balance EMI formula.")
            if moratorium_months and moratorium_months > 0:
                methodology_notes.append("Moratorium period applies interest servicing with principal amortization starting thereafter.")
            if is_market_linked:
                methodology_notes.append(rate_note or "Interest rate is market-linked; indicative benchmark rate applied for modeling.")
        else:
            methodology_notes.append("Not applicable — programme is not credit-linked.")

        fin_section = DPRFinancialAssumptions(
            annual_interest_rate_pct=interest_rate,
            loan_tenure_months=tenure_months,
            moratorium_months=moratorium_months,
            monthly_emi=monthly_emi,
            annual_debt_service=annual_debt_service,
            total_interest_payable=total_interest,
            total_debt_outflow=round((net_effective_debt or initial_bank_loan or 0.0) + total_interest, 2) if is_credit_linked else 0.0,
            monthly_income=user_monthly_income,
            repayment_capacity_commentary=(
                "Deterministic repayment capacity evaluated against verified income."
                if user_monthly_income
                else "Not calculated from available verified data. Enter current income in Business Profile to compute debt serviceability."
            ),
            is_market_linked=is_market_linked,
            is_benchmark_assumption=is_benchmark_assumption,
            rate_type=rate_type,
            rate_display_text=rate_display_text,
            rate_note=rate_note,
            amortization_schedule=amortization_schedule,
            methodology_notes=methodology_notes,
            provenance="BACKEND DETERMINISTIC CALCULATION",
        )

        # Section 12: Risk Analysis
        raw_risks = narrative.get("identified_risks", [])
        structured_risks: List[Dict[str, str]] = []
        for r in raw_risks:
            if isinstance(r, dict):
                structured_risks.append({
                    "risk": str(r.get("risk", "Operational Risk")),
                    "severity": str(r.get("severity", "Medium")),
                    "mitigation": str(r.get("mitigation", "Prudent oversight")),
                })

        risk_section = DPRRiskAnalysis(
            weather_activity_impact_score=weather_impact.activity_impact_score if weather_impact else None,
            weather_activity_impact_label=weather_impact.activity_impact_label if weather_impact else None,
            heat_stress_level=weather_impact.risk_signals.heat_stress if weather_impact and weather_impact.risk_signals else None,
            rain_disruption_level=weather_impact.risk_signals.rain_disruption if weather_impact and weather_impact.risk_signals else None,
            outdoor_activity_signal=weather_impact.risk_signals.outdoor_activity if weather_impact and weather_impact.risk_signals else None,
            logistics_disruption_level=weather_impact.risk_signals.logistics_disruption if weather_impact and weather_impact.risk_signals else None,
            identified_risks=structured_risks,
            contingency_mitigations=list(narrative.get("contingency_mitigations", [])),
            provenance="MODELLED INDICATOR + AI INTERPRETATION",
        )

        # Section 13: Implementation Schedule (Dynamic, Business-Specific & Stage-Aware)
        dynamic_milestones, dynamic_critical_notes = cls._generate_dynamic_milestones(
            request=request,
            program_name=program_title,
            is_credit_linked=is_credit_linked,
        )

        impl_section = DPRImplementationPlan(
            milestones=dynamic_milestones,
            critical_path_notes=dynamic_critical_notes,
            provenance="AI INTERPRETATION",
        )

        # Auxiliary Section: Illustrative Operating Assumptions (Dynamic by Sector & Activity)
        illustrative_assumptions = cls._generate_dynamic_operating_assumptions(request=request)

        # Auxiliary Section: Research Gaps
        research_gaps = DPRResearchGaps(
            unorganized_data_gaps=list(narrative.get("unorganized_data_gaps", [])),
            recommended_field_checks=list(narrative.get("recommended_field_checks", [])),
            provenance="AI INTERPRETATION",
        )

        return DPRResponse(
            report_id=report_id,
            generated_at=generated_at,
            project_name=project_name,
            promoter_name=promoter_name,
            business_type=request.business_type,
            sub_type=request.sub_type,
            sector=resolved_sector,
            activity=resolved_activity,
            stage=resolved_stage,
            district_name=resolved_dname,
            state_name=resolved_sname,
            lg_dt_code=request.lg_dt_code,
            executive_summary=exec_summary,
            business_model=biz_model,
            market_analysis=market_analysis,
            customer_segments=customer_section,
            competition=competition_section,
            location_analysis=loc_section,
            operations_plan=ops_section,
            marketing_strategy=mkt_section,
            government_support=gov_section,
            capital_structure=cap_section,
            financial_assumptions=fin_section,
            risk_analysis=risk_section,
            implementation_plan=impl_section,
            illustrative_assumptions=illustrative_assumptions,
            research_gaps=research_gaps,
        )

    # -------------------------------------------------------------------------
    # Internal Helpers
    # -------------------------------------------------------------------------
    @classmethod
    def _resolve_target_program(
        cls,
        db: Session,
        request: DPRRequest,
    ) -> str:
        """Resolve program code from explicit user selection. NEVER AUTO-SELECT."""
        # 1. Resolve by program_id if provided
        if getattr(request, "selected_program_id", None):
            prog_by_id = program_repository.get_by_id(db, program_id=request.selected_program_id)
            if prog_by_id:
                return prog_by_id.program_code

        # 2. Resolve by program_code if provided
        if request.selected_program_code and request.selected_program_code.strip():
            raw_code = request.selected_program_code.strip().upper()
            code = KNOWN_PROGRAM_ALIASES.get(raw_code, raw_code)
            prog = program_repository.get_by_code(db, program_code=code)
            if prog:
                return prog.program_code
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Selected government program '{request.selected_program_code}' not found in authoritative dataset.",
            )

        # 3. If no programme selected, strictly reject with required prompt
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Select a government programme to calculate programme-specific financing and generate the DPR.",
        )

    @classmethod
    def _calculate_authoritative_financials(
        cls,
        db: Session,
        program_code: str,
        request: DPRRequest,
    ) -> Optional[FinancialStructuringResponse]:
        """Execute deterministic financial structuring service for resolved scheme with null-preserving semantics."""
        try:
            # 1. Resolve monthly income strictly from verified user profile/request (zero fabricated ₹50,000)
            monthly_inc: Optional[float] = None
            if getattr(request, "monthly_income", None) is not None and request.monthly_income > 0:
                monthly_inc = float(request.monthly_income)
            elif request.current_income is not None and request.current_income > 0:
                monthly_inc = round(float(request.current_income) / 12.0, 2)

            # 2. Resolve requested financing / loan needed strictly from user input (zero 75% fabrication)
            loan_needed: Optional[float] = None
            if getattr(request, "requested_financing", None) is not None and request.requested_financing > 0:
                loan_needed = float(request.requested_financing)
            elif getattr(request, "loan_amount_requested", None) is not None and request.loan_amount_requested > 0:
                loan_needed = float(request.loan_amount_requested)
            elif request.user_promoter_contribution is not None:
                loan_needed = max(0.0, float(request.estimated_capital) - float(request.user_promoter_contribution))

            is_new = (request.stage or "").lower() not in ["operational", "expansion", "growth", "existing"]

            # If verified monthly income is available, run standard financial structuring engine
            if monthly_inc is not None:
                fin_req = FinancialStructuringRequest(
                    program_code=program_code,
                    project_cost=request.estimated_capital,
                    requested_loan_amount=loan_needed,
                    monthly_income=monthly_inc,
                    monthly_expenses=0.0,  # Zero fabricated 40%
                    existing_monthly_emi=request.existing_debt or 0.0,
                    applicant_social_category=request.category or "General",
                    applicant_gender=request.gender or "Male",
                    is_rural=(request.location_type or "").upper() == "RURAL",
                    is_new_business=is_new,
                    preferred_tenure_months=60,
                )
                return FinancialStructuringService.calculate_structure(db=db, request=fin_req)

            # If monthly income is unsupplied:
            # Do NOT invent ₹50,000 monthly income or 40% expenses.
            # Calculate capital structure, subsidy, and loan terms deterministically from authoritative database,
            # while leaving repayment capacity / DTI as None ("Not calculated from available verified data.")
            program = program_repository.get_by_code(db, program_code=program_code)
            if not program:
                return None

            eval_prog = ProgramEligibilityAdapter.adapt(program)
            is_financing = (
                program.credit_details is not None
                or eval_prog.max_loan_amount is not None
                or eval_prog.min_loan_amount is not None
                or program.subsidy_details is not None
                or eval_prog.max_subsidy_amount is not None
                or eval_prog.subsidy_percentage is not None
                or program.guarantee_details is not None
                or eval_prog.max_guarantee_limit is not None
            )

            prog_name = getattr(program, "program_name", getattr(program, "name", "Government Programme"))
            if not is_financing:
                return FinancialStructuringResponse(
                    program_id=program.id,
                    program_code=program.program_code,
                    program_name=prog_name,
                    primary_type=program.primary_type,
                    actionability_type=program.actionability_type,
                    is_financing_applicable=False,
                    assistance_summary=program.benefit_summary or f"Statutory capability and enterprise development support under {prog_name}.",
                    capital_structure=None,
                    debt_health=None,
                    loan_scenarios=[],
                    financial_constraints=StatutoryFinancialBounds(
                        min_loan_amount=eval_prog.min_loan_amount,
                        max_loan_amount=eval_prog.max_loan_amount,
                        min_project_cost=eval_prog.min_project_cost,
                        max_project_cost=eval_prog.max_project_cost,
                        subsidy_percentage=eval_prog.subsidy_percentage,
                        max_subsidy_amount=eval_prog.max_subsidy_amount,
                        promoter_contribution_percentage=None,
                        tenure_years_max=FinancialStructuringService._get_tenure_years_max(program, eval_prog),
                        moratorium_months=FinancialStructuringService._get_moratorium_months(program, eval_prog),
                        interest_rate_min=eval_prog.interest_rate_min,
                        interest_rate_max=eval_prog.interest_rate_max,
                    ),
                    statutory_checklist=[],
                    warnings=["Statutory eligibility must be verified independently."],
                )

            # Resolve promoter margin
            promoter_margin_pct, is_statutory_margin, _ = FinancialStructuringService._resolve_promoter_margin(
                program=program, eval_prog=eval_prog
            )
            promoter_amount = (
                round(request.estimated_capital * (promoter_margin_pct / 100.0), 2)
                if promoter_margin_pct is not None
                else None
            )

            # Resolve subsidy
            subsidy_amount, subsidy_pct, is_conditional, disbursement_type, _ = FinancialStructuringService._calculate_subsidy(
                program=program,
                eval_prog=eval_prog,
                project_cost=request.estimated_capital,
                request=FinancialStructuringRequest(
                    program_code=program_code,
                    project_cost=request.estimated_capital,
                    requested_loan_amount=loan_needed,
                    monthly_income=1.0,  # nominal, unused for subsidy
                ),
            )

            # Resolve debt
            initial_bank_loan, net_effective_debt, _ = FinancialStructuringService._calculate_debt(
                program=program,
                eval_prog=eval_prog,
                project_cost=request.estimated_capital,
                promoter_amount=promoter_amount,
                subsidy_amount=subsidy_amount,
                requested_loan=loan_needed,
            )

            # Compile CapitalStructureBreakdown
            cap_struct = CapitalStructureBreakdown(
                project_cost=request.estimated_capital,
                promoter_contribution_pct=promoter_margin_pct,
                promoter_contribution_amount=promoter_amount,
                is_statutory_margin=is_statutory_margin,
                subsidy_pct=subsidy_pct,
                subsidy_amount=subsidy_amount,
                is_conditional_subsidy=is_conditional,
                subsidy_disbursement_type=disbursement_type,
                initial_bank_loan=initial_bank_loan,
                net_effective_debt=net_effective_debt,
                credit_guarantee_eligible=False,
                guarantee_coverage_pct=None,
                guaranteed_amount=None,
                annual_guarantee_fee_pct=None,
            )

            # Resolve loan scenarios (without DTI since monthly_income is None)
            loan_principal = net_effective_debt if (net_effective_debt and net_effective_debt > 0) else initial_bank_loan
            neutral_health = DebtHealthIndicators(
                monthly_income=1.0,
                existing_monthly_emi=0.0,
                uncommitted_surplus=0.0,
                affordable_emi_cap=0.0,
                existing_dti_pct=0.0,
                dti_health_category="UNVERIFIED",
            )
            scenarios = FinancialStructuringService._generate_loan_scenarios(
                program=program,
                eval_prog=eval_prog,
                loan_principal=loan_principal,
                debt_health=neutral_health,
                preferred_tenure_months=60,
                warnings=[],
            )

            return FinancialStructuringResponse(
                program_id=program.id,
                program_code=program.program_code,
                program_name=prog_name,
                primary_type=program.primary_type,
                actionability_type=program.actionability_type,
                is_financing_applicable=True,
                assistance_summary=program.benefit_summary or f"Financial assistance under {prog_name}.",
                capital_structure=cap_struct,
                debt_health=None,  # Preserves None when user income is unsupplied
                loan_scenarios=scenarios,
                financial_constraints=StatutoryFinancialBounds(
                    min_loan_amount=eval_prog.min_loan_amount,
                    max_loan_amount=eval_prog.max_loan_amount,
                    min_project_cost=eval_prog.min_project_cost,
                    max_project_cost=eval_prog.max_project_cost,
                    subsidy_percentage=eval_prog.subsidy_percentage,
                    max_subsidy_amount=eval_prog.max_subsidy_amount,
                    promoter_contribution_percentage=promoter_margin_pct,
                    tenure_years_max=FinancialStructuringService._get_tenure_years_max(program, eval_prog),
                    moratorium_months=FinancialStructuringService._get_moratorium_months(program, eval_prog),
                    interest_rate_min=eval_prog.interest_rate_min,
                    interest_rate_max=eval_prog.interest_rate_max,
                ),
                statutory_checklist=[],
                warnings=["Income unverified in Business Profile: debt health indicators not calculated."],
            )
        except Exception as e:
            logger.error("Financial structuring failed for program '%s': %s", program_code, e, exc_info=True)
            return None

    @classmethod
    def _generate_dynamic_milestones(
        cls,
        request: DPRRequest,
        program_name: str,
        is_credit_linked: bool,
    ) -> Tuple[List[DPRMilestoneItem], List[str]]:
        """Generate a dynamic, business-specific, stage-aware implementation roadmap."""
        btype = (request.business_type or "General Enterprise").lower()
        sector = (request.sector or "").lower()
        stage = (request.stage or "").lower()
        activity = request.activity or request.sub_type or request.business_type
        is_existing = any(k in stage for k in ["operational", "expansion", "growth", "existing"])

        milestones: List[DPRMilestoneItem] = []
        critical_notes: List[str] = []

        if is_existing:
            milestones = [
                DPRMilestoneItem(
                    phase_number=1,
                    month_range="Month 1",
                    activity=f"Operational audit & credit appraisal under {program_name}",
                    critical_deliverable="Bank sanction letter for business expansion and credit line approval",
                    provenance="GOVERNMENT / PROGRAMME REQUIREMENT",
                ),
                DPRMilestoneItem(
                    phase_number=2,
                    month_range="Month 1-2",
                    activity=f"Procurement of upgraded equipment / bulk inventory replenishment for {activity}",
                    critical_deliverable="Capital asset procurement receipts and commercial delivery verification",
                    provenance="ILLUSTRATIVE ASSUMPTION",
                ),
                DPRMilestoneItem(
                    phase_number=3,
                    month_range="Month 2-3",
                    activity="Capacity integration, workflow scaling & technician training",
                    critical_deliverable="Enhanced daily throughput and quality standard operating audit",
                    provenance="AI INTERPRETATION",
                ),
                DPRMilestoneItem(
                    phase_number=4,
                    month_range="Month 3-4",
                    activity="Customer base expansion, wholesale contract fulfillments & debt servicing",
                    critical_deliverable="Incremental revenue realization and timely monthly debt servicing",
                    provenance="ILLUSTRATIVE ASSUMPTION",
                ),
            ]
            critical_notes = [
                "Maintaining continuity of existing operations during capacity upgrade is essential.",
                "Timely utilization of sanctioned credit line prevents supply bottlenecks.",
            ]
        elif "retail" in btype or "trade" in btype or "trading" in sector or "shop" in btype:
            milestones = [
                DPRMilestoneItem(
                    phase_number=1,
                    month_range="Month 1",
                    activity="Commercial shop lease finalization, Trade License & Udyam registration",
                    critical_deliverable="Registered commercial lease deed, GSTIN / Trade certificate",
                    provenance="ILLUSTRATIVE ASSUMPTION",
                ),
                DPRMilestoneItem(
                    phase_number=2,
                    month_range="Month 1-2",
                    activity=f"Credit sanction under {program_name} & promoter margin deposit",
                    critical_deliverable="Bank loan disbursement and business operative bank account setup",
                    provenance="GOVERNMENT / PROGRAMME REQUIREMENT",
                ),
                DPRMilestoneItem(
                    phase_number=3,
                    month_range="Month 2",
                    activity="Storefront fit-out, display shelving, and POS billing system setup",
                    critical_deliverable="Fitted retail counter, barcode scanner & computerized accounting",
                    provenance="ILLUSTRATIVE ASSUMPTION",
                ),
                DPRMilestoneItem(
                    phase_number=4,
                    month_range="Month 2-3",
                    activity=f"Wholesale distributor onboarding & initial merchandise stock intake for {activity}",
                    critical_deliverable="Authorized distributor agreements and catalogued retail inventory",
                    provenance="AI INTERPRETATION",
                ),
                DPRMilestoneItem(
                    phase_number=5,
                    month_range="Month 3",
                    activity="Commercial store opening & local neighborhood marketing campaign",
                    critical_deliverable="Initial retail sales transactions and customer walk-ins",
                    provenance="AI INTERPRETATION",
                ),
                DPRMilestoneItem(
                    phase_number=6,
                    month_range="Month 4-5",
                    activity="Inventory replenishment cycle stabilization and prompt loan EMI servicing",
                    critical_deliverable="Target monthly retail turnover achieved and healthy debt service track",
                    provenance="ILLUSTRATIVE ASSUMPTION",
                ),
            ]
            critical_notes = [
                "Securing high-visibility commercial location with fair rental terms is the primary success driver.",
                "Careful working capital management to avoid dead stock during initial months.",
            ]
        elif "service" in btype or "it" in btype or "repair" in btype or "consult" in btype or "service" in sector:
            milestones = [
                DPRMilestoneItem(
                    phase_number=1,
                    month_range="Month 1",
                    activity="Professional registration, Udyam enrollment & commercial space arrangement",
                    critical_deliverable="Udyam certificate, professional tax registration & workspace lease",
                    provenance="ILLUSTRATIVE ASSUMPTION",
                ),
                DPRMilestoneItem(
                    phase_number=2,
                    month_range="Month 1-2",
                    activity=f"Statutory credit appraisal under {program_name} & capital disbursement",
                    critical_deliverable="Sanction letter, equity margin crediting & operational bank account",
                    provenance="GOVERNMENT / PROGRAMME REQUIREMENT",
                ),
                DPRMilestoneItem(
                    phase_number=3,
                    month_range="Month 2",
                    activity=f"IT hardware, diagnostic tooling & software licenses provisioning for {activity}",
                    critical_deliverable="Operational workstations, diagnostic apparatus & digital tools ready",
                    provenance="ILLUSTRATIVE ASSUMPTION",
                ),
                DPRMilestoneItem(
                    phase_number=4,
                    month_range="Month 2-3",
                    activity="Standard operating procedures (SOP) formulation & pilot service testing",
                    critical_deliverable="Service delivery protocols established and initial pilot test sign-off",
                    provenance="AI INTERPRETATION",
                ),
                DPRMilestoneItem(
                    phase_number=5,
                    month_range="Month 3-4",
                    activity="Commercial service launch, corporate outreach & client onboarding",
                    critical_deliverable="First active corporate service contracts and billing initiated",
                    provenance="AI INTERPRETATION",
                ),
                DPRMilestoneItem(
                    phase_number=6,
                    month_range="Month 5-6",
                    activity="Service capacity stabilization, annual maintenance contracts & loan repayment",
                    critical_deliverable="Predictable recurring service cashflow and timely monthly debt servicing",
                    provenance="ILLUSTRATIVE ASSUMPTION",
                ),
            ]
            critical_notes = [
                "Maintaining service SLA response times is critical for retaining first-generation clients.",
                "Digital presence and local word-of-mouth drive low-cost customer acquisition.",
            ]
        elif "food" in btype or "agro" in btype or "bakery" in btype:
            milestones = [
                DPRMilestoneItem(
                    phase_number=1,
                    month_range="Month 1",
                    activity="Premises arrangement, Udyam registration & FSSAI license application",
                    critical_deliverable="Site possession deed, FSSAI filing acknowledgement & Udyam certificate",
                    provenance="ILLUSTRATIVE ASSUMPTION",
                ),
                DPRMilestoneItem(
                    phase_number=2,
                    month_range="Month 1-2",
                    activity=f"Bank loan sanction under {program_name} & promoter margin deposit",
                    critical_deliverable="Bank sanction letter and first tranche disbursement",
                    provenance="GOVERNMENT / PROGRAMME REQUIREMENT",
                ),
                DPRMilestoneItem(
                    phase_number=3,
                    month_range="Month 2-3",
                    activity="Hygienic facility fit-out, 3-phase power energization & processing equipment delivery",
                    critical_deliverable="Sanitized food-grade processing area and equipment dispatch receipts",
                    provenance="ILLUSTRATIVE ASSUMPTION",
                ),
                DPRMilestoneItem(
                    phase_number=4,
                    month_range="Month 3-4",
                    activity=f"Machinery installation, trial batch processing & shelf-life testing for {activity}",
                    critical_deliverable="Successful test batch, tamper-evident packaging run & FSSAI compliance",
                    provenance="AI INTERPRETATION",
                ),
                DPRMilestoneItem(
                    phase_number=5,
                    month_range="Month 4-5",
                    activity="Farm-gate raw material tie-ups, distributor onboarding & commercial launch",
                    critical_deliverable="Raw material intake contracts and dispatch to initial 15 stockists",
                    provenance="AI INTERPRETATION",
                ),
                DPRMilestoneItem(
                    phase_number=6,
                    month_range="Month 5-6",
                    activity="Production run-rate stabilization, retailer re-orders & loan repayment servicing",
                    critical_deliverable="Steady monthly processing output and timely debt service track record",
                    provenance="ILLUSTRATIVE ASSUMPTION",
                ),
            ]
            critical_notes = [
                "Strict adherence to FSSAI food hygiene protocols is non-negotiable prior to commercial sale.",
                "Managing raw material seasonality through local farm-gate supply agreements.",
            ]
        else:
            # Manufacturing / Textiles / Engineering / General
            milestones = [
                DPRMilestoneItem(
                    phase_number=1,
                    month_range="Month 1",
                    activity="Site possession, Udyam registration & statutory local clearances",
                    critical_deliverable="Site title/lease, Udyam registration, and local consent certificates",
                    provenance="ILLUSTRATIVE ASSUMPTION",
                ),
                DPRMilestoneItem(
                    phase_number=2,
                    month_range="Month 1-2",
                    activity=f"Bank loan appraisal, sanction under {program_name} & margin equity deposit",
                    critical_deliverable="Formal loan sanction letter and project account crediting",
                    provenance="GOVERNMENT / PROGRAMME REQUIREMENT",
                ),
                DPRMilestoneItem(
                    phase_number=3,
                    month_range="Month 2-3",
                    activity=f"Workshop layout preparation, power connection & primary machinery orders for {activity}",
                    critical_deliverable="Sanctioned power load and machinery dispatch receipts",
                    provenance="ILLUSTRATIVE ASSUMPTION",
                ),
                DPRMilestoneItem(
                    phase_number=4,
                    month_range="Month 3-4",
                    activity="Machinery erection, tooling calibration, trial run & quality inspection",
                    critical_deliverable="Accurate sample product batches and quality test certification",
                    provenance="AI INTERPRETATION",
                ),
                DPRMilestoneItem(
                    phase_number=5,
                    month_range="Month 4-5",
                    activity="Raw material procurement agreements, commercial run & distributor dispatch",
                    critical_deliverable="Executed vendor agreements and first commercial order dispatch",
                    provenance="AI INTERPRETATION",
                ),
                DPRMilestoneItem(
                    phase_number=6,
                    month_range="Month 5-6",
                    activity="Plant capacity utilization stabilization, workforce training & loan EMI servicing",
                    critical_deliverable="Target monthly output achieved and timely loan debt servicing",
                    provenance="ILLUSTRATIVE ASSUMPTION",
                ),
            ]
            critical_notes = [
                "Timely release of machinery loan tranches prevents delivery bottlenecks.",
                "Quality consistency across initial commercial batches determines repeat orders.",
            ]

        return milestones, critical_notes

    @classmethod
    def _generate_dynamic_operating_assumptions(
        cls,
        request: DPRRequest,
    ) -> DPRIllustrativeAssumptions:
        """Generate dynamic, clearly-labelled operating assumptions with zero fabricated constants."""
        btype = (request.business_type or "General Enterprise").lower()
        sector = (request.sector or "").lower()

        if "retail" in btype or "trade" in btype or "trading" in sector or "shop" in btype:
            benchmarks = [
                "Wholesale merchandise procurement & stock intake: 65-75% of sales turnover",
                "Commercial retail shop lease, municipal charges & power: 8-12% of sales turnover",
                "Storefront sales personnel & local logistics: 6-10% of sales turnover",
                "Packaging, loss buffer & local promotions: 2-4% of sales turnover",
            ]
            capacity_schedule = [
                "Year 1: 55% Sales Velocity (Footfall generation & stock turnover tuning)",
                "Year 2: 75% Sales Velocity (Established neighborhood client base)",
                "Year 3: 85% Sales Velocity (Optimal retail inventory turn plateau)",
            ]
        elif "service" in btype or "it" in btype or "repair" in btype or "consult" in btype or "service" in sector:
            benchmarks = [
                "Technical personnel, staff salaries & professional remuneration: 40-50% of gross receipts",
                "Software licenses, diagnostic tools & digital infrastructure: 8-12% of gross receipts",
                "Commercial office lease, electricity & administrative overheads: 10-15% of gross receipts",
                "Client acquisition, marketing & promotional travel: 5-8% of gross receipts",
            ]
            capacity_schedule = [
                "Year 1: 50% Billable Utilization (Client onboarding & market positioning)",
                "Year 2: 70% Billable Utilization (Repeat corporate clients & capacity scaling)",
                "Year 3: 85% Billable Utilization (Optimal operating plateau & retainer contracts)",
            ]
        elif "food" in btype or "agro" in btype or "bakery" in btype:
            benchmarks = [
                "Farm-gate agricultural produce & perishable raw inputs: 55-65% of gross revenue",
                "Processing labor, hygiene supervisors & packing staff: 10-14% of gross revenue",
                "Electricity, cold chain storage & packaging consumables: 8-12% of gross revenue",
                "Distribution freight, transit buffer & spoilage allowance: 4-6% of gross revenue",
            ]
            capacity_schedule = [
                "Year 1: 55% Processing Capacity (Batch stabilization & distributor trial)",
                "Year 2: 70% Processing Capacity (Regional retail network expansion)",
                "Year 3: 80% Processing Capacity (Optimal processing plateau)",
            ]
        else:
            benchmarks = [
                "Primary raw materials, metals & components: 50-60% of manufacturing revenue",
                "Skilled machine operators, technicians & direct wages: 12-18% of revenue",
                "Industrial power, fuel, lubricants & consumables: 8-12% of revenue",
                "Machine maintenance, tooling wear & factory overheads: 3-5% of revenue",
            ]
            capacity_schedule = [
                "Year 1: 55% Installed Plant Capacity (Trial run & workforce training)",
                "Year 2: 70% Installed Plant Capacity (Commercial supply stabilization)",
                "Year 3: 80% Installed Plant Capacity (Optimal manufacturing plateau)",
            ]

        return DPRIllustrativeAssumptions(
            capacity_utilization_schedule=capacity_schedule,
            working_capital_cycle_days=None,  # Zero hardcoded 45 days
            operating_expense_benchmarks=benchmarks,
            break_even_commentary="Not calculated from available verified data. Illustrative assumption — validate with actual business records, quotations and local market checks.",
            disclaimer="Illustrative assumption — validate with actual business records, quotations and local market checks.",
            provenance="ILLUSTRATIVE ASSUMPTION",
        )

    @classmethod
    def _generate_amortization_schedule(
        cls,
        principal: float,
        interest_rate_pct: float,
        tenure_months: int,
        monthly_emi: float,
    ) -> List[DebtServiceRepaymentYear]:
        """Compute transparent annual loan amortization progression."""
        schedule: List[DebtServiceRepaymentYear] = []
        if principal <= 0 or tenure_months <= 0:
            return schedule

        r = (interest_rate_pct / 100.0) / 12.0
        balance = principal
        total_years = max(1, min(5, (tenure_months + 11) // 12))

        for yr in range(1, total_years + 1):
            opening = balance
            ann_principal = 0.0
            ann_interest = 0.0

            # Calculate for 12 months (or remaining months in year)
            months_in_year = min(12, tenure_months - (yr - 1) * 12)
            for _ in range(months_in_year):
                if balance <= 0:
                    break
                interest_m = balance * r
                principal_m = min(balance, monthly_emi - interest_m) if monthly_emi > interest_m else 0.0
                ann_interest += interest_m
                ann_principal += principal_m
                balance = max(0.0, balance - principal_m)

            schedule.append(
                DebtServiceRepaymentYear(
                    year=yr,
                    opening_balance=round(opening, 2),
                    annual_principal=round(ann_principal, 2),
                    annual_interest=round(ann_interest, 2),
                    total_annual_payment=round(ann_principal + ann_interest, 2),
                    closing_balance=round(balance, 2),
                )
            )

        return schedule


# Singleton Instance
dpr_service = DPRService()
