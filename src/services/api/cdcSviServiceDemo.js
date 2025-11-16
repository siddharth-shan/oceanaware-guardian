/**
 * CDC SVI Service Demo
 * 
 * This file demonstrates how to use the CDC Social Vulnerability Index (SVI) service
 * with real examples. You can run this to test the integration.
 */

import { CdcSviService } from './cdcSviService.js';

// Demo function to test CDC SVI service
export async function demoCdcSviService() {
  const sviService = new CdcSviService();
  
  console.log('🔍 Testing CDC Social Vulnerability Index (SVI) Service...\n');
  
  try {
    // Test 1: Get SVI data for Los Angeles County by FIPS code
    console.log('📍 Test 1: Los Angeles County (FIPS: 06037)');
    const laCounty = await sviService.getSviDataByFips('06037');
    console.log('✅ Los Angeles County SVI Data:', laCounty);
    console.log(`   Overall Vulnerability: ${laCounty.overall}/100 (${sviService.getVulnerabilityLevel(laCounty.overall)})`);
    console.log(`   Socioeconomic: ${laCounty.socioeconomic}/100`);
    console.log(`   Population: ${laCounty.population.toLocaleString()}\n`);
    
    // Test 2: Get SVI data by coordinates (Riverside County area - 92880)
    console.log('📍 Test 2: Riverside County by coordinates (33.8803, -117.2073)');
    const riversideData = await sviService.getSviDataByCoordinates(33.8803, -117.2073);
    console.log('✅ Riverside County SVI Data:', riversideData);
    console.log(`   Overall Vulnerability: ${riversideData.overall}/100 (${sviService.getVulnerabilityLevel(riversideData.overall)})`);
    console.log(`   County: ${riversideData.county}, ${riversideData.state}`);
    console.log(`   Population: ${riversideData.population.toLocaleString()}\n`);
    
    // Test 3: Get all California counties (first 5 for demo)
    console.log('📍 Test 3: All California Counties (first 5 for demo)');
    const caCounties = await sviService.getSviDataByState('CA');
    console.log(`✅ Loaded ${caCounties.length} California counties`);
    
    caCounties.slice(0, 5).forEach(county => {
      console.log(`   ${county.county}: ${county.overall}/100 (${sviService.getVulnerabilityLevel(county.overall)})`);
    });
    
    console.log('\n🎉 CDC SVI Service Demo Complete!');
    console.log('💡 Key Benefits:');
    console.log('   ✅ 100% FREE - No API keys required');
    console.log('   ✅ Real CDC data from 2020 (most recent)');
    console.log('   ✅ All California counties included');
    console.log('   ✅ 4 vulnerability themes + overall score');
    console.log('   ✅ Automatic caching for performance');
    
    return {
      success: true,
      laCounty,
      riversideData,
      totalCounties: caCounties.length
    };
    
  } catch (error) {
    console.error('❌ CDC SVI Service Demo Failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Example usage:
// import { demoCdcSviService } from './cdcSviServiceDemo.js';
// demoCdcSviService().then(result => console.log('Demo result:', result));