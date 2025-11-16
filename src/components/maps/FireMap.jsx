import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { useFireData } from '../../hooks/useFireData';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom fire icon
const createFireIcon = (severity) => {
  const colors = {
    'High': '#dc2626',
    'Medium': '#ea580c', 
    'Low': '#f59e0b'
  };
  
  return L.divIcon({
    className: 'custom-fire-marker',
    html: `
      <div style="
        width: 24px; 
        height: 24px; 
        background: ${colors[severity] || '#ea580c'}; 
        border: 2px solid white; 
        border-radius: 50%; 
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
      ">🔥</div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Custom user location icon
const userLocationIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="
      width: 16px; 
      height: 16px; 
      background: #3b82f6; 
      border: 3px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Component to fit map bounds to show all fires
function MapController({ fireData, userLocation }) {
  const map = useMap();
  
  useEffect(() => {
    if (fireData && fireData.length > 0) {
      const bounds = L.latLngBounds();
      
      // Add user location to bounds
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }
      
      // Add fire locations to bounds
      fireData.forEach(fire => {
        bounds.extend(fire.location);
      });
      
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 10);
    }
  }, [map, fireData, userLocation]);
  
  return null;
}

const defaultFireDataOptions = {
  radius: 50, // 50 miles radius
  includeContained: true,
  minAcres: 10
};

export default function FireMap({ userLocation, fireData: initialFireData }) {
  const [selectedFire, setSelectedFire] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Fetch fire data within the component if not provided
  const { fires: fetchedFireData, metadata: fireMetadata, loading: fireLoading } = useFireData(userLocation, defaultFireDataOptions, !initialFireData);
  const fireData = initialFireData || fetchedFireData;

  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : [34.0522, -118.2437];

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  // Default center (Los Angeles area)
  

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return 'Not reported';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact'
    }).format(amount);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (fireLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fire map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ minHeight: '400px' }}>
      <MapContainer
        center={mapCenter}
        zoom={userLocation ? 10 : 8}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        whenReady={() => setMapReady(true)}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Map controller for automatic bounds */}
        <MapController fireData={fireData} userLocation={userLocation} />
        
        {/* User location marker */}
        {userLocation && (
          <>
            <Marker 
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
            >
              <Popup>
                <div className="text-center p-2">
                  <div className="font-bold text-blue-800 mb-1">📍 Your Location</div>
                  <div className="text-sm text-gray-700">
                    {userLocation.displayName || 'Current Location'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </div>
                  {userLocation.zipCode && (
                    <div className="text-xs text-blue-600 mt-1">
                      ZIP: {userLocation.zipCode}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
            
            {/* Safety radius circles */}
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={40233} // 25 miles in meters
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.05,
                weight: 2,
                dashArray: '10, 5'
              }}
            />
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={80467} // 50 miles in meters
              pathOptions={{
                color: '#6b7280',
                fillColor: '#6b7280',
                fillOpacity: 0.02,
                weight: 1,
                dashArray: '15, 10'
              }}
            />
          </>
        )}
        
        {/* Fire markers */}
        {fireData && fireData.map((fire, index) => {
          // More flexible coordinate handling
          const lat = fire.location?.[0] || fire.lat || fire.latitude || fire.coordinates?.lat;
          const lng = fire.location?.[1] || fire.lng || fire.longitude || fire.coordinates?.lng;
          
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            console.warn('Invalid coordinates for fire:', fire);
            return null;
          }
          
          // Create a unique key by combining multiple identifiers
          const uniqueKey = `fire-${fire.id || fire.name || 'unknown'}-${index}-${lat.toFixed(3)}-${lng.toFixed(3)}`;
          
          return (
            <Marker
              key={uniqueKey}
              position={[parseFloat(lat), parseFloat(lng)]}
              icon={createFireIcon(fire.severity)}
            >
              <Popup maxWidth={300}>
                <div className="p-2">
                  <h3 className="font-bold text-lg mb-2 text-red-800">
                    🔥 {fire.name || fire.title || 'Wildfire'}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium text-red-600">
                        {fire.acres?.toLocaleString() || fire.data?.acres?.toLocaleString() || 'Unknown'} acres
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Containment:</span>
                      <span className="font-medium text-green-600">
                        {fire.containment || fire.data?.containment || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance:</span>
                      <span className="font-medium text-blue-600">
                        {(fire.distance || fire.data?.distance)?.toFixed(1) || 'Calculating...'} mi
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(fire.severity)}`}>
                        {fire.severity || 'Medium'}
                      </span>
                    </div>
                    {fire.data?.lastUpdate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Updated:</span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(fire.data.lastUpdate)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500 text-center">
                      Click and drag map to explore • Zoom for more detail
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}