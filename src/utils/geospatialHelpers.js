/**
 * Geospatial Helpers for Community Report Clustering
 * Optimized for handling hundreds of reports with efficient clustering algorithms
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
           Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
           Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Advanced clustering algorithm for community reports
 * Uses density-based clustering to group nearby reports efficiently
 * @param {Array} reports - Array of report objects with location data
 * @param {number} clusterRadius - Clustering radius in km (default: 1km)
 * @param {number} minReports - Minimum reports per cluster (default: 2)
 * @returns {Array} Array of clusters and standalone reports
 */
export function clusterReportsByLocation(reports, clusterRadius = 1.0, minReports = 2) {
  if (!reports || reports.length === 0) return [];
  
  const clusters = [];
  const processed = new Set();
  
  reports.forEach((report, index) => {
    if (processed.has(index)) return;
    
    // Find all reports within cluster radius
    const nearbyReports = [];
    reports.forEach((otherReport, otherIndex) => {
      if (index === otherIndex || processed.has(otherIndex)) return;
      
      const distance = calculateDistance(
        report.location.lat, report.location.lng,
        otherReport.location.lat, otherReport.location.lng
      );
      
      if (distance <= clusterRadius) {
        nearbyReports.push({ report: otherReport, index: otherIndex, distance });
      }
    });
    
    if (nearbyReports.length >= minReports - 1) {
      // Create cluster
      const clusterReports = [report, ...nearbyReports.map(nr => nr.report)];
      const clusterIndices = [index, ...nearbyReports.map(nr => nr.index)];
      
      // Mark all reports in cluster as processed
      clusterIndices.forEach(idx => processed.add(idx));
      
      // Calculate cluster center (weighted by urgency)
      const cluster = createCluster(clusterReports, clusterRadius);
      clusters.push(cluster);
    } else {
      // Standalone report
      processed.add(index);
      clusters.push({
        id: `standalone_${report.id}`,
        type: 'standalone',
        report: report,
        location: report.location,
        urgentLevel: report.urgentLevel,
        timestamp: report.timestamp,
        count: 1
      });
    }
  });
  
  // Sort by urgency and timestamp
  return sortClustersByPriority(clusters);
}

/**
 * Create a cluster object from multiple reports
 */
function createCluster(reports, radius) {
  const urgencyWeights = { critical: 4, high: 3, normal: 2, low: 1 };
  
  // Calculate weighted center point
  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;
  
  reports.forEach(report => {
    const weight = urgencyWeights[report.urgentLevel] || 1;
    totalWeight += weight;
    weightedLat += report.location.lat * weight;
    weightedLng += report.location.lng * weight;
  });
  
  const centerLat = weightedLat / totalWeight;
  const centerLng = weightedLng / totalWeight;
  
  // Determine highest urgency level
  const urgencyLevels = reports.map(r => r.urgentLevel);
  const highestUrgency = getHighestUrgency(urgencyLevels);
  
  // Group by type for summary
  const typeGroups = {};
  reports.forEach(report => {
    typeGroups[report.type] = (typeGroups[report.type] || 0) + 1;
  });
  
  return {
    id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type: 'cluster',
    location: {
      lat: centerLat,
      lng: centerLng,
      region: reports[0].location.region
    },
    urgentLevel: highestUrgency,
    timestamp: reports.reduce((latest, report) => 
      new Date(report.timestamp) > new Date(latest) ? report.timestamp : latest
    , reports[0].timestamp),
    count: reports.length,
    radius: radius,
    reports: reports,
    typeGroups: typeGroups,
    summary: generateClusterSummary(reports, typeGroups)
  };
}

/**
 * Determine highest urgency level from array
 */
function getHighestUrgency(urgencyLevels) {
  const priorities = { critical: 4, high: 3, normal: 2, low: 1 };
  return urgencyLevels.reduce((highest, current) => 
    priorities[current] > priorities[highest] ? current : highest
  );
}

/**
 * Generate human-readable cluster summary
 */
function generateClusterSummary(reports, typeGroups) {
  const types = Object.keys(typeGroups);
  if (types.length === 1) {
    return `${reports.length} ${types[0].replace('-', ' ')} reports`;
  } else if (types.length === 2) {
    return `${types[0].replace('-', ' ')} and ${types[1].replace('-', ' ')} reports`;
  } else {
    return `${types.length} different types of reports`;
  }
}

/**
 * Sort clusters by priority (urgency first, then count, then recency)
 */
