/**
 * Ocean Data Visualizer
 *
 * Interactive visualizations for ocean data:
 * - Sea level rise trends
 * - Ocean temperature changes
 * - Erosion rates over time
 * - Pollution levels
 *
 * Created for Ocean Awareness Contest 2026
 */

import { useState } from 'react';
import { LineChart, TrendingUp, Thermometer, Waves, AlertTriangle } from 'lucide-react';

export default function OceanDataVisualizer({ data }) {
  const [activeChart, setActiveChart] = useState('sea-level');

  const charts = [
    { id: 'sea-level', label: 'Sea Level Rise', icon: Waves },
    { id: 'temperature', label: 'Ocean Temperature', icon: Thermometer },
    { id: 'erosion', label: 'Coastal Erosion', icon: TrendingUp },
    { id: 'health', label: 'Ocean Health Score', icon: LineChart }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Ocean Data Visualization Studio</h2>

      {/* Chart Selector */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {charts.map(chart => {
          const Icon = chart.icon;
          const isActive = activeChart === chart.id;
          return (
            <button
              key={chart.id}
              onClick={() => setActiveChart(chart.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-ocean-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{chart.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chart Display */}
      <div className="border-2 border-gray-200 rounded-lg p-6 min-h-[400px]">
        {activeChart === 'sea-level' && <SeaLevelChart data={data?.seaLevel} />}
        {activeChart === 'temperature' && <TemperatureChart data={data?.temperature} />}
        {activeChart === 'erosion' && <ErosionChart data={data?.erosion} />}
        {activeChart === 'health' && <HealthScoreChart data={data} />}
      </div>

      {/* Data Source Info */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Data Sources:</p>
            <p>NASA Earthdata (Sea Level), NOAA Coral Watch (Temperature), USGS Coastal Change (Erosion)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Sea Level Rise Chart
 */
function SeaLevelChart({ data }) {
  const historicalData = data?.historical || [];

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Global Mean Sea Level Rise</h3>

      {/* Simple bar chart representation */}
      <div className="space-y-2">
        {historicalData.slice(-10).map((entry, idx) => (
          <div key={idx} className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 w-16">{entry.year}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
              <div
                className="bg-ocean-500 h-6 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${Math.min(100, (entry.level / 0.2) * 100)}%` }}
              >
                <span className="text-xs font-medium text-white">
                  {entry.level}m
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Projections */}
      {data?.projections && (
        <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <h4 className="font-semibold text-warning-900 mb-2">Projections</h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {Object.entries(data.projections).map(([year, proj]) => (
              <div key={year} className="bg-white p-2 rounded">
                <div className="font-medium text-gray-900">{year}</div>
                <div className="text-ocean-600">{proj.likely}m</div>
                <div className="text-xs text-gray-600">likely</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Ocean Temperature Chart
 */
function TemperatureChart({ data }) {
  const current = data?.current || 0;
  const anomaly = data?.anomaly || 0;

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Ocean Surface Temperature</h3>

      {/* Current temperature display */}
      <div className="flex items-center justify-center mb-8">
        <div className="text-center">
          <div className="text-6xl font-bold text-ocean-600">{current}°C</div>
          <div className="text-gray-600 mt-2">Current Temperature</div>
        </div>
      </div>

      {/* Anomaly indicator */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <span className="text-gray-700 font-medium">Temperature Anomaly:</span>
        <span className={`text-2xl font-bold ${anomaly > 0 ? 'text-warning-600' : 'text-ocean-600'}`}>
          {anomaly > 0 ? '+' : ''}{anomaly}°C
        </span>
      </div>

      {/* Coral bleaching risk */}
      {data?.coralBleachingRisk && (
        <div className={`mt-4 p-4 rounded-lg ${
          data.coralBleachingRisk === 'severe' ? 'bg-critical-50 border-critical-200' :
          data.coralBleachingRisk === 'high' ? 'bg-warning-50 border-warning-200' :
          'bg-kelp-50 border-kelp-200'
        } border-2`}>
          <div className="font-semibold text-gray-900 mb-1">Coral Bleaching Risk</div>
          <div className={`text-xl font-bold capitalize ${
            data.coralBleachingRisk === 'severe' ? 'text-critical-700' :
            data.coralBleachingRisk === 'high' ? 'text-warning-700' :
            'text-kelp-700'
          }`}>
            {data.coralBleachingRisk}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Erosion Rate Chart
 */
function ErosionChart({ data }) {
  const historicalData = data?.historicalData || [];

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Coastal Erosion Trends</h3>

      {historicalData.length > 0 ? (
        <div className="space-y-2">
          {historicalData.map((entry, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 w-16">{entry.year}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className={`h-6 rounded-full flex items-center justify-end pr-2 ${
                    parseFloat(entry.erosionRate) > 1.0 ? 'bg-warning-500' : 'bg-ocean-500'
                  }`}
                  style={{ width: `${Math.min(100, parseFloat(entry.erosionRate) * 50)}%` }}
                >
                  <span className="text-xs font-medium text-white">
                    {entry.erosionRate} m/yr
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No erosion data available for this location</p>
        </div>
      )}

      {data?.vulnerability && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Current Vulnerability:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${
              data.vulnerability === 'critical' ? 'bg-critical-100 text-critical-700' :
              data.vulnerability === 'high' ? 'bg-warning-100 text-warning-700' :
              data.vulnerability === 'moderate' ? 'bg-sand-100 text-sand-700' :
              'bg-kelp-100 text-kelp-700'
            }`}>
              {data.vulnerability}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Overall Ocean Health Score Chart
 */
function HealthScoreChart({ data }) {
  // Calculate overall health score from available data
  let totalScore = 0;
  let factors = 0;

  if (data?.temperature) {
    const tempScore = Math.max(0, 10 - Math.abs(data.temperature.anomaly || 0) * 2);
    totalScore += tempScore;
    factors++;
  }

  if (data?.erosion?.vulnerability) {
    const erosionScore = {
      'low': 9,
      'moderate': 6,
      'high': 3,
      'critical': 1
    }[data.erosion.vulnerability] || 5;
    totalScore += erosionScore;
    factors++;
  }

  if (data?.seaLevel?.current?.trend) {
    const slrScore = data.seaLevel.current.trend === 'rising' ? 4 : 7;
    totalScore += slrScore;
    factors++;
  }

  const avgScore = factors > 0 ? totalScore / factors : 5;
  const percentage = (avgScore / 10) * 100;

  const getGrade = (score) => {
    if (score >= 8) return { grade: 'A', status: 'Excellent', color: 'kelp' };
    if (score >= 6) return { grade: 'B', status: 'Good', color: 'ocean' };
    if (score >= 4) return { grade: 'C', status: 'Fair', color: 'sand' };
    return { grade: 'D', status: 'Poor', color: 'critical' };
  };

  const { grade, status, color } = getGrade(avgScore);

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Overall Ocean Health Score</h3>

      {/* Score display */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className={`text-8xl font-bold text-${color}-600 mb-2`}>{grade}</div>
        <div className="text-2xl text-gray-700">{avgScore.toFixed(1)} / 10</div>
        <div className={`text-lg font-medium text-${color}-700 mt-2`}>{status}</div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="bg-gray-200 rounded-full h-8 relative overflow-hidden">
          <div
            className={`bg-${color}-500 h-8 transition-all duration-1000 flex items-center justify-center`}
            style={{ width: `${percentage}%` }}
          >
            <span className="text-sm font-bold text-white">{Math.round(percentage)}%</span>
          </div>
        </div>
      </div>

      {/* Contributing factors */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Contributing Factors:</h4>
        {data?.temperature && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Ocean Temperature</span>
            <span className="font-medium text-ocean-600">
              {data.temperature.anomaly > 0 ? 'Warming' : 'Stable'}
            </span>
          </div>
        )}
        {data?.erosion && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Coastal Erosion</span>
            <span className="font-medium text-warning-600 capitalize">
              {data.erosion.vulnerability}
            </span>
          </div>
        )}
        {data?.seaLevel && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Sea Level Trend</span>
            <span className="font-medium text-ocean-600 capitalize">
              {data.seaLevel.current?.trend || 'Unknown'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
