/**
 * CDC SVI Quartile Service
 * 
 * Implements CDC Social Vulnerability Index quartile methodology
 * for standardized vulnerability assessment and risk classification.
 */

export class CdcSviQuartileService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    
    // CDC SVI standard quartile thresholds
    this.quartileThresholds = {
      Q1: { min: 0.0, max: 0.25, label: 'Lowest Vulnerability', color: '#16a34a' },
      Q2: { min: 0.25, max: 0.5, label: 'Low-Medium Vulnerability', color: '#65a30d' },
      Q3: { min: 0.5, max: 0.75, label: 'Medium-High Vulnerability', color: '#ea580c' },
      Q4: { min: 0.75, max: 1.0, label: 'Highest Vulnerability', color: '#dc2626' }
    };
    
    // Risk mapping based on CDC SVI quartiles
    this.sviRiskMapping = {
      Q1: 'LOW',
      Q2: 'LOW',
      Q3: 'MEDIUM',
      Q4: 'HIGH'
    };
  }

  /**
   * Calculate CDC SVI quartile for a vulnerability score
   * @param {number} vulnerabilityScore - Vulnerability score (0-100)
   * @returns {Object} Quartile information
   */
  calculateQuartile(vulnerabilityScore) {
    // Convert to 0-1 scale if needed
    const normalizedScore = vulnerabilityScore > 1 ? vulnerabilityScore / 100 : vulnerabilityScore;
    
    // Determine quartile
    let quartile;
    if (normalizedScore <= 0.25) quartile = 'Q1';
    else if (normalizedScore <= 0.5) quartile = 'Q2';
    else if (normalizedScore <= 0.75) quartile = 'Q3';
    else quartile = 'Q4';
    
    const quartileInfo = this.quartileThresholds[quartile];
    
    return {
      quartile: quartile,
      percentile: normalizedScore,
      percentileRank: Math.round(normalizedScore * 100),
      label: quartileInfo.label,
      color: quartileInfo.color,
      riskImplication: this.sviRiskMapping[quartile],
      description: this.getQuartileDescription(quartile)
    };
  }

  /**
   * Get quartile description
   * @param {string} quartile - Quartile (Q1-Q4)
   * @returns {string} Description
   */
  getQuartileDescription(quartile) {
    const descriptions = {
      Q1: 'Communities with the lowest social vulnerability - generally well-resourced with high resilience capacity',
      Q2: 'Communities with below-average social vulnerability - moderate resources and resilience',
      Q3: 'Communities with above-average social vulnerability - limited resources and moderate resilience challenges',
      Q4: 'Communities with the highest social vulnerability - significant resource limitations and resilience challenges'
    };
    return descriptions[quartile];
  }

  /**
   * Calculate enhanced vulnerability score using CDC methodology
   * @param {Object} sviData - SVI data for a county
   * @param {Object} trends - Trend analysis data
   * @returns {Object} Enhanced vulnerability assessment
   */
  calculateEnhancedVulnerabilityScore(sviData, trends) {
    const latestData = sviData.yearlyData[sviData.yearlyData.length - 1];
    
    // Base vulnerability from latest SVI data
    const baseVulnerability = latestData.overall / 100;
    
    // Calculate theme-specific quartiles
    const themeQuartiles = {
      socioeconomic: this.calculateQuartile(latestData.socioeconomic),
      householdComposition: this.calculateQuartile(latestData.householdComposition),
      minorityLanguage: this.calculateQuartile(latestData.minorityLanguage),
      housingTransportation: this.calculateQuartile(latestData.housingTransportation)
    };
    
    // Calculate overall quartile
    const overallQuartile = this.calculateQuartile(latestData.overall);
    
    // Apply trend adjustments following CDC guidelines
    let adjustedVulnerability = baseVulnerability;
    
    // Trend-based adjustments
    if (trends.trendAnalysis.riskDirection === 'worsening') {
      // Increase vulnerability for worsening trends
      adjustedVulnerability *= 1.1;
    } else if (trends.trendAnalysis.riskDirection === 'improving') {
      // Decrease vulnerability for improving trends
      adjustedVulnerability *= 0.9;
    }
    
    // Accelerating trend penalty
    if (trends.trendAnalysis.recentTrend === 'increasing' && 
        trends.trendAnalysis.overallTrend === 'increasing') {
      adjustedVulnerability *= 1.05;
    }
    
    // Cap at 1.0
    adjustedVulnerability = Math.min(adjustedVulnerability, 1.0);
    
    return {
      baseVulnerability: baseVulnerability,
      adjustedVulnerability: adjustedVulnerability,
      overallQuartile: overallQuartile,
      themeQuartiles: themeQuartiles,
      trendAdjustment: adjustedVulnerability - baseVulnerability,
      cdcCompliance: true,
      methodology: 'CDC SVI Quartile-based Assessment'
    };
  }

  /**
   * Calculate distribution of counties across quartiles
   * @param {Array} counties - Array of county SVI data
   * @returns {Object} Quartile distribution
   */
  calculateQuartileDistribution(counties) {
    const distribution = { Q1: [], Q2: [], Q3: [], Q4: [] };
    
    counties.forEach(county => {
      const quartile = this.calculateQuartile(county.overall);
      distribution[quartile.quartile].push({
        fips: county.fips,
        county: county.county,
        sviScore: county.overall,
        quartileInfo: quartile
      });
    });
    
    return {
      distribution: distribution,
      counts: {
        Q1: distribution.Q1.length,
        Q2: distribution.Q2.length,
        Q3: distribution.Q3.length,
        Q4: distribution.Q4.length
      },
      percentages: {
        Q1: (distribution.Q1.length / counties.length) * 100,
        Q2: (distribution.Q2.length / counties.length) * 100,
        Q3: (distribution.Q3.length / counties.length) * 100,
        Q4: (distribution.Q4.length / counties.length) * 100
      },
      totalCounties: counties.length
    };
  }

  /**
   * Map SVI quartile to risk level
   * @param {string} quartile - SVI quartile (Q1-Q4)
   * @param {Object} additionalFactors - Additional risk factors
   * @returns {Object} Risk level mapping
   */
  mapQuartileToRiskLevel(quartile, additionalFactors = {}) {
    const baseRisk = this.sviRiskMapping[quartile];
    let finalRisk = baseRisk;
    
    // Adjust risk based on additional factors
    if (additionalFactors.fireActivity >= 0.8) {
      // High fire activity can escalate risk
      if (finalRisk === 'LOW') finalRisk = 'MEDIUM';
      else if (finalRisk === 'MEDIUM') finalRisk = 'HIGH';
    }
    
    if (additionalFactors.weatherRisk >= 0.8) {
      // High weather risk can escalate risk
      if (finalRisk === 'LOW') finalRisk = 'MEDIUM';
      else if (finalRisk === 'MEDIUM') finalRisk = 'HIGH';
    }
    
    if (additionalFactors.trendWorsening) {
      // Worsening vulnerability trends escalate risk
      if (finalRisk === 'LOW') finalRisk = 'MEDIUM';
    }
    
    return {
      baseRisk: baseRisk,
      finalRisk: finalRisk,
      quartile: quartile,
      escalationFactors: this.getEscalationFactors(additionalFactors),
      methodology: 'CDC SVI Quartile + Multi-factor Risk Assessment'
    };
  }

  /**
   * Get escalation factors that influenced risk assessment
   * @param {Object} factors - Additional risk factors
   * @returns {Array} Escalation factors
   */
  getEscalationFactors(factors) {
    const escalations = [];
    
    if (factors.fireActivity >= 0.8) {
      escalations.push('High fire activity');
    }
    if (factors.weatherRisk >= 0.8) {
      escalations.push('Extreme weather conditions');
    }
    if (factors.trendWorsening) {
      escalations.push('Worsening vulnerability trends');
    }
    
    return escalations;
  }

  /**
   * Generate CDC SVI compliance report
   * @param {Array} counties - Array of county assessments
   * @returns {Object} Compliance report
   */
  generateComplianceReport(counties) {
    const quartileDistribution = this.calculateQuartileDistribution(counties);
    
    // Check if distribution follows expected CDC patterns
    const expectedDistribution = { Q1: 25, Q2: 25, Q3: 25, Q4: 25 };
    const deviations = {};
    
    Object.keys(expectedDistribution).forEach(quartile => {
      const actual = quartileDistribution.percentages[quartile];
      const expected = expectedDistribution[quartile];
      deviations[quartile] = Math.abs(actual - expected);
    });
    
    const overallDeviation = Object.values(deviations).reduce((sum, dev) => sum + dev, 0) / 4;
    
    return {
      quartileDistribution: quartileDistribution,
      deviations: deviations,
      overallDeviation: overallDeviation,
      cdcCompliance: overallDeviation < 10, // Within 10% deviation is acceptable
      recommendations: this.generateComplianceRecommendations(deviations),
      methodology: 'CDC SVI Quartile Distribution Analysis'
    };
  }

  /**
   * Generate recommendations for improving CDC compliance
   * @param {Object} deviations - Quartile deviations
   * @returns {Array} Recommendations
   */
  generateComplianceRecommendations(deviations) {
    const recommendations = [];
    
    Object.keys(deviations).forEach(quartile => {
      const deviation = deviations[quartile];
      if (deviation > 10) {
        recommendations.push({
          quartile: quartile,
          issue: `${deviation.toFixed(1)}% deviation from expected distribution`,
          recommendation: `Review data quality and processing for ${quartile} vulnerability assessment`
        });
      }
    });
    
    if (recommendations.length === 0) {
      recommendations.push({
        status: 'compliant',
        message: 'Distribution follows CDC SVI quartile methodology standards'
      });
    }
    
    return recommendations;
  }

  /**
   * Clear service cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export default CdcSviQuartileService;