function sortClustersByPriority(clusters) {
  const urgencyOrder = { critical: 4, high: 3, normal: 2, low: 1 };
  
  return clusters.sort((a, b) => {
    // Primary: Urgency level
    const aUrgency = urgencyOrder[a.urgentLevel] || 0;
    const bUrgency = urgencyOrder[b.urgentLevel] || 0;
    if (aUrgency !== bUrgency) return bUrgency - aUrgency;
    
    // Secondary: Report count (for clusters)
    if (a.count !== b.count) return b.count - a.count;
    
    // Tertiary: Recency
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
}

/**
 * Create grid-based clustering for very large datasets (1000+ reports)
 * More efficient than density-based clustering for massive datasets
 * @param {Array} reports - Array of reports
 * @param {number} gridSize - Grid cell size in km (default: 2km)
 * @returns {Array} Grid-based clusters
 */
export function gridBasedClustering(reports, gridSize = 2.0) {
  if (!reports || reports.length === 0) return [];
  
  const grid = new Map();
  
  reports.forEach(report => {
    // Calculate grid cell coordinates
    const cellLat = Math.floor(report.location.lat / (gridSize / 111)); // ~111km per degree
    const cellLng = Math.floor(report.location.lng / (gridSize / 111));
    const cellKey = `${cellLat},${cellLng}`;
    
    if (!grid.has(cellKey)) {
      grid.set(cellKey, []);
    }
    grid.get(cellKey).push(report);
  });
  
  const clusters = [];
  
  grid.forEach((cellReports, cellKey) => {
    if (cellReports.length === 1) {
      // Single report
      clusters.push({
        id: `grid_${cellReports[0].id}`,
        type: 'standalone',
        report: cellReports[0],
        location: cellReports[0].location,
        urgentLevel: cellReports[0].urgentLevel,
        timestamp: cellReports[0].timestamp,
        count: 1
      });
    } else {
      // Multiple reports in grid cell
      const cluster = createCluster(cellReports, gridSize);
      cluster.id = `grid_cluster_${cellKey}`;
      clusters.push(cluster);
    }
  });
  
  return sortClustersByPriority(clusters);
}

/**
 * Adaptive clustering that chooses optimal algorithm based on dataset size
 * @param {Array} reports - Array of reports
 * @param {Object} options - Clustering options
 * @returns {Array} Optimally clustered reports
 */
export function adaptiveClustering(reports, options = {}) {
  const {
    densityRadius = 1.0,
    gridSize = 2.0,
    largeDatasetThreshold = 500
  } = options;
  
  if (!reports || reports.length === 0) return [];
  
  if (reports.length > largeDatasetThreshold) {
    // Use grid-based clustering for large datasets
    console.log(`📊 Using grid-based clustering for ${reports.length} reports`);
    return gridBasedClustering(reports, gridSize);
  } else {
    // Use density-based clustering for smaller datasets  
    console.log(`📊 Using density-based clustering for ${reports.length} reports`);
    return clusterReportsByLocation(reports, densityRadius);
  }
}

/**
 * Calculate optimal viewport bounds for displaying clusters
 * @param {Array} clusters - Array of clusters/reports
 * @param {number} padding - Padding factor (default: 0.1 = 10%)
 * @returns {Object} Bounds with north, south, east, west coordinates
 */
export function calculateViewportBounds(clusters, padding = 0.1) {
  if (!clusters || clusters.length === 0) return null;
  
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  
  clusters.forEach(item => {
    const lat = item.location.lat;
    const lng = item.location.lng;
    
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });
  
  // Add padding
  const latPadding = (maxLat - minLat) * padding;
  const lngPadding = (maxLng - minLng) * padding;
  
  return {
    north: maxLat + latPadding,
    south: minLat - latPadding,
    east: maxLng + lngPadding,
    west: minLng - lngPadding,
    center: {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2
    }
  };
}

/**
 * Filter clusters by emergency level and geographic bounds
 * @param {Array} clusters - Array of clusters
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered clusters
 */
export function filterClusters(clusters, filters = {}) {
  const {
    urgentLevels = null,
    bounds = null,
    types = null,
    maxAge = null,
    emergencyOnly = false
  } = filters;
  
  let filtered = [...clusters];
  
  // Emergency-only filter
  if (emergencyOnly) {
    filtered = filtered.filter(item => 
      item.urgentLevel === 'critical' || item.urgentLevel === 'high'
    );
  }
  
  // Urgency level filter
  if (urgentLevels && urgentLevels.length > 0) {
    filtered = filtered.filter(item => urgentLevels.includes(item.urgentLevel));
  }
  
  // Geographic bounds filter
  if (bounds) {
    filtered = filtered.filter(item => 
      item.location.lat >= bounds.south &&
      item.location.lat <= bounds.north &&
      item.location.lng >= bounds.west &&
      item.location.lng <= bounds.east
    );
  }
  
  // Type filter
  if (types && types.length > 0) {
    filtered = filtered.filter(item => {
      if (item.type === 'standalone') {
        return types.includes(item.report.type);
      } else {
        return types.some(type => item.typeGroups[type] > 0);
      }
    });
  }
  
  // Age filter
  if (maxAge) {
    const cutoffTime = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(item => new Date(item.timestamp) >= cutoffTime);
  }
  
  return filtered;
}