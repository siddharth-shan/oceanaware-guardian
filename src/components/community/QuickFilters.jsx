/**
 * Quick Filters - Crisis-Optimized Filter Interface
 * Provides immediate access to most important filters during emergencies
 */

import { useState } from 'react';
import { 
  AlertTriangle, MapPin, Clock, Users, Search, X, Filter,
  Flame, Shield, Eye, CheckCircle, Zap
} from 'lucide-react';

const QuickFilters = ({ 
  activeFilters, 
  onFilterChange, 
  onClearFilters, 
  clusteredReports,
  emergencyLevel 
}) => {
  const [searchExpanded, setSearchExpanded] = useState(false);

  // Crisis-optimized filter buttons with counts
  const quickFilterButtons = [
    {
      id: 'critical',
      filterType: 'priority',
      label: '🚨 Critical',
      icon: AlertTriangle,
      count: clusteredReports.critical?.length || 0,
      variant: 'emergency',
      description: 'Life-threatening situations',
      alwaysShow: true
    },
    {
      id: 'nearby',
      filterType: 'proximity',
      label: '📍 My Area',
      icon: MapPin,
      count: null,
      variant: 'primary',
      description: 'Reports within 5km',
      active: activeFilters.proximity <= 5
    },
    {
      id: 'recent',
      filterType: 'timeRange',
      value: '6h',
      label: '🕒 Recent',
      icon: Clock,
      count: clusteredReports.recent?.length || 0,
      variant: 'info',
      description: 'Last 6 hours',
      active: activeFilters.timeRange === '6h'
    },
    {
      id: 'unverified',
      filterType: 'verification',
      value: 'unverified',
      label: '❓ Needs Verification',
      icon: Eye,
      count: clusteredReports.unverified?.length || 0,
      variant: 'warning',
      description: 'Help verify community reports',
      active: activeFilters.verification === 'unverified'
    }
  ];

  const handleQuickFilter = (button) => {
    console.log(`🔧 Quick filter clicked: ${button.id}`, { filterType: button.filterType, value: button.value, currentActive: isFilterActive(button) });
    
    if (button.filterType === 'priority') {
      onFilterChange('priority', button.id);
    } else if (button.filterType === 'proximity') {
      const newRadius = activeFilters.proximity === 5 ? null : 5;
      console.log(`🔧 Proximity filter: ${activeFilters.proximity} → ${newRadius}`);
      onFilterChange('proximity', newRadius);
    } else if (button.filterType === 'verification') {
      // Toggle between the specific verification filter and 'all'
      const newValue = activeFilters.verification === button.value ? 'all' : button.value;
      console.log(`🔧 Verification filter: ${activeFilters.verification} → ${newValue}`);
      onFilterChange('verification', newValue);
    } else if (button.filterType === 'timeRange') {
      // Toggle between the specific time range and default '7d'
      const newValue = activeFilters.timeRange === button.value ? '7d' : button.value;
      console.log(`🔧 Time range filter: ${activeFilters.timeRange} → ${newValue}`);
      onFilterChange('timeRange', newValue);
    } else {
      onFilterChange(button.filterType, button.value || button.id);
    }
  };

  const isFilterActive = (button) => {
    if (button.active !== undefined) return button.active;
    
    switch (button.filterType) {
      case 'priority':
        return activeFilters.priority.includes(button.id);
      case 'proximity':
        return activeFilters.proximity === 5;
      case 'timeRange':
        return activeFilters.timeRange === button.value;
      case 'verification':
        return activeFilters.verification === button.value;
      default:
        return false;
    }
  };

  const getVariantClasses = (variant, isActive) => {
    const variants = {
      emergency: isActive 
        ? 'bg-red-100 border-red-500 text-red-800' 
        : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
      warning: isActive 
        ? 'bg-yellow-100 border-yellow-500 text-yellow-800' 
        : 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
      primary: isActive 
        ? 'bg-blue-100 border-blue-500 text-blue-800' 
        : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
      info: isActive 
        ? 'bg-purple-100 border-purple-500 text-purple-800' 
        : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
      default: isActive 
        ? 'bg-gray-100 border-gray-500 text-gray-800' 
        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
    };
    
    return variants[variant] || variants.default;
  };

  const activeFilterCount = [
    activeFilters.priority.length > 0 ? 1 : 0,
    activeFilters.proximity ? 1 : 0,
    activeFilters.timeRange !== '7d' ? 1 : 0,
    activeFilters.verification !== 'all' ? 1 : 0,
    activeFilters.reportTypes.length > 0 ? 1 : 0,
    activeFilters.searchQuery.trim() ? 1 : 0
  ].reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-4">
      {/* Search Bar - Prominent placement for crisis scenarios */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${clusteredReports.critical?.length > 0 ? 'critical ' : ''}reports...`}
              value={activeFilters.searchQuery}
              onChange={(e) => onFilterChange('searchQuery', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
            {activeFilters.searchQuery && (
              <button
                onClick={() => onFilterChange('searchQuery', '')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Clear All Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
              title="Clear all filters"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear ({activeFilterCount})</span>
              <span className="sm:hidden">{activeFilterCount}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {quickFilterButtons.map((button) => {
          const Icon = button.icon;
          const isActive = isFilterActive(button);
          const shouldShow = button.alwaysShow || button.count > 0 || isActive;
          
          if (!shouldShow && emergencyLevel !== 'critical') return null;
          
          return (
            <button
              key={button.id}
              onClick={() => handleQuickFilter(button)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${getVariantClasses(button.variant, isActive)}`}
              title={button.description}
              disabled={button.count === 0 && !isActive}
            >
              <Icon className="h-4 w-4" />
              <span>{button.label}</span>
              {button.count !== null && button.count > 0 && (
                <span className="bg-white bg-opacity-80 px-2 py-0.5 rounded-full text-xs font-bold">
                  {button.count}
                </span>
              )}
              {isActive && (
                <CheckCircle className="h-4 w-4" />
              )}
            </button>
          );
        })}
      </div>

      {/* Emergency Mode Indicator */}
      {emergencyLevel === 'critical' && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Flame className="h-5 w-5 text-red-600 animate-pulse" />
            <div>
              <span className="text-red-800 font-semibold text-sm">
                Emergency Mode Active
              </span>
              <p className="text-red-700 text-xs">
                Filters optimized for critical situation response
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      {activeFilterCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800 font-medium text-sm">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
              </span>
            </div>
            <div className="text-xs text-blue-600">
              Showing filtered results
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {activeFilters.priority.length > 0 && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                Priority: {activeFilters.priority.join(', ')}
              </span>
            )}
            {activeFilters.proximity && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                Within {activeFilters.proximity}km
              </span>
            )}
            {activeFilters.timeRange !== '7d' && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                Last {activeFilters.timeRange}
              </span>
            )}
            {activeFilters.verification !== 'all' && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                {activeFilters.verification}
              </span>
            )}
            {activeFilters.reportTypes.length > 0 && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                {activeFilters.reportTypes.length} type{activeFilters.reportTypes.length !== 1 ? 's' : ''}
              </span>
            )}
            {activeFilters.searchQuery && (
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                "{activeFilters.searchQuery}"
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickFilters;