from typing import List, Optional
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.models.scheme import Scheme
from app.schemas.scheme import SchemeQueryParams


class SchemeRepository:
    """Repository handling all database queries for schemes.
    
    Contains pure SQL/ORM operations with no HTTP or business logic.
    """

    @staticmethod
    def get_by_id(db: Session, scheme_id: int) -> Optional[Scheme]:
        """Fetch a single scheme by primary key ID."""
        return db.query(Scheme).filter(Scheme.id == scheme_id).first()

    @staticmethod
    def count(db: Session) -> int:
        """Count total schemes currently in the database."""
        return db.query(Scheme).count()

    @staticmethod
    def get_all(
        db: Session,
        filters: Optional[SchemeQueryParams] = None,
    ) -> List[Scheme]:
        """Query schemes applying optional filters and pagination."""
        query = db.query(Scheme)

        if filters:
            # 1. State filter
            if filters.state:
                state_clean = filters.state.strip().lower()
                if state_clean == "all india" or not filters.include_all_india:
                    query = query.filter(func.lower(Scheme.state).like(f"%{state_clean}%"))
                else:
                    query = query.filter(
                        or_(
                            func.lower(Scheme.state).like(f"%{state_clean}%"),
                            func.lower(Scheme.state) == "all india",
                        )
                    )

            # 2. Sector filter (checks both primary sector and business_type for comprehensive coverage)
            if filters.sector:
                sector_clean = filters.sector.strip().lower()
                query = query.filter(
                    or_(
                        func.lower(Scheme.sector).like(f"%{sector_clean}%"),
                        func.lower(Scheme.business_type).like(f"%{sector_clean}%"),
                    )
                )

            # 3. Scheme Type filter (handles 'Credit' <-> 'loan' synonymy)
            if filters.scheme_type:
                stype_clean = filters.scheme_type.strip().lower()
                if stype_clean in ["credit", "loan"]:
                    query = query.filter(
                        or_(
                            func.lower(Scheme.scheme_type).like("%loan%"),
                            func.lower(Scheme.scheme_type).like("%credit%"),
                        )
                    )
                else:
                    query = query.filter(func.lower(Scheme.scheme_type).like(f"%{stype_clean}%"))

            # 4. Category filter
            if filters.category:
                cat_clean = filters.category.strip().lower()
                query = query.filter(func.lower(Scheme.category).like(f"%{cat_clean}%"))

            # 5. Target group filter
            if filters.target_group:
                tg_clean = filters.target_group.strip().lower()
                query = query.filter(func.lower(Scheme.target_group).like(f"%{tg_clean}%"))

            # 6. Business type filter
            if filters.business_type:
                bt_clean = filters.business_type.strip().lower()
                query = query.filter(func.lower(Scheme.business_type).like(f"%{bt_clean}%"))

            # 7. Target gender filter
            if filters.target_gender:
                gender_clean = filters.target_gender.strip().lower()
                query = query.filter(
                    or_(
                        func.lower(Scheme.target_gender).like(f"%{gender_clean}%"),
                        func.lower(Scheme.target_gender) == "all",
                    )
                )

            # 8. Rural only boolean filter
            if filters.rural_only is not None:
                query = query.filter(Scheme.rural_only == filters.rural_only)

        query = query.order_by(Scheme.id.asc())

        if filters:
            # Pagination
            query = query.offset(filters.skip).limit(filters.limit)

        return query.all()


scheme_repository = SchemeRepository()
