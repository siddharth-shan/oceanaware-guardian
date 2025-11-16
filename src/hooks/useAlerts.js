import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertsService } from '../services/api/alertsService.js';

export const useAlerts = (userLocation, options = {}) => {
  const [alerts, setAlerts] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const alertsService = useMemo(() => new AlertsService(), []);

  const fetchAlerts = useCallback(async () => {
    if (!userLocation?.lat || !userLocation?.lng) return;

    setLoading(true);
    setError(null);

    try {
      const result = await alertsService.getCurrentAlerts(
        userLocation.lat,
        userLocation.lng
      );
      
      setAlerts(result.alerts || []);
      setMetadata(result.metadata);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [userLocation?.lat, userLocation?.lng, alertsService]);

  const refreshInterval = options.refreshInterval || 15000; // 15 seconds for faster emergency detection

  useEffect(() => {
    fetchAlerts();
    
    // Auto-refresh alerts every 15 seconds for emergency responsiveness
    const interval = setInterval(fetchAlerts, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAlerts, refreshInterval]);

  const getAlertsByType = useCallback((type) => {
    return Array.isArray(alerts) ? alerts.filter(alert => alert?.type === type) : [];
  }, [alerts]);

  const getHighPriorityAlerts = useCallback(() => {
    return Array.isArray(alerts) ? alerts.filter(alert => alert?.severity === 'high') : [];
  }, [alerts]);

  const getActiveAlertsCount = useCallback(() => {
    return Array.isArray(alerts) ? alerts.length : 0;
  }, [alerts]);

  return {
    alerts,
    metadata,
    loading,
    error,
    lastUpdate,
    refetch: fetchAlerts,
    getAlertsByType,
    getHighPriorityAlerts,
    getActiveAlertsCount,
    alertsService
  };
};