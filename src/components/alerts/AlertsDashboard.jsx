import { useState, useEffect, useMemo } from 'react';
import { useAlerts } from '../../hooks/useAlerts';
import AirQualityDetail from '../air-quality/AirQualityDetail';

const AlertsDashboard = ({ userLocation }) => {
  const { 
    alerts, 
    metadata, 
    loading, 
    error, 
    lastUpdate,
    getAlertsByType,
    getHighPriorityAlerts,
    getActiveAlertsCount,
    alertsService 
  } = useAlerts(userLocation);

  const [activeFilter, setActiveFilter] = useState('fire');
  const [expandedAlert, setExpandedAlert] = useState(null);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getAQIExplanation = (aqi) => {
    if (!aqi) return { level: 'Unknown', description: 'Air quality data unavailable', healthAdvice: 'Check back later for updates', emoji: '❓', color: 'gray' };
    
    if (aqi <= 50) {
      return {
        level: 'Good',
        description: 'Air quality is excellent',
        healthAdvice: 'Perfect day for outdoor activities',
        emoji: '😊',
        color: 'green'
      };
    } else if (aqi <= 100) {
      return {
        level: 'Moderate',
        description: 'Air quality is acceptable',
        healthAdvice: 'Sensitive people may experience minor symptoms',
        emoji: '😐',
        color: 'yellow'
      };
    } else if (aqi <= 150) {
      return {
        level: 'Unhealthy for Sensitive Groups',
        description: 'Sensitive people should limit outdoor activities',
        healthAdvice: 'Children, elderly, and people with lung/heart conditions should reduce outdoor exercise',
        emoji: '😷',
        color: 'orange'
      };
    } else if (aqi <= 200) {
      return {
        level: 'Unhealthy',
        description: 'Everyone should limit outdoor activities',
        healthAdvice: 'Avoid prolonged outdoor activities. Wear N95 masks if you must go outside',
        emoji: '😨',
        color: 'red'
      };
    } else if (aqi <= 300) {
      return {
        level: 'Very Unhealthy',
        description: 'Health alert - avoid outdoor activities',
        healthAdvice: 'Stay indoors. Close windows and use air purifiers if available',
        emoji: '🚨',
        color: 'purple'
      };
    } else {
      return {
        level: 'Hazardous',
        description: 'Emergency conditions - stay indoors',
        healthAdvice: 'Emergency conditions. Everyone should avoid all outdoor activities',
        emoji: '☢️',
        color: 'red'
      };
    }
  };

  const alertTypes = [
    { id: 'all', name: 'All Alerts', icon: '🚨' },
    { id: 'fire', name: 'Fire', icon: '🔥' },
    { id: 'air-quality', name: 'Air Quality', icon: '💨' },
    { id: 'smoke', name: 'Smoke', icon: '🌫️' },
    { id: 'weather', name: 'Weather', icon: '⛈️' },
    { id: 'uv', name: 'UV Index', icon: '☀️' }
  ];

  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'all') {
      return alerts || [];
    }
    return getAlertsByType(activeFilter) || [];
  }, [activeFilter, alerts, getAlertsByType]);

  const highPriorityAlerts = getHighPriorityAlerts();

  const getSeverityBadge = (severity) => {
    const colors = alertsService.getAlertSeverityColor(severity);
    const labels = {
      high: 'HIGH PRIORITY',
      medium: 'MEDIUM',
      low: 'INFO'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${colors}`}>
        {labels[severity] || severity.toUpperCase()}
      </span>
    );
  };

  const getAlertIcon = (type) => {
    return alertsService.getAlertIcon(type);
  };

  // Enhanced loading state with timeout protection
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  if (loading && alerts.length === 0 && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alerts...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }
  
  // Show timeout message if loading takes too long
  if (loading && loadingTimeout) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-orange-800 mb-2">Loading Taking Longer Than Expected</h2>
          <p className="text-orange-700 mb-4">
            Alert services may be experiencing delays. Showing available data...
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
        
        {/* Show any alerts that have loaded */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Available Alerts ({alerts.length})
            </h3>
            <div className="text-sm text-gray-600 mb-4">
              Some alerts may not have loaded completely. Try refreshing for the latest data.
            </div>
            {/* Render basic alert list */}
            <div className="space-y-2">
              {alerts.slice(0, 5).map(alert => (
                <div key={alert.id} className="border border-gray-200 rounded p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getAlertIcon(alert.type)}</span>
                    <span className="font-medium">{alert.title}</span>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                </div>
              ))}
              {alerts.length > 5 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  And {alerts.length - 5} more alerts...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6" data-testid="alerts-content">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">🚨 Real-Time Alerts</h1>
        <p className="text-lg mb-4">
          Stay informed about fires, air quality, weather, and environmental hazards in your area
        </p>
        
        {/* Alert Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{getActiveAlertsCount()}</div>
            <div className="text-sm">Active Alerts</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{highPriorityAlerts.length}</div>
            <div className="text-sm">High Priority</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{getAlertsByType('fire').length}</div>
            <div className="text-sm">Fire Alerts</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{getAlertsByType('air-quality').length + getAlertsByType('smoke').length}</div>
            <div className="text-sm">Air Quality</div>
          </div>
        </div>
      </div>

      {/* High Priority Alerts Banner */}
      {highPriorityAlerts.length > 0 && (
        <div className="bg-red-100 border border-red-400 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 text-2xl mr-3">⚠️</span>
            <div>
              <h3 className="font-bold text-red-800">
                {highPriorityAlerts.length} High Priority Alert{highPriorityAlerts.length > 1 ? 's' : ''}
              </h3>
              <p className="text-red-700">
                {highPriorityAlerts.map(alert => alert.title).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <h3 className="font-bold mb-4">Filter Alerts</h3>
        <div className="flex flex-wrap gap-2">
          {alertTypes.map(type => {
            const count = type.id === 'all' ? (alerts?.length || 0) : (getAlertsByType(type.id)?.length || 0);
            return (
              <button
                key={type.id}
                onClick={() => setActiveFilter(type.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  activeFilter === type.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{type.icon}</span>
                <span>{type.name}</span>
                {count > 0 && (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeFilter === type.id ? 'bg-white text-orange-600' : 'bg-orange-600 text-white'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* No Alerts State */}
      {filteredAlerts.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center" data-testid="no-alerts">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">All Clear!</h3>
          <p className="text-gray-600 mb-4">
            No active alerts for your location. We're monitoring conditions 24/7.
          </p>
          <div className="text-sm text-gray-500">
            Last updated: {formatTimestamp(lastUpdate?.toISOString())}
          </div>
        </div>
      )}

      {/* Alerts List */}
      {filteredAlerts.length > 0 && (
        <div className="space-y-4">
          {filteredAlerts.map(alert => {
            const isExpanded = expandedAlert === alert.id;
            const severityColors = alertsService.getAlertSeverityColor(alert.severity);
            
            return (
              <div key={alert.id} className={`bg-white rounded-lg shadow-lg border-l-4 overflow-hidden ${
                alert.severity === 'high' ? 'border-red-500' :
                alert.severity === 'medium' ? 'border-yellow-500' : 'border-blue-500'
              }`}>
                {/* Alert Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-3xl">{getAlertIcon(alert.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">{alert.title}</h3>
                          {getSeverityBadge(alert.severity)}
                        </div>
                        <p className="text-gray-700 mb-3">{alert.message}</p>
                        
                        {/* Enhanced AQI Explanation for Air Quality Alerts */}
                        {(alert.type === 'air-quality' || alert.type === 'smoke') && alert.data?.aqi && (
                          <div className="mb-4">
                            {(() => {
                              const aqiInfo = getAQIExplanation(alert.data.aqi);
                              return (
                                <div className={`p-4 rounded-lg border-2 ${
                                  aqiInfo.color === 'green' ? 'bg-green-50 border-green-200' :
                                  aqiInfo.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                                  aqiInfo.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                                  aqiInfo.color === 'red' ? 'bg-red-50 border-red-200' :
                                  aqiInfo.color === 'purple' ? 'bg-purple-50 border-purple-200' :
                                  'bg-gray-50 border-gray-200'
                                }`}>
                                  <div className="flex items-center mb-2">
                                    <span className="text-2xl mr-3">{aqiInfo.emoji}</span>
                                    <div>
                                      <div className="font-bold text-lg">AQI {alert.data.aqi} - {aqiInfo.level}</div>
                                      <div className="text-sm text-gray-700">{aqiInfo.description}</div>
                                    </div>
                                  </div>
                                  <div className={`text-sm font-medium p-2 rounded ${
                                    aqiInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                                    aqiInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                    aqiInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                                    aqiInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                                    aqiInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    <strong>Health Advice:</strong> {aqiInfo.healthAdvice}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>📍 {alert.location}</span>
                          <span>🕒 {formatTimestamp(alert.timestamp)}</span>
                          {alert.expires && (
                            <span>⏰ Expires: {formatTimestamp(alert.expires)}</span>
                          )}
                          {alert.data?.source && (
                            <span>📊 {alert.data.source}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {alert.description && (
                      <button
                        onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                        className="ml-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                      >
                        {isExpanded ? 'Less' : 'More'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && alert.description && (
                  <div className="border-t bg-gray-50 p-6">
                    <h4 className="font-bold text-gray-800 mb-3">📋 Detailed Information</h4>
                    <p className="text-gray-700 mb-4">{alert.description}</p>
                    
                    {/* Enhanced Air Quality Details */}
                    {(alert.type === 'air-quality' || alert.type === 'smoke') && alert.data && (
                      <div className="mb-4">
                        <AirQualityDetail airQualityData={alert.data} className="shadow-sm" />
                      </div>
                    )}

                    {/* Fire Details */}
                    {alert.type === 'fire' && alert.data && (
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <h5 className="font-bold mb-3">Fire Information</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Size:</span>
                            <div className="font-bold">{alert.data.acres} acres</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Containment:</span>
                            <div className="font-bold">{alert.data.containment}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Distance:</span>
                            <div className="font-bold">{alert.data.distance} mi</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Cause:</span>
                            <div className="font-medium">{alert.data.cause}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Health Recommendations */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="font-bold text-blue-800 mb-2">🏥 Health Recommendations</h5>
                      <div className="text-blue-700 text-sm">
                        {getHealthRecommendations(alert)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Data Source Info */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h4 className="font-bold text-gray-800 mb-2">📊 Data Sources</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          {metadata?.sources && metadata.sources.length > 0 ? (
            <>
              <div className="md:col-span-2">
                <strong>Active Data Sources:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {metadata.sources.map((source, index) => (
                    <li key={index}>{source}</li>
                  ))}
                </ul>
              </div>
              {metadata.fireDataSource && (
                <div className="md:col-span-2">
                  <strong>Fire Data Source:</strong> {metadata.fireDataSource}
                  {metadata.fireApiEndpoint && (
                    <div className="text-xs text-gray-500 mt-1">
                      API: {metadata.fireApiEndpoint}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <strong>Weather & Air Quality:</strong> OpenWeatherMap API
              </div>
              <div>
                <strong>Fire Data:</strong> CAL FIRE GeoJSON & NASA EONET
              </div>
            </>
          )}
          <div>
            <strong>Last Updated:</strong> {formatTimestamp(metadata?.timestamp)}
          </div>
          <div>
            <strong>Refresh:</strong> Every 5 minutes
          </div>
          {metadata?.hasRealData === false && (
            <div className="md:col-span-2 text-orange-600 font-medium">
              ⚠️ Currently showing demo data - API connections unavailable
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-3">⚠️</span>
            <div>
              <h4 className="font-bold text-red-800">Error Loading Alerts</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getHealthRecommendations(alert) {
  switch (alert.type) {
    case 'air-quality':
    case 'smoke':
      return 'Limit outdoor activities, especially for children, elderly, and people with respiratory conditions. Consider wearing N95 masks outdoors.';
    case 'fire':
      return 'Stay indoors with windows and doors closed. Prepare for potential evacuation. Follow local emergency instructions.';
    case 'weather':
      if (alert.title.toLowerCase().includes('wind')) {
        return 'Secure outdoor objects. Avoid outdoor activities in exposed areas. Be aware of wildfire risk.';
      }
      return 'Stay informed about weather conditions. Follow local emergency guidelines.';
    case 'uv':
      return 'Use sunscreen SPF 30+, wear protective clothing, seek shade during peak hours (10am-4pm).';
    default:
      return 'Stay alert and follow official emergency guidance for your area.';
  }
}

export default AlertsDashboard;