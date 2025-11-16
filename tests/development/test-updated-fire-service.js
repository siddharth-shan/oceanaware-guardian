#!/usr/bin/env node
/**
 * Test the updated fire data service with NASA EONET as primary source
 * New priority order: EONET -> NIFC Public -> FIRMS -> CalFire
 */

// Set environment variables for testing
process.env.FIRMS_MAP_KEY = '7d94088656e81e0c9f9bc1030942f7b0';
process.env.ARCGIS_USR = 'siddharth.shan';
process.env.ARCGIS_PWD = 'Whsvr0@r';

async function testUpdatedFireService() {
  console.log('🔥 Testing Updated Fire Data Service with NASA EONET Priority');
  console.log('📊 New Data Source Priority: EONET → NIFC Public → FIRMS → CalFire\n');
  
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
        console.log(`   📅 Date: ${fire.discoveryDate}`);
        console.log(`   🏢 Category: ${fire.category}`);
        if (fire.description) {
          console.log(`   📝 Description: ${fire.description}`);
        }
        if (fire.link) {
          console.log(`   🔗 Link: ${fire.link}`);
        }
        console.log('');
      });
      
      // Check for specific fire names
      const lagunaFire = data.fires.find(fire => 
        fire.name.toLowerCase().includes('laguna')
      );
      
      if (lagunaFire) {
        console.log(`🎯 *** LAGUNA FIRE DETECTED! ***`);
        console.log(`    Name: ${lagunaFire.name}`);
        console.log(`    Distance: ${lagunaFire.distance} miles from ZIP 93065`);
      }
    } else {
      console.log('\nℹ️  No active fires detected in the search area');
      console.log(`   This could mean:`);
      console.log(`   - No fires are currently active within ${testCoords.radius} miles`);
      console.log(`   - All data sources are unavailable`);
      console.log(`   - The Laguna fire may be contained or not in the EONET database`);
    }
    
    console.log('\n📊 DATA SOURCE ANALYSIS:');
    console.log('========================');
    console.log(`Primary Source Used: ${data.metadata?.source}`);
    
    switch(data.metadata?.source) {
      case 'NASA-EONET':
        console.log('✅ Using NASA EONET - Most accurate official wildfire events');
        console.log('   - Official fire names and descriptions');
        console.log('   - Precise coordinates and dates');
        console.log('   - No authentication required');
        break;
      case 'NIFC-Public':
        console.log('✅ Using NIFC Public - Official active incident data');
        console.log('   - Government incident management data');
        console.log('   - No authentication required');
        break;
      case 'NASA-FIRMS':
        console.log('⚠️  Fallback to NASA FIRMS - Satellite detection points');
        console.log('   - Raw satellite fire detections');
        console.log('   - May include false positives');
        break;
      case 'CalFire':
        console.log('⚠️  Fallback to CalFire - Historical fire perimeter data');
        console.log('   - Primarily historical fire data');
        break;
      default:
        console.log('❌ No data sources available');
    }
    
    console.log('\n✅ Updated fire data service test completed!');
    console.log('🎯 EONET provides more accurate fire data than FIRMS satellite points');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running: npm run dev:server');
  }
}

// Test the service without server (direct API calls)
async function testDirectEONET() {
  console.log('\n🧪 DIRECT EONET API TEST:');
  console.log('=========================');
  
  try {
    const response = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&limit=10');
    const data = await response.json();
    
    console.log(`📊 EONET returned ${data.events?.length || 0} total open wildfire events`);
    
    if (data.events && data.events.length > 0) {
      console.log('\nSample EONET events:');
      data.events.slice(0, 3).forEach((event, i) => {
        const [lng, lat] = event.geometry[0].coordinates;
        console.log(`  ${i + 1}. ${event.title}`);
        console.log(`     📍 [${lat}, ${lng}]`);
        console.log(`     📅 ${event.geometry[0].date}`);
      });
    }
  } catch (error) {
    console.log(`❌ Direct EONET test failed: ${error.message}`);
  }
}

// Run tests
async function runAllTests() {
  await testDirectEONET();
  console.log('\n' + '='.repeat(60) + '\n');
  await testUpdatedFireService();
}

runAllTests();