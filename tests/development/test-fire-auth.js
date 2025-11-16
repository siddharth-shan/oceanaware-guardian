#!/usr/bin/env node
/**
 * Test script to verify fire data authentication and detection
 * Tests NASA FIRMS, NIFC, and CalFire services with proper authentication
 */

import AuthService from './server/services/authService.js';

// Set environment variables for testing
process.env.FIRMS_MAP_KEY = '7d94088656e81e0c9f9bc1030942f7b0';
process.env.ARCGIS_USR = 'siddharth.shan';
process.env.ARCGIS_PWD = 'Whsvr0@r';

console.log('Environment check:');
console.log('FIRMS_MAP_KEY:', process.env.FIRMS_MAP_KEY ? '✅ Found' : '❌ Missing');
console.log('ARCGIS_USR:', process.env.ARCGIS_USR ? '✅ Found' : '❌ Missing');
console.log('ARCGIS_PWD:', process.env.ARCGIS_PWD ? '✅ Found' : '❌ Missing');
console.log('');

async function testFireDataAuth() {
  console.log('🔥 Testing Fire Data Authentication and Detection\n');
  
  const authService = new AuthService();
  
  // Test 1: Authentication
  console.log('1. Testing Authentication Services...');
  const authResults = await authService.testAuthentication();
  
  if (!authResults.arcgis || !authResults.firms) {
    console.error('❌ Authentication failed:', authResults.errors);
    return;
  }
  
  console.log('✅ All authentication services working\n');
  
  // Test 2: Geocode ZIP 93065
  console.log('2. Testing ZIP Code Geocoding (93065)...');
  const zipCoords = await geocodeZip('93065');
  console.log(`📍 ZIP 93065 coordinates: ${zipCoords.lat}, ${zipCoords.lng}\n`);
  
  // Test 3: NASA FIRMS Fire Detection 
  console.log('3. Testing NASA FIRMS Fire Detection...');
  try {
    const firmsFires = await testNASAFIRMS(zipCoords.lat, zipCoords.lng, 50);
    console.log(`🛰️  NASA FIRMS found ${firmsFires.length} active fires within 50 miles`);
    
    if (firmsFires.length > 0) {
      console.log('Sample fires:');
      firmsFires.slice(0, 3).forEach((fire, i) => {
        console.log(`  ${i + 1}. Location: [${fire.location[0]}, ${fire.location[1]}], FRP: ${fire.frp}, Confidence: ${fire.confidence}%`);
      });
    }
  } catch (error) {
    console.log(`❌ NASA FIRMS failed: ${error.message}`);
  }
  
  console.log('');
  
  // Test 4: NIFC Fire Detection with ArcGIS token
  console.log('4. Testing NIFC Fire Detection with ArcGIS Authentication...');
  try {
    const nifcFires = await testNIFCData(zipCoords.lat, zipCoords.lng, 50);
    console.log(`🏛️  NIFC found ${nifcFires.length} active fires within 50 miles`);
    
    if (nifcFires.length > 0) {
      console.log('Sample fires:');
      nifcFires.slice(0, 3).forEach((fire, i) => {
        console.log(`  ${i + 1}. ${fire.name}: ${fire.acres} acres, ${fire.containment}% contained, ${fire.distance} miles away`);
      });
    }
  } catch (error) {
    console.log(`❌ NIFC failed: ${error.message}`);
  }
  
  console.log('');
  
  // Test 5: CalFire Detection
  console.log('5. Testing CalFire Fire Detection...');
  try {
    const calFires = await testCalFireData(zipCoords.lat, zipCoords.lng, 50);
    console.log(`🔥 CalFire found ${calFires.length} fires within 50 miles`);
    
    if (calFires.length > 0) {
      console.log('Sample fires:');
      calFires.slice(0, 3).forEach((fire, i) => {
        console.log(`  ${i + 1}. ${fire.name}: ${fire.acres} acres, Year: ${fire.fireYear}`);
      });
    }
  } catch (error) {
    console.log(`❌ CalFire failed: ${error.message}`);
  }
  
  console.log('\n🎯 Test completed. If "Laguna" fire is active, it should appear in the results above.');
}

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

