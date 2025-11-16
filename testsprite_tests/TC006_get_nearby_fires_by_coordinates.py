import requests

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

def test_get_nearby_fires_by_coordinates():
    # Coordinates and radius for test - example location in California
    params = {
        "lat": 34.0522,    # Los Angeles latitude
        "lng": -118.2437,  # Los Angeles longitude
        "radius": 50       # 50 km radius
    }
    headers = {
        "Accept": "application/json"
    }

    try:
        response = requests.get(
            f"{BASE_URL}/api/fire-data/nearby",
            params=params,
            headers=headers,
            timeout=TIMEOUT
        )
        # Validate HTTP response status
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"

        data = response.json()
        # Validate response structure and data types
        assert isinstance(data, list), "Response should be a list of fire data entries"

        for fire in data:
            # Each fire entry should be a dict with expected keys
            assert isinstance(fire, dict), "Each fire entry should be a dictionary"
            # Validate presence of key fields (example keys based on typical fire data)
            expected_keys = {"id", "latitude", "longitude", "confidence", "acq_date", "acq_time", "brightness", "scan", "track", "satellite"}
            assert expected_keys.intersection(fire.keys()), f"Fire entry missing expected keys: {expected_keys}"

            # Validate latitude and longitude are within radius (rough check)
            lat = fire.get("latitude")
            lng = fire.get("longitude")
            assert isinstance(lat, (float, int)), "Latitude must be a number"
            assert isinstance(lng, (float, int)), "Longitude must be a number"

            # Simple distance check (approximate) to ensure fire is within radius
            from math import radians, cos, sin, asin, sqrt

            def haversine(lat1, lon1, lat2, lon2):
                # Calculate the great circle distance between two points on the earth (km)
                R = 6371  # Earth radius in km
                dlat = radians(lat2 - lat1)
                dlon = radians(lon2 - lon1)
                a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
                c = 2 * asin(sqrt(a))
                return R * c

            distance = haversine(params["lat"], params["lng"], lat, lng)
            assert distance <= params["radius"], f"Fire at distance {distance} km exceeds radius {params['radius']} km"

    except requests.exceptions.Timeout:
        assert False, "Request timed out"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_nearby_fires_by_coordinates()