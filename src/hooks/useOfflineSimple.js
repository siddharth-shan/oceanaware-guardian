/**
 * Simple Offline Hook - Basic offline detection without service worker
 */

import { useState, useEffect } from 'react';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    syncInProgress: false,
    syncStatus: null,
    cacheStatus: null,
    submitReport: async (reportData, endpoint) => {
      // Simple fetch without offline queueing
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });
      return response.json();
    },
    getCachedData: async (endpoint) => {
      const response = await fetch(endpoint);
      return response.json();
    },
    preloadData: async () => {
      // No-op for now
      return Promise.resolve();
    },
    triggerSync: () => Promise.resolve(),
    clearStatus: () => {},
    getOfflineStatus: () => ({ isOnline })
  };
};

export default useOffline;