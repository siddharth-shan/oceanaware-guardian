/**
 * Advanced Filtering System for Community Reports
 * Phase 3.1: Multi-criteria filtering, saved presets, and smart recommendations
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Filter, 
  Save, 
  Star, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Users, 
  Flame,
  Eye,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Plus
} from 'lucide-react';
import { useAccessibility } from '../accessibility/AccessibilityProvider';
import { getTimeFilterOptions, getProximityFilterOptions } from '../../utils/emergencyHelpers';

/**
 * Advanced Filters Component
 * Provides comprehensive filtering capabilities for emergency reports
 */
const AdvancedFilters = ({ 
  reports = [], 
  onFilterChange, 
  userLocation,
  emergencyLevel = 'normal',
  initialFilters = {}
}) => {
  const { speak } = useAccessibility();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    urgentLevel: initialFilters.urgentLevel || [],
    reportTypes: initialFilters.reportTypes || [],
    timeRange: initialFilters.timeRange || 'all',
    proximityRadius: initialFilters.proximityRadius || null,
    verificationStatus: initialFilters.verificationStatus || 'all',
    customKeywords: initialFilters.customKeywords || '',
    ...initialFilters
  });
  const [savedPresets, setSavedPresets] = useState([]);
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Load saved filter presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('community-filter-presets');
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved presets:', error);
      }
    }
  }, []);

  // Emergency-specific filter presets
  const emergencyPresets = useMemo(() => {
    const basePresets = [
      {
        id: 'critical-only',
        name: '🚨 Critical Only',
        description: 'Show only critical emergency reports',
        filters: {
          urgentLevel: ['critical'],
          timeRange: '24h',
          verificationStatus: 'all'
        },
        emergency: true
      },
      {
        id: 'recent-verified',
        name: '✅ Recent & Verified',
        description: 'Verified reports from last 6 hours',
        filters: {
          urgentLevel: ['critical', 'high'],
          timeRange: '6h',
          verificationStatus: 'verified'
        },
        emergency: true
      },
      {
        id: 'nearby-urgent',
        name: '📍 Nearby Urgent',
        description: 'Urgent reports within 5km',
        filters: {
          urgentLevel: ['critical', 'high'],
          proximityRadius: 5,
          timeRange: '24h'
        },
        emergency: true
      },
      {
        id: 'fire-reports',
        name: '🔥 Fire Related',
        description: 'All fire and smoke reports',
        filters: {
          reportTypes: ['fire-sighting', 'fire-spotting'],
          urgentLevel: ['critical', 'high', 'normal'],
          timeRange: '24h'
        },
        emergency: true
      }
    ];

    return basePresets;
  }, []);

  // Available filter options
  const urgentLevelOptions = [
    { value: 'critical', label: '🚨 Critical', color: 'red', count: 0 },
    { value: 'high', label: '⚠️ High', color: 'orange', count: 0 },
    { value: 'normal', label: '📢 Normal', color: 'blue', count: 0 },
    { value: 'low', label: '💡 Low', color: 'gray', count: 0 }
  ];

  const reportTypeOptions = [
    { value: 'fire-sighting', label: '🔥 Fire Sighting', category: 'emergency' },
    { value: 'fire-spotting', label: '🔥 Fire Spotting', category: 'emergency' },
    { value: 'need-evac-help', label: '🚨 Need Evacuation', category: 'emergency' },
    { value: 'power-line-down', label: '⚡ Power Line Down', category: 'hazard' },
    { value: 'unsafe-conditions', label: '⚠️ Unsafe Conditions', category: 'hazard' },
    { value: 'road-closure', label: '🚧 Road Closure', category: 'infrastructure' },
    { value: 'offer-help', label: '🤝 Offer Help', category: 'community' }
  ];

  const verificationOptions = [
    { value: 'all', label: 'All Reports' },
    { value: 'verified', label: '✅ Verified (1+)' },
    { value: 'highly-verified', label: '🏆 Highly Verified (3+)' },
    { value: 'unverified', label: '❓ Needs Verification' }
  ];

  // Calculate filter counts based on current reports
  const filterCounts = useMemo(() => {
    const counts = {
      urgentLevel: {},
      reportTypes: {},
      verificationStatus: {}
    };

    if (!reports || !Array.isArray(reports)) {
      return counts;
    }

    reports.forEach(report => {
      // Count by urgent level
      const level = report.urgentLevel || 'normal';
      counts.urgentLevel[level] = (counts.urgentLevel[level] || 0) + 1;

      // Count by report type
      counts.reportTypes[report.type] = (counts.reportTypes[report.type] || 0) + 1;

      // Count by verification status
      const verificationCount = report.verificationCount || 0;
      if (verificationCount === 0) {
        counts.verificationStatus.unverified = (counts.verificationStatus.unverified || 0) + 1;
      } else if (verificationCount >= 3) {
        counts.verificationStatus['highly-verified'] = (counts.verificationStatus['highly-verified'] || 0) + 1;
      } else {
        counts.verificationStatus.verified = (counts.verificationStatus.verified || 0) + 1;
      }
    });

    return counts;
  }, [reports]);

  // Apply filters to reports
  const filteredResults = useMemo(() => {
    let filtered = [...reports];

    // Filter by urgent level
    if (activeFilters.urgentLevel.length > 0) {
      filtered = filtered.filter(report => 
        activeFilters.urgentLevel.includes(report.urgentLevel || 'normal')
      );
    }

    // Filter by report types
    if (activeFilters.reportTypes.length > 0) {
      filtered = filtered.filter(report => 
        activeFilters.reportTypes.includes(report.type)
      );
    }

    // Filter by time range
    if (activeFilters.timeRange !== 'all') {
      const timeOptions = getTimeFilterOptions();
      const selectedTime = timeOptions.find(opt => opt.value === activeFilters.timeRange);
      if (selectedTime && selectedTime.hours) {
        const cutoff = Date.now() - (selectedTime.hours * 60 * 60 * 1000);
        filtered = filtered.filter(report => 
          new Date(report.timestamp).getTime() > cutoff
        );
      }
    }

    // Filter by proximity
    if (activeFilters.proximityRadius && userLocation) {
      filtered = filtered.filter(report => {
        if (!report.location) return false;
        const distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          report.location.lat, report.location.lng
        );
        return distance <= activeFilters.proximityRadius;
      });
    }

    // Filter by verification status
    if (activeFilters.verificationStatus !== 'all') {
      filtered = filtered.filter(report => {
        const verificationCount = report.verificationCount || 0;
        switch (activeFilters.verificationStatus) {
          case 'verified':
            return verificationCount >= 1;
          case 'highly-verified':
            return verificationCount >= 3;
          case 'unverified':
            return verificationCount === 0;
          default:
            return true;
        }
      });
    }

    // Filter by custom keywords
    if (activeFilters.customKeywords) {
      const keywords = activeFilters.customKeywords.toLowerCase().split(' ').filter(k => k.length > 0);
      filtered = filtered.filter(report => {
        const searchText = `${report.title || ''} ${report.description || ''}`.toLowerCase();
        return keywords.some(keyword => searchText.includes(keyword));
      });
    }

    return filtered;
  }, [reports, activeFilters, userLocation]);

  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...activeFilters };
    
    if (Array.isArray(newFilters[filterKey])) {
      // Toggle array values
      if (newFilters[filterKey].includes(value)) {
        newFilters[filterKey] = newFilters[filterKey].filter(v => v !== value);
      } else {
        newFilters[filterKey] = [...newFilters[filterKey], value];
      }
    } else {
      // Set single values
      newFilters[filterKey] = value;
    }

    setActiveFilters(newFilters);
    onFilterChange(newFilters, filteredResults);
  };

  // Apply preset filters
  const applyPreset = (preset) => {
    setActiveFilters(preset.filters);
    onFilterChange(preset.filters, filteredResults);
    speak(`Applied filter preset: ${preset.name}`, { priority: 'polite' });
  };

  // Save current filters as preset
  const savePreset = () => {
    if (!newPresetName.trim()) return;

    const newPreset = {
      id: Date.now().toString(),
      name: newPresetName,
      description: `Custom filter saved at ${new Date().toLocaleString()}`,
      filters: { ...activeFilters },
      custom: true,
      timestamp: Date.now()
    };

    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    localStorage.setItem('community-filter-presets', JSON.stringify(updatedPresets));
    
    setNewPresetName('');
    setShowPresetSave(false);
    speak(`Filter preset "${newPreset.name}" saved`, { priority: 'polite' });
  };

  // Delete saved preset
  const deletePreset = (presetId) => {
    const updatedPresets = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updatedPresets);
    localStorage.setItem('community-filter-presets', JSON.stringify(updatedPresets));
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      urgentLevel: [],
      reportTypes: [],
      timeRange: 'all',
      proximityRadius: null,
      verificationStatus: 'all',
      customKeywords: ''
    };
    setActiveFilters(clearedFilters);
    onFilterChange(clearedFilters, reports);
    speak('All filters cleared', { priority: 'polite' });
  };

  // Calculate distance helper
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilters.urgentLevel.length > 0) count++;
    if (activeFilters.reportTypes.length > 0) count++;
    if (activeFilters.timeRange !== 'all') count++;
    if (activeFilters.proximityRadius) count++;
    if (activeFilters.verificationStatus !== 'all') count++;
    if (activeFilters.customKeywords) count++;
    return count;
  }, [activeFilters]);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Advanced Filters</h3>
              <p className="text-sm text-gray-600">
                {filteredResults.length} of {reports?.length || 0} reports
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                    {activeFilterCount} active
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
                title="Clear all filters"
              >
                <X className="h-4 w-4" />
                <span>Clear All</span>
              </button>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium">
                {isExpanded ? 'Less' : 'More'} Filters
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Filter Presets */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {emergencyPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-800 rounded-lg transition-colors text-sm"
                title={preset.description}
              >
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded Filter Options */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Urgent Level Filters */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
              Priority Level
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {urgentLevelOptions.map((option) => {
                const count = filterCounts.urgentLevel[option.value] || 0;
                const isActive = activeFilters.urgentLevel.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('urgentLevel', option.value)}
                    disabled={count === 0}
                    className={`p-3 rounded-lg border-2 transition-colors text-left ${
                      isActive
                        ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-800`
                        : count > 0
                        ? 'border-gray-200 hover:border-gray-300 text-gray-700'
                        : 'border-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="bg-white bg-opacity-70 px-2 py-0.5 rounded-full text-xs">
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Report Type Filters */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              <Flame className="h-4 w-4 mr-2 text-orange-600" />
              Report Types
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {reportTypeOptions.map((option) => {
                const count = filterCounts.reportTypes[option.value] || 0;
                const isActive = activeFilters.reportTypes.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('reportTypes', option.value)}
                    disabled={count === 0}
                    className={`p-3 rounded-lg border-2 transition-colors text-left ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : count > 0
                        ? 'border-gray-200 hover:border-gray-300 text-gray-700'
                        : 'border-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="bg-white bg-opacity-70 px-2 py-0.5 rounded-full text-xs">
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Range and Proximity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Range */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-purple-600" />
                Time Range
              </h4>
              <select
                value={activeFilters.timeRange}
                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {getTimeFilterOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Proximity */}
            {userLocation && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-green-600" />
                  Distance
                </h4>
                <select
                  value={activeFilters.proximityRadius || ''}
                  onChange={(e) => handleFilterChange('proximityRadius', e.target.value ? Number(e.target.value) : null)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {getProximityFilterOptions().map((option) => (
                    <option key={option.value || 'all'} value={option.value || ''}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Verification Status */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2 text-teal-600" />
              Verification Status
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {verificationOptions.map((option) => {
                const count = option.value === 'all' ? (reports?.length || 0) : (filterCounts.verificationStatus[option.value] || 0);
                const isActive = activeFilters.verificationStatus === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('verificationStatus', option.value)}
                    className={`p-3 rounded-lg border-2 transition-colors text-left ${
                      isActive
                        ? 'border-teal-500 bg-teal-50 text-teal-800'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="bg-white bg-opacity-70 px-2 py-0.5 rounded-full text-xs">
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Keywords */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              <Eye className="h-4 w-4 mr-2 text-indigo-600" />
              Search Keywords
            </h4>
            <input
              type="text"
              value={activeFilters.customKeywords}
              onChange={(e) => handleFilterChange('customKeywords', e.target.value)}
              placeholder="Search in titles and descriptions..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Saved Presets and Save Current */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800 flex items-center">
                <Star className="h-4 w-4 mr-2 text-yellow-600" />
                Saved Presets
              </h4>
              <button
                onClick={() => setShowPresetSave(!showPresetSave)}
                disabled={activeFilterCount === 0}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Save Current</span>
              </button>
            </div>

            {/* Save Preset Form */}
            {showPresetSave && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Enter preset name..."
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={savePreset}
                    disabled={!newPresetName.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowPresetSave(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Saved Presets List */}
            {savedPresets.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {savedPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <button
                        onClick={() => applyPreset(preset)}
                        className="text-left w-full"
                      >
                        <div className="font-medium text-gray-800">{preset.name}</div>
                        <div className="text-sm text-gray-600">{preset.description}</div>
                      </button>
                    </div>
                    <button
                      onClick={() => deletePreset(preset.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                      title="Delete preset"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;