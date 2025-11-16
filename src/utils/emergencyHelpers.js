/**
 * Emergency Helper Utilities
 * Provides emergency-first filtering, sorting, and prioritization logic
 */

// Emergency levels with priority weights
export const EmergencyLevels = {
  CRITICAL: 'critical',
  HIGH: 'high', 
  NORMAL: 'normal',
  LOW: 'low'
};

export const EmergencyWeights = {
  [EmergencyLevels.CRITICAL]: 4,
  [EmergencyLevels.HIGH]: 3,
  [EmergencyLevels.NORMAL]: 2,
  [EmergencyLevels.LOW]: 1
};

// Critical report types that should always be prioritized
export const CriticalReportTypes = [
  'fire-sighting',
  'fire-spotting',
  'need-evac-help',
  'power-line-down',
  'unsafe-conditions'
];

// Emergency status definitions
export const EmergencyStatus = {
  CRISIS: 'crisis',     // Active emergency - simplified UI
  CRITICAL: 'critical', // High alert - priority filtering
  WARNING: 'warning',   // Elevated alert - enhanced monitoring
  WATCH: 'watch',       // Monitor situation - normal operation
  NORMAL: 'normal'      // All clear - standard operation
};

/**
 * Determine emergency level based on reports and conditions
 */
export const calculateEmergencyLevel = (reports = [], alerts = [], conditions = {}) => {
  // Check for active fires or evacuations
  const criticalReports = reports.filter(report => 
    CriticalReportTypes.includes(report.type) && 
    report.urgentLevel === EmergencyLevels.CRITICAL
  );

  // Emergency escalation logic
  if (criticalReports.length >= 3) {
    return EmergencyStatus.CRISIS;
  }
  
  if (criticalReports.length >= 1) {
    return EmergencyStatus.CRITICAL;
  }
  
  const highPriorityReports = reports.filter(report => 
    report.urgentLevel === EmergencyLevels.HIGH
  );
  
  if (highPriorityReports.length >= 2) {
    return EmergencyStatus.WARNING;
  }
  
  if (reports.length > 0) {
    return EmergencyStatus.WATCH;
  }
  
  return EmergencyStatus.NORMAL;
};

/**
 * Emergency-first sorting algorithm
 */
