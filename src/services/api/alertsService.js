export class AlertsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10000; // 10 seconds cache for alerts - faster emergency response
  }

  async getCurrentAlerts(latitude, longitude) {
    const cacheKey = `alerts_${latitude}_${longitude}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`/api/alerts/current?lat=${latitude}&lng=${longitude}`);
      
      if (!response.ok) {
        throw new Error(`Alerts request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const result = {
          alerts: data.alerts,
          metadata: data.metadata
        };
        
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Provide mock alerts when server is unavailable
      return this.getMockAlerts(latitude, longitude);
    }
  }

  async getAirQualityDetails(latitude, longitude) {
    try {
      // This could be expanded to use dedicated air quality APIs
      const response = await fetch(`/api/alerts/current?lat=${latitude}&lng=${longitude}`);
      const data = await response.json();
      
      if (data.success) {
        const airQualityAlert = data.alerts.find(alert => alert.type === 'air-quality');
        return airQualityAlert?.data || null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching air quality details:', error);
      return null;
    }
  }

  getAlertSeverityColor(severity) {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  getAlertIcon(type) {
    switch (type) {
      case 'fire': return '🔥';
      case 'air-quality': return '💨';
      case 'smoke': return '🌫️';
      case 'weather': return '⛈️';
      case 'pollen': return '🌾';
      case 'uv': return '☀️';
      case 'temperature': return '🌡️';
      default: return '⚠️';
    }
  }

  getAQIColor(aqi) {
    if (aqi <= 50) return 'text-green-600 bg-green-50 border-green-200';
    if (aqi <= 100) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (aqi <= 150) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (aqi <= 200) return 'text-red-600 bg-red-50 border-red-200';
    if (aqi <= 300) return 'text-purple-600 bg-purple-50 border-purple-200';
    return 'text-red-800 bg-red-100 border-red-300';
  }

  getMockAlerts(latitude, longitude) {
    const locationName = this.getLocationName(latitude, longitude);
    
    // Add progressive alert loading to simulate emergency mode transition
    const currentTime = Date.now();
    const alerts = [
      {
        id: 'demo-air-quality-1',
        type: 'air-quality',
        severity: 'medium',
        title: 'Moderate Air Quality',
        message: 'Air Quality Index: 85 - Moderate',
        description: 'Air quality is acceptable for most people. However, sensitive groups may experience minor respiratory symptoms.',
        timestamp: new Date().toISOString(),
        location: locationName,
        data: {
          aqi: 85,
          category: 'Moderate',
          pm25: 25,
          pm10: 40,
          o3: 80,
          no2: 20
        }
      },
      {
        id: 'demo-weather-1',
        type: 'weather',
        severity: 'medium',
        title: 'Red Flag Warning',
        message: 'Critical fire weather conditions expected',
        description: 'Low humidity (15%), high temperatures (95°F), and gusty winds (30 mph) will create critical fire weather conditions. Avoid activities that could spark fires.',
        timestamp: new Date().toISOString(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        location: locationName,
        data: { 
          temperature: 35,
          humidity: 15,
          windSpeed: 13.4,
          event: 'Red Flag Warning'
        }
      },
      {
        id: 'demo-uv-1',
        type: 'uv',
        severity: 'high',
        title: 'Extreme UV Index',
        message: 'UV Index: 11 - Take extra precautions',
        description: 'Unprotected skin can burn in less than 10 minutes. Use SPF 30+ sunscreen, wear protective clothing, and seek shade during peak hours.',
        timestamp: new Date().toISOString(),
        location: locationName,
        data: {
          uvIndex: 11,
          category: 'Extreme'
        }
      }
    ];
    
    // After 10 seconds, add critical fire alerts to trigger emergency mode
    if (!this.startTime) {
      this.startTime = currentTime;
    }
    
    if (currentTime - this.startTime > 10000) { // After 10 seconds
      alerts.push(
        {
          id: 'demo-fire-1',
          type: 'fire',
          severity: 'high',
          title: 'Wildfire Alert - Oak Fire',
          message: 'Active wildfire detected 5.2 miles away',
          description: 'A wildfire is burning rapidly in oak woodland. Evacuate immediately if ordered. Monitor for evacuation notices.',
          timestamp: new Date().toISOString(),
          location: locationName,
          data: {
            distance: 5.2,
            size: '1,250 acres',
            containment: '0%',
            threat: 'high'
          }
        },
        {
          id: 'demo-fire-2',
          type: 'fire',
          severity: 'high',
          title: 'Wildfire Alert - Canyon Fire', 
          message: 'Active wildfire detected 12.8 miles away',
          description: 'Fast-moving grass fire threatening structures. Pre-evacuation warning in effect.',
          timestamp: new Date().toISOString(),
          location: locationName,
          data: {
            distance: 12.8,
            size: '850 acres',
            containment: '15%',
            threat: 'moderate'
          }
        }
      );
    }
    
    return {
      alerts,
      metadata: {
        location: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        timestamp: new Date().toISOString(),
        sources: ['Demo Data - Server Unavailable'],
        alertCount: 3,
        note: 'Displaying sample alerts. Real data requires backend server connection.'
      }
    };
  }

  getLocationName(latitude, longitude) {
    // Simple location name based on coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (lat >= 32 && lat <= 42 && lng >= -125 && lng <= -114) {
      return 'California';
    } else if (lat >= 25 && lat <= 31 && lng >= -106 && lng <= -93) {
      return 'Texas';
    } else if (lat >= 40 && lat <= 45 && lng >= -79 && lng <= -71) {
      return 'New York';
    } else if (lat >= 25 && lat <= 31 && lng >= -87 && lng <= -79) {
      return 'Florida';
    }
    
    return `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
  }
}