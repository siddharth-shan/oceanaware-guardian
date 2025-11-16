import { useState, useEffect, useCallback, useMemo } from 'react';
import { WeatherService } from '../services/api/weatherService.js';

export const useWeatherData = (userLocation) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const weatherService = useMemo(() => new WeatherService(), []);

  const fetchWeatherData = useCallback(async () => {
    if (!userLocation?.lat || !userLocation?.lng) {
      console.log('Weather: No location available, skipping weather fetch');
      setLoading(false);
      return;
    }

    console.log('Weather: Starting fetch for location:', userLocation.displayName);
    setLoading(true);
    setError(null);

    try {
      // Add timeout for weather service
      const weatherPromise = weatherService.getCurrentWeather(
        userLocation.lat, 
        userLocation.lng
      );
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Weather fetch timeout')), 10000)
      );

      const currentWeather = await Promise.race([weatherPromise, timeoutPromise]);
      setWeather(currentWeather);
      console.log('Weather: Successfully fetched weather data');
    } catch (err) {
      console.warn('Weather fetch error:', err.message);
      setError(err.message);
      // Provide fallback weather data even when API fails
      const fallbackData = weatherService.getFallbackWeatherData();
      setWeather({
        ...fallbackData,
        location: userLocation?.displayName || 'Your Location'
      });
      console.log('Weather: Using fallback weather data');
    } finally {
      setLoading(false);
      console.log('Weather: Fetch complete, loading set to false');
    }
  }, [userLocation?.lat, userLocation?.lng, userLocation?.displayName, weatherService]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  return {
    weather,
    loading,
    error,
    refetch: fetchWeatherData
  };
};