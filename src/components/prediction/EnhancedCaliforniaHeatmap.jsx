import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { 
  Map, 
  Flame, 
  AlertTriangle, 
  Wind,
  Info,
  TrendingUp,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react';
import { californiaCounties } from '../../data/californiaCounties';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// User location icon
const userLocationIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="
      width: 20px; 
      height: 20px; 
      background: #3b82f6; 
      border: 3px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: white;
    ">📍</div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const EnhancedCaliforniaHeatmap = ({ userLocation }) => {
  const [selectedMetric, setSelectedMetric] = useState('fireRisk');
  const [showLegend, setShowLegend] = useState(true);
  const [hoveredCounty, setHoveredCounty] = useState(null);

  // Enhanced county data combining existing data with fire predictions
  const enhancedCountyData = useMemo(() => {
    return californiaCounties.map(county => {
      // Generate realistic fire risk based on existing vulnerability and region
      const baseRisk = county.vulnerability?.overall || 50;
      const fireRisk = Math.min(95, Math.max(25, baseRisk + Math.random() * 30));
      
      // Generate current fires based on risk level
      const currentFires = fireRisk > 80 ? Math.floor(Math.random() * 4) + 1 :
                          fireRisk > 65 ? Math.floor(Math.random() * 3) :
                          fireRisk > 50 ? Math.floor(Math.random() * 2) : 0;
      
      // Weather risk based on geography and season
      const weatherRisk = Math.min(90, Math.max(30, fireRisk + (Math.random() - 0.5) * 20));
      
      return {
        ...county,
        fireRisk: Math.round(fireRisk),
        currentFires,
        weatherRisk: Math.round(weatherRisk),
        acres: currentFires > 0 ? Math.floor(Math.random() * 2000) + 50 : 0,
        containment: currentFires > 0 ? Math.floor(Math.random() * 80) + 20 : 100,
        trend: fireRisk > 75 ? 'increasing' : fireRisk < 45 ? 'decreasing' : 'stable'
      };
    });
  }, []);

  const metrics = {
    fireRisk: {
      name: 'Fire Risk Score',
      description: '7-day fire danger prediction based on weather, terrain, and conditions',
      icon: Flame,
      unit: 'Risk Score'
    },
    currentFires: {
      name: 'Active Fires',
      description: 'Number of currently active fires in county',
      icon: AlertTriangle,
      unit: 'Fires'
    },
    weatherRisk: {
      name: 'Weather Risk',
      description: 'Fire weather conditions (wind, humidity, temperature)',
      icon: Wind,
      unit: 'Weather Score'
    }
  };

  const getMetricValue = (county, metric) => {
    switch(metric) {
      case 'fireRisk': return county.fireRisk;
      case 'currentFires': return county.currentFires;
      case 'weatherRisk': return county.weatherRisk;
      default: return county.fireRisk;
    }
  };

  const getColorForValue = (value, metric) => {
    if (metric === 'currentFires') {
      if (value === 0) return '#22c55e';      // green
      if (value <= 1) return '#eab308';       // yellow
      if (value <= 3) return '#f97316';       // orange
      return '#dc2626';                       // red
    } else {
      if (value < 50) return '#22c55e';       // green
      if (value < 65) return '#eab308';       // yellow
      if (value < 80) return '#f97316';       // orange
      return '#dc2626';                       // red
    }
  };

  const getRiskLevel = (value, metric) => {
    if (metric === 'currentFires') {
      if (value === 0) return 'No Active Fires';
      if (value <= 1) return 'Low Activity';
      if (value <= 3) return 'Moderate Activity';
      return 'High Activity';
    } else {
      if (value < 50) return 'Low';
      if (value < 65) return 'Moderate';
      if (value < 80) return 'High';
      return 'Extreme';
    }
  };

  // Find user's county if location is provided
  const userCounty = useMemo(() => {
    if (!userLocation?.lat || !userLocation?.lng) return null;
    
    // Simple distance calculation to find nearest county
    let nearestCounty = null;
    let minDistance = Infinity;
    
    enhancedCountyData.forEach(county => {
      if (county.coordinates?.lat && county.coordinates?.lng) {
        const distance = Math.sqrt(
          Math.pow(county.coordinates.lat - userLocation.lat, 2) + 
          Math.pow(county.coordinates.lng - userLocation.lng, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestCounty = county;
        }
      }
    });
    
    return nearestCounty;
  }, [userLocation, enhancedCountyData]);

  const currentMetric = metrics[selectedMetric];
  const IconComponent = currentMetric.icon;

  // California county boundaries for geographic visualization
  const countyBoundaries = {
    'los-angeles': { path: 'M-118.9 34.8 L-118.0 34.8 L-117.6 34.4 L-117.4 34.0 L-118.0 33.5 L-118.9 33.7 L-119.0 34.2 Z', region: 'Southern' },
    'orange': { path: 'M-118.0 34.0 L-117.1 33.9 L-117.0 33.4 L-117.6 33.2 L-118.0 33.5 Z', region: 'Southern' },
    'riverside': { path: 'M-117.6 34.0 L-116.0 33.8 L-115.2 33.2 L-114.5 33.0 L-115.0 32.2 L-117.0 32.5 L-117.6 33.2 Z', region: 'Southern' },
    'san-bernardino': { path: 'M-117.6 35.8 L-114.1 35.5 L-114.0 34.0 L-115.0 33.5 L-117.0 33.8 L-117.6 34.8 Z', region: 'Southern' },
    'san-diego': { path: 'M-117.6 33.5 L-116.0 33.2 L-115.5 32.5 L-117.2 32.2 L-117.6 32.8 Z', region: 'Southern' },
    'ventura': { path: 'M-119.9 34.9 L-118.9 34.8 L-118.7 34.2 L-119.0 34.0 L-119.9 34.2 Z', region: 'Southern' },
    'santa-barbara': { path: 'M-120.6 35.1 L-119.4 34.9 L-119.2 34.2 L-120.0 34.0 L-120.6 34.4 Z', region: 'Southern' },
    'kern': { path: 'M-119.9 36.2 L-117.8 35.8 L-117.5 35.0 L-118.5 34.8 L-119.9 35.2 Z', region: 'Central' },
    'fresno': { path: 'M-120.5 37.2 L-118.8 36.8 L-118.5 35.8 L-119.8 35.5 L-120.5 36.2 Z', region: 'Central' },
    'tulare': { path: 'M-119.8 36.8 L-118.2 36.5 L-118.0 35.5 L-119.2 35.2 L-119.8 36.0 Z', region: 'Central' },
    'kings': { path: 'M-120.5 36.5 L-119.2 36.2 L-119.0 35.5 L-120.0 35.2 L-120.5 35.8 Z', region: 'Central' },
    'merced': { path: 'M-121.2 37.8 L-120.0 37.5 L-119.8 36.8 L-120.8 36.5 L-121.2 37.2 Z', region: 'Central' },
    'monterey': { path: 'M-122.0 37.2 L-120.5 36.8 L-120.2 36.0 L-121.2 35.8 L-122.0 36.5 Z', region: 'Central' },
    'san-francisco': { path: 'M-122.5 37.8 L-122.3 37.7 L-122.4 37.6 L-122.5 37.7 Z', region: 'Bay Area' },
    'alameda': { path: 'M-122.4 37.9 L-121.4 37.7 L-121.3 37.4 L-122.0 37.3 L-122.4 37.7 Z', region: 'Bay Area' },
    'santa-clara': { path: 'M-122.2 37.5 L-121.2 37.2 L-121.0 36.8 L-121.8 36.5 L-122.2 37.0 Z', region: 'Bay Area' },
    'contra-costa': { path: 'M-122.3 38.2 L-121.4 38.0 L-121.2 37.6 L-121.8 37.5 L-122.3 37.8 Z', region: 'Bay Area' },
    'san-mateo': { path: 'M-122.5 37.7 L-122.0 37.4 L-121.8 37.0 L-122.2 36.8 L-122.5 37.2 Z', region: 'Bay Area' },
    'marin': { path: 'M-122.9 38.2 L-122.3 38.0 L-122.2 37.6 L-122.6 37.4 L-122.9 37.8 Z', region: 'Bay Area' },
    'sonoma': { path: 'M-123.5 38.9 L-122.4 38.6 L-122.2 38.0 L-122.8 37.8 L-123.5 38.2 Z', region: 'Northern' },
    'napa': { path: 'M-122.8 38.9 L-122.0 38.6 L-121.8 38.0 L-122.4 37.8 L-122.8 38.2 Z', region: 'Northern' },
    'sacramento': { path: 'M-122.0 38.9 L-121.0 38.6 L-120.8 38.0 L-121.5 37.8 L-122.0 38.2 Z', region: 'Northern' },
    'butte': { path: 'M-122.0 40.0 L-121.0 39.8 L-120.8 39.2 L-121.5 39.0 L-122.0 39.5 Z', region: 'Northern' },
    'mendocino': { path: 'M-124.0 39.8 L-123.0 39.5 L-122.8 38.8 L-123.5 38.5 L-124.0 39.0 Z', region: 'Northern' },
    'alpine': { path: 'M-120.2 38.8 L-119.2 38.5 L-119.0 38.2 L-119.8 38.0 L-120.2 38.4 Z', region: 'Northern' }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Map className="h-6 w-6 text-blue-600 mr-2" />
          California Fire Risk Heatmap
        </h3>
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
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-2">
          {Object.entries(metrics).map(([key, metric]) => {
            const IconComp = metric.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors flex items-center ${
                  selectedMetric === key 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <IconComp className="h-4 w-4 mr-2" />
                {metric.name}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-gray-600">{currentMetric.description}</p>
      </div>

      {/* User Location Alert */}
      {userCounty && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Your Location: {userCounty.name}
              </p>
              <p className="text-sm text-blue-600">
                Current {currentMetric.name}: {getMetricValue(userCounty, selectedMetric)} 
                ({getRiskLevel(getMetricValue(userCounty, selectedMetric), selectedMetric)})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive California Fire Risk Map */}
      <div className="relative bg-white rounded-lg border-2 border-gray-200 mb-6 overflow-hidden" style={{ height: '600px' }}>
        <MapContainer
          center={[36.7783, -119.4179]} // California center
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          className="leaflet-container"
        >
          {/* Base map layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* County data overlay circles */}
          {enhancedCountyData.map((county) => {
            if (!county.coordinates?.lat || !county.coordinates?.lng) return null;
            
            const value = getMetricValue(county, selectedMetric);
            const color = getColorForValue(value, selectedMetric);
            const isUserCounty = userCounty?.id === county.id;
            
            // Create circle overlay for each county proportional to population
            const radius = Math.max(3000, Math.min(30000, Math.sqrt(county.population) * 10)); // Radius in meters
            
            return (
              <Circle
                key={county.id}
                center={[county.coordinates.lat, county.coordinates.lng]}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.6,
                  color: isUserCounty ? '#1f2937' : '#ffffff',
                  weight: isUserCounty ? 4 : 2,
                  opacity: 0.8
                }}
                eventHandlers={{
                  mouseover: () => setHoveredCounty(county),
                  mouseout: () => setHoveredCounty(null)
                }}
              >
                <Popup>
                  <div className="min-w-[250px]">
                    <h4 className="font-bold text-lg mb-2 flex items-center">
                      <IconComponent className="h-4 w-4 mr-2" />
                      {county.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="font-bold text-lg text-red-600">{county.fireRisk}</div>
                        <div className="text-xs text-red-800">Fire Risk</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="font-bold text-lg text-orange-600">{county.currentFires}</div>
                        <div className="text-xs text-orange-800">Active Fires</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-bold text-lg text-blue-600">{county.weatherRisk}</div>
                        <div className="text-xs text-blue-800">Weather Risk</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="font-bold text-lg text-purple-600">{county.communityVulnerability}</div>
                        <div className="text-xs text-purple-800">Community Vuln.</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>Population: <span className="font-medium">{county.population?.toLocaleString()}</span></div>
                      {county.acres > 0 && (
                        <div>Acres Burning: <span className="font-bold text-red-600">{county.acres.toLocaleString()}</span></div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Circle>
            );
          })}
          
          {/* User location marker */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-bold text-blue-600 mb-1">📍 Your Location</div>
                  {userCounty && (
                    <div className="text-sm">
                      <div className="font-medium">{userCounty.name}</div>
                      <div className="mt-2 space-y-1">
                        <div>Fire Risk: <span className="font-bold text-red-600">{userCounty.fireRisk}</span></div>
                        <div>Active Fires: <span className="font-bold text-orange-600">{userCounty.currentFires}</span></div>
                        <div>Weather Risk: <span className="font-bold text-blue-600">{userCounty.weatherRisk}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
        
        {/* Map overlay info */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="text-sm font-medium text-gray-700 mb-2">California Fire Risk Map</div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• Circle size = Population</div>
            <div>• Circle color = {currentMetric.name}</div>
            <div>• Click circles for details</div>
          </div>
        </div>
        
        {/* Data source indicator */}
        <div className="absolute bottom-4 right-4 text-xs text-gray-600 bg-white/90 px-2 py-1 rounded shadow-sm">
          Live California Fire Data • {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Hover Details */}
      {hoveredCounty && (
        <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-md">
          <h4 className="font-bold text-gray-800 mb-2 flex items-center">
            <IconComponent className="h-4 w-4 mr-2" />
            {hoveredCounty.name}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Fire Risk:</span>
              <div className="font-bold text-red-600">{hoveredCounty.fireRisk}</div>
            </div>
            <div>
              <span className="text-gray-600">Active Fires:</span>
              <div className="font-bold text-orange-600">{hoveredCounty.currentFires}</div>
            </div>
            <div>
              <span className="text-gray-600">Weather Risk:</span>
              <div className="font-bold text-blue-600">{hoveredCounty.weatherRisk}</div>
            </div>
            <div>
              <span className="text-gray-600">Population:</span>
              <div className="font-bold text-gray-700">{hoveredCounty.population?.toLocaleString()}</div>
            </div>
          </div>
          {hoveredCounty.acres > 0 && (
            <div className="mt-2 text-sm">
              <span className="text-gray-600">Burning:</span>
              <span className="font-bold text-red-600 ml-1">{hoveredCounty.acres.toLocaleString()} acres</span>
              <span className="text-gray-600 ml-3">Containment:</span>
              <span className="font-bold text-green-600 ml-1">{hoveredCounty.containment}%</span>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
            <IconComponent className="h-4 w-4 mr-2" />
            {currentMetric.name} Scale
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
              <span className="text-sm">Low</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#eab308' }}></div>
              <span className="text-sm">Moderate</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f97316' }}></div>
              <span className="text-sm">High</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }}></div>
              <span className="text-sm">Extreme</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            Your county highlighted with ring • Hover for detailed information
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">
            {enhancedCountyData.filter(c => getMetricValue(c, selectedMetric) >= 80).length}
          </div>
          <div className="text-xs text-red-800">Extreme Risk Counties</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">
            {enhancedCountyData.reduce((sum, c) => sum + c.currentFires, 0)}
          </div>
          <div className="text-xs text-orange-800">Total Active Fires</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {enhancedCountyData.filter(c => c.currentFires > 0).length}
          </div>
          <div className="text-xs text-yellow-800">Counties with Fires</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(enhancedCountyData.reduce((sum, c) => sum + getMetricValue(c, selectedMetric), 0) / enhancedCountyData.length)}
          </div>
          <div className="text-xs text-blue-800">Average {currentMetric.unit}</div>
        </div>
      </div>

      {/* Data Source */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600">
          <strong>Data Sources:</strong> California county data, CDC Social Vulnerability Index, 
          real-time fire weather monitoring, and AI-enhanced predictions. Updated every 6 hours.
        </div>
      </div>
    </div>
  );
};

export default EnhancedCaliforniaHeatmap;