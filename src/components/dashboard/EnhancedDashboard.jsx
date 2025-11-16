import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Waves, Wind, MapPin, Clock, Shield, Eye, Navigation, Phone, Users, Droplets, Fish } from 'lucide-react';
import CompactNewsWidget from '../news/CompactNewsWidget';
import AirQualityDetail from '../air-quality/AirQualityDetail';
import UnifiedLocationCard from '../location/UnifiedLocationCard';
import EnhancedEmergencyActionBar from './EnhancedEmergencyActionBar';
import FeatureShowcase from '../showcase/FeatureShowcase';
import { useAlerts } from '../../hooks/useAlerts';
import { useWeatherData } from '../../hooks/useWeatherData';
import { useAccessibility } from '../accessibility/AccessibilityProvider';
import OceanHazardDashboard from '../ocean/OceanHazardDashboard';

/**
 * Enhanced Dashboard with Dynamic Priority Layout
 * - Highlights active fires and critical alerts
 * - Adapts layout based on emergency conditions
 * - Provides comprehensive situation awareness
 */
const EnhancedDashboard = ({ userLocation, onLocationChange, onNavigateToAlerts, onNavigateToTab }) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const priorityContentRef = useRef(null);
  const { translate } = useAccessibility();
  
  // Data hooks
  const { weather: weatherData, loading: weatherLoading } = useWeatherData(userLocation);
  const { 
    alerts, 
    loading: alertsLoading, 
    getHighPriorityAlerts,
    getAlertsByType,
    getActiveAlertsCount 
  } = useAlerts(userLocation);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate emergency status with safe data handling - using alerts data for consistency
  const highPriorityAlerts = getHighPriorityAlerts?.() || [];
  const fireAlerts = getAlertsByType?.('fire') || [];
  const nearbyFires = fireAlerts.filter(alert => alert?.data?.distance <= 25);
  const criticalAirQuality = Array.isArray(alerts) ? alerts.find(alert => 
    alert?.type === 'air-quality' && alert?.severity === 'high'
  ) : null;
  const emergencyLevel = getEmergencyLevel();

  function getEmergencyLevel() {
    try {
      if (nearbyFires.length > 0 || highPriorityAlerts.length > 0) {
        return 'critical';
      }
      if (getAlertsByType?.('fire')?.length > 0 || getAlertsByType?.('smoke')?.length > 0) {
        return 'warning';
      }
      if (getActiveAlertsCount?.() > 0) {
        return 'watch';
      }
      return 'normal';
    } catch (error) {
      console.error('Error calculating emergency level:', error);
      return 'normal';
    }
  }



  return (
    <div className="space-y-4 lg:space-y-6">
      {/* CRITICAL EMERGENCY ALERT - Detailed and informative */}
      {emergencyLevel === 'critical' && (
        <div className="rounded-lg shadow-lg border-l-4 p-6 mb-6" 
             style={{
               background: 'var(--color-fire-50)',
               borderLeftColor: 'var(--color-emergency-critical)'
             }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-3 rounded-lg" 
                   style={{ backgroundColor: 'var(--color-fire-100)' }}>
                <AlertTriangle className="h-7 w-7" style={{ color: 'var(--color-emergency-critical)' }} />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--color-fire-800)' }}>
                    Critical Emergency Alert
                  </h2>
                  <span className="px-2 py-1 rounded-full text-xs font-bold" 
                        style={{ 
                          backgroundColor: 'var(--color-emergency-critical)', 
                          color: 'white'
                        }}>
                    URGENT
                  </span>
                </div>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-ocean-700)' }}>
                  Critical ocean hazards detected in your area
                </p>
                <p className="text-xs" style={{ color: 'var(--color-ocean-600)' }}>
                  Follow coastal safety advisories immediately • Call 911 if in immediate danger
                </p>
              </div>
            </div>
          </div>
          
          {/* Detailed Ocean Hazard and Threat Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-fire-800)' }}>
              Active Threats:
            </h3>
            
            {/* Nearby Ocean Hazards */}
            {nearbyFires.slice(0, 3).map((fire, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border" 
                   style={{ backgroundColor: 'var(--color-fire-100)', borderColor: 'var(--color-fire-200)' }}>
                <div className="flex items-center space-x-3">
                  <Waves className="h-5 w-5" style={{ color: 'var(--color-emergency-critical)' }} />
                  <div>
                    <h4 className="font-medium text-sm" style={{ color: 'var(--color-fire-800)' }}>
                      {fire.title}
                    </h4>
                    <div className="flex items-center space-x-3 text-xs" style={{ color: 'var(--color-fire-600)' }}>
                      <span>📍 {fire.data?.distance?.toFixed(1) || 'Unknown'} miles away</span>
                      <span>🌊 {fire.data?.acres?.toLocaleString() || 'Unknown'} affected area</span>
                      <span>⚠️ Active hazard</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs px-2 py-1 rounded-full font-bold" 
                     style={{ 
                       backgroundColor: fire.data?.distance <= 10 ? 'var(--color-emergency-critical)' : 'var(--color-warning-500)',
                       color: 'white'
                     }}>
                  {fire.data?.distance <= 10 ? 'IMMEDIATE' : 'NEARBY'}
                </div>
              </div>
            ))}
            
            {/* High Priority Weather/Environmental Alerts */}
            {highPriorityAlerts.filter(alert => alert.type !== 'fire').slice(0, 2).map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border" 
                   style={{ backgroundColor: 'var(--color-warning-100)', borderColor: 'var(--color-warning-200)' }}>
                <div className="flex items-center space-x-3">
                  <Wind className="h-5 w-5" style={{ color: 'var(--color-warning-600)' }} />
                  <div>
                    <h4 className="font-medium text-sm" style={{ color: 'var(--color-warning-800)' }}>
                      {alert.title || 'Environmental Alert'}
                    </h4>
                    <p className="text-xs" style={{ color: 'var(--color-warning-600)' }}>
                      {alert.description || 'Hazardous conditions detected'}
                    </p>
                  </div>
                </div>
                <div className="text-xs px-2 py-1 rounded-full font-bold" 
                     style={{ backgroundColor: 'var(--color-warning-500)', color: 'white' }}>
                  HIGH
                </div>
              </div>
            ))}
            
            {/* Action Items */}
            <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-neutral-100)' }}>
              <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-neutral-800)' }}>
                Immediate Actions:
              </h4>
              <ul className="text-sm space-y-1" style={{ color: 'var(--color-neutral-700)' }}>
                <li>• Monitor coastal advisories and tsunami warnings</li>
                <li>• Move to higher ground if flooding is imminent</li>
                <li>• Stay informed through NOAA and local authorities</li>
                <li>• Avoid beaches and coastal areas during hazardous conditions</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* WARNING MODE - Subtle approach */}
      {emergencyLevel === 'warning' && (
        <div className="rounded-lg shadow-md border-l-4 p-5 mb-4" 
             style={{
               background: 'var(--color-warning-50)',
               borderLeftColor: 'var(--color-emergency-warning)'
             }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg" 
                   style={{ backgroundColor: 'var(--color-warning-100)' }}>
                <Waves className="h-6 w-6" style={{ color: 'var(--color-emergency-warning)' }} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-warning-800)' }}>
                  Ocean Hazard Warning Active
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-warning-700)' }}>
                  Coastal hazards detected in your area - stay alert
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToAlerts && onNavigateToAlerts()}
              className="px-6 py-2 rounded-lg transition-all duration-200 font-medium text-sm hover:shadow-md"
              style={{
                backgroundColor: 'var(--color-emergency-warning)',
                color: 'white'
              }}
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* WATCH MODE - Clean information bar */}
      {emergencyLevel === 'watch' && (
        <div className="rounded-lg shadow border-l-4 p-4 mb-4" 
             style={{
               background: 'var(--color-warning-50)',
               borderLeftColor: 'var(--color-emergency-watch)'
             }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="h-5 w-5" style={{ color: 'var(--color-emergency-watch)' }} />
              <div>
                <span className="font-semibold" style={{ color: 'var(--color-warning-800)' }}>
                  Weather Watch Active
                </span>
                <span className="text-sm ml-3" style={{ color: 'var(--color-warning-700)' }}>
                  {getActiveAlertsCount?.()} active alerts
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateToAlerts && onNavigateToAlerts()}
              className="px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium hover:shadow-md"
              style={{
                backgroundColor: 'var(--color-emergency-watch)',
                color: 'white'
              }}
            >
              Monitor
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Emergency Action Bar - Modern UX design */}
      <EnhancedEmergencyActionBar 
        emergencyLevel={emergencyLevel}
        onNavigateToTab={onNavigateToTab}
        onEmergencyCall={() => window.open('tel:911')}
        lastUpdate={lastUpdate}
      />

      {/* Critical Emergency Information - Above the fold priority */}
      {emergencyLevel !== 'normal' && (
        <div className="space-y-4">
          {/* Consolidated Ocean Hazard Activity Section */}
          <div className="bg-white rounded-lg shadow-md border-l-4 p-6" 
               style={{ borderLeftColor: nearbyFires.length > 0 ? 'var(--color-emergency-critical)' : 'var(--color-fire-400)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg" 
                     style={{ backgroundColor: nearbyFires.length > 0 ? 'var(--color-fire-100)' : 'var(--color-neutral-100)' }}>
                  <Waves className="h-6 w-6" 
                         style={{ color: nearbyFires.length > 0 ? 'var(--color-emergency-critical)' : 'var(--color-fire-500)' }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1"
                      style={{ color: nearbyFires.length > 0 ? 'var(--color-ocean-800)' : 'var(--color-neutral-800)' }}>
                    Ocean Hazard Activity
                  </h3>
                  <p className="text-sm"
                     style={{ color: nearbyFires.length > 0 ? 'var(--color-ocean-700)' : 'var(--color-neutral-600)' }}>
                    {nearbyFires.length > 0
                      ? `${nearbyFires.length} ocean hazard${nearbyFires.length > 1 ? 's' : ''} within 25 miles`
                      : fireAlerts.length > 0
                        ? `${fireAlerts.length} ocean hazard${fireAlerts.length > 1 ? 's' : ''} in region (25-50 miles)`
                        : 'No active ocean hazards detected'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (onNavigateToTab) {
                    onNavigateToTab('fire-monitoring');
                    // Navigate to alerts subtab to show live alerts
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('navigateSubTab', { 
                        detail: { tab: 'fire-monitoring', subTab: 'alerts' } 
                      }));
                    }, 100);
                  }
                }}
                className="px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm hover:shadow-md"
                style={{
                  backgroundColor: nearbyFires.length > 0 ? 'var(--color-emergency-critical)' : 'var(--color-fire-500)',
                  color: 'white'
                }}
              >
                {nearbyFires.length > 0 ? 'View Live Alerts' : 'Monitor Area'}
              </button>
            </div>
            
            {/* Ocean Hazard Details with Map Integration */}
            {(nearbyFires.length > 0 || fireAlerts.length > 0) ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ocean Hazard List */}
                <div className="space-y-3">
                  {nearbyFires.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-ocean-800)' }}>
                        Nearby Ocean Hazards (≤25 miles)
                      </h4>
                      {nearbyFires.slice(0, 3).map((fire, index) => (
                        <div key={index} className="p-3 rounded-lg border" 
                             style={{ backgroundColor: 'var(--color-fire-50)', borderColor: 'var(--color-fire-200)' }}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm" style={{ color: 'var(--color-fire-800)' }}>
                                {fire.title}
                              </h5>
                              <div className="flex items-center space-x-4 mt-1 text-xs" style={{ color: 'var(--color-fire-600)' }}>
                                <span>📍 {fire.data?.distance?.toFixed(1) || 'Unknown'} mi</span>
                                <span>🌊 {fire.data?.acres?.toLocaleString() || 'Unknown'} affected area</span>
                                <span>⚠️ Active hazard</span>
                              </div>
                            </div>
                            <div className="text-xs px-2 py-1 rounded-full" 
                                 style={{ 
                                   backgroundColor: fire.data?.distance <= 10 ? 'var(--color-emergency-critical)' : 'var(--color-warning-500)',
                                   color: 'white'
                                 }}>
                              {fire.data?.distance <= 10 ? 'CLOSE' : 'NEAR'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {fireAlerts.length > nearbyFires.length && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-warning-700)' }}>
                        Regional Ocean Hazards (25-50 miles)
                      </h4>
                      {fireAlerts.filter(fire => !nearbyFires.includes(fire)).slice(0, 2).map((fire, index) => (
                        <div key={index} className="p-3 rounded-lg border" 
                             style={{ backgroundColor: 'var(--color-warning-50)', borderColor: 'var(--color-warning-200)' }}>
                          <h5 className="font-medium text-sm" style={{ color: 'var(--color-warning-800)' }}>
                            {fire.title}
                          </h5>
                          <div className="flex items-center space-x-3 mt-1 text-xs" style={{ color: 'var(--color-warning-600)' }}>
                            <span>📍 {fire.data?.distance?.toFixed(1) || 'Unknown'} mi</span>
                            <span>🌊 {fire.data?.acres?.toLocaleString() || 'Unknown'} affected area</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Map Integration */}
                <div className="min-h-[300px]">
                  <div className="bg-gray-100 rounded-lg h-full flex items-center justify-center border"
                       style={{ borderColor: 'var(--color-neutral-200)' }}>
                    <OceanHazardDashboard userLocation={userLocation} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-success-50)' }}>
                  <Shield className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--color-success-600)' }} />
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--color-success-800)' }}>
                    No Active Ocean Hazards Detected
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--color-success-700)' }}>
                    No significant ocean hazards currently detected in your area.
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'var(--color-success-600)' }}>
                    Last checked: {lastUpdate.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Air Quality Information - Subtle design */}
          {criticalAirQuality && (
            <div className="rounded-lg shadow-lg p-5 border-l-4" 
                 style={{
                   background: 'var(--color-info-50)',
                   borderLeftColor: 'var(--color-info-600)'
                 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg" 
                       style={{ backgroundColor: 'var(--color-info-100)' }}>
                    <Wind className="h-6 w-6" style={{ color: 'var(--color-info-600)' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-info-800)' }}>
                      Poor Air Quality
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-info-700)' }}>
                      Avoid outdoor activities
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateToTab && onNavigateToTab('dashboard')}
                  className="px-5 py-2 rounded-lg transition-all duration-200 font-medium text-sm hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--color-info-600)',
                    color: 'white'
                  }}
                >
                  Details
                </button>
              </div>
            </div>
          )}


        </div>
      )}

      {/* Normal Mode Content - Progressive Disclosure */}
      {emergencyLevel === 'normal' && (
        <div className="space-y-6">
          {/* Welcome Section - Normal Mode Only */}
          <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-1 lg:mb-2">
                  {translate('app.title', 'OceanAware Guardian')}
                </h2>
                <p className="text-sm lg:text-base text-gray-600">
                  {translate('app.tagline', 'AI-powered ocean conservation and coastal safety platform')}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div className="flex items-center text-xs lg:text-sm text-gray-500 mb-1">
                  <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  Last update: {lastUpdate.toLocaleTimeString()}
                </div>
                <div className="flex items-center text-xs lg:text-sm text-green-600">
                  <Shield className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  All Clear - No Active Threats
                </div>
              </div>
            </div>
          </div>

          {/* Feature Showcase - Normal Mode Only */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <FeatureShowcase 
            onNavigate={(tab, subTab) => {
              if (subTab && onNavigateToTab) {
                onNavigateToTab(tab);
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('navigateSubTab', { 
                    detail: { tab, subTab } 
                  }));
                }, 100);
              } else if (onNavigateToTab) {
                onNavigateToTab(tab);
              }
            }}
            />
          </div>
        </div>
      )}

      {/* Weather and Environmental Conditions */}
      {(emergencyLevel === 'normal' || emergencyLevel === 'watch') && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-neutral-800)' }}>
              Environmental Conditions
            </h3>
            <div className="text-xs" style={{ color: 'var(--color-neutral-500)' }}>
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
          <UnifiedLocationCard 
            userLocation={userLocation}
            onLocationChange={onLocationChange}
            nearbyFires={nearbyFires.length}
            activeAlertsCount={getActiveAlertsCount?.() || 0}
            lastUpdate={lastUpdate}
            weatherData={weatherData}
          />
        </div>
      )}



      {/* Priority Content Area - Dynamic Layout */}
      {emergencyLevel !== 'normal' && (
        <div ref={priorityContentRef} className="space-y-4 lg:space-y-6">
          {/* Critical Ocean Hazard Information - Additional alerts only */}

          {/* Critical Air Quality */}
          {criticalAirQuality?.data && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 lg:p-6">
              <div className="flex items-center mb-4">
                <Wind className="h-6 w-6 text-orange-600 mr-3" />
                <h3 className="text-xl font-bold text-orange-800">Air Quality Alert</h3>
              </div>
              <AirQualityDetail airQualityData={criticalAirQuality.data} />
            </div>
          )}
        </div>
      )}

      {/* News and Updates - Normal Mode */}
      {emergencyLevel === 'normal' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-neutral-800)' }}>
            Latest Updates
          </h3>
          <CompactNewsWidget userLocation={userLocation} />
        </div>
      )}

      {/* System Status Footer - Always Visible */}
      <div className="bg-gray-50 rounded-lg p-3 lg:p-4 border">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 text-xs lg:text-sm">
          <div>
            <span className="text-gray-600 block lg:inline">Fire Data:</span>
            <div className={`font-medium ${alertsLoading ? 'text-yellow-600' : 'text-green-600'}`}>
              {alertsLoading ? 'Updating...' : 'Connected'}
            </div>
          </div>
          <div>
            <span className="text-gray-600 block lg:inline">Weather:</span>
            <div className={`font-medium ${weatherLoading ? 'text-yellow-600' : 'text-green-600'}`}>
              {weatherLoading ? 'Updating...' : 'Connected'}
            </div>
          </div>
          <div>
            <span className="text-gray-600 block lg:inline">Alerts:</span>
            <div className={`font-medium ${alertsLoading ? 'text-yellow-600' : 'text-green-600'}`}>
              {alertsLoading ? 'Updating...' : 'Active'}
            </div>
          </div>
          <div>
            <span className="text-gray-600 block lg:inline">Emergency Level:</span>
            <div className={`font-medium capitalize ${
              emergencyLevel === 'critical' ? 'text-red-600' :
              emergencyLevel === 'warning' ? 'text-orange-600' :
              emergencyLevel === 'watch' ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {emergencyLevel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
