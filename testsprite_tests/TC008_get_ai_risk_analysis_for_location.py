import requests
import time

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

def test_get_ai_risk_analysis_for_location():
    # Coordinates for a test location (example: somewhere in California)
    lat = 34.052235
    lng = -118.243683

    # AI analysis uses POST /analyze endpoint, not GET /risk
    url = f"{BASE_URL}/api/ai-analysis/analyze"
    payload = {
        "location": {
            "lat": lat,
            "lng": lng
        },
        "analysisType": "risk-assessment"
    }
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    try:
        start_time = time.time()
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        elapsed_time = time.time() - start_time

        # Validate response status code
        assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"

        # Validate response time (should complete within 5 seconds as per validation criteria)
        assert elapsed_time <= 5, f"Response time {elapsed_time}s exceeds 5 seconds limit"

        data = response.json()

        # Check for expected response structure from AI analysis endpoint
        # The actual endpoint returns analysis results in a specific format
        expected_keys = [
            "success",
            "analysis",
            "confidence"
        ]
        for key in expected_keys:
            assert key in data, f"Missing expected key in response: {key}"

        # Validate response indicates success
        assert data["success"] == True, "AI analysis response indicates failure"
        
        # Validate analysis object contains risk information
        analysis = data.get("analysis", {})
        assert isinstance(analysis, dict), "Analysis should be an object"
        
        # Check for confidence score
        assert "confidence" in data, "Missing confidence score"
        confidence = data["confidence"]
        assert isinstance(confidence, (int, float)), "Confidence should be a number"
        assert 0 <= confidence <= 1, "Confidence should be between 0 and 1"

    except requests.exceptions.Timeout:
        assert False, "Request timed out"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"
    except ValueError:
        assert False, "Response is not valid JSON"

test_get_ai_risk_analysis_for_location()