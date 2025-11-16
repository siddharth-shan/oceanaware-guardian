import requests
import uuid

BASE_URL = "http://localhost:5173"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

# Use a pre-existing group code format for testing
TEST_GROUP_CODE = "TEST-JOIN-4567"

def test_join_family_group_by_code():
    # Step 1: Create a new family group using the correct PUT endpoint
    group_endpoint = f"{BASE_URL}/api/family-groups/{TEST_GROUP_CODE}"
    group_name = "Test Join Group"
    creator_id = str(uuid.uuid4())
    creator_name = "Test Creator"
    create_payload = {
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

    try:
        # Create the family group first
        create_resp = requests.put(group_endpoint, json=create_payload, headers=HEADERS, timeout=TIMEOUT)
        assert create_resp.status_code == 200, f"Failed to create family group: {create_resp.text}"
        create_data = create_resp.json() if create_resp.content else {}
        assert create_data.get("success") == True, "Group creation failed"
        assert create_data.get("groupCode") == TEST_GROUP_CODE, "Group code mismatch"

        # Step 2: Simulate joining by updating the group with a new member
        # Since there's no separate /join endpoint, we update the group with additional members
        user_id = str(uuid.uuid4())
        user_name = "Test Joining Member"
        
        # First, get the current group data
        get_resp = requests.get(group_endpoint, headers={"Accept": "application/json"}, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Failed to get group data: {get_resp.text}"
        current_data = get_resp.json()
        assert current_data.get("success") == True, "Failed to retrieve group"
        
        # Add new member to the group
        updated_members = current_data["data"]["members"] + [
            {
                "id": user_id,
                "name": user_name,
                "role": "member"
            }
        ]
        
        join_payload = {
            "data": {
                "groupName": group_name,
                "members": updated_members,
                "status": "active"
            }
        }
        
        # Update the group with the new member (simulating join)
        join_resp = requests.put(group_endpoint, json=join_payload, headers=HEADERS, timeout=TIMEOUT)
        assert join_resp.status_code == 200, f"Failed to join family group: {join_resp.text}"
        join_data = join_resp.json() if join_resp.content else {}
        assert join_data.get("success") == True, "Join operation failed"
        
        # Verify the member was added by retrieving the group again
        verify_resp = requests.get(group_endpoint, headers={"Accept": "application/json"}, timeout=TIMEOUT)
        if verify_resp.status_code == 200:
            verify_data = verify_resp.json()
            if verify_data.get("success"):
                members = verify_data["data"].get("members", [])
                member_names = [m["name"] for m in members]
                assert user_name in member_names, "New member not found in group"

    finally:
        # Cleanup: Since there's no delete endpoint, just verify the test group exists
        try:
            check_resp = requests.get(group_endpoint, headers={"Accept": "application/json"}, timeout=TIMEOUT)
            # Just verify we can still access the group (cleanup not critical for this API)
            if check_resp.status_code == 200:
                pass  # Group still exists, which is fine
        except Exception:
            pass  # Don't fail test on cleanup issues


test_join_family_group_by_code()