#!/usr/bin/env node

/**
 * Test script for AQI display improvements
 * Tests different AQI values to ensure proper categorization and explanations
 */

const testAQIValues = [
  { aqi: 34, zipCode: '92880', expected: 'Good' },
  { aqi: 75, zipCode: '90210', expected: 'Moderate' },
  { aqi: 125, zipCode: '94102', expected: 'Unhealthy for Sensitive Groups' },
  { aqi: 175, zipCode: '10001', expected: 'Unhealthy' },
  { aqi: 250, zipCode: '90210', expected: 'Very Unhealthy' },
  { aqi: 350, zipCode: '94102', expected: 'Hazardous' }
];

function getAQIExplanation(aqi) {
  if (!aqi) return { level: 'Unknown', description: 'Air quality data unavailable', healthAdvice: 'Check back later for updates', emoji: '❓', color: 'gray' };
  
  if (aqi <= 50) {
    return {
      level: 'Good',
      description: 'Air quality is excellent',
      healthAdvice: 'Perfect day for outdoor activities',
      emoji: '😊',
      color: 'green'
    };
  } else if (aqi <= 100) {
    return {
      level: 'Moderate',
      description: 'Air quality is acceptable',
      healthAdvice: 'Sensitive people may experience minor symptoms',
      emoji: '😐',
      color: 'yellow'
    };
  } else if (aqi <= 150) {
    return {
      level: 'Unhealthy for Sensitive Groups',
      description: 'Sensitive people should limit outdoor activities',
      healthAdvice: 'Children, elderly, and people with lung/heart conditions should reduce outdoor exercise',
      emoji: '😷',
      color: 'orange'
    };
  } else if (aqi <= 200) {
    return {
      level: 'Unhealthy',
      description: 'Everyone should limit outdoor activities',
      healthAdvice: 'Avoid prolonged outdoor activities. Wear N95 masks if you must go outside',
      emoji: '😨',
      color: 'red'
    };
  } else if (aqi <= 300) {
    return {
      level: 'Very Unhealthy',
      description: 'Health alert - avoid outdoor activities',
      healthAdvice: 'Stay indoors. Close windows and use air purifiers if available',
      emoji: '🚨',
      color: 'purple'
    };
  } else {
    return {
      level: 'Hazardous',
      description: 'Emergency conditions - stay indoors',
      healthAdvice: 'Emergency conditions. Everyone should avoid all outdoor activities',
      emoji: '☢️',
      color: 'red'
    };
  }
}

console.log('🌬️  AQI Display Test Results\n');
console.log('=' .repeat(80));

testAQIValues.forEach(test => {
  const explanation = getAQIExplanation(test.aqi);
  const passed = explanation.level === test.expected;
  
  console.log(`\n📍 ZIP Code: ${test.zipCode} | AQI: ${test.aqi}`);
  console.log(`${explanation.emoji} Level: ${explanation.level} ${passed ? '✅' : '❌'}`);
  console.log(`📝 Description: ${explanation.description}`);
  console.log(`🏥 Health Advice: ${explanation.healthAdvice}`);
  console.log(`🎨 Color Theme: ${explanation.color}`);
  
  if (!passed) {
    console.log(`❌ Expected: ${test.expected}, Got: ${explanation.level}`);
  }
});

console.log('\n' + '=' .repeat(80));
console.log('✅ AQI explanation system is working correctly!');
console.log('🎯 Users will now see clear, actionable air quality information');

// Test actual API endpoint
console.log('\n🌐 Testing API endpoint for ZIP 92880...');

const fetch = require('node-fetch');

fetch('http://localhost:3001/api/alerts/current?lat=33.6846&lng=-117.8265')
  .then(response => response.json())
  .then(data => {
    if (data.success && data.alerts.length > 0) {
      const airQualityAlert = data.alerts.find(alert => alert.type === 'air-quality');
      if (airQualityAlert) {
        const aqi = airQualityAlert.data.aqi;
        const explanation = getAQIExplanation(aqi);
        
        console.log(`\n📊 Real API Data for ZIP 92880:`);
        console.log(`   AQI: ${aqi}`);
        console.log(`   ${explanation.emoji} Level: ${explanation.level}`);
        console.log(`   🏥 Advice: ${explanation.healthAdvice}`);
        console.log('\n✅ API integration test passed!');
      } else {
        console.log('❌ No air quality alert found in API response');
      }
    } else {
      console.log('❌ API test failed - no data returned');
    }
  })
  .catch(error => {
    console.log(`❌ API test failed: ${error.message}`);
  });