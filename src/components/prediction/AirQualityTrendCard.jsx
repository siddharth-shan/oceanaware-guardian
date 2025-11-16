import { useState } from 'react';
import { 
  Wind, 
  TrendingUp, 
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

/**
 * Enhanced Air Quality Card with Trend Visualization and Health Indicators
 * Provides clear good/bad indicators and trend data for public users
 */
const AirQualityTrendCard = ({ 
  airQualityData, 
  airQualityAnalytics, 
  loading, 
  error 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading air quality data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!airQualityData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Info className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-yellow-700 text-sm">Loading air quality sensors in your area...</span>
          </div>
        </div>
      </div>
    );
  }

  // Helper functions for AQI interpretation
  const getAQIStatus = (aqi) => {
    if (aqi <= 50) return { 
      status: 'good', 
      icon: CheckCircle, 
      color: 'text-green-600', 
      bg: 'bg-green-50', 
      border: 'border-green-200',
      message: 'Air quality is good. Great for outdoor activities!' 
    };
    if (aqi <= 100) return { 
      status: 'moderate', 
      icon: Info, 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50', 
      border: 'border-yellow-200',
      message: 'Air quality is acceptable for most people.' 
    };
    if (aqi <= 150) return { 
      status: 'unhealthy-sensitive', 
      icon: AlertTriangle, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50', 
      border: 'border-orange-200',
      message: 'Sensitive individuals should limit outdoor activities.' 
    };
    if (aqi <= 200) return { 
      status: 'unhealthy', 
      icon: XCircle, 
      color: 'text-red-600', 
      bg: 'bg-red-50', 
      border: 'border-red-200',
      message: 'Everyone should limit outdoor activities.' 
    };
    return { 
      status: 'hazardous', 
      icon: XCircle, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50', 
      border: 'border-purple-200',
      message: 'Health alert! Avoid outdoor activities.' 
    };
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingDown className="h-4 w-4 text-green-500" />;
    if (trend === 'worsening') return <TrendingUp className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (trend) => {
    if (trend === 'improving') return 'text-green-600';
    if (trend === 'worsening') return 'text-red-600';
    return 'text-gray-600';
  };

  const getHealthRecommendations = (aqi, smokeDetected) => {
    const recommendations = [];
    
    if (aqi > 150) {
      recommendations.push('❌ Avoid outdoor exercise and activities');
      recommendations.push('🏠 Keep windows and doors closed');
      recommendations.push('😷 Wear N95 masks when outdoors');
    } else if (aqi > 100) {
      recommendations.push('⚠️ Limit prolonged outdoor activities');
      recommendations.push('👶 Children and elderly should stay indoors');
      recommendations.push('🏃‍♂️ Reduce outdoor exercise intensity');
    } else if (aqi > 50) {
      recommendations.push('👀 Monitor air quality if you have respiratory issues');
      recommendations.push('🌬️ Consider reducing outdoor time if sensitive');
    } else {
      recommendations.push('✅ Great for all outdoor activities');
      recommendations.push('🌳 Perfect for exercise and recreation');
    }

    if (smokeDetected) {
      recommendations.unshift('🔥 Wildfire smoke detected - extra precautions needed');
    }

    return recommendations;
  };

  const aqiStatus = getAQIStatus(airQualityData.summary.aqi);
  const StatusIcon = aqiStatus.icon;
  
  // Create trend data for visualization
  const trendData = airQualityAnalytics?.hourlyTrend || [
    { hour: '6 AM', aqi: airQualityData.summary.aqi - 10 },
    { hour: '9 AM', aqi: airQualityData.summary.aqi - 5 },
    { hour: '12 PM', aqi: airQualityData.summary.aqi },
    { hour: '3 PM', aqi: airQualityData.summary.aqi + 5 },
    { hour: 'Now', aqi: airQualityData.summary.aqi }
  ];

  const trend = airQualityAnalytics?.trend || 'stable';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <Wind className="h-5 w-5 text-blue-600 mr-2" />
          Air Quality Monitor
        </h3>
        <div className="flex items-center space-x-2">
          {getTrendIcon(trend)}
          <span className={`text-sm font-medium capitalize ${getTrendColor(trend)}`}>
            {trend}
          </span>
        </div>
      </div>

      {/* Current Status - Large and Clear */}
      <div className={`${aqiStatus.bg} ${aqiStatus.border} border-2 rounded-lg p-6 mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <StatusIcon className={`h-8 w-8 ${aqiStatus.color}`} />
            <div>
              <h4 className={`text-lg font-bold ${aqiStatus.color}`}>
                {aqiStatus.status === 'good' ? 'Good Air Quality' :
                 aqiStatus.status === 'moderate' ? 'Moderate Air Quality' :
                 aqiStatus.status === 'unhealthy-sensitive' ? 'Unhealthy for Sensitive Groups' :
                 aqiStatus.status === 'unhealthy' ? 'Unhealthy Air Quality' :
                 'Hazardous Air Quality'}
              </h4>
              <p className={`text-sm ${aqiStatus.color} opacity-80`}>
                {aqiStatus.message}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${aqiStatus.color}`}>
              {airQualityData.summary.aqi}
            </div>
            <div className="text-sm text-gray-600">AQI</div>
          </div>
        </div>

        {/* Quick Health Recommendations */}
        <div className="space-y-2">
          <h5 className={`font-semibold ${aqiStatus.color} mb-2`}>Today's Recommendations:</h5>
          {getHealthRecommendations(airQualityData.summary.aqi, airQualityData.smokeDetection?.detected).slice(0, 2).map((rec, index) => (
            <div key={index} className={`text-sm ${aqiStatus.color} opacity-90`}>
              {rec}
            </div>
          ))}
        </div>
      </div>

      {/* Simple Trend Visualization */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
          <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
          24-Hour Trend
        </h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-end justify-between h-24 space-x-2">
            {trendData.map((point, index) => {
              const height = Math.max(10, (point.aqi / 200) * 80);
              const color = point.aqi <= 50 ? 'bg-green-400' :
                           point.aqi <= 100 ? 'bg-yellow-400' :
                           point.aqi <= 150 ? 'bg-orange-400' : 'bg-red-400';
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="text-xs font-medium text-gray-700 mb-1">
                    {point.aqi}
                  </div>
                  <div 
                    className={`w-full ${color} rounded-t transition-all duration-300`}
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    {point.hour}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-gray-500 text-center mt-2">
            Green = Good (0-50) • Yellow = Moderate (51-100) • Orange = Unhealthy for Sensitive (101-150) • Red = Unhealthy (151+)
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-gray-800">{airQualityData.summary.pm25}</div>
          <div className="text-xs text-gray-600">PM2.5 (μg/m³)</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-blue-600">{airQualityData.metadata?.totalSensors || '--'}</div>
          <div className="text-xs text-blue-600">Active Sensors</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-green-600">{airQualityAnalytics?.dataFreshness || '--'}%</div>
          <div className="text-xs text-green-600">Data Freshness</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-purple-600">{airQualityData.summary.aqiCategory || 'N/A'}</div>
          <div className="text-xs text-purple-600">Category</div>
        </div>
      </div>

      {/* Wildfire Smoke Alert */}
      {airQualityData.smokeDetection?.detected && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <h4 className="font-semibold text-orange-800">🔥 Wildfire Smoke Detected</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-orange-600">Intensity:</span>
              <div className="font-bold capitalize">{airQualityData.smokeDetection.intensity}</div>
            </div>
            <div>
              <span className="text-orange-600">Confidence:</span>
              <div className="font-bold">{Math.round(airQualityData.smokeDetection.probability * 100)}%</div>
            </div>
            <div>
              <span className="text-orange-600">Source:</span>
              <div className="font-bold capitalize">{airQualityData.smokeDetection.source}</div>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Details */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="font-medium text-gray-800">Detailed Health Information & All Recommendations</span>
          {showDetails ? (
            <ChevronUp className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {showDetails && (
          <div className="mt-4 space-y-4">
            {/* All Health Recommendations */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h5 className="font-semibold text-blue-800 mb-3">Complete Health Recommendations</h5>
              <div className="space-y-2">
                {getHealthRecommendations(airQualityData.summary.aqi, airQualityData.smokeDetection?.detected).map((rec, index) => (
                  <div key={index} className="text-sm text-blue-700">
                    {rec}
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Data */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-3">Technical Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">PM2.5:</span>
                  <div className="font-medium">{airQualityData.summary.pm25} μg/m³</div>
                </div>
                <div>
                  <span className="text-gray-600">PM10:</span>
                  <div className="font-medium">{airQualityData.summary.pm10 || '--'} μg/m³</div>
                </div>
                <div>
                  <span className="text-gray-600">Sensors in Range:</span>
                  <div className="font-medium">{airQualityData.metadata?.totalSensors || '--'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Search Radius:</span>
                  <div className="font-medium">{airQualityData.metadata?.radius || '--'} km</div>
                </div>
              </div>
            </div>

            {/* About Air Quality Index */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h5 className="font-semibold text-yellow-800 mb-2">Understanding AQI</h5>
              <div className="text-sm text-yellow-700 space-y-1">
                <div>• 0-50: Good (Green) - Safe for everyone</div>
                <div>• 51-100: Moderate (Yellow) - Acceptable for most people</div>
                <div>• 101-150: Unhealthy for Sensitive Groups (Orange)</div>
                <div>• 151-200: Unhealthy (Red) - Health effects for everyone</div>
                <div>• 201+: Very Unhealthy/Hazardous (Purple/Maroon)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AirQualityTrendCard;