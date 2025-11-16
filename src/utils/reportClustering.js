/**
 * Report Clustering Utilities
 * Location-based clustering for emergency reports following UX best practices
 */

import { getDisplayLocation } from './locationUtils';

/**
 * Calculate distance between two coordinates in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Group reports by location proximity following UX guidelines
 * @param {Array} reports - Array of report objects
 * @param {Object} options - Clustering options
 * @returns {Array} Array of clusters and individual reports
 */
export async function clusterReportsByLocation(reports, options = {}) {
  const {
    maxDistance = 0.5, // 0.5km radius for clustering
    maxTimeGap = 2 * 60 * 60 * 1000, // 2 hours
    minClusterSize = 2,
    separateCritical = true // Keep critical reports separate
  } = options;

  if (!reports || reports.length === 0) return [];

  // Separate critical reports if configured
  const criticalReports = separateCritical 
    ? reports.filter(r => r.urgentLevel === 'critical')
    : [];
  
  const nonCriticalReports = separateCritical
    ? reports.filter(r => r.urgentLevel !== 'critical') 
    : reports;

  // Process non-critical reports for clustering
  const clusters = [];
  const processedReports = new Set();

  for (let i = 0; i < nonCriticalReports.length; i++) {
    const baseReport = nonCriticalReports[i];
    
    if (processedReports.has(baseReport.id)) continue;
    if (!baseReport.location?.lat || !baseReport.location?.lng) {
      // Individual report without location
      clusters.push({
        type: 'individual',
        report: baseReport,
        id: baseReport.id
      });
      processedReports.add(baseReport.id);
      continue;
    }

    // Find nearby reports
    const nearbyReports = [baseReport];
    const baseTime = new Date(baseReport.timestamp).getTime();

    for (let j = i + 1; j < nonCriticalReports.length; j++) {
      const candidateReport = nonCriticalReports[j];
      
      if (processedReports.has(candidateReport.id)) continue;
      if (!candidateReport.location?.lat || !candidateReport.location?.lng) continue;

      // Check time proximity
      const candidateTime = new Date(candidateReport.timestamp).getTime();
      if (Math.abs(candidateTime - baseTime) > maxTimeGap) continue;

      // Check location proximity
      const distance = calculateDistance(
        baseReport.location.lat, baseReport.location.lng,
        candidateReport.location.lat, candidateReport.location.lng
      );

      if (distance <= maxDistance) {
        nearbyReports.push(candidateReport);
        processedReports.add(candidateReport.id);
      }
    }

    processedReports.add(baseReport.id);

    // Create cluster or individual report
    if (nearbyReports.length >= minClusterSize) {
      const cluster = await createCluster(nearbyReports);
      clusters.push(cluster);
    } else {
      clusters.push({
        type: 'individual',
        report: baseReport,
        id: baseReport.id
      });
    }
  }

  // Add critical reports as individuals at the beginning
  const result = [
    ...criticalReports.map(report => ({
      type: 'critical',
      report,
      id: report.id
    })),
    ...clusters
  ];

  return result;
}

/**
 * Create a cluster object from nearby reports
 */
async function createCluster(reports) {
  // Sort by urgency and recency
  const sortedReports = reports.sort((a, b) => {
    const urgencyOrder = { critical: 4, high: 3, normal: 2, low: 1 };
    const aUrgency = urgencyOrder[a.urgentLevel] || 0;
    const bUrgency = urgencyOrder[b.urgentLevel] || 0;
    
    if (aUrgency !== bUrgency) return bUrgency - aUrgency;
    
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const primaryReport = sortedReports[0];
  const location = primaryReport.location;
  
  // Get display location
  const displayLocation = await getDisplayLocation(
    location.lat, 
    location.lng, 
    location.displayName || location.region
  );

  // Calculate cluster stats
  const reportTypes = {};
  let totalVerifications = 0;
  let highestUrgency = 'low';
  let mostRecentTime = 0;

  const urgencyOrder = { critical: 4, high: 3, normal: 2, low: 1 };
  
  sortedReports.forEach(report => {
    // Count report types
    const typeKey = report.type || 'unknown';
    reportTypes[typeKey] = (reportTypes[typeKey] || 0) + 1;
    
    // Sum verifications
    totalVerifications += report.verificationCount || 0;
    
    // Track highest urgency
    const reportUrgency = urgencyOrder[report.urgentLevel] || 1;
    const currentHighest = urgencyOrder[highestUrgency] || 1;
    if (reportUrgency > currentHighest) {
      highestUrgency = report.urgentLevel;
    }
    
    // Track most recent time
    const reportTime = new Date(report.timestamp).getTime();
    if (reportTime > mostRecentTime) {
      mostRecentTime = reportTime;
    }
  });

  // Create summary text
  const typeEntries = Object.entries(reportTypes);
  const typeSummary = typeEntries
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .slice(0, 3) // Top 3 types
    .map(([type, count]) => {
      const typeLabels = {
        'fire-sighting': '🔥 Fire',
        'fire-spotting': '🔥 Fire', 
        'power-line-down': '⚡ Power',
        'unsafe-conditions': '⚠️ Hazard',
        'road-closure': '🚧 Road'
      };
      const label = typeLabels[type] || type;
      return count > 1 ? `${label} (${count})` : label;
    })
    .join(' • ');

  return {
    type: 'cluster',
    id: `cluster-${primaryReport.id}`,
    location: displayLocation,
    coordinates: location,
    reportCount: sortedReports.length,
    reports: sortedReports,
    primaryReport,
    urgentLevel: highestUrgency,
    totalVerifications,
    mostRecentTime,
    typeSummary,
    reportTypes
  };
}

/**
 * Check if a report should be grouped with critical reports
 */
export function shouldSeparateFromClustering(report) {
  // Always separate critical reports
  if (report.urgentLevel === 'critical') return true;
  
  // Separate highly verified reports
  if ((report.verificationCount || 0) >= 5) return true;
  
  // Separate very recent reports (last 15 minutes)
  const age = Date.now() - new Date(report.timestamp).getTime();
  if (age < 15 * 60 * 1000) return true;
  
  return false;
}

/**
 * Get cluster summary for display
 */
export function getClusterSummary(cluster) {
  if (cluster.type !== 'cluster') return null;
  
  const { reportCount, typeSummary, urgentLevel, mostRecentTime } = cluster;
  
  const timeAgo = formatTimeAgo(mostRecentTime);
  const urgencyLabel = {
    critical: '🚨 CRITICAL',
    high: '⚠️ HIGH', 
    normal: '📢 NORMAL',
    low: '💡 LOW'
  }[urgentLevel] || urgentLevel;
  
  return {
    title: `📍 ${cluster.location} (${reportCount} reports)`,
    subtitle: typeSummary,
    urgency: urgencyLabel,
    timeAgo,
    verifications: cluster.totalVerifications
  };
}

/**
 * Format time ago helper
 */
function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default {
  clusterReportsByLocation,
  calculateDistance,
  shouldSeparateFromClustering,
  getClusterSummary
};