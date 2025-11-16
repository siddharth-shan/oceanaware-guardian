/**
 * Community Reports Hub - Crisis-Optimized Interface
 * Redesigned based on UX review for thousands of emergency reports with emergency-first design
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Users, Shield, AlertTriangle, RefreshCw, Filter, Search, 
  ChevronDown, ChevronUp, MapPin, Clock, Flame, Zap, Eye, X,
  Settings, Grid, List, Map as MapIcon, MoreHorizontal,
  CheckCircle, ExternalLink, Phone, Navigation
} from 'lucide-react';
import { useAuth } from '../../services/auth/AuthContext';
import { useAccessibility } from '../accessibility/AccessibilityProvider';
import CommunityReporting from './CommunityReporting';
import QuickFilters from './QuickFilters';
import ViewModeSelector from './ViewModeSelector';
import ReportsDisplay from './ReportsDisplay';
import { 
  getCommunityReports, 
  getCommunityStatus,
  verifyCommunityReport,
  checkUserVerification 
} from '../../services/community/CommunityService';
import { clusterReportsByLocation } from '../../utils/reportClustering';
import {
  calculateEmergencyLevel,
  sortReportsByEmergency,
  getEmergencyConfig,
  generateEmergencyAnnouncement,
  CriticalReportTypes
} from '../../utils/emergencyHelpers';

/**
 * Crisis-Optimized Community Reports Hub
 * Implements emergency-first design with smart filtering and performance optimization
 */
