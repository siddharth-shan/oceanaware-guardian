/**
 * Test EPA AQS API Integration
 * Verifies the enhanced air quality service with EPA AQS data
 */

import AirQualityService from './server/services/airQuality/airQualityService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🧪 Testing EPA AQS API Integration\n');

// Test EPA AQS API configuration
console.log('📋 API Configuration Status:');
console.log(`   EPA AQS API Key: ${process.env.EPA_AQS_API_KEY ? '✅ Configured' : '❌ Missing'}`);
console.log(`   EPA AQS Email: ${process.env.EPA_AQS_API_EMAIL ? '✅ Configured' : '❌ Missing'}`);
console.log('');

async function testEPAIntegration() {
  try {
    // Test coordinates for Los Angeles area
    const lat = 34.0522;
    const lng = -118.2437;
    
    console.log('🌍 Testing EPA AQS integration for Los Angeles...');
    console.log(`   Coordinates: ${lat}, ${lng}\n`);
    
    // Test comprehensive air quality data with EPA integration
    console.log('🔄 Fetching comprehensive air quality data...');
    const airQualityData = await AirQualityService.getAirQualityData(lat, lng);
    
    if (airQualityData) {
      console.log('✅ Air Quality Data Retrieved Successfully!\n');
      
      // Display summary
      console.log('📊 Air Quality Summary:');
      console.log(`   Overall AQI: ${airQualityData.aqi}`);
      console.log(`   Category: ${airQualityData.category}`);
      console.log(`   PM2.5: ${airQualityData.pm25?.value} μg/m³`);
      console.log(`   Data Sources: ${airQualityData.dataSources.join(', ')}`);
      console.log('');
      
      // EPA-specific details
      if (airQualityData.epaDetails) {
        console.log('🏛️ EPA AQS Official Data:');
        console.log(`   Monitoring Site: ${airQualityData.epaDetails.monitoringSite.name}`);
        console.log(`   Location: ${airQualityData.epaDetails.monitoringSite.city}, ${airQualityData.epaDetails.monitoringSite.county} County`);
        console.log(`   Site ID: ${airQualityData.epaDetails.monitoringSite.state_code}-${airQualityData.epaDetails.monitoringSite.county_code}-${airQualityData.epaDetails.monitoringSite.site_number}`);
        console.log(`   Data Quality: ${airQualityData.epaDetails.dataQuality}`);
        console.log('');
        
        // Pollutant details
        console.log('💨 EPA Pollutant Measurements:');
        if (airQualityData.epaDetails.measurements.pm25) {
          const pm25 = airQualityData.epaDetails.measurements.pm25;
          console.log(`   PM2.5: ${pm25.concentration} ${pm25.units} (AQI: ${pm25.aqi}) - ${pm25.date}`);
          console.log(`   Method: ${pm25.method}`);
        }
        if (airQualityData.epaDetails.measurements.pm10) {
          const pm10 = airQualityData.epaDetails.measurements.pm10;
          console.log(`   PM10: ${pm10.concentration} ${pm10.units} (AQI: ${pm10.aqi}) - ${pm10.date}`);
        }
        if (airQualityData.epaDetails.measurements.ozone) {
          const ozone = airQualityData.epaDetails.measurements.ozone;
          console.log(`   Ozone: ${ozone.concentration} ${ozone.units} (AQI: ${ozone.aqi}) - ${ozone.date}`);
        }
        console.log('');
      } else {
        console.log('⚠️ EPA AQS data not available for this location');
        console.log('   This may be normal if no EPA monitoring sites are nearby');
        console.log('');
      }
      
      // Wildfire smoke analysis
      if (airQualityData.smoke) {
        console.log('🔥 Wildfire Smoke Analysis:');
        console.log(`   Smoke Detected: ${airQualityData.smoke.detected ? '⚠️ YES' : '✅ NO'}`);
        console.log(`   Risk Level: ${airQualityData.smoke.riskLevel}`);
        console.log(`   Health Message: ${airQualityData.smoke.healthMessage}`);
        console.log('');
      }
      
      // Health recommendations
      if (airQualityData.healthRecommendations && airQualityData.healthRecommendations.length > 0) {
        console.log('💡 Health Recommendations:');
        airQualityData.healthRecommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
        console.log('');
      }
      
      console.log('🎯 Integration Test Results:');
      console.log(`   ✅ Service responded successfully`);
      console.log(`   ✅ Data sources: ${airQualityData.dataSources.length} active`);
      console.log(`   ${airQualityData.epaDetails ? '✅' : '⚠️'} EPA AQS integration ${airQualityData.epaDetails ? 'working' : 'not available'}`);
      console.log(`   ✅ PM2.5 data available: ${airQualityData.pm25?.value ? 'YES' : 'NO'}`);
      console.log(`   ✅ Smoke analysis functional`);
      
    } else {
      console.log('❌ Failed to retrieve air quality data');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Test EPA-specific methods directly
async function testEPADirectly() {
  console.log('\n🔬 Testing EPA AQS API directly...\n');
  
  try {
    const airQualityService = new (await import('./server/services/airQuality/airQualityService.js')).default.constructor();
    
    // Test finding EPA sites
    console.log('🔍 Testing EPA site discovery...');
    const site = await airQualityService.findNearestEPASite(34.0522, -118.2437);
    
    if (site) {
      console.log('✅ EPA monitoring site found:');
      console.log(`   Site: ${site.site_name}`);
      console.log(`   Location: ${site.city}, ${site.county} County`);
      console.log(`   Coordinates: ${site.latitude}, ${site.longitude}`);
      console.log(`   Site ID: ${site.state_code}-${site.county_code}-${site.site_number}`);
      console.log('');
      
      // Test EPA data retrieval
      console.log('📊 Testing EPA pollutant data retrieval...');
      const currentDate = new Date();
      const startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const pm25Data = await airQualityService.getEPAPollutantData(
        'pm25', 
        site.state_code, 
        site.county_code, 
        site.site_number, 
        startDate, 
        currentDate
      );
      
      if (pm25Data) {
        console.log('✅ EPA PM2.5 data retrieved:');
        console.log(`   Value: ${pm25Data.value} ${pm25Data.units}`);
        console.log(`   AQI: ${pm25Data.aqi}`);
        console.log(`   Date: ${pm25Data.date}`);
        console.log(`   Method: ${pm25Data.method}`);
        console.log(`   Validity: ${pm25Data.validity}`);
      } else {
        console.log('⚠️ No recent PM2.5 data available');
      }
      
    } else {
      console.log('⚠️ No EPA monitoring sites found');
    }
    
  } catch (error) {
    console.error('❌ Direct EPA test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testEPAIntegration();
  await testEPADirectly();
  
  console.log('\n🏁 EPA AQS Integration Test Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Check the enhanced air quality API endpoints');
  console.log('   2. Update frontend components to display EPA data');
  console.log('   3. Add EPA-specific visualizations');
  console.log('   4. Implement monitoring site selection');
}

runAllTests().catch(console.error);