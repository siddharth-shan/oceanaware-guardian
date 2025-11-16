/**
 * Validation Report Generator
 * 
 * Generates comprehensive validation reports comparing before/after
 * risk classifications and CDC SVI compliance.
 */

import { CommunityImpactService } from './communityImpactService.js';
import { RiskClassificationTests } from './tests/riskClassificationTests.js';

export class ValidationReportGenerator {
  constructor() {
    this.communityImpactService = new CommunityImpactService();
    this.testSuite = new RiskClassificationTests();
  }

  /**
   * Generate complete validation report
   * @returns {Promise<Object>} Validation report
   */
  async generateValidationReport() {
    console.log('📊 Generating comprehensive validation report...');
    
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        scope: 'California Counties Risk Classification Validation'
      },
      
      // Test results
      testResults: await this.testSuite.runAllTests(),
      
      // Distribution analysis
      distributionAnalysis: await this.analyzeRiskDistribution(),
      
      // CDC SVI compliance
      cdcSviCompliance: await this.validateCdcSviCompliance(),
      
      // Performance metrics
      performanceMetrics: await this.calculatePerformanceMetrics(),
      
      // Recommendations
      recommendations: [],
      
      // Comparison with original system
      comparisonWithOriginal: this.generateComparisonReport()
    };
    
    // Generate overall recommendations
    report.recommendations = this.generateOverallRecommendations(report);
    
    return report;
  }

  /**
   * Analyze risk distribution across counties
   * @returns {Promise<Object>} Distribution analysis
   */
  async analyzeRiskDistribution() {
    console.log('📈 Analyzing risk distribution...');
    
    try {
      const mockFireData = { fires: [] };
      const mockWeatherData = { temperature: 85, humidity: 20, windSpeed: 15 };
      
      const predictions = await this.communityImpactService.getPredictionsForAllCounties(
        mockFireData,
        mockWeatherData
      );
      
      const distribution = {
        HIGH: predictions.filter(p => p.riskLevel.level === 'HIGH').length,
        MEDIUM: predictions.filter(p => p.riskLevel.level === 'MEDIUM').length,
        LOW: predictions.filter(p => p.riskLevel.level === 'LOW').length
      };
      
      const total = predictions.length;
      
      return {
        counts: distribution,
        percentages: {
          HIGH: (distribution.HIGH / total) * 100,
          MEDIUM: (distribution.MEDIUM / total) * 100,
          LOW: (distribution.LOW / total) * 100
        },
        totalCounties: total,
        riskScoreStatistics: this.calculateRiskScoreStatistics(predictions),
        thresholdInfo: predictions[0]?.thresholdInfo || null,
        distributionQuality: this.assessDistributionQuality(distribution, total)
      };
      
    } catch (error) {
      console.error('❌ Failed to analyze risk distribution:', error);
      return {
        error: error.message,
        status: 'failed'
      };
    }
  }

  /**
   * Calculate risk score statistics
   * @param {Array} predictions - Array of predictions
   * @returns {Object} Risk score statistics
   */
  calculateRiskScoreStatistics(predictions) {
    const riskScores = predictions.map(p => p.riskScore);
    const sorted = [...riskScores].sort((a, b) => a - b);
    const sum = riskScores.reduce((acc, score) => acc + score, 0);
    const mean = sum / riskScores.length;
    
    return {
      min: Math.min(...riskScores),
      max: Math.max(...riskScores),
      mean: mean,
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev: Math.sqrt(riskScores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / riskScores.length),
      q1: sorted[Math.floor(sorted.length * 0.25)],
      q3: sorted[Math.floor(sorted.length * 0.75)],
      range: Math.max(...riskScores) - Math.min(...riskScores)
    };
  }

  /**
   * Assess distribution quality
   * @param {Object} distribution - Risk distribution counts
   * @param {number} total - Total counties
   * @returns {Object} Distribution quality assessment
   */
  assessDistributionQuality(distribution, total) {
    const percentages = {
      HIGH: (distribution.HIGH / total) * 100,
      MEDIUM: (distribution.MEDIUM / total) * 100,
      LOW: (distribution.LOW / total) * 100
    };
    
    // Ideal distribution: ~25% HIGH, ~25% MEDIUM, ~50% LOW
    const idealDistribution = { HIGH: 25, MEDIUM: 25, LOW: 50 };
    
    const deviations = {
      HIGH: Math.abs(percentages.HIGH - idealDistribution.HIGH),
      MEDIUM: Math.abs(percentages.MEDIUM - idealDistribution.MEDIUM),
      LOW: Math.abs(percentages.LOW - idealDistribution.LOW)
    };
    
    const avgDeviation = (deviations.HIGH + deviations.MEDIUM + deviations.LOW) / 3;
    
    return {
      percentages: percentages,
      deviations: deviations,
      avgDeviation: avgDeviation,
      quality: avgDeviation < 10 ? 'Good' : avgDeviation < 20 ? 'Acceptable' : 'Poor',
      recommendations: this.getDistributionRecommendations(deviations)
    };
  }

  /**
   * Get distribution recommendations
   * @param {Object} deviations - Distribution deviations
   * @returns {Array} Recommendations
   */
  getDistributionRecommendations(deviations) {
    const recommendations = [];
    
    if (deviations.HIGH > 15) {
      recommendations.push(`HIGH risk percentage deviates by ${deviations.HIGH.toFixed(1)}% from ideal`);
    }
    if (deviations.MEDIUM > 15) {
      recommendations.push(`MEDIUM risk percentage deviates by ${deviations.MEDIUM.toFixed(1)}% from ideal`);
    }
    if (deviations.LOW > 15) {
      recommendations.push(`LOW risk percentage deviates by ${deviations.LOW.toFixed(1)}% from ideal`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Distribution is within acceptable ranges');
    }
    
    return recommendations;
  }

  /**
   * Validate CDC SVI compliance
   * @returns {Promise<Object>} CDC SVI compliance report
   */
  async validateCdcSviCompliance() {
    console.log('🏥 Validating CDC SVI compliance...');
    
    try {
      const mockFireData = { fires: [] };
      const mockWeatherData = { temperature: 85, humidity: 20, windSpeed: 15 };
      
      const predictions = await this.communityImpactService.getPredictionsForAllCounties(
        mockFireData,
        mockWeatherData
      );
      
      // Check if predictions include CDC SVI assessments
      const withCdcSvi = predictions.filter(p => p.cdcSviAssessment);
      
      // Analyze quartile distribution
      const quartileDistribution = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      
      withCdcSvi.forEach(prediction => {
        const quartile = prediction.cdcSviAssessment.quartile.quartile;
        quartileDistribution[quartile]++;
      });
      
      const total = withCdcSvi.length;
      const quartilePercentages = {
        Q1: (quartileDistribution.Q1 / total) * 100,
        Q2: (quartileDistribution.Q2 / total) * 100,
        Q3: (quartileDistribution.Q3 / total) * 100,
        Q4: (quartileDistribution.Q4 / total) * 100
      };
      
      // Expected CDC SVI distribution is roughly 25% per quartile
      const expectedPercentage = 25;
      const deviations = {
        Q1: Math.abs(quartilePercentages.Q1 - expectedPercentage),
        Q2: Math.abs(quartilePercentages.Q2 - expectedPercentage),
        Q3: Math.abs(quartilePercentages.Q3 - expectedPercentage),
        Q4: Math.abs(quartilePercentages.Q4 - expectedPercentage)
      };
      
      const avgDeviation = (deviations.Q1 + deviations.Q2 + deviations.Q3 + deviations.Q4) / 4;
      
      return {
        cdcSviCoverage: (withCdcSvi.length / predictions.length) * 100,
        quartileDistribution: quartileDistribution,
        quartilePercentages: quartilePercentages,
        deviations: deviations,
        avgDeviation: avgDeviation,
        compliance: avgDeviation < 15 ? 'Compliant' : 'Non-compliant',
        recommendations: this.getCdcComplianceRecommendations(deviations, avgDeviation)
      };
      
    } catch (error) {
      console.error('❌ Failed to validate CDC SVI compliance:', error);
      return {
        error: error.message,
        status: 'failed'
      };
    }
  }

  /**
   * Get CDC compliance recommendations
   * @param {Object} deviations - Quartile deviations
   * @param {number} avgDeviation - Average deviation
   * @returns {Array} Recommendations
   */
  getCdcComplianceRecommendations(deviations, avgDeviation) {
    const recommendations = [];
    
    if (avgDeviation >= 15) {
      recommendations.push('Overall quartile distribution deviates significantly from CDC SVI standards');
    }
    
    Object.keys(deviations).forEach(quartile => {
      if (deviations[quartile] > 10) {
        recommendations.push(`${quartile} distribution deviates by ${deviations[quartile].toFixed(1)}%`);
      }
    });
    
    if (recommendations.length === 0) {
      recommendations.push('CDC SVI quartile distribution is within acceptable ranges');
    }
    
    return recommendations;
  }

  /**
   * Calculate performance metrics
   * @returns {Promise<Object>} Performance metrics
   */
  async calculatePerformanceMetrics() {
    console.log('⚡ Calculating performance metrics...');
    
    const startTime = Date.now();
    
    try {
      // Test prediction speed
      const predictionStartTime = Date.now();
      await this.communityImpactService.predictCommunityImpact(
        '06037',
        { fires: [] },
        { temperature: 85, humidity: 20, windSpeed: 15 }
      );
      const predictionTime = Date.now() - predictionStartTime;
      
      // Test batch processing speed
      const batchStartTime = Date.now();
      await this.communityImpactService.getPredictionsForAllCounties(
        { fires: [] },
        { temperature: 85, humidity: 20, windSpeed: 15 }
      );
      const batchTime = Date.now() - batchStartTime;
      
      const totalTime = Date.now() - startTime;
      
      return {
        singlePredictionTime: predictionTime,
        batchProcessingTime: batchTime,
        totalTestTime: totalTime,
        performance: batchTime < 30000 ? 'Good' : batchTime < 60000 ? 'Acceptable' : 'Poor',
        recommendations: this.getPerformanceRecommendations(batchTime)
      };
      
    } catch (error) {
      console.error('❌ Failed to calculate performance metrics:', error);
      return {
        error: error.message,
        status: 'failed'
      };
    }
  }

  /**
   * Get performance recommendations
   * @param {number} batchTime - Batch processing time
   * @returns {Array} Recommendations
   */
  getPerformanceRecommendations(batchTime) {
    const recommendations = [];
    
    if (batchTime > 60000) {
      recommendations.push('Batch processing time exceeds 60 seconds - consider optimization');
    } else if (batchTime > 30000) {
      recommendations.push('Batch processing time exceeds 30 seconds - monitor performance');
    } else {
      recommendations.push('Performance is within acceptable limits');
    }
    
    return recommendations;
  }

  /**
   * Generate comparison report with original system
   * @returns {Object} Comparison report
   */
  generateComparisonReport() {
    return {
      improvements: [
        {
          category: 'Risk Distribution',
          before: 'Skewed - 44 HIGH, 14 MEDIUM, 0 LOW',
          after: 'Balanced - Dynamic percentile-based distribution',
          impact: 'More realistic and actionable risk assessment'
        },
        {
          category: 'Fire Data',
          before: 'Static score (0.533) for all counties',
          after: 'County-specific scores based on historical risk and current activity',
          impact: 'Improved accuracy and geographic relevance'
        },
        {
          category: 'Weather Data',
          before: 'Static score (0.690) for all counties',
          after: 'Regional weather patterns with seasonal adjustment',
          impact: 'Better representation of local fire weather conditions'
        },
        {
          category: 'Thresholds',
          before: 'Fixed thresholds (HIGH: 0.60, MEDIUM: 0.35)',
          after: 'Dynamic percentile-based thresholds',
          impact: 'Adaptive classification based on actual risk distribution'
        },
        {
          category: 'SVI Methodology',
          before: 'Basic vulnerability scoring',
          after: 'CDC SVI quartile methodology with trend analysis',
          impact: 'Standardized, evidence-based vulnerability assessment'
        }
      ],
      
      expectedOutcomes: [
        'More balanced risk distribution across counties',
        'Improved geographic accuracy of risk assessments',
        'Better alignment with CDC SVI standards',
        'Enhanced decision-making support for stakeholders',
        'Reduced false positives in risk classification'
      ]
    };
  }

  /**
   * Generate overall recommendations
   * @param {Object} report - Validation report
   * @returns {Array} Overall recommendations
   */
  generateOverallRecommendations(report) {
    const recommendations = [];
    
    // Test-based recommendations
    if (report.testResults.summary.passRate < 100) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Testing',
        message: 'Address failing tests before deployment'
      });
    }
    
    // Distribution-based recommendations
    if (report.distributionAnalysis.distributionQuality?.quality === 'Poor') {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Distribution',
        message: 'Adjust risk distribution thresholds for better balance'
      });
    }
    
    // CDC SVI compliance recommendations
    if (report.cdcSviCompliance.compliance === 'Non-compliant') {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'CDC SVI',
        message: 'Improve CDC SVI quartile distribution compliance'
      });
    }
    
    // Performance recommendations
    if (report.performanceMetrics.performance === 'Poor') {
      recommendations.push({
        priority: 'LOW',
        category: 'Performance',
        message: 'Optimize batch processing performance'
      });
    }
    
    // Success recommendations
    if (report.testResults.summary.passRate >= 90) {
      recommendations.push({
        priority: 'INFO',
        category: 'Deployment',
        message: 'System is ready for deployment with monitoring'
      });
    }
    
    return recommendations;
  }

  /**
   * Export validation report to file
   * @param {Object} report - Validation report
   * @param {string} filePath - File path for export
   */
  async exportReport(report, filePath) {
    const fs = await import('fs');
    const reportJson = JSON.stringify(report, null, 2);
    
    try {
      await fs.writeFileSync(filePath, reportJson);
      console.log(`📄 Validation report exported to: ${filePath}`);
    } catch (error) {
      console.error('❌ Failed to export report:', error);
    }
  }
}

export default ValidationReportGenerator;