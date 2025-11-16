import requests

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

def test_get_community_reports_by_location():
    # Define query parameters for filtering community hazard reports
    params = {
        "lat": 34.0522,      # Example: Los Angeles latitude
        "lng": -118.2437,    # Example: Los Angeles longitude
        "radius": 10,        # 10 km radius
        "limit": 5           # Limit to 5 reports
    }
    headers = {
        "Accept": "application/json"
    }

    try:
        # Make GET request to fetch community reports by location
        response = requests.get(
            f"{BASE_URL}/api/community/reports",
            params=params,
            headers=headers,
            timeout=TIMEOUT
        )
        # Validate HTTP response status code
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"

        # Parse JSON response
        data = response.json()
        assert isinstance(data, list), "Response should be a list of reports"

        # Validate number of reports returned does not exceed limit
        assert len(data) <= params["limit"], f"Returned reports exceed limit {params['limit']}"

        # Validate each report contains required fields and correct location proximity
        for report in data:
            # Required fields validation
            assert "location" in report, "Report missing 'location'"
            assert "lat" in report["location"] or "latitude" in report["location"], "Location missing latitude"
            assert "lng" in report["location"] or "longitude" in report["location"], "Location missing longitude"
            assert "description" in report, "Report missing 'description'"
            assert "hazardType" in report, "Report missing 'hazardType'"
            assert "severity" in report, "Report missing 'severity'"

            # Validate location coordinates are numbers
            lat_val = report["location"].get("lat") or report["location"].get("latitude")
            lng_val = report["location"].get("lng") or report["location"].get("longitude")
            assert isinstance(lat_val, (float, int)), "Latitude should be a number"
            assert isinstance(lng_val, (float, int)), "Longitude should be a number"

            # Optional: Validate that the report location is within the radius (approximate)
            from math import radians, cos, sin, asin, sqrt
            def haversine(lat1, lon1, lat2, lon2):
                # Calculate the great circle distance between two points on the earth (km)
                R = 6371  # Earth radius in km
                dlat = radians(lat2 - lat1)
                dlon = radians(lon2 - lon1)
                a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
                c = 2 * asin(sqrt(a))
                return R * c

            distance = haversine(params["lat"], params["lng"], lat_val, lng_val)
            assert distance <= params["radius"], f"Report location {distance}km outside radius {params['radius']}km"

    except requests.exceptions.Timeout:
        assert False, "Request timed out"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_community_reports_by_location()