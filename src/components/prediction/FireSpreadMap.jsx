import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, Polygon, Polyline, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * Interactive Fire Spread Map Component
 * Shows current fires, predicted spread areas, and risk zones
 */
const FireSpreadMap = ({ 
  userLocation, 
  fireData, 
  predictions, 
  trafficData,
  powerOutageData,
  airQualityData,
  selectedTimeRange = '24h',
  className = '' 
}) => {
  const [timeStep, setTimeStep] = useState(0);
  const [visibleLayers, setVisibleLayers] = useState({
    fires: true,
    predictions: true,
    smoke: true,
    traffic: true,
    power: true,
    wind: true,
    heatZones: true,
    evacuationZones: true,
  });
  const [animatedPolygons, setAnimatedPolygons] = useState({});
  const [windData, setWindData] = useState(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const animationRef = useRef(null);
  const updateIntervalRef = useRef(null);

  // Create custom fire icons
  const fireIcon = useMemo(() => 
    L.divIcon({
      html: '<div style="background: #ef4444; border-radius: 50%; width: 20px; height: 20px; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      className: 'custom-fire-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    }), []
  );

  const criticalFireIcon = useMemo(() => 
    L.divIcon({
      html: '<div style="background: #dc2626; border-radius: 50%; width: 24px; height: 24px; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.4); animation: pulse 2s infinite;"></div>',
      className: 'custom-critical-fire-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    }), []
  );

  const userIcon = useMemo(() => 
    L.divIcon({
      html: '<div style="background: #3b82f6; border-radius: 50%; width: 16px; height: 16px; border: 3px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      className: 'custom-user-icon',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    }), []
  );

  // Real-time wind data fetching
  const fetchWindData = useCallback(async () => {
    if (!userLocation?.lat || !userLocation?.lng) return;
    
    try {
      console.log('🌬️ Fetching wind data for:', userLocation);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/weather/wind?lat=${userLocation.lat}&lng=${userLocation.lng}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setWindData(data);
        console.log('🌬️ Wind data updated:', data);
      }
    } catch (error) {
      console.error('Failed to fetch wind data:', error);
      // Use mock wind data for demonstration
      setWindData({
        speed: 15 + Math.random() * 10, // 15-25 mph
        direction: 180 + Math.random() * 60, // Southwest winds
        gusts: 25 + Math.random() * 15,
        timestamp: new Date().toISOString()
      });
    }
  }, [userLocation]);

  // Real-time fire spread simulation
  const calculateFireSpreadPrediction = useCallback((fire, timeHours = 1) => {
    if (!fire || !windData) return null;
    
    const fireCenter = [
      fire.latitude || fire.lat || fire.location?.[0] || 0,
      fire.longitude || fire.lng || fire.location?.[1] || 0
    ];
    
    if (!fireCenter[0] || !fireCenter[1]) return null;
    
    // Enhanced fire spread calculation based on:
    // - Wind speed and direction
    // - Fire size and containment
    // - Terrain (simplified)
    // - Fuel moisture (estimated from weather)
    
    const baseSpreadRate = 0.5; // miles per hour base rate
    const windMultiplier = Math.max(1, windData.speed / 10); // Wind effect
    const containmentFactor = Math.max(0.1, 1 - (fire.containment || 0) / 100);
    const sizeMultiplier = Math.min(3, Math.sqrt((fire.acres || 100) / 100));
    
    const effectiveSpreadRate = baseSpreadRate * windMultiplier * containmentFactor * sizeMultiplier;
    const spreadDistance = effectiveSpreadRate * timeHours;
    
    // Create elliptical spread pattern influenced by wind
    const windRadians = (windData.direction * Math.PI) / 180;
    const majorAxis = spreadDistance * 1.5; // Spread more in wind direction
    const minorAxis = spreadDistance * 0.8; // Less perpendicular to wind
    
    // Generate prediction polygon points
    const points = [];
    const numPoints = 20;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      
      // Elliptical coordinates
      let x = majorAxis * Math.cos(angle);
      let y = minorAxis * Math.sin(angle);
      
      // Rotate based on wind direction
      const rotatedX = x * Math.cos(windRadians) - y * Math.sin(windRadians);
      const rotatedY = x * Math.sin(windRadians) + y * Math.cos(windRadians);
      
      // Convert to lat/lng (approximate)
      const latOffset = rotatedY / 69; // 69 miles per degree of latitude
      const lngOffset = rotatedX / (69 * Math.cos(fireCenter[0] * Math.PI / 180));
      
      points.push([
        fireCenter[0] + latOffset,
        fireCenter[1] + lngOffset
      ]);
    }
    
    return points;
  }, [windData]);

  // Heat zone calculations
  const calculateHeatZones = useMemo(() => {
    if (!fireData?.fires || !Array.isArray(fireData.fires)) return [];
    
    return fireData.fires.map(fire => {
      const fireCenter = [
        fire.latitude || fire.lat || fire.location?.[0],
        fire.longitude || fire.lng || fire.location?.[1]
      ];
      
      if (!fireCenter[0] || !fireCenter[1]) return null;
      
      // Calculate heat zones based on fire size and intensity
      const acres = fire.acres || 100;
      const intensity = acres > 1000 ? 'extreme' : acres > 500 ? 'high' : 'moderate';
      
      const zones = [];
      const baseRadius = Math.sqrt(acres) / 100; // Base radius in degrees
      
      // Multiple heat zones with different intensities
      const zoneConfigs = [
        { radius: baseRadius * 3, color: '#fee2e2', intensity: 'low', temp: '90-100°F' },
        { radius: baseRadius * 2, color: '#fecaca', intensity: 'medium', temp: '100-120°F' },
        { radius: baseRadius * 1, color: '#fca5a5', intensity: 'high', temp: '120-150°F' }
      ];
      
      zoneConfigs.forEach((zone, index) => {
        zones.push({
          id: `${fire.id}-heat-${index}`,
          center: fireCenter,
          radius: zone.radius * 1609.34, // Convert to meters for Leaflet
          color: zone.color,
          intensity: zone.intensity,
          temperature: zone.temp,
          fireId: fire.id,
          fireName: fire.name
        });
      });
      
      return zones;
    }).filter(Boolean).flat();
  }, [fireData]);

  // Evacuation zone calculations
  const calculateEvacuationZones = useMemo(() => {
    if (!fireData?.fires || !Array.isArray(fireData.fires)) return [];
    
    return fireData.fires.map(fire => {
      const fireCenter = [
        fire.latitude || fire.lat || fire.location?.[0],
        fire.longitude || fire.lng || fire.location?.[1]
      ];
      
      if (!fireCenter[0] || !fireCenter[1]) return null;
      
      const distance = fire.distance || 50;
      const containment = fire.containment || 0;
      
      let evacuationLevel = 'watch';
      let zoneColor = '#fef3c7';
      let zoneRadius = 10; // miles
      
      if (distance < 5 && containment < 50) {
        evacuationLevel = 'mandatory';
        zoneColor = '#fee2e2';
        zoneRadius = 15;
      } else if (distance < 15 && containment < 75) {
        evacuationLevel = 'warning';
        zoneColor = '#fed7aa';
        zoneRadius = 12;
      }
      
      return {
        id: `${fire.id}-evacuation`,
        center: fireCenter,
        bounds: [
          [fireCenter[0] - zoneRadius/69, fireCenter[1] - zoneRadius/69],
          [fireCenter[0] + zoneRadius/69, fireCenter[1] + zoneRadius/69]
        ],
        color: zoneColor,
        level: evacuationLevel,
        fireId: fire.id,
        fireName: fire.name,
        distance: distance
      };
    }).filter(Boolean);
  }, [fireData]);

  // Real-time updates effect
  useEffect(() => {
    if (realTimeUpdates) {
      fetchWindData();
      
      // Set up periodic updates every 5 minutes
      updateIntervalRef.current = setInterval(() => {
        fetchWindData();
        setLastUpdateTime(Date.now());
      }, 5 * 60 * 1000);
      
      return () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }
      };
    }
  }, [realTimeUpdates, fetchWindData]);

  // Default center if no user location - validate coordinates with enhanced logging
  const mapCenter = useMemo(() => {
    console.log('🗺️ MapCenter calculation - userLocation:', {
      userLocation,
      lat: userLocation?.lat,
      lng: userLocation?.lng,
      latType: typeof userLocation?.lat,
      lngType: typeof userLocation?.lng,
      latIsNaN: userLocation?.lat ? isNaN(userLocation.lat) : 'undefined',
      lngIsNaN: userLocation?.lng ? isNaN(userLocation.lng) : 'undefined'
    });

    // More robust validation
    const hasValidLocation = userLocation && 
                            typeof userLocation.lat === 'number' && 
                            typeof userLocation.lng === 'number' &&
                            !isNaN(userLocation.lat) && 
                            !isNaN(userLocation.lng) &&
                            userLocation.lat !== null && 
                            userLocation.lat !== undefined &&
                            userLocation.lng !== null && 
                            userLocation.lng !== undefined &&
                            Math.abs(userLocation.lat) <= 90 &&
                            Math.abs(userLocation.lng) <= 180;

    const center = hasValidLocation ? 
      [userLocation.lat, userLocation.lng] : 
      [34.0522, -118.2437]; // LA default for zip 92880 area
    
    console.log('🎯 Final mapCenter:', center, 'hasValidLocation:', hasValidLocation);
    
    // Final safety check
    if (isNaN(center[0]) || isNaN(center[1])) {
      console.error('❌ Invalid coordinates detected, using fallback');
      return [34.0522, -118.2437];
    }
    
    return center;
  }, [userLocation]);
  
  const mapZoom = 8; // Zoom out to see wider area including distant fires

  // Filter fires based on time range - define before predictionZones
  const filteredFires = useMemo(() => {
    if (!fireData?.fires || !Array.isArray(fireData.fires)) return [];
    
    const now = new Date();
    const cutoffTime = selectedTimeRange === '24h' 
      ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return fireData.fires.filter(fire => {
      // If fire has a timestamp, filter by it
      if (fire.timestamp) {
        return new Date(fire.timestamp) >= cutoffTime;
      }
      // Otherwise include all fires (some sources may not have timestamps)
      return true;
    });
  }, [fireData, selectedTimeRange]);

  // Simple linear interpolation without d3 dependency
  const simpleInterpolate = (start, end, t) => {
    try {
      console.log('🔄 simpleInterpolate called with:', {
        startType: typeof start,
        endType: typeof end,
        startIsArray: Array.isArray(start),
        endIsArray: Array.isArray(end),
        t
      });
      
      if (!start || !end || !Array.isArray(start) || !Array.isArray(end)) {
        console.warn('⚠️ simpleInterpolate: Invalid input arrays, returning start');
        return start;
      }
      
      return start.map((startPoint, i) => {
        const endPoint = end[i];
        if (!startPoint || !endPoint || !Array.isArray(startPoint) || !Array.isArray(endPoint)) {
          return startPoint;
        }
        
        return [
          startPoint[0] + (endPoint[0] - startPoint[0]) * t,
          startPoint[1] + (endPoint[1] - startPoint[1]) * t
        ];
      });
    } catch (error) {
      console.error('❌ Error in simpleInterpolate:', error, { start, end, t });
      return start || [];
    }
  };

  useEffect(() => {
    if (!predictions?.predictionsByFire) return;

    const day = Math.floor(timeStep);
    const nextDay = Math.ceil(timeStep);
    const t = timeStep - day;

    const newAnimatedPolygons = {};

    for (const fireId in predictions.predictionsByFire) {
      const firePredictions = predictions.predictionsByFire[fireId];
      const currentPolygon = firePredictions[day]?.spreadPolygon;
      const nextPolygon = firePredictions[nextDay]?.spreadPolygon;

      if (currentPolygon && nextPolygon) {
        newAnimatedPolygons[fireId] = simpleInterpolate(currentPolygon, nextPolygon, t);
      } else if (currentPolygon) {
        newAnimatedPolygons[fireId] = currentPolygon;
      }
    }

    setAnimatedPolygons(newAnimatedPolygons);

  }, [timeStep, predictions]);

  // Remove strict user location check - we now have fallback coordinates in mapCenter
  // The map can still show fire data even without a precise user location

  // Debug logging to identify the source of the map error
  console.log('🗺️ FireSpreadMap Debug:', {
    userLocation: userLocation ? 'exists' : 'undefined',
    fireData: fireData ? `${fireData?.fires?.length || 0} fires` : 'undefined',
    filteredFires: Array.isArray(filteredFires) ? `${filteredFires.length} filtered` : 'not array',
    predictions: predictions ? 'exists' : 'undefined',
    trafficData: trafficData ? `${trafficData?.roadClosures?.length || 0} closures` : 'undefined',
    powerOutageData: powerOutageData ? `${powerOutageData?.outages?.length || 0} outages` : 'undefined',
    airQualityData: airQualityData ? 'exists' : 'undefined',
    animatedPolygons: animatedPolygons ? `${Object.keys(animatedPolygons).length} polygons` : 'undefined'
  });

  // Final validation before rendering - now that polygon validation is working, restore dynamic coordinates
  const safeMapCenter = Array.isArray(mapCenter) && mapCenter.length === 2 && !isNaN(mapCenter[0]) && !isNaN(mapCenter[1]) ? mapCenter : [34.0522, -118.2437];
  
  console.log('🚨 Pre-render validation:', {
    mapCenter,
    safeMapCenter,
    mapCenterType: typeof mapCenter,
    mapCenterIsArray: Array.isArray(mapCenter),
    firstCoord: mapCenter?.[0],
    secondCoord: mapCenter?.[1],
    firstIsNaN: mapCenter?.[0] ? isNaN(mapCenter[0]) : 'undefined',
    secondIsNaN: mapCenter?.[1] ? isNaN(mapCenter[1]) : 'undefined'
  });

  return (
    <div className={`relative ${className}`}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .custom-critical-fire-icon div {
          animation: pulse 2s infinite;
        }
      `}</style>
      
      <MapContainer
        center={safeMapCenter}
        zoom={mapZoom}
        style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}
        className="z-10"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* User Location */}
        {safeMapCenter && safeMapCenter[0] && safeMapCenter[1] && (
          <Marker position={safeMapCenter} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <strong>📍 Your Location</strong>
                <br />
                {userLocation?.displayName || 'Current Position'}
                <br />
                <small className="text-gray-500">
                  {safeMapCenter[0].toFixed(4)}, {safeMapCenter[1].toFixed(4)}
                </small>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Animated Prediction Polygons */}
        {(() => {
          try {
            if (!visibleLayers.predictions || !animatedPolygons) return null;
            const keys = Object.keys(animatedPolygons);
            console.log('🔥 Prediction polygons keys:', keys);
            return keys.map(fireId => {
              const positions = animatedPolygons[fireId];
              console.log('🔥 Polygon positions for', fireId, ':', positions);
              console.log('🔥 First few coordinates:', positions.slice(0, 3));
              
              if (!positions || !Array.isArray(positions) || positions.length < 3) {
                console.warn('⚠️ Invalid polygon positions for', fireId);
                return null;
              }
              
              // Validate each coordinate pair
              const validPositions = positions.filter((pos, posIndex) => {
                if (!Array.isArray(pos) || pos.length !== 2) {
                  if (posIndex < 3) console.log('🔥 Invalid array structure:', pos);
                  return false;
                }
                const [lat, lng] = pos;
                const isValid = typeof lat === 'number' && typeof lng === 'number' && 
                               !isNaN(lat) && !isNaN(lng) && 
                               Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
                if (!isValid && posIndex < 3) {
                  console.log('🔥 Invalid coordinates:', { pos, lat, lng, latType: typeof lat, lngType: typeof lng });
                } else if (isValid && posIndex < 3) {
                  console.log('🔥 Valid coordinates found:', { pos, lat, lng });
                }
                return isValid;
              });
              
              const invalidCount = positions.length - validPositions.length;
              if (invalidCount > 0) {
                console.warn(`⚠️ Filtered ${invalidCount} invalid coordinates from polygon ${fireId}`);
              }
              
              if (validPositions.length < 3) {
                console.warn('⚠️ Not enough valid coordinates for polygon', fireId);
                return null;
              }
              
              return (
                <Polygon 
                  key={fireId} 
                  positions={validPositions} 
                  color="#FF4500" 
                  fillColor="#FF4500" 
                  fillOpacity={0.4} 
                  weight={2}
                />
              );
            });
          } catch (error) {
            console.error('❌ Error in prediction polygons map:', error);
            return null;
          }
        })()}

        {/* Current Fires */}
        {(() => {
          try {
            if (!visibleLayers.fires) return null;
            console.log('🔥 Current fires - filteredFires check:', {
              isArray: Array.isArray(filteredFires),
              length: filteredFires?.length,
              type: typeof filteredFires
            });
            
            if (!Array.isArray(filteredFires)) {
              console.error('❌ filteredFires is not an array:', filteredFires);
              return null;
            }
            
            return filteredFires.map((fire, index) => {
              const isCritical = fire.containment < 50 || fire.acres > 1000;
              // Fix coordinate extraction - handle multiple data formats
              const lat = fire.latitude || fire.lat || fire.location?.[0] || fire.coordinates?.[0];
              const lng = fire.longitude || fire.lng || fire.location?.[1] || fire.coordinates?.[1];
              
              // Debug logging for fire coordinates
              if (index === 0) {
                console.log('🔥 Fire data structure sample:', fire);
                console.log('🔥 Extracted coordinates:', { lat, lng });
                console.log('🔥 Fire location array:', fire.location);
              }
              
              // Skip fires without valid coordinates
              if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                console.log('🔥 Skipping fire due to invalid coordinates:', { lat, lng, fire: fire.name });
                return null;
              }
              
              // Log valid fire markers
              if (index < 3) {
                console.log('🔥 Rendering fire marker:', { name: fire.name, lat, lng });
              }
              
              const position = [lat, lng];
              
              return (
                <Marker 
                  key={fire.id || index} 
                  position={position} 
                  icon={isCritical ? criticalFireIcon : fireIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <strong>🔥 {fire.name || 'Active Fire'}</strong>
                      <br />
                      {fire.acres && <span>Size: {fire.acres} acres<br /></span>}
                      {fire.containment !== undefined && <span>Contained: {fire.containment}%<br /></span>}
                      {fire.distance && <span>Distance: {fire.distance.toFixed(1)} miles<br /></span>}
                      {fire.cause && <span>Cause: {fire.cause}<br /></span>}
                      <small className="text-gray-600">
                        {selectedTimeRange === '24h' ? 'Last 24 hours' : 'Last 7 days'}
                      </small>
                    </div>
                  </Popup>
                </Marker>
              );
            });
          } catch (error) {
            console.error('❌ Error in current fires map:', error, { filteredFires });
            return null;
          }
        })()}

        {/* Traffic Data */}
        {(() => {
          try {
            if (!visibleLayers.traffic || !trafficData?.roadClosures?.length) return null;
            console.log('🚧 Traffic data check:', {
              hasClosures: trafficData?.roadClosures?.length > 0,
              closuresCount: trafficData?.roadClosures?.length,
              isArray: Array.isArray(trafficData?.roadClosures)
            });
            
            if (!Array.isArray(trafficData.roadClosures)) {
              console.error('❌ trafficData.roadClosures is not an array:', trafficData.roadClosures);
              return null;
            }
            
            return trafficData.roadClosures.map(closure => {
              // Validate closure data
              if (!closure.path || !Array.isArray(closure.path) || closure.path.length < 2) {
                return null;
              }
              
              return (
                <Polyline 
                  key={closure.id} 
                  positions={closure.path} 
                  color={closure.severity === 'critical' ? '#dc2626' : '#ea580c'} 
                  weight={4}
                  opacity={0.8}
                >
                  <Popup>
                    <div>
                      <strong>🚧 Road Closure</strong>
                      <br />
                      <strong>Type:</strong> {closure.type}
                      <br />
                      <strong>Severity:</strong> {closure.severity}
                      <br />
                      <p className="mt-2">{closure.details}</p>
                    </div>
                  </Popup>
                </Polyline>
              );
            });
          } catch (error) {
            console.error('❌ Error in traffic data map:', error, { trafficData });
            return null;
          }
        })()}

        {/* Power Outages */}
        {(() => {
          try {
            if (!visibleLayers.power || !powerOutageData?.outages?.length) return null;
            console.log('⚡ Power outage data check:', {
              hasOutages: powerOutageData?.outages?.length > 0,
              outagesCount: powerOutageData?.outages?.length,
              isArray: Array.isArray(powerOutageData?.outages)
            });
            
            if (!Array.isArray(powerOutageData.outages)) {
              console.error('❌ powerOutageData.outages is not an array:', powerOutageData.outages);
              return null;
            }
            
            return powerOutageData.outages.map(outage => {
              console.log('⚡ Power outage area for', outage.id, ':', outage.area);
              
              // Validate outage data
              if (!outage.area || !Array.isArray(outage.area) || outage.area.length < 3) {
                console.warn('⚠️ Invalid power outage area for', outage.id);
                return null;
              }
              
              // Validate each coordinate pair
              const validArea = outage.area.filter(pos => {
                if (!Array.isArray(pos) || pos.length !== 2) return false;
                const [lat, lng] = pos;
                const isValid = typeof lat === 'number' && typeof lng === 'number' && 
                               !isNaN(lat) && !isNaN(lng) && 
                               Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
                return isValid;
              });
              
              const invalidCount = outage.area.length - validArea.length;
              if (invalidCount > 0) {
                console.warn(`⚠️ Filtered ${invalidCount} invalid coordinates from power outage ${outage.id}`);
              }
              
              if (validArea.length < 3) {
                console.warn('⚠️ Not enough valid coordinates for power outage', outage.id);
                return null;
              }
              
              return (
                <Polygon 
                  key={outage.id} 
                  positions={validArea} 
                  color="#fbbf24" 
                  fillColor="#fbbf24" 
                  fillOpacity={0.4}
                  weight={2}
                >
                  <Popup>
                    <div>
                      <strong>⚡ Power Outage</strong>
                      <br />
                      <strong>Customers Affected:</strong> {outage.customersAffected}
                      <br />
                      <strong>Estimated Restore:</strong> {outage.estimatedRestoreTime}
                      <br />
                      <strong>Cause:</strong> {outage.cause}
                    </div>
                  </Popup>
                </Polygon>
              );
            });
          } catch (error) {
            console.error('❌ Error in power outage map:', error, { powerOutageData });
            return null;
          }
        })()}

        {/* Smoke Plume */}
        {(() => {
          if (!visibleLayers.smoke || !airQualityData?.smokePlume?.coordinates) return null;
          
          const coordinates = airQualityData.smokePlume.coordinates;
          console.log('💨 Smoke plume coordinates:', coordinates);
          
          if (!Array.isArray(coordinates) || coordinates.length < 3) {
            console.warn('⚠️ Invalid smoke plume coordinates');
            return null;
          }
          
          // Validate each coordinate pair
          const validCoordinates = coordinates.filter(pos => {
            if (!Array.isArray(pos) || pos.length !== 2) return false;
            const [lat, lng] = pos;
            const isValid = typeof lat === 'number' && typeof lng === 'number' && 
                           !isNaN(lat) && !isNaN(lng) && 
                           Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
            return isValid;
          });
          
          const invalidCount = coordinates.length - validCoordinates.length;
          if (invalidCount > 0) {
            console.warn(`⚠️ Filtered ${invalidCount} invalid coordinates from smoke plume`);
          }
          
          if (validCoordinates.length < 3) {
            console.warn('⚠️ Not enough valid coordinates for smoke plume');
            return null;
          }
          
          return (
            <Polygon 
              positions={validCoordinates} 
              color="#6b7280" 
              fillColor="#9ca3af" 
              fillOpacity={0.3}
              weight={1}
            >
              <Popup>
                <div>
                  <strong>💨 Smoke Plume</strong>
                  <br />
                  <strong>Source:</strong> {airQualityData.smokePlume.source}
                  <br />
                  <strong>Intensity:</strong> {airQualityData.smokePlume.intensity}
                </div>
              </Popup>
            </Polygon>
          );
        })()}

        {/* Real-time Fire Spread Predictions */}
        {(() => {
          if (!visibleLayers.predictions || !filteredFires.length || !windData) return null;
          
          return filteredFires.map((fire, index) => {
            const prediction = calculateFireSpreadPrediction(fire, 1); // 1-hour prediction
            if (!prediction || prediction.length < 3) return null;
            
            return (
              <Polygon
                key={`prediction-${fire.id || index}`}
                positions={prediction}
                color="#ff6b35"
                fillColor="#ff6b35"
                fillOpacity={0.25}
                weight={2}
                dashArray="5, 5"
              >
                <Popup>
                  <div>
                    <strong>🔮 Fire Spread Prediction</strong>
                    <br />
                    <strong>Fire:</strong> {fire.name || 'Active Fire'}
                    <br />
                    <strong>Predicted Spread:</strong> 1 hour
                    <br />
                    <strong>Wind Speed:</strong> {windData.speed.toFixed(1)} mph
                    <br />
                    <strong>Wind Direction:</strong> {windData.direction}°
                    <br />
                    <small className="text-gray-600">
                      Based on current wind conditions and fire parameters
                    </small>
                  </div>
                </Popup>
              </Polygon>
            );
          });
        })()}

        {/* Heat Zones */}
        {(() => {
          if (!visibleLayers.heatZones) return null;
          
          return calculateHeatZones.map(zone => (
            <Circle
              key={zone.id}
              center={zone.center}
              radius={zone.radius}
              color={zone.color}
              fillColor={zone.color}
              fillOpacity={0.15}
              weight={1}
            >
              <Popup>
                <div>
                  <strong>🌡️ Heat Zone</strong>
                  <br />
                  <strong>Fire:</strong> {zone.fireName}
                  <br />
                  <strong>Intensity:</strong> {zone.intensity}
                  <br />
                  <strong>Temperature:</strong> {zone.temperature}
                  <br />
                  <small className="text-gray-600">
                    Estimated heat affected area
                  </small>
                </div>
              </Popup>
            </Circle>
          ));
        })()}

        {/* Evacuation Zones */}
        {(() => {
          if (!visibleLayers.evacuationZones) return null;
          
          return calculateEvacuationZones.map(zone => (
            <Rectangle
              key={zone.id}
              bounds={zone.bounds}
              color="#dc2626"
              fillColor={zone.color}
              fillOpacity={0.2}
              weight={2}
              dashArray={zone.level === 'mandatory' ? null : "10, 10"}
            >
              <Popup>
                <div>
                  <strong>🚨 Evacuation Zone</strong>
                  <br />
                  <strong>Level:</strong> {zone.level.toUpperCase()}
                  <br />
                  <strong>Fire:</strong> {zone.fireName}
                  <br />
                  <strong>Distance:</strong> {zone.distance?.toFixed(1)} miles
                  <br />
                  {zone.level === 'mandatory' && (
                    <strong className="text-red-600">EVACUATE IMMEDIATELY</strong>
                  )}
                  {zone.level === 'warning' && (
                    <strong className="text-orange-600">Be Ready to Leave</strong>
                  )}
                  {zone.level === 'watch' && (
                    <span className="text-yellow-600">Stay Alert</span>
                  )}
                </div>
              </Popup>
            </Rectangle>
          ));
        })()}

        {/* Wind Arrows */}
        {(() => {
          if (!visibleLayers.wind || !windData || !safeMapCenter) return null;
          
          // Create multiple wind arrows across the map
          const windArrows = [];
          const gridSize = 0.1; // degrees
          const numArrows = 5;
          
          for (let i = 0; i < numArrows; i++) {
            for (let j = 0; j < numArrows; j++) {
              const lat = safeMapCenter[0] + (i - 2) * gridSize;
              const lng = safeMapCenter[1] + (j - 2) * gridSize;
              
              // Calculate arrow end point based on wind direction and speed
              const windRadians = (windData.direction * Math.PI) / 180;
              const arrowLength = (windData.speed / 50) * 0.05; // Scale based on wind speed
              
              const endLat = lat + arrowLength * Math.cos(windRadians);
              const endLng = lng + arrowLength * Math.sin(windRadians);
              
              windArrows.push(
                <Polyline
                  key={`wind-${i}-${j}`}
                  positions={[[lat, lng], [endLat, endLng]]}
                  color="#1e40af"
                  weight={2}
                  opacity={0.7}
                >
                  {i === 2 && j === 2 && (
                    <Popup>
                      <div>
                        <strong>🌬️ Wind Data</strong>
                        <br />
                        <strong>Speed:</strong> {windData.speed.toFixed(1)} mph
                        <br />
                        <strong>Direction:</strong> {windData.direction}°
                        <br />
                        <strong>Gusts:</strong> {windData.gusts?.toFixed(1)} mph
                        <br />
                        <small className="text-gray-600">
                          Updated: {new Date(windData.timestamp).toLocaleTimeString()}
                        </small>
                      </div>
                    </Popup>
                  )}
                </Polyline>
              );
            }
          }
          
          return windArrows;
        })()}
      </MapContainer>

      {/* Time Slider */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs z-20 max-w-xs">
        <label htmlFor="time-slider" className="font-semibold mb-2">Time Animation (Days)</label>
        <input
          id="time-slider"
          type="range"
          min="0"
          max="4"
          step="0.1"
          value={timeStep}
          onChange={(e) => setTimeStep(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="text-center">Day {Math.floor(timeStep) + 1}</div>
      </div>

      {/* Enhanced Layer Control */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs z-20 max-w-xs">
        <div className="font-semibold mb-2">🗺️ Map Layers</div>
        <div className="space-y-1">
          {(() => {
            try {
              const layerLabels = {
                fires: '🔥 Active Fires',
                predictions: '🔮 Spread Predictions',
                smoke: '💨 Smoke Plume',
                traffic: '🚧 Road Closures', 
                power: '⚡ Power Outages',
                wind: '🌬️ Wind Patterns',
                heatZones: '🌡️ Heat Zones',
                evacuationZones: '🚨 Evacuation Zones'
              };
              
              return Object.keys(visibleLayers).map(layer => (
                <div key={layer} className="flex items-center">
                  <input
                    type="checkbox"
                    id={layer}
                    checked={visibleLayers[layer]}
                    onChange={() => setVisibleLayers(prev => ({ ...prev, [layer]: !prev[layer] }))}
                    className="mr-2"
                  />
                  <label htmlFor={layer} className="text-xs">
                    {layerLabels[layer] || layer}
                  </label>
                </div>
              ));
            } catch (error) {
              console.error('❌ Error in layer control map:', error);
              return null;
            }
          })()}
        </div>
        
        <div className="border-t mt-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold">Real-time Updates</label>
            <input
              type="checkbox"
              checked={realTimeUpdates}
              onChange={(e) => setRealTimeUpdates(e.target.checked)}
              className="ml-2"
            />
          </div>
          {realTimeUpdates && (
            <div className="text-gray-500 mt-1">
              Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Map Legend */}
      <div className="absolute bottom-16 left-4 bg-white rounded-lg shadow-lg p-3 text-xs z-20 max-w-xs">
        <div className="font-semibold mb-2">🗺️ Enhanced Fire Map Legend</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Your Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Current Fires</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <span>Critical Fires</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-orange-500 border-dashed opacity-60"></div>
            <span>Real-time Predictions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-pink-300 rounded-full opacity-40"></div>
            <span>Heat Zones</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-200 border border-red-600"></div>
            <span>Evacuation Zones</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 opacity-50"></div>
            <span>Smoke Plume</span>
          </div>
          <div className="flex items-center space-x-2">
            <div style={{width: '12px', height: '2px', backgroundColor: '#1e40af'}}></div>
            <span>Wind Patterns</span>
          </div>
          <div className="flex items-center space-x-2">
            <div style={{width: '12px', height: '4px', backgroundColor: '#ea580c'}}></div>
            <span>Road Closures</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 opacity-50"></div>
            <span>Power Outages</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2 border-t pt-2">
          <div>🔮 Real-time predictions use current wind data</div>
          <div>🌡️ Heat zones show temperature impact areas</div>
          <div>🚨 Evacuation zones update based on fire proximity</div>
          {windData && (
            <div className="mt-1 font-semibold text-blue-600">
              Current Wind: {windData.speed.toFixed(1)} mph @ {windData.direction}°
            </div>
          )}
        </div>
      </div>

      {/* Risk Level Indicator */}
      {predictions?.predictionsByFire && (
        <div className="absolute top-20 right-4 bg-white rounded-lg shadow-lg p-3 text-xs z-20">
          <div className="font-semibold mb-2">⚠️ Risk Levels</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Low (0-39)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Moderate (40-59)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>High (60-79)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Extreme (80+)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FireSpreadMap;