import { useState, useEffect, useCallback, useMemo } from 'react';
import { NASAFirmsService } from '../services/api/nasaFirmsService.js';

/**
 * React hook for NASA FIRMS real-time fire detection
 * Provides real-time active fire data with automatic updates
 */
export const useNASAFires = (userLocation, options = {}) => {
  const {
    radius = 100, // Default 100km radius
    dayRange = 1, // Default 1 day
    autoRefresh = true,
    refreshInterval = 300000, // 5 minutes
    source = 'VIIRS_NOAA20_NRT' // Default to VIIRS NOAA-20 for best real-time performance
  } = options;

  const [fires, setFires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);

  const firmsService = useMemo(() => new NASAFirmsService(), []);

  const fetchFires = useCallback(async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);

    try {
      const fireData = await firmsService.getFiresNearLocation(
        userLocation.lat,
        userLocation.lng,
        radius,
        dayRange
      );
      
      setFires(fireData);
      setLastUpdate(new Date());
      setApiStatus(firmsService.getApiStatus());
    } catch (err) {
      console.error('NASA FIRMS fetch error:', err);
      setError(err.message);
      
      // Try to get fallback data on error
      try {
        const fallbackData = firmsService.getFallbackFireData();
        setFires(fallbackData);
        setApiStatus({ ...firmsService.getApiStatus(), usingFallback: true });
      } catch (fallbackErr) {
        console.error('Fallback data error:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, [userLocation, radius, dayRange, firmsService]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchFires();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchFires, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchFires, autoRefresh, refreshInterval]);

  // Processed fire data with enhanced analytics
  const processedData = useMemo(() => {
    const nearbyFires = fires.filter(fire => fire.distance <= 25); // Within 25km
    const criticalFires = fires.filter(fire => fire.riskLevel === 'critical');
    const highIntensityFires = fires.filter(fire => fire.intensity === 'extreme' || fire.intensity === 'high');
    
    // Calculate fire statistics
    const stats = {
      total: fires.length,
      nearby: nearbyFires.length,
      critical: criticalFires.length,
      highIntensity: highIntensityFires.length,
      averageDistance: fires.length > 0 
        ? Math.round((fires.reduce((sum, fire) => sum + fire.distance, 0) / fires.length) * 100) / 100
        : 0,
      closestFire: fires.length > 0 ? fires[0] : null,
      mostIntense: fires.reduce((max, fire) => 
        (fire.frp || 0) > (max.frp || 0) ? fire : max, fires[0] || {}),
      dataFreshness: lastUpdate ? Math.floor((Date.now() - lastUpdate.getTime()) / 60000) : null // minutes ago
    };

    // Group fires by risk level
    const riskGroups = {
      critical: fires.filter(fire => fire.riskLevel === 'critical'),
      high: fires.filter(fire => fire.riskLevel === 'high'),
      medium: fires.filter(fire => fire.riskLevel === 'medium'),
      low: fires.filter(fire => fire.riskLevel === 'low')
    };

    // Group fires by intensity
    const intensityGroups = {
      extreme: fires.filter(fire => fire.intensity === 'extreme'),
      high: fires.filter(fire => fire.intensity === 'high'),
      medium: fires.filter(fire => fire.intensity === 'medium'),
      low: fires.filter(fire => fire.intensity === 'low')
    };

    return {
      fires,
      stats,
      riskGroups,
      intensityGroups,
      nearbyFires,
      criticalFires
    };
  }, [fires]);

  // Fire alerts based on proximity and intensity
  const alerts = useMemo(() => {
    const alertList = [];
    
    // Critical proximity alert
    const emergencyFires = fires.filter(fire => fire.distance <= 10 && fire.riskLevel === 'critical');
    if (emergencyFires.length > 0) {
      alertList.push({
        id: 'emergency_proximity',
        level: 'emergency',
        title: 'CRITICAL: Fire Within 10 Miles',
        message: `${emergencyFires.length} critical fire(s) detected within 10 miles`,
        fires: emergencyFires,
        priority: 1
      });
    }

    // High risk nearby alert
    const nearbyHighRisk = fires.filter(fire => fire.distance <= 25 && fire.riskLevel === 'high');
    if (nearbyHighRisk.length > 0 && emergencyFires.length === 0) {
      alertList.push({
        id: 'high_risk_nearby',
        level: 'warning',
        title: 'High Risk Fire Nearby',
        message: `${nearbyHighRisk.length} high-risk fire(s) within 25 miles`,
        fires: nearbyHighRisk,
        priority: 2
      });
    }

    // New fire detection alert
    const recentFires = fires.filter(fire => {
      const fireTime = new Date(fire.timestamp);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return fireTime > oneHourAgo;
    });
    
    if (recentFires.length > 0) {
      alertList.push({
        id: 'new_fire_detection',
        level: 'info',
        title: 'New Fire Detection',
        message: `${recentFires.length} new fire(s) detected in the last hour`,
        fires: recentFires,
        priority: 3
      });
    }

    return alertList.sort((a, b) => a.priority - b.priority);
  }, [fires]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchFires();
  }, [fetchFires]);

  // Get fires by filter criteria
  const getFiresByFilter = useCallback((filterFn) => {
    return fires.filter(filterFn);
  }, [fires]);

  // Get fires within specific distance
  const getFiresWithinDistance = useCallback((maxDistance) => {
    return fires.filter(fire => fire.distance <= maxDistance);
  }, [fires]);

  return {
    // Data
    fires,
    processedData,
    alerts,
    
    // State
    loading,
    error,
    lastUpdate,
    apiStatus,
    
    // Actions
    refresh,
    getFiresByFilter,
    getFiresWithinDistance,
    
    // Service access
    firmsService
  };
};