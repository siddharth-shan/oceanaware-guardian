/**
 * Ocean Hazard Data Service
 *
 * Integrates with multiple ocean data sources:
 * - NOAA Tides & Currents (Tsunami warnings, sea level)
 * - NASA Earthdata (Sea level rise projections)
 * - USGS Coastal Change (Erosion data)
 * - NOAA Coral Reef Watch (Ocean temperature)
 *
 * Created for Ocean Awareness Contest 2026
 */

// API Configuration
const NOAA_TSUNAMI_API = import.meta.env.VITE_NOAA_TSUNAMI_API || 'https://api.tidesandcurrents.noaa.gov/api/prod/';
const NOAA_CORAL_API = import.meta.env.VITE_NOAA_CORAL_WATCH_API || 'https://coralreefwatch.noaa.gov/product/5km/';
const NASA_SEA_LEVEL_API = import.meta.env.VITE_NASA_SEA_LEVEL_API || 'https://sealevel.nasa.gov/data/';
const USGS_COASTAL_API = import.meta.env.VITE_USGS_COASTAL_API || 'https://coastal.er.usgs.gov/api/';
const NWS_API = import.meta.env.VITE_NWS_API_URL || 'https://api.weather.gov/';

// Cache configuration
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const cache = new Map();

/**
 * Generic cache wrapper for API calls
 */
