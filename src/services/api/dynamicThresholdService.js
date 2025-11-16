/**
 * Dynamic Threshold Service
 * 
 * Implements percentile-based thresholds that adapt to the actual distribution
 * of risk scores, following CDC SVI methodology best practices.
 */

export class DynamicThresholdService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    
    // Default percentile thresholds (can be customized)
    this.defaultPercentiles = {
      HIGH: 0.75,    // 75th percentile - top 25% of risk
      MEDIUM: 0.50,  // 50th percentile - next 25% of risk
      LOW: 0.0       // Below 50th percentile - bottom 50%
    };
    
    // Minimum sample size for reliable percentile calculation
    this.minSampleSize = 10;
  }

  /**
   * Calculate dynamic thresholds based on actual risk score distribution
   * @param {Array} riskScores - Array of risk scores from all counties
   * @param {Object} options - Configuration options
   * @returns {Object} Dynamic threshold configuration
   */
  calculateDynamicThresholds(riskScores, options = {}) {
    const {
      percentiles = this.defaultPercentiles,
      minSampleSize = this.minSampleSize,
      smoothing = true
    } = options;
    
    // Validate input
    if (!Array.isArray(riskScores) || riskScores.length < minSampleSize) {
      console.warn(`⚠️ Insufficient sample size (${riskScores.length}), using fallback thresholds`);
      return this.getFallbackThresholds();
    }
    
    // Sort scores for percentile calculation
    const sortedScores = [...riskScores].sort((a, b) => a - b);
    
    // Calculate percentile thresholds
    const thresholds = {};
    
    Object.keys(percentiles).forEach(level => {
      const percentile = percentiles[level];
      const threshold = this.calculatePercentile(sortedScores, percentile);
      
      thresholds[level] = {
        threshold: threshold,
        percentile: percentile,
        label: this.getLevelLabel(level),
        color: this.getLevelColor(level),
        count: this.getCountAtThreshold(sortedScores, threshold, level),
        percentage: this.getPercentageAtThreshold(sortedScores, threshold, level)
      };
    });
    
    // Apply smoothing if requested
    if (smoothing) {
      this.applySmoothingToThresholds(thresholds, sortedScores);
    }
    
    // Add distribution statistics
    const statistics = this.calculateDistributionStatistics(sortedScores);
    
    return {
      thresholds: thresholds,
      statistics: statistics,
      sampleSize: riskScores.length,
      generatedAt: new Date().toISOString(),
      methodology: 'Percentile-based dynamic thresholds'
    };
  }

  /**
   * Calculate percentile value from sorted array
   * @param {Array} sortedArray - Sorted array of values
   * @param {number} percentile - Percentile to calculate (0-1)
   * @returns {number} Percentile value
   */
  calculatePercentile(sortedArray, percentile) {
    if (percentile <= 0) return sortedArray[0];
    if (percentile >= 1) return sortedArray[sortedArray.length - 1];
    
    const index = (sortedArray.length - 1) * percentile;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    // Linear interpolation for more accurate percentiles
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Apply smoothing to prevent threshold clustering
   * @param {Object} thresholds - Threshold configuration
   * @param {Array} sortedScores - Sorted risk scores
   */
  applySmoothingToThresholds(thresholds, sortedScores) {
    const levels = ['HIGH', 'MEDIUM', 'LOW'];
    
    // Ensure minimum separation between thresholds
    const minSeparation = (Math.max(...sortedScores) - Math.min(...sortedScores)) * 0.05; // 5% of range
    
    for (let i = 0; i < levels.length - 1; i++) {
      const currentLevel = levels[i];
      const nextLevel = levels[i + 1];
      
      if (thresholds[currentLevel] && thresholds[nextLevel]) {
        const diff = thresholds[currentLevel].threshold - thresholds[nextLevel].threshold;
        
        if (diff < minSeparation) {
          // Adjust thresholds to maintain minimum separation
          const adjustment = (minSeparation - diff) / 2;
          thresholds[currentLevel].threshold += adjustment;
          thresholds[nextLevel].threshold -= adjustment;
        }
      }
    }
  }

  /**
   * Calculate distribution statistics
   * @param {Array} sortedScores - Sorted risk scores
   * @returns {Object} Distribution statistics
   */
  calculateDistributionStatistics(sortedScores) {
    const sum = sortedScores.reduce((acc, score) => acc + score, 0);
    const mean = sum / sortedScores.length;
    
    const variance = sortedScores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / sortedScores.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      count: sortedScores.length,
      min: sortedScores[0],
      max: sortedScores[sortedScores.length - 1],
      mean: mean,
      median: this.calculatePercentile(sortedScores, 0.5),
      stdDev: stdDev,
      range: sortedScores[sortedScores.length - 1] - sortedScores[0],
      q1: this.calculatePercentile(sortedScores, 0.25),
      q3: this.calculatePercentile(sortedScores, 0.75),
      iqr: this.calculatePercentile(sortedScores, 0.75) - this.calculatePercentile(sortedScores, 0.25)
    };
  }

  /**
   * Get count of items at threshold level
   * @param {Array} sortedScores - Sorted risk scores
   * @param {number} threshold - Threshold value
   * @param {string} level - Risk level
   * @returns {number} Count of items
   */
  getCountAtThreshold(sortedScores, threshold, level) {
    if (level === 'HIGH') {
      return sortedScores.filter(score => score >= threshold).length;
    } else if (level === 'MEDIUM') {
      const highThreshold = this.calculatePercentile(sortedScores, this.defaultPercentiles.HIGH);
      return sortedScores.filter(score => score >= threshold && score < highThreshold).length;
    } else { // LOW
      const mediumThreshold = this.calculatePercentile(sortedScores, this.defaultPercentiles.MEDIUM);
      return sortedScores.filter(score => score < mediumThreshold).length;
    }
  }

  /**
   * Get percentage of items at threshold level
   * @param {Array} sortedScores - Sorted risk scores
   * @param {number} threshold - Threshold value
   * @param {string} level - Risk level
   * @returns {number} Percentage of items
   */
  getPercentageAtThreshold(sortedScores, threshold, level) {
    const count = this.getCountAtThreshold(sortedScores, threshold, level);
    return (count / sortedScores.length) * 100;
  }

  /**
   * Get label for risk level
   * @param {string} level - Risk level
   * @returns {string} Human-readable label
   */
  getLevelLabel(level) {
    const labels = {
      HIGH: 'High Impact Risk',
      MEDIUM: 'Medium Impact Risk',
      LOW: 'Low Impact Risk'
    };
    return labels[level] || `${level} Risk`;
  }

  /**
   * Get color for risk level
   * @param {string} level - Risk level
   * @returns {string} Color code
   */
  getLevelColor(level) {
    const colors = {
      HIGH: '#dc2626',
      MEDIUM: '#ea580c',
      LOW: '#16a34a'
    };
    return colors[level] || '#6b7280';
  }

  /**
   * Get fallback thresholds when dynamic calculation fails
   * @returns {Object} Fallback threshold configuration
   */
  getFallbackThresholds() {
    return {
      thresholds: {
        HIGH: { threshold: 0.69, percentile: 0.75, label: 'High Impact Risk', color: '#dc2626' },
        MEDIUM: { threshold: 0.66, percentile: 0.50, label: 'Medium Impact Risk', color: '#ea580c' },
        LOW: { threshold: 0.0, percentile: 0.0, label: 'Low Impact Risk', color: '#16a34a' }
      },
      statistics: null,
      sampleSize: 0,
      generatedAt: new Date().toISOString(),
      methodology: 'Fallback static thresholds'
    };
  }

  /**
   * Validate threshold configuration
   * @param {Object} thresholds - Threshold configuration
   * @returns {boolean} Whether configuration is valid
   */
  validateThresholds(thresholds) {
    if (!thresholds || !thresholds.thresholds) return false;
    
    const required = ['HIGH', 'MEDIUM', 'LOW'];
    for (const level of required) {
      if (!thresholds.thresholds[level] || typeof thresholds.thresholds[level].threshold !== 'number') {
        return false;
      }
    }
    
    // Check logical ordering
    const high = thresholds.thresholds.HIGH.threshold;
    const medium = thresholds.thresholds.MEDIUM.threshold;
    const low = thresholds.thresholds.LOW.threshold;
    
    return high >= medium && medium >= low;
  }

  /**
   * Get cached thresholds or calculate new ones
   * @param {Array} riskScores - Array of risk scores
   * @param {Object} options - Configuration options
   * @returns {Object} Threshold configuration
   */
  async getThresholds(riskScores, options = {}) {
    const cacheKey = `thresholds_${riskScores.length}_${JSON.stringify(options)}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.thresholds;
      }
    }
    
    // Calculate new thresholds
    const thresholds = this.calculateDynamicThresholds(riskScores, options);
    
    // Cache result
    this.cache.set(cacheKey, {
      thresholds: thresholds,
      timestamp: Date.now()
    });
    
    return thresholds;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export default DynamicThresholdService;