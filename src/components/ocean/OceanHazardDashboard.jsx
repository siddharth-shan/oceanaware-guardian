/**
 * Ocean Hazard Dashboard
 *
 * Comprehensive dashboard displaying real-time ocean hazards:
 * - Tsunami warnings
 * - Sea level rise data
 * - Coastal erosion status
 * - Ocean temperature & coral bleaching
 * - Marine weather alerts
 *
 * Created for Ocean Awareness Contest 2026
 */

import { useState, useEffect } from 'react';
import {
  Waves,
  TrendingUp,
  AlertTriangle,
  Thermometer,
  Navigation,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Activity
} from 'lucide-react';
import { useOceanHazards, useHazardLevelColors, useHazardLevelText } from '../../hooks/useOceanHazards';

export default function OceanHazardDashboard({ userLocation }) {
  const { data, loading, error, lastUpdate, refresh, hazardLevel } = useOceanHazards(userLocation);
  const colors = useHazardLevelColors(hazardLevel);
  const levelText = useHazardLevelText(hazardLevel);

  const [expandedSections, setExpandedSections] = useState({
    tsunami: true,
    seaLevel: true,
    erosion: true,
    temperature: true,
    alerts: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center space-x-3">
          <RefreshCw className="w-6 h-6 text-ocean-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading ocean hazard data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-900 font-semibold">Error Loading Hazard Data</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={refresh}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.hasData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <div className="text-center">
          <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-900 font-semibold mb-2">No Ocean Data Available</h3>
          <p className="text-gray-600 text-sm">
            Unable to retrieve ocean hazard data for this location.
          </p>
        </div>
      </div>
    );
  }

  const { tsunami, seaLevel, erosion, temperature, marineAlerts } = data;

  return (
    <div className="space-y-6">
      {/* Overall Status Header */}
      <div className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 animate-fade-in`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Activity className={`w-8 h-8 ${colors.icon}`} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Ocean Hazard Status</h2>
              {userLocation?.displayName && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{userLocation.displayName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-full ${colors.bg} border-2 ${colors.border}`}>
              <span className="text-2xl mr-2">{levelText.icon}</span>
              <div>
                <div className={`text-lg font-bold ${colors.text}`}>{levelText.label}</div>
                <div className="text-xs text-gray-600">{levelText.description}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>
              Last updated: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'N/A'}
            </span>
          </div>
          <button
            onClick={refresh}
            className="flex items-center space-x-2 px-3 py-1.5 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Tsunami Warnings */}
      {tsunami && (
        <HazardCard
          title="Tsunami Monitoring"
          icon={Waves}
          expanded={expandedSections.tsunami}
          onToggle={() => toggleSection('tsunami')}
          severity={tsunami.active ? 'warning' : 'normal'}
        >
          <div className="space-y-3">
            {tsunami.active ? (
              <>
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-warning-900">Active Warnings</h4>
                      {tsunami.warnings.map((warning, idx) => (
                        <div key={idx} className="mt-2 text-sm text-warning-800">
                          <p className="font-medium">{warning.message}</p>
                          <p className="text-xs text-warning-700 mt-1">
                            Station: {warning.station} • {new Date(warning.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-kelp-50 border border-kelp-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-kelp-100 rounded-full flex items-center justify-center">
                    <Waves className="w-5 h-5 text-kelp-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-kelp-900">No Active Warnings</p>
                    <p className="text-sm text-kelp-700">
                      {tsunami.station ? `Monitoring via ${tsunami.station.name}` : 'Tsunami monitoring active'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {tsunami.waterLevel && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-600 text-xs">Current Water Level</p>
                  <p className="text-lg font-bold text-gray-900">{tsunami.waterLevel.v} m</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-600 text-xs">Status</p>
                  <p className="text-lg font-bold text-kelp-600">Normal</p>
                </div>
              </div>
            )}

            {tsunami.useMockData && (
              <div className="text-xs text-gray-500 italic mt-2">
                * Using demonstration data. Connect NOAA API for real-time monitoring.
              </div>
            )}
          </div>
        </HazardCard>
      )}

      {/* Sea Level Rise */}
      {seaLevel && (
        <HazardCard
          title="Sea Level Rise"
          icon={TrendingUp}
          expanded={expandedSections.seaLevel}
          onToggle={() => toggleSection('seaLevel')}
          severity="watch"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-ocean-50 rounded-lg p-3">
                <p className="text-xs text-ocean-700 font-medium">Current Level</p>
                <p className="text-2xl font-bold text-ocean-900">{seaLevel.current?.level.toFixed(2)}m</p>
                <p className="text-xs text-ocean-600 mt-1">Above baseline</p>
              </div>
              <div className="bg-ocean-50 rounded-lg p-3">
                <p className="text-xs text-ocean-700 font-medium">Trend</p>
                <p className="text-2xl font-bold text-ocean-900 capitalize">{seaLevel.current?.trend}</p>
                <p className="text-xs text-ocean-600 mt-1">Direction</p>
              </div>
              <div className="bg-ocean-50 rounded-lg p-3">
                <p className="text-xs text-ocean-700 font-medium">Rate</p>
                <p className="text-2xl font-bold text-ocean-900">{seaLevel.current?.rate}</p>
                <p className="text-xs text-ocean-600 mt-1">mm/year</p>
              </div>
            </div>

            {seaLevel.projections && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Projections</h4>
                <div className="space-y-2">
                  {Object.entries(seaLevel.projections).map(([year, proj]) => (
                    <div key={year} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">{year}</span>
                      <span className="text-ocean-700">
                        {proj.min}m - {proj.max}m (likely: {proj.likely}m)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {seaLevel.useMockData && (
              <div className="text-xs text-gray-500 italic">
                * Using demonstration data. Connect NASA Earthdata API for real projections.
              </div>
            )}
          </div>
        </HazardCard>
      )}

      {/* Coastal Erosion */}
      {erosion && (
        <HazardCard
          title="Coastal Erosion"
          icon={Navigation}
          expanded={expandedSections.erosion}
          onToggle={() => toggleSection('erosion')}
          severity={erosion.vulnerability === 'critical' ? 'warning' : 'watch'}
        >
          <div className="space-y-3">
            {erosion.isCoastal ? (
              <>
                <div className={`rounded-lg p-4 border-2 ${
                  erosion.vulnerability === 'critical' ? 'bg-critical-50 border-critical-200' :
                  erosion.vulnerability === 'high' ? 'bg-warning-50 border-warning-200' :
                  erosion.vulnerability === 'moderate' ? 'bg-sand-50 border-sand-200' :
                  'bg-kelp-50 border-kelp-200'
                }`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Erosion Rate</p>
                      <p className="text-3xl font-bold text-gray-900">{erosion.erosionRate}</p>
                      <p className="text-xs text-gray-600 mt-1">{erosion.erosionRateUnit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Vulnerability</p>
                      <p className={`text-2xl font-bold capitalize ${
                        erosion.vulnerability === 'critical' ? 'text-critical-700' :
                        erosion.vulnerability === 'high' ? 'text-warning-700' :
                        erosion.vulnerability === 'moderate' ? 'text-sand-700' :
                        'text-kelp-700'
                      }`}>
                        {erosion.vulnerability}
                      </p>
                    </div>
                  </div>
                </div>

                {erosion.lastSurvey && (
                  <p className="text-xs text-gray-600">
                    Last surveyed: {new Date(erosion.lastSurvey).toLocaleDateString()}
                  </p>
                )}
              </>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-700">{erosion.message}</p>
              </div>
            )}

            {erosion.useMockData && (
              <div className="text-xs text-gray-500 italic">
                * Using demonstration data. Connect USGS API for real erosion rates.
              </div>
            )}
          </div>
        </HazardCard>
      )}

      {/* Ocean Temperature */}
      {temperature && (
        <HazardCard
          title="Ocean Temperature"
          icon={Thermometer}
          expanded={expandedSections.temperature}
          onToggle={() => toggleSection('temperature')}
          severity={temperature.coralBleachingRisk === 'severe' ? 'warning' : 'normal'}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-ocean-50 rounded-lg p-3">
                <p className="text-xs text-ocean-700 font-medium">Current</p>
                <p className="text-3xl font-bold text-ocean-900">{temperature.current}°</p>
                <p className="text-xs text-ocean-600 mt-1">{temperature.unit}</p>
              </div>
              <div className="bg-ocean-50 rounded-lg p-3">
                <p className="text-xs text-ocean-700 font-medium">Anomaly</p>
                <p className={`text-3xl font-bold ${temperature.anomaly > 0 ? 'text-warning-700' : 'text-kelp-700'}`}>
                  {temperature.anomaly > 0 ? '+' : ''}{temperature.anomaly}°
                </p>
                <p className="text-xs text-ocean-600 mt-1 capitalize">{temperature.trend}</p>
              </div>
              <div className="bg-ocean-50 rounded-lg p-3">
                <p className="text-xs text-ocean-700 font-medium">Coral Risk</p>
                <p className={`text-xl font-bold capitalize ${
                  temperature.coralBleachingRisk === 'severe' ? 'text-critical-700' :
                  temperature.coralBleachingRisk === 'high' ? 'text-warning-700' :
                  temperature.coralBleachingRisk === 'moderate' ? 'text-sand-700' :
                  'text-kelp-700'
                }`}>
                  {temperature.coralBleachingRisk}
                </p>
              </div>
            </div>

            {temperature.coralBleachingRisk !== 'low' && (
              <div className={`${
                temperature.coralBleachingRisk === 'severe' ? 'bg-critical-50 border-critical-200' :
                temperature.coralBleachingRisk === 'high' ? 'bg-warning-50 border-warning-200' :
                'bg-sand-50 border-sand-200'
              } border rounded-lg p-3`}>
                <p className="text-sm font-medium text-gray-900">Coral Bleaching Alert</p>
                <p className="text-xs text-gray-700 mt-1">
                  Elevated ocean temperatures may cause coral bleaching. Monitor coral health closely.
                </p>
              </div>
            )}

            {temperature.useMockData && (
              <div className="text-xs text-gray-500 italic">
                * Using demonstration data. Connect NOAA Coral Watch API for real temperatures.
              </div>
            )}
          </div>
        </HazardCard>
      )}

      {/* Marine Alerts */}
      {marineAlerts && marineAlerts.active && (
        <HazardCard
          title="Marine Weather Alerts"
          icon={AlertTriangle}
          expanded={expandedSections.alerts}
          onToggle={() => toggleSection('alerts')}
          severity="warning"
        >
          <div className="space-y-3">
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
              <p className="font-semibold text-warning-900">
                {marineAlerts.count} Active Alert{marineAlerts.count !== 1 ? 's' : ''}
              </p>
            </div>

            {marineAlerts.alerts.map((alert, idx) => (
              <div key={alert.id || idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{alert.event}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.severity === 'Extreme' ? 'bg-critical-100 text-critical-800' :
                    alert.severity === 'Severe' ? 'bg-warning-100 text-warning-800' :
                    'bg-sand-100 text-sand-800'
                  }`}>
                    {alert.severity}
                  </span>
                </div>

                {alert.headline && (
                  <p className="text-sm font-medium text-gray-800 mb-2">{alert.headline}</p>
                )}

                {alert.description && (
                  <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                )}

                <div className="text-xs text-gray-600 space-y-1 mt-3 pt-3 border-t border-gray-200">
                  {alert.onset && (
                    <p>Onset: {new Date(alert.onset).toLocaleString()}</p>
                  )}
                  {alert.expires && (
                    <p>Expires: {new Date(alert.expires).toLocaleString()}</p>
                  )}
                  {alert.areas && (
                    <p>Areas: {alert.areas}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </HazardCard>
      )}
    </div>
  );
}

/**
 * Reusable Hazard Card Component
 */
function HazardCard({ title, icon: Icon, children, expanded, onToggle, severity = 'normal' }) {
  const severityColors = {
    normal: 'border-gray-200 bg-white',
    watch: 'border-sand-200 bg-sand-50',
    warning: 'border-warning-200 bg-warning-50',
    critical: 'border-critical-200 bg-critical-50'
  };

  return (
    <div className={`border-2 rounded-xl overflow-hidden transition-all ${severityColors[severity]}`}>
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Icon className={`w-6 h-6 ${
            severity === 'critical' ? 'text-critical-600' :
            severity === 'warning' ? 'text-warning-600' :
            severity === 'watch' ? 'text-sand-600' :
            'text-ocean-600'
          }`} />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 animate-slide-up">
          {children}
        </div>
      )}
    </div>
  );
}