function withCache(key, fetchFn, duration = CACHE_DURATION) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < duration) {
    return Promise.resolve(cached.data);
  }

  return fetchFn().then(data => {
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}

/**
 * Fetch tsunami warnings from NOAA
 * Uses NOAA CO-OPS (Center for Operational Oceanographic Products and Services)
 */
export async function fetchTsunamiWarnings(location) {
  const cacheKey = `tsunami_${location?.lat}_${location?.lng}`;

  return withCache(cacheKey, async () => {
    try {
      // Find nearest NOAA station
      const station = await findNearestNoaaStation(location);

      if (!station) {
        console.warn('No nearby NOAA station found for tsunami monitoring');
        return {
          active: false,
          warnings: [],
          station: null,
          message: 'No nearby monitoring station available'
        };
      }

      // Fetch water level data (rapid changes can indicate tsunami)
      const waterLevelUrl = `${NOAA_TSUNAMI_API}datagetter?` + new URLSearchParams({
        date: 'latest',
        station: station.id,
        product: 'water_level',
        datum: 'MLLW',
        time_zone: 'gmt',
        units: 'metric',
        format: 'json'
      });

      const response = await fetch(waterLevelUrl);
      if (!response.ok) {
        throw new Error(`NOAA API error: ${response.status}`);
      }

      const data = await response.json();

      // Analyze water level for anomalies
      const warnings = analyzeTsunamiRisk(data, station);

      return {
        active: warnings.length > 0,
        warnings,
        station,
        waterLevel: data.data?.[0],
        lastUpdate: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error fetching tsunami warnings:', error);
      return {
        active: false,
        warnings: [],
        error: error.message,
        useMockData: true
      };
    }
  });
}

/**
 * Fetch sea level rise data from NASA
 */
export async function fetchSeaLevelData(location) {
  const cacheKey = `sea_level_${location?.lat}_${location?.lng}`;

  return withCache(cacheKey, async () => {
    try {
      // Note: NASA sea level API requires authentication
      // For now, we'll use mock data structure
      // TODO: Implement NASA Earthdata authentication

      return {
        current: {
          level: 0.0, // meters above baseline
          trend: 'rising',
          rate: 3.4, // mm/year global average
        },
        projections: {
          '2030': { min: 0.06, max: 0.18, likely: 0.12 }, // meters
          '2050': { min: 0.15, max: 0.45, likely: 0.30 },
          '2100': { min: 0.43, max: 2.01, likely: 1.00 }
        },
        historical: generateHistoricalSeaLevel(),
        location: location,
        source: 'NASA Sea Level Change',
        lastUpdate: new Date().toISOString(),
        useMockData: true // Remove when API is integrated
      };

    } catch (error) {
      console.error('Error fetching sea level data:', error);
      return {
        current: { level: 0, trend: 'unknown', rate: 0 },
        error: error.message
      };
    }
  });
}

/**
 * Fetch coastal erosion data from USGS
 */
export async function fetchCoastalErosion(location) {
  const cacheKey = `erosion_${location?.lat}_${location?.lng}`;

  return withCache(cacheKey, async () => {
    try {
      // Calculate if location is coastal
      const isCoastal = await checkIfCoastal(location);

      if (!isCoastal) {
        return {
          isCoastal: false,
          erosionRate: 0,
          message: 'Location is not in coastal zone'
        };
      }

      // Mock coastal erosion data
      // TODO: Integrate with actual USGS Coastal Change API
      const erosionRate = Math.random() * 2.0; // meters per year
      const vulnerability = calculateErosionVulnerability(erosionRate);

      return {
        isCoastal: true,
        erosionRate: erosionRate.toFixed(2),
        erosionRateUnit: 'meters/year',
        vulnerability,
        historicalData: generateErosionHistory(),
        lastSurvey: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'USGS Coastal Change Hazards',
        useMockData: true
      };

    } catch (error) {
      console.error('Error fetching coastal erosion data:', error);
      return {
        isCoastal: false,
        error: error.message
      };
    }
  });
}

/**
 * Fetch ocean temperature and coral health data
 */
export async function fetchOceanTemperature(location) {
  const cacheKey = `ocean_temp_${location?.lat}_${location?.lng}`;

  return withCache(cacheKey, async () => {
    try {
      // NOAA Coral Reef Watch provides ocean temperature data
      // Using mock data for now

      const currentTemp = 20 + Math.random() * 10; // 20-30°C
      const normalTemp = 23;
      const anomaly = currentTemp - normalTemp;

      return {
        current: parseFloat(currentTemp.toFixed(2)),
        normal: normalTemp,
        anomaly: parseFloat(anomaly.toFixed(2)),
        unit: 'celsius',
        coralBleachingRisk: calculateCoralRisk(anomaly),
        trend: anomaly > 0 ? 'warming' : 'cooling',
        source: 'NOAA Coral Reef Watch',
        lastUpdate: new Date().toISOString(),
        useMockData: true
      };

    } catch (error) {
      console.error('Error fetching ocean temperature:', error);
      return {
        current: null,
        error: error.message
      };
    }
  });
}

/**
 * Fetch marine weather alerts from NWS
 */
export async function fetchMarineAlerts(location) {
  const cacheKey = `marine_alerts_${location?.lat}_${location?.lng}`;

  return withCache(cacheKey, async () => {
    try {
      // NWS API for marine forecasts and alerts
      const pointUrl = `${NWS_API}points/${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;

      const pointResponse = await fetch(pointUrl, {
        headers: {
          'User-Agent': import.meta.env.VITE_NWS_USER_AGENT || 'OceanAwareGuardian/1.0'
        }
      });

      if (!pointResponse.ok) {
        throw new Error(`NWS API error: ${pointResponse.status}`);
      }

      const pointData = await pointResponse.json();

      // Fetch active alerts for this zone
      if (pointData.properties?.forecastZone) {
        const zoneId = pointData.properties.forecastZone.split('/').pop();
        const alertsUrl = `${NWS_API}alerts/active/zone/${zoneId}`;

        const alertsResponse = await fetch(alertsUrl, {
          headers: {
            'User-Agent': import.meta.env.VITE_NWS_USER_AGENT || 'OceanAwareGuardian/1.0'
          }
        });

        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();

          // Filter for marine-related alerts
          const marineAlerts = alertsData.features?.filter(alert => {
            const event = alert.properties?.event?.toLowerCase() || '';
            return event.includes('marine') ||
                   event.includes('coastal') ||
                   event.includes('storm') ||
                   event.includes('surf') ||
                   event.includes('rip current');
          }) || [];

          return {
            active: marineAlerts.length > 0,
            count: marineAlerts.length,
            alerts: marineAlerts.map(alert => ({
              id: alert.id,
              event: alert.properties.event,
              severity: alert.properties.severity,
              urgency: alert.properties.urgency,
              headline: alert.properties.headline,
              description: alert.properties.description,
              instruction: alert.properties.instruction,
              onset: alert.properties.onset,
              expires: alert.properties.expires,
              areas: alert.properties.areaDesc
            })),
            source: 'NOAA National Weather Service',
            lastUpdate: new Date().toISOString()
          };
        }
      }

      return {
        active: false,
        count: 0,
        alerts: [],
        message: 'No marine alerts for this area'
      };

    } catch (error) {
      console.error('Error fetching marine alerts:', error);
      return {
        active: false,
        count: 0,
        alerts: [],
        error: error.message,
        useMockData: true
      };
    }
  });
}

/**
 * Get comprehensive ocean hazard status for a location
 */
export async function getOceanHazardStatus(location) {
  if (!location?.lat || !location?.lng) {
    return {
      error: 'Invalid location',
      hasData: false
    };
  }

  try {
    // Fetch all hazard data in parallel
    const [tsunami, seaLevel, erosion, temperature, marineAlerts] = await Promise.all([
      fetchTsunamiWarnings(location),
      fetchSeaLevelData(location),
      fetchCoastalErosion(location),
      fetchOceanTemperature(location),
      fetchMarineAlerts(location)
    ]);

    // Calculate overall hazard level
    const hazardLevel = calculateOverallHazardLevel({
      tsunami,
      seaLevel,
      erosion,
      temperature,
      marineAlerts
    });

    return {
      location,
      hazardLevel,
      tsunami,
      seaLevel,
      erosion,
      temperature,
      marineAlerts,
      hasData: true,
      lastUpdate: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error getting ocean hazard status:', error);
    return {
      location,
      error: error.message,
      hasData: false
    };
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Find nearest NOAA tide station
 */
async function findNearestNoaaStation(location) {
  // Major NOAA tide stations (sample dataset)
  const stations = [
    { id: '8454000', name: 'Providence, RI', lat: 41.8071, lng: -71.4012 },
    { id: '8518750', name: 'The Battery, NY', lat: 40.7006, lng: -74.0142 },
    { id: '8729108', name: 'Panama City, FL', lat: 30.1516, lng: -85.6667 },
    { id: '9414290', name: 'San Francisco, CA', lat: 37.8063, lng: -122.4659 },
    { id: '9447130', name: 'Seattle, WA', lat: 47.6062, lng: -122.3396 },
    { id: '8720218', name: 'Mayport, FL', lat: 30.3983, lng: -81.4283 },
    { id: '8658120', name: 'Wilmington, NC', lat: 34.2275, lng: -77.9533 },
    { id: '8467150', name: 'Bridgeport, CT', lat: 41.1733, lng: -73.1817 }
  ];

  // Find closest station
  let nearest = null;
  let minDistance = Infinity;

  for (const station of stations) {
    const distance = calculateDistance(
      location.lat, location.lng,
      station.lat, station.lng
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = station;
    }
  }

  return nearest && minDistance < 500 ? nearest : null; // Within 500km
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Analyze water level data for tsunami risk
 */
function analyzeTsunamiRisk(data, station) {
  const warnings = [];

  // Check if water level data exists
  if (!data.data || data.data.length === 0) {
    return warnings;
  }

  // In real implementation, would analyze:
  // - Rapid water level changes
  // - Comparison with predicted tides
  // - Historical anomalies

  // Mock warning for demonstration
  const waterLevel = parseFloat(data.data[0].v);
  if (Math.random() < 0.1) { // 10% chance for demo
    warnings.push({
      type: 'tsunami-watch',
      severity: 'moderate',
      message: 'Unusual water level fluctuations detected',
      station: station.name,
      waterLevel: waterLevel,
      timestamp: new Date().toISOString()
    });
  }

  return warnings;
}

/**
 * Check if location is coastal
 */
async function checkIfCoastal(location) {
  // Simple heuristic: locations near major coastlines
  // In production, would use actual coastal boundary data

  const knownCoastalRegions = [
    { minLat: 24, maxLat: 49, minLng: -125, maxLng: -66 }, // Continental US coasts
    { minLat: 18, maxLat: 22, minLng: -161, maxLng: -154 }, // Hawaii
    { minLat: 55, maxLat: 72, minLng: -169, maxLng: -130 }, // Alaska
  ];

  return knownCoastalRegions.some(region =>
    location.lat >= region.minLat && location.lat <= region.maxLat &&
    location.lng >= region.minLng && location.lng <= region.maxLng
  );
}

/**
 * Calculate erosion vulnerability level
 */
function calculateErosionVulnerability(erosionRate) {
  if (erosionRate < 0.5) return 'low';
  if (erosionRate < 1.0) return 'moderate';
  if (erosionRate < 1.5) return 'high';
  return 'critical';
}

/**
 * Calculate coral bleaching risk from temperature anomaly
 */
function calculateCoralRisk(anomaly) {
  if (anomaly < 1) return 'low';
  if (anomaly < 2) return 'moderate';
  if (anomaly < 3) return 'high';
  return 'severe';
}

/**
 * Calculate overall ocean hazard level
 */
function calculateOverallHazardLevel(hazards) {
  let score = 0;

  // Tsunami warnings (highest priority)
  if (hazards.tsunami?.active) {
    score += 40;
  }

  // Marine alerts
  if (hazards.marineAlerts?.active) {
    const severityScore = hazards.marineAlerts.alerts.reduce((sum, alert) => {
      if (alert.severity === 'Extreme') return sum + 15;
      if (alert.severity === 'Severe') return sum + 10;
      if (alert.severity === 'Moderate') return sum + 5;
      return sum + 2;
    }, 0);
    score += Math.min(severityScore, 30);
  }

  // Coastal erosion
  if (hazards.erosion?.isCoastal) {
    if (hazards.erosion.vulnerability === 'critical') score += 15;
    else if (hazards.erosion.vulnerability === 'high') score += 10;
    else if (hazards.erosion.vulnerability === 'moderate') score += 5;
  }

  // Ocean temperature / coral bleaching
  if (hazards.temperature?.coralBleachingRisk === 'severe') score += 10;
  else if (hazards.temperature?.coralBleachingRisk === 'high') score += 7;
  else if (hazards.temperature?.coralBleachingRisk === 'moderate') score += 4;

  // Sea level rise (long-term concern)
  if (hazards.seaLevel?.current?.trend === 'rising') {
    if (hazards.seaLevel.current.rate > 5) score += 8;
    else if (hazards.seaLevel.current.rate > 3) score += 5;
  }

  // Determine level
  if (score >= 50) return 'critical';
  if (score >= 30) return 'warning';
  if (score >= 15) return 'watch';
  return 'normal';
}

/**
 * Generate historical sea level data (mock)
 */
function generateHistoricalSeaLevel() {
  const years = [];
  const baseYear = 1993;
  const currentYear = new Date().getFullYear();

  for (let year = baseYear; year <= currentYear; year += 2) {
    const yearsElapsed = year - baseYear;
    const level = yearsElapsed * 0.0034; // 3.4mm/year average

    years.push({
      year,
      level: parseFloat(level.toFixed(4)),
      unit: 'meters'
    });
  }

  return years;
}

/**
 * Generate erosion history (mock)
 */
function generateErosionHistory() {
  const years = [];
  const currentYear = new Date().getFullYear();

  for (let year = currentYear - 10; year <= currentYear; year++) {
    years.push({
      year,
      erosionRate: (0.5 + Math.random() * 1.5).toFixed(2),
      unit: 'meters/year'
    });
  }

  return years;
}

/**
 * Clear all cached data
 */
export function clearCache() {
  cache.clear();
  console.log('Ocean hazard cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}
