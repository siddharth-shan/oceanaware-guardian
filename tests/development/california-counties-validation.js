/**
 * California Counties Risk Validation Analysis
 * 
 * This script generates a comprehensive validation table for all 58 California counties
 * with their calculated risk data from the Community Impact Service.
 */

import { CommunityImpactService } from './src/services/api/communityImpactService.js';
import { MultiYearSviService } from './src/services/api/multiYearSviService.js';

// Mock fire and weather data for consistent testing
const mockFireData = {
  fires: [
    { confidence: 75, distance: 30, severity: 'medium' },
    { confidence: 60, distance: 45, severity: 'low' },
    { confidence: 85, distance: 20, severity: 'high' }
  ]
};

const mockWeatherData = {
  temperature: 85,
  humidity: 25,
  windSpeed: 12,
  fireWeatherIndex: 'HIGH'
};

async function generateValidationReport() {
  console.log('🔍 Starting California Counties Risk Validation Analysis...\n');
  
  try {
    // Initialize services
    const communityService = new CommunityImpactService();
    const sviService = new MultiYearSviService();
    
    // Get all county predictions
    console.log('📊 Fetching predictions for all California counties...');
    const predictions = await communityService.getPredictionsForAllCounties(mockFireData, mockWeatherData);
    
    console.log(`✅ Generated predictions for ${predictions.length} counties\n`);
    
    // Generate comprehensive validation table
    console.log('📋 COMPREHENSIVE CALIFORNIA COUNTIES RISK VALIDATION TABLE');
    console.log('=' .repeat(120));
    console.log('County Name'.padEnd(20) + 
                'FIPS'.padEnd(8) + 
                'Pop'.padEnd(8) + 
                'Vuln2022'.padEnd(10) + 
                'Trend'.padEnd(12) + 
                'Slope'.padEnd(8) + 
                'Fire'.padEnd(8) + 
                'Weather'.padEnd(8) + 
                'Final'.padEnd(8) + 
                'Risk'.padEnd(8) + 
                'Confidence'.padEnd(12));
    console.log('-' .repeat(120));
    
    // Risk distribution counters
    const riskDistribution = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    const confidenceSum = { total: 0, count: 0 };
    const riskScores = [];
    
    // Process each county
    for (const prediction of predictions) {
      const county = prediction.county.length > 18 ? 
        prediction.county.substring(0, 15) + '...' : 
        prediction.county;
      
      const population = prediction.population > 999999 ? 
        Math.round(prediction.population / 1000000) + 'M' : 
        prediction.population > 999 ? 
        Math.round(prediction.population / 1000) + 'K' : 
        prediction.population.toString();
      
      const latestVuln = prediction.trends.yearlyData.length > 0 ? 
        prediction.trends.yearlyData[prediction.trends.yearlyData.length - 1].overall : 
        'N/A';
      
      const trendDirection = prediction.trends.trendAnalysis.riskDirection;
      const trendSlope = prediction.trends.trendAnalysis.trendSlope.toFixed(2);
      
      const fireScore = prediction.features.fireActivity.score.toFixed(2);
      const weatherScore = prediction.features.weather.score.toFixed(2);
      const finalScore = prediction.riskScore.toFixed(2);
      const riskLevel = prediction.riskLevel.level;
      const confidence = Math.round(prediction.confidence * 100) + '%';
      
      console.log(county.padEnd(20) + 
                  prediction.fips.padEnd(8) + 
                  population.padEnd(8) + 
                  latestVuln.toString().padEnd(10) + 
                  trendDirection.padEnd(12) + 
                  trendSlope.padEnd(8) + 
                  fireScore.padEnd(8) + 
                  weatherScore.padEnd(8) + 
                  finalScore.padEnd(8) + 
                  riskLevel.padEnd(8) + 
                  confidence.padEnd(12));
      
      // Update statistics
      riskDistribution[riskLevel]++;
      confidenceSum.total += prediction.confidence;
      confidenceSum.count++;
      riskScores.push(prediction.riskScore);
    }
    
    console.log('=' .repeat(120));
    
    // Risk Distribution Analysis
    console.log('\n📊 RISK DISTRIBUTION ANALYSIS');
    console.log('=' .repeat(50));
    console.log(`HIGH Risk Counties:   ${riskDistribution.HIGH} (${(riskDistribution.HIGH / predictions.length * 100).toFixed(1)}%)`);
    console.log(`MEDIUM Risk Counties: ${riskDistribution.MEDIUM} (${(riskDistribution.MEDIUM / predictions.length * 100).toFixed(1)}%)`);
    console.log(`LOW Risk Counties:    ${riskDistribution.LOW} (${(riskDistribution.LOW / predictions.length * 100).toFixed(1)}%)`);
    console.log(`Total Counties:       ${predictions.length}`);
    
    // Statistical Analysis
    console.log('\n📈 STATISTICAL ANALYSIS');
    console.log('=' .repeat(50));
    const avgRiskScore = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
    const avgConfidence = confidenceSum.total / confidenceSum.count;
    const minRiskScore = Math.min(...riskScores);
    const maxRiskScore = Math.max(...riskScores);
    const medianRiskScore = riskScores.sort((a, b) => a - b)[Math.floor(riskScores.length / 2)];
    
    console.log(`Average Risk Score:    ${avgRiskScore.toFixed(3)}`);
    console.log(`Median Risk Score:     ${medianRiskScore.toFixed(3)}`);
    console.log(`Min Risk Score:        ${minRiskScore.toFixed(3)}`);
    console.log(`Max Risk Score:        ${maxRiskScore.toFixed(3)}`);
    console.log(`Average Confidence:    ${(avgConfidence * 100).toFixed(1)}%`);
    
    // Threshold Analysis
    console.log('\n🎯 CURRENT RISK THRESHOLDS');
    console.log('=' .repeat(50));
    const thresholds = communityService.modelConfig.classificationLevels;
    console.log(`HIGH Risk:    >= ${thresholds.HIGH.threshold} (${thresholds.HIGH.threshold * 100}%)`);
    console.log(`MEDIUM Risk:  >= ${thresholds.MEDIUM.threshold} (${thresholds.MEDIUM.threshold * 100}%)`);
    console.log(`LOW Risk:     >= ${thresholds.LOW.threshold} (${thresholds.LOW.threshold * 100}%)`);
    
    // Analysis of why 54 counties are medium risk
    console.log('\n🔍 ANALYSIS: Why 54 Counties Show Medium Risk');
    console.log('=' .repeat(50));
    
    const mediumRiskCounties = predictions.filter(p => p.riskLevel.level === 'MEDIUM');
    const mediumRiskScores = mediumRiskCounties.map(p => p.riskScore);
    const mediumAvg = mediumRiskScores.reduce((a, b) => a + b, 0) / mediumRiskScores.length;
    
    console.log(`Medium Risk Counties: ${mediumRiskCounties.length}`);
    console.log(`Medium Risk Score Range: ${Math.min(...mediumRiskScores).toFixed(3)} - ${Math.max(...mediumRiskScores).toFixed(3)}`);
    console.log(`Medium Risk Average: ${mediumAvg.toFixed(3)}`);
    
    // Feature contribution analysis for medium risk counties
    console.log('\n📊 FEATURE CONTRIBUTION ANALYSIS (Medium Risk Counties)');
    console.log('=' .repeat(50));
    
    const avgFireContrib = mediumRiskCounties.reduce((sum, p) => sum + p.features.fireActivity.contribution, 0) / mediumRiskCounties.length;
    const avgWeatherContrib = mediumRiskCounties.reduce((sum, p) => sum + p.features.weather.contribution, 0) / mediumRiskCounties.length;
    const avgVulnContrib = mediumRiskCounties.reduce((sum, p) => sum + p.features.vulnerability.contribution, 0) / mediumRiskCounties.length;
    
    console.log(`Average Fire Activity Contribution:     ${avgFireContrib.toFixed(3)} (${(avgFireContrib * 100).toFixed(1)}%)`);
    console.log(`Average Weather Contribution:           ${avgWeatherContrib.toFixed(3)} (${(avgWeatherContrib * 100).toFixed(1)}%)`);
    console.log(`Average Vulnerability Contribution:     ${avgVulnContrib.toFixed(3)} (${(avgVulnContrib * 100).toFixed(1)}%)`);
    
    // SVI Methodology Comparison
    console.log('\n📚 SVI METHODOLOGY COMPARISON');
    console.log('=' .repeat(50));
    console.log('Current Implementation Issues:');
    console.log('1. Risk thresholds may be too narrow (HIGH >= 0.60, MEDIUM >= 0.35)');
    console.log('2. Limited fire data variation creates artificial clustering');
    console.log('3. Weather data is static across all counties');
    console.log('4. SVI percentile rankings should be used instead of raw scores');
    console.log('5. Risk distribution should follow CDC SVI quartile methodology');
    
    console.log('\nRecommended SVI-Based Thresholds:');
    console.log('- HIGH Risk:    >= 75th percentile (top 25%)');
    console.log('- MEDIUM Risk:  >= 50th percentile (middle 50%)');
    console.log('- LOW Risk:     < 50th percentile (bottom 50%)');
    
    // Calculate percentile-based thresholds
    const sortedScores = [...riskScores].sort((a, b) => a - b);
    const p25 = sortedScores[Math.floor(sortedScores.length * 0.25)];
    const p50 = sortedScores[Math.floor(sortedScores.length * 0.50)];
    const p75 = sortedScores[Math.floor(sortedScores.length * 0.75)];
    
    console.log('\nData-Driven Percentile Thresholds:');
    console.log(`25th percentile: ${p25.toFixed(3)}`);
    console.log(`50th percentile: ${p50.toFixed(3)}`);
    console.log(`75th percentile: ${p75.toFixed(3)}`);
    
    // Simulate better distribution with percentile thresholds
    let highCount = 0, mediumCount = 0, lowCount = 0;
    for (const score of riskScores) {
      if (score >= p75) highCount++;
      else if (score >= p50) mediumCount++;
      else lowCount++;
    }
    
    console.log('\nWith Percentile-Based Thresholds:');
    console.log(`HIGH Risk:    ${highCount} counties (${(highCount / predictions.length * 100).toFixed(1)}%)`);
    console.log(`MEDIUM Risk:  ${mediumCount} counties (${(mediumCount / predictions.length * 100).toFixed(1)}%)`);
    console.log(`LOW Risk:     ${lowCount} counties (${(lowCount / predictions.length * 100).toFixed(1)}%)`);
    
    console.log('\n✅ Validation analysis complete.');
    console.log('📄 Full results saved to console output above.');
    
  } catch (error) {
    console.error('❌ Validation analysis failed:', error);
    throw error;
  }
}

// Run the analysis
generateValidationReport().catch(console.error);