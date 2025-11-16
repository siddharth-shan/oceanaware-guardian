/**
 * Multi-Year CDC Social Vulnerability Index (SVI) Service
 * 
 * Provides access to CDC SVI data across multiple years (2000-2022) for 
 * trend analysis and more robust wildfire risk predictions.
 * 
 * Data Source: https://github.com/lpiep/cdc-svi (lpiep/cdc-svi repository)
 * Years Available: 2018, 2020, 2022
 * 
 * This service enables:
 * - Vulnerability trend analysis over recent years (2018-2022)
 * - Prediction robustness through historical context
 * - Identification of improving/worsening vulnerability patterns
 * - Multi-year weighted risk calculations
 * 
 * @see https://github.com/lpiep/cdc-svi
 * @see https://www.atsdr.cdc.gov/place-health/php/svi/svi-data-documentation-download.html
 */

// Module-level cache and loading state to prevent multiple loads across instances
const globalCache = new Map();
const globalLoadingState = new Map();

export class MultiYearSviService {
  constructor() {
    // GitHub repository hosting archived CDC SVI data
    this.baseUrl = 'https://raw.githubusercontent.com/lpiep/cdc-svi/main/csv/county';
    this.availableYears = [2018, 2020, 2022];
    this.cache = globalCache; // Use global cache
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours (data is static)
    this.dataSource = 'CDC/ATSDR SVI Multi-Year (GitHub Archive)';
  }

