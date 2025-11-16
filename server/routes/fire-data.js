import express from 'express';
import AuthService from '../services/authService.js';

const router = express.Router();
const authService = new AuthService();

// Get nearby fires
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Missing coordinates',
        message: 'Latitude and longitude are required'
      });
    }

    let fires = [];
    
    // Try data sources in order: CAL FIRE GeoJSON -> NASA EONET -> NIFC Public -> FIRMS -> CalFire ArcGIS -> No Data
    // CAL FIRE GeoJSON provides official California fire incidents with no authentication required
    fires = await tryFireDataSources(parseFloat(lat), parseFloat(lng), parseFloat(radius));
    
    async function tryFireDataSources(lat, lng, radius) {
      const errors = [];
      
      // 1. Try CAL FIRE GeoJSON first (official California fire incidents, no auth required)
      try {
        const calFireGeoJsonFires = await fetchCALFireGeoJSON(lat, lng, radius);
        if (calFireGeoJsonFires.length > 0) {
          return { fires: calFireGeoJsonFires, source: 'CAL-FIRE-GeoJSON' };
        }
      } catch (error) {
        errors.push(`CAL FIRE GeoJSON: ${error.message}`);
        console.warn('CAL FIRE GeoJSON API failed:', error.message);
      }
      
      // 2. Try NASA EONET second (global wildfire data, no auth required)
      try {
        const eonetFires = await fetchNASAEONET(lat, lng, radius);
        if (eonetFires.length > 0) {
          return { fires: eonetFires, source: 'NASA-EONET' };
        }
      } catch (error) {
        errors.push(`NASA EONET: ${error.message}`);
        console.warn('NASA EONET API failed:', error.message);
      }
      
      // 2. Try NIFC Public Active Incidents (no auth required)
      try {
        const nifcFires = await fetchNIFCPublic(lat, lng, radius);
        if (nifcFires.length > 0) {
          return { fires: nifcFires, source: 'NIFC-Public' };
        }
      } catch (error) {
        errors.push(`NIFC Public: ${error.message}`);
        console.warn('NIFC Public API failed:', error.message);
      }
      
      // 3. Try NASA FIRMS as fallback (satellite detection points, requires MAP_KEY)
      try {
        const firmsFires = await fetchNASAFIRMS(lat, lng, radius);
        if (firmsFires.length > 0) {
          return { fires: firmsFires, source: 'NASA-FIRMS' };
        }
      } catch (error) {
        errors.push(`NASA FIRMS: ${error.message}`);
        console.warn('NASA FIRMS API failed:', error.message);
      }
      
      // 4. Skip CalFire ArcGIS (requires authentication) - using CAL FIRE GeoJSON instead
      console.log('Skipping CalFire ArcGIS API (requires authentication)');
      
      // 5. No data available - return empty with error info
      return { 
        fires: [], 
        source: 'no-data',
        errors: errors,
        message: errors.length > 0 ? 'All fire data sources failed or returned no data' : 'No active fires detected in this area'
      };
    }
    
    async function fetchCALFireGeoJSON(lat, lng, radius) {
      // CAL FIRE GeoJSON API provides official California fire incidents
      const currentYear = new Date().getFullYear();
      const calFireUrl = 'https://incidents.fire.ca.gov/umbraco/api/IncidentApi/GeoJsonList';
      
      const params = new URLSearchParams({
        year: currentYear.toString(),
        inactive: 'false' // Only get active fires
      });
      
      try {
        console.log(`CAL FIRE GeoJSON API URL: ${calFireUrl}?${params}`);
        const response = await fetch(`${calFireUrl}?${params}`, { 
          timeout: 15000,
          headers: {
            'User-Agent': 'EcoQuest-Wildfire-Watch/1.0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`CAL FIRE GeoJSON API responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`CAL FIRE GeoJSON returned ${data.features?.length || 0} incidents`);
        
        if (!data.features || data.features.length === 0) {
          return [];
        }
        
        // Filter incidents near the location
        const nearbyFires = [];
        
        for (const feature of data.features) {
          if (!feature.geometry || !feature.properties) continue;
          
          const coords = feature.geometry.coordinates;
          if (!coords || coords.length < 2) continue;
          
          const [fireLng, fireLat] = coords; // GeoJSON uses [lng, lat] format
          const distance = calculateDistance(lat, lng, fireLat, fireLng);
          
          if (distance <= radius) {
            const props = feature.properties;
            
            // Extract fire data from CAL FIRE properties
            const fire = {
              id: `calfire_geojson_${props.UniqueId || feature.id}`,
              name: props.Name || 'Unnamed Incident',
              location: [fireLat, fireLng],
              acres: props.AcresBurned || 0,
              containment: props.PercentContained || 0,
              distance: Math.round(distance * 10) / 10,
              severity: calculateCALFireSeverity(props, distance),
              cause: 'Under Investigation', // CAL FIRE doesn't always provide cause
              category: props.Type || 'Wildfire',
              cost: 0, // CAL FIRE doesn't provide cost in this API
              discoveryDate: props.Started || new Date().toISOString(),
              description: `${props.Location || 'Location not specified'} in ${props.County || 'California'} County`,
              link: props.Url || '',
              
              // Additional CAL FIRE specific data
              county: props.County,
              location_description: props.Location,
              admin_unit: props.AdminUnit,
              agency_names: props.AgencyNames,
              updated: props.Updated,
              is_calfire_incident: props.CalFireIncident,
              is_final: props.Final,
              is_active: props.IsActive,
              extinguished_date: props.ExtinguishedDate,
              
              source: 'CAL FIRE GeoJSON',
              rawData: props
            };
            
            nearbyFires.push(fire);
          }
        }
        
        console.log(`CAL FIRE GeoJSON found ${nearbyFires.length} incidents within ${radius} miles`);
        return nearbyFires.sort((a, b) => a.distance - b.distance);
        
      } catch (error) {
        console.error('CAL FIRE GeoJSON API failed:', error.message);
        throw error;
      }
    }
    
    function calculateCALFireSeverity(props, distance) {
      const acres = props.AcresBurned || 0;
      const containment = props.PercentContained || 0;
      const isActive = props.IsActive;
      const isFinal = props.Final;
      
      // High severity conditions
      if (!isActive || isFinal) {
        return distance < 5 ? 'Medium' : 'Low'; // Contained fires are less severe
      }
      
      if (acres > 1000 || containment < 25 || distance < 5) {
        return 'High';
      }
      
      if (acres > 100 || containment < 50 || distance < 15) {
        return 'Medium';
      }
      
      return 'Low';
    }
    
    async function fetchNASAEONET(lat, lng, radius) {
      // NASA EONET provides official wildfire events with no authentication required
      const eonetUrl = 'https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&limit=100';
      
      try {
        console.log('NASA EONET API URL:', eonetUrl);
        const response = await fetch(eonetUrl, { timeout: 15000 });
        
        if (!response.ok) {
          throw new Error(`NASA EONET API responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const events = data.events || [];
        
        console.log(`EONET returned ${events.length} total wildfire events`);
        
        // Filter events near the location
        const nearbyFires = [];
        
        for (const event of events) {
          const geometries = event.geometry || [];
          
          for (const geom of geometries) {
            const coords = geom.coordinates;
            if (!coords || coords.length < 2) continue;
            
            const [fireLng, fireLat] = coords; // EONET uses [lng, lat] format
            const distance = calculateDistance(lat, lng, fireLat, fireLng);
            
            if (distance <= radius) {
              nearbyFires.push({
                id: `eonet_${event.id}`,
                name: event.title,
                location: [fireLat, fireLng],
                acres: 0, // EONET doesn't provide acre data
                containment: 0, // EONET doesn't provide containment data
                distance: Math.round(distance * 10) / 10,
                severity: distance < 10 ? 'High' : distance < 25 ? 'Medium' : 'Low',
                cause: 'Official Event',
                category: 'Wildfire',
                cost: 0,
                discoveryDate: geom.date || new Date().toISOString(),
                description: event.description || '',
                link: event.link || '',
                source: 'NASA EONET',
                type: geom.type || 'Point',
                rawData: event
              });
            }
          }
        }
        
        // Remove duplicates (same event ID) and keep closest
        const uniqueFires = nearbyFires.reduce((acc, fire) => {
          const existing = acc.find(f => f.id === fire.id);
          if (!existing || fire.distance < existing.distance) {
            return [...acc.filter(f => f.id !== fire.id), fire];
          }
          return acc;
        }, []);
        
        console.log(`EONET found ${uniqueFires.length} fires within ${radius} miles`);
        return uniqueFires.sort((a, b) => a.distance - b.distance);
        
      } catch (error) {
        console.error('NASA EONET API failed:', error.message);
        throw error;
      }
    }
    
    async function fetchNIFCPublic(lat, lng, radius) {
      // NIFC Public Active Incidents (no authentication required)
      const nifcUrl = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/EGP_Active_Incidents_Public_view/FeatureServer/0/query';
      
      // Use string bbox format like FIRMS sample
      const delta = Math.max(0.5, radius / 69);
      const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
      
      const params = new URLSearchParams({
        where: "1=1",
        geometry: bbox,
        geometryType: "esriGeometryEnvelope",
        inSR: "4326",
        outSR: "4326",
        outFields: "*",
        f: "json"
      });
      
      try {
        const response = await fetch(`${nifcUrl}?${params}`, { timeout: 15000 });
        
        if (!response.ok) {
          throw new Error(`NIFC Public API responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(`NIFC Public API error: ${data.error.message || 'Unknown error'}`);
        }
        
        if (data.features && data.features.length > 0) {
          const fires = data.features.map((feature, index) => {
            const attrs = feature.attributes;
            const geometry = feature.geometry;
            
            // Try to get coordinates from centroid or geometry
            const fireLat = parseFloat(attrs.centroid_lat) || geometry?.y || lat;
            const fireLng = parseFloat(attrs.centroid_long) || geometry?.x || lng;
            const distance = calculateDistance(lat, lng, fireLat, fireLng);
            
            return {
              id: `nifc_public_${attrs.Id || attrs.OBJECTID || index + 1}`,
              name: attrs.IncidentName || attrs.FireName || attrs.Name || 'NIFC Active Incident',
              location: [fireLat, fireLng],
              acres: attrs.acres || attrs.TotalAcres || 0,
              containment: attrs.PercentContained || 0,
              distance: Math.round(distance * 10) / 10,
              severity: distance < 10 ? 'High' : distance < 25 ? 'Medium' : 'Low',
              cause: attrs.FireCause || 'Unknown',
              category: 'Active Incident',
              cost: 0,
              discoveryDate: attrs.StartDate || new Date().toISOString(),
              agency: attrs.GACC || 'NIFC',
              rawData: attrs
            };
          }).filter(fire => fire.distance <= radius);
          
          console.log(`NIFC Public found ${fires.length} incidents within ${radius} miles`);
          return fires.sort((a, b) => a.distance - b.distance);
        }
        
        return [];
        
      } catch (error) {
        console.error('NIFC Public API failed:', error.message);
        throw error;
      }
    }
    
    async function fetchNIFCData(lat, lng, radius) {
      // Try multiple NIFC endpoints - some may not require tokens
      const nifcEndpoints = [
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Current_WildlandFire_Locations/FeatureServer/0/query',
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Public_Wildfire_Locations_Current/FeatureServer/0/query',
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Current_Wildland_Fire_Locations/FeatureServer/0/query'
      ];
      
      for (const nifcUrl of nifcEndpoints) {
        try {
          return await tryNIFCEndpoint(nifcUrl, lat, lng, radius);
        } catch (error) {
          console.warn(`NIFC endpoint failed: ${nifcUrl}`, error.message);
          continue;
        }
      }
      
      throw new Error('All NIFC endpoints failed');
    }
    
    async function tryNIFCEndpoint(nifcUrl, lat, lng, radius) {
      
      // Get ArcGIS token for NIFC services
      const arcgisToken = await authService.ensureValidArcGISToken();
      
      // Create envelope geometry for better spatial query
      const radiusDegrees = radius / 69; // Convert miles to degrees
      const envelope = {
        xmin: lng - radiusDegrees,
        ymin: lat - radiusDegrees,
        xmax: lng + radiusDegrees,
        ymax: lat + radiusDegrees,
        spatialReference: { wkid: 4326 }
      };
      
      const params = new URLSearchParams({
        where: "1=1",
        outFields: "*", // Get all fields to see what's available
        geometry: JSON.stringify(envelope),
        geometryType: "esriGeometryEnvelope",
        inSR: "4326",
        spatialRel: "esriSpatialRelIntersects",
        outSR: "4326",
        returnGeometry: "true",
        f: "json"
      });
      
      // Only add token if available
      if (arcgisToken) {
        params.append('token', arcgisToken);
      }

      const response = await fetch(`${nifcUrl}?${params}`, { timeout: 15000 });
      
      if (!response.ok) {
        throw new Error(`NIFC API responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('NIFC Response:', JSON.stringify(data, null, 2)); // Debug log
      
      if (data.error) {
        throw new Error(`NIFC API error: ${data.error.message || 'Unknown error'}`);
      }
      
      if (data.features && data.features.length > 0) {
        return data.features.map((feature, index) => {
          const attrs = feature.attributes;
          const geometry = feature.geometry;
          
          // Try multiple field names for coordinates
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
            severity: calculateSeverity(attrs, distance),
            cause: attrs.FireCause || attrs.CAUSE || 'Unknown',
            category: attrs.IncidentTypeCategory || attrs.TYPE || 'Wildfire',
            cost: attrs.EstimatedCostToDate || 0,
            discoveryDate: attrs.FireDiscoveryDateTime || attrs.DATE_TIME || new Date().toISOString(),
            rawData: attrs // Include raw data for debugging
          };
        })
        .filter(fire => fire.distance <= radius) // Filter by radius
        .sort((a, b) => a.distance - b.distance);
      }
      
      return [];
    }
    
    async function fetchNASAFIRMS(lat, lng, radius) {
      // NASA FIRMS using CSV API with MAP_KEY authentication
      const mapKey = authService.getFirmsMapKey();
      
      if (!mapKey) {
        throw new Error('NASA FIRMS MAP_KEY not configured - skipping satellite data');
      }
      
      // Create bounding box - convert radius from miles to degrees
      const delta = Math.max(0.5, radius / 69); // Convert miles to degrees, minimum 0.5°
      const west = lng - delta;
      const south = lat - delta;
      const east = lng + delta;
      const north = lat + delta;
      
      // FIRMS area API format: /csv/[MAP_KEY]/[SOURCE]/[AREA]/[DAY_RANGE]
      const firmsUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/VIIRS_SNPP_NRT/${west},${south},${east},${north}/3`;
      
      try {
        console.log('FIRMS CSV API URL:', firmsUrl.substring(0, 100) + '...');
        const response = await fetch(firmsUrl, { timeout: 15000 });
        
        if (!response.ok) {
          throw new Error(`NASA FIRMS API responded with ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log(`FIRMS CSV response length: ${csvText.length} characters`);
        
        // Parse CSV to JSON
        const lines = csvText.trim().split('\n');
        if (lines.length <= 1) {
          return []; // No data or only header
        }
        
        const headers = lines[0].split(',');
        const fires = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          const fireData = {};
          headers.forEach((header, index) => {
            fireData[header.trim()] = values[index]?.trim();
          });
          
          // Convert to expected format
          const fireLat = parseFloat(fireData.latitude);
          const fireLng = parseFloat(fireData.longitude);
          
          if (!fireLat || !fireLng) continue;
          
          const distance = calculateDistance(lat, lng, fireLat, fireLng);
          
          // Only include fires within the specified radius
          if (distance <= radius) {
            const fire = {
              id: `firms_${fireData.track || 'unknown'}_${fireLat.toFixed(4)}_${fireLng.toFixed(4)}_${i}`,
              name: `VIIRS Fire Detection ${fires.length + 1}`,
              location: [fireLat, fireLng],
              acres: Math.max(1, Math.round((parseFloat(fireData.frp) || 50) / 5)), // FRP to acres estimation
              containment: 0, // NASA FIRMS doesn't provide containment
              distance: Math.round(distance * 10) / 10,
              severity: (parseFloat(fireData.confidence) || 0) > 80 ? 'High' : (parseFloat(fireData.confidence) || 0) > 50 ? 'Medium' : 'Low',
              cause: 'Detected by Satellite',
              category: 'Active Fire',
              cost: 0,
              discoveryDate: fireData.acq_date ? `${fireData.acq_date}T${fireData.acq_time || '1200'}:00Z` : new Date().toISOString(),
              confidence: parseFloat(fireData.confidence) || 0,
              brightness: parseFloat(fireData.bright_ti4) || parseFloat(fireData.brightness) || 0,
              frp: parseFloat(fireData.frp) || 0,
              satellite: fireData.satellite || 'VIIRS',
              rawData: fireData // Include raw data for debugging
            };
            fires.push(fire);
          }
        }
        
        console.log(`FIRMS found ${fires.length} fires within ${radius} miles`);
        return fires.sort((a, b) => a.distance - b.distance);
        
      } catch (error) {
        console.error('NASA FIRMS CSV API failed:', error.message);
        throw error; // Re-throw to let caller handle
      }
    }
    
    async function fetchCalFireData(lat, lng, radius) {
      // CalFire ArcGIS REST Services
      const calfireUrl = 'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Fire_Perimeters/FeatureServer/0/query';
      
      // Create envelope geometry for CalFire
      const radiusDegrees = radius / 69;
      const envelope = {
        xmin: lng - radiusDegrees,
        ymin: lat - radiusDegrees,
        xmax: lng + radiusDegrees,
        ymax: lat + radiusDegrees
      };
      
      const params = new URLSearchParams({
        where: "FIRE_YEAR >= 2024", // Current year fires
        outFields: "*", // Get all fields
        geometry: JSON.stringify(envelope),
        geometryType: "esriGeometryEnvelope",
        inSR: "4326",
        spatialRel: "esriSpatialRelIntersects",
        outSR: "4326",
        returnGeometry: "true",
        f: "json"
      });

      const response = await fetch(`${calfireUrl}?${params}`, { timeout: 15000 });
      
      if (!response.ok) {
        throw new Error(`CalFire API responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('CalFire Response:', JSON.stringify(data, null, 2)); // Debug log
      
      if (data.error) {
        throw new Error(`CalFire API error: ${data.error.message || 'Unknown error'}`);
      }
      
      if (data.features && data.features.length > 0) {
        return data.features.map((feature, index) => {
          const attrs = feature.attributes;
          const geometry = feature.geometry;
          
          // Calculate centroid for polygon geometry
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
            containment: acres > 1000 ? 75 : 95, // Estimate based on size
            distance: Math.round(distance * 10) / 10,
            severity: acres > 10000 ? 'High' : acres > 1000 ? 'Medium' : 'Low',
            cause: attrs.CAUSE || 'Unknown',
            category: 'Historical Fire',
            cost: 0,
            discoveryDate: attrs.ALARM_DATE || new Date().toISOString(),
            agency: attrs.AGENCY,
            fireYear: attrs.FIRE_YEAR
          };
        }).sort((a, b) => a.distance - b.distance);
      }
      
      return [];
    }
    
    const result = fires;
    fires = result.fires || [];
    const dataSource = result.source || 'unknown';
    const errors = result.errors || [];
    const errorMessage = result.message;

    res.json({
      success: true,
      fires: fires,
      metadata: {
        userLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
        searchRadius: parseFloat(radius),
        count: fires.length,
        timestamp: new Date().toISOString(),
        source: dataSource,
        dataSource: getDataSourceDisplayName(dataSource),
        lastUpdated: new Date().toISOString(),
        disclaimer: fires.length === 0 ? (errorMessage || 'No active fires detected in search area') : `${fires.length} active fire(s) found`,
        apiEndpoint: getApiEndpoint(dataSource),
        errors: errors.length > 0 ? errors : undefined,
        hasErrors: errors.length > 0
      }
    });
    
    function getDataSourceDisplayName(source) {
      switch(source) {
        case 'CAL-FIRE-GeoJSON': return 'California Department of Forestry and Fire Protection (CAL FIRE) - Official Incidents';
        case 'NASA-EONET': return 'NASA Earth Observing System Data and Information System (EONET)';
        case 'NIFC-Public': return 'National Interagency Fire Center Public Active Incidents';
        case 'NASA-FIRMS': return 'NASA Fire Information for Resource Management System (FIRMS)';
        case 'CalFire': return 'California Department of Forestry and Fire Protection (CalFire) - Historical';
        case 'NIFC': return 'National Interagency Fire Center (NIFC)';
        case 'no-data': return 'No Data Available';
        default: return 'Multiple Sources';
      }
    }
    
    function getApiEndpoint(source) {
      switch(source) {
        case 'CAL-FIRE-GeoJSON': return 'incidents.fire.ca.gov/umbraco/api/IncidentApi/GeoJsonList';
        case 'NASA-EONET': return 'eonet.gsfc.nasa.gov/api/v3/events';
        case 'NIFC-Public': return 'services3.arcgis.com/T4QMspbfLg3qTGWY/EGP_Active_Incidents_Public_view';
        case 'NASA-FIRMS': return 'firms.modaps.eosdis.nasa.gov/api/area/csv';
        case 'CalFire': return 'services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Fire_Perimeters';
        case 'NIFC': return 'services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Current_WildlandFire_Locations';
        default: return 'fallback';
      }
    }


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

    function calculateSeverity(attributes, distance) {
      const acres = attributes.DailyAcres || 0;
      const containment = attributes.PercentContained || 0;
      
      if (acres > 1000 || containment < 25 || distance < 5) {
        return 'High';
      }
      
      if (acres > 100 || containment < 50 || distance < 15) {
        return 'Medium';
      }
      
      return 'Low';
    }


  } catch (error) {
    console.error('Fire data error:', error);
    res.status(500).json({
      error: 'Failed to fetch fire data',
      message: error.message
    });
  }
});

// Get specific fire details
router.get('/:fireId', async (req, res) => {
  try {
    const { fireId } = req.params;
    
    // Mock detailed fire data
    const mockFireDetail = {
      id: parseInt(fireId),
      name: 'Griffith Park Fire',
      location: [34.1365, -118.2942],
      acres: 125,
      containment: 15,
      severity: 'Medium',
      cause: 'Under Investigation',
      category: 'Wildfire',
      cost: 2500000,
      discoveryDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      details: {
        personnel: 250,
        engines: 15,
        helicopters: 3,
        evacuations: 0,
        structures: {
          threatened: 12,
          destroyed: 0,
          damaged: 1
        },
        weather: {
          temperature: 78,
          humidity: 25,
          windSpeed: 15,
          windDirection: 'SW'
        }
      }
    };

    res.json({
      success: true,
      fire: mockFireDetail,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fire detail error:', error);
    res.status(500).json({
      error: 'Failed to fetch fire details',
      message: error.message
    });
  }
});

export default router;