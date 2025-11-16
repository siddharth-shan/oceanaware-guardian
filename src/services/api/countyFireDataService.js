/**
 * County-Specific Fire Data Service
 * 
 * Provides county-level fire activity data for more accurate risk assessment
 * instead of using static values for all counties.
 */

export class CountyFireDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 6 * 60 * 60 * 1000; // 6 hours
    
    // California county fire risk profiles based on historical data
    this.countyFireProfiles = {
      // High fire-prone counties
      '06019': { baseRisk: 0.8, modifier: 1.2, region: 'Central Valley' },      // Fresno
      '06029': { baseRisk: 0.85, modifier: 1.25, region: 'Central Valley' },    // Kern
      '06037': { baseRisk: 0.7, modifier: 1.1, region: 'Southern California' }, // Los Angeles
      '06059': { baseRisk: 0.65, modifier: 1.0, region: 'Southern California' }, // Orange
      '06065': { baseRisk: 0.8, modifier: 1.15, region: 'Southern California' }, // Riverside
      '06071': { baseRisk: 0.75, modifier: 1.1, region: 'Southern California' }, // San Bernardino
      '06073': { baseRisk: 0.7, modifier: 1.05, region: 'Southern California' }, // San Diego
      '06111': { baseRisk: 0.75, modifier: 1.1, region: 'Southern California' }, // Ventura
      
      // Medium fire-prone counties
      '06001': { baseRisk: 0.6, modifier: 0.9, region: 'Bay Area' },           // Alameda
      '06013': { baseRisk: 0.55, modifier: 0.85, region: 'Bay Area' },         // Contra Costa
      '06041': { baseRisk: 0.5, modifier: 0.8, region: 'Bay Area' },           // Marin
      '06055': { baseRisk: 0.65, modifier: 0.95, region: 'Bay Area' },         // Napa
      '06075': { baseRisk: 0.4, modifier: 0.7, region: 'Bay Area' },           // San Francisco
      '06081': { baseRisk: 0.45, modifier: 0.75, region: 'Bay Area' },         // San Mateo
      '06085': { baseRisk: 0.5, modifier: 0.8, region: 'Bay Area' },           // Santa Clara
      '06095': { baseRisk: 0.55, modifier: 0.85, region: 'Bay Area' },         // Solano
      '06097': { baseRisk: 0.7, modifier: 1.0, region: 'Bay Area' },           // Sonoma
      
      // Lower fire-prone counties
      '06017': { baseRisk: 0.45, modifier: 0.75, region: 'Sierra Nevada' },    // El Dorado
      '06057': { baseRisk: 0.4, modifier: 0.7, region: 'Sierra Nevada' },      // Nevada
      '06061': { baseRisk: 0.42, modifier: 0.72, region: 'Sierra Nevada' },    // Placer
      '06067': { baseRisk: 0.35, modifier: 0.65, region: 'Central Valley' },   // Sacramento
      
      // Default profile for counties not explicitly listed
      default: { baseRisk: 0.5, modifier: 0.8, region: 'California' }
    };
  }

  /**
   * Get fire activity score for a specific county
   * @param {string} fipsCode - County FIPS code
   * @param {Object} globalFireData - Global fire data (for context)
   * @returns {Promise<number>} County-specific fire activity score (0-1)
   */
  async getCountyFireScore(fipsCode, globalFireData) {
    const cacheKey = `fire_score_${fipsCode}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.score;
      }
    }

    try {
      // Get county fire profile
      const profile = this.countyFireProfiles[fipsCode] || this.countyFireProfiles.default;
      
      // Calculate base fire score from historical risk
      let fireScore = profile.baseRisk;
      
      // Adjust based on current fire activity in the region
      const currentFireActivity = this.calculateCurrentFireActivity(fipsCode, globalFireData);
      fireScore = fireScore * (1 + currentFireActivity * 0.3); // Up to 30% increase
      
      // Apply regional modifier
      fireScore = fireScore * profile.modifier;
      
      // Apply seasonal adjustment
      const seasonalModifier = this.getSeasonalModifier();
      fireScore = fireScore * seasonalModifier;
      
      // Cap at 1.0
      fireScore = Math.min(fireScore, 1.0);
      
      // Cache result
      this.cache.set(cacheKey, {
        score: fireScore,
        timestamp: Date.now()
      });
      
      return fireScore;
      
    } catch (error) {
      console.error(`Error calculating fire score for ${fipsCode}:`, error);
      return 0.5; // Default fallback
    }
  }

  /**
   * Calculate current fire activity modifier based on nearby fires
   * @param {string} fipsCode - County FIPS code
   * @param {Object} globalFireData - Global fire data
   * @returns {number} Activity modifier (0-1)
   */
  calculateCurrentFireActivity(fipsCode, globalFireData) {
    if (!globalFireData || !globalFireData.fires) {
      return 0.1; // Low activity when no fire data
    }

    const fires = globalFireData.fires;
    let activityScore = 0;
    
    // Count fires by proximity and severity
    fires.forEach(fire => {
      if (fire.county && fire.county.includes(this.getCountyName(fipsCode))) {
        // Direct county match
        activityScore += 0.5;
        
        // Higher score for larger fires
        if (fire.acres > 10000) activityScore += 0.3;
        if (fire.acres > 50000) activityScore += 0.2;
        
        // Higher score for low containment
        if (fire.containment < 50) activityScore += 0.2;
      } else if (fire.distance && fire.distance <= 50) {
        // Nearby fires (within 50 miles)
        const proximityScore = Math.max(0, (50 - fire.distance) / 50) * 0.3;
        activityScore += proximityScore;
      }
    });
    
    return Math.min(activityScore, 1.0);
  }

  /**
   * Get seasonal fire risk modifier
   * @returns {number} Seasonal modifier (0.5-1.5)
   */
  getSeasonalModifier() {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    
    // California fire season patterns
    const seasonalRisk = {
      0: 0.6,  // January - Lower risk
      1: 0.7,  // February - Lower risk
      2: 0.8,  // March - Rising risk
      3: 0.9,  // April - Rising risk
      4: 1.0,  // May - Moderate risk
      5: 1.1,  // June - Higher risk
      6: 1.3,  // July - Peak risk
      7: 1.4,  // August - Peak risk
      8: 1.5,  // September - Highest risk
      9: 1.3,  // October - High risk
      10: 1.0, // November - Declining risk
      11: 0.7  // December - Lower risk
    };
    
    return seasonalRisk[month] || 1.0;
  }

  /**
   * Get county name from FIPS code (simplified lookup)
   * @param {string} fipsCode - County FIPS code
   * @returns {string} County name
   */
  getCountyName(fipsCode) {
    const countyNames = {
      '06001': 'Alameda',
      '06013': 'Contra Costa',
      '06019': 'Fresno',
      '06029': 'Kern',
      '06037': 'Los Angeles',
      '06059': 'Orange',
      '06065': 'Riverside',
      '06071': 'San Bernardino',
      '06073': 'San Diego',
      '06075': 'San Francisco',
      '06097': 'Sonoma',
      '06111': 'Ventura'
    };
    
    return countyNames[fipsCode] || 'Unknown';
  }

  /**
   * Get all county fire profiles for debugging
   * @returns {Object} County fire profiles
   */
  getCountyProfiles() {
    return this.countyFireProfiles;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export default CountyFireDataService;