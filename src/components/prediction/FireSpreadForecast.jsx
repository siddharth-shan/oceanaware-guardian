import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  AlertTriangle,
  TrendingUp,
  Navigation,
  Clock,
  Target
} from 'lucide-react';

/**
 * Visual Fire Spread Forecast Component
 * Shows 5-day fire spread predictions in a user-friendly format
 */
const FireSpreadForecast = ({ predictions, analytics }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!predictions || !predictions.predictions) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
        <h3 className="font-semibold text-yellow-800 mb-2">No Forecast Available</h3>
        <p className="text-yellow-700 text-sm">
          Fire spread predictions require active fire data and weather conditions.
        </p>
      </div>
    );
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'extreme': return 'bg-red-100 border-red-300 text-red-800';
      case 'very_high': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'high': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'moderate': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-green-100 border-green-300 text-green-800';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'extreme': return '🔥';
      case 'very_high': return '⚠️';
      case 'high': return '⚡';
      case 'moderate': return '👀';
      default: return '✅';
    }
  };

  const getRiskDescription = (riskLevel, riskScore) => {
    switch (riskLevel) {
      case 'extreme': return 'Extreme fire spread risk - Immediate action may be required';
      case 'very_high': return 'Very high fire spread risk - Monitor evacuation routes';
      case 'high': return 'High fire spread risk - Stay alert and prepared';
      case 'moderate': return 'Moderate fire spread risk - Normal precautions advised';
      default: return 'Low fire spread risk - Continue standard safety practices';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const dailyPredictions = predictions.predictions.slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <Target className="h-5 w-5 text-purple-600 mr-2" />
          5-Day Fire Spread Forecast
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Trend:</span>
          <div className="flex items-center space-x-1">
            <TrendingUp className={`h-4 w-4 ${
              predictions.summary.riskTrend === 'increasing' ? 'text-red-500' :
              predictions.summary.riskTrend === 'decreasing' ? 'text-green-500' : 'text-gray-500'
            }`} />
            <span className={`text-sm font-medium capitalize ${
              predictions.summary.riskTrend === 'increasing' ? 'text-red-600' :
              predictions.summary.riskTrend === 'decreasing' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {predictions.summary.riskTrend}
            </span>
          </div>
        </div>
      </div>

      {/* High-Level Summary for Public Users */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(predictions.summary.confidence * 100)}%
          </div>
          <div className="text-sm text-blue-800">Forecast Confidence</div>
          <div className="text-xs text-blue-600 mt-1">Model Accuracy</div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">
            {predictions.summary.highestRisk}
          </div>
          <div className="text-sm text-orange-800">Peak Risk Score</div>
          <div className="text-xs text-orange-600 mt-1">Next 5 Days</div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {analytics?.timeToRisk?.days || '--'}
          </div>
          <div className="text-sm text-purple-800">Days to High Risk</div>
          <div className="text-xs text-purple-600 mt-1">Estimated Timeline</div>
        </div>
      </div>

      {/* Daily Forecast Cards */}
      <div className="space-y-3 mb-6">
        {dailyPredictions.map((day, index) => {
          const isToday = index === 0;
          const riskColor = getRiskColor(day.riskLevel);
          
          return (
            <div key={day.day} className={`border-2 rounded-lg p-4 ${riskColor}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getRiskIcon(day.riskLevel)}</div>
                  <div>
                    <h4 className="font-semibold">
                      {isToday ? 'Today' : `Day ${day.day}`} - {formatDate(day.date)}
                    </h4>
                    <p className="text-sm opacity-80">
                      {getRiskDescription(day.riskLevel, day.riskScore)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">Risk: {day.riskScore}</div>
                  <div className="text-sm opacity-80 capitalize">
                    {day.riskLevel.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Simple Visual Indicators */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Navigation className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Direction</div>
                    <div className="opacity-80">{day.expectedSpreadDirection || 'Variable'}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Distance</div>
                    <div className="opacity-80">{day.expectedSpreadDistance || '--'} mi</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Spread Rate</div>
                    <div className="opacity-80">{Math.round(day.spreadProbability * 100) || '--'}%</div>
                  </div>
                </div>
              </div>

              {/* Key Recommendations for High Risk Days */}
              {(day.riskLevel === 'extreme' || day.riskLevel === 'very_high') && (
                <div className="mt-3 p-3 bg-white/50 rounded-lg">
                  <h5 className="font-medium mb-2">⚠️ Key Recommendations:</h5>
                  <ul className="text-sm space-y-1">
                    {day.riskLevel === 'extreme' && (
                      <>
                        <li>• Prepare for potential evacuation orders</li>
                        <li>• Monitor emergency communications continuously</li>
                        <li>• Avoid all outdoor burning activities</li>
                      </>
                    )}
                    {day.riskLevel === 'very_high' && (
                      <>
                        <li>• Stay alert for evacuation notices</li>
                        <li>• Review emergency plans and supplies</li>
                        <li>• Monitor local fire restrictions</li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Critical Information for High Risk Periods */}
      {analytics?.evacuationWindow && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Evacuation Planning Window
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-red-600 font-medium">Time Remaining:</span>
              <div className="font-bold text-red-800">{analytics.evacuationWindow.hoursRemaining} hours</div>
            </div>
            <div>
              <span className="text-red-600 font-medium">Urgency Level:</span>
              <div className="font-bold text-red-800 capitalize">{analytics.evacuationWindow.urgency}</div>
            </div>
            <div>
              <span className="text-red-600 font-medium">Action:</span>
              <div className="font-bold text-red-800">{analytics.evacuationWindow.recommendation}</div>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Technical Details */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="flex items-center justify-between w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="font-medium text-gray-800">Technical Details & Scientific Data</span>
          {showTechnicalDetails ? (
            <ChevronUp className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="mt-4 space-y-4">
            {/* Model Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-3">Model Information</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Version:</span>
                  <div className="font-medium">{predictions.metadata?.modelVersion || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Data Quality:</span>
                  <div className="font-medium capitalize">{predictions.metadata?.dataQuality || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Generated:</span>
                  <div className="font-medium">
                    {predictions.metadata?.predictionTime ? 
                      new Date(predictions.metadata.predictionTime).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Primary Factors:</span>
                  <div className="font-medium">
                    {predictions.summary?.primaryFactors?.join(', ') || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Daily Data */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-3">Detailed Predictions</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left p-2">Day</th>
                      <th className="text-left p-2">Risk Score</th>
                      <th className="text-left p-2">Spread Probability</th>
                      <th className="text-left p-2">New Ignition Risk</th>
                      <th className="text-left p-2">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyPredictions.map((day) => (
                      <tr key={day.day} className="border-b border-gray-200">
                        <td className="p-2">{formatDate(day.date)}</td>
                        <td className="p-2 font-medium">{day.riskScore}/100</td>
                        <td className="p-2">{Math.round(day.spreadProbability * 100)}%</td>
                        <td className="p-2">{Math.round(day.newIgnitionRisk * 100)}%</td>
                        <td className="p-2">{Math.round(day.conditions?.confidence * 100) || '--'}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Limitations */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h5 className="font-semibold text-yellow-800 mb-2">Important Limitations</h5>
              <p className="text-sm text-yellow-700">
                {predictions.metadata?.limitationsNote || 
                 'These predictions are based on current conditions and historical patterns. Actual fire behavior may vary due to local factors, weather changes, and firefighting efforts. Always follow official emergency guidance.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FireSpreadForecast;