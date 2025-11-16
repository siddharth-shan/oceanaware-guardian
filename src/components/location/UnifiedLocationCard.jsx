import { useState } from 'react';
import { MapPin, AlertTriangle, Clock, Shield, Edit3, Navigation, Thermometer, Droplets, Wind, Flame } from 'lucide-react';
import { GeocodingService } from '../../services/api/geocodingService';

const UnifiedLocationCard = ({ 
  userLocation, 
  onLocationChange, 
  nearbyFires, 
  activeAlertsCount, 
  lastUpdate,
  weatherData 
}) => {
  const [isEditing, setIsEditing] = useState(!userLocation);
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const geocodingService = new GeocodingService();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!zipCode.trim()) {
      setError('Please enter a zip code');
      return;
    }

    if (!geocodingService.isValidZipCode(zipCode)) {
      setError('Please enter a valid 5-digit zip code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const location = await geocodingService.getLocationFromZipCode(zipCode);
      
      const newLocation = {
        lat: location.lat,
        lng: location.lng,
        source: 'zipcode',
        displayName: location.displayName,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode,
        timestamp: Date.now()
      };
      
      onLocationChange(newLocation);
      
      // Dispatch events for data refresh
      window.dispatchEvent(new CustomEvent('locationChanged', { detail: newLocation }));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshLocationData', { 
          detail: { location: newLocation, reason: 'dashboard_zip_change' }
        }));
      }, 100);
      
      setZipCode('');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to find location for this zip code');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setError('');
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const displayName = await geocodingService.getCurrentLocationName(latitude, longitude);
            const newLocation = {
              lat: latitude,
              lng: longitude,
              source: 'gps',
              displayName: displayName || 'Current Location',
              timestamp: Date.now()
            };
            
            onLocationChange(newLocation);
            
            // Dispatch events for data refresh
            window.dispatchEvent(new CustomEvent('locationChanged', { detail: newLocation }));
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('refreshLocationData', { 
                detail: { location: newLocation, reason: 'dashboard_gps' }
              }));
            }, 100);
            
            setIsEditing(false);
          } catch (err) {
            const newLocation = {
              lat: latitude,
              lng: longitude,
              source: 'gps',
              displayName: 'Current Location',
              timestamp: Date.now()
            };
            
            onLocationChange(newLocation);
            setIsEditing(false);
          } finally {
            setLoading(false);
          }
        },
        () => {
          setError('Unable to access your location. Please enter a zip code.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser');
    }
  };

  if (!userLocation || isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 lg:p-6 mb-4 lg:mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center">
            <MapPin className="h-5 w-5 text-blue-600 mr-2" />
            {userLocation ? 'Update Location' : 'Set Your Location'}
          </h3>
          {userLocation && (
            <button 
              onClick={() => setIsEditing(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          )}
        </div>

        {!userLocation && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <p className="text-yellow-800 text-sm">
                Set your location to view personalized fire and weather data
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Enter ZIP code (e.g., 90210)"
              maxLength="10"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !zipCode.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Finding...' : 'Set Location'}
            </button>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-gray-500 text-sm">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Use Current GPS Location
          </button>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-lg p-4 lg:p-6 mb-4 lg:mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Location Info */}
        <div className="flex items-start lg:items-center space-x-3">
          <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-blue-900 text-lg">
                {userLocation.displayName || 'Current Location'}
              </h3>
              <button 
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                title="Change Location"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-blue-700">
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                {userLocation.source === 'zipcode' && ` • ZIP: ${userLocation.zipCode}`}
                {userLocation.source === 'gps' && ' • GPS Location'}
              </p>
              <div className="flex items-center text-blue-600">
                <Clock className="h-3 w-3 mr-1" />
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Now includes weather */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <div className="text-center">
              <div className="text-xl lg:text-2xl font-bold text-red-600">{nearbyFires}</div>
              <div className="text-xs text-red-800">Nearby Fires</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-yellow-200">
            <div className="text-center">
              <div className="text-xl lg:text-2xl font-bold text-yellow-600">{activeAlertsCount}</div>
              <div className="text-xs text-yellow-800">Active Alerts</div>
            </div>
          </div>
          {/* Weather Information */}
          {weatherData && (
            <>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Thermometer className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-xl lg:text-2xl font-bold text-blue-600">{weatherData.temperature || 72}°</div>
                  <div className="text-xs text-blue-800">Temperature</div>
                </div>
              </div>
              <div className={`bg-white rounded-lg p-3 border ${
                weatherData.fireWeatherIndex === 'EXTREME' ? 'border-red-500' :
                weatherData.fireWeatherIndex === 'HIGH' ? 'border-red-300' :
                weatherData.fireWeatherIndex === 'MEDIUM' ? 'border-yellow-300' : 'border-green-300'
              }`}>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Flame className={`h-4 w-4 ${
                      weatherData.fireWeatherIndex === 'EXTREME' ? 'text-red-600' :
                      weatherData.fireWeatherIndex === 'HIGH' ? 'text-red-500' :
                      weatherData.fireWeatherIndex === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div className={`text-lg lg:text-xl font-bold ${
                    weatherData.fireWeatherIndex === 'EXTREME' ? 'text-red-600' :
                    weatherData.fireWeatherIndex === 'HIGH' ? 'text-red-500' :
                    weatherData.fireWeatherIndex === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {weatherData.fireWeatherIndex === 'EXTREME' ? 'EXT' :
                     weatherData.fireWeatherIndex === 'HIGH' ? 'HIGH' :
                     weatherData.fireWeatherIndex === 'MEDIUM' ? 'MED' : 'LOW'}
                  </div>
                  <div className="text-xs text-gray-800">Fire Risk</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Weather Details Section */}
      {weatherData && (
        <div className="mt-4 grid grid-cols-2 gap-3 p-3 bg-white/50 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-2 text-sm">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="text-blue-700">{weatherData.humidity || 45}% humidity</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Wind className="h-4 w-4 text-blue-500" />
            <span className="text-blue-700">{weatherData.windSpeed || 12} mph wind</span>
          </div>
          {weatherData.description && (
            <div className="col-span-2 text-sm text-blue-600 mt-1">
              <span className="font-medium">Conditions:</span> {weatherData.description}
            </div>
          )}
        </div>
      )}

      {/* Status Badge */}
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center text-sm">
          <Shield className="h-4 w-4 text-green-600 mr-2" />
          <span className="text-green-700 font-medium">
            {nearbyFires === 0 && activeAlertsCount === 0 ? 'All Clear' : 'Monitoring Active'}
          </span>
        </div>
        <div className="text-xs text-blue-600">
          📍 Location & weather active
        </div>
      </div>
    </div>
  );
};

export default UnifiedLocationCard;