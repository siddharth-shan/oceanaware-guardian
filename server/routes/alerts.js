import express from 'express';
import airQualityService from '../services/airQuality/airQualityService.js';

const router = express.Router();

// Get comprehensive alerts for location with enhanced priority and smart filtering
router.get('/current', async (req, res) => {
  try {
    const { lat, lng, priority = 'all', radius = 25 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Missing coordinates',
        message: 'Latitude and longitude are required'
      });
    }

    const alerts = [];
    const dataSources = [];
    const alertMetrics = {
      totalProcessed: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      notifications: []
    };
    
    // Parallel data fetching for improved performance
    const [airQuality, weatherAlerts, fireAlertsResult, evacuationAlerts] = await Promise.allSettled([
      airQualityService.getAirQualityData(parseFloat(lat), parseFloat(lng)),
      getWeatherAlerts(lat, lng),
      getFireAlerts(lat, lng, radius),
      getEvacuationAlerts(lat, lng, radius)
    ]);
    
    // Track data sources
    if (airQuality.status === 'fulfilled' && airQuality.value && !airQuality.value.isMock) {
      dataSources.push(...(airQuality.value.dataSources || []));
    }
    if (weatherAlerts.status === 'fulfilled' && weatherAlerts.value.length > 0 && 
        !weatherAlerts.value[0].id?.includes('mock')) {
      dataSources.push('OpenWeatherMap Weather API');
    }
    if (fireAlertsResult.status === 'fulfilled' && fireAlertsResult.value.fireDataSource) {
      dataSources.push(fireAlertsResult.value.fireDataSourceFull || fireAlertsResult.value.fireDataSource);
    }
    if (evacuationAlerts.status === 'fulfilled' && evacuationAlerts.value.length > 0) {
      dataSources.push('Emergency Management Services');
    }
    
    // Process air quality alerts with enhanced logic
    if (airQuality.status === 'fulfilled' && airQuality.value) {
      const aqData = airQuality.value;
      const aqi = aqData.aqi || 0;
      const category = aqData.category || 'Unknown';
      const pm25Value = aqData.pm25?.value || aqData.pm25?.concentration || 'N/A';
      
      const aqAlert = {
        id: 'air-quality-current',
        type: 'air-quality',
        severity: aqi > 150 ? 'high' : aqi > 100 ? 'medium' : 'low',
        priority: calculateAlertPriority('air-quality', aqi > 150 ? 'high' : aqi > 100 ? 'medium' : 'low', { aqi, pm25: pm25Value }),
        title: `Air Quality: ${category}`,
        message: `AQI: ${aqi} | PM2.5: ${pm25Value} μg/m³`,
        description: `${aqData.smoke?.healthMessage || getAQIHealthMessage(aqi)} ${aqData.isMock ? '(Demo Data)' : ''}`,
        timestamp: new Date().toISOString(),
        location: `${lat}, ${lng}`,
        actionable: aqi > 100,
        actions: aqi > 100 ? ['limit-outdoor-activities', 'wear-mask', 'stay-indoors'] : [],
        data: aqData
      };
      
      alerts.push(aqAlert);
      alertMetrics.totalProcessed++;
      if (aqAlert.priority === 'high') alertMetrics.highPriority++;
      else if (aqAlert.priority === 'medium') alertMetrics.mediumPriority++;
      else alertMetrics.lowPriority++;
      
      // Enhanced wildfire smoke detection
      if (aqData.smoke?.detected) {
        const smokeAlert = {
          id: 'smoke-alert',
          type: 'smoke',
          severity: aqData.smoke.riskLevel === 'extreme' ? 'high' : 
                   aqData.smoke.riskLevel === 'high' ? 'high' : 'medium',
          priority: 'high', // Smoke always high priority
          title: 'Wildfire Smoke Detected',
          message: `PM2.5: ${pm25Value} μg/m³ | Risk: ${aqData.smoke.riskLevel}`,
          description: `${aqData.smoke.healthMessage} ${aqData.isMock ? '(Demo Data)' : ''}`,
          timestamp: new Date().toISOString(),
          location: `${lat}, ${lng}`,
          actionable: true,
          actions: ['stay-indoors', 'close-windows', 'use-air-purifier', 'wear-n95-mask'],
          emergencyLevel: aqData.smoke.riskLevel === 'extreme' ? 'critical' : 'warning',
          data: { 
            pm25: pm25Value, 
            aqi: aqi,
            smokeRisk: aqData.smoke.riskLevel,
            recommendations: aqData.healthRecommendations,
            dataSources: aqData.dataSources
          }
        };
        
        alerts.push(smokeAlert);
        alertMetrics.totalProcessed++;
        alertMetrics.highPriority++;
        
        // Add to notifications queue for push alerts
        if (shouldTriggerNotification(smokeAlert)) {
          alertMetrics.notifications.push({
            type: 'push',
            priority: 'high',
            title: smokeAlert.title,
            body: smokeAlert.message,
            actions: ['view-details', 'dismiss']
          });
        }
      }
    }

    // Add weather alerts with priority processing
    if (weatherAlerts.status === 'fulfilled') {
      weatherAlerts.value.forEach(alert => {
        const enhancedAlert = {
          ...alert,
          priority: calculateAlertPriority(alert.type, alert.severity, alert.data),
          actionable: alert.severity !== 'low',
          emergencyLevel: alert.severity === 'high' ? 'warning' : 'watch'
        };
        alerts.push(enhancedAlert);
        alertMetrics.totalProcessed++;
        if (enhancedAlert.priority === 'high') alertMetrics.highPriority++;
        else if (enhancedAlert.priority === 'medium') alertMetrics.mediumPriority++;
        else alertMetrics.lowPriority++;
      });
    }
    
    // Add fire alerts with enhanced processing
    if (fireAlertsResult.status === 'fulfilled') {
      const fireAlerts = fireAlertsResult.value.alerts || [];
      fireAlerts.forEach(alert => {
        const enhancedFireAlert = {
          ...alert,
          priority: 'critical', // Fire alerts always critical
          actionable: true,
          emergencyLevel: alert.data?.distance < 10 ? 'critical' : 'warning',
          actions: alert.data?.distance < 5 ? 
            ['evacuate-immediately', 'call-911', 'gather-essentials'] : 
            ['prepare-evacuation', 'monitor-alerts', 'gather-essentials']
        };
        alerts.push(enhancedFireAlert);
        alertMetrics.totalProcessed++;
        alertMetrics.highPriority++;
        
        // Critical fire notifications
        if (enhancedFireAlert.emergencyLevel === 'critical') {
          alertMetrics.notifications.push({
            type: 'emergency-push',
            priority: 'critical',
            title: `URGENT: ${alert.title}`,
            body: `Fire ${alert.data?.distance?.toFixed(1)} miles away. Evacuate immediately!`,
            actions: ['call-911', 'evacuate', 'view-map'],
            vibrate: [200, 100, 200, 100, 200],
            sound: 'emergency'
          });
        }
      });
    }
    
    // Add evacuation alerts
    if (evacuationAlerts.status === 'fulfilled') {
      evacuationAlerts.value.forEach(alert => {
        alerts.push({
          ...alert,
          priority: 'critical',
          actionable: true,
          emergencyLevel: 'critical'
        });
        alertMetrics.totalProcessed++;
        alertMetrics.highPriority++;
      });
    }

    // Apply priority filtering if requested
    let filteredAlerts = alerts;
    if (priority !== 'all') {
      filteredAlerts = alerts.filter(alert => alert.priority === priority);
    }
    
    // Sort alerts by priority and severity
    filteredAlerts.sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      const aSeverity = severityOrder[a.severity] || 0;
      const bSeverity = severityOrder[b.severity] || 0;
      
      return bSeverity - aSeverity;
    });

    res.json({
      success: true,
      alerts: filteredAlerts,
      metrics: alertMetrics,
      metadata: {
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        timestamp: new Date().toISOString(),
        radius: parseFloat(radius),
        sources: dataSources.length > 0 ? dataSources : ['Demo Data - Real APIs unavailable'],
        alertCount: filteredAlerts.length,
        totalAlerts: alerts.length,
        fireDataSource: fireAlertsResult.status === 'fulfilled' ? fireAlertsResult.value.fireDataSource : null,
        fireApiEndpoint: fireAlertsResult.status === 'fulfilled' ? fireAlertsResult.value.fireApiEndpoint : null,
        hasRealData: dataSources.length > 0,
        requestedPriority: priority,
        emergencyLevel: getOverallEmergencyLevel(filteredAlerts),
        lastUpdated: new Date().toISOString(),
        cacheExpiry: new Date(Date.now() + 300000).toISOString() // 5 minutes
      }
    });

  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
});

