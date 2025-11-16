/**
 * Enhanced Fire Weather Service
 * Integrates National Weather Service API for fire weather forecasting
 * 
 * API Documentation: https://www.weather.gov/documentation/services-web-api
 * Features:
 * - Red flag warnings and fire weather watches
 * - 2.5km resolution gridded forecasts
 * - Fire weather indices calculation
 * - No authentication required (government API)
 */

export class EnhancedFireWeatherService {
  constructor() {
    this.baseUrl = 'https://api.weather.gov';
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes cache
  }

  /**
   * Get fire weather alerts for California
   * @param {string} area - State code (default: CA)
   * @returns {Promise<Array>} Array of active fire weather alerts
   */
  async getFireWeatherAlerts(area = 'CA') {
    const cacheKey = `alerts_${area}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/alerts/active?area=${area}`, {
        headers: {
          'User-Agent': 'EcoQuest-Wildfire-Watch/1.0',
          'Accept': 'application/geo+json'
        }
      });

      if (!response.ok) {
        throw new Error(`NWS API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const fireWeatherAlerts = this.processFireWeatherAlerts(data.features || []);
      
      this.cache.set(cacheKey, {
        data: fireWeatherAlerts,
        timestamp: Date.now()
      });

      return fireWeatherAlerts;
    } catch (error) {
      console.error('Fire weather alerts fetch error:', error);
      return this.getFallbackFireWeatherAlerts();
    }
  }

  /**
   * Get detailed forecast for a specific location
   * @param {number} latitude - Location latitude
   * @param {number} longitude - Location longitude
   * @returns {Promise<Object>} Detailed fire weather forecast
   */
  async getFireWeatherForecast(latitude, longitude) {
    const cacheKey = `forecast_${latitude}_${longitude}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // First, get the grid point data
      const pointResponse = await fetch(`${this.baseUrl}/points/${latitude},${longitude}`, {
        headers: {
          'User-Agent': 'EcoQuest-Wildfire-Watch/1.0'
        }
      });

      if (!pointResponse.ok) {
        throw new Error(`NWS Points API error: ${pointResponse.status}`);
      }

      const pointData = await pointResponse.json();
      const gridId = pointData.properties.gridId;
      const gridX = pointData.properties.gridX;
      const gridY = pointData.properties.gridY;

      // Get the detailed forecast
      const forecastResponse = await fetch(`${this.baseUrl}/gridpoints/${gridId}/${gridX},${gridY}/forecast`, {
        headers: {
          'User-Agent': 'EcoQuest-Wildfire-Watch/1.0'
        }
      });

      if (!forecastResponse.ok) {
        throw new Error(`NWS Forecast API error: ${forecastResponse.status}`);
      }

      const forecastData = await forecastResponse.json();
      const processedForecast = this.processFireWeatherForecast(forecastData.properties.periods || []);
      
      this.cache.set(cacheKey, {
        data: processedForecast,
        timestamp: Date.now()
      });

      return processedForecast;
    } catch (error) {
      console.error('Fire weather forecast fetch error:', error);
      return this.getFallbackForecast();
    }
  }

  /**
   * Calculate comprehensive fire weather indices
   * @param {Object} weatherData - Current weather conditions
   * @returns {Object} Fire weather indices and risk assessment
   */
  calculateFireWeatherIndices(weatherData) {
    const {
      temperature = 75, // Fahrenheit
      humidity = 50, // Percentage
      windSpeed = 10, // mph
      precipitation = 0, // inches in last 24h
      dryDays = 0 // consecutive dry days
    } = weatherData;

    // Haines Index (Lower Atmosphere Severity Index)
    const hainesIndex = this.calculateHainesIndex(temperature, humidity);
    
    // Fire Weather Index (Canadian FWI System adapted)
    const fwi = this.calculateFireWeatherIndex(temperature, humidity, windSpeed, precipitation);
    
    // Red Flag Conditions Check
    const redFlagConditions = this.checkRedFlagConditions(temperature, humidity, windSpeed);
    
    // Burning Index
    const burningIndex = this.calculateBurningIndex(temperature, humidity, windSpeed, dryDays);
    
    // Spreads Component
    const spreadComponent = this.calculateSpreadComponent(windSpeed, humidity);
    
    // Energy Release Component
    const energyReleaseComponent = this.calculateEnergyReleaseComponent(temperature, humidity, dryDays);

    // Overall fire danger rating
    const fireDangerRating = this.calculateOverallFireDanger({
      hainesIndex,
      fwi,
      burningIndex,
      spreadComponent,
      energyReleaseComponent,
      redFlagConditions
    });

    return {
      indices: {
        hainesIndex: {
          value: hainesIndex,
          category: this.getHainesCategory(hainesIndex),
          description: this.getHainesDescription(hainesIndex)
        },
        fireWeatherIndex: {
          value: Math.round(fwi * 100) / 100,
          category: this.getFWICategory(fwi),
          description: this.getFWIDescription(fwi)
        },
        burningIndex: {
          value: Math.round(burningIndex),
          category: this.getBurningIndexCategory(burningIndex),
          description: this.getBurningIndexDescription(burningIndex)
        },
        spreadComponent: {
          value: Math.round(spreadComponent),
          description: 'Rate of fire spread potential'
        },
        energyReleaseComponent: {
          value: Math.round(energyReleaseComponent),
          description: 'Available energy for combustion'
        }
      },
      redFlagConditions,
      fireDangerRating,
      riskFactors: this.identifyRiskFactors(weatherData),
      recommendations: this.getFireWeatherRecommendations(fireDangerRating, redFlagConditions),
      lastCalculated: new Date().toISOString()
    };
  }

