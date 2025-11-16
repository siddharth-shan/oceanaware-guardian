/**
 * Reports Display - Multi-mode report visualization
 * Handles compact, detailed, map, and table views with virtualization for performance
 */

import { useState, useMemo, useCallback } from 'react';
import { FixedSizeList as VirtualList } from 'react-window';
import { 
  AlertTriangle, MapPin, Clock, Users, Eye, CheckCircle, ExternalLink,
  Flame, Zap, Shield, Navigation, MoreHorizontal, ChevronDown, ChevronUp
} from 'lucide-react';

const ReportsDisplay = ({ 
  reports, 
  clusteredReports, 
  viewMode, 
  userLocation, 
  userVerifications,
  onVerifyReport,
  loading,
  emergencyLevel,
  useLocationClustering = false,
  invalidReportIds = new Set()
}) => {
  const [expandedReports, setExpandedReports] = useState(new Set());
  const [sortColumn, setSortColumn] = useState('urgentLevel'); // For table view
  const [sortDirection, setSortDirection] = useState('desc');

  // Toggle report expansion with accordion behavior (only one expanded at a time)
  const toggleReportExpansion = useCallback((reportId) => {
    setExpandedReports(prev => {
      const newSet = new Set();
      // If clicking the currently expanded item, collapse it
      // Otherwise, expand only the clicked item (accordion behavior)
      if (!prev.has(reportId)) {
        newSet.add(reportId);
      }
      return newSet;
    });
  }, []);

  // Extract individual reports from clusters for sorting
  const allIndividualReports = useMemo(() => {
    return reports.flatMap(item => {
      if (item.type === 'cluster') {
        return item.reports;
      } else if (item.type === 'individual' || item.type === 'critical') {
        return [item.report];
      }
      return [item]; // fallback for legacy format
    });
  }, [reports]);

  // Sort reports for table view
  const sortedIndividualReports = useMemo(() => {
    if (viewMode !== 'table') return allIndividualReports;
    
    return [...allIndividualReports].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortColumn) {
        case 'urgentLevel':
          const urgencyOrder = { critical: 4, high: 3, normal: 2, low: 1 };
          aVal = urgencyOrder[a.urgentLevel] || 0;
          bVal = urgencyOrder[b.urgentLevel] || 0;
          break;
        case 'timestamp':
          aVal = new Date(a.timestamp).getTime();
          bVal = new Date(b.timestamp).getTime();
          break;
        case 'verificationCount':
          aVal = a.verificationCount || 0;
          bVal = b.verificationCount || 0;
          break;
        case 'type':
          aVal = a.type || '';
          bVal = b.type || '';
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [allIndividualReports, viewMode, sortColumn, sortDirection]);

  // Handle loading state
  if (loading && reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading community reports...</p>
      </div>
    );
  }

  // Handle empty state
  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">No Reports Found</h3>
        <p className="text-green-600">
          {emergencyLevel === 'critical' 
            ? 'No critical reports in your area - situation appears stable'
            : 'No reports match your current filters'
          }
        </p>
      </div>
    );
  }

  // Render all views but only show the active one to prevent hooks violations
  return (
    <div>
      {viewMode === 'compact' && (
        <CompactView 
          reports={reports} 
          expandedReports={expandedReports}
          onToggleExpansion={toggleReportExpansion}
          userVerifications={userVerifications}
          onVerifyReport={onVerifyReport}
          userLocation={userLocation}
          useLocationClustering={useLocationClustering}
          invalidReportIds={invalidReportIds}
        />
      )}
      
      {viewMode === 'detailed' && (
        <DetailedView 
          reports={reports}
          userVerifications={userVerifications}
          onVerifyReport={onVerifyReport}
          userLocation={userLocation}
          emergencyLevel={emergencyLevel}
          useLocationClustering={useLocationClustering}
        />
      )}
      
      {viewMode === 'map' && (
        <MapView 
          reports={allIndividualReports}
          userLocation={userLocation}
          clusteredReports={clusteredReports}
        />
      )}
      
      {viewMode === 'table' && (
        <TableView 
          reports={sortedIndividualReports}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={(column) => {
            if (sortColumn === column) {
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
              setSortColumn(column);
              setSortDirection('desc');
            }
          }}
          userVerifications={userVerifications}
          onVerifyReport={onVerifyReport}
        />
      )}
      
      {!['compact', 'detailed', 'map', 'table'].includes(viewMode) && (
        <DetailedView 
          reports={reports}
          userVerifications={userVerifications}
          onVerifyReport={onVerifyReport}
          userLocation={userLocation}
          emergencyLevel={emergencyLevel}
          useLocationClustering={useLocationClustering}
        />
      )}
    </div>
  );
};

