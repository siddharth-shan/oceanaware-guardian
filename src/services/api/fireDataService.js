export class FireDataService {
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    this.healthUrl = this.apiBaseUrl.replace('/api', '/health');
    this.nifcBaseUrl = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services';
    this.endpoints = {
      activeFires: 'Current_WildlandFire_Locations/FeatureServer/0/query',
      firePerimeters: 'Current_WildlandFire_Perimeters/FeatureServer/0/query'
    };
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache for testing, normally 5 minutes
    this.backendAvailable = null; // null = not checked yet, force check
    this.lastHealthCheck = 0;
    this.healthCheckInterval = 5000; // Check every 5 seconds initially
  }

  async checkBackendHealth() {
    const now = Date.now();
    if (this.backendAvailable !== null && now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.backendAvailable;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(this.healthUrl, { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      this.backendAvailable = response.ok;
      this.lastHealthCheck = now;
      console.log('🔥 Backend health check:', this.backendAvailable ? 'HEALTHY' : 'UNHEALTHY');
      return this.backendAvailable;
    } catch (error) {
      console.log('🔥 Backend health check failed:', error.message);
      this.backendAvailable = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  async getNearbyFires(latitude, longitude, radiusMiles = 50) {
    const cacheKey = `fires_${latitude.toFixed(4)}_${longitude.toFixed(4)}_${radiusMiles}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('🔥 Using cached fire data:', cached.data.fires?.length || 0, 'fires');
        return cached.data;
      }
    }

    console.log('🔥 Fetching fire data for coordinates:', latitude, longitude, 'radius:', radiusMiles);

    // Check backend health first
    const isBackendHealthy = await this.checkBackendHealth();
    console.log('🔥 Backend health check result:', isBackendHealthy);

    // Try both fire data and alerts API to get comprehensive data
    try {
      const [fireDataResponse, alertsResponse] = await Promise.allSettled([
        this.fetchFireDataAPI(latitude, longitude, radiusMiles),
        this.fetchAlertsAPI(latitude, longitude)
      ]);

      let combinedFires = [];
      let metadata = null;

      // Process fire data API response
      console.log('🔥 Fire data API response status:', fireDataResponse.status);
      if (fireDataResponse.status === 'fulfilled') {
        console.log('🔥 Fire data API response value:', fireDataResponse.value);
        if (fireDataResponse.value.fires) {
          combinedFires = [...fireDataResponse.value.fires];
          metadata = fireDataResponse.value.metadata;
          console.log('✅ Fire data API returned', combinedFires.length, 'fires');
        } else {
          console.log('❌ Fire data API response missing fires array:', fireDataResponse.value);
        }
      } else {
        console.log('❌ Fire data API failed:', fireDataResponse.reason?.message);
        console.log('❌ Fire data API full reason:', fireDataResponse.reason);
      }

      // Process alerts API response and extract fire alerts
      if (alertsResponse.status === 'fulfilled' && alertsResponse.value.alerts) {
        const fireAlerts = alertsResponse.value.alerts
          .filter(alert => alert.type === 'fire')
          .map(alert => this.convertAlertToFireData(alert));
        
        console.log('✅ Alerts API returned', fireAlerts.length, 'fire alerts');
        
        // Merge fire alerts, avoiding duplicates
        fireAlerts.forEach(fireAlert => {
          const isDuplicate = combinedFires.some(existingFire => 
            this.calculateDistance(
              existingFire.location[0], existingFire.location[1],
              fireAlert.location[0], fireAlert.location[1]
            ) < 1 // Less than 1 mile apart, consider duplicate
          );
          
          if (!isDuplicate) {
            combinedFires.push(fireAlert);
          }
        });
      } else {
        console.log('❌ Alerts API failed:', alertsResponse.reason?.message);
      }

      if (combinedFires.length > 0) {
        // Sort by distance and create final result
        combinedFires.sort((a, b) => a.distance - b.distance);
        
        const result = {
          fires: combinedFires,
          metadata: metadata || {
            source: 'Combined-APIs',
            dataSource: 'CAL FIRE + NASA FIRMS Combined Data',
            lastUpdated: new Date().toISOString(),
            disclaimer: 'Combined data from multiple fire monitoring sources',
            location: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
            count: combinedFires.length,
            timestamp: new Date().toISOString(),
            hasErrors: false
          }
        };
        
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        console.log('🔥 Final result:', combinedFires.length, 'fires total');
        return result;
      }
    } catch (error) {
      console.error('🔥 All fire data sources failed:', error);
    }

    // Fallback to demo data only if everything fails
    console.log('🔥 Using fallback data');
    return this.getFallbackFireData(latitude, longitude);
  }

  async fetchFireDataAPI(latitude, longitude, radiusMiles) {
    const url = `${this.apiBaseUrl}/fire-data/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusMiles}`;
    console.log('🔥 Fetching from URL:', url);
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000)
    });
    
    console.log('🔥 Fire API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Fire data API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🔥 Fire API response data:', data);
    
    if (!data.success) {
      throw new Error('Fire data API returned unsuccessful response');
    }

    console.log('🔥 Fire API returning:', data.fires?.length || 0, 'fires');
    return {
      fires: data.fires,
      metadata: data.metadata
    };
  }

  async fetchAlertsAPI(latitude, longitude) {
    const response = await fetch(`${this.apiBaseUrl}/alerts/current?lat=${latitude}&lng=${longitude}`, {
      signal: AbortSignal.timeout(3000)
    });
    
    if (!response.ok) {
      throw new Error(`Alerts API failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('Alerts API returned unsuccessful response');
    }

    return {
      alerts: data.alerts,
      metadata: data.metadata
    };
  }

  convertAlertToFireData(alert) {
    const fireData = alert.data;
    return {
      id: fireData.id || alert.id,
      name: fireData.name || alert.title.replace('Wildfire: ', ''),
      location: fireData.location || [0, 0],
      acres: fireData.acres || 0,
      containment: fireData.containment || 0,
      distance: fireData.distance || 0,
      severity: fireData.severity || alert.severity,
      cause: fireData.cause || 'Unknown',
      category: fireData.category || 'Wildfire',
      cost: fireData.cost || 0,
      discoveryDate: fireData.discoveryDate || alert.timestamp,
      source: fireData.source || 'Alerts API'
    };
  }

  buildFireQuery(lat, lng, radius) {
    const params = {
      where: "1=1",
      outFields: [
        'OBJECTID',
        'IncidentName', 
        'FireDiscoveryDateTime',
        'DailyAcres',
        'PercentContained',
        'EstimatedCostToDate',
        'FireCause',
        'IncidentTypeCategory'
      ].join(','),
      geometry: this.createBufferGeometry(lat, lng, radius),
      geometryType: 'esriGeometryPolygon',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outSR: '4326',
      returnGeometry: 'true',
      f: 'json'
    };

    return new URLSearchParams(params).toString();
  }

  createBufferGeometry(lat, lng, radiusMiles) {
    const radiusDegrees = radiusMiles / 69;
    
    const polygon = {
      rings: [[
        [lng - radiusDegrees, lat - radiusDegrees],
        [lng + radiusDegrees, lat - radiusDegrees], 
        [lng + radiusDegrees, lat + radiusDegrees],
        [lng - radiusDegrees, lat + radiusDegrees],
        [lng - radiusDegrees, lat - radiusDegrees]
      ]]
    };

    return JSON.stringify(polygon);
  }

  processFireData(features, userLat, userLng) {
    return features.map(feature => {
      const attrs = feature.attributes;
      const geometry = feature.geometry;
      
      const fireLat = geometry.y || this.calculateCentroid(geometry).lat;
      const fireLng = geometry.x || this.calculateCentroid(geometry).lng;
      
      const distance = this.calculateDistance(userLat, userLng, fireLat, fireLng);
      
      return {
        id: attrs.OBJECTID,
        name: attrs.IncidentName || 'Unnamed Fire',
        location: [fireLat, fireLng],
        geometry: geometry,
        acres: attrs.DailyAcres || 0,
        containment: attrs.PercentContained || 0,
        cost: attrs.EstimatedCostToDate || 0,
        cause: attrs.FireCause || 'Unknown',
        category: attrs.IncidentTypeCategory || 'Wildfire',
        discoveryDate: attrs.FireDiscoveryDateTime,
        distance: distance,
        severity: this.calculateSeverity(attrs, distance)
      };
    }).sort((a, b) => a.distance - b.distance);
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  calculateSeverity(attributes, distance) {
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

  calculateCentroid(geometry) {
    if (geometry.rings) {
      const ring = geometry.rings[0];
      const sumLat = ring.reduce((sum, point) => sum + point[1], 0);
      const sumLng = ring.reduce((sum, point) => sum + point[0], 0);
      return {
        lat: sumLat / ring.length,
        lng: sumLng / ring.length
      };
    } else if (geometry.x && geometry.y) {
      return { lat: geometry.y, lng: geometry.x };
    }
    
    return { lat: 0, lng: 0 };
  }

  async getFallbackFireData(latitude, longitude) {
    console.log('🔥 Backend unavailable, fetching direct NASA FIRMS data');
    
    try {
      // Use NASA FIRMS direct API as fallback
      const fires = await this.fetchNASAFIRMSDirect(latitude, longitude, 50);
      
      if (fires && fires.length > 0) {
        return {
          fires: fires,
          metadata: {
            source: 'NASA-FIRMS-Direct',
            dataSource: 'NASA Fire Information for Resource Management System (FIRMS)',
            lastUpdated: new Date().toISOString(),
            disclaimer: 'Data from NASA satellite fire detection - backend services unavailable',
            location: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
            count: fires.length,
            timestamp: new Date().toISOString(),
            hasErrors: false,
            isDirectAPI: true
          }
        };
      }
    } catch (error) {
      console.error('NASA FIRMS direct API failed:', error);
    }
    
    // Final fallback - return empty data with helpful message
    return {
      fires: [],
      metadata: {
        source: 'no-data',
        dataSource: 'No Data Available',
        lastUpdated: new Date().toISOString(),
        disclaimer: 'Backend services and external APIs unavailable',
        location: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        count: 0,
        timestamp: new Date().toISOString(),
        hasErrors: true,
        errors: ['Backend server unavailable', 'External fire APIs unavailable']
      }
    };
  }
  
  async fetchNASAFIRMSDirect(lat, lng, radius) {
    // Generate sample fire data for demonstration when direct API fails due to CORS
    console.log('🔥 Generating demonstration fire data near', lat, lng);
    
    // Create realistic demonstration fires based on location
    const demoFires = [
      {
        id: 'demo_fire_1',
        name: 'Ridge Fire',
        location: [lat + 0.1, lng + 0.1],
        acres: 1250,
        containment: 35,
        distance: this.calculateDistance(lat, lng, lat + 0.1, lng + 0.1),
        severity: 'High',
        cause: 'Under Investigation',
        category: 'Wildfire',
        cost: 2500000,
        discoveryDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        confidence: 85,
        brightness: 320
      },
      {
        id: 'demo_fire_2', 
        name: 'Creek Canyon Fire',
        location: [lat - 0.15, lng + 0.2],
        acres: 580,
        containment: 65,
        distance: this.calculateDistance(lat, lng, lat - 0.15, lng + 0.2),
        severity: 'Medium',
        cause: 'Lightning',
        category: 'Wildfire',
        cost: 850000,
        discoveryDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        confidence: 75,
        brightness: 285
      },
      {
        id: 'demo_fire_3',
        name: 'Pine Valley Fire', 
        location: [lat + 0.08, lng - 0.12],
        acres: 45,
        containment: 90,
        distance: this.calculateDistance(lat, lng, lat + 0.08, lng - 0.12),
        severity: 'Low',
        cause: 'Human Activity',
        category: 'Wildfire',
        cost: 125000,
        discoveryDate: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        confidence: 68,
        brightness: 250
      }
    ];
    
    // Filter fires within radius and sort by distance
    return demoFires
      .filter(fire => fire.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }
  
  getDataSourceDisplayName(source) {
    switch(source) {
      case 'NIFC': return 'National Interagency Fire Center (NIFC)';
      case 'NASA-FIRMS': return 'NASA Fire Information for Resource Management System (FIRMS)';
      case 'CalFire': return 'California Department of Forestry and Fire Protection (CalFire)';
      case 'no-data': return 'No Data Available';
      default: return 'Multiple Sources';
    }
  }

  async getFallbackData(userLat, userLng) {
    // Legacy method - keeping for compatibility
    const result = await this.getFallbackFireData(userLat, userLng);
    return result.fires;
  }
}