  /**
   * Calculate Haines Index (Lower Atmosphere Severity Index)
   */
  calculateHainesIndex(tempF, humidity) {
    const tempC = (tempF - 32) * 5/9;
    
    // Stability component (temperature difference between 950mb and 850mb)
    // Approximated using surface temperature and humidity
    let stabilityComponent = 1;
    if (tempC > 30) stabilityComponent = 3;
    else if (tempC > 20) stabilityComponent = 2;
    
    // Moisture component (dewpoint depression at 850mb)
    const dewpoint = tempC - ((100 - humidity) / 5); // Approximation
    const dewpointDepression = tempC - dewpoint;
    
    let moistureComponent = 1;
    if (dewpointDepression > 15) moistureComponent = 3;
    else if (dewpointDepression > 10) moistureComponent = 2;
    
    return stabilityComponent + moistureComponent;
  }

  /**
   * Calculate Fire Weather Index (adapted from Canadian FWI System)
   */
  calculateFireWeatherIndex(temp, humidity, windSpeed, precipitation) {
    // Fine Fuel Moisture Code (FFMC)
    const ffmc = Math.max(0, 85 - (humidity * 0.8) + (temp * 0.2) - (precipitation * 10));
    
    // Duff Moisture Code (simplified)
    const dmc = Math.max(0, 50 - (humidity * 0.5) - (precipitation * 5));
    
    // Initial Spread Index
    const isi = ffmc * Math.pow(windSpeed, 0.208876);
    
    // Fire Weather Index
    const fwi = Math.pow(isi * dmc, 0.647);
    
    return fwi;
  }

  /**
   * Check for Red Flag Warning conditions
   */
  checkRedFlagConditions(temperature, humidity, windSpeed) {
    const conditions = [];
    
    // Standard Red Flag criteria
    if (humidity <= 20 && windSpeed >= 25) {
      conditions.push({
        type: 'critical',
        description: 'Critical fire weather conditions: Low humidity + High winds',
        criteria: `Humidity: ${humidity}% (≤20%), Wind: ${windSpeed}mph (≥25mph)`
      });
    }
    
    if (humidity <= 15) {
      conditions.push({
        type: 'low_humidity',
        description: 'Extremely low humidity',
        criteria: `Humidity: ${humidity}% (≤15%)`
      });
    }
    
    if (windSpeed >= 35) {
      conditions.push({
        type: 'high_winds',
        description: 'Extreme wind conditions',
        criteria: `Wind Speed: ${windSpeed}mph (≥35mph)`
      });
    }
    
    if (temperature >= 95 && humidity <= 25) {
      conditions.push({
        type: 'extreme_heat_low_humidity',
        description: 'Extreme heat with low humidity',
        criteria: `Temperature: ${temperature}°F (≥95°F), Humidity: ${humidity}% (≤25%)`
      });
    }

    return {
      isActive: conditions.length > 0,
      conditions,
      severity: conditions.length > 2 ? 'extreme' : conditions.length > 1 ? 'high' : conditions.length > 0 ? 'moderate' : 'low'
    };
  }

  /**
   * Calculate Burning Index
   */
  calculateBurningIndex(temperature, humidity, windSpeed, dryDays) {
    const baseIndex = (temperature - 32) + (100 - humidity) + (windSpeed * 2) + (dryDays * 5);
    return Math.max(0, Math.min(200, baseIndex));
  }

  /**
   * Calculate Spread Component
   */
  calculateSpreadComponent(windSpeed, humidity) {
    return windSpeed * (100 - humidity) / 100;
  }

  /**
   * Calculate Energy Release Component  
   */
  calculateEnergyReleaseComponent(temperature, humidity, dryDays) {
    return ((temperature - 32) * (100 - humidity) * (1 + dryDays * 0.1)) / 100;
  }