// Test NASA FIRMS with authentication
async function testNASAFIRMS(lat, lng, radius) {
  const authService = new AuthService();
  
  const firmsUrl = 'https://firms.modaps.eosdis.nasa.gov/arcgis/rest/services/FIRMS/VIIRS_SNPP_NRT/MapServer/0/query';
  
  console.log(`  🔍 Testing FIRMS URL: ${firmsUrl}`);
  const mapKey = authService.getFirmsMapKey();
  
  const delta = Math.max(0.5, radius / 69); // Use 0.5 degrees minimum like in sample
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  
  const params = new URLSearchParams({
    where: '1=1',
    geometry: bbox,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    outSR: '4326',
    outFields: '*',
    f: 'json',
    token: mapKey // MAP_KEY for FIRMS authentication
  });
  
  const fullUrl = `${firmsUrl}?${params}`;
  console.log(`  📡 Full URL: ${fullUrl.substring(0, 150)}...`);
  
  const response = await fetch(fullUrl);
  
  console.log(`  📡 Response status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`  ❌ Error response: ${errorText.substring(0, 200)}`);
    throw new Error(`NASA FIRMS API responded with ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`  📊 FIRMS response features count: ${data.features?.length || 0}`);
  
  if (data.error) {
    throw new Error(`NASA FIRMS API error: ${data.error.message || 'Unknown error'}`);
  }
  
  if (data.features && data.features.length > 0) {
    return data.features.map((feature, index) => {
      const attrs = feature.attributes;
      const geometry = feature.geometry;
      
      const fireLat = attrs.latitude || geometry?.y;
      const fireLng = attrs.longitude || geometry?.x;
      
      if (!fireLat || !fireLng) return null;
      
      const distance = calculateDistance(lat, lng, fireLat, fireLng);
      
      return {
        id: `firms_${attrs.OBJECTID || attrs.objectid || 'unknown'}_${fireLat.toFixed(4)}_${fireLng.toFixed(4)}_${index}`,
        name: `VIIRS Fire Detection ${index + 1}`,
        location: [fireLat, fireLng],
        distance: Math.round(distance * 10) / 10,
        confidence: attrs.confidence || 0,
        brightness: attrs.bright_ti4 || attrs.brightness || 0,
        frp: attrs.frp || attrs.FRP || 0,
        satellite: 'VIIRS'
      };
    }).filter(fire => fire && fire.distance <= radius);
  }
  
  return [];
}

// Test NIFC with ArcGIS token
async function testNIFCData(lat, lng, radius) {
  const authService = new AuthService();
  
  // Try the CalFire URL from the sample instead since it's more likely to work
  const nifcUrl = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Current_WildlandFire_Locations/FeatureServer/0/query';
  const arcgisToken = await authService.ensureValidArcGISToken();
  
  // Use same approach as FIRMS sample - string bbox format
  const delta = Math.max(0.5, radius / 69);
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  
  const params = new URLSearchParams({
    where: "1=1",
    geometry: bbox,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    outSR: "4326",
    outFields: "*",
    f: "json",
    token: arcgisToken
  });
  
  const response = await fetch(`${nifcUrl}?${params}`);
  
  if (!response.ok) {
    throw new Error(`NIFC API responded with ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`NIFC API error: ${data.error.message || 'Unknown error'}`);
  }
  
  if (data.features && data.features.length > 0) {
    return data.features.map((feature, index) => {
      const attrs = feature.attributes;
      const geometry = feature.geometry;
      
      const fireLat = attrs.POOLatitude || attrs.Y || attrs.LATITUDE || geometry?.y || lat;
      const fireLng = attrs.POOLongitude || attrs.X || attrs.LONGITUDE || geometry?.x || lng;
      const distance = calculateDistance(lat, lng, fireLat, fireLng);
      
      return {
        id: `nifc_${attrs.OBJECTID || attrs.FID || index + 1}`,
        name: attrs.IncidentName || attrs.FIRE_NAME || attrs.NAME || 'Unnamed Fire',
        location: [fireLat, fireLng],
        acres: attrs.DailyAcres || attrs.ACRES || attrs.SIZE_ACRES || 0,
        containment: attrs.PercentContained || attrs.CONTAINMENT || 0,
        distance: Math.round(distance * 10) / 10,
        cause: attrs.FireCause || attrs.CAUSE || 'Unknown',
        category: attrs.IncidentTypeCategory || attrs.TYPE || 'Wildfire'
      };
    }).filter(fire => fire.distance <= radius);
  }
  
  return [];
}

// Test CalFire data
async function testCalFireData(lat, lng, radius) {
  
  const calfireUrl = 'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Fire_Perimeters/FeatureServer/0/query';
  
  const radiusDegrees = radius / 69;
  const envelope = {
    xmin: lng - radiusDegrees,
    ymin: lat - radiusDegrees,
    xmax: lng + radiusDegrees,
    ymax: lat + radiusDegrees
  };
  
  const params = new URLSearchParams({
    where: "FIRE_YEAR >= 2024",
    outFields: "*",
    geometry: JSON.stringify(envelope),
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outSR: "4326",
    returnGeometry: "true",
    f: "json"
  });
  
  const response = await fetch(`${calfireUrl}?${params}`);
  
  if (!response.ok) {
    throw new Error(`CalFire API responded with ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`CalFire API error: ${data.error.message || 'Unknown error'}`);
  }
  
  if (data.features && data.features.length > 0) {
    return data.features.map((feature, index) => {
      const attrs = feature.attributes;
      const geometry = feature.geometry;
      
      let fireLat = lat, fireLng = lng;
      if (geometry.rings && geometry.rings[0]) {
        const ring = geometry.rings[0];
        fireLat = ring.reduce((sum, point) => sum + point[1], 0) / ring.length;
        fireLng = ring.reduce((sum, point) => sum + point[0], 0) / ring.length;
      }
      
      const distance = calculateDistance(lat, lng, fireLat, fireLng);
      const acres = attrs.GIS_ACRES || 0;
      
      return {
        id: `calfire_${attrs.OBJECTID || index + 1}`,
        name: attrs.FIRE_NAME || `CalFire Incident ${index + 1}`,
        location: [fireLat, fireLng],
        acres: acres,
        distance: Math.round(distance * 10) / 10,
        fireYear: attrs.FIRE_YEAR
      };
    }).filter(fire => fire.distance <= radius);
  }
  
  return [];
}

// Distance calculation helper
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

// Run the test
testFireDataAuth().catch(console.error);