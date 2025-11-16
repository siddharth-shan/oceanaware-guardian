import { useState, useEffect, useCallback, useMemo } from 'react';
import { GeocodingService } from '../services/api/geocodingService';

export const useLocationManager = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  console.log('LocationManager: Hook initialized, loading:', loading);

  const geocodingService = useMemo(() => new GeocodingService(), []);

  const updateLocation = useCallback((newLocation) => {
    setLocation(newLocation);
    setError(null);
    
    // Save to localStorage for persistence
    localStorage.setItem('ecoquest_location', JSON.stringify(newLocation));
    
    // Broadcast location change to all components
    window.dispatchEvent(new CustomEvent('locationManagerUpdate', { 
      detail: { location: newLocation, timestamp: Date.now() }
    }));
    
    // Trigger data refresh for location-dependent components
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('refreshLocationData', { 
        detail: { location: newLocation, reason: 'location_manager_update' }
      }));
    }, 50);
  }, []);

  const requestGeolocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Set a timeout for the geocoding service
          const displayNamePromise = geocodingService.getCurrentLocationName(latitude, longitude);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Geocoding timeout')), 5000)
          );
          
          const displayName = await Promise.race([displayNamePromise, timeoutPromise]);
          const locationData = {
            lat: latitude,
            lng: longitude,
            source: 'gps',
            displayName: displayName || 'Current Location',
            region: displayName || 'Current Location', // Add explicit region field
            timestamp: Date.now()
          };
          updateLocation(locationData);
        } catch (err) {
          console.warn('Geocoding failed or timed out:', err.message);
          
          // Generate a meaningful region name from coordinates as fallback
          const generateRegionFromCoords = (lat, lng) => {
            // California regions
            if (lat >= 32 && lat <= 42 && lng >= -125 && lng <= -114) {
              if (lat >= 37.5 && lat <= 38.0 && lng >= -122.6 && lng <= -122.3) {
                return 'San Francisco Bay Area, CA';
              }
              if (lat >= 34.0 && lat <= 34.3 && lng >= -118.7 && lng <= -118.1) {
                return 'Los Angeles Area, CA';
              }
              if (lat >= 32.5 && lat <= 33.0 && lng >= -117.5 && lng <= -117.0) {
                return 'San Diego Area, CA';
              }
              if (lat >= 33.7 && lat <= 34.1 && lng >= -118.3 && lng <= -117.8) {
                return 'Long Beach/Orange County Area, CA';
              }
              // Generic California location
              const latRounded = Math.round(lat * 10) / 10;
              const lngRounded = Math.round(lng * 10) / 10;
              return `California Area (${latRounded}, ${lngRounded})`;
            }
            
            // Generic coordinate description for other areas
            const latRounded = Math.round(lat * 10) / 10;
            const lngRounded = Math.round(lng * 10) / 10;
            return `Area near ${latRounded}, ${lngRounded}`;
          };
          
          const regionName = generateRegionFromCoords(latitude, longitude);
          const locationData = {
            lat: latitude,
            lng: longitude,
            source: 'gps',
            displayName: regionName,
            region: regionName, // Add explicit region field
            timestamp: Date.now()
          };
          updateLocation(locationData);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to access your location. Please enter a zip code in the header.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [updateLocation, geocodingService]);

  const setLocationFromZipCode = useCallback(async (zipCode) => {
    setLoading(true);
    setError(null);

    try {
      const locationData = await geocodingService.getLocationFromZipCode(zipCode);
      const fullLocationData = {
        ...locationData,
        source: 'zipcode',
        timestamp: Date.now()
      };
      updateLocation(fullLocationData);
      return fullLocationData;
    } catch (err) {
      setError(err.message || 'Failed to find location for this zip code');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateLocation, geocodingService]);

  // Initialize location on mount
  useEffect(() => {
    const initializeLocation = async () => {
      console.log('LocationManager: Starting location initialization');
      
      // Check for saved location first
      const savedLocation = localStorage.getItem('ecoquest_location');
      if (savedLocation) {
        try {
          const parsedLocation = JSON.parse(savedLocation);
          console.log('LocationManager: Found saved location:', parsedLocation.displayName);
          // Check if saved location is less than 24 hours old
          if (Date.now() - parsedLocation.timestamp < 24 * 60 * 60 * 1000) {
            console.log('LocationManager: Using cached location, setting loading to false');
            setLocation(parsedLocation);
            setLoading(false);
            return;
          } else {
            console.log('LocationManager: Cached location is stale, requesting fresh location');
          }
        } catch (err) {
          console.error('LocationManager: Error parsing saved location:', err);
        }
      }

      // If no valid saved location, automatically request geolocation
      console.log('LocationManager: No valid saved location found, requesting geolocation...');
      
      // Check if geolocation is available
      if (!navigator.geolocation) {
        console.log('LocationManager: Geolocation not supported, setting loading to false');
        setError('Geolocation is not supported by this browser');
        setLoading(false);
        return;
      }

      console.log('LocationManager: Starting geolocation request');
      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Set a timeout for the geocoding service
            const displayNamePromise = geocodingService.getCurrentLocationName(latitude, longitude);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Geocoding timeout')), 5000)
            );
            
            const displayName = await Promise.race([displayNamePromise, timeoutPromise]);
            const locationData = {
              lat: latitude,
              lng: longitude,
              source: 'gps',
              displayName: displayName || 'Current Location',
              timestamp: Date.now()
            };
            updateLocation(locationData);
          } catch (err) {
            console.warn('Geocoding failed or timed out:', err.message);
            const locationData = {
              lat: latitude,
              lng: longitude,
              source: 'gps',
              displayName: 'Current Location',
              timestamp: Date.now()
            };
            updateLocation(locationData);
          } finally {
            console.log('LocationManager: Geolocation success completed, setting loading to false');
            setLoading(false);
          }
        },
        (err) => {
          console.error('Geolocation error:', err);
          
          // Provide a default location (Santa Maria, CA - closer to reports) if geolocation fails
          const defaultLocation = {
            lat: 34.9545,
            lng: -120.4325,
            source: 'default',
            displayName: 'Santa Maria, CA 93454 (Default)',
            timestamp: Date.now()
          };
          
          console.log('LocationManager: Geolocation failed, using default location, setting loading to false');
          setError(`Location access denied. Using default location: ${err.message}`);
          updateLocation(defaultLocation);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    };

    initializeLocation();
  }, [updateLocation, geocodingService]);

  // Force refresh location (clear cache and re-detect)
  const refreshLocation = useCallback(async () => {
    console.log('LocationManager: Force refreshing location...');
    // Clear cached location
    localStorage.removeItem('ecoquest_location');
    setLocation(null);
    setError(null);
    // Request fresh geolocation
    await requestGeolocation();
  }, [requestGeolocation]);

  return {
    location,
    error,
    loading,
    updateLocation,
    requestGeolocation,
    setLocationFromZipCode,
    refreshLocation,
    clearError: () => setError(null)
  };
};