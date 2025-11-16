/**
 * Regional Weather Service
 * 
 * Provides county-specific weather data for more accurate risk assessment
 * instead of using static weather values for all counties.
 */

export class RegionalWeatherService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 4 * 60 * 60 * 1000; // 4 hours
    
    // California regional weather patterns and typical fire weather conditions
    this.regionalWeatherProfiles = {
      // Southern California - Higher fire weather risk
      'Southern California': {
        baseTemperature: 85,
        baseHumidity: 15,
        baseWindSpeed: 12,
        fireWeatherIndex: 'HIGH',
        seasonalVariation: 1.2,
        counties: ['06037', '06059', '06065', '06071', '06073', '06111'] // LA, Orange, Riverside, San Bernardino, San Diego, Ventura
      },
      
      // Central Valley - Hot, dry conditions
      'Central Valley': {
        baseTemperature: 88,
        baseHumidity: 12,
        baseWindSpeed: 8,
        fireWeatherIndex: 'VERY HIGH',
        seasonalVariation: 1.3,
        counties: ['06019', '06029', '06047', '06067', '06077', '06099', '06107'] // Fresno, Kern, Merced, Sacramento, San Joaquin, Stanislaus, Tulare
      },
      
      // Bay Area - Moderate conditions with wind risk
      'Bay Area': {
        baseTemperature: 75,
        baseHumidity: 25,
        baseWindSpeed: 15,
        fireWeatherIndex: 'MEDIUM',
        seasonalVariation: 1.0,
        counties: ['06001', '06013', '06041', '06055', '06075', '06081', '06085', '06095', '06097'] // Alameda, Contra Costa, Marin, Napa, SF, San Mateo, Santa Clara, Solano, Sonoma
      },
      
      // Sierra Nevada - Variable conditions
      'Sierra Nevada': {
        baseTemperature: 70,
        baseHumidity: 30,
        baseWindSpeed: 10,
        fireWeatherIndex: 'MEDIUM',
        seasonalVariation: 1.1,
        counties: ['06003', '06005', '06009', '06017', '06043', '06051', '06057', '06061', '06063', '06091', '06109'] // Alpine, Amador, Calaveras, El Dorado, Mariposa, Mono, Nevada, Placer, Plumas, Sierra, Tuolumne
      },
      
      // North Coast - Cooler, more humid
      'North Coast': {
        baseTemperature: 65,
        baseHumidity: 40,
        baseWindSpeed: 12,
        fireWeatherIndex: 'LOW',
        seasonalVariation: 0.8,
        counties: ['06023', '06045', '06033', '06097', '06105'] // Humboldt, Mendocino, Lake, Sonoma, Trinity
      },
      
      // Central Coast - Moderate conditions
      'Central Coast': {
        baseTemperature: 72,
        baseHumidity: 35,
        baseWindSpeed: 14,
        fireWeatherIndex: 'MEDIUM',
        seasonalVariation: 0.9,
        counties: ['06053', '06069', '06079', '06083', '06087'] // Monterey, San Benito, San Luis Obispo, Santa Barbara, Santa Cruz
      },
      
      // Far North - Variable mountain conditions
      'Far North': {
        baseTemperature: 68,
        baseHumidity: 32,
        baseWindSpeed: 9,
        fireWeatherIndex: 'MEDIUM',
        seasonalVariation: 1.0,
        counties: ['06015', '06021', '06035', '06049', '06089', '06093', '06103', '06115'] // Del Norte, Glenn, Lassen, Modoc, Shasta, Siskiyou, Tehama, Yuba
      },
      
      // Desert regions - Extreme conditions
      'Desert': {
        baseTemperature: 95,
        baseHumidity: 8,
        baseWindSpeed: 18,
        fireWeatherIndex: 'EXTREME',
        seasonalVariation: 1.4,
        counties: ['06025', '06027', '06031'] // Imperial, Inyo, Kings
      }
    };
    
    // County to region mapping
    this.countyRegionMap = {};
    Object.keys(this.regionalWeatherProfiles).forEach(region => {
      this.regionalWeatherProfiles[region].counties.forEach(fips => {
        this.countyRegionMap[fips] = region;
      });
    });
  }

  /**
   * Get county-specific weather score for risk assessment
   * @param {string} fipsCode - County FIPS code
   * @param {Object} globalWeatherData - Global weather data (for reference)
   * @returns {Promise<number>} County-specific weather score (0-1)
   */
  async getCountyWeatherScore(fipsCode, globalWeatherData) {
    const cacheKey = `weather_score_${fipsCode}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.score;
      }
    }

    try {
      // Get regional weather conditions
      const weatherData = await this.getRegionalWeatherData(fipsCode);
      
      // Calculate weather score using the same logic as original but with regional data
      const weatherScore = this.calculateWeatherScore(weatherData);
      
      // Cache result
      this.cache.set(cacheKey, {
        score: weatherScore,
        timestamp: Date.now()
      });
      
      return weatherScore;
      
    } catch (error) {
      console.error(`Error calculating weather score for ${fipsCode}:`, error);
      return 0.4; // Default fallback
    }
  }

  /**
   * Get regional weather data for a county
   * @param {string} fipsCode - County FIPS code
   * @returns {Promise<Object>} Regional weather data
   */
  async getRegionalWeatherData(fipsCode) {
    const region = this.countyRegionMap[fipsCode] || 'Central Valley';
    const profile = this.regionalWeatherProfiles[region];
    
    // Get seasonal adjustment
    const seasonalModifier = this.getSeasonalModifier();
    
    // Apply daily variation (small random variation to simulate real conditions)
    const dailyVariation = 0.9 + (Math.random() * 0.2); // ±10% daily variation
    
    return {
      temperature: profile.baseTemperature * seasonalModifier * dailyVariation,
      humidity: Math.max(5, profile.baseHumidity * (2 - seasonalModifier) * dailyVariation), // Inverse relationship with season
      windSpeed: profile.baseWindSpeed * seasonalModifier * dailyVariation,
      fireWeatherIndex: this.adjustFireWeatherIndex(profile.fireWeatherIndex, seasonalModifier),
      region: region,
      profile: profile
    };
  }

  /**
   * Calculate weather score based on regional conditions
   * @param {Object} weatherData - Regional weather data
   * @returns {number} Weather score (0-1)
   */
  calculateWeatherScore(weatherData) {
    let weatherScore = 0.2; // Base score for California climate
    
    // Temperature factor (higher = more risk)
    if (weatherData.temperature > 95) weatherScore += 0.25;
    else if (weatherData.temperature > 85) weatherScore += 0.20;
    else if (weatherData.temperature > 75) weatherScore += 0.15;
    else if (weatherData.temperature > 65) weatherScore += 0.10;
    else weatherScore += 0.05;
    
    // Humidity factor (lower = more risk)
    if (weatherData.humidity < 10) weatherScore += 0.25;
    else if (weatherData.humidity < 20) weatherScore += 0.20;
    else if (weatherData.humidity < 30) weatherScore += 0.15;
    else if (weatherData.humidity < 40) weatherScore += 0.10;
    else weatherScore += 0.05;
    
    // Wind factor (higher = more risk)
    if (weatherData.windSpeed > 25) weatherScore += 0.20;
    else if (weatherData.windSpeed > 15) weatherScore += 0.15;
    else if (weatherData.windSpeed > 10) weatherScore += 0.10;
    else if (weatherData.windSpeed > 5) weatherScore += 0.05;
    
    // Fire Weather Index factor
    switch (weatherData.fireWeatherIndex) {
      case 'EXTREME': weatherScore += 0.15; break;
      case 'VERY HIGH': weatherScore += 0.12; break;
      case 'HIGH': weatherScore += 0.09; break;
      case 'MEDIUM': weatherScore += 0.06; break;
      case 'LOW': weatherScore += 0.03; break;
      default: weatherScore += 0.06;
    }
    
    return Math.min(weatherScore, 1.0);
  }

  /**
   * Get seasonal modifier for weather conditions
   * @returns {number} Seasonal modifier (0.7-1.3)
   */
  getSeasonalModifier() {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    
    // California fire weather season patterns
    const seasonalModifiers = {
      0: 0.7,  // January - Cooler, wetter
      1: 0.8,  // February - Cooler, wetter
      2: 0.9,  // March - Warming up
      3: 1.0,  // April - Moderate conditions
      4: 1.1,  // May - Warming, drying
      5: 1.2,  // June - Hot, dry
      6: 1.3,  // July - Peak heat
      7: 1.3,  // August - Peak heat
      8: 1.2,  // September - Still hot and dry
      9: 1.1,  // October - Cooling slightly
      10: 0.9, // November - Cooling down
      11: 0.8  // December - Cooler
    };
    
    return seasonalModifiers[month] || 1.0;
  }

  /**
   * Adjust fire weather index based on seasonal conditions
   * @param {string} baseIndex - Base fire weather index
   * @param {number} seasonalModifier - Seasonal modifier
   * @returns {string} Adjusted fire weather index
   */
  adjustFireWeatherIndex(baseIndex, seasonalModifier) {
    const indices = ['LOW', 'MEDIUM', 'HIGH', 'VERY HIGH', 'EXTREME'];
    let currentIndex = indices.indexOf(baseIndex);
    
    // Adjust based on seasonal modifier
    if (seasonalModifier > 1.2) {
      currentIndex = Math.min(currentIndex + 1, indices.length - 1);
    } else if (seasonalModifier < 0.8) {
      currentIndex = Math.max(currentIndex - 1, 0);
    }
    
    return indices[currentIndex];
  }

  /**
   * Get regional weather summary for all counties
   * @returns {Object} Regional weather summary
   */
  getRegionalWeatherSummary() {
    const summary = {};
    
    Object.keys(this.regionalWeatherProfiles).forEach(region => {
      const profile = this.regionalWeatherProfiles[region];
      summary[region] = {
        countyCount: profile.counties.length,
        typicalConditions: {
          temperature: profile.baseTemperature,
          humidity: profile.baseHumidity,
          windSpeed: profile.baseWindSpeed,
          fireWeatherIndex: profile.fireWeatherIndex
        },
        riskLevel: this.getRegionalRiskLevel(profile)
      };
    });
    
    return summary;
  }

  /**
   * Get risk level for a region based on typical conditions
   * @param {Object} profile - Regional weather profile
   * @returns {string} Risk level
   */
  getRegionalRiskLevel(profile) {
    const testWeather = {
      temperature: profile.baseTemperature,
      humidity: profile.baseHumidity,
      windSpeed: profile.baseWindSpeed,
      fireWeatherIndex: profile.fireWeatherIndex
    };
    
    const score = this.calculateWeatherScore(testWeather);
    
    if (score >= 0.8) return 'Very High';
    if (score >= 0.6) return 'High';
    if (score >= 0.4) return 'Medium';
    return 'Low';
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export default RegionalWeatherService;