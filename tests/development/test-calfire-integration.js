#!/usr/bin/env node
/**
 * Test the updated fire data service with CAL FIRE GeoJSON as primary source
 * New priority order: CAL FIRE GeoJSON -> NASA EONET -> NIFC Public -> FIRMS -> CalFire Historical
 */

async function testCALFireIntegration() {
  console.log('🔥 Testing CAL FIRE GeoJSON Integration');
  console.log('📊 New Data Source Priority: CAL FIRE GeoJSON → NASA EONET → NIFC Public → FIRMS → CalFire Historical\n');
  
  try {
    // Test the API endpoint directly
    const testCoords = {
      lat: 34.2656,   // Simi Valley, ZIP 93065
      lng: -118.7653,
      radius: 100     // 100 mile radius
    };
    
    console.log(`📍 Testing coordinates: ${testCoords.lat}, ${testCoords.lng}`);
    console.log(`📏 Search radius: ${testCoords.radius} miles\n`);
    
    // Make request to the fire data API
    const apiUrl = `http://localhost:3001/api/fire-data/nearby?lat=${testCoords.lat}&lng=${testCoords.lng}&radius=${testCoords.radius}`;
    console.log(`🔗 API URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ API Error: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n🎯 FIRE DATA RESULTS:');
    console.log('========================');
    console.log(`✅ Success: ${data.success}`);
    console.log(`🔥 Fires Found: ${data.fires?.length || 0}`);
    console.log(`📊 Data Source: ${data.metadata?.dataSource}`);
    console.log(`🌐 API Endpoint: ${data.metadata?.apiEndpoint}`);
    console.log(`⏰ Timestamp: ${data.metadata?.timestamp}`);
    
    if (data.metadata?.errors && data.metadata.errors.length > 0) {
      console.log(`⚠️  Errors: ${data.metadata.errors.join(', ')}`);
    }
    
    if (data.fires && data.fires.length > 0) {
      console.log('\n🔥 DETECTED FIRES:');
      console.log('==================');
      
      data.fires.forEach((fire, i) => {
        console.log(`${i + 1}. "${fire.name}"`);
        console.log(`   📍 Location: [${fire.location[0]}, ${fire.location[1]}]`);
        console.log(`   📏 Distance: ${fire.distance} miles`);
        console.log(`   📏 Acres: ${fire.acres}`);
        console.log(`   🎯 Severity: ${fire.severity}`);
        console.log(`   📅 Started: ${new Date(fire.discoveryDate).toLocaleString()}`);
        console.log(`   🏢 Category: ${fire.category}`);
        console.log(`   📊 Containment: ${fire.containment}%`);
        console.log(`   🏛️ Source: ${fire.source}`);
        
        // CAL FIRE specific data
        if (fire.county) {
          console.log(`   🏘️  County: ${fire.county}`);
        }
        if (fire.location_description) {
          console.log(`   📍 Location: ${fire.location_description}`);
        }
        if (fire.admin_unit) {
          console.log(`   🚒 Admin Unit: ${fire.admin_unit}`);
        }
        if (fire.updated) {
          console.log(`   🔄 Last Updated: ${new Date(fire.updated).toLocaleString()}`);
        }
        if (fire.link) {
          console.log(`   🔗 CAL FIRE Link: ${fire.link}`);
        }
        console.log('');
      });
      
      // Check for specific fires near ZIP 93065 (Simi Valley area)
      const nearbyFires = data.fires.filter(fire => fire.distance < 50);
      if (nearbyFires.length > 0) {
        console.log(`🎯 *** ${nearbyFires.length} FIRE(S) WITHIN 50 MILES OF ZIP 93065 ***`);
        nearbyFires.forEach(fire => {
          console.log(`    ${fire.name}: ${fire.distance} miles away`);
          console.log(`    ${fire.acres} acres, ${fire.containment}% contained`);
        });
      }
    } else {
      console.log('\nℹ️  No active fires detected in the search area');
      console.log(`   This could mean:`);
      console.log(`   - No fires are currently active within ${testCoords.radius} miles`);
      console.log(`   - All data sources are unavailable`);
      console.log(`   - The CAL FIRE API returned no active incidents`);
    }
    
    console.log('\n📊 DATA SOURCE ANALYSIS:');
    console.log('========================');
    console.log(`Primary Source Used: ${data.metadata?.source}`);
    
    switch(data.metadata?.source) {
      case 'CAL-FIRE-GeoJSON':
        console.log('✅ Using CAL FIRE GeoJSON - Official California fire incidents');
        console.log('   - Real-time incident data from CAL FIRE');
        console.log('   - Includes acres burned, containment percentage');
        console.log('   - Official incident names and locations');
        console.log('   - Direct links to CAL FIRE incident pages');
        console.log('   - No authentication required');
        break;
      case 'NASA-EONET':
        console.log('✅ Fallback to NASA EONET - Global wildfire events');
        console.log('   - Official fire names and descriptions');
        console.log('   - Precise coordinates and dates');
        console.log('   - No authentication required');
        break;
      case 'NIFC-Public':
        console.log('⚠️  Fallback to NIFC Public - Active incident data');
        console.log('   - Government incident management data');
        console.log('   - No authentication required');
        break;
      case 'NASA-FIRMS':
        console.log('⚠️  Fallback to NASA FIRMS - Satellite detection points');
        console.log('   - Raw satellite fire detections');
        console.log('   - May include false positives');
        break;
      case 'CalFire':
        console.log('⚠️  Fallback to CalFire Historical - Fire perimeter data');
        console.log('   - Primarily historical fire data');
        break;
      default:
        console.log('❌ No data sources available');
    }
    
    console.log('\n✅ CAL FIRE GeoJSON integration test completed!');
    console.log('🎯 CAL FIRE provides the most accurate and up-to-date California fire incident data');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running: npm run dev:server');
  }
}

// Test direct CAL FIRE GeoJSON API
async function testDirectCALFireAPI() {
  console.log('\n🧪 DIRECT CAL FIRE GEOJSON API TEST:');
  console.log('===================================');
  
  try {
    const currentYear = new Date().getFullYear();
    const params = new URLSearchParams({
      year: currentYear.toString(),
      inactive: 'false'
    });
    
    const response = await fetch(`https://incidents.fire.ca.gov/umbraco/api/IncidentApi/GeoJsonList?${params}`);
    const data = await response.json();
    
    console.log(`📊 CAL FIRE returned ${data.features?.length || 0} active incidents for ${currentYear}`);
    
    if (data.features && data.features.length > 0) {
      console.log('\nSample CAL FIRE incidents:');
      data.features.slice(0, 3).forEach((feature, i) => {
        const props = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;
        console.log(`  ${i + 1}. ${props.Name}`);
        console.log(`     📍 [${lat}, ${lng}]`);
        console.log(`     🔥 ${props.AcresBurned} acres, ${props.PercentContained}% contained`);
        console.log(`     🏘️  ${props.County} County - ${props.Location}`);
        console.log(`     📅 Started: ${props.Started}`);
        console.log(`     🔗 ${props.Url}`);
      });
    }
  } catch (error) {
    console.log(`❌ Direct CAL FIRE test failed: ${error.message}`);
  }
}

// Run tests
async function runAllTests() {
  await testDirectCALFireAPI();
  console.log('\n' + '='.repeat(60) + '\n');
  await testCALFireIntegration();
}

runAllTests();