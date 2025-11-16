/**
 * useOffline Hook - React integration for offline functionality
 * Phase 3.2: Provides offline state and functionality to React components
 */

import { useState, useEffect, useCallback } from 'react';
import offlineManager from '../services/offline/OfflineManager';

/**
 * React hook for offline functionality
 */
export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [cacheStatus, setCacheStatus] = useState(null);

  useEffect(() => {
    // Subscribe to offline manager events
    const unsubscribe = offlineManager.addListener((event) => {
      switch (event.event) {
        case 'online':
          setIsOnline(true);
          setSyncStatus({ type: 'info', message: 'Connection restored' });
          break;
          
        case 'offline':
          setIsOnline(false);
          setSyncStatus({ type: 'warning', message: 'Offline mode active' });
          break;
          
        case 'sync-complete':
          setSyncInProgress(false);
          setSyncStatus({
            type: 'success',
            message: `Synced ${event.data.syncedCount} reports${event.data.failedCount > 0 ? `, ${event.data.failedCount} failed` : ''}`
          });
          break;
          
        case 'sync-failed':
          setSyncInProgress(false);
          setSyncStatus({
            type: 'error',
            message: `Sync failed: ${event.data.error}`
          });
          break;
          
        case 'cache-served':
          setCacheStatus({
            type: 'info',
            message: 'Using cached data'
          });
          break;
          
        case 'update-available':
          setSyncStatus({
            type: 'info',
            message: 'App update available - reload to activate'
          });
          break;
          
        default:
          console.log('Offline event:', event);
      }
    });

    return unsubscribe;
  }, []);

  // Submit report with offline support
  const submitReport = useCallback(async (reportData, endpoint) => {
    try {
      setSyncInProgress(true);
      const result = await offlineManager.submitReport(reportData, endpoint);
      setSyncInProgress(false);
      
      if (result.offline) {
        setSyncStatus({
          type: 'warning',
          message: 'Report queued for sync when online'
        });
      } else {
        setSyncStatus({
          type: 'success',
          message: 'Report submitted successfully'
        });
      }
      
      return result;
    } catch (error) {
      setSyncInProgress(false);
      setSyncStatus({
        type: 'error',
        message: `Failed to submit report: ${error.message}`
      });
      throw error;
    }
  }, []);

  // Get cached data
  const getCachedData = useCallback(async (endpoint) => {
    return await offlineManager.getCachedData(endpoint);
  }, []);

  // Preload critical data
  const preloadData = useCallback(async (userLocation) => {
    if (userLocation) {
      await offlineManager.preloadCriticalData(userLocation);
    }
  }, []);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    setSyncInProgress(true);
    await offlineManager.attemptSync();
  }, []);

  // Clear status messages
  const clearStatus = useCallback(() => {
    setSyncStatus(null);
    setCacheStatus(null);
  }, []);

  // Get detailed offline status
  const getOfflineStatus = useCallback(() => {
    return offlineManager.getStatus();
  }, []);

  return {
    isOnline,
    syncInProgress,
    syncStatus,
    cacheStatus,
    submitReport,
    getCachedData,
    preloadData,
    triggerSync,
    clearStatus,
    getOfflineStatus
  };
};

/**
 * Higher-order component for offline functionality
 */
export const withOfflineSupport = (WrappedComponent) => {
  return function OfflineEnhancedComponent(props) {
    const offline = useOffline();
    return <WrappedComponent {...props} offline={offline} />;
  };
};

export default useOffline;