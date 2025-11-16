/**
 * Crisis Mode Interface - Simplified emergency-only interface
 * Activated during critical emergency situations for maximum clarity and efficiency
 */

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Phone, 
  RefreshCw, 
  Shield, 
  Flame, 
  Users, 
  MapPin, 
  Clock,
  ExternalLink,
  Megaphone,
  Send
} from 'lucide-react';
import { useAccessibility } from '../accessibility/AccessibilityProvider';
import { generateEmergencyAnnouncement } from '../../utils/emergencyHelpers';
import { getDisplayLocation } from '../../utils/locationUtils';

const CrisisMode = ({ 
  reports = [], 
  userLocation, 
  onRefresh, 
  loading = false,
  emergencyLevel = 'crisis',
  onExitCrisisMode
}) => {
  const { speak } = useAccessibility();
  const [lastAnnouncement, setLastAnnouncement] = useState(null);
  
  // Debug logging
  console.log('CrisisMode: reports data:', reports);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Auto-refresh every 15 seconds in crisis mode
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const interval = setInterval(() => {
      onRefresh();
    }, 15000); // 15 seconds
    
    return () => clearInterval(interval);
  }, [onRefresh, autoRefreshEnabled]);

  // Announce critical updates
  useEffect(() => {
    if (reports.length > 0) {
      const announcement = generateEmergencyAnnouncement(emergencyLevel, reports.length);
      if (announcement !== lastAnnouncement) {
        speak(announcement, { emergency: true });
        setLastAnnouncement(announcement);
      }
    }
  }, [reports.length, emergencyLevel, speak, lastAnnouncement]);

  const emergencyActions = [
    {
      id: 'call911',
      label: '📞 CALL 911',
      description: 'Emergency Services',
      action: () => window.location.href = 'tel:911',
      className: 'bg-red-600 hover:bg-red-700 text-white',
      priority: 'critical'
    },
    {
      id: 'report-hazard',
      label: '🔥 REPORT HAZARD',
      description: 'Report emergency hazard',
      action: () => {
        // Scroll to or show emergency reporting form
        const reportSection = document.getElementById('emergency-reporting');
        if (reportSection) {
          reportSection.scrollIntoView({ behavior: 'smooth' });
        }
      },
      className: 'bg-red-700 hover:bg-red-800 text-white',
      priority: 'critical'
    },
    {
      id: 'evacuation',
      label: '🚨 EVACUATION INFO',
      description: 'Get evacuation routes',
      action: () => window.open('https://www.ready.gov/evacuation', '_blank'),
      className: 'bg-orange-600 hover:bg-orange-700 text-white',
      priority: 'high'
    },
    {
      id: 'shelter',
      label: '🏠 FIND SHELTER',
      description: 'Emergency shelters',
      action: () => window.open('https://www.redcross.org/get-help/disaster-relief-and-recovery-services/find-an-open-shelter', '_blank'),
      className: 'bg-blue-600 hover:bg-blue-700 text-white',
      priority: 'high'
    },
    {
      id: 'medical',
      label: '🏥 MEDICAL HELP',
      description: 'Non-emergency medical',
      action: () => window.location.href = 'tel:211',
      className: 'bg-green-600 hover:bg-green-700 text-white',
      priority: 'medium'
    }
  ];

  return (
    <div className="min-h-screen bg-red-50 p-4 space-y-6" data-testid="crisis-mode">
      {/* Crisis Mode Header */}
      <div className="bg-red-600 text-white p-6 rounded-lg text-center shadow-2xl relative">
        {/* Exit Crisis Mode Button */}
        {onExitCrisisMode && (
          <button
            onClick={onExitCrisisMode}
            className="absolute top-4 right-4 bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            title="Exit Crisis Mode (for testing or non-emergency situations)"
          >
            Exit Crisis Mode
          </button>
        )}
        
        <div className="flex items-center justify-center space-x-4 mb-4">
          <AlertTriangle className="h-12 w-12 animate-pulse" />
          <h1 className="text-3xl lg:text-4xl font-bold">EMERGENCY MODE</h1>
          <AlertTriangle className="h-12 w-12 animate-pulse" />
        </div>
        <div className="space-y-2">
          <p className="text-xl font-semibold">🚨 CRISIS SITUATION ACTIVE 🚨</p>
          <p className="text-red-100">
            Simplified interface • Critical reports only • Auto-refresh every 15 seconds
          </p>
          {userLocation && (
            <p className="text-red-200 text-sm">
              📍 Monitoring: {userLocation.displayName || `${userLocation.lat.toFixed(3)}, ${userLocation.lng.toFixed(3)}`}
            </p>
          )}
        </div>
      </div>

      {/* Emergency Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {emergencyActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`p-6 rounded-lg font-bold text-xl transition-all duration-200 transform hover:scale-105 shadow-lg ${action.className}`}
            aria-label={`${action.label} - ${action.description}`}
          >
            <div className="flex flex-col items-center space-y-2">
              <span className="text-3xl">{action.label}</span>
              <span className="text-sm font-normal opacity-90">{action.description}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Auto-refresh Control */}
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <RefreshCw className={`h-5 w-5 ${loading || autoRefreshEnabled ? 'animate-spin' : ''} text-blue-600`} />
            <div>
              <h3 className="font-semibold text-gray-800">Auto-Refresh</h3>
              <p className="text-sm text-gray-600">Updates every 15 seconds</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                autoRefreshEnabled 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {autoRefreshEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Updating...' : 'Refresh Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Critical Reports Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-red-800 flex items-center">
            <Flame className="h-7 w-7 mr-3 animate-pulse" />
            Critical Emergency Reports
          </h2>
          <div className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-lg">
            {reports.length}
          </div>
        </div>
        
        {reports.length === 0 ? (
          <div className="bg-white p-8 rounded-lg text-center shadow-lg">
            <Shield className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-800 mb-2">No Critical Reports</h3>
            <p className="text-green-700 text-lg">
              Your area currently has no emergency-level reports
            </p>
            <p className="text-green-600 text-sm mt-2">
              Continue monitoring • Stay prepared • Follow official guidance
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.slice(0, 25).map((report, index) => (
              <CriticalReportCard
                key={report.id || index}
                report={report}
                userLocation={userLocation}
                index={index + 1}
              />
            ))}
            
            {reports.length > 25 && (
              <div className="bg-orange-100 border border-orange-400 rounded-lg p-4 text-center">
                <Megaphone className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-orange-800 font-semibold">
                  {reports.length - 25} additional critical reports available
                </p>
                <p className="text-orange-700 text-sm">
                  Showing top 25 most urgent reports
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Emergency Reporting Section */}
      <div id="emergency-reporting" className="bg-red-100 border-2 border-red-300 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
          <h3 className="text-xl font-bold text-red-800">Report Emergency Hazard</h3>
        </div>
        
        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-red-700 font-medium mb-3">
            🚨 For immediate life-threatening emergencies, call 911 first!
          </p>
          <p className="text-gray-700 text-sm mb-4">
            Use this form to report fire hazards, smoke sightings, or other emergency conditions in your area.
          </p>
          
          <EmergencyReportForm 
            userLocation={userLocation} 
            onReportSubmitted={() => {
              // Refresh reports after successful submission
              if (onRefresh) {
                onRefresh();
              }
            }}
          />
        </div>
      </div>

      {/* Emergency Information Footer */}
      <div className="bg-gray-800 text-white p-6 rounded-lg">
        <h3 className="font-bold text-lg mb-3 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Emergency Resources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">🚨 Emergency Services</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• 911 - Fire, Police, Medical</li>
              <li>• 211 - Non-emergency help</li>
              <li>• 311 - City services</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">📻 Official Updates</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• Local emergency radio</li>
              <li>• Weather service alerts</li>
              <li>• City emergency website</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">🏠 Safety Actions</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• Follow evacuation orders</li>
              <li>• Stay informed</li>
              <li>• Help neighbors safely</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Helper function to get location display name with reverse geocoding
 */
const getLocationDisplayName = async (location) => {
  if (!location) return 'Unknown Area';
  
  // Use the best available location descriptor (skip if it's "Unknown Area")
  if (location.displayName && location.displayName !== 'Unknown Area') return location.displayName;
  if (location.region && location.region !== 'Unknown Area') return location.region;
  if (location.city && location.state) return `${location.city}, ${location.state}`;
  if (location.city) return `${location.city} Area`;
  if (location.county && location.state) return `${location.county} County, ${location.state}`;
  if (location.county) return `${location.county} County`;
  if (location.state) return `${location.state} Area`;
  
  // Use reverse geocoding for coordinates
  if (location.lat && location.lng) {
    try {
      const displayLocation = await getDisplayLocation(location.lat, location.lng, location.region);
      return displayLocation;
    } catch (error) {
      console.warn('Failed to get display location:', error);
      // Fallback to regional description instead of raw coordinates
      const lat = Math.round(location.lat * 10) / 10;
      const lng = Math.round(location.lng * 10) / 10;
      return `Southern California area (${lat}, ${lng})`;
    }
  }
  
  return 'Unknown Area';
};

/**
 * Critical Report Card - Emergency-optimized display
 */
const CriticalReportCard = ({ report, userLocation, index }) => {
  const [locationDisplay, setLocationDisplay] = useState('Loading location...');
  
  // Load location display name asynchronously
  useEffect(() => {
    const loadLocationDisplay = async () => {
      if (report.location) {
        try {
          const displayName = await getLocationDisplayName(report.location);
          setLocationDisplay(displayName);
        } catch (error) {
          console.warn('Failed to load location display:', error);
          setLocationDisplay('Location updating...');
        }
      } else {
        setLocationDisplay('Location unavailable');
      }
    };
    
    loadLocationDisplay();
  }, [report.location]);
  // Debug logging
  console.log('CriticalReportCard: received report:', report);
  
  // Safety check - ensure report exists and has minimum required properties
  if (!report || typeof report !== 'object') {
    console.warn('CriticalReportCard: Invalid report object', report);
    return null;
  }

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

  const distance = userLocation && report.location
    ? calculateDistance(
        userLocation.lat, userLocation.lng,
        report.location.lat, report.location.lng
      )
    : null;

  const timeAgo = report.timestamp || report.createdAt
    ? Math.floor((Date.now() - new Date(report.timestamp || report.createdAt).getTime()) / (1000 * 60))
    : null;

  const getReportIcon = (type) => {
    const icons = {
      // Original type values
      'fire-spotting': '🔥',
      'need-evac-help': '🚨',
      'power-line-down': '⚡',
      'power-lines-down': '⚡',
      'unsafe-conditions': '⚠️',
      'road-closure': '🚧',
      // Backend hazardType values
      'Dead Vegetation': '🌿',
      'Power Line Hazard': '⚡',
      'Fire Sighting': '🔥',
      'Unsafe Conditions': '⚠️',
      'Emergency': '🚨'
    };
    return icons[type || 'default'] || '📢';
  };

  const getEmergencyTypeDisplay = (report) => {
    const type = report.type || report.hazardType;
    if (!type) return 'EMERGENCY REPORT';
    
    // Handle different type formats
    const typeDisplayMap = {
      'power-lines-down': 'POWER LINES DOWN',
      'power-line-down': 'POWER LINES DOWN',
      'fire-spotting': 'FIRE SIGHTING',
      'fire-sighting': 'FIRE SIGHTING',
      'need-evac-help': 'EVACUATION NEEDED',
      'unsafe-conditions': 'UNSAFE CONDITIONS',
      'road-closure': 'ROAD CLOSURE'
    };
    
    // Use mapped display name or format the original type
    return typeDisplayMap[type] || type.toString().replace(/-/g, ' ').replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="bg-white border-l-4 border-red-500 rounded-lg p-6 shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-red-100 p-2 rounded-full">
            <span className="text-2xl">{getReportIcon(report.type || report.hazardType)}</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">
                #{index}
              </span>
              <h3 className="text-xl font-bold text-red-800">
                {report.title || getEmergencyTypeDisplay(report)}
              </h3>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              {distance && (
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {distance.toFixed(1)} km away
                </span>
              )}
              {timeAgo !== null && (
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`}
                </span>
              )}
              {report.verificationCount > 0 && (
                <span className="flex items-center text-green-600">
                  <Users className="h-4 w-4 mr-1" />
                  {report.verificationCount} verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-800 text-lg leading-relaxed">
          {report.description}
        </p>
        {report.location && (
          <p className="text-gray-600 text-sm mt-2">
            📍 {locationDisplay}
          </p>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
            URGENT
          </span>
          {report.urgentLevel === 'critical' && (
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              CRITICAL
            </span>
          )}
        </div>
        
        <div className="text-sm text-gray-500">
          Reported {new Date(report.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

// Emergency Report Form Component
const EmergencyReportForm = ({ userLocation, onReportSubmitted }) => {
  const [formData, setFormData] = useState({
    type: 'fire-sighting',
    urgentLevel: 'critical',
    title: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { speak } = useAccessibility();

  const emergencyTypes = [
    { value: 'fire-sighting', label: '🔥 Fire/Smoke Sighting', priority: 'critical' },
    { value: 'evacuation-needed', label: '🚨 Evacuation Needed', priority: 'critical' },
    { value: 'road-blocked', label: '🚧 Road Blocked', priority: 'high' },
    { value: 'power-lines-down', label: '⚡ Power Lines Down', priority: 'high' },
    { value: 'structure-damage', label: '🏠 Structure Damage', priority: 'high' },
    { value: 'people-trapped', label: '🆘 People Trapped', priority: 'critical' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const reportData = {
        ...formData,
        location: userLocation,
        timestamp: new Date().toISOString(),
        userId: `emergency_${Date.now()}`, // Anonymous emergency reporting
        emergencyReport: true
      };

      console.log('🚨 Submitting emergency report:', reportData);

      const response = await fetch('/api/community/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      const result = await response.json();

      if (result.success) {
        setSubmitSuccess(true);
        speak('Emergency report submitted successfully', { priority: 'emergency' });
        
        // Call the callback to refresh parent component's reports
        if (onReportSubmitted) {
          onReportSubmitted(result);
        }
        
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            type: 'fire-sighting',
            urgentLevel: 'critical',
            title: '',
            description: ''
          });
          setSubmitSuccess(false);
        }, 3000);
      } else {
        throw new Error(result.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('❌ Error submitting emergency report:', error);
      speak('Error submitting report. Please try again or call 911.', { priority: 'emergency' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-green-100 border border-green-400 rounded-lg p-4 text-center">
        <div className="text-green-800 font-bold text-lg mb-2">✅ Report Submitted Successfully</div>
        <p className="text-green-700">
          Your emergency report has been submitted and will be reviewed immediately.
        </p>
        <p className="text-green-600 text-sm mt-2">
          Emergency services have been notified if required.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Emergency Type */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Emergency Type *
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
          className="w-full p-3 border-2 border-red-300 rounded-lg text-lg font-medium focus:border-red-500 focus:outline-none"
          required
        >
          {emergencyTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Brief Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Large fire visible from Main Street"
          className="w-full p-3 border-2 border-red-300 rounded-lg text-lg focus:border-red-500 focus:outline-none"
          maxLength={100}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what you see, approximate size, direction, any immediate dangers..."
          className="w-full p-3 border-2 border-red-300 rounded-lg text-lg focus:border-red-500 focus:outline-none"
          rows={4}
          maxLength={500}
          required
        />
      </div>

      {/* Location Display */}
      <div className="bg-gray-100 p-3 rounded-lg">
        <div className="flex items-center text-gray-700">
          <MapPin className="h-5 w-5 mr-2" />
          <span className="font-medium">Location:</span>
          <span className="ml-2">
            {userLocation?.region || 'Current Location'} 
            ({userLocation?.lat?.toFixed(3)}, {userLocation?.lng?.toFixed(3)})
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="animate-spin h-6 w-6 mr-2" />
            Submitting Emergency Report...
          </>
        ) : (
          <>
            <Send className="h-6 w-6 mr-2" />
            Submit Emergency Report
          </>
        )}
      </button>

      <div className="text-center text-sm text-gray-600">
        <p>Your location will be included to help emergency responders.</p>
        <p className="mt-1 font-medium text-red-600">
          For immediate life-threatening emergencies, call 911 directly.
        </p>
      </div>
    </form>
  );
};

export default CrisisMode;