// Removed duplicate getAirQualityData function - using enhanced airQualityService instead

async function getWeatherAlerts(lat, lng) {
  try {
    const openWeatherKey = process.env.VITE_OPENWEATHER_API_KEY;
    if (!openWeatherKey) {
      return getMockWeatherAlerts();
    }

    // Use current weather API instead of One Call API (which requires paid subscription)
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${openWeatherKey}&units=metric`
    );

    if (response.ok) {
      const data = await response.json();
      const alerts = [];

      // Analyze current weather conditions to generate alerts
      const { main, weather, wind, visibility, uvi } = data;
      
      // UV Index alert - estimate based on weather conditions and time of day
      const hour = new Date().getHours();
      const isCloudyOrRainy = weather[0].main.toLowerCase().includes('cloud') || 
                             weather[0].main.toLowerCase().includes('rain');
      
      let estimatedUV;
      if (hour >= 10 && hour <= 16) { // Peak UV hours
        estimatedUV = isCloudyOrRainy ? 4 : 8; // Lower if cloudy
      } else if (hour >= 8 && hour <= 18) { // Moderate UV hours
        estimatedUV = isCloudyOrRainy ? 2 : 5;
      } else { // Early morning/evening/night
        estimatedUV = 1;
      }
      
      let uvSeverity = 'low';
      let uvTitle = 'Low UV Index';
      let uvDescription = 'Minimal UV protection needed.';
      
      if (estimatedUV >= 11) {
        uvSeverity = 'high';
        uvTitle = 'Extreme UV Index';
        uvDescription = 'Take all precautions: unprotected skin can burn in minutes. Avoid outdoor activities between 10am-4pm.';
      } else if (estimatedUV >= 8) {
        uvSeverity = 'high';
        uvTitle = 'Very High UV Index';
        uvDescription = 'Extra protection needed. Unprotected skin can burn in 15 minutes.';
      } else if (estimatedUV >= 6) {
        uvSeverity = 'medium';
        uvTitle = 'High UV Index';
        uvDescription = 'Protection needed. Unprotected skin can burn in 30 minutes.';
      } else if (estimatedUV >= 3) {
        uvSeverity = 'low';
        uvTitle = 'Moderate UV Index';
        uvDescription = 'Some protection needed during midday hours.';
      }
      
      alerts.push({
        id: `weather-uv-${Date.now()}`,
        type: 'uv',
        severity: uvSeverity,
        title: uvTitle,
        message: `UV Index: ${estimatedUV} (estimated)`,
        description: `${uvDescription} Based on current weather conditions and time of day.`,
        timestamp: new Date().toISOString(),
        location: `${lat}, ${lng}`,
        data: { 
          uvIndex: estimatedUV, 
          category: uvTitle.replace(' UV Index', ''),
          isEstimated: true,
          weatherConditions: weather[0].description
        }
      });
      
      // High temperature alert (above 35°C/95°F)
      if (main.temp > 35) {
        alerts.push({
          id: `weather-heat-${Date.now()}`,
          type: 'weather',
          severity: main.temp > 40 ? 'high' : 'medium',
          title: 'Extreme Heat Warning',
          message: `Temperature: ${main.temp.toFixed(1)}°C (${(main.temp * 9/5 + 32).toFixed(1)}°F)`,
          description: 'Extremely high temperatures detected. Stay hydrated, avoid outdoor activities during peak hours, and seek air conditioning.',
          timestamp: new Date().toISOString(),
          location: `${lat}, ${lng}`,
          data: { temperature: main.temp, humidity: main.humidity }
        });
      }

      // High wind alert (above 50 km/h / 31 mph)
      if (wind && wind.speed > 13.9) { // 13.9 m/s = 50 km/h
        alerts.push({
          id: `weather-wind-${Date.now()}`,
          type: 'weather',
          severity: wind.speed > 22.2 ? 'high' : 'medium', // 22.2 m/s = 80 km/h
          title: 'High Wind Warning',
          message: `Wind speed: ${(wind.speed * 3.6).toFixed(1)} km/h (${(wind.speed * 2.237).toFixed(1)} mph)`,
          description: 'Strong winds detected. Secure outdoor objects, avoid exposed areas, and be aware of increased wildfire risk.',
          timestamp: new Date().toISOString(),
          location: `${lat}, ${lng}`,
          data: { windSpeed: wind.speed, windDirection: wind.deg }
        });
      }

      // Low humidity alert (fire weather conditions)
      if (main.humidity < 20) {
        alerts.push({
          id: `weather-humidity-${Date.now()}`,
          type: 'weather',
          severity: 'medium',
          title: 'Low Humidity Alert',
          message: `Humidity: ${main.humidity}% - Critical fire weather conditions`,
          description: 'Very low humidity levels create critical fire weather conditions. Avoid activities that could spark fires.',
          timestamp: new Date().toISOString(),
          location: `${lat}, ${lng}`,
          data: { humidity: main.humidity, temperature: main.temp }
        });
      }

      // Poor visibility alert
      if (visibility && visibility < 1000) { // Less than 1km visibility
        alerts.push({
          id: `weather-visibility-${Date.now()}`,
          type: 'weather',
          severity: visibility < 500 ? 'high' : 'medium',
          title: 'Poor Visibility Alert',
          message: `Visibility: ${(visibility / 1000).toFixed(1)} km due to ${weather[0].description}`,
          description: 'Reduced visibility conditions. Drive carefully and be aware of potential air quality issues.',
          timestamp: new Date().toISOString(),
          location: `${lat}, ${lng}`,
          data: { visibility, weatherCondition: weather[0].description }
        });
      }

      // Smoke detection from weather conditions
      const weatherDescription = weather[0].description.toLowerCase();
      const weatherMain = weather[0].main.toLowerCase();
      const smokeKeywords = ['smoke', 'haze', 'smog'];
      
      if (smokeKeywords.some(keyword => weatherDescription.includes(keyword) || weatherMain.includes(keyword))) {
        let smokeSeverity = 'medium';
        let smokeMessage = 'Smoke conditions detected in weather data';
        
        // Increase severity if visibility is also poor (indicates dense smoke)
        if (visibility && visibility < 1000) {
          smokeSeverity = 'high';
          smokeMessage = 'Dense smoke conditions with poor visibility';
        }
        
        alerts.push({
          id: `weather-smoke-${Date.now()}`,
          type: 'smoke',
          severity: smokeSeverity,
          title: 'Smoke Conditions Detected',
          message: smokeMessage,
          description: `Weather conditions indicate smoke in the area. ${weatherDescription}. Limit outdoor activities and consider wearing N95 masks if going outside.`,
          timestamp: new Date().toISOString(),
          location: `${lat}, ${lng}`,
          data: { 
            weatherCondition: weather[0].description,
            visibility: visibility || null,
            source: 'weather-api'
          }
        });
      }

      return alerts;
    } else {
      throw new Error(`Weather API request failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Weather alerts fetch error:', error);
    return getMockWeatherAlerts();
  }
}