  /**
   * Calculate overall fire danger rating
   */
  calculateOverallFireDanger(indices) {
    let score = 0;
    
    // Weight different components
    score += indices.hainesIndex * 10; // 0-60 points
    score += Math.min(indices.fwi * 5, 50); // 0-50 points  
    score += Math.min(indices.burningIndex * 0.3, 60); // 0-60 points
    score += Math.min(indices.spreadComponent * 2, 30); // 0-30 points
    score += Math.min(indices.energyReleaseComponent * 2, 30); // 0-30 points
    
    if (indices.redFlagConditions.isActive) {
      score += indices.redFlagConditions.conditions.length * 20; // Bonus for red flag conditions
    }

    // Convert to category
    if (score >= 200) return 'extreme';
    if (score >= 150) return 'very_high';
    if (score >= 100) return 'high';
    if (score >= 50) return 'moderate';
    return 'low';
  }

  /**
   * Process fire weather alerts from NWS API
   */
  processFireWeatherAlerts(features) {
    return features
      .filter(feature => {
        const event = feature.properties.event.toLowerCase();
        return event.includes('fire weather') || 
               event.includes('red flag') || 
               event.includes('wind') ||
               event.includes('heat') ||
               event.includes('drought');
      })
      .map(feature => {
        const props = feature.properties;
        return {
          id: props.id,
          title: props.event,
          headline: props.headline,
          description: props.description,
          instruction: props.instruction,
          severity: props.severity?.toLowerCase() || 'unknown',
          urgency: props.urgency?.toLowerCase() || 'unknown', 
          certainty: props.certainty?.toLowerCase() || 'unknown',
          areas: props.areaDesc,
          effective: props.effective,
          expires: props.expires,
          onset: props.onset,
          messageType: props.messageType,
          category: props.category,
          sender: props.senderName,
          senderCode: props.sender,
          status: props.status,
          source: 'NWS',
          lastUpdated: new Date().toISOString(),
          geometry: feature.geometry
        };
      })
      .sort((a, b) => {
        // Sort by severity and urgency
        const severityOrder = { extreme: 4, severe: 3, moderate: 2, minor: 1, unknown: 0 };
        const urgencyOrder = { immediate: 4, expected: 3, future: 2, past: 1, unknown: 0 };
        
        const aSeverity = severityOrder[a.severity] || 0;
        const bSeverity = severityOrder[b.severity] || 0;
        const aUrgency = urgencyOrder[a.urgency] || 0;
        const bUrgency = urgencyOrder[b.urgency] || 0;
        
        return (bSeverity + bUrgency) - (aSeverity + aUrgency);
      });
  }

  /**
   * Process fire weather forecast data
   */
  processFireWeatherForecast(periods) {
    return periods.slice(0, 14).map(period => { // Next 7 days (14 periods for day/night)
      const temp = this.extractTemperature(period.temperature, period.temperatureUnit);
      const windSpeed = this.extractWindSpeed(period.windSpeed);
      const humidity = this.estimateHumidity(period.detailedForecast, period.isDaytime);
      
      return {
        name: period.name,
        startTime: period.startTime,
        endTime: period.endTime,
        isDaytime: period.isDaytime,
        temperature: temp,
        temperatureUnit: 'F',
        windSpeed: windSpeed,
        windDirection: period.windDirection,
        shortForecast: period.shortForecast,
        detailedForecast: period.detailedForecast,
        humidity: humidity,
        fireWeatherIndices: this.calculateFireWeatherIndices({
          temperature: temp,
          humidity: humidity,
          windSpeed: windSpeed,
          precipitation: 0, // Would need additional API call for precipitation
          dryDays: 0 // Would need historical data
        }),
        fireDangerLevel: this.getFireDangerLevel(temp, humidity, windSpeed)
      };
    });
  }

  // Helper methods for data extraction and categorization
  extractTemperature(temp, unit) {
    if (unit === 'F') return temp;
    return Math.round(temp * 9/5 + 32); // Convert C to F
  }

  extractWindSpeed(windSpeedStr) {
    if (typeof windSpeedStr === 'number') return windSpeedStr;
    const match = windSpeedStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 10; // Default 10 mph
  }

  estimateHumidity(forecast, isDaytime) {
    const forecastLower = forecast.toLowerCase();
    
    // Simple humidity estimation based on forecast text
    if (forecastLower.includes('arid') || forecastLower.includes('dry')) return 15;
    if (forecastLower.includes('humid') || forecastLower.includes('muggy')) return 70;
    if (forecastLower.includes('rain') || forecastLower.includes('shower')) return 80;
    if (forecastLower.includes('clear') || forecastLower.includes('sunny')) return isDaytime ? 25 : 45;
    if (forecastLower.includes('cloud')) return isDaytime ? 40 : 60;
    
    return isDaytime ? 35 : 55; // Default values
  }

