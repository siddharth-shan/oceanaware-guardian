/**
 * Enhanced Community Hub - Phase 2 Implementation
 * Includes clustering, virtual scrolling, caching, and real-time updates
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Shield, AlertTriangle, RefreshCw, Filter, Flame, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../../services/auth/AuthContext';
import { useAccessibility } from '../accessibility/AccessibilityProvider';
import CommunityReporting from './CommunityReporting';
import SafetyCheckin from './SafetyCheckin';
import CrisisMode from './CrisisMode';
import ReportClustering from './ReportClustering';
import VirtualizedReportsList from './VirtualizedReportsList';
import { useClusteredVirtualScrolling } from '../../hooks/useVirtualScrolling';
import { useCommunityUpdates } from '../../hooks/useRealtimeUpdates';
import {
  calculateEmergencyLevel,
  sortReportsByEmergency,
  filterReportsByEmergency,
  getEmergencyConfig,
  generateEmergencyAnnouncement,
  EmergencyStatus,
  CriticalReportTypes
} from '../../utils/emergencyHelpers';

const EnhancedCommunityHub = ({ userLocation, emergencyLevel: propEmergencyLevel }) => {
  const { isAuthenticated } = useAuth();
  const { speak } = useAccessibility();
  
  // UI State
  const [activeTab, setActiveTab] = useState('reports'); // Default to reports view
  const [viewMode, setViewMode] = useState('clustered'); // 'clustered' or 'list'
  const [emergencyFilters, setEmergencyFilters] = useState({
    criticalOnly: true,
    recentOnly: false,
    nearbyOnly: false,
    unverifiedOnly: false
  });
  
  // Community stats
  const [communityStats, setCommunityStats] = useState({
    activeUsers: 0,
    safeCount: 0,
    evacuatingCount: 0,
    needHelpCount: 0,
    reportsToday: 0
  });

  // Calculate dynamic emergency level
  const dynamicEmergencyLevel = useMemo(() => {
    if (propEmergencyLevel) return propEmergencyLevel;
    // Could calculate from real-time data
    return 'normal';
  }, [propEmergencyLevel]);

  const emergencyMode = dynamicEmergencyLevel === 'critical' || dynamicEmergencyLevel === 'high';
  const config = getEmergencyConfig(dynamicEmergencyLevel);

  // Real-time updates hook
  const {
    isConnected,
    realtimeReports,
    realtimeAlerts,
    lastUpdate,
    connectionError,
    updateLocation,
    setEmergencyMode: setRealtimeEmergencyMode
  } = useCommunityUpdates({
    location: userLocation,
    emergencyMode,
    onNewReport: (report) => {
      console.log('📨 New real-time report:', report.id);
      speak(`New ${report.urgentLevel} report: ${report.title}`);
    },
    onEmergencyAlert: (alert) => {
      console.log('🚨 New emergency alert:', alert.alert.title);
      speak(`Emergency alert: ${alert.alert.title}`, { priority: 'emergency' });
    }
  });

  // Clustered virtual scrolling for reports
  const {
    clusters,
    isLoading: clustersLoading,
    hasNextPage: clustersHasMore,
    loadMoreItems: loadMoreClusters,
    refresh: refreshClusters,
    getMetrics: getClustersMetrics,
    totalLoaded: totalClusters,
    isEmpty: clustersEmpty
  } = useClusteredVirtualScrolling({
    fetchClusters: async ({ lat, lng, limit, continuationToken, emergencyMode }) => {
      try {
        const response = await fetch(
          `/api/community/reports/clustered?lat=${lat}&lng=${lng}&limit=${limit}&emergencyMode=${emergencyMode}${
            continuationToken ? `&continuationToken=${continuationToken}` : ''
          }`
        );
        
        const data = await response.json();
        return {
          success: data.success,
          clusters: data.clusters || [],
          hasMore: data.hasMore || false,
          continuationToken: data.continuationToken,
          error: data.error
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          clusters: []
        };
      }
    },
    location: userLocation,
    filters: {
      urgentLevels: null, // Show all reports regardless of priority
      maxAge: emergencyFilters.recentOnly ? 6 : 24
    },
    emergencyMode
  });

  // Handle report interactions
  const handleReportClick = useCallback((report) => {
    console.log('📊 Report clicked:', report.id);
    // Could open detail modal or navigate to report view
  }, []);

  const handleClusterClick = useCallback((cluster) => {
    console.log('📦 Cluster clicked:', cluster.id, `(${cluster.count} reports)`);
    // Could expand cluster or show cluster details
  }, []);

  // Update real-time location when user location changes
  useEffect(() => {
    if (userLocation && isConnected) {
      updateLocation(userLocation);
    }
  }, [userLocation, isConnected, updateLocation]);

  // Update real-time emergency mode
  useEffect(() => {
    if (isConnected) {
      setRealtimeEmergencyMode(emergencyMode);
    }
  }, [emergencyMode, isConnected, setRealtimeEmergencyMode]);

  // Crisis mode for critical situations
  if (emergencyMode) {
    return (
      <CrisisMode
        userLocation={userLocation}
        emergencyLevel={dynamicEmergencyLevel}
        realtimeReports={realtimeReports.filter(r => r.urgentLevel === 'critical')}
        realtimeAlerts={realtimeAlerts}
        autoRefresh={true}
        onEmergencyAction={(action) => {
          console.log('🚨 Emergency action triggered:', action);
          speak(`Emergency action: ${action}`, { priority: 'emergency' });
        }}
      />
    );
  }

  return (
    <div className="enhanced-community-hub space-y-6">
      {/* Header with real-time status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Users className="h-8 w-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Community Hub</h2>
            <p className="text-gray-600">
              {totalClusters} items • {communityStats.activeUsers} active users
              {isConnected && (
                <span className="ml-2 text-green-600">
                  • Live updates {lastUpdate && `(${formatTimeAgo(lastUpdate)})`}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Emergency status indicator */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            dynamicEmergencyLevel === 'critical' ? 'bg-red-100 text-red-800' :
            dynamicEmergencyLevel === 'high' ? 'bg-orange-100 text-orange-800' :
            'bg-green-100 text-green-800'
          }`}>
            {dynamicEmergencyLevel?.toUpperCase() || 'UNKNOWN'} CONDITIONS
          </div>

          {/* Connection status */}
          <div className={`px-2 py-1 rounded-full text-xs ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isConnected ? '🟢 Live' : '🔴 Offline'}
          </div>

          {/* Refresh button */}
          <button
            onClick={refreshClusters}
            disabled={clustersLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`h-5 w-5 ${clustersLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real-time alerts */}
      {realtimeAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Emergency Alerts</h3>
              <div className="space-y-2 mt-2">
                {realtimeAlerts.slice(0, 3).map((alert, index) => (
                  <div key={index} className="text-sm text-red-800">
                    <span className="font-medium">{alert.alert.title}</span>
                    <span className="text-red-600 ml-2">
                      ({formatTimeAgo(new Date(alert.timestamp))})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'reports', label: 'Community Reports', icon: Flame },
            { id: 'checkin', label: 'Safety Check-in', icon: Shield },
            { id: 'submit', label: 'Report Hazard', icon: AlertTriangle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* View controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">View:</label>
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="clustered">Clustered View</option>
                    <option value="list">List View</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-600" />
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={emergencyFilters.criticalOnly}
                      onChange={(e) => setEmergencyFilters(prev => ({
                        ...prev,
                        criticalOnly: e.target.checked
                      }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Critical only</span>
                  </label>
                </div>
              </div>

              {/* Performance metrics (dev only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500">
                  {getClustersMetrics().avgLoadTime}ms avg • {getClustersMetrics().itemsPerSecond} items/sec
                </div>
              )}
            </div>

            {/* Reports view */}
            {viewMode === 'clustered' ? (
              <ReportClustering
                reports={[...clusters, ...realtimeReports]}
                onClusterClick={handleClusterClick}
                onReportClick={handleReportClick}
                filters={emergencyFilters}
                emergencyMode={emergencyMode}
                className="min-h-[500px]"
              />
            ) : (
              <VirtualizedReportsList
                reports={[...clusters, ...realtimeReports]}
                onReportClick={handleReportClick}
                onLoadMore={loadMoreClusters}
                hasNextPage={clustersHasMore}
                isLoading={clustersLoading}
                emergencyMode={emergencyMode}
                className="min-h-[500px]"
              />
            )}
          </div>
        )}

        {activeTab === 'checkin' && (
          <SafetyCheckin
            userLocation={userLocation}
            communityStats={communityStats}
            onStatusUpdate={(status) => {
              console.log('✅ Safety status updated:', status);
            }}
          />
        )}

        {activeTab === 'submit' && (
          <CommunityReporting
            userLocation={userLocation}
            onReportSubmitted={(report) => {
              console.log('📝 Report submitted:', report);
              speak(`Report submitted: ${report.title}`);
            }}
          />
        )}
      </div>

      {/* Connection error */}
      {connectionError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Connection issue: {connectionError}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

export default EnhancedCommunityHub;