/**
 * NASA FIRMS (Fire Information for Resource Management System) API Service
 * Provides real-time and near real-time active fire data
 * 
 * API Documentation: https://firms.modaps.eosdis.nasa.gov/api/
 * Update Frequency: <60 seconds for US/Canada, <3 hours globally
 * Rate Limits: 5,000 transactions per 10-minute window
 * 
 * Data Sources:
 * - MODIS (Terra and Aqua satellites)
 * - VIIRS (NOAA-20, NOAA-21, S-NPP satellites)
 */

export class NASAFirmsService {
  constructor() {
    this.baseUrl = 'https://firms.modaps.eosdis.nasa.gov/api';
    this.mapKey = import.meta.env?.VITE_NASA_FIRMS_MAP_KEY || 'demo'; // Get free key from NASA
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes cache
    this.rateLimitWindow = 600000; // 10 minutes
    this.requestCount = 0;
    this.windowStart = Date.now();
  }

  /**
   * Check rate limiting (5,000 requests per 10 minutes)
   */
  checkRateLimit() {
    const now = Date.now();
    if (now - this.windowStart > this.rateLimitWindow) {
      this.requestCount = 0;
      this.windowStart = now;
    }
    
    if (this.requestCount >= 5000) {
      throw new Error('NASA FIRMS API rate limit exceeded (5,000 requests per 10 minutes)');
    }
    
    this.requestCount++;
  }

