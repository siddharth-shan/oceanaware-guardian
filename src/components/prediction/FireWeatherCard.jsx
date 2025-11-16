import { useState } from 'react';
import { 
  Wind, 
  Thermometer, 
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

/**
 * Consolidated Fire Weather Card
 * Groups all fire weather related metrics and forecasts into one organized card
 */
const FireWeatherCard = ({ 
  currentWeather, 
  fireWeatherIndices, 
  forecastAnalysis,
  currentFireDanger 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!currentWeather && !fireWeatherIndices && !forecastAnalysis) {
    return null;
  }

  const getRedFlagStatus = () => {
    if (currentFireDanger?.redFlagActive) {
      return {
        active: true,
        severity: 'critical',
        text: 'Red Flag Warning Active',
        color: 'text-red-600 bg-red-50 border-red-200'
      };
    }
    if (currentFireDanger?.fireWeather?.some(fw => fw.dangerLevel === 'critical')) {
      return {
        active: true,
        severity: 'high',
        text: 'Critical Fire Weather',
        color: 'text-orange-600 bg-orange-50 border-orange-200'
      };
    }
    if (currentFireDanger?.fireWeather?.some(fw => fw.dangerLevel === 'high')) {
      return {
        active: true,
        severity: 'moderate',
        text: 'High Fire Weather',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
      };
    }
    return {
      active: false,
      severity: 'low',
      text: 'Normal Fire Weather',
      color: 'text-green-600 bg-green-50 border-green-200'
    };
  };

  const redFlagStatus = getRedFlagStatus();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <Wind className="h-5 w-5 text-blue-600 mr-2" />
          Fire Weather Conditions
        </h3>
        
        {/* Red Flag Warning Status */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${redFlagStatus.color}`}>
          {redFlagStatus.text}
        </div>
      </div>

      {/* Current Weather Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Current Conditions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
            <Eye className="h-4 w-4 text-gray-600 mr-2" />
            Current Conditions
          </h4>
          
          {currentWeather ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Thermometer className="h-5 w-5 text-red-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-800">{currentWeather.temperature}°F</div>
                <div className="text-xs text-gray-600">Temperature</div>
              </div>
              <div className="text-center">
                <Droplets className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-800">{currentWeather.humidity}%</div>
                <div className="text-xs text-gray-600">Humidity</div>
              </div>
              <div className="text-center">
                <Wind className="h-5 w-5 text-gray-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-800">{currentWeather.windSpeed} mph</div>
                <div className="text-xs text-gray-600">Wind Speed</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              Weather data unavailable
            </div>
          )}
        </div>

        {/* Fire Weather Indices */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
            <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
            Fire Weather Indices
          </h4>
          
          {fireWeatherIndices?.indices ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-lg font-bold text-gray-800">
                  {fireWeatherIndices.indices.hainesIndex?.value || '--'}
                </div>
                <div className="text-xs text-gray-600">Haines Index</div>
                <div className="text-xs text-gray-500 capitalize">
                  {fireWeatherIndices.indices.hainesIndex?.category || 'N/A'}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-lg font-bold text-gray-800">
                  {fireWeatherIndices.indices.fireWeatherIndex?.value || '--'}
                </div>
                <div className="text-xs text-gray-600">Fire Weather Index</div>
                <div className="text-xs text-gray-500 capitalize">
                  {fireWeatherIndices.indices.fireWeatherIndex?.category || 'N/A'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              Indices calculation in progress...
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Forecast Summary */}
      {forecastAnalysis && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
              7-Day Fire Danger Forecast
            </h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showDetails ? 'Less Details' : 'More Details'}
              {showDetails ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </button>
          </div>

          {/* Quick Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-blue-600">{forecastAnalysis.avgTemperature}°F</div>
              <div className="text-xs text-blue-800">Avg Temp</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-green-600">{forecastAnalysis.avgHumidity}%</div>
              <div className="text-xs text-green-800">Avg Humidity</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-yellow-600">{forecastAnalysis.dangerDays}</div>
              <div className="text-xs text-yellow-800">High Danger Days</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-red-600">{forecastAnalysis.criticalDays}</div>
              <div className="text-xs text-red-800">Critical Days</div>
            </div>
          </div>

          {/* Trend Indicator */}
          <div className="flex items-center justify-center mb-4">
            <span className="text-sm text-gray-600 mr-2">Danger Trend:</span>
            <div className="flex items-center space-x-2">
              {forecastAnalysis.trend === 'increasing' && (
                <>
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600 font-medium">Increasing Risk</span>
                </>
              )}
              {forecastAnalysis.trend === 'decreasing' && (
                <>
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">Decreasing Risk</span>
                </>
              )}
              {forecastAnalysis.trend === 'stable' && (
                <>
                  <Minus className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 font-medium">Stable Conditions</span>
                </>
              )}
            </div>
          </div>

          {/* Detailed Forecast (Expandable) */}
          {showDetails && forecastAnalysis.worstDay && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h5 className="font-semibold text-red-800 mb-3">Highest Risk Day Details</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-red-600">Day:</span>
                  <div className="font-bold">{forecastAnalysis.worstDay.name}</div>
                </div>
                <div>
                  <span className="text-red-600">Danger Level:</span>
                  <div className="font-bold capitalize">{forecastAnalysis.worstDay.fireDangerLevel?.replace('_', ' ') || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-red-600">Temperature:</span>
                  <div className="font-bold">{forecastAnalysis.worstDay.temperature}°F</div>
                </div>
                <div>
                  <span className="text-red-600">Wind:</span>
                  <div className="font-bold">{forecastAnalysis.worstDay.windSpeed} mph</div>
                </div>
              </div>
              
              {/* Additional recommendations for high risk day */}
              <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                <h6 className="font-medium text-red-800 mb-2">Recommendations for High Risk Day:</h6>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Avoid all outdoor burning and spark-producing activities</li>
                  <li>• Monitor local fire weather warnings and restrictions</li>
                  <li>• Ensure emergency supplies and evacuation plans are ready</li>
                  <li>• Stay informed through official emergency channels</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FireWeatherCard;