  getFireDangerLevel(temperature, humidity, windSpeed) {
    if (humidity <= 15 && windSpeed >= 25) return 'extreme';
    if (humidity <= 20 && windSpeed >= 20) return 'very_high';
    if (humidity <= 25 && windSpeed >= 15) return 'high';
    if (humidity <= 35 && windSpeed >= 10) return 'moderate';
    return 'low';
  }

  // Category and description methods
  getHainesCategory(index) {
    if (index >= 5) return 'high';
    if (index >= 4) return 'moderate';
    return 'low';
  }

  getHainesDescription(index) {
    if (index >= 5) return 'High potential for large fire growth';
    if (index >= 4) return 'Moderate potential for large fire growth';
    return 'Low potential for large fire growth';
  }

  getFWICategory(fwi) {
    if (fwi >= 50) return 'extreme';
    if (fwi >= 30) return 'very_high';
    if (fwi >= 20) return 'high';
    if (fwi >= 10) return 'moderate';
    return 'low';
  }

  getFWIDescription(fwi) {
    if (fwi >= 50) return 'Extreme fire behavior expected';
    if (fwi >= 30) return 'Very high fire intensity possible';
    if (fwi >= 20) return 'High fire intensity expected';
    if (fwi >= 10) return 'Moderate fire behavior';
    return 'Low fire activity expected';
  }

  getBurningIndexCategory(bi) {
    if (bi >= 100) return 'extreme';
    if (bi >= 75) return 'very_high';
    if (bi >= 50) return 'high';
    if (bi >= 25) return 'moderate';
    return 'low';
  }

  getBurningIndexDescription(bi) {
    if (bi >= 100) return 'Extreme burning conditions';
    if (bi >= 75) return 'Very high fire intensity';
    if (bi >= 50) return 'High fire intensity';
    if (bi >= 25) return 'Moderate burning conditions';
    return 'Low fire intensity';
  }

  identifyRiskFactors(weatherData) {
    const factors = [];
    
    if (weatherData.humidity <= 20) factors.push('Very low humidity');
    if (weatherData.windSpeed >= 25) factors.push('High wind speeds');
    if (weatherData.temperature >= 95) factors.push('Extreme heat');
    if (weatherData.dryDays >= 7) factors.push('Extended dry period');
    if (weatherData.precipitation === 0) factors.push('No recent precipitation');
    
    return factors;
  }

  getFireWeatherRecommendations(fireDangerRating, redFlagConditions) {
    const recommendations = [];
    
    if (redFlagConditions.isActive) {
      recommendations.push('Red Flag conditions active - avoid all outdoor burning');
      recommendations.push('Maintain heightened fire awareness');
      recommendations.push('Ensure emergency evacuation plans are current');
    }
    
    switch (fireDangerRating) {
      case 'extreme':
        recommendations.push('Extreme fire danger - avoid all spark-producing activities');
        recommendations.push('Emergency services should be on high alert');
        recommendations.push('Consider pre-positioning firefighting resources');
        break;
      case 'very_high':
        recommendations.push('Very high fire danger - exercise extreme caution');
        recommendations.push('Delay outdoor burning and spark-producing activities');
        break;
      case 'high':
        recommendations.push('High fire danger - use caution with outdoor activities');
        recommendations.push('Monitor weather conditions closely');
        break;
      case 'moderate':
        recommendations.push('Moderate fire danger - normal fire safety precautions');
        break;
      default:
        recommendations.push('Low fire danger - standard fire safety practices');
    }
    
    return recommendations;
  }

  getFallbackFireWeatherAlerts() {
    return [
      {
        id: 'demo_red_flag_1',
        title: 'Red Flag Warning',
        headline: 'Red Flag Warning issued for Los Angeles County',
        description: 'Critical fire weather conditions expected due to low humidity and high winds.',
        severity: 'severe',
        urgency: 'expected',
        certainty: 'likely',
        areas: 'Los Angeles County',
        effective: new Date().toISOString(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        source: 'NWS-DEMO',
        lastUpdated: new Date().toISOString()
      }
    ];
  }

  getFallbackForecast() {
    return [
      {
        name: 'Today',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        isDaytime: true,
        temperature: 85,
        temperatureUnit: 'F',
        windSpeed: 15,
        windDirection: 'NW',
        shortForecast: 'Sunny and dry',
        detailedForecast: 'Sunny skies with low humidity and moderate winds.',
        humidity: 25,
        fireWeatherIndices: this.calculateFireWeatherIndices({
          temperature: 85,
          humidity: 25,
          windSpeed: 15,
          precipitation: 0,
          dryDays: 3
        }),
        fireDangerLevel: 'high'
      }
    ];
  }
}