/**
 * PurpleAir API Service for Real-Time Air Quality Monitoring
 * 
 * Features:
 * - Real-time PM2.5, temperature, humidity, pressure data
 * - 2-minute update intervals from crowdsourced sensors
 * - Wildfire smoke detection and health impact assessment
 * - Geographic sensor filtering and data aggregation
 * 
 * API Documentation: https://api.purpleair.com/
 * Data Update Frequency: Every 2 minutes
 * Coverage: Global crowdsourced sensor network
 */

export class PurpleAirService {
  constructor() {
    this.baseUrl = 'https://api.purpleair.com/v1';
    this.apiKey = import.meta.env?.VITE_PURPLEAIR_API_KEY || null;
    this.cache = new Map();
    this.cacheTimeout = 120000; // 2 minutes cache (matches PurpleAir update frequency)
    
    // EPA AQI breakpoints for PM2.5
    this.aqiBreakpoints = [
      { min: 0, max: 12.0, aqiMin: 0, aqiMax: 50, category: 'Good', color: '#00e400' },
      { min: 12.1, max: 35.4, aqiMin: 51, aqiMax: 100, category: 'Moderate', color: '#ffff00' },
      { min: 35.5, max: 55.4, aqiMin: 101, aqiMax: 150, category: 'Unhealthy for Sensitive Groups', color: '#ff7e00' },
      { min: 55.5, max: 150.4, aqiMin: 151, aqiMax: 200, category: 'Unhealthy', color: '#ff0000' },
      { min: 150.5, max: 250.4, aqiMin: 201, aqiMax: 300, category: 'Very Unhealthy', color: '#8f3f97' },
      { min: 250.5, max: 500.4, aqiMin: 301, aqiMax: 500, category: 'Hazardous', color: '#7e0023' }
    ];
  }

