/**
 * Comprehensive Test Suite for Risk Classification Improvements
 * 
 * Tests all phases of the long-term improvements to ensure
 * proper functionality and CDC SVI compliance.
 */

import { CommunityImpactService } from '../communityImpactService.js';
import { CountyFireDataService } from '../countyFireDataService.js';
import { RegionalWeatherService } from '../regionalWeatherService.js';
import { DynamicThresholdService } from '../dynamicThresholdService.js';
import { CdcSviQuartileService } from '../cdcSviQuartileService.js';

export class RiskClassificationTests {
  constructor() {
    this.communityImpactService = new CommunityImpactService();
    this.countyFireService = new CountyFireDataService();
    this.regionalWeatherService = new RegionalWeatherService();
    this.dynamicThresholdService = new DynamicThresholdService();
    this.cdcSviQuartileService = new CdcSviQuartileService();
    
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  /**
   * Run all test suites
   * @returns {Promise<Object>} Complete test results
   */
  async runAllTests() {
    console.log('🧪 Starting comprehensive risk classification tests...');
    
    // Test Phase 1: Updated Thresholds
    await this.testUpdatedThresholds();
    
    // Test Phase 2: County-Specific Fire Data
    await this.testCountyFireData();
    
    // Test Phase 3: Regional Weather Data
    await this.testRegionalWeatherData();
    
    // Test Phase 4: Dynamic Thresholds
    await this.testDynamicThresholds();
    
    // Test Phase 5: CDC SVI Quartile Methodology
    await this.testCdcSviQuartiles();
    
    // Test Integration
    await this.testEndToEndIntegration();
    
    // Test Distribution Validation
    await this.testDistributionValidation();
    
    return this.generateTestReport();
  }

  /**
   * Test updated threshold values
   */
  async testUpdatedThresholds() {
    console.log('📊 Testing updated threshold values...');
    
    try {
      const config = this.communityImpactService.modelConfig;
      
      // Test 1: Threshold values are updated
      this.assert(
        config.classificationLevels.HIGH.threshold === 0.69,
        'HIGH threshold updated to 0.69',
        `Expected 0.69, got ${config.classificationLevels.HIGH.threshold}`
      );
      
      this.assert(
        config.classificationLevels.MEDIUM.threshold === 0.66,
        'MEDIUM threshold updated to 0.66',
        `Expected 0.66, got ${config.classificationLevels.MEDIUM.threshold}`
      );
      
      // Test 2: Threshold ordering is correct
      this.assert(
        config.classificationLevels.HIGH.threshold >= config.classificationLevels.MEDIUM.threshold,
        'HIGH threshold >= MEDIUM threshold',
        'Threshold ordering is incorrect'
      );
      
      console.log('✅ Updated thresholds test passed');
      
    } catch (error) {
      console.error('❌ Updated thresholds test failed:', error);
      this.recordFailure('Updated Thresholds', error.message);
    }
  }

  /**
   * Test county-specific fire data
   */
  async testCountyFireData() {
    console.log('🔥 Testing county-specific fire data...');
    
    try {
      // Test 1: Different counties get different fire scores
      const laScore = await this.countyFireService.getCountyFireScore('06037', null); // LA
      const sfScore = await this.countyFireService.getCountyFireScore('06075', null); // SF
      const sacScore = await this.countyFireService.getCountyFireScore('06067', null); // Sacramento
      
      this.assert(
        laScore !== sfScore || sfScore !== sacScore,
        'Counties have different fire scores',
        `LA: ${laScore}, SF: ${sfScore}, SAC: ${sacScore}`
      );
      
      // Test 2: Fire scores are within valid range
      [laScore, sfScore, sacScore].forEach((score, index) => {
        const counties = ['LA', 'SF', 'SAC'];
        this.assert(
          score >= 0 && score <= 1,
          `${counties[index]} fire score in valid range`,
          `Score ${score} out of range [0,1]`
        );
      });
      
      // Test 3: High fire risk counties have higher scores
      const kernScore = await this.countyFireService.getCountyFireScore('06029', null); // Kern (high risk)
      const alamedaScore = await this.countyFireService.getCountyFireScore('06001', null); // Alameda (lower risk)
      
      this.assert(
        kernScore > alamedaScore,
        'High fire risk counties have higher scores',
        `Kern: ${kernScore}, Alameda: ${alamedaScore}`
      );
      
      console.log('✅ County-specific fire data test passed');
      
    } catch (error) {
      console.error('❌ County-specific fire data test failed:', error);
      this.recordFailure('County Fire Data', error.message);
    }
  }

  /**
   * Test regional weather data
   */
  async testRegionalWeatherData() {
    console.log('🌤️ Testing regional weather data...');
    
    try {
      // Test 1: Different regions get different weather scores
      const desertScore = await this.regionalWeatherService.getCountyWeatherScore('06025', null); // Imperial (Desert)
      const coastalScore = await this.regionalWeatherService.getCountyWeatherScore('06053', null); // Monterey (Coastal)
      const bayAreaScore = await this.regionalWeatherService.getCountyWeatherScore('06075', null); // SF (Bay Area)
      
      this.assert(
        desertScore !== coastalScore || coastalScore !== bayAreaScore,
        'Different regions have different weather scores',
        `Desert: ${desertScore}, Coastal: ${coastalScore}, Bay: ${bayAreaScore}`
      );
      
      // Test 2: Weather scores are within valid range
      [desertScore, coastalScore, bayAreaScore].forEach((score, index) => {
        const regions = ['Desert', 'Coastal', 'Bay Area'];
        this.assert(
          score >= 0 && score <= 1,
          `${regions[index]} weather score in valid range`,
          `Score ${score} out of range [0,1]`
        );
      });
      
      // Test 3: Desert regions have higher weather risk
      this.assert(
        desertScore > coastalScore,
        'Desert regions have higher weather risk than coastal',
        `Desert: ${desertScore}, Coastal: ${coastalScore}`
      );
      
      console.log('✅ Regional weather data test passed');
      
    } catch (error) {
      console.error('❌ Regional weather data test failed:', error);
      this.recordFailure('Regional Weather Data', error.message);
    }
  }

  /**
   * Test dynamic threshold calculation
   */
  async testDynamicThresholds() {
    console.log('🎯 Testing dynamic threshold calculation...');
    
    try {
      // Test 1: Dynamic thresholds are calculated correctly
      const mockRiskScores = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
      const thresholds = this.dynamicThresholdService.calculateDynamicThresholds(mockRiskScores);
      
      this.assert(
        thresholds.thresholds.HIGH.threshold > thresholds.thresholds.MEDIUM.threshold,
        'Dynamic HIGH threshold > MEDIUM threshold',
        `HIGH: ${thresholds.thresholds.HIGH.threshold}, MEDIUM: ${thresholds.thresholds.MEDIUM.threshold}`
      );
      
      // Test 2: Percentile calculation is correct
      const p75 = this.dynamicThresholdService.calculatePercentile(mockRiskScores, 0.75);
      const p50 = this.dynamicThresholdService.calculatePercentile(mockRiskScores, 0.50);
      
      this.assert(
        p75 > p50,
        '75th percentile > 50th percentile',
        `75th: ${p75}, 50th: ${p50}`
      );
      
      // Test 3: Statistics are calculated
      this.assert(
        thresholds.statistics && thresholds.statistics.mean,
        'Statistics are calculated',
        'Statistics object missing or incomplete'
      );
      
      console.log('✅ Dynamic thresholds test passed');
      
    } catch (error) {
      console.error('❌ Dynamic thresholds test failed:', error);
      this.recordFailure('Dynamic Thresholds', error.message);
    }
  }

  /**
   * Test CDC SVI quartile methodology
   */
  async testCdcSviQuartiles() {
    console.log('🏥 Testing CDC SVI quartile methodology...');
    
    try {
      // Test 1: Quartile calculation is correct
      const q1 = this.cdcSviQuartileService.calculateQuartile(0.2);
      const q2 = this.cdcSviQuartileService.calculateQuartile(0.4);
      const q3 = this.cdcSviQuartileService.calculateQuartile(0.6);
      const q4 = this.cdcSviQuartileService.calculateQuartile(0.8);
      
      this.assert(
        q1.quartile === 'Q1' && q2.quartile === 'Q2' && q3.quartile === 'Q3' && q4.quartile === 'Q4',
        'Quartile assignments are correct',
        `Q1: ${q1.quartile}, Q2: ${q2.quartile}, Q3: ${q3.quartile}, Q4: ${q4.quartile}`
      );
      
      // Test 2: Risk mapping is correct
      this.assert(
        this.cdcSviQuartileService.sviRiskMapping.Q1 === 'LOW',
        'Q1 maps to LOW risk',
        `Q1 mapped to ${this.cdcSviQuartileService.sviRiskMapping.Q1}`
      );
      
      this.assert(
        this.cdcSviQuartileService.sviRiskMapping.Q4 === 'HIGH',
        'Q4 maps to HIGH risk',
        `Q4 mapped to ${this.cdcSviQuartileService.sviRiskMapping.Q4}`
      );
      
      // Test 3: Enhanced vulnerability calculation
      const mockSviData = {
        yearlyData: [{
          overall: 75,
          socioeconomic: 70,
          householdComposition: 80,
          minorityLanguage: 60,
          housingTransportation: 85
        }]
      };
      
      const mockTrends = {
        trendAnalysis: {
          riskDirection: 'worsening',
          recentTrend: 'increasing',
          overallTrend: 'increasing'
        }
      };
      
      const assessment = this.cdcSviQuartileService.calculateEnhancedVulnerabilityScore(mockSviData, mockTrends);
      
      this.assert(
        assessment.adjustedVulnerability > assessment.baseVulnerability,
        'Worsening trends increase vulnerability',
        `Base: ${assessment.baseVulnerability}, Adjusted: ${assessment.adjustedVulnerability}`
      );
      
      console.log('✅ CDC SVI quartile methodology test passed');
      
    } catch (error) {
      console.error('❌ CDC SVI quartile methodology test failed:', error);
      this.recordFailure('CDC SVI Quartiles', error.message);
    }
  }

  /**
   * Test end-to-end integration
   */
  async testEndToEndIntegration() {
    console.log('🔄 Testing end-to-end integration...');
    
    try {
      // Test 1: Complete prediction workflow
      const mockFireData = { fires: [] };
      const mockWeatherData = { temperature: 85, humidity: 20, windSpeed: 15 };
      
      const prediction = await this.communityImpactService.predictCommunityImpact(
        '06037', // Los Angeles
        mockFireData,
        mockWeatherData
      );
      
      this.assert(
        prediction && prediction.riskScore !== undefined,
        'End-to-end prediction works',
        'Prediction failed or missing risk score'
      );
      
      // Test 2: CDC SVI assessment is included
      this.assert(
        prediction.cdcSviAssessment && prediction.cdcSviAssessment.quartile,
        'CDC SVI assessment is included',
        'CDC SVI assessment missing from prediction'
      );
      
      // Test 3: All required fields are present
      const requiredFields = ['fips', 'county', 'riskScore', 'riskLevel', 'confidence', 'features', 'trends'];
      
      requiredFields.forEach(field => {
        this.assert(
          prediction[field] !== undefined,
          `Required field ${field} is present`,
          `Missing required field: ${field}`
        );
      });
      
      console.log('✅ End-to-end integration test passed');
      
    } catch (error) {
      console.error('❌ End-to-end integration test failed:', error);
      this.recordFailure('End-to-End Integration', error.message);
    }
  }

  /**
   * Test distribution validation
   */
  async testDistributionValidation() {
    console.log('📈 Testing distribution validation...');
    
    try {
      // Test with mock data to ensure distribution is reasonable
      const mockFireData = { fires: [] };
      const mockWeatherData = { temperature: 85, humidity: 20, windSpeed: 15 };
      
      // Get predictions for a sample of counties
      const testCounties = ['06037', '06075', '06067', '06001', '06029', '06059', '06073', '06085'];
      const predictions = [];
      
      for (const fips of testCounties) {
        try {
          const prediction = await this.communityImpactService.predictCommunityImpact(
            fips,
            mockFireData,
            mockWeatherData
          );
          predictions.push(prediction);
        } catch (error) {
          console.warn(`Skipping ${fips}: ${error.message}`);
        }
      }
      
      // Test 1: We have some predictions
      this.assert(
        predictions.length > 0,
        'Generated predictions for test counties',
        `Only ${predictions.length} predictions generated`
      );
      
      // Test 2: Distribution includes different risk levels
      const riskLevels = predictions.map(p => p.riskLevel.level);
      const uniqueLevels = [...new Set(riskLevels)];
      
      this.assert(
        uniqueLevels.length > 1,
        'Distribution includes multiple risk levels',
        `Only ${uniqueLevels.length} unique risk levels: ${uniqueLevels.join(', ')}`
      );
      
      // Test 3: Risk scores vary appropriately
      const riskScores = predictions.map(p => p.riskScore);
      const scoreRange = Math.max(...riskScores) - Math.min(...riskScores);
      
      this.assert(
        scoreRange > 0.1,
        'Risk scores have reasonable variation',
        `Score range: ${scoreRange.toFixed(3)}`
      );
      
      console.log('✅ Distribution validation test passed');
      
    } catch (error) {
      console.error('❌ Distribution validation test failed:', error);
      this.recordFailure('Distribution Validation', error.message);
    }
  }

  /**
   * Assert helper function
   * @param {boolean} condition - Condition to test
   * @param {string} testName - Name of the test
   * @param {string} errorMessage - Error message if test fails
   */
  assert(condition, testName, errorMessage) {
    this.testResults.total++;
    
    if (condition) {
      this.testResults.passed++;
      this.testResults.details.push({
        status: 'PASS',
        test: testName,
        message: 'Test passed'
      });
    } else {
      this.testResults.failed++;
      this.testResults.details.push({
        status: 'FAIL',
        test: testName,
        message: errorMessage
      });
    }
  }

  /**
   * Record test failure
   * @param {string} testSuite - Test suite name
   * @param {string} error - Error message
   */
  recordFailure(testSuite, error) {
    this.testResults.total++;
    this.testResults.failed++;
    this.testResults.details.push({
      status: 'FAIL',
      test: testSuite,
      message: error
    });
  }

  /**
   * Generate comprehensive test report
   * @returns {Object} Test report
   */
  generateTestReport() {
    const passRate = (this.testResults.passed / this.testResults.total) * 100;
    
    const report = {
      summary: {
        totalTests: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        passRate: passRate.toFixed(1) + '%',
        status: this.testResults.failed === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'
      },
      details: this.testResults.details,
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };
    
    console.log('\n📋 Test Report Summary:');
    console.log(`✅ Passed: ${this.testResults.passed}/${this.testResults.total}`);
    console.log(`❌ Failed: ${this.testResults.failed}/${this.testResults.total}`);
    console.log(`📊 Pass Rate: ${passRate.toFixed(1)}%`);
    console.log(`🎯 Status: ${report.summary.status}`);
    
    return report;
  }

  /**
   * Generate recommendations based on test results
   * @returns {Array} Recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.testResults.failed === 0) {
      recommendations.push({
        priority: 'info',
        message: 'All tests passed! The risk classification system is ready for deployment.'
      });
    } else {
      recommendations.push({
        priority: 'high',
        message: `${this.testResults.failed} test(s) failed. Review failed tests before deployment.`
      });
      
      // Specific recommendations based on failed tests
      const failedTests = this.testResults.details.filter(d => d.status === 'FAIL');
      
      failedTests.forEach(test => {
        recommendations.push({
          priority: 'medium',
          test: test.test,
          message: `Fix issue: ${test.message}`
        });
      });
    }
    
    return recommendations;
  }
}

export default RiskClassificationTests;