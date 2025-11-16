import requests

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

def test_get_current_alerts_for_location():
    # Example coordinates for a location in California
    lat = 34.052235
    lng = -118.243683

    url = f"{BASE_URL}/api/alerts/current"
    headers = {
        "Accept": "application/json"
    }
    params = {
        "lat": lat,
        "lng": lng
    }

    try:
        response = requests.get(url, headers=headers, params=params, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate response content type
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type, f"Unexpected Content-Type: {content_type}"

    data = response.json()

    # Validate that data is a list (alerts)
    assert isinstance(data, list), "Response JSON is not a list"

    # Validate each alert object structure and data types
    for alert in data:
        assert isinstance(alert, dict), "Alert item is not a dictionary"
        # Check for expected keys in alert (based on typical emergency alert structure)
        expected_keys = {"id", "title", "description", "severity", "startTime", "endTime", "location", "type"}
        missing_keys = expected_keys - alert.keys()
        assert not missing_keys, f"Alert missing keys: {missing_keys}"

        # Validate types of some fields
        assert isinstance(alert["id"], (str, int)), "Alert id should be str or int"
        assert isinstance(alert["title"], str) and alert["title"], "Alert title should be non-empty string"
        assert isinstance(alert["description"], str), "Alert description should be string"
        assert alert["severity"] in {"low", "medium", "high", "critical"}, "Alert severity invalid"
        assert isinstance(alert["startTime"], str), "Alert startTime should be string"
        assert isinstance(alert["endTime"], str), "Alert endTime should be string"
        assert isinstance(alert["location"], dict), "Alert location should be a dictionary"
        assert isinstance(alert["type"], str), "Alert type should be string"

    # Additional checks for offline functionality and error handling
    # Simulate offline by sending request to invalid URL and expect failure
    offline_url = f"http://localhost:5173/api/alerts/current"
    try:
        requests.get("http://invalidhost/api/alerts/current", timeout=5)
        assert False, "Request to invalid host should fail"
    except requests.exceptions.RequestException:
        pass  # Expected failure

test_get_current_alerts_for_location()