  /**
   * Get SVI data for a specific year
   * @param {number} year - Year (2018, 2020, 2022)
   * @returns {Promise<Array>} Array of California county SVI data for the year
   */
  async getSviDataByYear(year) {
    if (!this.availableYears.includes(year)) {
      throw new Error(`Year ${year} not available. Available years: ${this.availableYears.join(', ')}`);
    }

    const cacheKey = `california_svi_${year}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        // Return cached data without logging to reduce console spam
        return cached.data;
      }
    }

    try {
      console.log(`🔍 Fetching CDC SVI ${year} data for California counties...`);
      
      const dataUrl = `${this.baseUrl}/SVI_${year}_US_county.csv`;
      
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(dataUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'text/csv,text/plain,*/*'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`⚠️ CDC SVI ${year} data not found (404). This year may not be available.`);
          return []; // Return empty array for missing years
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();
      
      if (!csvText || csvText.trim().length === 0) {
        console.warn(`⚠️ CDC SVI ${year} returned empty response`);
        return [];
      }
      
      const californiaData = this.parseCaliforniaCounties(csvText, year);
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: californiaData,
        timestamp: Date.now()
      });

      console.log(`✅ Successfully loaded ${californiaData.length} California counties from CDC SVI ${year}`);
      if (californiaData.length > 0) {
        console.log(`📋 Sample counties: ${californiaData.slice(0, 3).map(c => `${c.county} (${c.fips})`).join(', ')}`);
      }
      return californiaData;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`⚠️ CDC SVI ${year} data fetch timeout`);
        return [];
      }
      console.error(`❌ Failed to fetch CDC SVI ${year} data:`, error);
      return []; // Return empty array instead of throwing to prevent cascade failures
    }
  }

  /**
   * Get multi-year SVI data for all available years
   * @returns {Promise<Object>} Object with year as key and county array as value
   */
  async getMultiYearSviData() {
    const cacheKey = 'california_svi_multiyear';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        // Don't log every time to reduce console spam
        return cached.data;
      }
    }

    // Check if already loading globally to prevent multiple simultaneous loads
    if (globalLoadingState.has(cacheKey)) {
      console.log('⏳ Multi-year data already loading, waiting...');
      // Wait for the existing load to complete
      return await globalLoadingState.get(cacheKey);
    }

    try {
      console.log('🔍 Fetching recent CDC SVI data (2018-2022)...');
      
      // Create a promise to track this loading operation
      const loadingPromise = this.performMultiYearLoad(cacheKey);
      globalLoadingState.set(cacheKey, loadingPromise);
      
      const result = await loadingPromise;
      globalLoadingState.delete(cacheKey);
      
      return result;
    } catch (error) {
      globalLoadingState.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Perform the actual multi-year data loading
   * @param {string} cacheKey - Cache key for storing results
   * @returns {Promise<Object>} Multi-year data
   */
  async performMultiYearLoad(cacheKey) {
    const multiYearData = {};
    const promises = this.availableYears.map(async year => {
      try {
        const yearData = await this.getSviDataByYear(year);
        return { year, data: yearData };
      } catch (error) {
        console.warn(`⚠️ Skipping year ${year}:`, error.message);
        return { year, data: [] };
      }
    });

    const results = await Promise.all(promises);
    
    results.forEach(({ year, data }) => {
      multiYearData[year] = data;
    });

    // Cache the results
    this.cache.set(cacheKey, {
      data: multiYearData,
      timestamp: Date.now()
    });

    const totalYearsLoaded = Object.values(multiYearData).filter(data => data.length > 0).length;
    console.log(`✅ Successfully loaded recent SVI data for ${totalYearsLoaded} years (2018-2022)`);
    
    return multiYearData;
  }

  /**
   * Calculate county trends from pre-loaded multi-year data (more efficient)
   * @param {Object} multiYearData - Pre-loaded multi-year data
   * @param {string} fipsCode - 5-digit county FIPS code (e.g., "06065")
   * @returns {Object|null} County vulnerability trends over time
   */
  calculateCountyTrendsFromData(multiYearData, fipsCode) {
    const trends = {
      fips: fipsCode,
      county: null,
      yearlyData: [],
      trendAnalysis: {
        overallTrend: 'stable',
        averageVulnerability: 0,
        trendSlope: 0,
        riskDirection: 'stable'
      }
    };

    // Extract data for this county across all years
    const vulnerabilityScores = [];
    
    for (const year of this.availableYears) {
      const yearData = multiYearData[year] || [];
      const countyData = yearData.find(county => county.fips === fipsCode);
      
      if (countyData) {
        trends.county = countyData.county;
        trends.yearlyData.push({
          year,
          overall: countyData.overall,
          socioeconomic: countyData.socioeconomic,
          householdComposition: countyData.householdComposition,
          minorityLanguage: countyData.minorityLanguage,
          housingTransportation: countyData.housingTransportation,
          population: countyData.population
        });
        vulnerabilityScores.push(countyData.overall);
      }
    }

    if (trends.yearlyData.length === 0) {
      return null; // Return null instead of throwing error
    }

    // Calculate trend analysis
    trends.trendAnalysis = this.calculateTrendAnalysis(vulnerabilityScores, trends.yearlyData);

    return trends;
  }

  /**
   * Get vulnerability trends for a specific county over all years (original method for backwards compatibility)
   * @param {string} fipsCode - 5-digit county FIPS code (e.g., "06065")
   * @returns {Promise<Object>} County vulnerability trends over time
   */
  async getCountyVulnerabilityTrends(fipsCode) {
    const multiYearData = await this.getMultiYearSviData();
    const trends = this.calculateCountyTrendsFromData(multiYearData, fipsCode);
    
    if (!trends) {
      throw new Error(`No SVI data found for FIPS code: ${fipsCode}`);
    }
    
    return trends;
  }

  /**
   * Calculate trend analysis from vulnerability scores over time
   * @param {Array} scores - Array of vulnerability scores
   * @param {Array} yearlyData - Array of yearly data points
   * @returns {Object} Trend analysis results
   */
  calculateTrendAnalysis(scores, yearlyData) {
    if (scores.length < 2) {
      return {
        overallTrend: 'insufficient_data',
        averageVulnerability: scores[0] || 0,
        trendSlope: 0,
        riskDirection: 'unknown',
        recentTrend: 'unknown'
      };
    }

    // Calculate average vulnerability
    const averageVulnerability = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

    // Calculate trend slope using linear regression
    const n = scores.length;
    const years = yearlyData.map((_, index) => index); // 0, 1, 2, ... for calculation
    const sumX = years.reduce((sum, x) => sum + x, 0);
    const sumY = scores.reduce((sum, y) => sum + y, 0);
    const sumXY = years.reduce((sum, x, i) => sum + x * scores[i], 0);
    const sumXX = years.reduce((sum, x) => sum + x * x, 0);

    const trendSlope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Determine overall trend direction
    let overallTrend = 'stable';
    let riskDirection = 'stable';
    
    if (Math.abs(trendSlope) > 1) { // Significant change threshold
      if (trendSlope > 0) {
        overallTrend = 'increasing';
        riskDirection = 'worsening';
      } else {
        overallTrend = 'decreasing';
        riskDirection = 'improving';
      }
    }

    // Analyze recent trend (last 3 data points if available)
    let recentTrend = 'stable';
    if (scores.length >= 3) {
      const recentScores = scores.slice(-3);
      const recentChange = recentScores[recentScores.length - 1] - recentScores[0];
      
      if (Math.abs(recentChange) > 2) {
        recentTrend = recentChange > 0 ? 'increasing' : 'decreasing';
      }
    }

    return {
      overallTrend,
      averageVulnerability,
      trendSlope: Math.round(trendSlope * 100) / 100, // Round to 2 decimal places
      riskDirection,
      recentTrend,
      dataPoints: scores.length,
      yearRange: `${yearlyData[0].year}-${yearlyData[yearlyData.length - 1].year}`
    };
  }

  /**
   * Calculate enhanced vulnerability from pre-calculated trends (more efficient)
   * @param {Object} trends - Pre-calculated vulnerability trends
   * @returns {Object} Enhanced vulnerability assessment
   */
  calculateEnhancedVulnerabilityFromTrends(trends) {
    const latestData = trends.yearlyData[trends.yearlyData.length - 1];
    
    if (!latestData) {
      throw new Error('No recent vulnerability data available');
    }

    // Calculate trend-weighted vulnerability score
    let trendWeight = 1.0; // Base weight
    
    // Adjust weight based on trend direction
    if (trends.trendAnalysis.riskDirection === 'worsening') {
      trendWeight = 1.1; // Increase weight for worsening trends
    } else if (trends.trendAnalysis.riskDirection === 'improving') {
      trendWeight = 0.9; // Decrease weight for improving trends
    }

    // Additional weight for recent accelerating trends
    if (trends.trendAnalysis.recentTrend === 'increasing' && trends.trendAnalysis.overallTrend === 'increasing') {
      trendWeight *= 1.05; // Compound effect for accelerating vulnerability
    }

    const enhancedScore = Math.min(100, Math.round(latestData.overall * trendWeight));

    return {
      fips: trends.fips,
      county: trends.county,
      currentVulnerability: latestData.overall,
      enhancedVulnerability: enhancedScore,
      trendWeight,
      trendAnalysis: trends.trendAnalysis,
      dataSource: `${this.dataSource} (${trends.trendAnalysis.yearRange})`,
      recommendation: this.getVulnerabilityRecommendation(trends.trendAnalysis)
    };
  }

  /**
   * Get enhanced vulnerability score with trend weighting (original method for backwards compatibility)
   * @param {string} fipsCode - 5-digit county FIPS code
   * @returns {Promise<Object>} Enhanced vulnerability assessment
   */
  async getEnhancedVulnerabilityScore(fipsCode) {
    try {
      const trends = await this.getCountyVulnerabilityTrends(fipsCode);
      return this.calculateEnhancedVulnerabilityFromTrends(trends);
    } catch (error) {
      console.error(`❌ Failed to get enhanced vulnerability for ${fipsCode}:`, error);
      throw error;
    }
  }

  /**
   * Get vulnerability trend recommendation
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {string} Recommendation based on trends
   */
  getVulnerabilityRecommendation(trendAnalysis) {
    const { riskDirection, recentTrend, averageVulnerability } = trendAnalysis;

    if (riskDirection === 'worsening' && recentTrend === 'increasing') {
      return 'HIGH PRIORITY: Vulnerability is worsening with accelerating recent trends';
    } else if (riskDirection === 'worsening') {
      return 'ELEVATED RISK: Long-term vulnerability trend is worsening';
    } else if (recentTrend === 'increasing' && averageVulnerability > 70) {
      return 'MONITOR CLOSELY: Recent vulnerability increase in high-risk area';
    } else if (riskDirection === 'improving') {
      return 'POSITIVE TREND: Vulnerability has been improving over time';
    } else {
      return 'STABLE: Vulnerability levels have remained relatively stable';
    }
  }

  /**
   * Parse CSV data and extract California counties for a specific year
   * @param {string} csvText - Raw CSV text
   * @param {number} year - Data year
   * @returns {Array} Processed California county data
   */
  parseCaliforniaCounties(csvText, year) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = this.parseCSVLine(lines[0]);
    
    // Find column indices for required fields (may vary by year)
    const indices = this.getColumnIndices(headers, year);
    // Debug column indices if needed
    if (indices.fips === -1 || indices.county === -1) {
      console.warn(`⚠️ Missing critical columns for ${year}:`, {
        fips: indices.fips,
        county: indices.county,
        stateAbbr: indices.stateAbbr
      });
    }

    const californiaCounties = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      
      // Check if this is a California county (handle different column formats)
      const stateValue = values[indices.stateAbbr] || values[indices.state];
      const isCaliforniaCounty = 
        stateValue === 'CA' || 
        stateValue === 'California' ||
        values[indices.fips]?.startsWith('06'); // California FIPS codes start with 06
        
      if (isCaliforniaCounty) {
        const county = this.processCountyData(values, indices, year);
        if (county) {
          californiaCounties.push(county);
        }
      }
    }

    return californiaCounties.sort((a, b) => a.county.localeCompare(b.county));
  }

  /**
   * Get column indices based on year (column names vary significantly across years)
   * @param {Array} headers - CSV headers
   * @param {number} year - Data year
   * @returns {Object} Column indices
   */
  getColumnIndices(headers, year) {
    const indices = {};

    // Recent years (2018+) have consistent format
    indices.state = headers.findIndex(h => h === 'STATE');
    indices.stateAbbr = headers.findIndex(h => h === 'ST_ABBR');
    indices.county = headers.findIndex(h => h === 'COUNTY');
    indices.fips = headers.findIndex(h => h === 'FIPS');
    indices.population = headers.findIndex(h => h === 'E_TOTPOP');
    
    // Standard RPL columns for recent years
    indices.rplThemes = headers.findIndex(h => h === 'RPL_THEMES');
    indices.rplTheme1 = headers.findIndex(h => h === 'RPL_THEME1');
    indices.rplTheme2 = headers.findIndex(h => h === 'RPL_THEME2');
    indices.rplTheme3 = headers.findIndex(h => h === 'RPL_THEME3');
    indices.rplTheme4 = headers.findIndex(h => h === 'RPL_THEME4');

    return indices;
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
   * @param {number} year - Data year
   * @returns {Object} Processed county data
   */
  processCountyData(values, indices, year) {
    try {
      const rplThemes = parseFloat(values[indices.rplThemes]);
      const rplTheme1 = parseFloat(values[indices.rplTheme1]);
      const rplTheme2 = parseFloat(values[indices.rplTheme2]);
      const rplTheme3 = parseFloat(values[indices.rplTheme3]);
      const rplTheme4 = parseFloat(values[indices.rplTheme4]);

      // Handle different county name formats
      let countyName = values[indices.county];
      if (year <= 2010 && countyName) {
        // 2010 format: "County Name, State" - extract just the county name
        countyName = countyName.replace(/^"/, '').replace(/"$/, ''); // Remove quotes
        countyName = countyName.split(',')[0].trim(); // Take part before comma
      }

      return {
        fips: values[indices.fips],
        state: values[indices.state],
        county: countyName,
        year,
        
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
        dataSource: `${this.dataSource} ${year}`,
        percentileRank: rplThemes
      };
    } catch (error) {
      console.warn(`⚠️ Error processing county data for year ${year}:`, error);
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
   * Get service status and metadata
   * @returns {Object} Service status information
   */
  getServiceStatus() {
    return {
      dataSource: this.dataSource,
      availableYears: this.availableYears,
      yearRange: `${this.availableYears[0]}-${this.availableYears[this.availableYears.length - 1]}`,
      totalYears: this.availableYears.length,
      cacheSize: this.cache.size,
      isPublic: true,
      requiresAuth: false,
      coverageArea: 'California (58 counties)',
      features: [
        'Recent trend analysis (2018-2022)',
        'Vulnerability trajectory prediction',
        'Enhanced risk weighting',
        'Recent historical context integration'
      ]
    };
  }

  /**
   * Clear the service cache
   */
  clearCache() {
    this.cache.clear();
    globalLoadingState.clear();
  }
}

export default MultiYearSviService;