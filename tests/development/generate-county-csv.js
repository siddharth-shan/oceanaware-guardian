/**
 * Generate detailed CSV file with all county validation data
 */

import { CommunityImpactService } from './src/services/api/communityImpactService.js';
import fs from 'fs';

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

async function generateCountyCSV() {
  try {
    console.log('📊 Generating detailed county validation CSV...');
    
    const communityService = new CommunityImpactService();
    const predictions = await communityService.getPredictionsForAllCounties(mockFireData, mockWeatherData);
    
    // CSV header
    const csvHeader = [
      'County Name',
      'FIPS Code',
      'Population',
      'SVI 2022',
      'SVI 2020', 
      'SVI 2018',
      'Trend Direction',
      'Trend Slope',
      'Average Vulnerability',
      'Fire Activity Score',
      'Weather Score',
      'Vulnerability Score',
      'Fire Contribution',
      'Weather Contribution',
      'Vulnerability Contribution',
      'Final Risk Score',
      'Risk Level',
      'Risk Priority',
      'Confidence Level',
      'Community Risk Index'
    ].join(',');
    
    // CSV data rows
    const csvRows = predictions.map(p => {
      const yearlyData = p.trends.yearlyData;
      const svi2022 = yearlyData.find(d => d.year === 2022)?.overall || 'N/A';
      const svi2020 = yearlyData.find(d => d.year === 2020)?.overall || 'N/A';
      const svi2018 = yearlyData.find(d => d.year === 2018)?.overall || 'N/A';
      
      return [
        `"${p.county}"`,
        p.fips,
        p.population,
        svi2022,
        svi2020,
        svi2018,
        p.trends.trendAnalysis.riskDirection,
        p.trends.trendAnalysis.trendSlope.toFixed(2),
        p.trends.trendAnalysis.averageVulnerability.toFixed(1),
        p.features.fireActivity.score.toFixed(3),
        p.features.weather.score.toFixed(3),
        p.features.vulnerability.score.toFixed(3),
        p.features.fireActivity.contribution.toFixed(3),
        p.features.weather.contribution.toFixed(3),
        p.features.vulnerability.contribution.toFixed(3),
        p.riskScore.toFixed(3),
        p.riskLevel.level,
        p.riskLevel.priority,
        (p.confidence * 100).toFixed(1) + '%',
        p.communityRiskIndex
      ].join(',');
    });
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Write to file
    fs.writeFileSync('/Users/work/projects/ecoquest/app/ecoquest-wildfire-watch/california-counties-validation-data.csv', csvContent);
    
    console.log('✅ CSV file generated: california-counties-validation-data.csv');
    console.log(`📊 Includes data for ${predictions.length} counties`);
    
  } catch (error) {
    console.error('❌ CSV generation failed:', error);
  }
}

generateCountyCSV();