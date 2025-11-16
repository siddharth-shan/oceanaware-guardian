import { useState, useEffect, useCallback, useMemo } from 'react';
import { PurpleAirService } from '../services/api/purpleAirService.js';

/**
 * React hook for PurpleAir real-time air quality monitoring
 * Provides crowdsourced air quality data with wildfire smoke detection
 */
export const usePurpleAir = (userLocation, options = {}) => {
  const {
    radius = 50, // Default 50km radius
    autoRefresh = true,
    refreshInterval = 120000, // 2 minutes (matches PurpleAir update frequency)
    enableSmokeDetection = true
  } = options;

  const [airQualityData, setAirQualityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);

  const purpleAirService = useMemo(() => new PurpleAirService(), []);

  // Helper functions - defined first to avoid initialization issues
  // Assess health risk
  const assessHealthRisk = useCallback((summary, smokeDetection) => {
    const { aqi, pm25 } = summary;
    
    let riskLevel = 'low';
    let riskScore = 0;
    let riskFactors = [];

    // Base AQI risk
    if (aqi > 300) {
      riskLevel = 'emergency';
      riskScore = 100;
      riskFactors.push('Hazardous air quality');
    } else if (aqi > 200) {
      riskLevel = 'very_high';
      riskScore = 85;
      riskFactors.push('Very unhealthy air quality');
    } else if (aqi > 150) {
      riskLevel = 'high';
      riskScore = 70;
      riskFactors.push('Unhealthy air quality');
    } else if (aqi > 100) {
      riskLevel = 'moderate';
      riskScore = 50;
      riskFactors.push('Unhealthy for sensitive groups');
    } else if (aqi > 50) {
      riskLevel = 'low_moderate';
      riskScore = 25;
      riskFactors.push('Moderate air quality');
    }

    // Smoke detection enhancement
    if (smokeDetection.detected) {
      riskScore += 20;
      riskFactors.push(`${smokeDetection.intensity} wildfire smoke`);
      
      if (smokeDetection.intensity === 'severe') {
        riskLevel = 'emergency';
        riskScore = Math.max(riskScore, 95);
      } else if (smokeDetection.intensity === 'heavy') {
        riskLevel = riskLevel === 'low' ? 'high' : riskLevel;
        riskScore = Math.max(riskScore, 80);
      }
    }

    // PM2.5 specific risks
    if (pm25 > 55 && !riskFactors.some(f => f.includes('smoke'))) {
      riskFactors.push('Elevated particulate matter');
    }

    return {
      level: riskLevel,
      score: Math.min(100, riskScore),
      factors: riskFactors,
      recommendations: getHealthRiskRecommendations(riskLevel, smokeDetection.detected)
    };
  }, []);

  // Get health risk recommendations
  const getHealthRiskRecommendations = useCallback((riskLevel, smokeDetected) => {
    const recommendations = [];
    
    switch (riskLevel) {
      case 'emergency':
        recommendations.push('🚨 Stay indoors immediately');
        recommendations.push('⚕️ Seek medical attention if experiencing symptoms');
        recommendations.push('🏠 Seal windows and doors, use air purifiers');
        break;
      case 'very_high':
        recommendations.push('🏠 Avoid all outdoor activities');
        recommendations.push('😷 Wear N95 masks if you must go outside');
        recommendations.push('🚪 Keep windows and doors closed');
        break;
      case 'high':
        recommendations.push('⚠️ Limit outdoor activities, especially for sensitive groups');
        recommendations.push('🏃‍♀️ Avoid prolonged or heavy outdoor exertion');
        recommendations.push('👥 Children and elderly should stay indoors');
        break;
      case 'moderate':
        recommendations.push('👥 Sensitive individuals should limit outdoor activities');
        recommendations.push('🌬️ Consider reducing time outdoors');
        break;
      default:
        recommendations.push('✅ Air quality is acceptable for outdoor activities');
    }

    if (smokeDetected) {
      recommendations.push('🔥 Wildfire smoke present - take extra precautions');
    }

    return recommendations;
  }, []);

  // Estimate AQI trend (simplified without historical data)
  const estimateAQITrend = useCallback((sensors, summary) => {
    // This would ideally use historical data
    // For now, use sensor variation to estimate trend
    const pm25Values = sensors.map(s => s.pm25);
    const avgPM25 = summary.pm25;
    
    const highReadings = pm25Values.filter(val => val > avgPM25 * 1.2).length;
    const lowReadings = pm25Values.filter(val => val < avgPM25 * 0.8).length;
    
    if (highReadings > lowReadings * 2) return 'worsening';
    if (lowReadings > highReadings * 2) return 'improving';
    return 'stable';
  }, []);

  // Assess coverage quality
  const assessCoverageQuality = useCallback((metadata, sensors) => {
    const { totalSensors, dataQuality, radius } = metadata;
    
    let coverage = 'poor';
    if (totalSensors >= 5 && dataQuality === 'excellent') coverage = 'excellent';
    else if (totalSensors >= 3 && dataQuality === 'good') coverage = 'good';
    else if (totalSensors >= 2 && dataQuality === 'fair') coverage = 'fair';
    
    const density = totalSensors / (Math.PI * Math.pow(radius, 2)) * 100; // Sensors per 100 km²
    
    return {
      level: coverage,
      sensorDensity: Math.round(density * 100) / 100,
      dataQuality,
      recommendation: getCoverageRecommendation(coverage, totalSensors)
    };
  }, []);

  // Get coverage recommendation
  const getCoverageRecommendation = useCallback((coverage, sensorCount) => {
    if (coverage === 'excellent') return 'Excellent sensor coverage provides reliable data';
    if (coverage === 'good') return 'Good sensor coverage with reliable measurements';
    if (coverage === 'fair') return 'Limited sensor coverage - data may vary locally';
    return sensorCount === 0 ? 'No sensors found in area - consider alternative monitoring' : 
           'Poor sensor coverage - supplement with other air quality sources';
  }, []);

  // Get activity recommendation
  const getActivityRecommendation = useCallback((aqiSafe, smokeSafe, activityType) => {
    if (aqiSafe && smokeSafe) return `Safe for ${activityType.replace('_', ' ')}`;
    if (!aqiSafe && !smokeSafe) return `Not recommended due to poor air quality and smoke`;
    if (!aqiSafe) return `Not recommended due to poor air quality`;
    return `Use caution due to smoke conditions`;
  }, []);

  const fetchAirQualityData = useCallback(async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);

    try {
      const data = await purpleAirService.getAirQualityNearLocation(
        userLocation.lat,
        userLocation.lng,
        radius
      );

      // Add smoke plume data if smoke is detected
      if (data && data.smokeDetection?.detected) {
        // Generate smoke plume coordinates based on user location and smoke intensity
        const { lat, lng } = userLocation;
        const intensity = data.smokeDetection.intensity;
        
        // Create plume size based on intensity
        const plumeSize = intensity === 'severe' ? 0.05 : 
                         intensity === 'heavy' ? 0.03 : 0.02;
        
        data.smokePlume = {
          source: 'PurpleAir sensor network',
          intensity: intensity,
          coordinates: [
            [lat + plumeSize, lng - plumeSize],
            [lat + plumeSize, lng + plumeSize],
            [lat - plumeSize, lng + plumeSize],
            [lat - plumeSize, lng - plumeSize]
          ]
        };
      }
      
      setAirQualityData(data);
      setLastUpdate(new Date());
      setServiceStatus(purpleAirService.getStatus());
    } catch (err) {
      console.error('PurpleAir fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userLocation, radius, purpleAirService]);

  // Auto-refresh air quality data
  useEffect(() => {
    fetchAirQualityData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchAirQualityData, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchAirQualityData, autoRefresh, refreshInterval]);

  // Processed air quality analytics
  const analytics = useMemo(() => {
    if (!airQualityData) return null;

    const { summary, sensors, smokeDetection, metadata } = airQualityData;
    
    // Sensor distribution analysis
    const sensorsByDistance = {
      near: sensors.filter(s => s.distance <= 10).length,    // Within 10km
      medium: sensors.filter(s => s.distance > 10 && s.distance <= 25).length, // 10-25km
      far: sensors.filter(s => s.distance > 25).length        // Beyond 25km
    };

    // AQI distribution
    const aqiDistribution = {
      good: sensors.filter(s => s.aqi <= 50).length,
      moderate: sensors.filter(s => s.aqi > 50 && s.aqi <= 100).length,
      unhealthySensitive: sensors.filter(s => s.aqi > 100 && s.aqi <= 150).length,
      unhealthy: sensors.filter(s => s.aqi > 150 && s.aqi <= 200).length,
      veryUnhealthy: sensors.filter(s => s.aqi > 200 && s.aqi <= 300).length,
      hazardous: sensors.filter(s => s.aqi > 300).length
    };

    // Data freshness analysis
    const freshData = sensors.filter(s => !s.dataAge || s.dataAge <= 10).length; // Less than 10 minutes old
    const dataFreshness = sensors.length > 0 ? (freshData / sensors.length) * 100 : 0;

    // Spatial variation analysis
    const pm25Values = sensors.map(s => s.pm25);
    const pm25Min = Math.min(...pm25Values);
    const pm25Max = Math.max(...pm25Values);
    const pm25Range = pm25Max - pm25Min;
    
    // Health risk assessment
    const healthRisk = assessHealthRisk(summary, smokeDetection);
    
    // Air quality trend (simplified - would need historical data for real trend)
    const aqiTrend = estimateAQITrend(sensors, summary);

    return {
      sensorDistribution: sensorsByDistance,
      aqiDistribution,
      dataFreshness: Math.round(dataFreshness),
      spatialVariation: {
        pm25Range,
        pm25Min: Math.round(pm25Min * 10) / 10,
        pm25Max: Math.round(pm25Max * 10) / 10,
        uniformity: pm25Range < 10 ? 'uniform' : pm25Range < 25 ? 'variable' : 'highly_variable'
      },
      healthRisk,
      aqiTrend,
      coverageQuality: assessCoverageQuality(metadata, sensors),
      smokeAnalysis: smokeDetection
    };
  }, [airQualityData]);

  // Get sensors by AQI category
  const getSensorsByAQI = useCallback((minAQI, maxAQI) => {
    if (!airQualityData) return [];
    return airQualityData.sensors.filter(sensor => 
      sensor.aqi >= minAQI && sensor.aqi <= maxAQI
    );
  }, [airQualityData]);

  // Get nearest sensors
  const getNearestSensors = useCallback((count = 5) => {
    if (!airQualityData) return [];
    return airQualityData.sensors
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count);
  }, [airQualityData]);

  // Get sensors with poor air quality
  const getProblemSensors = useCallback(() => {
    if (!airQualityData) return [];
    return airQualityData.sensors.filter(sensor => sensor.aqi > 100);
  }, [airQualityData]);

  // Check if air quality is safe for activities
  const isSafeForActivity = useCallback((activityType) => {
    if (!airQualityData) return null;
    
    const { aqi } = airQualityData.summary;
    const { detected: smokeDetected, intensity: smokeIntensity } = airQualityData.smokeDetection;
    
    const activityThresholds = {
      outdoor_exercise: { maxAQI: 100, allowSmoke: false },
      outdoor_work: { maxAQI: 150, allowSmoke: false },
      short_outdoor: { maxAQI: 200, allowSmoke: true },
      emergency_outdoor: { maxAQI: 300, allowSmoke: true }
    };
    
    const threshold = activityThresholds[activityType];
    if (!threshold) return null;
    
    const aqiSafe = aqi <= threshold.maxAQI;
    const smokeSafe = !smokeDetected || threshold.allowSmoke;
    
    return {
      safe: aqiSafe && smokeSafe,
      aqi,
      smokeDetected,
      smokeIntensity,
      recommendation: getActivityRecommendation(aqiSafe, smokeSafe, activityType)
    };
  }, [airQualityData, getActivityRecommendation]);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchAirQualityData();
  }, [fetchAirQualityData]);

  return {
    // Data
    airQualityData,
    analytics,
    
    // State
    loading,
    error,
    lastUpdate,
    serviceStatus,
    
    // Actions
    refresh,
    getSensorsByAQI,
    getNearestSensors,
    getProblemSensors,
    isSafeForActivity,
    
    // Service access
    purpleAirService
  };
};