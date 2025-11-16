/**
 * View Mode Selector - Multiple display options for different user needs
 * Compact for scanning, detailed for analysis, map for location context
 */

import { Grid, List, Map, Table, Eye, Layers } from 'lucide-react';

const ViewModeSelector = ({ viewMode, onViewModeChange, reportCount }) => {
  const viewModes = [
    {
      id: 'compact',
      label: 'Compact',
      icon: Grid,
      description: 'High-density list for scanning many reports',
      bestFor: 'Emergency scanning',
      itemsPerView: '10-15 visible'
    },
    {
      id: 'detailed',
      label: 'Detailed',
      icon: List,
      description: 'Full information cards with all details',
      bestFor: 'In-depth analysis',
      itemsPerView: '5-8 visible'
    },
    {
      id: 'map',
      label: 'Map',
      icon: Map,
      description: 'Geographic visualization of report locations',
      bestFor: 'Spatial analysis',
      itemsPerView: 'All on map'
    },
    {
      id: 'table',
      label: 'Table',
      icon: Table,
      description: 'Sortable columns for data analysis',
      bestFor: 'Data comparison',
      itemsPerView: '20+ visible'
    }
  ];

  const getRecommendedMode = () => {
    if (reportCount > 50) return 'compact';
    if (reportCount > 20) return 'detailed';
    if (reportCount > 10) return 'map';
    return 'detailed';
  };

  const recommendedMode = getRecommendedMode();

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Eye className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">View:</span>
      </div>

      <div className="flex bg-gray-100 rounded-lg p-1">
        {viewModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = viewMode === mode.id;
          const isRecommended = mode.id === recommendedMode && !isActive;
          
          return (
            <button
              key={mode.id}
              onClick={() => onViewModeChange(mode.id)}
              className={`relative flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              }`}
              title={`${mode.description} - ${mode.bestFor}`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{mode.label}</span>
              
              {/* Recommendation indicator */}
              {isRecommended && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Report count and view info */}
      <div className="hidden lg:flex items-center space-x-2 text-xs text-gray-500">
        <span>{reportCount} reports</span>
        <span>•</span>
        <span>{viewModes.find(m => m.id === viewMode)?.itemsPerView}</span>
      </div>

      {/* Recommendation hint */}
      {recommendedMode !== viewMode && (
        <div className="hidden xl:flex items-center space-x-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span>Try {viewModes.find(m => m.id === recommendedMode)?.label} for {reportCount} reports</span>
        </div>
      )}
    </div>
  );
};

export default ViewModeSelector;