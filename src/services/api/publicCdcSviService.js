/**
 * Public CDC Social Vulnerability Index (SVI) Service
 * 
 * Access to real CDC SVI 2022 data via publicly accessible GitHub repository
 * Source: https://github.com/lpiep/cdc-svi (lpiep/cdc-svi repository)
 * 
 * This service uses the archived CDC SVI 2022 dataset that was preserved
 * when the CDC removed SVI data from their official website in January 2025.
 * 
 * Data Coverage:
 * - All 58 California counties
 * - 2022 CDC/ATSDR Social Vulnerability Index
 * - County-level data with all vulnerability themes
 * - Population, demographics, and vulnerability scores
 * 
 * @see https://github.com/lpiep/cdc-svi
 * @see https://svi.cdc.gov (original CDC SVI documentation)
 */

export class PublicCdcSviService {
  constructor() {
    // GitHub repository hosting archived CDC SVI data
    this.dataUrl = 'https://raw.githubusercontent.com/lpiep/cdc-svi/main/csv/county/SVI_2022_US_county.csv';
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours (data is static)
    this.dataVersion = '2022';
    this.dataSource = 'CDC/ATSDR SVI 2022 (GitHub Archive)';
  }

  /**
   * Get SVI data for all California counties
   * @returns {Promise<Array>} Array of California county SVI data
   */
  async getCaliforniaSviData() {
    const cacheKey = 'california_svi_2022';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('✅ Using cached California SVI data (2022)');
        return cached.data;
      }
    }

    try {
      console.log('🔍 Fetching CDC SVI 2022 data from GitHub archive...');
      
      const response = await fetch(this.dataUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();
      const californiaData = this.parseCaliforniaCounties(csvText);
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: californiaData,
        timestamp: Date.now()
      });

      console.log(`✅ Successfully loaded ${californiaData.length} California counties from CDC SVI 2022`);
      return californiaData;
      
    } catch (error) {
      console.error('❌ Failed to fetch CDC SVI data from GitHub:', error);
      throw new Error(`CDC SVI data unavailable: ${error.message}`);
    }
  }

  /**
   * Get SVI data for a specific California county by FIPS code
   * @param {string} fipsCode - 5-digit county FIPS code (e.g., "06037")
   * @returns {Promise<Object|null>} County SVI data or null if not found
   */
  async getSviDataByFips(fipsCode) {
    const californiaData = await this.getCaliforniaSviData();
    return californiaData.find(county => county.fips === fipsCode) || null;
  }

  /**
   * Get SVI data for a county by coordinates (lat/lng)
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<Object|null>} County SVI data or null if not found
   */
  async getSviDataByCoordinates(latitude, longitude) {
    // For California, we can use a simple lookup table for major counties
    const countyLookup = this.getCountyByCoordinates(latitude, longitude);
    if (countyLookup) {
      return await this.getSviDataByFips(countyLookup.fips);
    }
    return null;
  }

  /**
   * Parse CSV data and extract California counties
   * @param {string} csvText - Raw CSV text
   * @returns {Array} Processed California county data
   */
  parseCaliforniaCounties(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = this.parseCSVLine(lines[0]);
    
    // Find column indices for required fields
    const indices = {
      state: headers.findIndex(h => h === 'STATE'),
      stateAbbr: headers.findIndex(h => h === 'ST_ABBR'),
      county: headers.findIndex(h => h === 'COUNTY'),
      fips: headers.findIndex(h => h === 'FIPS'),
      population: headers.findIndex(h => h === 'E_TOTPOP'),
      rplThemes: headers.findIndex(h => h === 'RPL_THEMES'),
      rplTheme1: headers.findIndex(h => h === 'RPL_THEME1'),
      rplTheme2: headers.findIndex(h => h === 'RPL_THEME2'),
      rplTheme3: headers.findIndex(h => h === 'RPL_THEME3'),
      rplTheme4: headers.findIndex(h => h === 'RPL_THEME4')
    };

    const californiaCounties = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      
      // Check if this is a California county
      if (values[indices.stateAbbr] === 'CA') {
        const county = this.processCountyData(values, indices);
        if (county) {
          californiaCounties.push(county);
        }
      }
    }

    return californiaCounties.sort((a, b) => a.county.localeCompare(b.county));
  }

  /**
   * Parse a CSV line handling quoted values
   * @param {string} line - CSV line
   * @returns {Array} Parsed values
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  /**
   * Process raw county data into standardized format
   * @param {Array} values - Raw CSV values
   * @param {Object} indices - Column indices
   * @returns {Object} Processed county data
   */
  processCountyData(values, indices) {
    try {
      const rplThemes = parseFloat(values[indices.rplThemes]);
      const rplTheme1 = parseFloat(values[indices.rplTheme1]);
      const rplTheme2 = parseFloat(values[indices.rplTheme2]);
      const rplTheme3 = parseFloat(values[indices.rplTheme3]);
      const rplTheme4 = parseFloat(values[indices.rplTheme4]);

      return {
        fips: values[indices.fips],
        state: values[indices.state],
        county: values[indices.county],
        
        // Overall vulnerability (0-100, higher = more vulnerable)
        overall: this.convertPercentileToScore(rplThemes),
        
        // Theme scores (0-100, higher = more vulnerable)
        socioeconomic: this.convertPercentileToScore(rplTheme1),
        householdComposition: this.convertPercentileToScore(rplTheme2),
        minorityLanguage: this.convertPercentileToScore(rplTheme3),
        housingTransportation: this.convertPercentileToScore(rplTheme4),
        
        // Population
        population: parseInt(values[indices.population]) || 0,
        
        // Metadata
        dataSource: this.dataSource,
        lastUpdate: this.dataVersion,
        percentileRank: rplThemes,
        
        // Raw percentile ranks for reference
        rawPercentiles: {
          overall: rplThemes,
          socioeconomic: rplTheme1,
          householdComposition: rplTheme2,
          minorityLanguage: rplTheme3,
          housingTransportation: rplTheme4
        }
      };
    } catch (error) {
      console.warn('⚠️ Error processing county data:', error);
      return null;
    }
  }

  /**
   * Convert CDC SVI percentile rank (0-1) to vulnerability score (0-100)
   * @param {number} percentile - CDC SVI percentile rank (0-1)
   * @returns {number} Vulnerability score (0-100)
   */
  convertPercentileToScore(percentile) {
    if (percentile === null || percentile === undefined || isNaN(percentile) || percentile < 0) {
      return 50; // Default medium vulnerability
    }
    return Math.round(percentile * 100);
  }

  /**
   * Get vulnerability level description
   * @param {number} score - Vulnerability score (0-100)
   * @returns {string} Vulnerability level description
   */
  getVulnerabilityLevel(score) {
    if (score >= 90) return 'Extremely High';
    if (score >= 75) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Moderate';
    if (score >= 25) return 'Low';
    return 'Very Low';
  }

  /**
   * Simple coordinate-to-county lookup for major California counties
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Object|null} County lookup result
   */
  getCountyByCoordinates(latitude, longitude) {
    // Major California county boundaries (approximate)
    const counties = [
      { name: 'Los Angeles County', fips: '06037', bounds: [33.7, 34.8, -118.7, -117.6] },
      { name: 'Orange County', fips: '06059', bounds: [33.3, 33.9, -118.1, -117.4] },
      { name: 'Riverside County', fips: '06065', bounds: [33.4, 34.1, -117.7, -114.4] }, // Includes 92880
      { name: 'San Bernardino County', fips: '06071', bounds: [34.0, 35.8, -118.0, -114.1] },
      { name: 'San Diego County', fips: '06073', bounds: [32.5, 33.5, -117.6, -116.1] },
      { name: 'Alameda County', fips: '06001', bounds: [37.4, 37.9, -122.4, -121.5] },
      { name: 'Santa Clara County', fips: '06085', bounds: [37.0, 37.5, -122.2, -121.2] },
      { name: 'San Francisco County', fips: '06075', bounds: [37.7, 37.8, -122.5, -122.3] }
    ];

    for (const county of counties) {
      const [minLat, maxLat, minLng, maxLng] = county.bounds;
      if (latitude >= minLat && latitude <= maxLat && 
          longitude >= minLng && longitude <= maxLng) {
        return county;
      }
    }

    return null;
  }

  /**
   * Get service status and metadata
   * @returns {Object} Service status information
   */
  getServiceStatus() {
    return {
      dataSource: this.dataSource,
      dataVersion: this.dataVersion,
      sourceUrl: this.dataUrl,
      cacheSize: this.cache.size,
      isPublic: true,
      requiresAuth: false,
      coverageArea: 'California (58 counties)',
      lastUpdate: '2022 (CDC/ATSDR official release)'
    };
  }

  /**
   * Clear the service cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export default PublicCdcSviService;