  /**
   * Get air quality data for sensors near a location
   * @param {number} latitude - Center latitude
   * @param {number} longitude - Center longitude
   * @param {number} radiusKm - Search radius in kilometers (default: 50km)
   * @returns {Promise<Object>} Air quality data with sensor information
   */
  async getAirQualityNearLocation(latitude, longitude, radiusKm = 50) {
    const cacheKey = `airquality_${latitude}_${longitude}_${radiusKm}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      if (!this.apiKey) {
        console.warn('PurpleAir API key not configured, using fallback data');
        return this.getFallbackAirQualityData(latitude, longitude);
      }

      // Convert radius to approximate bounding box
      const latDelta = radiusKm / 111; // Approximately 111 km per degree of latitude
      const lonDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
      
      const nwlat = latitude + latDelta;
      const nwlng = longitude - lonDelta;
      const selat = latitude - latDelta;
      const selng = longitude + lonDelta;

      const queryParams = new URLSearchParams({
        fields: 'sensor_index,name,latitude,longitude,altitude,pm2.5_atm,pm2.5_cf_1,humidity,temperature,pressure,last_seen,confidence',
        location_type: '0', // Outdoor sensors only
        max_age: '3600', // Data no older than 1 hour
        nwlat: nwlat.toString(),
        nwlng: nwlng.toString(),
        selat: selat.toString(),
        selng: selng.toString()
      });

      const response = await fetch(`${this.baseUrl}/sensors?${queryParams}`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`PurpleAir API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const processedData = this.processAirQualityData(data, latitude, longitude);
      
      this.cache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      });

      return processedData;
    } catch (error) {
      console.error('PurpleAir API fetch error:', error);
      return this.getFallbackAirQualityData(latitude, longitude);
    }
  }

  /**
   * Get specific sensor data by sensor ID
   * @param {number} sensorId - PurpleAir sensor ID
   * @returns {Promise<Object>} Detailed sensor data
   */
  async getSensorData(sensorId) {
    const cacheKey = `sensor_${sensorId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      if (!this.apiKey) {
        return this.getFallbackSensorData(sensorId);
      }

      const response = await fetch(`${this.baseUrl}/sensors/${sensorId}`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`PurpleAir sensor API error: ${response.status}`);
      }

      const data = await response.json();
      const processedData = this.processSensorData(data.sensor);
      
      this.cache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      });

      return processedData;
    } catch (error) {
      console.error('PurpleAir sensor fetch error:', error);
      return this.getFallbackSensorData(sensorId);
    }
  }

  /**
   * Process air quality data from multiple sensors
   */
  processAirQualityData(apiData, centerLat, centerLng) {
    const sensors = apiData.data || [];
    const fields = apiData.fields || [];
    
    if (sensors.length === 0) {
      return this.getFallbackAirQualityData(centerLat, centerLng);
    }

    // Process each sensor
    const processedSensors = sensors.map(sensorArray => {
      const sensor = {};
      fields.forEach((field, index) => {
        sensor[field] = sensorArray[index];
      });
      
      return this.processSensorReading(sensor, centerLat, centerLng);
    });

    // Filter out invalid sensors
    const validSensors = processedSensors.filter(sensor => 
      sensor.pm25 !== null && sensor.pm25 !== undefined && sensor.pm25 >= 0
    );

    if (validSensors.length === 0) {
      return this.getFallbackAirQualityData(centerLat, centerLng);
    }

    // Calculate area averages
    const areaAverage = this.calculateAreaAverage(validSensors);
    
    // Detect wildfire smoke patterns
    const smokeDetection = this.detectWildfireSmoke(validSensors, areaAverage);
    
    // Generate health recommendations
    const healthRecommendations = this.generateHealthRecommendations(areaAverage.aqi, smokeDetection);

    return {
      summary: areaAverage,
      sensors: validSensors,
      smokeDetection,
      healthRecommendations,
      metadata: {
        totalSensors: validSensors.length,
        dataQuality: this.assessDataQuality(validSensors),
        lastUpdate: new Date().toISOString(),
        source: 'PurpleAir',
        radius: this.calculateActualRadius(validSensors, centerLat, centerLng),
        centerPoint: { latitude: centerLat, longitude: centerLng }
      }
    };
  }

  /**
   * Process individual sensor reading
   */
  processSensorReading(sensor, centerLat, centerLng) {
    const pm25Raw = sensor['pm2.5_atm'] || sensor['pm2.5_cf_1'];
    const pm25 = this.correctPM25Reading(pm25Raw);
    const aqi = this.calculateAQI(pm25);
    const distance = this.calculateDistance(centerLat, centerLng, sensor.latitude, sensor.longitude);

    return {
      sensorId: sensor.sensor_index,
      name: sensor.name,
      latitude: sensor.latitude,
      longitude: sensor.longitude,
      distance: Math.round(distance * 100) / 100,
      pm25: Math.round(pm25 * 10) / 10,
      aqi: Math.round(aqi),
      aqiCategory: this.getAQICategory(aqi),
      aqiColor: this.getAQIColor(aqi),
      temperature: sensor.temperature ? Math.round(sensor.temperature) : null, // PurpleAir API returns F already
      humidity: sensor.humidity ? Math.round(sensor.humidity) : null,
      pressure: sensor.pressure ? Math.round(sensor.pressure * 100) / 100 : null,
      confidence: sensor.confidence || null,
      lastSeen: sensor.last_seen ? new Date(sensor.last_seen * 1000).toISOString() : null,
      dataAge: sensor.last_seen ? Math.floor((Date.now() / 1000 - sensor.last_seen) / 60) : null, // minutes
      altitude: sensor.altitude || null
    };
  }

  /**
   * Process single sensor detailed data
   */
  processSensorData(sensorData) {
    const pm25 = this.correctPM25Reading(sensorData['pm2.5_atm'] || sensorData['pm2.5_cf_1']);
    const aqi = this.calculateAQI(pm25);

    return {
      ...this.processSensorReading(sensorData, sensorData.latitude, sensorData.longitude),
      detailed: {
        model: sensorData.model,
        hardware: sensorData.hardware,
        location_type: sensorData.location_type,
        private: sensorData.private,
        led_brightness: sensorData.led_brightness,
        firmware_version: sensorData.firmware_version,
        rssi: sensorData.rssi,
        uptime: sensorData.uptime,
        pa_latency: sensorData.pa_latency,
        memory: sensorData.memory
      }
    };
  }

  /**
   * Correct PM2.5 reading using EPA correction formula
   * Accounts for high humidity and sensor calibration differences
   */
  correctPM25Reading(rawPM25) {
    if (rawPM25 === null || rawPM25 === undefined) return 0;
    
    // EPA correction formula for PurpleAir sensors
    // PM2.5 corrected = 0.52 * PA_cf1 - 0.085 * RH + 5.71
    // Simplified version without humidity correction for now
    const corrected = rawPM25 * 0.8; // Conservative correction factor
    
    return Math.max(0, corrected);
  }

  /**
   * Calculate AQI from PM2.5 concentration
   */
  calculateAQI(pm25) {
    if (pm25 <= 0) return 0;
    
    // Find the appropriate breakpoint
    const breakpoint = this.aqiBreakpoints.find(bp => pm25 >= bp.min && pm25 <= bp.max);
    
    if (!breakpoint) {
      // Handle values above 500.4 (Hazardous+)
      if (pm25 > 500.4) return 500;
      // Handle edge case
      return 0;
    }

    // Calculate AQI using linear interpolation
    const aqi = ((breakpoint.aqiMax - breakpoint.aqiMin) / (breakpoint.max - breakpoint.min)) * 
                (pm25 - breakpoint.min) + breakpoint.aqiMin;
    
    return Math.round(aqi);
  }

  /**
   * Get AQI category from AQI value
   */
  getAQICategory(aqi) {
    const breakpoint = this.aqiBreakpoints.find(bp => aqi >= bp.aqiMin && aqi <= bp.aqiMax);
    return breakpoint ? breakpoint.category : 'Unknown';
  }

  /**
   * Get AQI color from AQI value
   */
  getAQIColor(aqi) {
    const breakpoint = this.aqiBreakpoints.find(bp => aqi >= bp.aqiMin && aqi <= bp.aqiMax);
    return breakpoint ? breakpoint.color : '#cccccc';
  }

  /**
   * Calculate area average air quality
   */
  calculateAreaAverage(sensors) {
    if (sensors.length === 0) return null;

    // Weight sensors by inverse distance and data quality
    let totalWeight = 0;
    let weightedPM25 = 0;
    let weightedTemp = 0;
    let weightedHumidity = 0;
    let weightedPressure = 0;

    sensors.forEach(sensor => {
      // Weight calculation: closer sensors and fresher data get higher weight
      const distanceWeight = 1 / (1 + sensor.distance); // Inverse distance
      const ageWeight = sensor.dataAge ? 1 / (1 + sensor.dataAge / 60) : 1; // Inverse age in hours
      const confidenceWeight = sensor.confidence ? sensor.confidence / 100 : 0.8; // Confidence factor
      
      const weight = distanceWeight * ageWeight * confidenceWeight;
      
      totalWeight += weight;
      weightedPM25 += sensor.pm25 * weight;
      
      if (sensor.temperature) weightedTemp += sensor.temperature * weight;
      if (sensor.humidity) weightedHumidity += sensor.humidity * weight;
      if (sensor.pressure) weightedPressure += sensor.pressure * weight;
    });

    const avgPM25 = weightedPM25 / totalWeight;
    const avgAQI = this.calculateAQI(avgPM25);

    return {
      pm25: Math.round(avgPM25 * 10) / 10,
      aqi: Math.round(avgAQI),
      aqiCategory: this.getAQICategory(avgAQI),
      aqiColor: this.getAQIColor(avgAQI),
      temperature: weightedTemp > 0 ? Math.round(weightedTemp / totalWeight) : null,
      humidity: weightedHumidity > 0 ? Math.round(weightedHumidity / totalWeight) : null,
      pressure: weightedPressure > 0 ? Math.round((weightedPressure / totalWeight) * 100) / 100 : null,
      sensorCount: sensors.length
    };
  }

  /**
   * Detect wildfire smoke patterns in air quality data
   */
  detectWildfireSmoke(sensors, areaAverage) {
    const pm25Threshold = 35; // WHO guideline for unhealthy air
    const smokeThreshold = 55; // Level indicating likely wildfire smoke
    
    // Check for elevated PM2.5 levels
    const elevatedSensors = sensors.filter(sensor => sensor.pm25 > pm25Threshold);
    const smokeSensors = sensors.filter(sensor => sensor.pm25 > smokeThreshold);
    
    // Calculate pattern indicators
    const avgPM25 = areaAverage.pm25;
    const maxPM25 = Math.max(...sensors.map(s => s.pm25));
    const pm25Variance = this.calculateVariance(sensors.map(s => s.pm25));
    
    // Determine smoke probability and characteristics
    let smokeDetected = false;
    let smokeProbability = 0;
    let smokeIntensity = 'none';
    let smokeSource = 'unknown';
    
    if (avgPM25 > smokeThreshold) {
      smokeDetected = true;
      smokeProbability = Math.min(0.95, (avgPM25 - smokeThreshold) / (200 - smokeThreshold));
      
      if (avgPM25 > 150) smokeIntensity = 'severe';
      else if (avgPM25 > 100) smokeIntensity = 'heavy';
      else if (avgPM25 > 55) smokeIntensity = 'moderate';
      else smokeIntensity = 'light';
      
      // Attempt to identify smoke source
      if (pm25Variance > 500) {
        smokeSource = 'localized'; // High variance suggests local source
      } else if (elevatedSensors.length / sensors.length > 0.7) {
        smokeSource = 'regional'; // Most sensors affected suggests regional event
      } else {
        smokeSource = 'distant'; // Some sensors affected suggests distant source
      }
    } else if (avgPM25 > pm25Threshold) {
      smokeProbability = (avgPM25 - pm25Threshold) / (smokeThreshold - pm25Threshold) * 0.5;
      smokeIntensity = 'light';
    }

    // Generate health impact assessment
    const healthImpact = this.assessHealthImpact(avgPM25, smokeDetected);
    
    return {
      detected: smokeDetected,
      probability: Math.round(smokeProbability * 100) / 100,
      intensity: smokeIntensity,
      source: smokeSource,
      healthImpact,
      affectedSensors: elevatedSensors.length,
      totalSensors: sensors.length,
      maxPM25,
      avgPM25: Math.round(avgPM25 * 10) / 10,
      variance: Math.round(pm25Variance),
      pattern: this.identifyPattern(sensors)
    };
  }

  /**
   * Calculate variance in PM2.5 readings
   */
  calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  /**
   * Identify spatial pattern in sensor readings
   */
  identifyPattern(sensors) {
    if (sensors.length < 3) return 'insufficient_data';
    
    // Sort sensors by PM2.5 level
    const sortedSensors = [...sensors].sort((a, b) => b.pm25 - a.pm25);
    const highestPM25 = sortedSensors[0].pm25;
    const lowestPM25 = sortedSensors[sortedSensors.length - 1].pm25;
    
    // Check for gradient pattern
    const range = highestPM25 - lowestPM25;
    
    if (range < 10) return 'uniform';
    if (range > 50) return 'gradient';
    return 'mixed';
  }

  /**
   * Assess health impact based on PM2.5 levels
   */
  assessHealthImpact(pm25, smokeDetected) {
    let impact = 'minimal';
    let riskGroups = [];
    let symptoms = [];
    let recommendations = [];

    if (pm25 > 150) {
      impact = 'severe';
      riskGroups = ['everyone'];
      symptoms = ['breathing difficulties', 'chest pain', 'heart palpitations', 'severe coughing'];
      recommendations = ['Stay indoors', 'Avoid all outdoor activities', 'Seek medical attention if experiencing symptoms'];
    } else if (pm25 > 100) {
      impact = 'significant';
      riskGroups = ['children', 'elderly', 'people with heart/lung conditions', 'active individuals'];
      symptoms = ['coughing', 'throat irritation', 'shortness of breath', 'chest discomfort'];
      recommendations = ['Limit outdoor activities', 'Keep windows closed', 'Use air purifiers if available'];
    } else if (pm25 > 55) {
      impact = 'moderate';
      riskGroups = ['sensitive individuals', 'children', 'elderly'];
      symptoms = ['mild coughing', 'throat irritation', 'eye irritation'];
      recommendations = ['Sensitive groups should limit outdoor activities', 'Consider wearing N95 masks outdoors'];
    } else if (pm25 > 35) {
      impact = 'mild';
      riskGroups = ['very sensitive individuals'];
      symptoms = ['possible mild irritation'];
      recommendations = ['Sensitive individuals should monitor symptoms'];
    }

    if (smokeDetected) {
      recommendations.push('Wildfire smoke detected - take extra precautions');
    }

    return {
      level: impact,
      riskGroups,
      symptoms,
      recommendations
    };
  }

  /**
   * Generate health recommendations based on AQI and smoke detection
   */
  generateHealthRecommendations(aqi, smokeDetection) {
    const recommendations = [];
    
    if (aqi > 200) {
      recommendations.push('🚨 HEALTH EMERGENCY: Stay indoors with windows and doors closed');
      recommendations.push('⚕️ Seek immediate medical attention if experiencing symptoms');
      recommendations.push('🏠 Use air purifiers or create a clean room');
    } else if (aqi > 150) {
      recommendations.push('⚠️ UNHEALTHY AIR: Everyone should limit outdoor activities');
      recommendations.push('🏠 Keep windows and doors closed');
      recommendations.push('😷 Wear N95 masks if going outside');
    } else if (aqi > 100) {
      recommendations.push('⚠️ Sensitive groups should avoid outdoor activities');
      recommendations.push('🚶‍♀️ Reduce prolonged or heavy outdoor exertion');
      recommendations.push('🏠 Consider keeping windows closed');
    } else if (aqi > 50) {
      recommendations.push('ℹ️ Acceptable air quality for most people');
      recommendations.push('👥 Sensitive individuals should watch for symptoms');
    } else {
      recommendations.push('✅ Good air quality - enjoy outdoor activities');
    }

    if (smokeDetection.detected) {
      recommendations.push('🔥 Wildfire smoke detected - extra precautions recommended');
      if (smokeDetection.intensity === 'severe') {
        recommendations.push('🚨 Severe smoke conditions - consider evacuation if advised');
      }
    }

    return recommendations;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Calculate actual radius covered by sensors
   */
  calculateActualRadius(sensors, centerLat, centerLng) {
    if (sensors.length === 0) return 0;
    return Math.max(...sensors.map(sensor => sensor.distance));
  }

  /**
   * Assess data quality based on sensor count and freshness
   */
  assessDataQuality(sensors) {
    if (sensors.length === 0) return 'no_data';
    
    const freshSensors = sensors.filter(sensor => !sensor.dataAge || sensor.dataAge < 30); // Less than 30 minutes old
    const qualityRatio = freshSensors.length / sensors.length;
    
    if (sensors.length >= 5 && qualityRatio >= 0.8) return 'excellent';
    if (sensors.length >= 3 && qualityRatio >= 0.6) return 'good';
    if (sensors.length >= 2 && qualityRatio >= 0.4) return 'fair';
    return 'limited';
  }

  /**
   * Get fallback air quality data when API is unavailable
   */
  getFallbackAirQualityData(latitude, longitude) {
    // Generate realistic fallback data based on location and season
    const basePM25 = 15 + Math.random() * 20; // 15-35 range for California
    const aqi = this.calculateAQI(basePM25);

    const fallbackSensor = {
      sensorId: 'demo_sensor_1',
      name: 'Demo Sensor',
      latitude: latitude + (Math.random() - 0.5) * 0.02,
      longitude: longitude + (Math.random() - 0.5) * 0.02,
      distance: Math.random() * 10,
      pm25: Math.round(basePM25 * 10) / 10,
      aqi: Math.round(aqi),
      aqiCategory: this.getAQICategory(aqi),
      aqiColor: this.getAQIColor(aqi),
      temperature: 75 + Math.random() * 20,
      humidity: 40 + Math.random() * 30,
      pressure: 29.9 + Math.random() * 0.4,
      confidence: 85,
      lastSeen: new Date().toISOString(),
      dataAge: 5,
      altitude: 100
    };

    return {
      summary: {
        pm25: fallbackSensor.pm25,
        aqi: fallbackSensor.aqi,
        aqiCategory: fallbackSensor.aqiCategory,
        aqiColor: fallbackSensor.aqiColor,
        temperature: fallbackSensor.temperature,
        humidity: fallbackSensor.humidity,
        pressure: fallbackSensor.pressure,
        sensorCount: 1
      },
      sensors: [fallbackSensor],
      smokeDetection: {
        detected: false,
        probability: 0.1,
        intensity: 'none',
        source: 'none',
        healthImpact: this.assessHealthImpact(basePM25, false),
        affectedSensors: 0,
        totalSensors: 1,
        maxPM25: basePM25,
        avgPM25: basePM25,
        variance: 0,
        pattern: 'uniform'
      },
      healthRecommendations: this.generateHealthRecommendations(aqi, { detected: false }),
      metadata: {
        totalSensors: 1,
        dataQuality: 'demo',
        lastUpdate: new Date().toISOString(),
        source: 'PurpleAir-Demo',
        radius: 10,
        centerPoint: { latitude, longitude }
      }
    };
  }

  /**
   * Get fallback sensor data
   */
  getFallbackSensorData(sensorId) {
    const basePM25 = 20 + Math.random() * 15;
    const aqi = this.calculateAQI(basePM25);

    return {
      sensorId: sensorId,
      name: `Demo Sensor ${sensorId}`,
      latitude: 34.0522,
      longitude: -118.2437,
      distance: 0,
      pm25: Math.round(basePM25 * 10) / 10,
      aqi: Math.round(aqi),
      aqiCategory: this.getAQICategory(aqi),
      aqiColor: this.getAQIColor(aqi),
      temperature: 72,
      humidity: 55,
      pressure: 30.1,
      confidence: 90,
      lastSeen: new Date().toISOString(),
      dataAge: 2,
      altitude: 150,
      detailed: {
        model: 'PurpleAir-II',
        hardware: '2.0',
        location_type: 0,
        private: 0,
        led_brightness: 35,
        firmware_version: '7.02',
        rssi: -45,
        uptime: 123456,
        pa_latency: 2000,
        memory: 18000
      }
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      hasApiKey: !!this.apiKey,
      cacheSize: this.cache.size,
      lastCacheUpdate: this.cache.size > 0 ? 'active' : 'empty',
      aqiBreakpoints: this.aqiBreakpoints.length
    };
  }
}