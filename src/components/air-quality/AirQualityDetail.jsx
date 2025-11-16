import React from 'react';
import { Wind, AlertTriangle, Shield, Eye, Heart, Activity, MapPin, Calendar, Award } from 'lucide-react';

/**
 * Enhanced Air Quality Detail Component
 * Displays comprehensive air quality information with wildfire smoke focus
 */
const AirQualityDetail = ({ airQualityData, className = '' }) => {
  if (!airQualityData) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-gray-500">
          <Wind className="h-5 w-5 mr-2" />
          <span>Air quality data unavailable</span>
        </div>
      </div>
    );
  }

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return 'text-green-600 bg-green-50 border-green-200';
    if (aqi <= 100) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (aqi <= 150) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (aqi <= 200) return 'text-red-600 bg-red-50 border-red-200';
    if (aqi <= 300) return 'text-purple-600 bg-purple-50 border-purple-200';
    return 'text-red-800 bg-red-100 border-red-300';
  };

  const getSmokeRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'extreme': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const aqiColorClass = getAQIColor(airQualityData.aqi);
  const smokeColorClass = getSmokeRiskColor(airQualityData.smoke?.riskLevel);

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Wind className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Air Quality</h3>
              <p className="text-sm text-gray-500">
                {airQualityData.location?.reportingArea || 'Current Location'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{airQualityData.aqi || 'N/A'}</div>
            <div className="text-sm text-gray-600">AQI</div>
          </div>
        </div>
      </div>

      {/* AQI Status */}
      <div className="p-4 border-b border-gray-200">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${aqiColorClass}`}>
          {airQualityData.category || 'Unknown'}
        </div>
        {airQualityData.isRealTime && (
          <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
            Real-time
          </span>
        )}
      </div>

      {/* Wildfire Smoke Status */}
      {airQualityData.smoke && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Wildfire Smoke
            </h4>
            <div className={`px-2 py-1 rounded text-xs font-medium ${smokeColorClass}`}>
              {airQualityData.smoke.riskLevel?.toUpperCase() || 'UNKNOWN'}
            </div>
          </div>
          
          {airQualityData.smoke.detected && (
            <div className="flex items-start bg-orange-50 border border-orange-200 rounded-lg p-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-800">Smoke Detected</p>
                <p className="text-sm text-orange-700 mt-1">
                  {airQualityData.smoke.healthMessage}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Pollutants */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Activity className="h-4 w-4 mr-2" />
          Key Pollutants
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
          {/* PM2.5 - Most important for wildfire smoke */}
          {(airQualityData.pm25?.value || airQualityData.pm25?.concentration) && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-900">PM2.5</div>
              <div className="text-lg font-bold text-gray-900">
                {airQualityData.pm25.value || airQualityData.pm25.concentration || 'N/A'}
                <span className="text-sm font-normal text-gray-600 ml-1">μg/m³</span>
              </div>
              {airQualityData.pm25.category && (
                <div className="text-xs text-gray-600">{airQualityData.pm25.category}</div>
              )}
            </div>
          )}

          {/* Ozone */}
          {airQualityData.pollutants?.ozone && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-900">Ozone</div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(airQualityData.pollutants.ozone)}
                <span className="text-sm font-normal text-gray-600 ml-1">μg/m³</span>
              </div>
            </div>
          )}

          {/* PM10 */}
          {airQualityData.pollutants?.pm10 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-900">PM10</div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(airQualityData.pollutants.pm10)}
                <span className="text-sm font-normal text-gray-600 ml-1">μg/m³</span>
              </div>
            </div>
          )}

          {/* NO2 */}
          {airQualityData.pollutants?.no2 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-900">NO₂</div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(airQualityData.pollutants.no2)}
                <span className="text-sm font-normal text-gray-600 ml-1">μg/m³</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Health Recommendations */}
      {airQualityData.healthRecommendations && airQualityData.healthRecommendations.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Heart className="h-4 w-4 mr-2" />
            Health Recommendations
          </h4>
          <ul className="space-y-2">
            {airQualityData.healthRecommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start text-sm text-gray-700">
                <Shield className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* EPA AQS Official Data Section */}
      {airQualityData.epaDetails && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center mb-3">
            <Award className="h-5 w-5 text-blue-600 mr-2" />
            <h4 className="font-medium text-blue-900">EPA AQS Official Data</h4>
            <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded">
              GOVERNMENT
            </span>
          </div>
          
          {/* Monitoring Site Info */}
          <div className="mb-3">
            <div className="flex items-start mb-2">
              <MapPin className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {airQualityData.epaDetails.monitoringSite.name}
                </p>
                <p className="text-xs text-blue-700">
                  {airQualityData.epaDetails.monitoringSite.city}, {airQualityData.epaDetails.monitoringSite.county} County
                </p>
                <p className="text-xs text-blue-600">
                  Site ID: {airQualityData.epaDetails.monitoringSite.state_code}-{airQualityData.epaDetails.monitoringSite.county_code}-{airQualityData.epaDetails.monitoringSite.site_number}
                </p>
              </div>
            </div>
          </div>

          {/* EPA Measurements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {airQualityData.epaDetails.measurements.pm25 && (
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">PM2.5</span>
                  <span className="text-xs text-blue-600 font-medium">EPA</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {airQualityData.epaDetails.measurements.pm25.concentration?.toFixed(1)}
                  <span className="text-sm font-normal text-gray-600 ml-1">
                    {airQualityData.epaDetails.measurements.pm25.units?.split(' ')[0] || 'μg/m³'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-600">
                    AQI: {airQualityData.epaDetails.measurements.pm25.aqi || 'N/A'}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {airQualityData.epaDetails.measurements.pm25.date}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Method: {airQualityData.epaDetails.measurements.pm25.method?.split(' ')[0] || 'EPA Standard'}
                </div>
              </div>
            )}

            {airQualityData.epaDetails.measurements.pm10 && (
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">PM10</span>
                  <span className="text-xs text-blue-600 font-medium">EPA</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {airQualityData.epaDetails.measurements.pm10.concentration?.toFixed(1)}
                  <span className="text-sm font-normal text-gray-600 ml-1">
                    {airQualityData.epaDetails.measurements.pm10.units?.split(' ')[0] || 'μg/m³'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-600">
                    AQI: {airQualityData.epaDetails.measurements.pm10.aqi || 'N/A'}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {airQualityData.epaDetails.measurements.pm10.date}
                  </div>
                </div>
              </div>
            )}

            {airQualityData.epaDetails.measurements.ozone && (
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">Ozone</span>
                  <span className="text-xs text-blue-600 font-medium">EPA</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {airQualityData.epaDetails.measurements.ozone.concentration?.toFixed(3)}
                  <span className="text-sm font-normal text-gray-600 ml-1">
                    {airQualityData.epaDetails.measurements.ozone.units?.includes('ppm') ? 'ppm' : 'μg/m³'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-600">
                    AQI: {airQualityData.epaDetails.measurements.ozone.aqi || 'N/A'}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {airQualityData.epaDetails.measurements.ozone.date}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 text-xs text-blue-700">
            <strong>Data Quality:</strong> {airQualityData.epaDetails.dataQuality?.toUpperCase() || 'OFFICIAL'} - 
            Official EPA Air Quality System measurements from certified monitoring equipment
          </div>
        </div>
      )}

      {/* Data Sources & Metadata */}
      <div className="p-4 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div>
            <span className="font-medium">Sources: </span>
            {airQualityData.dataSources?.join(', ') || 'Multiple APIs'}
            {airQualityData.epaDetails && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                EPA VERIFIED
              </span>
            )}
          </div>
          <div>
            Updated: {new Date(airQualityData.timestamp).toLocaleTimeString()}
          </div>
        </div>
        {airQualityData.isMock && (
          <div className="mt-2 text-xs text-orange-600 font-medium">
            ⚠️ Demo data - Configure API keys for real-time data
          </div>
        )}
      </div>
    </div>
  );
};

export default AirQualityDetail;