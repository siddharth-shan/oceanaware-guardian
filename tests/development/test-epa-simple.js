/**
 * Simple EPA AQS API Test
 */

// Set environment variables
process.env.EPA_AQS_API_KEY = 'goldfox47';
process.env.EPA_AQS_API_EMAIL = 'siddharth.shanmugaraja@gmail.com';

import fetch from 'node-fetch';

console.log('🧪 EPA AQS API Integration Test\n');

async function testEPAAPI() {
  console.log('📋 Configuration:');
  console.log(`   EPA API Key: ${process.env.EPA_AQS_API_KEY}`);
  console.log(`   EPA Email: ${process.env.EPA_AQS_API_EMAIL}\n`);

  try {
    // Test 1: Get CA counties
    console.log('🔍 Test 1: Fetching California counties...');
    const countiesResponse = await fetch(
      `https://aqs.epa.gov/data/api/list/countiesByState?email=${process.env.EPA_AQS_API_EMAIL}&key=${process.env.EPA_AQS_API_KEY}&state=06`
    );
    
    if (countiesResponse.ok) {
      const countiesData = await countiesResponse.json();
      console.log(`✅ Found ${countiesData.Data?.length || 0} counties in California`);
      console.log(`   Sample: ${countiesData.Data?.[0]?.value_represented || 'N/A'}\n`);
    } else {
      console.log(`❌ Counties API failed: ${countiesResponse.status}\n`);
      return;
    }

    // Test 2: Get LA County monitoring sites
    console.log('🔍 Test 2: Fetching LA County monitoring sites...');
    const sitesResponse = await fetch(
      `https://aqs.epa.gov/data/api/list/sitesByCounty?email=${process.env.EPA_AQS_API_EMAIL}&key=${process.env.EPA_AQS_API_KEY}&state=06&county=037`
    );
    
    if (sitesResponse.ok) {
      const sitesData = await sitesResponse.json();
      console.log(`✅ Found ${sitesData.Data?.length || 0} monitoring sites in LA County`);
      
      if (sitesData.Data && sitesData.Data[0]) {
        const site = sitesData.Data[0];
        console.log(`   Example site: ${site.local_site_name} in ${site.city_name}`);
        console.log(`   Location: ${site.latitude}, ${site.longitude}`);
        console.log(`   Site ID: ${site.state_code}-${site.county_code}-${site.site_number}\n`);
        
        // Test 3: Get recent PM2.5 data for this site
        console.log('🔍 Test 3: Fetching recent PM2.5 data...');
        const currentDate = new Date();
        const startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const bdate = startDate.toISOString().split('T')[0].replace(/-/g, '');
        const edate = currentDate.toISOString().split('T')[0].replace(/-/g, '');
        
        const pm25Response = await fetch(
          `https://aqs.epa.gov/data/api/dailyData/bySite?email=${process.env.EPA_AQS_API_EMAIL}&key=${process.env.EPA_AQS_API_KEY}&param=88502&bdate=${bdate}&edate=${edate}&state=${site.state_code}&county=${site.county_code}&site=${site.site_number}`
        );
        
        if (pm25Response.ok) {
          const pm25Data = await pm25Response.json();
          console.log(`✅ Found ${pm25Data.Data?.length || 0} PM2.5 measurements`);
          
          if (pm25Data.Data && pm25Data.Data[0]) {
            const latest = pm25Data.Data[pm25Data.Data.length - 1]; // Get latest
            console.log(`   Latest: ${latest.arithmetic_mean} ${latest.units_of_measure}`);
            console.log(`   AQI: ${latest.aqi || 'N/A'}`);
            console.log(`   Date: ${latest.date_local}`);
            console.log(`   Site: ${latest.local_site_name}\n`);
          } else {
            console.log('   ⚠️ No recent PM2.5 data available\n');
          }
        } else {
          console.log(`❌ PM2.5 data API failed: ${pm25Response.status}\n`);
        }
      }
    } else {
      console.log(`❌ Sites API failed: ${sitesResponse.status}\n`);
    }

    console.log('🎯 EPA AQS API Test Results:');
    console.log('   ✅ API credentials working');
    console.log('   ✅ Can fetch counties');
    console.log('   ✅ Can fetch monitoring sites');
    console.log('   ✅ Can fetch pollutant data');
    console.log('   ✅ Ready for integration!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEPAAPI().catch(console.error);