from sqlalchemy import Column, Integer, String, Text, Boolean, DECIMAL
from database import Base


class Schemes(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True)

    # Basic information
    name = Column(String(255), nullable=False)
    description = Column(Text)
    ministry = Column(String(255))

    # Classification
    scheme_type = Column(String(100))
    category = Column(String(100))
    target_group = Column(String(255))
    business_type = Column(String(255))
    sector = Column(String(100))
    state = Column(String(100))

    # Eligibility
    target_gender = Column(String(50))
    min_age = Column(Integer)
    max_age = Column(Integer)
    rural_only = Column(Boolean)
    income_limit = Column(DECIMAL(12, 2))

    # Project / loan structure
    min_project_cost = Column(DECIMAL(12, 2))
    max_project_cost = Column(DECIMAL(12, 2))
    loan_percentage = Column(DECIMAL(5, 2))
    min_loan_amount = Column(DECIMAL(12, 2))
    max_loan_amount = Column(DECIMAL(12, 2))
    beneficiary_contribution_percentage = Column(DECIMAL(5, 2))

    # Subsidy
    subsidy_percentage = Column(DECIMAL(5, 2))
    max_subsidy = Column(DECIMAL(12, 2))

    # Repayment
    interest_rate = Column(DECIMAL(5, 2))
    tenure_years = Column(DECIMAL(5, 2))
    moratorium_months = Column(Integer)
    repayment_frequency = Column(String(50))

    # Other requirements
    collateral_required = Column(Boolean)
    new_business_only = Column(Boolean)
    existing_business_allowed = Column(Boolean)

    # Information for the user
    benefit = Column(Text)
    eligibility_text = Column(Text)
    documents_required = Column(Text)
    application_url = Column(Text)

    # Verification
    status = Column(String(50))
    last_verified = Column(String(20))