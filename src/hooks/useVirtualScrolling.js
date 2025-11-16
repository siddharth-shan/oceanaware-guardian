/**
 * Custom hook for virtual scrolling with infinite loading
 * Optimized for handling large datasets efficiently
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export const useVirtualScrolling = ({
  fetchData,
  pageSize = 50,
  initialData = [],
  cacheKey = null,
  emergencyMode = false
}) => {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const nextCursor = useRef(null);
  const loadedPages = useRef(new Set());
  const totalItems = useRef(0);
  
  // Performance metrics
  const metrics = useRef({
    loadTime: [],
    itemsPerSecond: 0,
    cacheHits: 0,
    cacheMisses: 0
  });

  // Reset state when cache key changes (e.g., location or filters change)
  useEffect(() => {
    if (cacheKey) {
      console.log(`🔄 Virtual scrolling reset for key: ${cacheKey}`);
      setData(initialData);
      setHasNextPage(true);
      setError(null);
      nextCursor.current = null;
      loadedPages.current.clear();
      totalItems.current = 0;
    }
  }, [cacheKey, initialData]);

  // Load more items
  const loadMoreItems = useCallback(async (startIndex, stopIndex) => {
    if (isLoading || !hasNextPage) {
      return Promise.resolve();
    }

    const startTime = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      console.log(`📊 Loading items ${startIndex}-${stopIndex}...`);

      const response = await fetchData({
        cursor: nextCursor.current,
        limit: pageSize,
        startIndex,
        stopIndex,
        emergencyMode
      });

      if (response.success) {
        const newItems = response.data || response.clusters || response.reports || [];
        const loadTime = Date.now() - startTime;
        
        // Update metrics
        metrics.current.loadTime.push(loadTime);
        if (metrics.current.loadTime.length > 10) {
          metrics.current.loadTime.shift(); // Keep only last 10 measurements
        }
        
        const avgLoadTime = metrics.current.loadTime.reduce((a, b) => a + b, 0) / metrics.current.loadTime.length;
        metrics.current.itemsPerSecond = Math.round((newItems.length / loadTime) * 1000);
        
        // Update data
        setData(prevData => {
          // In emergency mode, prioritize critical reports
          if (emergencyMode) {
            const combined = [...prevData, ...newItems];
            return combined.sort((a, b) => {
              const urgencyOrder = { critical: 4, high: 3, normal: 2, low: 1 };
              const aUrgency = urgencyOrder[a.urgentLevel] || 0;
              const bUrgency = urgencyOrder[b.urgentLevel] || 0;
              
              if (aUrgency !== bUrgency) return bUrgency - aUrgency;
              return new Date(b.timestamp) - new Date(a.timestamp);
            });
          } else {
            return [...prevData, ...newItems];
          }
        });

        // Update pagination state
        nextCursor.current = response.continuationToken || response.nextCursor;
        setHasNextPage(response.hasMore || response.hasNextPage || !!nextCursor.current);
        totalItems.current += newItems.length;

        console.log(`✅ Loaded ${newItems.length} items in ${loadTime}ms (${metrics.current.itemsPerSecond} items/sec)`);
        
        // Performance warning for slow loads
        if (loadTime > 2000) {
          console.warn(`⚠️ Slow load detected: ${loadTime}ms for ${newItems.length} items`);
        }
        
      } else {
        throw new Error(response.error || 'Failed to load data');
      }
      
    } catch (err) {
      console.error('❌ Error loading more items:', err);
      setError(err.message);
      setHasNextPage(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, pageSize, isLoading, hasNextPage, emergencyMode]);

  // Refresh data (clear cache and reload)
  const refresh = useCallback(async () => {
    console.log('🔄 Refreshing virtual scrolling data...');
    setData([]);
    setError(null);
    setIsLoading(false);
    setHasNextPage(true);
    nextCursor.current = null;
    loadedPages.current.clear();
    totalItems.current = 0;
    
    // Load first page
    await loadMoreItems(0, pageSize - 1);
  }, [loadMoreItems, pageSize]);

  // Check if item is loaded
  const isItemLoaded = useCallback((index) => {
    return index < data.length;
  }, [data.length]);

  // Get item at index
  const getItem = useCallback((index) => {
    return data[index];
  }, [data]);

  // Get performance metrics
  const getMetrics = useCallback(() => {
    const avgLoadTime = metrics.current.loadTime.length > 0
      ? metrics.current.loadTime.reduce((a, b) => a + b, 0) / metrics.current.loadTime.length
      : 0;

    return {
      totalItems: data.length,
      loadedPages: loadedPages.current.size,
      avgLoadTime: Math.round(avgLoadTime),
      itemsPerSecond: metrics.current.itemsPerSecond,
      cacheHitRate: metrics.current.cacheHits / (metrics.current.cacheHits + metrics.current.cacheMisses) || 0,
      isLoading,
      hasNextPage,
      error
    };
  }, [data.length, isLoading, hasNextPage, error]);

  // Prefetch next batch for smoother scrolling
  const prefetchNext = useCallback(async () => {
    if (!isLoading && hasNextPage && data.length > 0) {
      const nextStartIndex = data.length;
      const nextStopIndex = nextStartIndex + Math.floor(pageSize / 2) - 1;
      
      console.log(`🔮 Prefetching items ${nextStartIndex}-${nextStopIndex}...`);
      await loadMoreItems(nextStartIndex, nextStopIndex);
    }
  }, [loadMoreItems, data.length, pageSize, isLoading, hasNextPage]);

  // Auto-prefetch based on scroll position
  useEffect(() => {
    if (data.length > 0 && data.length % pageSize === 0 && hasNextPage && !isLoading) {
      // Automatically prefetch when we have complete pages
      const timer = setTimeout(prefetchNext, 100);
      return () => clearTimeout(timer);
    }
  }, [data.length, pageSize, hasNextPage, isLoading, prefetchNext]);

  return {
    // Data
    data,
    isLoading,
    hasNextPage,
    error,
    
    // Methods
    loadMoreItems,
    refresh,
    isItemLoaded,
    getItem,
    prefetchNext,
    
    // Utilities
    getMetrics,
    
    // State info
    totalLoaded: data.length,
    isEmpty: data.length === 0 && !isLoading,
    
    // Emergency mode indicator
    emergencyMode
  };
};

/**
 * Hook for virtual scrolling with clustering support
 * Combines virtual scrolling with geographic clustering
 */
