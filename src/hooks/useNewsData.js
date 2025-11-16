import { useState, useEffect, useRef } from 'react';
import { NewsService } from '../services/api/newsService.js';

export const useNewsData = (userLocation, options = {}) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const fetchingRef = useRef(false);
  const timeoutRef = useRef(null);
  const newsServiceRef = useRef(new NewsService());
  const lastLocationRef = useRef(null);
  const forceRefreshRef = useRef(false);

  useEffect(() => {
    // Only fetch if location actually changed or on initial load
    const currentLocationKey = userLocation ? `${userLocation.lat}_${userLocation.lng}` : null;
    const lastLocationKey = lastLocationRef.current ? `${lastLocationRef.current.lat}_${lastLocationRef.current.lng}` : null;
    
    // Skip if location hasn't changed unless force refresh is requested
    if (currentLocationKey === lastLocationKey && !forceRefreshRef.current && news.length > 0) {
      return;
    }
    
    // Reset force refresh flag
    forceRefreshRef.current = false;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the fetch call
    timeoutRef.current = setTimeout(async () => {
      if (fetchingRef.current) return;

      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const location = userLocation ? {
          lat: userLocation.lat,
          lng: userLocation.lng,
          displayName: userLocation.displayName || 'Your Location',
          state: userLocation.state || 'California'
        } : null;

        const result = await newsServiceRef.current.getFireRelatedNews(location, {
          limit: options.limit || 15,
          radius: options.radius || 100 // miles
        });
        
        setNews(result.articles || []);
        setLastUpdate(new Date());
        lastLocationRef.current = userLocation;
      } catch (err) {
        console.error('News data fetch error:', err);
        setError(err.message || 'Failed to fetch news data');
        setNews([]);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    }, 2000); // 2 second debounce for news (less urgent than fire data)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [userLocation?.lat, userLocation?.lng, options.limit, options.radius]);

  // Listen for location change events and force data refresh
  useEffect(() => {
    const handleLocationRefresh = (event) => {
      console.log('📰 News data refresh triggered by location change:', event.detail);
      forceRefreshRef.current = true;
      // Trigger useEffect by calling refetch directly
      setTimeout(() => {
        refetch();
      }, 500);
    };

    // Listen for custom location refresh events
    window.addEventListener('refreshLocationData', handleLocationRefresh);
    window.addEventListener('locationChanged', handleLocationRefresh);
    
    return () => {
      window.removeEventListener('refreshLocationData', handleLocationRefresh);
      window.removeEventListener('locationChanged', handleLocationRefresh);
    };
  }, []);

  // Auto-refresh news every 15 minutes
  useEffect(() => {
    if (!options.autoRefresh) return;

    const interval = setInterval(() => {
      if (!fetchingRef.current) {
        console.log('📰 Auto-refreshing news data');
        refetch();
      }
    }, options.refreshInterval || 900000); // 15 minutes
    
    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshInterval]);

  const refetch = () => {
    if (!fetchingRef.current) {
      console.log('📰 Manually refetching news data');
      lastLocationRef.current = null; // Force refetch by clearing last location
      forceRefreshRef.current = true;
      
      // Trigger the useEffect by updating a dependency
      setLoading(true);
      setError(null);
      
      fetchingRef.current = true;
      
      const location = userLocation ? {
        lat: userLocation.lat,
        lng: userLocation.lng,
        displayName: userLocation.displayName || 'Your Location',
        state: userLocation.state || 'California'
      } : null;

      newsServiceRef.current.getFireRelatedNews(location, {
        limit: options.limit || 15,
        radius: options.radius || 100
      }).then(result => {
        console.log('✅ News data refetch successful:', result);
        setNews(result.articles || []);
        setLastUpdate(new Date());
        lastLocationRef.current = userLocation;
      }).catch(err => {
        console.error('❌ News data refetch error:', err);
        setError(err.message || 'Failed to fetch news data');
        setNews([]);
      }).finally(() => {
        setLoading(false);
        fetchingRef.current = false;
      });
    }
  };

  return {
    news,
    loading,
    error,
    lastUpdate,
    refetch
  };
};