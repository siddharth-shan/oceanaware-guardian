export class GeocodingService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours cache for locations
  }

  async getLocationFromZipCode(zipCode, countryCode = 'US') {
    const cacheKey = `zip_${zipCode}_${countryCode}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const openWeatherKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (!openWeatherKey) {
        throw new Error('OpenWeather API key not configured');
      }

      // Use OpenWeather Geocoding API
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},${countryCode}&appid=${openWeatherKey}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Zip code not found');
        }
        throw new Error(`Geocoding request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      const result = {
        lat: data.lat,
        lng: data.lon,
        city: data.name,
        state: data.state || '',
        country: data.country,
        zipCode: zipCode,
        displayName: `${data.name}${data.state ? `, ${data.state}` : ''} ${zipCode}`
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Geocoding error:', error);
      
      // Fallback to hardcoded ZIP code locations
      const fallbackLocation = this.getFallbackLocationForZip(zipCode);
      if (fallbackLocation) {
        console.log('Using fallback location for ZIP:', zipCode);
        return fallbackLocation;
      }
      
      throw error;
    }
  }

  async getCurrentLocationName(lat, lng) {
    const cacheKey = `reverse_${lat.toFixed(4)}_${lng.toFixed(4)}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const openWeatherKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (!openWeatherKey) {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      // Use OpenWeather Reverse Geocoding API
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lng}&limit=1&appid=${openWeatherKey}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const location = data[0];
          const result = `${location.name}${location.state ? `, ${location.state}` : ''}`;
          
          // Cache the result
          this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });

          return result;
        }
      }
      
      // Fallback to coordinates
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  isValidZipCode(zipCode) {
    // US zip code validation (5 digits or 5+4 format)
    const usZipRegex = /^\d{5}(-\d{4})?$/;
    return usZipRegex.test(zipCode.trim());
  }

  getFallbackLocationForZip(zipCode) {
    // Common ZIP codes with known coordinates
    const fallbackZips = {
      '90210': { lat: 34.0901, lng: -118.4065, city: 'Beverly Hills', state: 'CA', displayName: 'Beverly Hills, CA 90210' },
      '10001': { lat: 40.7505, lng: -73.9934, city: 'New York', state: 'NY', displayName: 'New York, NY 10001' },
      '33101': { lat: 25.7617, lng: -80.1918, city: 'Miami Beach', state: 'FL', displayName: 'Miami Beach, FL 33101' },
      '94102': { lat: 37.7749, lng: -122.4194, city: 'San Francisco', state: 'CA', displayName: 'San Francisco, CA 94102' },
      '60601': { lat: 41.8781, lng: -87.6298, city: 'Chicago', state: 'IL', displayName: 'Chicago, IL 60601' },
      '75201': { lat: 32.7767, lng: -96.7970, city: 'Dallas', state: 'TX', displayName: 'Dallas, TX 75201' },
      '98101': { lat: 47.6062, lng: -122.3321, city: 'Seattle', state: 'WA', displayName: 'Seattle, WA 98101' },
      '02101': { lat: 42.3601, lng: -71.0589, city: 'Boston', state: 'MA', displayName: 'Boston, MA 02101' },
      '30309': { lat: 33.7490, lng: -84.3880, city: 'Atlanta', state: 'GA', displayName: 'Atlanta, GA 30309' },
      '80202': { lat: 39.7392, lng: -104.9903, city: 'Denver', state: 'CO', displayName: 'Denver, CO 80202' },
      '93065': { lat: 34.2694, lng: -118.7815, city: 'Simi Valley', state: 'CA', displayName: 'Simi Valley, CA 93065' },
      '92880': { lat: 33.9208, lng: -117.6096, city: 'Eastvale', state: 'CA', displayName: 'Eastvale, CA 92880' }
    };

    const zip5 = zipCode.substring(0, 5);
    const fallback = fallbackZips[zip5];
    
    if (fallback) {
      return {
        ...fallback,
        zipCode: zipCode,
        country: 'US'
      };
    }

    return null;
  }
}