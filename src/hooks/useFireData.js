import { useState, useEffect, useRef } from 'react';
import { FireDataService } from '../services/api/fireDataService.js';

const useFireData = (userLocation, options = {}, enabled = true) => {
  const [fires, setFires] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const fetchingRef = useRef(false);
  const timeoutRef = useRef(null);
  const fireServiceRef = useRef(null);
  
  // Create a fresh service instance to ensure no stale cache
  if (!fireServiceRef.current) {
    fireServiceRef.current = new FireDataService();
  }
  const lastLocationRef = useRef(null);
  const forceRefreshRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    // Only fetch if location actually changed
    const currentLocationKey = userLocation ? `${userLocation.lat}_${userLocation.lng}` : null;
    const lastLocationKey = lastLocationRef.current ? `${lastLocationRef.current.lat}_${lastLocationRef.current.lng}` : null;
    
    if (!userLocation?.lat || !userLocation?.lng) {
      setLoading(false);
      return;
    }
    
    // Skip if location hasn't changed unless force refresh is requested
    if (currentLocationKey === lastLocationKey && !forceRefreshRef.current) {
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
        const radius = options.radius || 50;
        const result = await fireServiceRef.current.getNearbyFires(
          userLocation.lat,
          userLocation.lng,
          radius
        );
        
        if (result.fires) {
          setFires(result.fires);
          setMetadata(result.metadata);
        } else {
          setFires(Array.isArray(result) ? result : []);
        }
        setLastUpdate(new Date());
        lastLocationRef.current = userLocation;
      } catch (err) {
        console.error('Fire data fetch error:', err);
        setError(err.message);
        setFires([]);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    }, 1000); // 1 second debounce

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [userLocation?.lat, userLocation?.lng, options?.radius, enabled]);

  // Listen for location change events and force data refresh
  useEffect(() => {
    const handleLocationRefresh = (event) => {
      console.log('🔄 Fire data refresh triggered by location change:', event.detail);
      if (userLocation?.lat && userLocation?.lng) {
        forceRefreshRef.current = true;
        // Trigger useEffect by updating a dummy dependency or call refetch directly
        setTimeout(() => {
          refetch();
        }, 200);
      }
    };

    // Listen for custom location refresh events
    window.addEventListener('refreshLocationData', handleLocationRefresh);
    window.addEventListener('locationChanged', handleLocationRefresh);
    
    return () => {
      window.removeEventListener('refreshLocationData', handleLocationRefresh);
      window.removeEventListener('locationChanged', handleLocationRefresh);
    };
  }, [userLocation?.lat, userLocation?.lng]);

  // Separate effect for auto-refresh
  useEffect(() => {
    if (!options.autoRefresh || !userLocation) return;

    const interval = setInterval(() => {
      if (!fetchingRef.current && userLocation?.lat && userLocation?.lng) {
        fetchingRef.current = true;
        setLoading(true);
        
        fireServiceRef.current.getNearbyFires(
          userLocation.lat,
          userLocation.lng,
          options.radius || 50
        ).then(result => {
          if (result.fires) {
            setFires(result.fires);
            setMetadata(result.metadata);
          } else {
            setFires(Array.isArray(result) ? result : []);
          }
          setLastUpdate(new Date());
        }).catch(err => {
          console.error('Fire data auto-refresh error:', err);
          setError(err.message);
        }).finally(() => {
          setLoading(false);
          fetchingRef.current = false;
        });
      }
    }, options.refreshInterval || 300000);
    
    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshInterval, userLocation?.lat, userLocation?.lng, options.radius]);

  const refetch = () => {
    if (userLocation?.lat && userLocation?.lng && !fetchingRef.current) {
      console.log('🔄 Refetching fire data for location:', userLocation.displayName);
      lastLocationRef.current = null; // Force refetch by clearing last location
      fetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      fireServiceRef.current.getNearbyFires(
        userLocation.lat,
        userLocation.lng,
        options.radius || 50
      ).then(result => {
        console.log('✅ Fire data refetch successful:', result);
        if (result.fires) {
          setFires(result.fires);
          setMetadata(result.metadata);
        } else {
          setFires(Array.isArray(result) ? result : []);
        }
        setLastUpdate(new Date());
        lastLocationRef.current = userLocation;
      }).catch(err => {
        console.error('❌ Fire data refetch error:', err);
        setError(err.message);
        setFires([]);
      }).finally(() => {
        setLoading(false);
        fetchingRef.current = false;
      });
    }
  };

  return {
    fires,
    metadata,
    loading,
    error,
    lastUpdate,
    refetch
  };
};

export { useFireData };