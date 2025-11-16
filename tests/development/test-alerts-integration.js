#!/usr/bin/env node
/**
 * Test the alerts integration with improved data sources and real data
 */

async function testAlertsIntegration() {
  console.log('🚨 Testing Alerts Integration');
  console.log('==============================\n');
  
  try {
    // Test the alerts API endpoint
    const testCoords = {
      lat: 34.2656,   // Simi Valley, ZIP 93065
      lng: -118.7653
    };
    
    console.log(`📍 Testing alerts for location: ${testCoords.lat}, ${testCoords.lng}\n`);
    
    // Make request to the alerts API
    const apiUrl = `http://localhost:3001/api/alerts/current?lat=${testCoords.lat}&lng=${testCoords.lng}`;
    console.log(`🔗 API URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ API Error: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n🎯 ALERTS DATA RESULTS:');
    console.log('=======================');
    console.log(`✅ Success: ${data.success}`);
    console.log(`🚨 Alerts Found: ${data.alerts?.length || 0}`);
    console.log(`⏰ Timestamp: ${data.metadata?.timestamp}`);
    console.log(`📊 Has Real Data: ${data.metadata?.hasRealData ? 'Yes' : 'No'}`);
    
    if (data.metadata?.sources && data.metadata.sources.length > 0) {
      console.log('\n📊 DATA SOURCES:');
      console.log('================');
      data.metadata.sources.forEach((source, i) => {
        console.log(`${i + 1}. ${source}`);
      });
      
      if (data.metadata.fireDataSource) {
        console.log(`\n🔥 Fire Data Source: ${data.metadata.fireDataSource}`);
        if (data.metadata.fireApiEndpoint) {
          console.log(`🌐 Fire API: ${data.metadata.fireApiEndpoint}`);
        }
      }
    }
    
    if (data.alerts && data.alerts.length > 0) {
      console.log('\n🚨 DETECTED ALERTS:');
      console.log('==================');
      
      // Group alerts by type
      const alertsByType = data.alerts.reduce((acc, alert) => {
        if (!acc[alert.type]) acc[alert.type] = [];
        acc[alert.type].push(alert);
        return acc;
      }, {});
      
      Object.entries(alertsByType).forEach(([type, alerts]) => {
        console.log(`\n🏷️  ${type.toUpperCase()} ALERTS (${alerts.length}):`);
        alerts.forEach((alert, i) => {
          console.log(`  ${i + 1}. "${alert.title}"`);
          console.log(`     📋 Message: ${alert.message}`);
          console.log(`     🎯 Severity: ${alert.severity}`);
          console.log(`     📅 Time: ${new Date(alert.timestamp).toLocaleString()}`);
          
          // Show data source if available
          if (alert.data?.source) {
            console.log(`     📊 Source: ${alert.data.source}`);
          }
          
          // Show specific data based on alert type
          if (alert.type === 'air-quality' && alert.data) {
            console.log(`     💨 AQI: ${alert.data.aqi} (${alert.data.category})`);
            console.log(`     🔬 PM2.5: ${alert.data.pm25} μg/m³`);
            console.log(`     🔬 PM10: ${alert.data.pm10} μg/m³`);
          }
          
          if (alert.type === 'fire' && alert.data) {
            console.log(`     🔥 Acres: ${alert.data.acres}`);
            console.log(`     📏 Distance: ${alert.data.distance} miles`);
            console.log(`     📊 Containment: ${alert.data.containment}%`);
            console.log(`     📊 Fire Source: ${alert.data.dataSourceFull || alert.data.source}`);
          }
          
          if (alert.type === 'uv' && alert.data) {
            console.log(`     ☀️ UV Index: ${alert.data.uvIndex}`);
            console.log(`     🏷️  Category: ${alert.data.category}`);
            if (alert.data.isEstimated) {
              console.log(`     ⚠️ Estimated based on weather conditions`);
            }
          }
          
          if (alert.type === 'weather' && alert.data) {
            if (alert.data.temperature) {
              console.log(`     🌡️ Temperature: ${alert.data.temperature}°C`);
            }
            if (alert.data.humidity) {
              console.log(`     💧 Humidity: ${alert.data.humidity}%`);
            }
            if (alert.data.windSpeed) {
              console.log(`     💨 Wind: ${(alert.data.windSpeed * 3.6).toFixed(1)} km/h`);
            }
          }
          
          console.log('');
        });
      });
      
      // Alert type summary
      console.log('\n📊 ALERT TYPE SUMMARY:');
      console.log('======================');
      Object.entries(alertsByType).forEach(([type, alerts]) => {
        const highSeverity = alerts.filter(a => a.severity === 'high').length;
        const mediumSeverity = alerts.filter(a => a.severity === 'medium').length;
        const lowSeverity = alerts.filter(a => a.severity === 'low').length;
        
        console.log(`${getAlertIcon(type)} ${type}: ${alerts.length} total`);
        if (highSeverity > 0) console.log(`    🔴 High: ${highSeverity}`);
        if (mediumSeverity > 0) console.log(`    🟡 Medium: ${mediumSeverity}`);
        if (lowSeverity > 0) console.log(`    🟢 Low: ${lowSeverity}`);
      });
      
    } else {
      console.log('\nℹ️  No alerts found for this location');
      console.log('   This could mean:');
      console.log('   - No hazardous conditions detected');
      console.log('   - All systems are operating normally');
      console.log('   - API connections are unavailable');
    }
    
    console.log('\n✅ Alerts integration test completed!');
    console.log('🎯 All alert types should now display real data when available');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running: npm run dev:server');
  }
}

function getAlertIcon(type) {
  switch (type) {
    case 'fire': return '🔥';
    case 'air-quality': return '💨';
    case 'smoke': return '🌫️';
    case 'weather': return '⛈️';
    case 'uv': return '☀️';
    default: return '⚠️';
  }
}

// Run test
testAlertsIntegration();