import requests

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

def test_activate_crisis_mode_for_area():
    # Crisis mode is triggered by high-severity emergency reports
    # Test by submitting a critical emergency report that would trigger crisis mode
    url = f"{BASE_URL}/api/community/report"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "location": {
            "lat": 34.052235,
            "lng": -118.243683
        },
        "description": "EMERGENCY: Large wildfire rapidly approaching residential area with immediate evacuation needed",
        "hazardType": "fire-spotting",
        "severity": "critical",
        "reporterName": "Emergency Reporter",
        "urgentLevel": "critical"
    }

    try:
        # Submit critical emergency report
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        data = response.json()
        
        # Validate emergency report was created
        assert "success" in data, "Response JSON missing 'success' key"
        assert data["success"] == True, "Emergency report creation failed"
        assert "reportId" in data, "Response JSON missing 'reportId'"
        assert "hierarchicalPartition" in data, "Response JSON missing 'hierarchicalPartition'"
        
        # Now check if alerts are generated for this critical situation
        alerts_url = f"{BASE_URL}/api/alerts/current"
        alerts_params = {
            "lat": payload["location"]["lat"],
            "lng": payload["location"]["lng"]
        }
        
        alerts_response = requests.get(alerts_url, params=alerts_params, headers={"Accept": "application/json"}, timeout=TIMEOUT)
        assert alerts_response.status_code == 200, "Failed to get emergency alerts"
        alerts_data = alerts_response.json()
        
        # Validate that emergency alerts exist (which would trigger crisis mode in frontend)
        assert "success" in alerts_data and alerts_data["success"] == True, "Alerts request failed"
        assert "alerts" in alerts_data, "No alerts data returned"
        
        # Check for high-priority alerts that would trigger crisis mode
        alerts = alerts_data.get("alerts", [])
        has_critical_alert = any(
            alert.get("priority") == "critical" or 
            alert.get("emergencyLevel") == "critical" or
            alert.get("severity") in ["high", "critical"]
            for alert in alerts
        )
        
        assert has_critical_alert, "No critical alerts found that would trigger crisis mode"
    except requests.exceptions.Timeout:
        assert False, "Request timed out"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"
    except ValueError:
        assert False, "Response is not valid JSON"

test_activate_crisis_mode_for_area()