const CommunityReportsHub = ({ userLocation, emergencyLevel: propEmergencyLevel }) => {
  const { user, isAuthenticated } = useAuth();
  const { speak } = useAccessibility();
  
  // Core data state
  const [reports, setReports] = useState([]);
  const [clusteredReports, setClusteredReports] = useState([]);
  const [communityStats, setCommunityStats] = useState({
    activeUsers: 0,
    safeCount: 0,
    evacuatingCount: 0,
    needHelpCount: 0,
    reportsToday: 0
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userVerifications, setUserVerifications] = useState(new Map());
  const [invalidReportIds, setInvalidReportIds] = useState(new Set());
  const [useLocationClustering, setUseLocationClustering] = useState(false); // TEMPORARILY DISABLED FOR DEBUGGING
  
  // UI state - Crisis-optimized defaults
  const [viewMode, setViewMode] = useState('compact'); // compact, detailed, map, table
  const [showReportForm, setShowReportForm] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'error'|'success'|'warning', message: string }
  
  // Initialize filters with stable default values (no conditional initialization)
  const [activeFilters, setActiveFilters] = useState(() => ({
    priority: [], // Start with no priority filter - show all reports
    timeRange: '7d', // FIXED: Extended to 7 days to show older test reports
    proximity: null, // Start with no proximity filter - show all reports
    verification: 'all',
    reportTypes: [],
    searchQuery: ''
  }));
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Update filters based on props changes using useEffect instead of conditional initialization
  useEffect(() => {
    // Don't automatically set proximity filter - let user choose
    // Only set if explicitly no location available
    if (!userLocation) {
      setActiveFilters(prev => ({
        ...prev,
        proximity: null
      }));
    }
  }, [userLocation]); // Only clear proximity if no location available
  
  // Performance state
  const [displayedReports, setDisplayedReports] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 20;

  // Calculate dynamic emergency level
  const dynamicEmergencyLevel = useMemo(() => {
    if (propEmergencyLevel) return propEmergencyLevel;
    return calculateEmergencyLevel(reports, [], { userLocation });
  }, [propEmergencyLevel, reports, userLocation]);

  const emergencyConfig = getEmergencyConfig(dynamicEmergencyLevel);

  /**
   * Smart report filtering with emergency prioritization
   */
  const filteredReports = useMemo(() => {
    console.log(`🔍 Filtering ${reports.length} reports with filters:`, activeFilters);
    let filtered = [...reports];

    // Search query - high priority
    if (activeFilters.searchQuery.trim()) {
      const query = activeFilters.searchQuery.toLowerCase();
      const beforeCount = filtered.length;
      filtered = filtered.filter(report =>
        report.title?.toLowerCase().includes(query) ||
        report.description?.toLowerCase().includes(query) ||
        report.type?.toLowerCase().includes(query) ||
        report.location?.region?.toLowerCase().includes(query)
      );
      console.log(`🔍 Search filter "${query}": ${beforeCount} → ${filtered.length}`);
    }

    // Priority filtering - emergency first
    if (activeFilters.priority.length > 0) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(report => 
        activeFilters.priority.includes(report.urgentLevel || 'normal')
      );
      console.log(`🔍 Priority filter [${activeFilters.priority.join(', ')}]: ${beforeCount} → ${filtered.length}`);
    } else {
      console.log(`🔍 No priority filter - showing all ${filtered.length} reports`);
    }

    // Time filtering - critical for emergency relevance
    if (activeFilters.timeRange !== 'all') {
      const beforeCount = filtered.length;
      const hours = {
        '1h': 1, '6h': 6, '24h': 24, '72h': 72, '7d': 168
      }[activeFilters.timeRange] || 24;
      
      const cutoff = Date.now() - (hours * 60 * 60 * 1000);
      const cutoffDate = new Date(cutoff);
      console.log(`🔍 Time filter [${activeFilters.timeRange}]: Cutoff = ${cutoffDate.toISOString()}`);
      
      // Debug each report's timestamp
      filtered.forEach((report, index) => {
        const reportTime = new Date(report.timestamp);
        const isValid = reportTime.getTime() > cutoff;
        console.log(`🔍 Report ${index + 1}: ${report.timestamp} -> ${isValid ? 'PASS' : 'FAIL'}`);
      });
      
      filtered = filtered.filter(report => 
        new Date(report.timestamp).getTime() > cutoff
      );
      console.log(`🔍 Time filter [${activeFilters.timeRange}]: ${beforeCount} → ${filtered.length}`);
    }

    // Proximity filtering - location-based emergency response
    if (activeFilters.proximity && userLocation) {
      filtered = filtered.filter(report => {
        if (!report.location?.lat || !report.location?.lng) return false;
        const distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          report.location.lat, report.location.lng
        );
        return distance <= activeFilters.proximity;
      });
    }

    // Verification filtering
    if (activeFilters.verification !== 'all') {
      filtered = filtered.filter(report => {
        const count = report.verificationCount || 0;
        switch (activeFilters.verification) {
          case 'verified': return count >= 1;
          case 'highly-verified': return count >= 3;
          case 'unverified': return count === 0;
          default: return true;
        }
      });
    }

    // Report type filtering
    if (activeFilters.reportTypes.length > 0) {
      filtered = filtered.filter(report => 
        activeFilters.reportTypes.includes(report.type)
      );
    }

    // Emergency-first sorting
    const sorted = sortReportsByEmergency(filtered);
    console.log(`🔍 Final filtered results: ${sorted.length} reports`);
    return sorted;
  }, [reports, activeFilters, userLocation]);

  /**
   * Load user verification status with enhanced error handling and batching
   * Only loads for authenticated users - anonymous users always can verify
   */
  const loadUserVerifications = useCallback(async (reportsList) => {
    // Only load verification status for authenticated users
    const userAuthenticated = typeof isAuthenticated === 'function' ? isAuthenticated() : !!isAuthenticated;
    if (!userAuthenticated || !reportsList || !reportsList.length || !user) {
      // For anonymous users, clear any existing verification data
      if (!userAuthenticated || !user) {
        setUserVerifications(new Map());
      }
      return;
    }
    
    try {
      // Batch verification requests to reduce API calls
      const reportIds = reportsList.map(r => r.id).filter(Boolean);
      if (reportIds.length === 0) return;
      
      // Filter out reports we already have verification data for AND invalid reports
      const needsVerification = reportIds.filter(id => 
        !userVerifications.has(id) && !invalidReportIds.has(id)
      );
      
      if (needsVerification.length === 0) return;
      
      console.log(`🔍 Checking verification status for ${needsVerification.length} reports (skipping ${reportIds.length - needsVerification.length} cached/invalid)`);
      
      // Limit concurrent verification requests to prevent overwhelming the API
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < needsVerification.length; i += batchSize) {
        batches.push(needsVerification.slice(i, i + batchSize));
      }
      
      const verificationMap = new Map(userVerifications);
      const newInvalidIds = new Set(invalidReportIds);
      
      for (const batch of batches) {
        const batchPromises = batch.map(async (reportId) => {
          try {
            // Add timeout for individual verification checks
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Verification timeout')), 3000)
            );
            
            const verificationPromise = checkUserVerification(user, reportId);
            const result = await Promise.race([verificationPromise, timeoutPromise]);
            
            // Check if report was not found (404)
            if (result.error === 'Report not found') {
              newInvalidIds.add(reportId);
              console.log(`🗑️ Marking report ${reportId} as invalid (not found in verification database)`);
              return { reportId, result: null }; // Don't store verification data for invalid reports
            }
            
            return { reportId, result };
          } catch (error) {
            // Handle other errors (timeout, network, etc.)
            if (error.message.includes('timeout')) {
              console.warn(`⏱️ Verification check timeout for report ${reportId}`);
            } else {
              console.warn(`❌ Verification check failed for report ${reportId}:`, error.message);
            }
            // Return default verification status on error (but don't mark as invalid)
            return { reportId, result: { hasVerified: false, isOriginalAuthor: false, canVerify: false } };
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((promiseResult) => {
          if (promiseResult.status === 'fulfilled' && promiseResult.value.result) {
            const { reportId, result } = promiseResult.value;
            verificationMap.set(reportId, result);
          }
        });
        
        // Small delay between batches to prevent API overload
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Update both verification map and invalid IDs
      setUserVerifications(verificationMap);
      setInvalidReportIds(newInvalidIds);
      
    } catch (error) {
      console.error('Failed to load user verifications:', error);
      // Preserve existing verifications on error
    }
  }, [isAuthenticated, user, userVerifications, invalidReportIds]);

  /**
   * Apply location clustering to filtered reports
   */
  useEffect(() => {
    const applyLocationClustering = async () => {
      if (!useLocationClustering || filteredReports.length === 0) {
        setClusteredReports(filteredReports.map(report => ({
          type: 'individual',
          report,
          id: report.id
        })));
        return;
      }

      try {
        const clusters = await clusterReportsByLocation(filteredReports, {
          maxDistance: 0.5, // 0.5km clustering radius
          maxTimeGap: 2 * 60 * 60 * 1000, // 2 hours
          minClusterSize: 2,
          separateCritical: true
        });
        setClusteredReports(clusters);
      } catch (error) {
        console.error('Failed to cluster reports:', error);
        // Fallback to individual reports
        setClusteredReports(filteredReports.map(report => ({
          type: 'individual',
          report,
          id: report.id
        })));
      }
    };

    applyLocationClustering();
  }, [filteredReports, useLocationClustering]);

  /**
   * Crisis-aware report categorization for display
   */
  const reportCategories = useMemo(() => {
    const allReports = clusteredReports.flatMap(item => 
      item.type === 'cluster' ? item.reports : [item.report]
    );
    
    const categories = {
      critical: allReports.filter(r => r.urgentLevel === 'critical'),
      active: allReports.filter(r => r.urgentLevel === 'high'),
      normal: allReports.filter(r => ['normal', 'low'].includes(r.urgentLevel || 'normal')),
      unverified: allReports.filter(r => (r.verificationCount || 0) === 0),
      recent: allReports.filter(r => {
        const age = Date.now() - new Date(r.timestamp).getTime();
        return age <= 60 * 60 * 1000; // Last hour
      })
    };

    return categories;
  }, [clusteredReports]);

  /**
   * Load community reports with enhanced error handling and retry logic
   */
  const loadCommunityReports = useCallback(async (isRefresh = false, retryCount = 0) => {
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 1000;
    
    if (!userLocation || loading) return;

    setLoading(true);
    try {
      // Add timeout for API calls
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API timeout')), 10000)
      );
      
      const apiPromise = getCommunityReports(userLocation, {
        limit: isRefresh ? 50 : 20,
        emergencyMode: dynamicEmergencyLevel === 'critical'
      });
      
      const result = await Promise.race([apiPromise, timeoutPromise]);
      
      if (result.success !== false) {
        const rawReports = result.reports || [];
        
        // Expand any clustered reports with validation
        const expandedReports = [];
        rawReports.forEach(item => {
          try {
            if (item && typeof item === 'object') {
              if (item.isCluster && Array.isArray(item.reports)) {
                expandedReports.push(...item.reports.filter(r => r && r.id));
              } else if (!item.isCluster && item.id) {
                expandedReports.push(item);
              }
            }
          } catch (itemError) {
            console.warn('Error processing report item:', itemError);
          }
        });
        
        console.log(`📊 API returned ${rawReports.length} raw items, expanded to ${expandedReports.length} reports`);
        setReports(isRefresh ? expandedReports : prev => [...prev, ...expandedReports]);
        
        // Load verifications with error handling - but don't await to prevent blocking
        if (expandedReports.length > 0) {
          loadUserVerifications(expandedReports).catch(error => {
            console.warn('Failed to load user verifications:', error);
          });
        }
        
        // Emergency announcements with safe speak check
        try {
          const criticalCount = expandedReports.filter(r => r?.urgentLevel === 'critical').length;
          if (criticalCount > 0 && isRefresh && speak && typeof speak === 'function') {
            speak(generateEmergencyAnnouncement(dynamicEmergencyLevel, criticalCount), { 
              emergency: true 
            });
          }
        } catch (speechError) {
          console.warn('Failed to announce emergency:', speechError);
        }
        
        setLastUpdated(new Date());
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error(`Failed to load community reports (attempt ${retryCount + 1}):`, error);
      
      // Retry logic for network errors
      if (retryCount < MAX_RETRIES && 
          (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('fetch'))) {
        console.log(`Retrying community reports load in ${RETRY_DELAY}ms...`);
        setTimeout(() => {
          loadCommunityReports(isRefresh, retryCount + 1);
        }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // Final error handling
      if (speak && typeof speak === 'function') {
        speak('Unable to load community reports. Please check your connection.', { emergency: false });
      }
      
      // Set empty state to prevent undefined errors
      if (isRefresh) {
        setReports([]);
      }
    } finally {
      setLoading(false);
    }
  }, [userLocation, dynamicEmergencyLevel, speak, loading]);

  /**
   * Load community status with enhanced error handling
   */
  const loadCommunityStatus = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 1;
    const RETRY_DELAY = 2000;
    
    if (!userLocation) return;
    
    try {
      // Add timeout for status API calls
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Status API timeout')), 8000)
      );
      
      const statusPromise = getCommunityStatus(userLocation);
      const result = await Promise.race([statusPromise, timeoutPromise]);
      
      if (result && result.success !== false) {
        const statusCounts = result.statusCounts || {};
        setCommunityStats({
          activeUsers: result.totalCheckins || 0,
          safeCount: statusCounts.safe || 0,
          evacuatingCount: statusCounts.evacuating || 0,
          needHelpCount: statusCounts['need-help'] || 0,
          reportsToday: 0
        });
      } else {
        throw new Error('Community status API returned unsuccessful response');
      }
    } catch (error) {
      console.error(`Failed to load community status (attempt ${retryCount + 1}):`, error);
      
      // Retry logic for network errors
      if (retryCount < MAX_RETRIES && 
          (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('fetch'))) {
        console.log(`Retrying community status load in ${RETRY_DELAY}ms...`);
        setTimeout(() => {
          loadCommunityStatus(retryCount + 1);
        }, RETRY_DELAY);
        return;
      }
      
      // Set safe default values on final failure
      setCommunityStats({
        activeUsers: 0,
        safeCount: 0,
        evacuatingCount: 0,
        needHelpCount: 0,
        reportsToday: 0
      });
    }
  }, [userLocation]);

  /**
   * Handle filter changes with smart presets and consistent state management
   */
  const handleFilterChange = useCallback((filterType, value) => {
    console.log(`🔧 Filter change: ${filterType} = ${value}`);
    console.trace('🔧 FILTER CHANGE STACK TRACE:'); // Add stack trace to see who's calling this
    
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      
      if (filterType === 'priority') {
        // Toggle priority levels
        if (Array.isArray(newFilters.priority)) {
          if (newFilters.priority.includes(value)) {
            newFilters.priority = newFilters.priority.filter(p => p !== value);
          } else {
            newFilters.priority = [...newFilters.priority, value];
          }
        }
      } else if (filterType === 'reportTypes') {
        // Toggle report types
        if (Array.isArray(newFilters.reportTypes)) {
          if (newFilters.reportTypes.includes(value)) {
            newFilters.reportTypes = newFilters.reportTypes.filter(t => t !== value);
          } else {
            newFilters.reportTypes = [...newFilters.reportTypes, value];
          }
        }
      } else {
        // Single value filters
        newFilters[filterType] = value;
      }
      
      console.log(`🔧 New filter state:`, newFilters);
      return newFilters;
    });
  }, []);

  /**
   * Clear all filters to show all reports
   */
  const clearFilters = useCallback(() => {
    console.log('🧹 CLEAR BUTTON CLICKED - Clearing all filters');
    console.log('🧹 Current filters before clear:', activeFilters);
    const clearedFilters = {
      priority: [], // Show all priority levels when filters are cleared
      timeRange: '7d', // FIXED: Changed to 7 days to show all test reports
      proximity: null, // Remove proximity restrictions
      verification: 'all',
      reportTypes: [],
      searchQuery: ''
    };
    console.log('🧹 New filters after clear:', clearedFilters);
    setActiveFilters(clearedFilters);
    
    // AGGRESSIVE CLEAR - Force another clear after a delay to combat any automatic reapplication
    setTimeout(() => {
      console.log('🧹 AGGRESSIVE CLEAR - Ensuring filters stay cleared');
      setActiveFilters({
        priority: [], 
        timeRange: '7d', // FIXED: Changed to 7 days to show all test reports
        proximity: null, 
        verification: 'all',
        reportTypes: [],
        searchQuery: ''
      });
    }, 100);
  }, []); // Remove activeFilters dependency to prevent re-triggering

  /**
   * Show notification with auto-dismiss
   */
  const showNotification = useCallback((type, message, duration = 5000) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), duration);
  }, []);

  /**
   * Handle report verification with enhanced error handling
   * Supports both authenticated and anonymous verification
   */
  const handleVerifyReport = useCallback(async (reportId) => {
    if (!reportId) {
      console.warn('No report ID provided for verification');
      return;
    }

    if (!userLocation) {
      console.warn('Location required for verification');
      return;
    }

    const verificationStatus = userVerifications.get(reportId);
    const userAuthenticated = typeof isAuthenticated === 'function' ? isAuthenticated() : !!isAuthenticated;
    
    // For authenticated users, check verification status
    if (userAuthenticated && user) {
      // Prevent duplicate verifications
      if (verificationStatus?.hasVerified) {
        console.log('Report already verified by this user');
        showNotification('warning', 'You have already verified this report');
        if (speak && typeof speak === 'function') {
          speak('You have already verified this report', { emergency: false });
        }
        return;
      }
      
      // Prevent self-verification
      if (verificationStatus?.isOriginalAuthor) {
        console.log('Cannot verify own report');
        showNotification('error', '❌ Self-verification not allowed. You cannot verify your own report.');
        if (speak && typeof speak === 'function') {
          speak('Cannot verify your own report', { emergency: false });
        }
        return;
      }
    }
    
    // For anonymous users, always allow verification (backend will handle session tracking)

    try {
      console.log(`Verifying report: ${reportId} ${userAuthenticated && user ? '(authenticated)' : '(anonymous)'}`);
      // Pass user only if authenticated, otherwise null for anonymous verification
      const result = await verifyCommunityReport(userAuthenticated && user ? user : null, reportId, '', userLocation);
      
      if (result && result.success !== false) {
        console.log('Verification successful');
        
        // Update verification status (only for authenticated users)
        if (userAuthenticated && user) {
          setUserVerifications(prev => {
            const newMap = new Map(prev);
            newMap.set(reportId, { 
              ...verificationStatus, 
              hasVerified: true,
              canVerify: false
            });
            return newMap;
          });
        }
        
        // Update the report verification count in our local state
        setReports(prev => prev.map(report => 
          report.id === reportId 
            ? { ...report, verificationCount: (report.verificationCount || 0) + 1 }
            : report
        ));
        
        // Provide user feedback
        showNotification('success', userAuthenticated && user ? '✅ Report verified successfully!' : '✅ Anonymous verification recorded');
        if (speak && typeof speak === 'function') {
          speak(userAuthenticated && user ? 'Report verified successfully' : 'Anonymous verification recorded', { emergency: false });
        }
      } else {
        const errorMsg = result?.error || 'Verification failed';
        console.error('Verification failed:', errorMsg);
        
        showNotification('error', `❌ Verification failed: ${errorMsg}`);
        if (speak && typeof speak === 'function') {
          speak('Verification failed. Please try again.', { emergency: false });
        }
      }
    } catch (error) {
      console.error('Failed to verify report:', error);
      
      let errorMessage = 'Unable to verify report';
      let notificationType = 'error';
      
      if (error.message.includes('already verified')) {
        errorMessage = 'You have already verified this report';
        notificationType = 'warning';
      } else if (error.message.includes('own report')) {
        errorMessage = '❌ Self-verification not allowed. You cannot verify your own report.';
        notificationType = 'error';
      } else if (error.message.includes('authentication') && userAuthenticated) {
        errorMessage = 'Authentication error while verifying report';
        notificationType = 'error';
      } else if (error.message.includes('location')) {
        errorMessage = 'Location required for verification';
        notificationType = 'warning';
      }
      
      showNotification(notificationType, errorMessage);
      if (speak && typeof speak === 'function') {
        speak(errorMessage, { emergency: false });
      }
    }
  }, [user, userVerifications, userLocation, isAuthenticated, speak, showNotification]);

  // Stable refs for functions to prevent infinite re-renders
  const loadCommunityReportsRef = useRef(loadCommunityReports);
  const loadCommunityStatusRef = useRef(loadCommunityStatus);
  
  // Update refs when functions change
  useEffect(() => {
    loadCommunityReportsRef.current = loadCommunityReports;
  }, [loadCommunityReports]);
  
  useEffect(() => {
    loadCommunityStatusRef.current = loadCommunityStatus;
  }, [loadCommunityStatus]);

  // Load data on mount and location changes - using stable dependencies
  useEffect(() => {
    if (userLocation) {
      loadCommunityReportsRef.current(true);
      loadCommunityStatusRef.current();
    }
  }, [userLocation]);

  // Auto-refresh based on emergency level - using stable dependencies
  useEffect(() => {
    if (!userLocation) return;
    
    const interval = emergencyConfig.refreshInterval;
    const timer = setInterval(() => {
      loadCommunityReportsRef.current(true);
      loadCommunityStatusRef.current();
    }, interval);
    
    return () => clearInterval(timer);
  }, [userLocation, emergencyConfig.refreshInterval]);

  // Crisis mode check (moved after all hooks)
  // FIXED: Disable automatic crisis mode to allow users to see all reports with filtering
  const shouldShowCrisisMode = false; // dynamicEmergencyLevel === 'critical' && reportCategories.critical.length >= 3;

  // Use conditional rendering in JSX instead of early return to avoid hooks violations
  return shouldShowCrisisMode ? (
    <CrisisMode
      reports={reportCategories.critical}
      userLocation={userLocation}
      onRefresh={() => loadCommunityReports(true)}
      loading={loading}
      emergencyLevel={dynamicEmergencyLevel}
    />
  ) : (
    <div className="space-y-6" data-testid="community-reports-hub">
      {/* Emergency Alert Banner */}
      {reportCategories.critical.length > 0 && (
        <EmergencyBanner
          criticalCount={reportCategories.critical.length}
          emergencyLevel={dynamicEmergencyLevel}
          onCallEmergency={() => window.location.href = 'tel:911'}
          onShowCritical={() => {
            console.log('🚨 EmergencyBanner onShowCritical clicked - NOT applying filter for debugging');
            // handleFilterChange('priority', 'critical') // TEMPORARILY DISABLED
          }}
        />
      )}

      {/* Header with Crisis-Optimized Controls */}
      <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 lg:h-8 lg:w-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                Hazard Reports
              </h1>
              <p className="text-sm lg:text-base text-gray-600">
                {filteredReports.length} reports • {communityStats.activeUsers} community members active
              </p>
              {lastUpdated && (
                <p className="text-xs text-gray-500">
                  Updated {new Date(lastUpdated).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowReportForm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Report Hazard</span>
            </button>
            
            <button
              onClick={() => loadCommunityReports(true)}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Updating...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Crisis-Optimized Quick Filters */}
        <QuickFilters
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          clusteredReports={reportCategories}
          emergencyLevel={dynamicEmergencyLevel}
        />
        
        {/* Location Clustering Toggle */}
        <div className="mt-2 flex items-center justify-between">
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={useLocationClustering}
              onChange={(e) => setUseLocationClustering(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>📍 Group similar reports by location</span>
          </label>
          <span className="text-xs text-gray-500">
            {useLocationClustering ? `${clusteredReports.length} groups` : `${filteredReports.length} individual reports`}
          </span>
        </div>

        {/* View Mode Controls */}
        <div className="mt-4 flex items-center justify-between">
          <ViewModeSelector
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            reportCount={useLocationClustering ? clusteredReports.length : filteredReports.length}
          />
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              <Filter className="h-4 w-4" />
              <span>Advanced</span>
              {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <AdvancedFilters
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            userLocation={userLocation}
            emergencyLevel={dynamicEmergencyLevel}
            reportTypes={getUniqueReportTypes(reports)}
          />
        )}
      </div>

      {/* Reports Display */}
      <ReportsDisplay
        reports={useLocationClustering ? clusteredReports : filteredReports.map(r => ({ type: 'individual', report: r, id: r.id }))}
        clusteredReports={reportCategories}
        viewMode={viewMode}
        userLocation={userLocation}
        userVerifications={userVerifications}
        onVerifyReport={handleVerifyReport}
        loading={loading}
        emergencyLevel={dynamicEmergencyLevel}
        useLocationClustering={useLocationClustering}
        invalidReportIds={invalidReportIds}
      />

      {/* Report Form Modal */}
      {showReportForm && (
        <ReportFormModal
          userLocation={userLocation}
          emergencyLevel={dynamicEmergencyLevel}
          filteredReports={filteredReports}
          onClose={() => setShowReportForm(false)}
          onReportSubmitted={() => {
            setShowReportForm(false);
            loadCommunityReports(true);
          }}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg border-l-4 ${
          notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
          notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
          notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
          'bg-blue-50 border-blue-500 text-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {notification.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-600" />}
              {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
              {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Crisis Mode - Simplified interface for critical emergencies
 */
const CrisisMode = ({ reports, userLocation, onRefresh, loading, emergencyLevel }) => {
  return (
    <div className="space-y-6 p-4 bg-red-50 min-h-screen">
      <div className="bg-red-600 text-white p-6 rounded-lg text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <AlertTriangle className="h-8 w-8 animate-pulse" />
          <h1 className="text-2xl font-bold">EMERGENCY MODE ACTIVE</h1>
          <AlertTriangle className="h-8 w-8 animate-pulse" />
        </div>
        <p className="text-red-100">
          {reports.length} critical reports • Auto-refresh every 30 seconds
        </p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => window.location.href = 'tel:911'}
          className="bg-red-600 text-white p-6 rounded-lg text-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center space-x-3"
        >
          <Phone className="h-6 w-6" />
          <span>CALL 911 - EMERGENCY</span>
        </button>
        
        <button
          onClick={onRefresh}
          disabled={loading}
          className="bg-orange-600 text-white p-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Updating...' : 'Refresh Critical Reports'}</span>
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-red-800 flex items-center">
          <Flame className="h-6 w-6 mr-2" />
          Critical Situations ({reports.length})
        </h2>
        
        {reports.length === 0 ? (
          <div className="bg-white p-8 rounded-lg text-center">
            <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800">No Critical Reports</h3>
            <p className="text-green-600">Your area currently has no emergency-level reports</p>
          </div>
        ) : (
          reports.map(report => (
            <CriticalReportCard
              key={report.id}
              report={report}
              userLocation={userLocation}
            />
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Critical Report Card Component for Crisis Mode
 */
const CriticalReportCard = ({ report, userLocation }) => {
  const getDistanceText = () => {
    if (!userLocation || !report.location) return '';
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      report.location.lat, report.location.lng
    );
    return `${distance.toFixed(1)}km away`;
  };

  return (
    <div className="bg-white border-l-4 border-red-500 p-6 rounded-lg shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-red-100 p-2 rounded-full">
            <Flame className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-800">
              {report.title || 'Critical Emergency Report'}
            </h3>
            <p className="text-red-600 text-sm font-medium">
              {report.type || 'Emergency'} • {getDistanceText()}
            </p>
          </div>
        </div>
        <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
          CRITICAL
        </div>
      </div>
      
      <p className="text-gray-800 mb-4">
        {report.description || 'Critical situation requiring immediate attention.'}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <Clock className="h-4 w-4 inline mr-1" />
          {new Date(report.timestamp).toLocaleTimeString()}
        </div>
        <div className="flex space-x-2">
          <button className="bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700 transition-colors text-sm">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Emergency Banner Component
 */
const EmergencyBanner = ({ criticalCount, emergencyLevel, onCallEmergency, onShowCritical }) => (
  <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
    <div className="flex items-center space-x-3">
      <div className="relative">
        <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
          {criticalCount}
        </span>
      </div>
      <div className="flex-1">
        <h2 className="text-red-800 font-bold text-lg">
          🚨 {criticalCount} Critical Emergency Report{criticalCount !== 1 ? 's' : ''}
        </h2>
        <p className="text-red-700 text-sm">
          Life-threatening situations requiring immediate attention
        </p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onCallEmergency}
          className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <Phone className="h-4 w-4" />
          <span>Call 911</span>
        </button>
        <button
          onClick={onShowCritical}
          className="bg-orange-600 text-white px-4 py-2 rounded font-semibold hover:bg-orange-700 transition-colors"
        >
          View Reports
        </button>
      </div>
    </div>
  </div>
);

/**
 * Advanced Filters Component - Placeholder
 */
const AdvancedFilters = ({ activeFilters, onFilterChange, userLocation, emergencyLevel, reportTypes }) => {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
      <h4 className="font-medium text-gray-800 mb-3">Advanced Filters</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Time Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
          <select
            value={activeFilters.timeRange}
            onChange={(e) => onFilterChange('timeRange', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="72h">Last 3 Days</option>
            <option value="7d">Last Week</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Proximity */}
        {userLocation && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distance</label>
            <select
              value={activeFilters.proximity || ''}
              onChange={(e) => onFilterChange('proximity', e.target.value ? Number(e.target.value) : null)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All distances</option>
              <option value="1">Within 1km</option>
              <option value="5">Within 5km</option>
              <option value="10">Within 10km</option>
              <option value="25">Within 25km</option>
            </select>
          </div>
        )}

        {/* Verification Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Verification</label>
          <select
            value={activeFilters.verification}
            onChange={(e) => onFilterChange('verification', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Reports</option>
            <option value="verified">Verified (1+)</option>
            <option value="highly-verified">Highly Verified (3+)</option>
            <option value="unverified">Needs Verification</option>
          </select>
        </div>
      </div>
    </div>
  );
};

/**
 * Report Form Modal - Placeholder
 */
const ReportFormModal = ({ userLocation, emergencyLevel, filteredReports, onClose, onReportSubmitted }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Report New Hazard</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              📋 Using existing report form component for hazard submission
            </p>
          </div>
          
          <CommunityReporting
            userLocation={userLocation}
            emergencyLevel={emergencyLevel}
            preFilteredReports={filteredReports}
            onReportsUpdate={onReportSubmitted}
          />
        </div>
      </div>
    </div>
  );
};

// Helper functions
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const getUniqueReportTypes = (reports) => {
  const types = new Set();
  reports.forEach(report => types.add(report.type));
  return Array.from(types);
};

export default CommunityReportsHub;