import requests

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

def test_get_fires_by_state():
    state = "California"
    url = f"{BASE_URL}/api/fire-data/state"
    headers = {
        "Accept": "application/json"
    }
    params = {
        "state": state
    }

    try:
        response = requests.get(url, headers=headers, params=params, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

    data = response.json()

    # Validate response structure and content
    assert isinstance(data, dict) or isinstance(data, list), "Response should be a dict or list"
    # If list, check each item has expected keys related to fire data
    if isinstance(data, list):
        for fire in data:
            assert isinstance(fire, dict), "Each fire entry should be a dict"
            # Typical fire data keys might include location, date, severity, etc.
            # Validate presence of some expected keys
            expected_keys = {"id", "location", "date", "severity", "state"}
            assert expected_keys.intersection(fire.keys()), "Fire entry missing expected keys"
            # Validate state matches requested state (case insensitive)
            fire_state = fire.get("state", "")
            assert fire_state.lower() == state.lower(), f"Fire state '{fire_state}' does not match requested state '{state}'"
    else:
        # If dict, check it contains a key like 'fires' or similar
        # This depends on API design, so we check for common keys
        possible_keys = ["fires", "data", "results"]
        found_key = next((k for k in possible_keys if k in data), None)
        assert found_key is not None, "Response dict missing expected keys like 'fires', 'data', or 'results'"
        fires = data[found_key]
        assert isinstance(fires, list), f"'{found_key}' should be a list"
        for fire in fires:
            assert isinstance(fire, dict), "Each fire entry should be a dict"
            expected_keys = {"id", "location", "date", "severity", "state"}
            assert expected_keys.intersection(fire.keys()), "Fire entry missing expected keys"
            fire_state = fire.get("state", "")
            assert fire_state.lower() == state.lower(), f"Fire state '{fire_state}' does not match requested state '{state}'"

test_get_fires_by_state()
