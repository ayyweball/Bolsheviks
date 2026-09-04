from fastapi import status
from fastapi.testclient import TestClient


def test_get_all_schemes(client: TestClient):
    """Test 4: GET /api/v1/schemes returns all 12 schemes as Pydantic models."""
    response = client.get("/api/v1/schemes")
    assert response.status_code == status.HTTP_200_OK
    schemes = response.json()
    assert isinstance(schemes, list)
    assert len(schemes) == 12

    # Verify schema structure of first scheme
    first_scheme = schemes[0]
    assert "id" in first_scheme
    assert "name" in first_scheme
    assert "ministry" in first_scheme
    assert "scheme_type" in first_scheme
    assert "state" in first_scheme


def test_get_scheme_by_id(client: TestClient):
    """Test 5: GET /api/v1/schemes/{id} returns specific scheme details."""
    response = client.get("/api/v1/schemes/1")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == 1
    assert "PM MUDRA - Shishu" in data["name"]
    assert data["ministry"] == "Ministry of Finance"
    assert data["scheme_type"] == "loan"
    assert data["max_loan_amount"] == 50000.0


def test_get_scheme_by_id_not_found(client: TestClient):
    """Test 6: GET /api/v1/schemes/{id} returns 404 for nonexistent scheme."""
    response = client.get("/api/v1/schemes/999999")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert data["error"] == "Not Found"
    assert "Scheme with ID 999999 not found" in data["detail"]


def test_state_filtering(client: TestClient):
    """Test 7: State filtering query parameter."""
    # Nationwide schemes apply across all India
    res_all_india = client.get("/api/v1/schemes?state=All India")
    assert res_all_india.status_code == status.HTTP_200_OK
    assert len(res_all_india.json()) == 12

    # Filtering by Rajasthan with include_all_india=True (default) returns all nationwide applicable schemes
    res_rajasthan = client.get("/api/v1/schemes?state=Rajasthan")
    assert res_rajasthan.status_code == status.HTTP_200_OK
    assert len(res_rajasthan.json()) == 12

    # Strict filtering for state without nationwide schemes returns empty list (since all current 12 are Central)
    res_strict = client.get("/api/v1/schemes?state=NonExistentState&include_all_india=false")
    assert res_strict.status_code == status.HTTP_200_OK
    assert len(res_strict.json()) == 0


def test_sector_filtering(client: TestClient):
    """Test 8: Sector filtering query parameter."""
    # Test filtering by Micro Enterprise
    res_micro = client.get("/api/v1/schemes?sector=Micro Enterprise")
    assert res_micro.status_code == status.HTTP_200_OK
    micro_schemes = res_micro.json()
    assert len(micro_schemes) >= 6
    for s in micro_schemes:
        assert (
            "micro" in s["sector"].lower()
            or (s["business_type"] and "micro" in s["business_type"].lower())
        )

    # Test filtering by Artisan
    res_artisan = client.get("/api/v1/schemes?sector=Artisan Enterprise")
    assert res_artisan.status_code == status.HTTP_200_OK
    artisan_schemes = res_artisan.json()
    assert len(artisan_schemes) >= 1
    assert any("Vishwakarma" in s["name"] for s in artisan_schemes)

    # Test filtering by Manufacturing (matched via business activity)
    res_mfg = client.get("/api/v1/schemes?sector=Manufacturing")
    assert res_mfg.status_code == status.HTTP_200_OK
    mfg_schemes = res_mfg.json()
    assert len(mfg_schemes) > 0


def test_multiple_filters(client: TestClient):
    """Test 9: Combining multiple query parameter filters."""
    # Sector = Micro Enterprise AND scheme_type = loan
    response = client.get("/api/v1/schemes?sector=Micro Enterprise&scheme_type=loan")
    assert response.status_code == status.HTTP_200_OK
    schemes = response.json()
    assert len(schemes) >= 4  # MUDRA Shishu, Kishore, Tarun, Tarun Plus
    for s in schemes:
        assert "loan" in s["scheme_type"].lower()

    # Category = NSFDC Financing AND target_group = Scheduled Caste
    res_nsfdc = client.get("/api/v1/schemes?category=NSFDC Financing&target_group=Scheduled Caste")
    assert res_nsfdc.status_code == status.HTTP_200_OK
    assert len(res_nsfdc.json()) == 4  # All 4 NSFDC schemes


def test_legacy_route_compatibility(client: TestClient):
    """Test backwards compatibility of /api/schemes route."""
    response = client.get("/api/schemes")
    assert response.status_code == status.HTTP_200_OK
    schemes = response.json()
    assert isinstance(schemes, list)
    assert len(schemes) == 12


def test_deterministic_eligibility_engine(client: TestClient):
    """Test deterministic rule-based eligibility evaluation endpoint."""
    # Profile for a young entrepreneur with micro project (₹40,000)
    profile = {
        "age": 28,
        "gender": "Female",
        "state": "Rajasthan",
        "is_rural": False,
        "annual_income": 200000,
        "project_cost": 40000,
        "requested_loan_amount": 40000,
        "is_new_business": True,
        "social_category": "General",
    }
    response = client.post("/api/v1/schemes/evaluate-eligibility", json=profile)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total_evaluated"] == 12
    assert data["total_eligible"] > 0
    # MUDRA Shishu (up to 50k) should be eligible
    eligible_ids = [s["scheme_id"] for s in data["eligible_schemes"]]
    assert 1 in eligible_ids  # PM MUDRA Shishu
