import requests

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

def test_submit_community_hazard_report():
    url = f"{BASE_URL}/api/community/report"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "location": {
            "lat": 34.052235,
            "lng": -118.243683
        },
        "description": "Large wildfire spotted near residential area with heavy smoke.",
        "hazardType": "fire-spotting",
        "severity": "high",
        "reporterName": "John Doe",
        "reporterEmail": "johndoe@example.com",
        "images": [
            "https://example.com/images/fire1.jpg",
            "https://example.com/images/smoke1.jpg"
        ]
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate response status code
    assert response.status_code == 200 or response.status_code == 201, f"Unexpected status code: {response.status_code}"

    # Validate response content type
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type, f"Unexpected content type: {content_type}"

    # Validate response body contains expected fields (assuming response returns the created report with an id)
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(data, dict), "Response JSON is not an object"
    # Check for actual response structure from working API
    expected_keys = ["success", "reportId", "hierarchicalPartition", "message"]
    for key in expected_keys:
        assert key in data, f"Response JSON missing key: {key}"

    # Validate response indicates success
    assert data["success"] == True, "Response indicates failure"
    assert "reportId" in data and len(data["reportId"]) > 0, "No report ID returned"
    assert "hierarchicalPartition" in data, "No hierarchical partition returned"
    assert data["message"] == "Community report submitted successfully", "Unexpected success message"

test_submit_community_hazard_report()
