import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Users, 
  MapPin,
  Activity,
  Brain
} from 'lucide-react';
import { californiaCounties } from '../../data/californiaCounties';
import { californiaCountiesGeoJSON } from '../../data/californiaCountiesGeoJSON';

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

// Fire icon
const fireIcon = L.divIcon({
  className: 'custom-fire-marker',
  html: `
    <div style="
      width: 16px; 
      height: 16px; 
      background: #dc2626; 
      border: 2px solid #fef2f2; 
      border-radius: 50%; 
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: white;
      animation: pulse 2s infinite;
    ">🔥</div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

/**
 * Risk Classification Map Component
 * 
 * Interactive choropleth map showing AI-predicted community impact risk levels
 * with county boundaries colored by risk level and detailed information popups
 */
const RiskClassificationMap = ({ 
  predictions, 
  selectedCounty, 
  onCountySelect, 
  showLegend, 
  userLocation,
  showRealTimeFires,
  fireData 
}) => {
  const [hoveredCounty, setHoveredCounty] = useState(null);

  // Debug fire data
  React.useEffect(() => {
    console.log('🗺️ Map component fire data debug:', {
      showRealTimeFires,
      fireData: fireData,
      fireDataType: Array.isArray(fireData) ? 'array' : typeof fireData,
      fireDataLength: fireData?.length || 0,
      sampleFire: fireData?.[0],
      sampleFireCoords: fireData?.[0] ? {
        location: fireData[0].location,
        lat: fireData[0].latitude,
        lng: fireData[0].longitude
      } : null
    });
  }, [showRealTimeFires, fireData]);

  // Create prediction lookup map
  const predictionLookup = useMemo(() => {
    const lookup = new Map();
    predictions.forEach(pred => {
      lookup.set(pred.fips, pred);
    });
    return lookup;
  }, [predictions]);

  // Get color for risk level
  const getRiskColor = (riskLevel) => {
    if (!riskLevel) return '#e5e7eb';
    
    const colors = {
      HIGH: '#dc2626',
      MEDIUM: '#ea580c', 
      LOW: '#16a34a'
    };
    return colors[riskLevel] || '#e5e7eb';
  };

  // Style function for GeoJSON features
  const getFeatureStyle = (feature) => {
    const prediction = predictionLookup.get(feature.properties.fips);
    const isSelected = selectedCounty === feature.properties.fips;
    const isHovered = hoveredCounty === feature.properties.fips;
    
    return {
      fillColor: getRiskColor(prediction?.riskLevel?.level),
      weight: isSelected ? 3 : isHovered ? 2 : 1,
      opacity: 1,
      color: isSelected ? '#1d4ed8' : isHovered ? '#374151' : '#6b7280',
      dashArray: isSelected ? '5, 5' : '',
      fillOpacity: isHovered ? 0.8 : 0.6
    };
  };

  // Event handlers for GeoJSON features
  const onEachFeature = (feature, layer) => {
    const prediction = predictionLookup.get(feature.properties.fips);
    
    layer.on({
      mouseover: (e) => {
        setHoveredCounty(feature.properties.fips);
      },
      mouseout: (e) => {
        setHoveredCounty(null);
      },
      click: (e) => {
        onCountySelect(feature.properties.fips);
      }
    });

    // Add popup with prediction data
    if (prediction) {
      layer.bindPopup(
        `<div class="p-3 min-w-64">
          <h4 class="font-bold text-lg mb-2">${prediction.county}</h4>
          
          <div class="mb-3">
            <div class="flex items-center mb-1">
              <span class="w-3 h-3 rounded-full mr-2" style="background-color: ${prediction.riskLevel.color}"></span>
              <span class="font-semibold">${prediction.riskLevel.label}</span>
            </div>
            <div class="text-sm text-gray-600">
              Risk Score: ${prediction.riskScore.toFixed(2)} 
              (${Math.round(prediction.confidence * 100)}% confidence)
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 text-sm mb-3">
            <div>
              <div class="font-medium">Fire Activity</div>
              <div class="text-gray-600">
                ${(prediction.features.fireActivity.contribution * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div class="font-medium">Weather Risk</div>
              <div class="text-gray-600">
                ${(prediction.features.weather.contribution * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div class="font-medium">Vulnerability</div>
              <div class="text-gray-600">
                ${(prediction.features.vulnerability.contribution * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div class="font-medium">Trend</div>
              <div class="text-gray-600 flex items-center">
                ${prediction.trends.vulnerabilityTrend === 'worsening' ? '↗️' : 
                  prediction.trends.vulnerabilityTrend === 'improving' ? '↘️' : '→'}
                ${prediction.trends.vulnerabilityTrend}
              </div>
            </div>
          </div>

          <div class="text-xs text-gray-500 border-t pt-2">
            Click for detailed analysis
          </div>
        </div>`
      );
    }
  };

  return (
    <div className="relative h-96 w-full bg-gray-100 rounded-lg overflow-hidden">
      {/* CSS for fire animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        .custom-fire-marker div {
          animation: pulse 2s infinite;
        }
      `}</style>
      <MapContainer
        center={[36.7783, -119.4179]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* California County Boundaries - Choropleth */}
        <GeoJSON
          data={californiaCountiesGeoJSON}
          style={getFeatureStyle}
          onEachFeature={onEachFeature}
        />

        {/* User Location Marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
                <br />
                <span className="text-sm text-gray-600">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Fire Markers */}
        {showRealTimeFires && fireData && fireData.length > 0 && fireData.map((fire, index) => {
          // Handle different data formats - some use location array, others use lat/lng
          const lat = fire.location ? fire.location[0] : fire.latitude;
          const lng = fire.location ? fire.location[1] : fire.longitude;
          
          if (!lat || !lng) {
            console.warn('🔥 Fire missing coordinates:', fire);
            return null;
          }
          
          return (
            <Marker
              key={`fire-${index}`}
              position={[lat, lng]}
              icon={fireIcon}
            >
            <Popup>
              <div className="p-2 min-w-48">
                <h4 className="font-bold text-sm mb-2 flex items-center">
                  <Activity className="h-4 w-4 mr-1 text-red-600" />
                  Active Fire
                </h4>
                <div className="text-xs space-y-1">
                  <div><strong>Name:</strong> {fire.name}</div>
                  <div><strong>Acres:</strong> {fire.acres} burned</div>
                  <div><strong>Containment:</strong> {fire.containment}%</div>
                  <div><strong>Distance:</strong> {fire.distance} miles</div>
                  <div><strong>County:</strong> {fire.county}</div>
                  <div><strong>Updated:</strong> {new Date(fire.updated).toLocaleString()}</div>
                </div>
                <div className="text-xs text-gray-500 mt-2 border-t pt-2">
                  Source: {fire.source || 'CAL FIRE'}
                </div>
              </div>
            </Popup>
          </Marker>
          );
        }).filter(Boolean)}
      </MapContainer>

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 border">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <Brain className="h-4 w-4 mr-1 text-blue-600" />
            AI Risk Classification
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#dc2626' }}></div>
              <span>High Impact Risk</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#ea580c' }}></div>
              <span>Medium Impact Risk</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#16a34a' }}></div>
              <span>Low Impact Risk</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2 bg-gray-300"></div>
              <span>No Data</span>
            </div>
            {showRealTimeFires && (
              <div className="flex items-center mt-2 pt-2 border-t">
                <div className="w-4 h-4 rounded-full mr-2 bg-red-600 flex items-center justify-center text-white text-xs">🔥</div>
                <span>Active Fires</span>
              </div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t text-xs text-gray-500">
            Based on recent SVI trends (2018-2022)
            {showRealTimeFires && ' • Live fire data from NASA FIRMS'}
          </div>
        </div>
      )}

      {/* Risk Level Summary */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 border">
        <div className="flex items-center mb-2">
          <Activity className="h-4 w-4 mr-1 text-blue-600" />
          <span className="font-semibold text-sm">Risk Distribution</span>
        </div>
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>High Risk:</span>
            <span className="font-medium text-red-600">
              {predictions.filter(p => p.riskLevel.level === 'HIGH').length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Medium Risk:</span>
            <span className="font-medium text-orange-600">
              {predictions.filter(p => p.riskLevel.level === 'MEDIUM').length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Low Risk:</span>
            <span className="font-medium text-green-600">
              {predictions.filter(p => p.riskLevel.level === 'LOW').length}
            </span>
          </div>
        </div>
      </div>

      {/* Selected County Info */}
      {selectedCounty && (() => {
        const prediction = predictionLookup.get(selectedCounty);
        
        if (!prediction) return null;
        
        return (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 border max-w-xs">
            <div>
              <h4 className="font-bold text-sm mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                {prediction.county}
              </h4>
              <div className="text-xs space-y-1">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: prediction.riskLevel.color }}></span>
                  <span className="font-medium">{prediction.riskLevel.label}</span>
                </div>
                <div>Score: {prediction.riskScore.toFixed(2)}</div>
                <div>Confidence: {Math.round(prediction.confidence * 100)}%</div>
                <div className="pt-1 border-t">
                  <div className="flex items-center text-gray-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>Trend: {prediction.trends.vulnerabilityTrend}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Map Controls Info */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2 border">
        <div className="text-xs text-gray-600">
          <div>🖱️ Click county for details</div>
          <div>📍 User location</div>
          <div>🗺️ County boundaries</div>
        </div>
      </div>
    </div>
  );
};

export default RiskClassificationMap;