export const useClusteredVirtualScrolling = ({
  fetchClusters,
  location,
  filters = {},
  emergencyMode = false
}) => {
  const cacheKey = `${location.lat}_${location.lng}_${JSON.stringify(filters)}_${emergencyMode}`;
  
  const virtualScrolling = useVirtualScrolling({
    fetchData: async ({ cursor, limit, emergencyMode: emergencyModeParam }) => {
      try {
        const response = await fetchClusters({
          lat: location.lat,
          lng: location.lng,
          limit,
          continuationToken: cursor,
          emergencyMode: emergencyModeParam,
          ...filters
        });
        
        return {
          success: response.success,
          data: response.clusters || [],
          hasMore: response.hasMore,
          nextCursor: response.continuationToken,
          error: response.error
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          data: []
        };
      }
    },
    pageSize: 50,
    cacheKey,
    emergencyMode
  });

  return {
    ...virtualScrolling,
    clusters: virtualScrolling.data,
    
    // Additional cluster-specific methods
    expandCluster: (clusterId) => {
      // Could implement cluster expansion logic here
      console.log(`Expanding cluster: ${clusterId}`);
    },
    
    collapseCluster: (clusterId) => {
      // Could implement cluster collapse logic here
      console.log(`Collapsing cluster: ${clusterId}`);
    }
  };
};

export default useVirtualScrolling;