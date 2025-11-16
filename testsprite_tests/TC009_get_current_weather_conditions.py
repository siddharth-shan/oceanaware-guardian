import requests

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

def test_get_current_weather_conditions():
    # Example coordinates for testing (latitude and longitude)
    lat = 34.0522   # Los Angeles latitude
    lng = -118.2437 # Los Angeles longitude

    url = f"{BASE_URL}/api/weather/current"
    params = {"lat": lat, "lng": lng}
    headers = {
        "Accept": "application/json"
    }

    try:
        response = requests.get(url, params=params, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        assert False, f"Request to get current weather conditions failed: {e}"

    # Validate response status code
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    # Validate response content type
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type, f"Expected JSON response, got {content_type}"

    data = response.json()

    # Validate main response structure
    assert "success" in data, "Response missing 'success' field"
    assert data["success"] == True, "Weather request failed"
    assert "weather" in data, "Response missing weather data"
    assert "metadata" in data, "Response missing metadata"

    weather_data = data["weather"]
    
    # Validate presence of expected keys in the weather data
    expected_keys = ["temperature", "humidity", "windSpeed", "description", "timestamp"]
    for key in expected_keys:
        assert key in weather_data, f"Missing expected key '{key}' in weather data"

    # Validate data types and reasonable value ranges
    temperature = weather_data.get("temperature")
    assert isinstance(temperature, (int, float)), "Temperature should be a number"
    assert -100 <= temperature <= 150, "Temperature value out of realistic range"

    humidity = weather_data.get("humidity")
    assert isinstance(humidity, (int, float)), "Humidity should be a number"
    assert 0 <= humidity <= 100, "Humidity value out of range 0-100"

    wind_speed = weather_data.get("windSpeed")
    assert isinstance(wind_speed, (int, float)), "Wind speed should be a number"
    assert wind_speed >= 0, "Wind speed cannot be negative"

    description = weather_data.get("description")
    assert isinstance(description, str), "Weather description should be a string"
    assert len(description) > 0, "Weather description should not be empty"

    # Validate metadata
    metadata = data["metadata"]
    assert "userLocation" in metadata, "Metadata missing user location"
    user_location = metadata["userLocation"]
    assert user_location["lat"] == lat, "Response latitude doesn't match request"
    assert user_location["lng"] == lng, "Response longitude doesn't match request"

    # Additional validation: simulate offline scenario by checking for proper error handling
    # Since we cannot simulate offline in this test, we check that server returns error for missing params
    try:
        bad_response = requests.get(url, headers=headers, timeout=TIMEOUT)
        # We expect a 4xx error due to missing required parameters
        assert bad_response.status_code >= 400 and bad_response.status_code < 500, \
            "Expected client error status code for missing parameters"
    except requests.exceptions.RequestException:
        # If request fails due to connection error, consider offline scenario handled by client
        pass

test_get_current_weather_conditions()