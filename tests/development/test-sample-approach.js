#!/usr/bin/env node
/**
 * Test script following the exact approach from firms-sample.txt
 */

// Set environment variables
process.env.FIRMS_MAP_KEY = '7d94088656e81e0c9f9bc1030942f7b0';
process.env.ARCGIS_USR = 'siddharth.shan';
process.env.ARCGIS_PWD = 'Whsvr0@r';

import AuthService from './server/services/authService.js';

// FIRMS uses CSV API, not ArcGIS REST
const FIRMS_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';

// Use the public active incidents endpoint that works without authentication
const NIFC_PUBLIC_URL = 
  'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/' +
  'EGP_Active_Incidents_Public_view/FeatureServer/0/query';

// Also try CalFire directly
const CALFIRE_URL = 
  'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/' +
  'California_Fire_Perimeters/FeatureServer/0/query';

// Load keys from env
const FIRMS_MAP_KEY = process.env.FIRMS_MAP_KEY;

// 1. Geocode ZIP → { lat, lng }
async function geocodeZip(zip) {
  const res = await fetch(`http://api.zippopotam.us/us/${zip}`);
  const data = await res.json();
  const p = data.places[0];
  return { lat: +p.latitude, lng: +p.longitude };
}

// 2. Build ±Δ° envelope
function envelope({ lat, lng }, delta = 0.5) {
  return {
    xmin: lng - delta, ymin: lat - delta,
    xmax: lng + delta, ymax: lat + delta
  };
}

// 3. Query FIRMS CSV API
async function queryFIRMS(coords, dayRange = 3) {
  const { lat, lng } = coords;
  const delta = 0.5; // 0.5 degrees around the point
  const west = lng - delta;
  const south = lat - delta;
  const east = lng + delta;
  const north = lat + delta;
  
  // FIRMS area API format: /csv/[MAP_KEY]/[SOURCE]/[AREA]/[DAY_RANGE]
  const url = `${FIRMS_BASE_URL}/${FIRMS_MAP_KEY}/VIIRS_SNPP_NRT/${west},${south},${east},${north}/${dayRange}`;
  console.log(`🔗 FIRMS URL: ${url}`);
  
  const response = await fetch(url);
  console.log(`📡 FIRMS Response: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`❌ FIRMS Error: ${errorText.substring(0, 200)}`);
    throw new Error(`FIRMS API error ${response.status}: ${response.statusText}`);
  }
  
  const csvText = await response.text();
  console.log(`📊 FIRMS CSV length: ${csvText.length} characters`);
  
  // Parse CSV to JSON
  const lines = csvText.trim().split('\n');
  if (lines.length <= 1) {
    return []; // No data or only header
  }
  
  const headers = lines[0].split(',');
  const fires = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const fire = {};
    headers.forEach((header, index) => {
      fire[header.trim()] = values[index]?.trim();
    });
    
    // Convert numeric fields
    fire.latitude = parseFloat(fire.latitude);
    fire.longitude = parseFloat(fire.longitude);
    fire.frp = parseFloat(fire.frp);
    fire.confidence = parseFloat(fire.confidence);
    
    fires.push(fire);
  }
  
  return fires;
}

// 4. Query an ArcGIS service
async function queryArcGIS(baseUrl, bbox, extraParams = {}) {
  const params = new URLSearchParams({
    where:        '1=1',
    geometry:     `${bbox.xmin},${bbox.ymin},${bbox.xmax},${bbox.ymax}`,
    geometryType: 'esriGeometryEnvelope',
    inSR:         '4326',
    outSR:        '4326',
    outFields:    '*',
    f:            'json',
    token:        extraParams.token  || '',      // ← MAP_KEY or ArcGIS token
  });
  
  const url = `${baseUrl}?${params}`;
  console.log(`🔗 Calling: ${url.substring(0, 120)}...`);
  
  const res = await fetch(url);
  console.log(`📡 Response: ${res.status} ${res.statusText}`);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.log(`❌ Error: ${errorText.substring(0, 200)}`);
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  
  const data = await res.json();
  
  if (data.error) {
    throw new Error(`API error: ${data.error.message}`);
  }
  
  return data.features;
}

(async () => {
  try {
    const zip = '93065';
    console.log(`🎯 Testing ZIP ${zip} (Simi Valley) for Laguna fire detection`);
    console.log(`Geocoding ZIP ${zip}…`);
    const coords = await geocodeZip(zip);
    console.log(`📍 Coordinates: ${coords.lat}, ${coords.lng}`);

    const bbox = envelope(coords, 0.5);
    console.log('📦 BBox:', bbox);

    // Test 1: FIRMS using correct CSV API
    console.log('\n1️⃣ Testing FIRMS fires with CSV API…');
    try {
      const firmsFires = await queryFIRMS(coords, 3); // 3 days of data
      console.log(`✅ FIRMS returned ${firmsFires.length} fire points`);
      
      // Print sample fires
      firmsFires.slice(0, 3).forEach((f, i) => {
        console.log(`  ${i + 1}. lat=${f.latitude}, lon=${f.longitude}, frp=${f.frp || 'N/A'}, confidence=${f.confidence || 'N/A'}`);
      });
    } catch (error) {
      console.log(`❌ FIRMS failed: ${error.message}`);
    }

    // Test 2: NIFC Public Active Incidents (no authentication needed)
    console.log('\n2️⃣ Testing NIFC Public Active Incidents (no auth required)…');
    try {
      const nifcFires = await queryArcGIS(NIFC_PUBLIC_URL, bbox); // No token needed
      console.log(`✅ NIFC Public returned ${nifcFires.length} active incidents`);
      
      // Print sample fires
      nifcFires.slice(0, 3).forEach((f, i) => {
        const a = f.attributes;
        console.log(`  ${i + 1}. Incident: ${JSON.stringify(a).substring(0, 100)}...`);
      });
    } catch (error) {
      console.log(`❌ NIFC Public failed: ${error.message}`);
    }

    // Test 3: CalFire as fallback
    console.log('\n3️⃣ Testing CalFire as fallback…');
    try {
      const calFires = await queryArcGIS(CALFIRE_URL, bbox);
      console.log(`✅ CalFire returned ${calFires.length} fire perimeters`);
      
      // Print sample fires
      calFires.slice(0, 3).forEach((f, i) => {
        const a = f.attributes;
        console.log(`  ${i + 1}. ${a.FIRE_NAME || 'Unnamed'}: ${a.GIS_ACRES || 0} acres (${a.FIRE_YEAR || 'Unknown year'})`);
      });
    } catch (error) {
      console.log(`❌ CalFire failed: ${error.message}`);
    }

    console.log('\n🎯 Test completed! Look for "Laguna" fire in the results above.');

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
})();