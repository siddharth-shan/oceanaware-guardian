/**
 * Location Utilities for Emergency Applications
 * Provides user-friendly location display with reverse geocoding fallbacks
 */

// Cache for reverse geocoding results to improve performance and reduce API calls
const locationCache = new Map();

// Regional boundaries for California (approximate)
const californiaRegions = {
  // Los Angeles area
  losAngeles: {
    bounds: { north: 34.5, south: 33.7, east: -117.6, west: -118.7 },
    name: "Los Angeles area",
    county: "Los Angeles County"
  },
  // Long Beach area  
  longBeach: {
    bounds: { north: 33.9, south: 33.7, east: -118.0, west: -118.3 },
    name: "Long Beach area",
    county: "Los Angeles County"
  },
  // Orange County
  orangeCounty: {
    bounds: { north: 33.95, south: 33.3, east: -117.4, west: -118.1 },
    name: "Orange County area",
    county: "Orange County"
  },
  // San Diego
  sanDiego: {
    bounds: { north: 33.0, south: 32.5, east: -116.9, west: -117.3 },
    name: "San Diego area", 
    county: "San Diego County"
  },
  // San Francisco Bay Area
  bayArea: {
    bounds: { north: 38.0, south: 37.2, east: -121.5, west: -123.0 },
    name: "San Francisco Bay area",
    county: "Bay Area"
  },
  // Central Valley
  centralValley: {
    bounds: { north: 37.5, south: 35.0, east: -118.5, west: -121.5 },
    name: "Central Valley area",
    county: "Central California"
  }
};

/**
 * Get user-friendly location name from coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} regionName - Optional known region name
 * @returns {Promise<string>} User-friendly location name
 */
export async function getDisplayLocation(lat, lng, regionName = null) {
  // Use known region name if available and not "Unknown Area"
  if (regionName && regionName !== 'Unknown Area') {
    return regionName;
  }

  // Check cache first
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey);
  }

  try {
    // Try reverse geocoding first
    const reverseGeocodedName = await reverseGeocode(lat, lng);
    if (reverseGeocodedName) {
      locationCache.set(cacheKey, reverseGeocodedName);
      return reverseGeocodedName;
    }
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
  }

  // Fallback to regional matching
  const regionalName = getRegionalName(lat, lng);
  if (regionalName) {
    locationCache.set(cacheKey, regionalName);
    return regionalName;
  }

  // Final fallback with better coordinate display
  const fallbackName = `${getCardinalDirection(lat, lng)} California`;
  locationCache.set(cacheKey, fallbackName);
  return fallbackName;
}

/**
 * Reverse geocode coordinates to location name using OpenStreetMap Nominatim
 * @param {number} lat - Latitude 
 * @param {number} lng - Longitude
 * @returns {Promise<string|null>} Location name or null if failed
 */
async function reverseGeocode(lat, lng) {
  try {
    // Use OpenStreetMap Nominatim (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&extratags=1`,
      {
        headers: {
          'User-Agent': 'EcoQuest-Wildfire-Watch/1.0'
        }
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (data && data.address) {
      const address = data.address;
      
      // Priority hierarchy for location names
      if (address.city) {
        return `${address.city} area`;
      }
      if (address.town) {
        return `${address.town} area`;
      }
      if (address.village) {
        return `${address.village} area`;
      }
      if (address.hamlet) {
        return `${address.hamlet} area`;
      }
      if (address.suburb) {
        return `${address.suburb}, ${address.city || address.county || 'CA'}`;
      }
      if (address.neighbourhood) {
        return `${address.neighbourhood}, ${address.city || address.county || 'CA'}`;
      }
      if (address.county) {
        return `${address.county} area`;
      }
      if (address.state) {
        return `${address.state} area`;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Reverse geocoding API failed:', error);
    return null;
  }
}

/**
 * Get regional name from predefined California regions
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude  
 * @returns {string|null} Regional name or null
 */
function getRegionalName(lat, lng) {
  for (const [regionKey, region] of Object.entries(californiaRegions)) {
    const { bounds } = region;
    if (lat >= bounds.south && lat <= bounds.north && 
        lng >= bounds.west && lng <= bounds.east) {
      return region.name;
    }
  }
  return null;
}

/**
 * Get cardinal direction description relative to major California cities
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Cardinal direction description
 */
function getCardinalDirection(lat, lng) {
  // Los Angeles coordinates for reference
  const LA_LAT = 34.0522;
  const LA_LNG = -118.2437;
  
  const latDiff = lat - LA_LAT;
  const lngDiff = lng - LA_LNG;
  
  let direction = '';
  
  // North/South
  if (latDiff > 0.5) {
    direction += 'Northern ';
  } else if (latDiff < -0.5) {
    direction += 'Southern ';
  }
  
  // East/West
  if (lngDiff > 0.5) {
    direction += 'Eastern ';
  } else if (lngDiff < -0.5) {
    direction += 'Western ';
  }
  
  return direction || 'Central ';
}

/**
 * Get detailed location information for emergency context
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<object>} Detailed location info
 */
export async function getDetailedLocationInfo(lat, lng) {
  const displayName = await getDisplayLocation(lat, lng);
  const region = getRegionalName(lat, lng);
  const direction = getCardinalDirection(lat, lng);
  
  return {
    displayName,
    region,
    direction,
    coordinates: `${lat.toFixed(3)}°N, ${Math.abs(lng).toFixed(3)}°W`,
    isCoordinateFallback: !region
  };
}

/**
 * Clear the location cache (useful for testing)
 */
export function clearLocationCache() {
  locationCache.clear();
}

/**
 * Preload common area names for offline use
 * @param {Array} coordinates - Array of {lat, lng} coordinate pairs
 */
export async function preloadLocationNames(coordinates) {
  const promises = coordinates.map(({lat, lng}) => 
    getDisplayLocation(lat, lng).catch(err => 
      console.warn(`Failed to preload location ${lat},${lng}:`, err)
    )
  );
  
  await Promise.allSettled(promises);
  console.log(`🗺️ Preloaded ${locationCache.size} location names`);
}