export const sortReportsByEmergency = (reports) => {
  return [...reports].sort((a, b) => {
    // 1. Emergency level priority
    const aWeight = EmergencyWeights[a.urgentLevel] || 0;
    const bWeight = EmergencyWeights[b.urgentLevel] || 0;
    
    if (aWeight !== bWeight) {
      return bWeight - aWeight; // Higher emergency first
    }
    
    // 2. Critical report types
    const aIsCriticalType = CriticalReportTypes.includes(a.type);
    const bIsCriticalType = CriticalReportTypes.includes(b.type);
    
    if (aIsCriticalType && !bIsCriticalType) return -1;
    if (!aIsCriticalType && bIsCriticalType) return 1;
    
    // 3. Verification count (trusted reports first)
    if (a.verificationCount !== b.verificationCount) {
      return (b.verificationCount || 0) - (a.verificationCount || 0);
    }
    
    // 4. Recency (newer reports first)
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
};

/**
 * Filter reports by emergency criteria
 */
export const filterReportsByEmergency = (reports, filters = {}) => {
  const {
    emergencyOnly = false,
    criticalOnly = false,
    recentOnly = false,
    nearbyOnly = false,
    unverifiedOnly = false,
    userLocation = null,
    maxDistance = 10, // km
    maxAge = 24 // hours
  } = filters;

  let filtered = [...reports];

  // Emergency priority filtering
  if (emergencyOnly || criticalOnly) {
    filtered = filtered.filter(report => 
      report.urgentLevel === EmergencyLevels.CRITICAL ||
      (emergencyOnly && report.urgentLevel === EmergencyLevels.HIGH)
    );
  }

  // Recent reports filter
  if (recentOnly) {
    const cutoff = Date.now() - (maxAge * 60 * 60 * 1000);
    filtered = filtered.filter(report => 
      new Date(report.timestamp).getTime() > cutoff
    );
  }

  // Proximity filter
  if (nearbyOnly && userLocation) {
    filtered = filtered.filter(report => {
      if (!report.location) return false;
      const distance = calculateDistance(
        userLocation.lat, userLocation.lng,
        report.location.lat, report.location.lng
      );
      return distance <= maxDistance;
    });
  }

  // Unverified reports filter
  if (unverifiedOnly) {
    filtered = filtered.filter(report => 
      (report.verificationCount || 0) === 0
    );
  }

  return filtered;
};

/**
 * Group reports by emergency priority for display
 */
export const groupReportsByEmergency = (reports) => {
  const grouped = {
    critical: [],
    high: [],
    normal: [],
    low: []
  };

  reports.forEach(report => {
    const level = report.urgentLevel || EmergencyLevels.NORMAL;
    if (grouped[level]) {
      grouped[level].push(report);
    } else {
      grouped.normal.push(report);
    }
  });

  // Sort each group internally
  Object.keys(grouped).forEach(level => {
    grouped[level] = sortReportsByEmergency(grouped[level]);
  });

  return grouped;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * Get emergency alert configuration based on level
 */
export const getEmergencyConfig = (emergencyLevel) => {
  const configs = {
    [EmergencyStatus.CRISIS]: {
      refreshInterval: 15000, // 15 seconds
      showOnlyEmergency: true,
      enableAutoRefresh: true,
      alertColor: 'red',
      alertMessage: '🚨 CRISIS MODE - Emergency Situation Active',
      actions: ['call911', 'evacuate', 'shelter']
    },
    [EmergencyStatus.CRITICAL]: {
      refreshInterval: 30000, // 30 seconds
      showOnlyEmergency: false,
      enableAutoRefresh: true,
      alertColor: 'red',
      alertMessage: '🔥 CRITICAL ALERT - High Priority Reports Active',
      actions: ['monitor', 'prepare', 'coordinate']
    },
    [EmergencyStatus.WARNING]: {
      refreshInterval: 60000, // 1 minute
      showOnlyEmergency: false,
      enableAutoRefresh: true,
      alertColor: 'orange',
      alertMessage: '⚠️ WARNING - Elevated Alert Level',
      actions: ['monitor', 'prepare']
    },
    [EmergencyStatus.WATCH]: {
      refreshInterval: 120000, // 2 minutes
      showOnlyEmergency: false,
      enableAutoRefresh: true,
      alertColor: 'yellow',
      alertMessage: '👁️ WATCH - Monitoring Situation',
      actions: ['monitor']
    },
    [EmergencyStatus.NORMAL]: {
      refreshInterval: 300000, // 5 minutes
      showOnlyEmergency: false,
      enableAutoRefresh: false,
      alertColor: 'green',
      alertMessage: '✅ ALL CLEAR - Normal Operations',
      actions: ['report', 'educate']
    }
  };

  return configs[emergencyLevel] || configs[EmergencyStatus.NORMAL];
};

/**
 * Generate emergency announcement for screen readers
 */
export const generateEmergencyAnnouncement = (emergencyLevel, criticalCount = 0) => {
  const announcements = {
    [EmergencyStatus.CRISIS]: `Crisis mode activated. ${criticalCount} critical emergency reports. Immediate action required.`,
    [EmergencyStatus.CRITICAL]: `Critical alert level. ${criticalCount} high priority reports require attention.`,
    [EmergencyStatus.WARNING]: `Warning level elevated. Enhanced monitoring recommended.`,
    [EmergencyStatus.WATCH]: `Watch status active. Continue monitoring situation.`,
    [EmergencyStatus.NORMAL]: `All clear. Normal operations resumed.`
  };

  return announcements[emergencyLevel] || announcements[EmergencyStatus.NORMAL];
};

/**
 * Determine if report should trigger emergency alert
 */
export const shouldTriggerEmergencyAlert = (report) => {
  return (
    report.urgentLevel === EmergencyLevels.CRITICAL &&
    CriticalReportTypes.includes(report.type) &&
    (report.verificationCount || 0) >= 1 // At least one verification
  );
};

/**
 * Get time-based filtering options
 */
export const getTimeFilterOptions = () => [
  { value: '1h', label: 'Last Hour', hours: 1 },
  { value: '6h', label: 'Last 6 Hours', hours: 6 },
  { value: '24h', label: 'Last 24 Hours', hours: 24 },
  { value: '7d', label: 'Last Week', hours: 168 },
  { value: 'all', label: 'All Reports', hours: null }
];

/**
 * Get proximity filtering options
 */
export const getProximityFilterOptions = () => [
  { value: 1, label: '1 km', distance: 1 },
  { value: 5, label: '5 km', distance: 5 },
  { value: 10, label: '10 km', distance: 10 },
  { value: 25, label: '25 km', distance: 25 },
  { value: 50, label: '50 km', distance: 50 },
  { value: null, label: 'All Areas', distance: null }
];

export default {
  EmergencyLevels,
  EmergencyWeights,
  CriticalReportTypes,
  EmergencyStatus,
  calculateEmergencyLevel,
  sortReportsByEmergency,
  filterReportsByEmergency,
  groupReportsByEmergency,
  calculateDistance,
  getEmergencyConfig,
  generateEmergencyAnnouncement,
  shouldTriggerEmergencyAlert,
  getTimeFilterOptions,
  getProximityFilterOptions
};