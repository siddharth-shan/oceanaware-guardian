/**
 * useOceanHazards Hook
 *
 * React hook for accessing ocean hazard data
 * Provides tsunami warnings, sea level data, erosion info, and more
 *
 * Created for Ocean Awareness Contest 2026
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getOceanHazardStatus,
  fetchTsunamiWarnings,
  fetchSeaLevelData,
  fetchCoastalErosion,
  fetchOceanTemperature,
  fetchMarineAlerts,
  clearCache
} from '../services/ocean/oceanHazardService';

/**
 * Main hook for ocean hazard data
 */
export function useOceanHazards(location, options = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 10 * 60 * 1000, // 10 minutes
    enabled = true
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !location?.lat || !location?.lng) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const hazardData = await getOceanHazardStatus(location);

      setData(hazardData);
      setLastUpdate(new Date());
      setError(null);

    } catch (err) {
      console.error('Error fetching ocean hazards:', err);
      setError(err.message);
      setData(null);

    } finally {
      setLoading(false);
    }
  }, [location, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !enabled) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData, enabled]);

  const refresh = useCallback(() => {
    clearCache();
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
    hasData: data?.hasData || false,
    hazardLevel: data?.hazardLevel || 'normal'
  };
}

/**
 * Hook for tsunami warnings only
 */
export function useTsunamiWarnings(location, options = {}) {
  const { enabled = true } = options;
  const [warnings, setWarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !location?.lat || !location?.lng) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetch() {
      try {
        setLoading(true);
        const data = await fetchTsunamiWarnings(location);

        if (mounted) {
          setWarnings(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setWarnings(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      mounted = false;
    };
  }, [location, enabled]);

  return {
    warnings,
    loading,
    error,
    hasWarnings: warnings?.active || false,
    warningCount: warnings?.warnings?.length || 0
  };
}

/**
 * Hook for sea level data
 */
export function useSeaLevelData(location, options = {}) {
  const { enabled = true } = options;
  const [seaLevel, setSeaLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !location?.lat || !location?.lng) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetch() {
      try {
        setLoading(true);
        const data = await fetchSeaLevelData(location);

        if (mounted) {
          setSeaLevel(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setSeaLevel(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      mounted = false;
    };
  }, [location, enabled]);

  return {
    seaLevel,
    loading,
    error,
    current: seaLevel?.current,
    projections: seaLevel?.projections,
    trend: seaLevel?.current?.trend
  };
}

/**
 * Hook for coastal erosion data
 */
export function useCoastalErosion(location, options = {}) {
  const { enabled = true } = options;
  const [erosion, setErosion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !location?.lat || !location?.lng) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetch() {
      try {
        setLoading(true);
        const data = await fetchCoastalErosion(location);

        if (mounted) {
          setErosion(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setErosion(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      mounted = false;
    };
  }, [location, enabled]);

  return {
    erosion,
    loading,
    error,
    isCoastal: erosion?.isCoastal || false,
    erosionRate: erosion?.erosionRate,
    vulnerability: erosion?.vulnerability
  };
}

/**
 * Hook for ocean temperature data
 */
export function useOceanTemperature(location, options = {}) {
  const { enabled = true } = options;
  const [temperature, setTemperature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !location?.lat || !location?.lng) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetch() {
      try {
        setLoading(true);
        const data = await fetchOceanTemperature(location);

        if (mounted) {
          setTemperature(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setTemperature(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      mounted = false;
    };
  }, [location, enabled]);

  return {
    temperature,
    loading,
    error,
    current: temperature?.current,
    anomaly: temperature?.anomaly,
    coralRisk: temperature?.coralBleachingRisk
  };
}

/**
 * Hook for marine weather alerts
 */
export function useMarineAlerts(location, options = {}) {
  const { enabled = true } = options;
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !location?.lat || !location?.lng) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetch() {
      try {
        setLoading(true);
        const data = await fetchMarineAlerts(location);

        if (mounted) {
          setAlerts(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setAlerts(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      mounted = false;
    };
  }, [location, enabled]);

  return {
    alerts,
    loading,
    error,
    hasAlerts: alerts?.active || false,
    alertCount: alerts?.count || 0,
    activeAlerts: alerts?.alerts || []
  };
}

/**
 * Helper hook to get hazard level color classes
 */
export function useHazardLevelColors(level) {
  const colors = {
    normal: {
      bg: 'bg-kelp-50',
      text: 'text-kelp-800',
      border: 'border-kelp-200',
      icon: 'text-kelp-600'
    },
    watch: {
      bg: 'bg-sand-50',
      text: 'text-sand-800',
      border: 'border-sand-200',
      icon: 'text-sand-600'
    },
    warning: {
      bg: 'bg-warning-50',
      text: 'text-warning-800',
      border: 'border-warning-200',
      icon: 'text-warning-600'
    },
    critical: {
      bg: 'bg-critical-50',
      text: 'text-critical-800',
      border: 'border-critical-200',
      icon: 'text-critical-600'
    }
  };

  return colors[level] || colors.normal;
}

/**
 * Helper hook to format hazard level text
 */
export function useHazardLevelText(level) {
  const text = {
    normal: {
      label: 'All Clear',
      description: 'No significant ocean hazards detected',
      icon: '✓'
    },
    watch: {
      label: 'Watch',
      description: 'Conditions being monitored',
      icon: '⚠'
    },
    warning: {
      label: 'Warning',
      description: 'Hazardous conditions present',
      icon: '⚠️'
    },
    critical: {
      label: 'Critical',
      description: 'Dangerous conditions - take action',
      icon: '🚨'
    }
  };

  return text[level] || text.normal;
}
