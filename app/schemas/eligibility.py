from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class UserProfile(BaseModel):
    """User and Enterprise Profile used for deterministic eligibility evaluation."""
    model_config = ConfigDict(extra="ignore")

    # Demographic attributes
    age: Optional[int] = Field(None, ge=14, le=120, description="Applicant age in years")
    gender: Optional[str] = Field(None, description="Applicant gender: Male, Female, Other, Transgender")
    social_category: Optional[str] = Field(None, description="Social category: General, SC, ST, OBC, Minority")
    is_differently_abled: Optional[bool] = Field(None, description="Persons with Disabilities (PwD) status")
    is_ex_serviceman: Optional[bool] = Field(None, description="Ex-servicemen status")

    # Geographic attributes
    state: Optional[str] = Field(None, description="State of operation / residence (e.g., 'Rajasthan', 'Maharashtra')")
    district: Optional[str] = Field(None, description="District name")
    is_rural: Optional[bool] = Field(None, description="True if rural area, False if urban")

    # Economic & financial attributes
    annual_income: Optional[float] = Field(None, ge=0, description="Annual household or individual income in INR")
    project_cost: Optional[float] = Field(None, ge=0, description="Estimated total project or venture cost in INR")
    requested_loan_amount: Optional[float] = Field(None, ge=0, description="Desired loan/financing amount in INR")

    # Business attributes
    is_new_business: Optional[bool] = Field(None, description="True if new enterprise, False if existing")
    sector: Optional[str] = Field(None, description="Primary sector (e.g., Manufacturing, Services, Trading)")
    business_type: Optional[str] = Field(None, description="Specific trade or business description")
    
    # Scheme-specific flags
    previous_tarun_repaid: Optional[bool] = Field(None, description="Has previously repaid a MUDRA Tarun loan")
    is_traditional_artisan: Optional[bool] = Field(None, description="Engaged in recognized traditional handicraft/artisan trade")
    is_street_vendor: Optional[bool] = Field(None, description="Engaged in street vending or informal vending")


class EligibilityResult(BaseModel):
    """Evaluation result for an individual scheme against user profile."""
    model_config = ConfigDict(from_attributes=True)

    scheme_id: int
    scheme_name: str
    scheme_type: Optional[str] = None
    is_eligible: bool
    status: str = Field("Eligible", description="'Eligible', 'Ineligible', or 'Partially Verified'")
    reasons: List[str] = Field(default_factory=list, description="Rules satisfied by the user profile")
    disqualifying_reasons: List[str] = Field(default_factory=list, description="Rules violated by the user profile")
    application_url: Optional[str] = None
    benefit: Optional[str] = None


class EligibilityAssessmentResponse(BaseModel):
    """Complete rule-based eligibility assessment response."""
    total_evaluated: int
    total_eligible: int
    total_ineligible: int
    eligible_schemes: List[EligibilityResult]
    ineligible_schemes: List[EligibilityResult]
