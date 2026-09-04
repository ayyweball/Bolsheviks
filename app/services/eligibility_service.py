from typing import List, Tuple
from sqlalchemy.orm import Session
from app.models.scheme import Scheme
from app.repositories.scheme_repository import scheme_repository
from app.schemas.eligibility import (
    UserProfile,
    EligibilityResult,
    EligibilityAssessmentResponse,
)


class EligibilityService:
    """Deterministic, rule-based eligibility evaluation engine.
    
    Operates strictly on statutory criteria, verified rules, and thresholds.
    Completely isolated from ML ranking and LLM explanation services.
    """

    @classmethod
    def evaluate_scheme(cls, scheme: Scheme, profile: UserProfile) -> EligibilityResult:
        """Evaluate a single scheme against a user/business profile."""
        reasons: List[str] = []
        disqualifying_reasons: List[str] = []

        # 1. Age Verification
        if profile.age is not None:
            if scheme.min_age is not None and profile.age < scheme.min_age:
                disqualifying_reasons.append(
                    f"Applicant age ({profile.age}) is below minimum requirement of {scheme.min_age} years"
                )
            elif scheme.max_age is not None and profile.age > scheme.max_age:
                disqualifying_reasons.append(
                    f"Applicant age ({profile.age}) exceeds maximum ceiling of {scheme.max_age} years"
                )
            else:
                if scheme.min_age is not None or scheme.max_age is not None:
                    reasons.append(
                        f"Applicant age ({profile.age}) satisfies age range ({scheme.min_age or 'None'} to {scheme.max_age or 'No limit'})"
                    )

        # 2. Rural / Urban Location Check
        if profile.is_rural is not None and scheme.rural_only:
            if not profile.is_rural:
                disqualifying_reasons.append("Scheme is exclusively reserved for rural enterprise locations")
            else:
                reasons.append("Location satisfies rural requirement")

        # 3. Annual / Family Income Check
        if profile.annual_income is not None and scheme.income_limit is not None:
            income_limit_val = float(scheme.income_limit)
            if profile.annual_income > income_limit_val:
                disqualifying_reasons.append(
                    f"Annual income (₹{profile.annual_income:,.2f}) exceeds scheme ceiling of ₹{income_limit_val:,.2f}"
                )
            else:
                reasons.append(
                    f"Annual income (₹{profile.annual_income:,.2f}) is within eligible limit (₹{income_limit_val:,.2f})"
                )

        # 4. Business Stage Check (New vs Existing)
        if profile.is_new_business is not None:
            if not profile.is_new_business and scheme.new_business_only:
                disqualifying_reasons.append("Scheme is available exclusively for setting up new enterprises")
            elif profile.is_new_business and not scheme.existing_business_allowed:
                disqualifying_reasons.append("Scheme is available only for established existing enterprises")
            else:
                stage_desc = "new business" if profile.is_new_business else "existing business"
                reasons.append(f"Enterprise stage ({stage_desc}) is eligible under scheme terms")

        # 5. Project Cost Check
        if profile.project_cost is not None:
            if scheme.min_project_cost is not None and profile.project_cost < float(scheme.min_project_cost):
                disqualifying_reasons.append(
                    f"Project cost (₹{profile.project_cost:,.2f}) is below scheme threshold of ₹{float(scheme.min_project_cost):,.2f}"
                )
            elif scheme.max_project_cost is not None and profile.project_cost > float(scheme.max_project_cost):
                disqualifying_reasons.append(
                    f"Project cost (₹{profile.project_cost:,.2f}) exceeds scheme ceiling of ₹{float(scheme.max_project_cost):,.2f}"
                )
            else:
                reasons.append(f"Project cost (₹{profile.project_cost:,.2f}) is within eligible bounds")

        # 6. Requested Loan Amount Check
        if profile.requested_loan_amount is not None:
            if scheme.min_loan_amount is not None and profile.requested_loan_amount < float(scheme.min_loan_amount):
                disqualifying_reasons.append(
                    f"Requested loan (₹{profile.requested_loan_amount:,.2f}) is below minimum loan amount (₹{float(scheme.min_loan_amount):,.2f})"
                )
            elif scheme.max_loan_amount is not None and profile.requested_loan_amount > float(scheme.max_loan_amount):
                disqualifying_reasons.append(
                    f"Requested loan (₹{profile.requested_loan_amount:,.2f}) exceeds maximum loan amount (₹{float(scheme.max_loan_amount):,.2f})"
                )
            else:
                reasons.append(f"Requested loan (₹{profile.requested_loan_amount:,.2f}) is within acceptable range")

        # 7. State Applicability
        if profile.state and scheme.state:
            scheme_state = scheme.state.strip().lower()
            user_state = profile.state.strip().lower()
            if scheme_state != "all india" and user_state not in scheme_state:
                disqualifying_reasons.append(
                    f"Scheme is designated for {scheme.state}, but applicant is in {profile.state}"
                )
            else:
                if scheme_state == "all india":
                    reasons.append("Applicable across all States and Union Territories (Central Scheme)")
                else:
                    reasons.append(f"State location ({profile.state}) matches scheme coverage")

        # 8. Social Category Earmarking
        if scheme.target_group and "scheduled caste" in scheme.target_group.lower():
            if profile.social_category:
                cat = profile.social_category.strip().upper()
                if cat not in ["SC", "SCHEDULED CASTE"]:
                    disqualifying_reasons.append(
                        f"Scheme is dedicated to Scheduled Caste (SC) beneficiaries; applicant profile specifies {profile.social_category}"
                    )
                else:
                    reasons.append("Applicant satisfies Scheduled Caste criteria")

        # 9. Scheme Specific Conditions
        # PM MUDRA Tarun Plus requires repaid Tarun loan
        if scheme.id == 4 or "tarun plus" in scheme.name.lower():
            if profile.previous_tarun_repaid is False:
                disqualifying_reasons.append("Requires prior availing and successful repayment of a MUDRA Tarun loan")
            elif profile.previous_tarun_repaid is True:
                reasons.append("Applicant has confirmed prior repayment of MUDRA Tarun loan")

        # PM Vishwakarma requires artisan trade
        if scheme.id == 7 or "vishwakarma" in scheme.name.lower():
            if profile.is_traditional_artisan is False:
                disqualifying_reasons.append("Exclusively for traditional artisans and craftspeople working with hands and tools")
            elif profile.is_traditional_artisan is True:
                reasons.append("Applicant is a recognized traditional artisan/craftsperson")

        # PM SVANidhi requires street vending
        if scheme.id == 8 or "svanidhi" in scheme.name.lower():
            if profile.is_street_vendor is False:
                disqualifying_reasons.append("Exclusively for urban street vendors and hawkers")
            elif profile.is_street_vendor is True:
                reasons.append("Applicant is an identified street vendor")

        is_eligible = len(disqualifying_reasons) == 0
        status = "Eligible" if is_eligible else "Ineligible"

        return EligibilityResult(
            scheme_id=scheme.id,
            scheme_name=scheme.name,
            scheme_type=scheme.scheme_type,
            is_eligible=is_eligible,
            status=status,
            reasons=reasons,
            disqualifying_reasons=disqualifying_reasons,
            application_url=scheme.application_url,
            benefit=scheme.benefit,
        )

    @classmethod
    def evaluate_all(
        cls,
        db: Session,
        profile: UserProfile,
    ) -> EligibilityAssessmentResponse:
        """Evaluate user profile against all active schemes in the database."""
        schemes = scheme_repository.get_all(db)
        eligible_schemes: List[EligibilityResult] = []
        ineligible_schemes: List[EligibilityResult] = []

        for s in schemes:
            result = cls.evaluate_scheme(s, profile)
            if result.is_eligible:
                eligible_schemes.append(result)
            else:
                ineligible_schemes.append(result)

        return EligibilityAssessmentResponse(
            total_evaluated=len(schemes),
            total_eligible=len(eligible_schemes),
            total_ineligible=len(ineligible_schemes),
            eligible_schemes=eligible_schemes,
            ineligible_schemes=ineligible_schemes,
        )


eligibility_service = EligibilityService()
