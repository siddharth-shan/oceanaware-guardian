import { useState, useEffect, useCallback, useMemo } from 'react';
import { EnhancedFireWeatherService } from '../services/api/enhancedFireWeatherService.js';

/**
 * React hook for enhanced fire weather monitoring
 * Provides comprehensive fire weather analysis and forecasting
 */
export const useFireWeather = (userLocation, currentWeather = null, options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 600000, // 10 minutes for weather data
    includeForecast = true,
    includeIndices = true
  } = options;

  const [fireWeatherAlerts, setFireWeatherAlerts] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [fireWeatherIndices, setFireWeatherIndices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fireWeatherService = useMemo(() => new EnhancedFireWeatherService(), []);

  const fetchFireWeatherData = useCallback(async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch fire weather alerts
      const alerts = await fireWeatherService.getFireWeatherAlerts('CA');
      setFireWeatherAlerts(alerts);

      // Fetch detailed forecast if requested
      if (includeForecast) {
        const forecastData = await fireWeatherService.getFireWeatherForecast(
          userLocation.lat,
          userLocation.lng
        );
        setForecast(forecastData);
      }

      // Calculate fire weather indices if current weather is available
      if (includeIndices && currentWeather) {
        const indices = fireWeatherService.calculateFireWeatherIndices({
          temperature: currentWeather.temperature || 75,
          humidity: currentWeather.humidity || 50,
          windSpeed: currentWeather.windSpeed || 10,
          precipitation: currentWeather.precipitation || 0,
          dryDays: currentWeather.dryDays || 0
        });
        setFireWeatherIndices(indices);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Fire weather data fetch error:', err);
      setError(err.message);
      
      // Set fallback data
      setFireWeatherAlerts(fireWeatherService.getFallbackFireWeatherAlerts());
      if (includeForecast) {
        setForecast(fireWeatherService.getFallbackForecast());
      }
    } finally {
      setLoading(false);
    }
  }, [userLocation, currentWeather, includeForecast, includeIndices, fireWeatherService]);

  // Auto-refresh
  useEffect(() => {
    fetchFireWeatherData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchFireWeatherData, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchFireWeatherData, autoRefresh, refreshInterval]);

  // Helper functions - defined first to avoid initialization issues
  const analyzeTrend = useCallback((days) => {
    if (days.length < 3) return 'insufficient_data';

    const dangerValues = days.map(day => {
      const dangerOrder = { extreme: 5, very_high: 4, high: 3, moderate: 2, low: 1 };
      return dangerOrder[day.fireDangerLevel] || 1;
    });

    const firstHalf = dangerValues.slice(0, Math.ceil(dangerValues.length / 2));
    const secondHalf = dangerValues.slice(Math.floor(dangerValues.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;

    if (difference > 0.5) return 'increasing';
    if (difference < -0.5) return 'decreasing';
    return 'stable';
  }, []);

  // Processed alert data
  const processedAlerts = useMemo(() => {
    const activeAlerts = fireWeatherAlerts.filter(alert => {
      const now = new Date();
      const expires = new Date(alert.expires);
      return expires > now;
    });

    const criticalAlerts = activeAlerts.filter(alert => 
      alert.severity === 'severe' || alert.severity === 'extreme'
    );

    const redFlagWarnings = activeAlerts.filter(alert =>
      alert.title.toLowerCase().includes('red flag')
    );

    const fireWeatherWatches = activeAlerts.filter(alert =>
      alert.title.toLowerCase().includes('fire weather watch')
    );

    const windWarnings = activeAlerts.filter(alert =>
      alert.title.toLowerCase().includes('wind') && 
      !alert.title.toLowerCase().includes('fire')
    );

    return {
      all: activeAlerts,
      critical: criticalAlerts,
      redFlag: redFlagWarnings,
      fireWeatherWatch: fireWeatherWatches,
      wind: windWarnings,
      count: activeAlerts.length,
      highestSeverity: activeAlerts.reduce((max, alert) => {
        const severityOrder = { extreme: 4, severe: 3, moderate: 2, minor: 1, unknown: 0 };
        const alertSeverity = severityOrder[alert.severity] || 0;
        const maxSeverity = severityOrder[max] || 0;
        return alertSeverity > maxSeverity ? alert.severity : max;
      }, 'unknown')
    };
  }, [fireWeatherAlerts]);

  // Current fire danger assessment
  const currentFireDanger = useMemo(() => {
    if (!fireWeatherIndices) return null;

    const { fireDangerRating, redFlagConditions, riskFactors, recommendations } = fireWeatherIndices;
    
    // Determine overall threat level
    let threatLevel = 'low';
    let threatMessage = 'Low fire danger conditions';
    let threatColor = 'green';

    if (redFlagConditions.isActive) {
      threatLevel = 'critical';
      threatMessage = 'RED FLAG CONDITIONS ACTIVE';
      threatColor = 'red';
    } else if (fireDangerRating === 'extreme') {
      threatLevel = 'extreme';
      threatMessage = 'Extreme fire danger';
      threatColor = 'red';
    } else if (fireDangerRating === 'very_high') {
      threatLevel = 'very_high';
      threatMessage = 'Very high fire danger';
      threatColor = 'orange';
    } else if (fireDangerRating === 'high') {
      threatLevel = 'high';
      threatMessage = 'High fire danger';
      threatColor = 'orange';
    } else if (fireDangerRating === 'moderate') {
      threatLevel = 'moderate';
      threatMessage = 'Moderate fire danger';
      threatColor = 'yellow';
    }

    return {
      level: threatLevel,
      message: threatMessage,
      color: threatColor,
      rating: fireDangerRating,
      redFlagActive: redFlagConditions.isActive,
      riskFactors,
      recommendations,
      indices: fireWeatherIndices.indices
    };
  }, [fireWeatherIndices]);

  // Forecast analysis
  const forecastAnalysis = useMemo(() => {
    if (!forecast.length) return null;

    const nextDays = forecast.filter(period => period.isDaytime).slice(0, 7);
    
    const dangerDays = nextDays.filter(day => 
      day.fireDangerLevel === 'high' || 
      day.fireDangerLevel === 'very_high' || 
      day.fireDangerLevel === 'extreme'
    );

    const criticalDays = nextDays.filter(day => 
      day.fireDangerLevel === 'extreme' || 
      day.fireWeatherIndices?.redFlagConditions?.isActive
    );

    const trend = analyzeTrend(nextDays);

    return {
      nextSevenDays: nextDays,
      dangerDays: dangerDays.length,
      criticalDays: criticalDays.length,
      worstDay: nextDays.reduce((worst, day) => {
        const dangerOrder = { extreme: 5, very_high: 4, high: 3, moderate: 2, low: 1 };
        const dayDanger = dangerOrder[day.fireDangerLevel] || 1;
        const worstDanger = dangerOrder[worst?.fireDangerLevel] || 0;
        return dayDanger > worstDanger ? day : worst;
      }, null),
      trend,
      avgTemperature: Math.round(nextDays.reduce((sum, day) => sum + day.temperature, 0) / nextDays.length),
      avgHumidity: Math.round(nextDays.reduce((sum, day) => sum + day.humidity, 0) / nextDays.length),
      avgWindSpeed: Math.round(nextDays.reduce((sum, day) => sum + day.windSpeed, 0) / nextDays.length)
    };
  }, [forecast]);

  // Get alerts by severity
  const getAlertsBySeverity = useCallback((severity) => {
    return fireWeatherAlerts.filter(alert => alert.severity === severity);
  }, [fireWeatherAlerts]);

  // Get today's forecast
  const getTodaysForecast = useCallback(() => {
    return forecast.find(period => period.isDaytime && 
      new Date(period.startTime).toDateString() === new Date().toDateString()
    );
  }, [forecast]);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchFireWeatherData();
  }, [fetchFireWeatherData]);

  return {
    // Raw data
    fireWeatherAlerts,
    forecast,
    fireWeatherIndices,
    
    // Processed data
    processedAlerts,
    currentFireDanger,
    forecastAnalysis,
    
    // State
    loading,
    error,
    lastUpdate,
    
    // Actions
    refresh,
    getAlertsBySeverity,
    getTodaysForecast,
    
    // Service access
    fireWeatherService
  };
};