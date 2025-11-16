#!/usr/bin/env node
/**
 * Test NASA EONET API for wildfire detection near ZIP 93065
 * EONET provides official wildfire events with accurate names and locations
 */

// Geocoding function using free service
async function geocodeZip(zipCode) {
  const response = await fetch(`http://api.zippopotam.us/us/${zipCode}`);
  const data = await response.json();
  const place = data.places[0];
  return {
    lat: parseFloat(place.latitude),
    lng: parseFloat(place.longitude)
  };
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Fetch wildfire events from NASA EONET
async function getEONETWildfires(zipLat, zipLng, radiusMiles = 50) {
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&limit=100';
  
  console.log(`🔗 EONET URL: ${url}`);
  
  const response = await fetch(url);
  console.log(`📡 EONET Response: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    throw new Error(`EONET API responded with ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  const events = data.events || [];
  
  console.log(`📊 Total wildfire events from EONET: ${events.length}`);
  
  // Filter events near ZIP location
  const nearbyFires = [];
  
  for (const event of events) {
    // EONET events can have multiple geometry points (fire progression)
    const geometries = event.geometry || [];
    
    for (const geom of geometries) {
      const coords = geom.coordinates;
      if (!coords || coords.length < 2) continue;
      
      const [fireLng, fireLat] = coords; // EONET uses [lng, lat] format
      const distance = calculateDistance(zipLat, zipLng, fireLat, fireLng);
      
      if (distance <= radiusMiles) {
        nearbyFires.push({
          id: event.id,
          title: event.title,
          description: event.description,
          link: event.link,
          location: [fireLat, fireLng],
          distance: Math.round(distance * 10) / 10,
          date: geom.date,
          type: geom.type || 'Point',
          category: 'Wildfire',
          source: 'NASA EONET',
          severity: distance < 10 ? 'High' : distance < 25 ? 'Medium' : 'Low',
          rawEvent: event
        });
      }
    }
  }
  
  // Remove duplicates and sort by distance
  const uniqueFires = nearbyFires.reduce((acc, fire) => {
    const existing = acc.find(f => f.id === fire.id);
    if (!existing || fire.distance < existing.distance) {
      return [...acc.filter(f => f.id !== fire.id), fire];
    }
    return acc;
  }, []);
  
  return uniqueFires.sort((a, b) => a.distance - b.distance);
}

// Main test function
async function testEONETForZip93065() {
  try {
    const zip = '93065';
    console.log(`🎯 Testing NASA EONET for ZIP ${zip} (Simi Valley/Laguna fire area)`);
    
    // Step 1: Geocode ZIP
    console.log(`\n1️⃣ Geocoding ZIP ${zip}...`);
    const coords = await geocodeZip(zip);
    console.log(`📍 ZIP ${zip} coordinates: ${coords.lat}, ${coords.lng}`);
    
    // Step 2: Get EONET wildfire data
    console.log(`\n2️⃣ Fetching EONET wildfire events...`);
    const eonetFires = await getEONETWildfires(coords.lat, coords.lng, 100); // 100 mile radius
    
    console.log(`\n✅ EONET found ${eonetFires.length} wildfire events within 100 miles`);
    
    if (eonetFires.length > 0) {
      console.log(`\n🔥 Wildfire Events Near ZIP ${zip}:`);
      eonetFires.forEach((fire, i) => {
        console.log(`  ${i + 1}. "${fire.title}"`);
        console.log(`     📍 Location: [${fire.location[0]}, ${fire.location[1]}]`);
        console.log(`     📏 Distance: ${fire.distance} miles`);
        console.log(`     📅 Date: ${fire.date}`);
        console.log(`     🚨 Severity: ${fire.severity}`);
        console.log(`     🔗 Link: ${fire.link}`);
        console.log('');
      });
      
      // Look for Laguna fire specifically
      const lagunaFire = eonetFires.find(fire => 
        fire.title.toLowerCase().includes('laguna') ||
        fire.description?.toLowerCase().includes('laguna')
      );
      
      if (lagunaFire) {
        console.log(`🎯 FOUND LAGUNA FIRE: "${lagunaFire.title}" at ${lagunaFire.distance} miles!`);
      } else {
        console.log(`🔍 No "Laguna" fire found in titles, but ${eonetFires.length} other fires detected.`);
      }
    } else {
      console.log(`ℹ️  No active wildfire events found within 100 miles of ZIP ${zip}`);
    }
    
    console.log(`\n📊 EONET provides more accurate fire data than FIRMS satellite points!`);
    console.log(`   - Official fire names and descriptions`);
    console.log(`   - Precise coordinates and dates`);
    console.log(`   - Links to official sources`);
    console.log(`   - No authentication required`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEONETForZip93065();