// Enhanced evacuation alerts system
async function getEvacuationAlerts(lat, lng, radius = 25) {
  try {
    // In a production system, this would connect to emergency management APIs
    // For demo purposes, we'll simulate evacuation zone detection based on fire proximity
    
    const fireResponse = await fetch(
      `http://localhost:3001/api/fire-data/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    );

    if (fireResponse.ok) {
      const fireData = await fireResponse.json();
      const alerts = [];

      if (fireData.success && fireData.fires.length > 0) {
        // Check for fires that trigger evacuation alerts (within 10 miles)
        const criticalFires = fireData.fires.filter(fire => fire.distance < 10);
        
        if (criticalFires.length > 0) {
          const nearestFire = criticalFires[0]; // Already sorted by distance
          
          let evacuationLevel = 'advisory';
          let evacuationMessage = 'Prepare for possible evacuation';
          
          if (nearestFire.distance < 3) {
            evacuationLevel = 'mandatory';
            evacuationMessage = 'Mandatory evacuation order - Leave immediately';
          } else if (nearestFire.distance < 7) {
            evacuationLevel = 'warning';
            evacuationMessage = 'Evacuation warning - Be ready to leave';
          }
          
          alerts.push({
            id: `evacuation-${nearestFire.id}`,
            type: 'evacuation',
            severity: evacuationLevel === 'mandatory' ? 'high' : 'medium',
            title: `${evacuationLevel.toUpperCase()} Evacuation ${evacuationLevel === 'advisory' ? 'Advisory' : evacuationLevel === 'warning' ? 'Warning' : 'Order'}`,
            message: `Due to ${nearestFire.name} - ${nearestFire.distance.toFixed(1)} miles away`,
            description: `${evacuationMessage}. ${nearestFire.name} is ${nearestFire.distance.toFixed(1)} miles from your location with ${nearestFire.containment}% containment.`,
            timestamp: new Date().toISOString(),
            location: `${nearestFire.location[0]}, ${nearestFire.location[1]}`,
            data: {
              evacuationLevel,
              fireId: nearestFire.id,
              fireName: nearestFire.name,
              fireDistance: nearestFire.distance,
              fireContainment: nearestFire.containment,
              evacuationRoutes: getEvacuationRoutes(lat, lng, nearestFire.location)
            }
          });
        }
      }

      return alerts;
    } else {
      throw new Error('Evacuation alerts request failed');
    }
  } catch (error) {
    console.error('Evacuation alerts fetch error:', error);
    return [];
  }
}

function getEvacuationRoutes(userLat, userLng, fireLocation) {
  // Simplified evacuation route suggestions
  return [
    {
      direction: 'north',
      route: 'I-5 North to safety zone',
      distance: 15,
      estimatedTime: 20
    },
    {
      direction: 'east',
      route: 'Highway 101 East to evacuation center',
      distance: 12,
      estimatedTime: 18
    }
  ];
}

// Smart notification trigger system
function shouldTriggerNotification(alert) {
  // Logic to determine if alert should trigger push notification
  const highPriorityTypes = ['fire', 'smoke', 'evacuation'];
  const criticalSeverities = ['high', 'critical'];
  
  return (
    highPriorityTypes.includes(alert.type) ||
    criticalSeverities.includes(alert.severity) ||
    criticalSeverities.includes(alert.priority) ||
    alert.emergencyLevel === 'critical'
  );
}

// Priority calculation system
function calculateAlertPriority(type, severity, data = {}) {
  // Base priority from type
  const typePriorities = {
    'fire': 'critical',
    'evacuation': 'critical',
    'smoke': 'high',
    'air-quality': severity === 'high' ? 'high' : 'medium',
    'weather': severity === 'high' ? 'high' : 'medium',
    'uv': 'low'
  };
  
  let basePriority = typePriorities[type] || 'low';
  
  // Adjust based on specific data
  if (type === 'fire' && data.distance && data.distance < 5) {
    basePriority = 'critical';
  }
  
  if (type === 'air-quality' && data.aqi && data.aqi > 200) {
    basePriority = 'critical';
  }
  
  if (type === 'weather') {
    if (data.temperature && data.temperature > 40) basePriority = 'high';
    if (data.windSpeed && data.windSpeed > 22) basePriority = 'high';
    if (data.humidity && data.humidity < 15) basePriority = 'high';
  }
  
  return basePriority;
}

// Overall emergency level assessment
function getOverallEmergencyLevel(alerts) {
  if (alerts.some(alert => alert.emergencyLevel === 'critical' || alert.priority === 'critical')) {
    return 'critical';
  }
  
  if (alerts.some(alert => alert.emergencyLevel === 'warning' || alert.priority === 'high')) {
    return 'warning';
  }
  
  if (alerts.some(alert => alert.emergencyLevel === 'watch' || alert.priority === 'medium')) {
    return 'watch';
  }
  
  return 'normal';
}

async function getFireAlerts(lat, lng, radius = 25) {
  try {
    // Get nearby fires (reuse fire data logic)
    const fireResponse = await fetch(
      `http://localhost:3001/api/fire-data/nearby?lat=${lat}&lng=${lng}&radius=25`
    );

    if (fireResponse.ok) {
      const fireData = await fireResponse.json();
      const alerts = [];

      if (fireData.success && fireData.fires.length > 0) {
        fireData.fires.forEach(fire => {
          let severity = 'low';
          if (fire.distance < 5) severity = 'high';
          else if (fire.distance < 15) severity = 'medium';

          alerts.push({
            id: `fire-${fire.id}`,
            type: 'fire',
            severity: severity,
            title: `Wildfire: ${fire.name}`,
            message: `${fire.acres} acres, ${fire.distance.toFixed(1)} miles away`,
            description: `Active wildfire ${fire.distance.toFixed(1)} miles from your location. ${fire.containment}% contained. Source: ${fire.source || 'Fire Data Service'}`,
            timestamp: new Date().toISOString(),
            location: `${fire.location[0]}, ${fire.location[1]}`,
            data: {
              ...fire,
              source: fire.source || fireData.metadata?.source || 'Unknown',
              dataSourceFull: fireData.metadata?.dataSource || 'Fire Data Service',
              apiEndpoint: fireData.metadata?.apiEndpoint || 'fire-data/nearby'
            }
          });
        });
      }

      // Return alerts with metadata about fire data sources
      return { 
        alerts, 
        fireDataSource: fireData.metadata?.source,
        fireDataSourceFull: fireData.metadata?.dataSource,
        fireApiEndpoint: fireData.metadata?.apiEndpoint
      };
    } else {
      throw new Error('Fire alerts request failed');
    }
  } catch (error) {
    console.error('Fire alerts fetch error:', error);
    return { alerts: [], fireDataSource: 'unavailable' };
  }
}

function getAQICategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

function getAQIHealthMessage(aqi) {
  if (aqi <= 50) return 'Air quality is satisfactory for most people.';
  if (aqi <= 100) return 'Air quality is acceptable for most people.';
  if (aqi <= 150) return 'Sensitive groups should limit outdoor activities.';
  if (aqi <= 200) return 'Everyone should limit prolonged outdoor activities.';
  if (aqi <= 300) return 'Everyone should avoid outdoor activities.';
  return 'Emergency conditions - everyone should stay indoors.';
}

function getSeverityFromEvent(event) {
  const highSeverityEvents = ['tornado', 'hurricane', 'flood', 'wildfire', 'extreme'];
  const mediumSeverityEvents = ['thunderstorm', 'wind', 'rain', 'snow', 'warning'];
  
  const eventLower = event.toLowerCase();
  
  if (highSeverityEvents.some(keyword => eventLower.includes(keyword))) {
    return 'high';
  }
  if (mediumSeverityEvents.some(keyword => eventLower.includes(keyword))) {
    return 'medium';
  }
  return 'low';
}

// Removed getMockAirQuality function - using enhanced airQualityService.getMockAirQuality instead

function getMockWeatherAlerts() {
  return [
    {
      id: 'mock-weather-1',
      type: 'weather',
      severity: 'medium',
      title: 'Red Flag Warning',
      message: 'Critical fire weather conditions expected',
      description: 'Low humidity (15%), high temperatures (38°C), and gusty winds (45 km/h) will create critical fire weather conditions.',
      timestamp: new Date().toISOString(),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      location: 'Current Location',
      data: { 
        temperature: 38,
        humidity: 15,
        windSpeed: 12.5,
        event: 'Red Flag Warning'
      }
    }
  ];
}

export default router;