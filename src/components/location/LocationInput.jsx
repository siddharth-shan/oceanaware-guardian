import { useState, useRef, useEffect } from 'react';
import { GeocodingService } from '../../services/api/geocodingService';

const LocationInput = ({ onLocationChange, currentLocation }) => {
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInput, setShowInput] = useState(false);
  const popupRef = useRef(null);
  const inputRef = useRef(null);

  const geocodingService = new GeocodingService();
  
  // Reset state when popup opens/closes
  useEffect(() => {
    if (showInput) {
      // Clear previous state when opening
      setZipCode('');
      setError('');
      // Focus the input after a brief delay to ensure DOM is ready
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select(); // Select any existing text
        }
      }, 100);
    }
  }, [showInput]);

  // Handle click outside to close popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowInput(false);
        setError('');
        setZipCode('');
      }
    }

    if (showInput) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showInput]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!zipCode.trim()) {
      setError('Please enter a zip code');
      return;
    }

    if (!geocodingService.isValidZipCode(zipCode.trim())) {
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
          detail: { location: newLocation, reason: 'zip_code_change' }
        }));
      }, 100);
      
      setShowInput(false);
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
                detail: { location: newLocation, reason: 'gps_location' }
              }));
            }, 100);
            
            setShowInput(false);
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
                detail: { location: newLocation, reason: 'gps_location_fallback' }
              }));
            }, 100);
            
            setShowInput(false);
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

  if (!showInput) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center text-white">
          <span className="mr-2">📍</span>
          <span className="text-sm font-medium">
            {currentLocation?.displayName || 'Location not set'}
          </span>
        </div>
        <button
          onClick={() => {
            setShowInput(true);
            setZipCode(''); // Ensure clean state
            setError('');
          }}
          className="bg-orange-700 hover:bg-orange-800 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        >
          {currentLocation ? 'Change' : 'Set ZIP'}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-20 z-40" onClick={() => setShowInput(false)}></div>
      
      {/* Compact popup positioned properly */}
      <div 
        ref={popupRef} 
        className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-800 font-medium text-sm">Change Location</h3>
            <button
              onClick={() => {
                setShowInput(false);
                setError('');
                setZipCode('');
              }}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* ZIP Code Input */}
            <div>
              <label htmlFor="zipcode" className="block text-xs font-medium text-gray-600 mb-1">
                ZIP Code
              </label>
              <input
                ref={inputRef}
                type="text"
                id="zipcode"
                key={showInput ? 'active' : 'inactive'} // Force re-render when popup opens
                value={zipCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                  if (value.length <= 5) { // Ensure max 5 digits
                    setZipCode(value);
                    setError(''); // Clear error on typing
                  }
                }}
                onFocus={(e) => e.target.select()} // Select all text when focused
                placeholder="Enter ZIP (e.g., 93065)"
                maxLength="5"
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-500"
                disabled={loading}
                autoComplete="postal-code"
                style={{ color: '#111827' }} // Explicit dark text color
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-xs bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading || !zipCode.trim()}
                className="flex-1 bg-orange-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Setting...
                  </span>
                ) : (
                  'Set Location'
                )}
              </button>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={loading}
                className="px-3 py-2 text-gray-600 bg-gray-100 rounded-md text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Use GPS Location"
              >
                📍
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LocationInput;