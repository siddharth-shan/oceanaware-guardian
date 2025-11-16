#!/usr/bin/env node
/**
 * Test the news API integration for fire-related content
 */

async function testNewsAPI() {
  console.log('📰 Testing News API Integration');
  console.log('==============================\n');
  
  try {
    // Test the API endpoint
    const testCoords = {
      lat: 34.2656,   // Simi Valley, ZIP 93065
      lng: -118.7653,
      location: 'Simi Valley, CA',
      state: 'California',
      limit: 10,
      radius: 100
    };
    
    console.log(`📍 Testing with location: ${testCoords.location}`);
    console.log(`📏 Search radius: ${testCoords.radius} miles`);
    console.log(`📊 Limit: ${testCoords.limit} articles\n`);
    
    // Make request to the news API
    const params = new URLSearchParams({
      lat: testCoords.lat,
      lng: testCoords.lng,
      location: testCoords.location,
      state: testCoords.state,
      limit: testCoords.limit,
      radius: testCoords.radius
    });
    
    const apiUrl = `http://localhost:3001/api/news/fire-related?${params}`;
    console.log(`🔗 API URL: ${apiUrl}\n`);
    
    const response = await fetch(apiUrl);
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ API Error: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n📰 NEWS DATA RESULTS:');
    console.log('=====================');
    console.log(`✅ Success: ${data.success}`);
    console.log(`📰 Articles Found: ${data.articles?.length || 0}`);
    console.log(`📊 Sources Used: ${data.metadata?.sources?.join(', ') || 'None'}`);
    console.log(`⏰ Timestamp: ${data.metadata?.timestamp}`);
    
    if (data.articles && data.articles.length > 0) {
      console.log('\n📰 SAMPLE ARTICLES:');
      console.log('==================');
      
      data.articles.slice(0, 5).forEach((article, i) => {
        console.log(`${i + 1}. "${article.title}"`);
        console.log(`   📅 Published: ${new Date(article.publishedAt).toLocaleString()}`);
        console.log(`   📰 Source: ${article.source}`);
        console.log(`   🎯 Relevance: ${Math.round((article.relevanceScore || 0) * 100)}%`);
        console.log(`   ✅ Trusted: ${article.trusted ? 'Yes' : 'No'}`);
        console.log(`   📍 Location: ${article.location}`);
        if (article.description) {
          console.log(`   📝 Description: ${article.description.substring(0, 100)}...`);
        }
        if (article.url) {
          console.log(`   🔗 URL: ${article.url}`);
        }
        console.log('');
      });
    } else {
      console.log('\nℹ️  No news articles found');
      console.log('   This could mean:');
      console.log('   - No fire-related news in the area');
      console.log('   - All news sources are unavailable');
      console.log('   - API configuration issues');
    }
    
    console.log('\n📊 NEWS SOURCES STATUS:');
    console.log('=======================');
    
    // Test news sources endpoint
    const sourcesResponse = await fetch('http://localhost:3001/api/news/sources');
    if (sourcesResponse.ok) {
      const sourcesData = await sourcesResponse.json();
      if (sourcesData.sources) {
        sourcesData.sources.forEach(source => {
          console.log(`📰 ${source.name}: ${source.status}`);
          console.log(`   Type: ${source.type}`);
          console.log(`   Trusted: ${source.trusted ? 'Yes' : 'No'}`);
          console.log(`   Description: ${source.description}`);
          console.log('');
        });
      }
    } else {
      console.log('❌ Could not fetch sources status');
    }
    
    console.log('✅ News API test completed!');
    console.log('📰 The widget should now display fire-related news and social content\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running: npm run dev:server');
    console.log('💡 Check that the news routes are properly registered');
  }
}

// Test the news sources configuration
async function testSourcesConfiguration() {
  console.log('\n🔧 TESTING NEWS SOURCES CONFIGURATION:');
  console.log('=====================================');
  
  // Check environment variables
  const hasNewsAPI = !!process.env.NEWSAPI_KEY;
  console.log(`📰 NewsAPI Key: ${hasNewsAPI ? '✅ Configured' : '❌ Missing'}`);
  
  if (!hasNewsAPI) {
    console.log('   💡 To enable NewsAPI, add NEWSAPI_KEY to .env.local');
    console.log('   💡 Get a free key from: https://newsapi.org/');
  }
  
  console.log('📱 Reddit JSON API: ✅ No key required');
  console.log('📡 RSS Feeds: ✅ No key required');
  console.log('');
}

// Run tests
async function runAllTests() {
  await testSourcesConfiguration();
  console.log('='.repeat(60) + '\n');
  await testNewsAPI();
}

runAllTests();