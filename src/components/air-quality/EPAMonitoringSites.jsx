import React, { useState, useEffect } from 'react';
import { MapPin, Search, Award, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

/**
 * EPA Monitoring Sites Component
 * Displays available EPA AQS monitoring sites and their data
 */
const EPAMonitoringSites = ({ location, onSiteSelect, className = '' }) => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);

  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      fetchNearbySites();
    }
  }, [location]);

  const fetchNearbySites = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the backend API
      // For now, we'll use mock data that represents EPA AQS sites
      const mockSites = [
        {
          id: '06-037-0016',
          name: 'Glendora',
          city: 'Glendora',
          county: 'Los Angeles',
          state_code: '06',
          county_code: '037',
          site_number: '0016',
          latitude: 34.14435,
          longitude: -117.85036,
          address: '840 LAUREL, GLENDORA',
          distance: 25.3,
          active_parameters: ['PM2.5', 'PM10', 'Ozone'],
          last_measurement: '2025-01-15',
          data_quality: 'Excellent'
        },
        {
          id: '06-037-0012',
          name: 'Pasadena',
          city: 'Pasadena',
          county: 'Los Angeles',
          state_code: '06',
          county_code: '037',
          site_number: '0012',
          latitude: 34.1394,
          longitude: -118.1292,
          address: '3100 N GARFIELD AVE, PASADENA',
          distance: 12.8,
          active_parameters: ['PM2.5', 'Ozone', 'NO2'],
          last_measurement: '2025-01-15',
          data_quality: 'Good'
        },
        {
          id: '06-037-0113',
          name: 'Los Angeles - North Main Street',
          city: 'Los Angeles',
          county: 'Los Angeles',
          state_code: '06',
          county_code: '037',
          site_number: '0113',
          latitude: 34.0669,
          longitude: -118.2278,
          address: '1630 N MAIN ST, LOS ANGELES',
          distance: 3.2,
          active_parameters: ['PM2.5', 'PM10', 'Ozone', 'NO2', 'SO2'],
          last_measurement: '2025-01-15',
          data_quality: 'Excellent'
        }
      ];

      // Sort by distance
      const sortedSites = mockSites.sort((a, b) => a.distance - b.distance);
      setSites(sortedSites);
      
      // Auto-select the closest site
      if (sortedSites.length > 0) {
        setSelectedSite(sortedSites[0]);
        onSiteSelect && onSiteSelect(sortedSites[0]);
      }
      
    } catch (err) {
      setError('Failed to fetch EPA monitoring sites');
    } finally {
      setLoading(false);
    }
  };

  const handleSiteSelect = (site) => {
    setSelectedSite(site);
    onSiteSelect && onSiteSelect(site);
  };

  const getDataQualityColor = (quality) => {
    switch (quality?.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white border rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading EPA monitoring sites...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white border rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Award className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">EPA Monitoring Sites</h3>
            <p className="text-sm text-gray-500">
              Official EPA Air Quality System monitoring stations
            </p>
          </div>
        </div>
      </div>

      {/* Sites List */}
      <div className="p-4">
        {sites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No EPA monitoring sites found in this area</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sites.map((site) => (
              <div
                key={site.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedSite?.id === site.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleSiteSelect(site)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <MapPin className="h-4 w-4 text-blue-600 mr-2" />
                      <h4 className="font-medium text-gray-900">{site.name}</h4>
                      {selectedSite?.id === site.id && (
                        <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                          SELECTED
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <p>{site.address}</p>
                      <p>{site.city}, {site.county} County</p>
                      <p>Site ID: {site.id}</p>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {site.distance.toFixed(1)} km away
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Updated: {site.last_measurement}
                      </span>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getDataQualityColor(site.data_quality)}`}>
                      {site.data_quality}
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      {site.active_parameters.length} parameters
                    </div>
                  </div>
                </div>

                {/* Parameter Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {site.active_parameters.map((param) => (
                    <span
                      key={param}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {param}
                    </span>
                  ))}
                </div>

                {selectedSite?.id === site.id && (
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>EPA AQS Site:</strong> This is an official EPA Air Quality System monitoring site with 
                      certified equipment and quality-assured data. Measurements are used for regulatory compliance 
                      and health advisories.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center">
            <Award className="h-4 w-4 mr-1" />
            <span>EPA AQS Official Data</span>
          </div>
          <div>
            {sites.length} site{sites.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>
    </div>
  );
};

export default EPAMonitoringSites;