/**
 * Compact View - High-density list for emergency scanning with accordion-style expansion
 * Supports both individual reports and location clusters
 */
const CompactView = ({ reports, expandedReports, onToggleExpansion, userVerifications, onVerifyReport, userLocation, useLocationClustering, invalidReportIds }) => {
  const CompactReportItem = ({ index, style, report, isExpanded, onToggleExpansion, userVerifications, onVerifyReport, userLocation, invalidReportIds }) => {
    const verification = userVerifications.get(report.id);
    const isInvalid = invalidReportIds.has(report.id);
    
    // Calculate dynamic height based on expansion state
    const baseHeight = 90;
    const expandedHeight = isExpanded ? 160 : 0;
    const totalHeight = baseHeight + expandedHeight;
    
    return (
      <div style={{ ...style, height: totalHeight }} className="px-4 pb-2">
        <div className={`border rounded-lg transition-all duration-200 ${
          report.urgentLevel === 'critical' ? 'border-red-300 bg-red-50' :
          report.urgentLevel === 'high' ? 'border-orange-300 bg-orange-50' :
          'border-gray-200 bg-white'
        } ${isExpanded ? 'shadow-md' : 'shadow-sm'}`}>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className={`p-1.5 rounded-full ${
                  report.urgentLevel === 'critical' ? 'bg-red-200' :
                  report.urgentLevel === 'high' ? 'bg-orange-200' :
                  'bg-blue-200'
                }`}>
                  <AlertTriangle className={`h-4 w-4 ${
                    report.urgentLevel === 'critical' ? 'text-red-600' :
                    report.urgentLevel === 'high' ? 'text-orange-600' :
                    'text-blue-600'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 truncate text-sm">
                      {getReportTypeLabel(report.type)}
                    </h4>
                    <PriorityBadge urgentLevel={report.urgentLevel} />
                    <VerificationBadge count={report.verificationCount || 0} />
                  </div>
                  
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(report.timestamp)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-24">
                        {getLocationDisplay(report.location)}
                      </span>
                    </div>
                    {userLocation && report.location && (
                      <div className="flex items-center space-x-1">
                        <Navigation className="h-3 w-3" />
                        <span>{calculateDistance(userLocation, report.location).toFixed(1)}km</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {!verification?.isOriginalAuthor && !isInvalid && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (!verification?.hasVerified) {
                        onVerifyReport(report.id);
                      }
                    }}
                    disabled={verification?.hasVerified}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      verification?.hasVerified 
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                    title={verification?.hasVerified ? 'Already verified' : 'Verify this report'}
                  >
                    {verification?.hasVerified ? '✓' : 'Verify'}
                  </button>
                )}
                {isInvalid && (
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500" title="Report not available for verification">
                    Unavailable
                  </span>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpansion(report.id);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Expandable content with smooth animation */}
          <div className={`overflow-hidden transition-all duration-200 ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="px-3 pb-3 border-t border-gray-200">
              <div className="pt-3">
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{report.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Report ID: {report.id.slice(-8)}</span>
                  <span>{report.verificationCount || 0} community verifications</span>
                </div>
                {verification?.isOriginalAuthor && (
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    👤 This is your report
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            Reports ({reports.length})
          </h3>
          <span className="text-xs text-gray-500">
            Compact view • Scroll for more
          </span>
        </div>
      </div>
      
      <div className="h-96 overflow-y-auto scrollbar-thin">
        {reports.map((item, index) => {
          if (item.type === 'cluster') {
            return (
              <ClusterReportItem
                key={item.id}
                cluster={item}
                index={index}
                isExpanded={expandedReports.has(item.id)}
                onToggleExpansion={onToggleExpansion}
                userVerifications={userVerifications}
                onVerifyReport={onVerifyReport}
                userLocation={userLocation}
                invalidReportIds={invalidReportIds}
              />
            );
          } else {
            const report = item.report || item;
            return (
              <CompactReportItem
                key={report.id}
                index={index}
                style={{ width: '100%' }}
                report={report}
                isExpanded={expandedReports.has(report.id)}
                onToggleExpansion={onToggleExpansion}
                userVerifications={userVerifications}
                onVerifyReport={onVerifyReport}
                userLocation={userLocation}
                invalidReportIds={invalidReportIds}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

/**
 * Detailed View - Full information cards
 */
const DetailedView = ({ reports, userVerifications, onVerifyReport, userLocation, emergencyLevel }) => {
  // Extract individual reports from clusters for detailed view
  const individualReports = reports.flatMap(item => {
    if (item.type === 'cluster') {
      return item.reports;
    } else if (item.type === 'individual' || item.type === 'critical') {
      return [item.report];
    }
    return [item]; // fallback for legacy format
  });

  return (
    <div className="space-y-4">
      {individualReports.map((report) => (
        <DetailedReportCard
          key={report.id}
          report={report}
          userLocation={userLocation}
          verification={userVerifications.get(report.id)}
          onVerifyReport={onVerifyReport}
          emergencyLevel={emergencyLevel}
        />
      ))}
    </div>
  );
};

/**
 * Detailed Report Card Component
 */
const DetailedReportCard = ({ report, userLocation, verification, onVerifyReport, emergencyLevel }) => {
  // Debug logging for report structure
  if (!report || typeof report !== 'object') {
    console.warn('DetailedReportCard: Invalid report object', report);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Invalid report data</p>
      </div>
    );
  }

  const distance = userLocation && report.location 
    ? calculateDistance(userLocation, report.location) 
    : null;

  // Debug log the full report structure occasionally
  if (Math.random() < 0.1) { // Log 10% of reports for debugging
    console.debug('DetailedReportCard: Report structure', {
      id: report.id,
      type: report.type,
      urgentLevel: report.urgentLevel,
      timestamp: report.timestamp,
      location: report.location,
      description: report.description ? report.description.substring(0, 50) + '...' : 'No description'
    });
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border-l-4 ${
      report.urgentLevel === 'critical' ? 'border-red-500' :
      report.urgentLevel === 'high' ? 'border-orange-500' :
      'border-blue-500'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${
              report.urgentLevel === 'critical' ? 'bg-red-100' :
              report.urgentLevel === 'high' ? 'bg-orange-100' :
              'bg-blue-100'
            }`}>
              <AlertTriangle className={`h-6 w-6 ${
                report.urgentLevel === 'critical' ? 'text-red-600' :
                report.urgentLevel === 'high' ? 'text-orange-600' :
                'text-blue-600'
              }`} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                {getReportTypeLabel(report.type)}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <PriorityBadge urgentLevel={report.urgentLevel} />
                <VerificationBadge count={report.verificationCount || 0} />
                {verification?.isOriginalAuthor && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Your Report
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {formatTimeAgo(report.timestamp)}
            </div>
            {distance && (
              <div className="text-sm text-gray-500 flex items-center">
                <Navigation className="h-3 w-3 mr-1" />
                {distance.toFixed(1)}km away
              </div>
            )}
          </div>
        </div>
        
        <p className="text-gray-700 mb-4 leading-relaxed">
          {report.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{getLocationDisplay(report.location)}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              {report.verificationCount || 0} verifications
            </div>
            
            {!verification?.isOriginalAuthor && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (!verification?.hasVerified) {
                    onVerifyReport(report.id);
                  }
                }}
                disabled={verification?.hasVerified}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  verification?.hasVerified
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title={verification?.hasVerified ? 'Already verified' : 'Verify this report'}
              >
                {verification?.hasVerified ? '✓ Verified' : 'Verify Report'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Map View - Geographic visualization
 */
const MapView = ({ reports, userLocation, clusteredReports }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center py-12">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Map View</h3>
        <p className="text-gray-600">
          Geographic visualization coming soon
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {reports.length} reports ready for mapping
        </p>
      </div>
    </div>
  );
};

/**
 * Table View - Sortable data table
 */
const TableView = ({ reports, sortColumn, sortDirection, onSort, userVerifications, onVerifyReport }) => {
  const columns = [
    { key: 'urgentLevel', label: 'Priority', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'timestamp', label: 'Time', sortable: true },
    { key: 'location', label: 'Location', sortable: false },
    { key: 'verificationCount', label: 'Verifications', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={column.sortable ? () => onSort(column.key) : undefined}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && sortColumn === column.key && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <PriorityBadge urgentLevel={report.urgentLevel} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getReportTypeLabel(report.type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTimeAgo(report.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getLocationDisplay(report.location)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <VerificationBadge count={report.verificationCount || 0} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {!userVerifications.get(report.id)?.isOriginalAuthor && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (!userVerifications.get(report.id)?.hasVerified) {
                          onVerifyReport(report.id);
                        }
                      }}
                      disabled={userVerifications.get(report.id)?.hasVerified}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        userVerifications.get(report.id)?.hasVerified
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                      title={userVerifications.get(report.id)?.hasVerified ? 'Already verified' : 'Verify this report'}
                    >
                      {userVerifications.get(report.id)?.hasVerified ? 'Verified' : 'Verify'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper Components
const PriorityBadge = ({ urgentLevel }) => {
  const configs = {
    critical: { bg: 'bg-red-100', text: 'text-red-800', label: '🚨 CRITICAL' },
    high: { bg: 'bg-orange-100', text: 'text-orange-800', label: '⚠️ HIGH' },
    normal: { bg: 'bg-blue-100', text: 'text-blue-800', label: '📢 NORMAL' },
    low: { bg: 'bg-gray-100', text: 'text-gray-800', label: '💡 LOW' }
  };
  
  const config = configs[urgentLevel] || configs.normal;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const VerificationBadge = ({ count }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    count >= 3 ? 'bg-green-100 text-green-800' :
    count >= 1 ? 'bg-yellow-100 text-yellow-800' :
    'bg-gray-100 text-gray-800'
  }`}>
    {count >= 3 ? '🏆' : count >= 1 ? '✅' : '❓'} {count}
  </span>
);

// Helper Functions
const getReportTypeLabel = (type) => {
  const labels = {
    'fire-sighting': '🔥 Fire Sighting',
    'fire-spotting': '🔥 Fire Spotting',
    'power-line-down': '⚡ Power Line Down',
    'need-evac-help': '🚨 Need Evacuation',
    'unsafe-conditions': '⚠️ Unsafe Conditions',
    'road-closure': '🚧 Road Closure',
    'offer-help': '🤝 Offer Help'
  };
  return labels[type] || type;
};

const getLocationDisplay = (location) => {
  // Debug logging for location structure
  if (!location) {
    console.debug('getLocationDisplay: No location provided');
    return 'Unknown Area';
  }
  
  // Handle reverse geocoding results with proper fallbacks
  if (location.displayName && location.displayName !== 'Unknown Area' && location.displayName.trim()) {
    return location.displayName;
  }
  
  if (location.region && location.region !== 'Unknown Area' && location.region.trim()) {
    return location.region;
  }
  
  // If we have city/state info
  if (location.city && location.state) {
    return `${location.city}, ${location.state}`;
  }
  
  if (location.city && location.city.trim()) {
    return location.city;
  }
  
  if (location.state && location.state.trim()) {
    return location.state;
  }
  
  // Try to construct a meaningful location from coordinates
  if (typeof location.lat === 'number' && typeof location.lng === 'number' && 
      !isNaN(location.lat) && !isNaN(location.lng)) {
    // Use more descriptive coordinate display for San Francisco area
    const lat = location.lat;
    const lng = location.lng;
    
    // Basic area detection for better user experience
    if (lat >= 37.7 && lat <= 37.8 && lng >= -122.5 && lng <= -122.4) {
      return `San Francisco Area (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
    } else if (lat >= 34.0 && lat <= 34.4 && lng >= -118.7 && lng <= -118.1) {
      return `Los Angeles Area (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
    } else if (lat >= 32.5 && lat <= 33.0 && lng >= -117.4 && lng <= -116.9) {
      return `San Diego Area (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
    } else {
      return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    }
  }
  
  // Check for alternative coordinate field names
  if (typeof location.latitude === 'number' && typeof location.longitude === 'number' && 
      !isNaN(location.latitude) && !isNaN(location.longitude)) {
    return `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
  }
  
  // Log the location structure to help debug
  console.debug('getLocationDisplay: Unable to parse location', location);
  return 'Location Available';
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) {
    console.debug('formatTimeAgo: No timestamp provided');
    return 'Unknown time';
  }
  
  // Handle different timestamp formats
  let time;
  if (typeof timestamp === 'number') {
    time = timestamp;
  } else if (typeof timestamp === 'string') {
    time = new Date(timestamp).getTime();
  } else if (timestamp instanceof Date) {
    time = timestamp.getTime();
  } else {
    console.warn('formatTimeAgo: Invalid timestamp format:', timestamp);
    return 'Invalid time';
  }
  
  // Check if timestamp is valid
  if (isNaN(time)) {
    console.warn('formatTimeAgo: Invalid timestamp provided:', timestamp);
    return 'Invalid time';
  }
  
  const now = Date.now();
  const diffMs = now - time;
  
  // Handle future timestamps (clock skew) - allow small variance
  if (diffMs < -60000) { // More than 1 minute in the future
    console.warn('formatTimeAgo: Future timestamp detected:', timestamp);
    return 'Future time';
  }
  
  if (diffMs < 0) {
    return 'Just now';
  }
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  
  // For very old timestamps, show actual date
  return new Date(time).toLocaleDateString();
};

const calculateDistance = (loc1, loc2) => {
  if (!loc1 || !loc2 || !loc1.lat || !loc1.lng || !loc2.lat || !loc2.lng) return 0;
  
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Cluster Report Item - Displays grouped reports from the same location
 */
const ClusterReportItem = ({ cluster, index, isExpanded, onToggleExpansion, userVerifications, onVerifyReport, userLocation }) => {
  const baseHeight = 90;
  const expandedHeight = isExpanded ? Math.min(cluster.reports.length * 60 + 60, 300) : 0;
  const totalHeight = baseHeight + expandedHeight;
  
  const urgencyColors = {
    critical: { bg: 'bg-red-50', border: 'border-red-300', icon: 'bg-red-200', iconText: 'text-red-600' },
    high: { bg: 'bg-orange-50', border: 'border-orange-300', icon: 'bg-orange-200', iconText: 'text-orange-600' },
    normal: { bg: 'bg-blue-50', border: 'border-blue-300', icon: 'bg-blue-200', iconText: 'text-blue-600' },
    low: { bg: 'bg-gray-50', border: 'border-gray-300', icon: 'bg-gray-200', iconText: 'text-gray-600' }
  };
  
  const colors = urgencyColors[cluster.urgentLevel] || urgencyColors.normal;
  
  return (
    <div style={{ height: totalHeight }} className="px-4 pb-2">
      <div className={`border rounded-lg transition-all duration-200 ${colors.border} ${colors.bg} ${isExpanded ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={`p-1.5 rounded-full ${colors.icon} relative`}>
                <MapPin className={`h-4 w-4 ${colors.iconText}`} />
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                  {cluster.reportCount}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900 truncate text-sm">
                    📍 {cluster.location}
                  </h4>
                  <PriorityBadge urgentLevel={cluster.urgentLevel} />
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {cluster.reportCount} reports
                  </span>
                </div>
                
                <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(cluster.mostRecentTime)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="truncate max-w-32">
                      {cluster.typeSummary}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{cluster.totalVerifications} verifications</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpansion(cluster.id);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={isExpanded ? 'Collapse cluster' : 'Expand cluster'}
              >
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Expandable cluster content */}
        <div className={`overflow-hidden transition-all duration-200 ${
          isExpanded ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-3 pb-3 border-t border-gray-200">
            <div className="pt-3 space-y-2 max-h-64 overflow-y-auto">
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Reports in this area:
              </h5>
              {cluster.reports.map((report) => {
                const verification = userVerifications.get(report.id);
                return (
                  <div key={report.id} className="bg-white rounded p-2 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-800">
                            {getReportTypeLabel(report.type)}
                          </span>
                          <PriorityBadge urgentLevel={report.urgentLevel} />
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {report.description}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <span>{formatTimeAgo(report.timestamp)}</span>
                          <span>•</span>
                          <span>{(report.verificationCount || 0)} verifications</span>
                        </div>
                      </div>
                      
                      {!verification?.isOriginalAuthor && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (!verification?.hasVerified) {
                              onVerifyReport(report.id);
                            }
                          }}
                          disabled={verification?.hasVerified}
                          className={`text-xs px-2 py-1 rounded transition-colors ml-2 ${
                            verification?.hasVerified 
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                          title={verification?.hasVerified ? 'Already verified' : 'Verify this report'}
                        >
                          {verification?.hasVerified ? '✓' : 'Verify'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDisplay;