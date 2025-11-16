import React, { useState, useEffect, useMemo } from 'react';
import { 
  Map, 
  Layers, 
  Filter, 
  Info, 
  BarChart3,
  AlertTriangle,
  Users,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { californiaCounties, getHighRiskCounties, getRegionStats } from '../../data/californiaCounties';

/**
 * Interactive California Community Vulnerability Heatmap
 * Displays social vulnerability, demographic risk, and wildfire impact data
 */
const CommunityHeatmap = ({ userLocation, selectedMetric = 'vulnerability' }) => {
  const [activeLayer, setActiveLayer] = useState(selectedMetric);
  const [showLegend, setShowLegend] = useState(true);
  const [hoveredRegion, setHoveredRegion] = useState(null);

  // Use real California county data
  const countiesData = useMemo(() => californiaCounties.map(county => ({
    id: county.id,
    name: county.name,
    vulnerability: county.vulnerability.overall,
    economic: county.vulnerability.socioeconomic,
    demographic: Math.round((county.demographics.under5 + county.demographics.over65 + county.demographics.disabled + county.demographics.linguisticallyIsolated) / 4 * 10),
    historical: county.fireRisk.historical,
    lat: county.coordinates.lat,
    lng: county.coordinates.lng,
    population: county.population,
    region: county.region
  })), []);

  const metricConfig = {
    vulnerability: {
      name: 'Social Vulnerability Index',
      description: 'CDC SVI composite score (higher = more vulnerable)',
      colors: ['#10B981', '#F59E0B', '#EF4444', '#7C2D12'],
      thresholds: [40, 60, 80],
      unit: 'SVI Score'
    },
    economic: {
      name: 'Economic Vulnerability',
      description: 'Income, poverty, employment risk factors',
      colors: ['#3B82F6', '#F59E0B', '#EF4444', '#7C2D12'],
      thresholds: [40, 60, 80],
      unit: 'Risk Score'
    },
    demographic: {
      name: 'Demographic Risk Profile',
      description: 'Age, disability, language barriers',
      colors: ['#8B5CF6', '#F59E0B', '#EF4444', '#7C2D12'],
      thresholds: [40, 60, 80],
      unit: 'Risk Score'
    },
    historical: {
      name: 'Historical Fire Impact',
      description: 'Fire frequency, damage, recovery patterns',
      colors: ['#059669', '#F59E0B', '#EF4444', '#7C2D12'],
      thresholds: [40, 60, 80],
      unit: 'Impact Score'
    }
  };

  const getColorForValue = (value, metric) => {
    const config = metricConfig[metric];
    if (value <= config.thresholds[0]) return config.colors[0];
    if (value <= config.thresholds[1]) return config.colors[1];
    if (value <= config.thresholds[2]) return config.colors[2];
    return config.colors[3];
  };

  const getRegionSize = (population) => {
    if (population > 5000000) return 'w-16 h-16';
    if (population > 2000000) return 'w-12 h-12';
    if (population > 1000000) return 'w-10 h-10';
    if (population > 500000) return 'w-8 h-8';
    return 'w-6 h-6';
  };

  const getRiskLevel = (value) => {
    if (value >= 80) return 'Very High';
    if (value >= 60) return 'High';
    if (value >= 40) return 'Moderate';
    return 'Low';
  };

  const currentConfig = metricConfig[activeLayer];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-800 flex items-center">
          <Map className="h-5 w-5 text-indigo-600 mr-2" />
          California Community Impact Heatmap
        </h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
          >
            {showLegend ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showLegend ? 'Hide' : 'Show'} Legend
          </button>
        </div>
      </div>

      {/* Metric Selection */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries(metricConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveLayer(key)}
              className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                activeLayer === key 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {config.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">{currentConfig.description}</p>
      </div>

      {/* Map Container with California Geographic Visualization */}
      <div className="relative bg-slate-50 rounded-lg border-2 border-slate-200 h-96 overflow-hidden">
        {/* California Geographic Map with County Boundaries */}
        <svg 
          viewBox="-124.5 32.5 10.4 9.5" 
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ transform: 'scaleY(-1)' }} // Flip Y-axis for geographic coordinates
        >
          {/* California state boundary - accurate geographic outline */}
          <path
            d="M-124.4 42.0 L-124.2 41.5 L-123.8 41.0 L-123.5 40.5 L-123.0 40.0 L-122.5 39.5 L-122.0 39.0 L-121.5 38.5 L-121.0 38.0 L-120.5 37.5 L-120.0 37.0 L-119.5 36.5 L-119.0 36.0 L-118.5 35.5 L-118.0 35.0 L-117.5 34.5 L-117.0 34.0 L-116.5 33.5 L-116.0 33.0 L-115.5 32.7 L-115.0 32.5 L-114.1 32.5 L-114.2 33.0 L-114.5 33.5 L-115.0 34.0 L-115.5 34.5 L-116.0 35.0 L-116.5 35.5 L-117.0 36.0 L-117.5 36.5 L-118.0 37.0 L-118.5 37.5 L-119.0 38.0 L-119.5 38.5 L-120.0 39.0 L-120.5 39.5 L-121.0 40.0 L-121.5 40.5 L-122.0 41.0 L-122.5 41.5 L-123.0 42.0 L-124.4 42.0 Z"
            fill="#f8fafc"
            stroke="#64748b"
            strokeWidth="0.02"
            className="california-boundary"
          />
          
          {/* County boundaries - simplified representation */}
          {countiesData.map((county) => {
            // Skip counties without valid coordinates
            if (!county.coordinates || typeof county.coordinates.lng !== 'number' || typeof county.coordinates.lat !== 'number') {
              return null;
            }
            
            const value = county[activeLayer];
            const color = getColorForValue(value, activeLayer);
            
            // Create simplified county polygon based on approximate boundaries
            const size = Math.sqrt(county.population) / 2000; // Size based on population
            const x = county.coordinates.lng;
            const y = county.coordinates.lat;
            
            return (
              <g key={county.id}>
                {/* County area representation */}
                <circle
                  cx={x}
                  cy={y}
                  r={size}
                  fill={color}
                  fillOpacity={0.6}
                  stroke="white"
                  strokeWidth="0.01"
                  className="county-area hover:stroke-gray-800 cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredRegion(county)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
                />
                
                {/* County label for major counties */}
                {county.population > 1000000 && (
                  <text
                    x={x}
                    y={y + 0.1}
                    textAnchor="middle"
                    fontSize="0.1"
                    fill="#374151"
                    className="county-label font-medium"
                    style={{ transform: 'scaleY(-1)' }}
                  >
                    {county.name.replace(' County', '')}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Regional boundaries and labels */}
          <g className="region-labels" style={{ transform: 'scaleY(-1)' }}>
            {/* Bay Area */}
            <rect x="-122.6" y="37.3" width="1.0" height="0.8" 
                  fill="none" stroke="#3b82f6" strokeWidth="0.02" 
                  strokeDasharray="0.05,0.05" opacity="0.5" />
            <text x="-122.1" y="37.7" textAnchor="middle" fontSize="0.08" 
                  fill="#3b82f6" className="font-semibold">Bay Area</text>
            
            {/* Los Angeles Metro */}
            <rect x="-118.8" y="33.7" width="1.2" height="0.8" 
                  fill="none" stroke="#ef4444" strokeWidth="0.02" 
                  strokeDasharray="0.05,0.05" opacity="0.5" />
            <text x="-118.2" y="34.1" textAnchor="middle" fontSize="0.08" 
                  fill="#ef4444" className="font-semibold">LA Metro</text>
            
            {/* Central Valley */}
            <rect x="-121.5" y="35.5" width="1.8" height="2.5" 
                  fill="none" stroke="#f59e0b" strokeWidth="0.02" 
                  strokeDasharray="0.05,0.05" opacity="0.5" />
            <text x="-120.6" y="36.7" textAnchor="middle" fontSize="0.08" 
                  fill="#f59e0b" className="font-semibold">Central Valley</text>
            
            {/* San Diego */}
            <circle cx="-117.2" cy="32.7" r="0.3" 
                    fill="none" stroke="#f87171" strokeWidth="0.02" 
                    strokeDasharray="0.05,0.05" opacity="0.5" />
            <text x="-117.2" y="32.6" textAnchor="middle" fontSize="0.08" 
                  fill="#f87171" className="font-semibold">San Diego</text>
          </g>
        </svg>
        
        {/* County data points overlaid on geographic map */}
        <div className="absolute inset-0">
          {countiesData.map((county) => {
            // Skip counties without valid coordinates
            if (!county.coordinates || typeof county.coordinates.lng !== 'number' || typeof county.coordinates.lat !== 'number') {
              return null;
            }
            
            const value = county[activeLayer];
            const color = getColorForValue(value, activeLayer);
            const size = getRegionSize(county.population);
            
            // Convert lat/lng to percentage coordinates for the geographic viewBox
            const x = ((county.coordinates.lng + 124.5) / (-114.1 + 124.5)) * 100;
            const y = ((42.0 - county.coordinates.lat) / (42.0 - 32.5)) * 100;
            
            return (
              <div
                key={county.id}
                className={`absolute ${size} rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-all duration-200 z-20`}
                style={{
                  left: `${Math.max(5, Math.min(95, x))}%`,
                  top: `${Math.max(5, Math.min(95, y))}%`,
                  backgroundColor: color,
                  boxShadow: `0 4px 12px ${color}40`
                }}
                onMouseEnter={() => setHoveredRegion(county)}
                onMouseLeave={() => setHoveredRegion(null)}
                title={`${county.name}: ${value} ${currentConfig.unit}`}
              >
                <div className="w-full h-full rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs drop-shadow-lg">
                    {value}
                  </span>
                </div>
                {/* Pulse animation for high risk areas */}
                {value >= 80 && (
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: color, opacity: 0.3 }}></div>
                )}
              </div>
            );
          })}
        </div>

        {/* User location marker */}
        {userLocation && userLocation.coordinates && (
          <div
            className="absolute w-4 h-4 bg-yellow-400 border-2 border-yellow-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg z-30"
            style={{
              left: `${((userLocation.coordinates.lng + 124.5) / (-114.1 + 124.5)) * 100}%`,
              top: `${((42.0 - userLocation.coordinates.lat) / (42.0 - 32.5)) * 100}%`,
            }}
            title="Your Location"
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap">
              You
            </div>
          </div>
        )}

        {/* Enhanced hover tooltip with geographic context */}
        {hoveredRegion && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-xl p-4 max-w-sm z-40 border border-gray-200">
            <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
              {hoveredRegion.name}
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {hoveredRegion.region}
              </span>
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{currentConfig.name}:</span>
                <span className="font-bold" style={{ color: getColorForValue(hoveredRegion[activeLayer], activeLayer) }}>
                  {hoveredRegion[activeLayer]} ({getRiskLevel(hoveredRegion[activeLayer])})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Population:</span>
                <span className="font-medium">{hoveredRegion.population.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Coordinates:</span>
                <span className="font-mono">
                  {hoveredRegion.coordinates.lat.toFixed(2)}°, {hoveredRegion.coordinates.lng.toFixed(2)}°
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200 text-xs">
                <div>SVI: <span className="font-bold">{hoveredRegion.vulnerability.overall}</span></div>
                <div>Economic: <span className="font-bold">{hoveredRegion.vulnerability.socioeconomic}</span></div>
                <div>Demographic: <span className="font-bold">{hoveredRegion.demographic}</span></div>
                <div>Fire Risk: <span className="font-bold">{hoveredRegion.fireRisk.historical}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-800 mb-3 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            {currentConfig.name} Scale
          </h5>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {currentConfig.colors.map((color, index) => {
                const isLast = index === currentConfig.colors.length - 1;
                const threshold = isLast ? '80+' : 
                  index === 0 ? `≤${currentConfig.thresholds[0]}` :
                  `${currentConfig.thresholds[index-1]+1}-${currentConfig.thresholds[index]}`;
                const level = index === 0 ? 'Low' : 
                  index === 1 ? 'Moderate' : 
                  index === 2 ? 'High' : 'Very High';
                
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: color }}
                    ></div>
                    <div className="text-xs">
                      <div className="font-medium">{level}</div>
                      <div className="text-gray-600">{threshold}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-gray-600">
              Circle size = Population
            </div>
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-red-600">
            {countiesData.filter(c => c[activeLayer] >= 80).length}
          </div>
          <div className="text-xs text-red-800">Very High Risk Counties</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-orange-600">
            {countiesData.filter(c => c[activeLayer] >= 60 && c[activeLayer] < 80).length}
          </div>
          <div className="text-xs text-orange-800">High Risk Counties</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-yellow-600">
            {Math.round(countiesData.reduce((sum, c) => sum + c.population, 0) / 1000000)}M
          </div>
          <div className="text-xs text-yellow-800">Total Population</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-blue-600">
            {Math.round(countiesData.reduce((sum, c) => sum + c[activeLayer], 0) / countiesData.length)}
          </div>
          <div className="text-xs text-blue-800">Average Score</div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600">
          <strong>Data Sources:</strong> CDC Social Vulnerability Index, U.S. Census ACS, 
          CalEnviroScreen 4.0, CAL FIRE Historical Records, Cal OES Emergency Planning Data. 
          <span className="text-indigo-600 font-medium">Interactive visualization updates monthly.</span>
        </div>
      </div>
    </div>
  );
};

export default CommunityHeatmap;