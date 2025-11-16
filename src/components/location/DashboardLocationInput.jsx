import { useState } from 'react';
import { GeocodingService } from '../../services/api/geocodingService';

const DashboardLocationInput = ({ onLocationChange, currentLocation }) => {
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
      
      // Trigger location change and force data refresh
      onLocationChange(newLocation);
      
      // Dispatch a custom event to notify all components of location change
      window.dispatchEvent(new CustomEvent('locationChanged', { 
        detail: newLocation 
      }));
      
      // Force a page refresh of fire data and other location-dependent data
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshLocationData', { 
          detail: { location: newLocation, reason: 'dashboard_zip_change' }
        }));
      }, 100);
      
      setZipCode('');
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
          } catch (err) {
            const newLocation = {
              lat: latitude,
              lng: longitude,
              source: 'gps',
              displayName: 'Current Location',
              timestamp: Date.now()
            };
            
            onLocationChange(newLocation);
            
            // Dispatch events for data refresh
            window.dispatchEvent(new CustomEvent('locationChanged', { detail: newLocation }));
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('refreshLocationData', { 
                detail: { location: newLocation, reason: 'dashboard_gps_fallback' }
              }));
            }, 100);
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center">
          <span className="mr-2">📍</span>
          Location
        </h3>
        {currentLocation && (
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">
              {currentLocation.displayName}
            </p>
            <p className="text-xs text-gray-500">
              {currentLocation.source === 'zipcode' && `ZIP: ${currentLocation.zipCode}`}
              {currentLocation.source === 'gps' && 'GPS Location'}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex space-x-2">
          <input
            type="text"
            id="dashboard-zipcode"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter ZIP code (e.g., 90210)"
            maxLength="10"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !zipCode.trim()}
            className="bg-orange-600 text-white px-4 py-2 text-sm rounded-md font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Set'}
          </button>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-2 text-sm rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Use GPS Location"
          >
            🎯
          </button>
        </div>

        {error && (
          <div className="text-red-600 text-xs bg-red-50 p-2 rounded border border-red-200">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default DashboardLocationInput;