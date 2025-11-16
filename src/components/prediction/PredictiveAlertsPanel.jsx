import { useState, useEffect } from 'react';
import { AlertTriangle, Brain, TrendingUp, Clock, Target, Zap, BarChart3, Lightbulb } from 'lucide-react';
import predictiveAlertsService from '../../services/predictiveAlertsService';
import { useAccessibility } from '../accessibility/AccessibilityProvider';

/**
 * Predictive Alerts Panel - Machine Learning Powered Fire Risk Predictions
 */
const PredictiveAlertsPanel = ({ userLocation, currentFireData, weatherData }) => {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('immediate');
  const [showInsights, setShowInsights] = useState(false);
  const { speak, translate } = useAccessibility();

  useEffect(() => {
    if (userLocation) {
      loadPredictions();
    }
  }, [userLocation]);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      const results = await predictiveAlertsService.generatePredictions(userLocation, 72); // 72 hours
      setPredictions(results);
      
      // Announce critical predictions
      if (results.immediate?.overallRiskLevel === 'extreme' || results.immediate?.overallRiskLevel === 'high') {
        speak(translate('prediction.high-risk-alert', 
          `High wildfire risk predicted. Check recommendations immediately.`), { emergency: true });
      }
      
    } catch (error) {
      console.error('Failed to load predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'extreme': return 'text-red-700 bg-red-100 border-red-300';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'moderate': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-green-700 bg-green-100 border-green-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'extreme': return '🚨';
      case 'high': return '⚠️';
      case 'moderate': return '⚡';
      case 'low': return '✅';
      default: return '❓';
    }
  };

  const formatConfidence = (confidence) => {
    return `${Math.round(confidence * 100)}%`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
          <h2 className="text-xl font-bold text-gray-800">
            {translate('prediction.title', 'AI Predictive Alerts')}
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            {translate('prediction.analyzing', 'Analyzing patterns and generating predictions...')}
          </span>
        </div>
      </div>
    );
  }

  if (!predictions) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          {translate('prediction.unavailable', 'Predictive analysis unavailable')}
        </div>
      </div>
    );
  }

  const currentPrediction = predictions[selectedTimeframe];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">
            {translate('prediction.title', 'AI Predictive Alerts')}
          </h2>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
            ML v{predictions.metadata?.modelVersion}
          </span>
        </div>
        <button
          onClick={() => setShowInsights(!showInsights)}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Lightbulb className="w-4 h-4" />
          <span>{showInsights ? 'Hide' : 'Show'} Insights</span>
        </button>
      </div>

      {/* Timeframe Selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'immediate', label: 'Next 3 Hours', icon: <Zap className="w-4 h-4" /> },
          { id: 'shortTerm', label: '24 Hours', icon: <Clock className="w-4 h-4" /> },
          { id: 'mediumTerm', label: '7 Days', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'personalized', label: 'Personal Risk', icon: <Target className="w-4 h-4" /> }
        ].map(timeframe => (
          <button
            key={timeframe.id}
            onClick={() => setSelectedTimeframe(timeframe.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTimeframe === timeframe.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {timeframe.icon}
            <span>{timeframe.label}</span>
          </button>
        ))}
      </div>

      {/* Main Prediction Display */}
      {currentPrediction && (
        <div className="space-y-4">
          {/* Risk Level Card */}
          <div className={`rounded-lg border-2 p-4 ${getRiskColor(currentPrediction.overallRiskLevel || currentPrediction.personalizedRiskLevel)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {getRiskIcon(currentPrediction.overallRiskLevel || currentPrediction.personalizedRiskLevel)}
                </span>
                <div>
                  <h3 className="text-lg font-bold capitalize">
                    {currentPrediction.overallRiskLevel || currentPrediction.personalizedRiskLevel} Risk
                  </h3>
                  <p className="text-sm opacity-80">
                    {selectedTimeframe === 'immediate' && 'Next 3 hours'}
                    {selectedTimeframe === 'shortTerm' && 'Next 24 hours'}
                    {selectedTimeframe === 'mediumTerm' && 'Next 7 days'}
                    {selectedTimeframe === 'personalized' && 'Personalized assessment'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {Math.round((currentPrediction.fireRiskScore || currentPrediction.personalizedRiskScore || 0.5) * 100)}
                </div>
                <div className="text-xs opacity-80">Risk Score</div>
                {currentPrediction.confidence && (
                  <div className="text-xs mt-1">
                    {formatConfidence(currentPrediction.confidence)} confidence
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {currentPrediction.recommendations && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-bold text-blue-800 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                {translate('prediction.recommendations', 'AI Recommendations')}
              </h4>
              <ul className="space-y-2">
                {currentPrediction.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2 text-blue-700">
                    <span className="text-blue-600 mt-1 text-sm">•</span>
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Short-term Hourly Chart */}
          {selectedTimeframe === 'shortTerm' && currentPrediction.hourlyPredictions && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Hourly Risk Trend
              </h4>
              <div className="grid grid-cols-8 gap-2">
                {currentPrediction.hourlyPredictions.slice(0, 8).map((hour, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-600 mb-1">
                      {new Date(hour.time).getHours()}:00
                    </div>
                    <div 
                      className={`h-16 rounded flex items-end justify-center text-xs font-bold ${
                        getRiskColor(hour.riskLevel).split(' ')[1]
                      }`}
                    >
                      <div 
                        className={`w-full rounded text-center py-1 ${getRiskColor(hour.riskLevel)}`}
                        style={{ height: `${Math.max(20, hour.riskScore * 100)}%` }}
                      >
                        {Math.round(hour.riskScore * 100)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {currentPrediction.summary && (
                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-medium">Peak Risk:</span> {Math.round(currentPrediction.summary.maxRisk * 100)}% • 
                  <span className="font-medium"> Average:</span> {Math.round(currentPrediction.summary.averageRisk * 100)}% • 
                  <span className="font-medium"> High Risk Hours:</span> {currentPrediction.summary.highRiskHours}
                </div>
              )}
            </div>
          )}

          {/* Personalized Insights */}
          {selectedTimeframe === 'personalized' && currentPrediction.userProfile && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-bold text-purple-800 mb-3 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Your Personal Risk Profile
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-purple-700">Sensitivity Level</div>
                  <div className="text-purple-800 capitalize">{currentPrediction.userProfile.sensitivityLevel}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-purple-700">Experience Level</div>
                  <div className="text-purple-800 capitalize">{currentPrediction.userProfile.experienceLevel}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-purple-700">Area Familiarity</div>
                  <div className="text-purple-800">{Math.round(currentPrediction.userProfile.locationFamiliarity * 100)}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-purple-700">Preparedness</div>
                  <div className="text-purple-800">{Math.round(currentPrediction.userProfile.preparednessLevel * 100)}%</div>
                </div>
              </div>
              
              {currentPrediction.learningInsights && (
                <div className="mt-3 space-y-1">
                  {currentPrediction.learningInsights.map((insight, index) => (
                    <div key={index} className="text-sm text-purple-700">
                      💡 {insight}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Weather Factors */}
          {currentPrediction.weatherFactors && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-bold text-yellow-800 mb-3">Current Conditions Impact</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-yellow-600 font-medium">Temperature</div>
                  <div className="text-yellow-800 font-bold">
                    {Math.round(currentPrediction.weatherFactors.temperature)}°C
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-600 font-medium">Humidity</div>
                  <div className="text-yellow-800 font-bold">
                    {Math.round(currentPrediction.weatherFactors.humidity)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-600 font-medium">Wind Speed</div>
                  <div className="text-yellow-800 font-bold">
                    {Math.round(currentPrediction.weatherFactors.windSpeed)} km/h
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-600 font-medium">Direction</div>
                  <div className="text-yellow-800 font-bold">
                    {Math.round(currentPrediction.weatherFactors.windDirection)}°
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ML Insights Panel */}
          {showInsights && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                Machine Learning Insights
              </h4>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Model Version:</span> {predictions.metadata?.modelVersion}
                </div>
                <div>
                  <span className="font-medium">Data Confidence:</span> {formatConfidence(predictions.metadata?.dataConfidence || 0.8)}
                </div>
                <div>
                  <span className="font-medium">Generated:</span> {new Date(predictions.metadata?.generatedAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Prediction Factors:</span> Weather patterns, historical data, seasonal trends, user behavior
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Predictions improve over time as the AI learns from real-world outcomes and user interactions.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center pt-2 border-t border-gray-200">
        <button
          onClick={loadPredictions}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Brain className="w-4 h-4" />
          <span>{loading ? 'Updating...' : 'Refresh Predictions'}</span>
        </button>
      </div>
    </div>
  );
};

export default PredictiveAlertsPanel;