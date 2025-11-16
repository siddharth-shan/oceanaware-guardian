import requests
import uuid

BASE_URL = "http://localhost:5173"
# Family groups use PUT /:groupCode endpoint, not POST /create
GROUP_CODE = "TEST-FAMILY-1234"  # Use fixed group code for testing
GROUP_ENDPOINT_TEMPLATE = "/api/family-groups/{group_code}"

HEADERS = {
    "Content-Type": "application/json"
}

def test_create_new_family_group():
    group_name = "Test Family Group"
    creator_id = str(uuid.uuid4())
    creator_name = "Test Creator"

    # Use the actual API structure for family groups
    payload = {
        "data": {
            "groupName": group_name,
            "members": [
                {
                    "id": creator_id,
                    "name": creator_name,
                    "role": "creator"
                }
            ],
            "status": "active"
        }
    }

    created_group_id = None

    try:
        # Create new family group using PUT endpoint
        response = requests.put(
            f"{BASE_URL}{GROUP_ENDPOINT_TEMPLATE.format(group_code=GROUP_CODE)}",
            json=payload,
            headers=HEADERS,
            timeout=30
        )
        assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
        data = response.json()
        
        # Validate response contains expected fields for family group creation
        assert "success" in data, "Response missing success field"
        assert data["success"] == True, "Response indicates failure"
        assert "groupCode" in data, "Response missing group code"
        assert data["groupCode"] == GROUP_CODE, "Group code mismatch in response"
        assert "message" in data, "Response missing message field"

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

    finally:
        # Cleanup: verify we can retrieve the created group
        try:
            get_response = requests.get(
                f"{BASE_URL}{GROUP_ENDPOINT_TEMPLATE.format(group_code=GROUP_CODE)}",
                headers={"Accept": "application/json"},
                timeout=30
            )
            if get_response.status_code == 200:
                get_data = get_response.json()
                # Verify the group was created successfully
                assert get_data["success"] == True, "Failed to retrieve created group"
                assert get_data["data"]["groupName"] == group_name, "Group name mismatch on retrieval"
        except requests.exceptions.RequestException:
            pass  # Don't fail the main test if cleanup verification fails

test_create_new_family_group()