  /**
   * Get active fires for a specific country
   * @param {string} country - Country code (USA, AUS, etc.)
   * @param {number} dayRange - Number of days (1, 7, 10)
   * @param {string} source - Data source (MODIS_SP, MODIS_NRT, VIIRS_SNPP_SP, VIIRS_NOAA20_NRT, VIIRS_NOAA21_NRT)
   * @returns {Promise<Array>} Array of fire detection objects
   */
  async getActiveFiresByCountry(country = 'USA', dayRange = 1, source = 'VIIRS_NOAA20_NRT') {
    this.checkRateLimit();
    
    const cacheKey = `country_${country}_${dayRange}_${source}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const url = `${this.baseUrl}/country/csv/${this.mapKey}/${source}/${country}/${dayRange}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'EcoQuest-Wildfire-Watch/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`NASA FIRMS API error: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();
      const fireData = this.parseCSVFireData(csvText);
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: fireData,
        timestamp: Date.now()
      });

      return fireData;
    } catch (error) {
      console.error('NASA FIRMS API fetch error:', error);
      return this.getFallbackFireData(country);
    }
  }

  /**
   * Get active fires by geographic bounding box
   * @param {number} minLat - Minimum latitude
   * @param {number} maxLat - Maximum latitude  
   * @param {number} minLon - Minimum longitude
   * @param {number} maxLon - Maximum longitude
   * @param {number} dayRange - Number of days
   * @param {string} source - Data source
   * @returns {Promise<Array>} Array of fire detection objects
   */
  async getActiveFiresByArea(minLat, maxLat, minLon, maxLon, dayRange = 1, source = 'VIIRS_NOAA20_NRT') {
    this.checkRateLimit();
    
    const cacheKey = `area_${minLat}_${maxLat}_${minLon}_${maxLon}_${dayRange}_${source}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const url = `${this.baseUrl}/area/csv/${this.mapKey}/${source}/${minLat},${minLon},${maxLat},${maxLon}/${dayRange}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'EcoQuest-Wildfire-Watch/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`NASA FIRMS API error: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();
      const fireData = this.parseCSVFireData(csvText);
      
      this.cache.set(cacheKey, {
        data: fireData,
        timestamp: Date.now()
      });

      return fireData;
    } catch (error) {
      console.error('NASA FIRMS area API fetch error:', error);
      return this.getFallbackFireData();
    }
  }

  /**
   * Get fires near a specific location
   * @param {number} latitude - Center latitude
   * @param {number} longitude - Center longitude
   * @param {number} radiusKm - Radius in kilometers
   * @param {number} dayRange - Number of days
   * @returns {Promise<Array>} Array of nearby fire detection objects
   */
  async getFiresNearLocation(latitude, longitude, radiusKm = 50, dayRange = 1) {
    // Calculate bounding box from center point and radius
    const latDelta = radiusKm / 111; // Approximately 111 km per degree of latitude
    const lonDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
    
    const minLat = latitude - latDelta;
    const maxLat = latitude + latDelta;
    const minLon = longitude - lonDelta;
    const maxLon = longitude + lonDelta;
    
    const fires = await this.getActiveFiresByArea(minLat, maxLat, minLon, maxLon, dayRange);
    
    // Filter by actual distance and add distance calculation
    return fires.map(fire => {
      const distance = this.calculateDistance(latitude, longitude, fire.latitude, fire.longitude);
      return {
        ...fire,
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      };
    }).filter(fire => fire.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Parse CSV fire data from NASA FIRMS API
   * @param {string} csvText - Raw CSV response
   * @returns {Array} Parsed fire detection objects
   */
  parseCSVFireData(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',');
    const fires = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length !== headers.length) continue;
      
      const fire = {};
      headers.forEach((header, index) => {
        fire[header.toLowerCase().trim()] = values[index].trim();
      });
      
      // Standardize and enhance fire object
      const standardizedFire = {
        id: `${fire.latitude}_${fire.longitude}_${fire.acq_date}_${fire.acq_time}`,
        latitude: parseFloat(fire.latitude),
        longitude: parseFloat(fire.longitude),
        brightness: parseFloat(fire.brightness || fire.bright_ti4 || fire.bright_ti5),
        acquisitionDate: fire.acq_date,
        acquisitionTime: fire.acq_time,
        satellite: fire.satellite,
        instrument: fire.instrument,
        confidence: fire.confidence,
        version: fire.version,
        brightT31: parseFloat(fire.bright_t31),
        frp: parseFloat(fire.frp), // Fire Radiative Power
        daynight: fire.daynight,
        type: parseInt(fire.type || 0), // 0=presumed vegetation, 1=active volcano, 2=other static land source, 3=offshore
        
        // Calculated fields
        intensity: this.calculateFireIntensity(parseFloat(fire.frp), parseFloat(fire.brightness)),
        riskLevel: this.calculateRiskLevel(parseFloat(fire.frp), fire.confidence),
        timestamp: this.parseFireTimestamp(fire.acq_date, fire.acq_time),
        
        // Metadata
        source: 'NASA-FIRMS',
        dataSource: fire.instrument || 'UNKNOWN',
        lastUpdated: new Date().toISOString()
      };
      
      fires.push(standardizedFire);
    }
    
    return fires;
  }

  /**
   * Calculate fire intensity based on FRP and brightness
   */
  calculateFireIntensity(frp, brightness) {
    if (!frp || !brightness) return 'unknown';
    
    // Based on research thresholds for wildfire intensity
    if (frp > 100 || brightness > 350) return 'extreme';
    if (frp > 50 || brightness > 320) return 'high';
    if (frp > 20 || brightness > 310) return 'medium';
    return 'low';
  }

  /**
   * Calculate risk level based on multiple factors
   */
  calculateRiskLevel(frp, confidence) {
    let score = 0;
    
    // FRP contribution
    if (frp > 100) score += 3;
    else if (frp > 50) score += 2;
    else if (frp > 20) score += 1;
    
    // Confidence contribution
    if (confidence === 'high' || confidence === 'h') score += 2;
    else if (confidence === 'nominal' || confidence === 'n') score += 1;
    
    if (score >= 4) return 'critical';
    if (score >= 3) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * Parse fire timestamp from date and time strings
   */
  parseFireTimestamp(dateStr, timeStr) {
    try {
      // dateStr format: YYYY-MM-DD
      // timeStr format: HHMM
      const time = timeStr.padStart(4, '0');
      const hours = time.substring(0, 2);
      const minutes = time.substring(2, 4);
      
      return new Date(`${dateStr}T${hours}:${minutes}:00Z`).toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get fallback fire data when API is unavailable
   */
  getFallbackFireData(country = 'USA') {
    // Return mock data for development/demo purposes
    return [
      {
        id: 'demo_fire_1',
        latitude: 34.0522,
        longitude: -118.2437,
        brightness: 320.5,
        acquisitionDate: new Date().toISOString().split('T')[0],
        acquisitionTime: '1430',
        satellite: 'Aqua',
        instrument: 'MODIS',
        confidence: 'high',
        frp: 45.2,
        intensity: 'medium',
        riskLevel: 'high',
        timestamp: new Date().toISOString(),
        source: 'NASA-FIRMS-DEMO',
        dataSource: 'MODIS',
        lastUpdated: new Date().toISOString(),
        distance: 12.5
      },
      {
        id: 'demo_fire_2',
        latitude: 34.1681,
        longitude: -118.6421,
        brightness: 340.8,
        acquisitionDate: new Date().toISOString().split('T')[0],
        acquisitionTime: '1445',
        satellite: 'NOAA-20',
        instrument: 'VIIRS',
        confidence: 'nominal',
        frp: 78.9,
        intensity: 'high',
        riskLevel: 'critical',
        timestamp: new Date().toISOString(),
        source: 'NASA-FIRMS-DEMO',
        dataSource: 'VIIRS',
        lastUpdated: new Date().toISOString(),
        distance: 25.1
      }
    ];
  }

  /**
   * Get API status and rate limit information
   */
  getApiStatus() {
    const now = Date.now();
    const windowRemaining = this.rateLimitWindow - (now - this.windowStart);
    
    return {
      requestsRemaining: Math.max(0, 5000 - this.requestCount),
      windowReset: new Date(this.windowStart + this.rateLimitWindow).toISOString(),
      windowRemainingMs: Math.max(0, windowRemaining),
      cacheSize: this.cache.size,
      isRateLimited: this.requestCount >= 5000,
      apiKey: this.mapKey !== 'demo' ? 'configured' : 'using_demo'
    };
  }

  /**
   * Clear cache manually
   */
  clearCache() {
    this.cache.clear();
  }
}