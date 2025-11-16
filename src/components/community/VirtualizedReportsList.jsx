/**
 * Virtualized Reports List Component
 * Handles 500+ reports with optimal memory usage and smooth scrolling
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

const VirtualizedReportsList = ({
  reports = [],
  onReportClick,
  onLoadMore,
  hasNextPage = false,
  isLoading = false,
  loadingComponent = null,
  emergencyMode = false,
  className = ""
}) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const listRef = useRef();
  const rowHeights = useRef({});

  // Emergency mode styling
  const containerStyle = emergencyMode 
    ? 'bg-red-50 border-red-200'
    : 'bg-gray-50 border-gray-200';

  // Calculate item count including loading indicator
  const itemCount = hasNextPage ? reports.length + 1 : reports.length;

  // Check if item is loaded
  const isItemLoaded = useCallback((index) => {
    return !!reports[index];
  }, [reports]);

  // Load more items
  const loadMoreItems = useCallback((startIndex, stopIndex) => {
    if (isLoading || !hasNextPage) return Promise.resolve();
    return onLoadMore?.(startIndex, stopIndex) || Promise.resolve();
  }, [isLoading, hasNextPage, onLoadMore]);

  // Toggle expand/collapse for items with detailed content
  const toggleExpanded = useCallback((itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      
      // Reset row height cache for this item
      const itemIndex = reports.findIndex(r => r.id === itemId);
      if (itemIndex !== -1) {
        delete rowHeights.current[itemIndex];
        listRef.current?.resetAfterIndex(itemIndex);
      }
      
      return newSet;
    });
  }, [reports]);

  // Calculate dynamic row height based on content
  const getItemSize = useCallback((index) => {
    if (rowHeights.current[index]) {
      return rowHeights.current[index];
    }

    // Default heights based on item type
    if (index >= reports.length) {
      // Loading indicator
      return 80;
    }

    const item = reports[index];
    if (!item) return 120;

    let baseHeight = 120; // Minimum height

    // Additional height for expanded items
    if (expandedItems.has(item.id)) {
      baseHeight += 200; // Extra space for expanded content
    }

    // Additional height for clusters
    if (item.type === 'cluster') {
      baseHeight += 40; // Space for cluster summary
      if (expandedItems.has(item.id)) {
        baseHeight += item.count * 60; // Space for individual reports
      }
    }

    // Additional height for emergency items (larger touch targets)
    if (emergencyMode && (item.urgentLevel === 'critical' || item.urgentLevel === 'high')) {
      baseHeight += 20;
    }

    rowHeights.current[index] = baseHeight;
    return baseHeight;
  }, [reports, expandedItems, emergencyMode]);

  // Set row height after render
  const setItemSize = useCallback((index, size) => {
    if (rowHeights.current[index] !== size) {
      rowHeights.current[index] = size;
      listRef.current?.resetAfterIndex(index);
    }
  }, []);

  // Individual row component
  const Row = useCallback(({ index, style }) => {
    if (index >= reports.length) {
      // Loading indicator
      return (
        <div style={style}>
          <div className="flex items-center justify-center p-6">
            {loadingComponent || (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading more reports...</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    const item = reports[index];
    if (!item) return <div style={style}></div>;

    const isExpanded = expandedItems.has(item.id);
    const isCluster = item.type === 'cluster';
    const report = isCluster ? null : item.report || item;

    return (
      <div style={style}>
        <VirtualizedReportItem
          item={item}
          isExpanded={isExpanded}
          onToggleExpanded={() => toggleExpanded(item.id)}
          onClick={() => onReportClick?.(isCluster ? item : report)}
          emergencyMode={emergencyMode}
          onHeightChange={(height) => setItemSize(index, height)}
        />
      </div>
    );
  }, [reports, expandedItems, toggleExpanded, onReportClick, emergencyMode, setItemSize, loadingComponent]);

  // Reset heights when reports change
  useEffect(() => {
    rowHeights.current = {};
    listRef.current?.resetAfterIndex(0);
  }, [reports.length]);

  if (reports.length === 0 && !isLoading) {
    return (
      <div className={`text-center py-12 ${containerStyle} rounded-lg border`}>
        <div className="text-6xl mb-4">📍</div>
        <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
        <p className="text-gray-600">No reports match your current filters.</p>
      </div>
    );
  }

  return (
    <div className={`virtualized-reports-list ${className}`}>
      {/* List summary */}
      <div className="mb-4 px-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {reports.length} {reports.length === 1 ? 'item' : 'items'}
            {hasNextPage && ' (loading more...)'}
          </span>
          {emergencyMode && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              Emergency Mode
            </span>
          )}
        </div>
      </div>

      {/* Virtualized list */}
      <div className={`border rounded-lg ${containerStyle}`} style={{ height: '600px' }}>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
          threshold={5} // Load more when 5 items from bottom
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={(list) => {
                listRef.current = list;
                ref(list);
              }}
              height={600}
              itemCount={itemCount}
              itemSize={getItemSize}
              onItemsRendered={onItemsRendered}
              overscanCount={2} // Keep 2 extra items rendered for smooth scrolling
            >
              {Row}
            </List>
          )}
        </InfiniteLoader>
      </div>

      {/* Performance debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <div>🔧 Virtual List: {itemCount} items ({Object.keys(rowHeights.current).length} heights cached)</div>
          <div>📊 Emergency mode: {emergencyMode ? 'ON' : 'OFF'}</div>
          <div>⏳ Loading: {isLoading ? 'YES' : 'NO'} | Has more: {hasNextPage ? 'YES' : 'NO'}</div>
        </div>
      )}
    </div>
  );
};

// Individual report item component with dynamic height measurement
const VirtualizedReportItem = React.memo(({ 
  item, 
  isExpanded, 
  onToggleExpanded, 
  onClick, 
  emergencyMode,
  onHeightChange 
}) => {
  const itemRef = useRef();
  
  // Measure height after render
  useEffect(() => {
    if (itemRef.current) {
      const height = itemRef.current.offsetHeight;
      onHeightChange?.(height);
    }
  });

  const isCluster = item.type === 'cluster';
  const report = isCluster ? null : item.report || item;

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
    ? 'ring-2 ring-red-300 shadow-lg transform scale-[1.02]'
    : '';

  const touchTargetStyle = emergencyMode 
    ? 'min-h-[80px] p-4' // Larger touch targets in emergency mode
    : 'min-h-[60px] p-3';

  return (
    <div 
      ref={itemRef}
      className={`m-2 border rounded-lg cursor-pointer transition-all hover:shadow-md ${baseStyle} ${emergencyStyle} ${touchTargetStyle}`}
      onClick={onClick}
    >
      {/* Main content */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className={emergencyMode ? "text-3xl" : "text-2xl"}>
            {urgencyIcons[item.urgentLevel]}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`font-semibold truncate ${emergencyMode ? 'text-lg' : 'text-base'}`}>
                {isCluster ? item.summary : (report?.title || 'Community Report')}
              </h4>
              
              {isCluster && (
                <span className="bg-white bg-opacity-50 text-xs px-2 py-1 rounded-full flex-shrink-0">
                  {item.count} reports
                </span>
              )}
            </div>
            
            <div className={`opacity-75 mt-1 ${emergencyMode ? 'text-sm' : 'text-xs'}`}>
              📍 {item.location.region} • {formatTimestamp(item.timestamp)}
              {isCluster && item.radius && (
                <span className="ml-2">• ~{item.radius}km radius</span>
              )}
            </div>

            {/* Emergency priority badge */}
            {(item.urgentLevel === 'critical' || item.urgentLevel === 'high') && (
              <div className="mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.urgentLevel === 'critical' 
                    ? 'bg-red-200 text-red-800' 
                    : 'bg-orange-200 text-orange-800'
                }`}>
                  {item.urgentLevel?.toUpperCase() || 'URGENT'}
                  {emergencyMode && ' PRIORITY'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Expand/collapse button for clusters */}
        {isCluster && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpanded();
            }}
            className="flex-shrink-0 ml-2 p-1 hover:bg-white hover:bg-opacity-30 rounded transition-colors"
          >
            <div className="text-lg">
              {isExpanded ? '📂' : '📁'}
            </div>
          </button>
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

      {/* Expanded cluster details */}
      {isCluster && isExpanded && (
        <div className="mt-4 pt-3 border-t border-white border-opacity-50">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {item.reports.map((clusterReport) => (
              <div
                key={clusterReport.id}
                className="bg-white bg-opacity-30 rounded p-2 hover:bg-opacity-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.(clusterReport);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {clusterReport.title || `${clusterReport.type} Report`}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      {formatTimestamp(clusterReport.timestamp)} • {clusterReport.urgentLevel}
                    </div>
                    {clusterReport.description && (
                      <div className="text-xs mt-1 opacity-75 line-clamp-2">
                        {clusterReport.description}
                      </div>
                    )}
                  </div>
                  <div className="text-sm ml-2 flex-shrink-0">
                    {urgencyIcons[clusterReport.urgentLevel]}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Cluster type summary */}
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
});

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

VirtualizedReportItem.displayName = 'VirtualizedReportItem';

export default VirtualizedReportsList;