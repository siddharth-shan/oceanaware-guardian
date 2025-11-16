/**
 * Report Clustering Component
 * Advanced clustering visualization for handling hundreds of community reports
 */

import React, { useMemo, useState, useCallback } from 'react';
import { adaptiveClustering, filterClusters, calculateViewportBounds } from '../../utils/geospatialHelpers';

const ReportClustering = ({ 
  reports = [], 
  onClusterClick, 
  onReportClick,
  filters = {},
  className = "",
  emergencyMode = false 
}) => {
  const [expandedClusters, setExpandedClusters] = useState(new Set());
  
  // Apply adaptive clustering based on dataset size
  const clusters = useMemo(() => {
    console.log(`🔍 Clustering ${reports.length} reports...`);
    
    if (!reports || reports.length === 0) return [];
    
    // Choose clustering parameters based on emergency mode
    const clusteringOptions = {
      densityRadius: emergencyMode ? 0.5 : 1.0, // Tighter clustering in emergency
      gridSize: emergencyMode ? 1.0 : 2.0,
      largeDatasetThreshold: emergencyMode ? 200 : 500
    };
    
    const clustered = adaptiveClustering(reports, clusteringOptions);
    
    // Apply filters (emergency-first, bounds, types, etc.)
    const filtered = filterClusters(clustered, {
      ...filters,
      emergencyOnly: emergencyMode
    });
    
    console.log(`✅ Created ${filtered.length} clusters from ${reports.length} reports`);
    return filtered;
  }, [reports, filters, emergencyMode]);
  
  // Calculate optimal viewport for clusters
  const viewportBounds = useMemo(() => {
    return calculateViewportBounds(clusters);
  }, [clusters]);
  
  const handleClusterToggle = useCallback((clusterId) => {
    setExpandedClusters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clusterId)) {
        newSet.delete(clusterId);
      } else {
        newSet.add(clusterId);
      }
      return newSet;
    });
  }, []);
  
  const handleClusterClick = useCallback((cluster) => {
    if (cluster.type === 'cluster') {
      handleClusterToggle(cluster.id);
      onClusterClick?.(cluster);
    } else {
      onReportClick?.(cluster.report);
    }
  }, [handleClusterToggle, onClusterClick, onReportClick]);
  
  return (
    <div className={`report-clustering ${className}`}>
      {/* Clustering Summary */}
      <div className="clustering-summary mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {clusters.length} {clusters.length === 1 ? 'item' : 'items'} 
              {reports.length > clusters.length && ` (from ${reports.length} reports)`}
            </span>
            {emergencyMode && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                Emergency Mode
              </span>
            )}
          </div>
          
          {/* Viewport bounds info */}
          {viewportBounds && (
            <div className="text-xs text-gray-500">
              📍 {viewportBounds.center.lat.toFixed(3)}, {viewportBounds.center.lng.toFixed(3)}
            </div>
          )}
        </div>
      </div>
      
      {/* Clustered Reports List */}
      <div className="clustered-reports space-y-2">
        {clusters.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-6xl mb-4">📍</div>
            <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
            <p>No reports match your current filters or location.</p>
          </div>
        ) : (
          clusters.map((item) => (
            <ClusterItem
              key={item.id}
              item={item}
              isExpanded={expandedClusters.has(item.id)}
              onClick={() => handleClusterClick(item)}
              onReportClick={onReportClick}
              emergencyMode={emergencyMode}
            />
          ))
        )}
      </div>
      
      {/* Performance Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <div>🔧 Debug: {reports.length} reports → {clusters.length} clusters</div>
          <div>📊 Algorithm: {reports.length > 500 ? 'Grid-based' : 'Density-based'}</div>
          <div>🎯 Emergency mode: {emergencyMode ? 'ON' : 'OFF'}</div>
        </div>
      )}
    </div>
  );
};

// Individual cluster item component
const ClusterItem = ({ 
  item, 
  isExpanded, 
  onClick, 
  onReportClick, 
  emergencyMode 
}) => {
  const isCluster = item.type === 'cluster';
  const report = isCluster ? null : item.report;
  
  // Emergency styling
  const urgencyStyles = {
    critical: 'bg-red-50 border-red-200 text-red-900',
    high: 'bg-orange-50 border-orange-200 text-orange-900',
    normal: 'bg-blue-50 border-blue-200 text-blue-900',
    low: 'bg-gray-50 border-gray-200 text-gray-700'
  };
  
  const urgencyIcons = {
    critical: '🚨',
    high: '⚠️',
    normal: '📍',
    low: '💭'
  };
  
  const baseStyle = urgencyStyles[item.urgentLevel] || urgencyStyles.normal;
  const emergencyStyle = emergencyMode && (item.urgentLevel === 'critical' || item.urgentLevel === 'high')
    ? 'ring-2 ring-red-300 shadow-lg'
    : '';
  
  return (
    <div className={`cluster-item border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${baseStyle} ${emergencyStyle}`}>
      <div onClick={onClick}>
        {/* Cluster Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {urgencyIcons[item.urgentLevel]}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold">
                  {isCluster ? item.summary : (report?.title || 'Community Report')}
                </h4>
                
                {isCluster && (
                  <span className="bg-white bg-opacity-50 text-xs px-2 py-1 rounded-full">
                    {item.count} reports
                  </span>
                )}
              </div>
              
              <div className="text-sm opacity-75 mt-1">
                📍 {item.location.region} • {formatTimestamp(item.timestamp)}
                {isCluster && item.radius && (
                  <span className="ml-2">• ~{item.radius}km radius</span>
                )}
              </div>
              
              {/* Emergency badge */}
              {(item.urgentLevel === 'critical' || item.urgentLevel === 'high') && (
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.urgentLevel === 'critical' 
                      ? 'bg-red-200 text-red-800' 
                      : 'bg-orange-200 text-orange-800'
                  }`}>
                    {item.urgentLevel?.toUpperCase() || 'URGENT'} PRIORITY
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Expand/Collapse for clusters */}
          {isCluster && (
            <div className="text-lg">
              {isExpanded ? '📂' : '📁'}
            </div>
          )}
        </div>
        
        {/* Single report description */}
        {!isCluster && report?.description && (
          <div className="mt-2 text-sm opacity-75">
            {report.description.length > 100 
              ? `${report.description.substring(0, 100)}...`
              : report.description
            }
          </div>
        )}
      </div>
      
      {/* Expanded cluster details */}
      {isCluster && isExpanded && (
        <div className="mt-4 pt-3 border-t border-white border-opacity-50">
          <div className="space-y-2">
            {item.reports.map((clusterReport) => (
              <div
                key={clusterReport.id}
                className="bg-white bg-opacity-30 rounded p-2 cursor-pointer hover:bg-opacity-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onReportClick?.(clusterReport);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {clusterReport.title || `${clusterReport.type} Report`}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      {formatTimestamp(clusterReport.timestamp)} • {clusterReport.urgentLevel}
                    </div>
                    {clusterReport.description && (
                      <div className="text-xs mt-1 opacity-75">
                        {clusterReport.description.length > 80
                          ? `${clusterReport.description.substring(0, 80)}...`
                          : clusterReport.description
                        }
                      </div>
                    )}
                  </div>
                  <div className="text-sm ml-2">
                    {urgencyIcons[clusterReport.urgentLevel]}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Cluster statistics */}
          <div className="mt-3 pt-2 border-t border-white border-opacity-30">
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(item.typeGroups).map(([type, count]) => (
                <span key={type} className="bg-white bg-opacity-40 px-2 py-1 rounded">
                  {type?.replace('-', ' ') || type}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format timestamps
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

export default ReportClustering;