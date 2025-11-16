import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  AlertTriangle,
  Activity
} from 'lucide-react';

/**
 * Trend Analysis Charts Component
 * 
 * Visualizes 22-year vulnerability trends and patterns for selected counties
 * or statewide analysis
 */
const TrendAnalysisCharts = ({ predictions, selectedCounty }) => {
  // Get selected county prediction with trend data
  const selectedPrediction = useMemo(() => {
    if (!selectedCounty) return null;
    return predictions.find(p => p.fips === selectedCounty);
  }, [selectedCounty, predictions]);

  // Calculate statewide trend statistics
  const statewideStats = useMemo(() => {
    if (predictions.length === 0) return null;

    const trends = {
      worsening: predictions.filter(p => p.trends.vulnerabilityTrend === 'worsening').length,
      improving: predictions.filter(p => p.trends.vulnerabilityTrend === 'improving').length,
      stable: predictions.filter(p => p.trends.vulnerabilityTrend === 'stable').length
    };

    const avgVulnerability = predictions.reduce((sum, p) => 
      sum + p.trends.historicalAverage, 0) / predictions.length;

    const riskDistribution = {
      high: predictions.filter(p => p.riskLevel.level === 'HIGH').length,
      medium: predictions.filter(p => p.riskLevel.level === 'MEDIUM').length,
      low: predictions.filter(p => p.riskLevel.level === 'LOW').length
    };

    return {
      trends,
      avgVulnerability: Math.round(avgVulnerability),
      riskDistribution,
      totalCounties: predictions.length
    };
  }, [predictions]);

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'worsening':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get trend color
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'worsening':
        return 'text-red-600 bg-red-50';
      case 'improving':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Render individual county analysis
  const renderCountyAnalysis = () => {
    if (!selectedPrediction) return null;

    return (
      <div className="space-y-6">
        {/* County Header */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {selectedPrediction.county} County Analysis
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Current Risk Level</span>
              <div className="font-semibold mt-1" style={{ color: selectedPrediction.riskLevel.color }}>
                {selectedPrediction.riskLevel.label}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Risk Score</span>
              <div className="font-semibold mt-1">{selectedPrediction.riskScore.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-gray-600">22-Year Trend</span>
              <div className={`font-semibold mt-1 flex items-center ${getTrendColor(selectedPrediction.trends.vulnerabilityTrend).split(' ')[0]}`}>
                {getTrendIcon(selectedPrediction.trends.vulnerabilityTrend)}
                <span className="ml-1 capitalize">{selectedPrediction.trends.vulnerabilityTrend}</span>
              </div>
            </div>
            <div>
              <span className="text-gray-600">Confidence</span>
              <div className="font-semibold mt-1">{Math.round(selectedPrediction.confidence * 100)}%</div>
            </div>
          </div>
        </div>

        {/* Feature Breakdown */}
        <div>
          <h5 className="font-medium text-gray-900 mb-3">Risk Factor Breakdown</h5>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-red-600 mr-2" />
                <span className="font-medium text-red-800">Fire Activity</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-red-800">
                  {Math.round(selectedPrediction.features.fireActivity.contribution * 100)}%
                </div>
                <div className="text-xs text-red-600">
                  Score: {selectedPrediction.features.fireActivity.score.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-orange-600 mr-2" />
                <span className="font-medium text-orange-800">Weather Conditions</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-orange-800">
                  {Math.round(selectedPrediction.features.weather.contribution * 100)}%
                </div>
                <div className="text-xs text-orange-600">
                  Score: {selectedPrediction.features.weather.score.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
                <span className="font-medium text-purple-800">Social Vulnerability</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-purple-800">
                  {Math.round(selectedPrediction.features.vulnerability.contribution * 100)}%
                </div>
                <div className="text-xs text-purple-600">
                  Score: {selectedPrediction.features.vulnerability.score.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Details */}
        <div>
          <h5 className="font-medium text-gray-900 mb-3">Vulnerability Trend Details</h5>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Historical Average Vulnerability</span>
                <div className="font-semibold mt-1">{selectedPrediction.trends.historicalAverage}/100</div>
              </div>
              <div>
                <span className="text-gray-600">Recent Trend Direction</span>
                <div className="font-semibold mt-1 capitalize">{selectedPrediction.trends.recentTrend}</div>
              </div>
            </div>
            
            {/* Insights */}
            <div className="mt-4 pt-4 border-t">
              <h6 className="font-medium text-gray-900 mb-2">Key Insights</h6>
              <div className="space-y-2">
                {selectedPrediction.insights.map((insight, index) => (
                  <div key={index} className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{insight.title}</div>
                      <div className="text-gray-600">{insight.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render statewide analysis
  const renderStatewideAnalysis = () => {
    if (!statewideStats) return null;

    return (
      <div className="space-y-6">
        {/* Statewide Overview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            California Statewide Analysis (58 Counties) - Recent CDC SVI Data (3 Years: 2018, 2020, 2022)
          </h4>
          
          {/* Trend Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-medium text-red-800">Worsening Trends</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {statewideStats.trends.worsening}
                </div>
              </div>
              <div className="text-sm text-red-600 mt-1">
                {Math.round((statewideStats.trends.worsening / statewideStats.totalCounties) * 100)}% of counties
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingDown className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">Improving Trends</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {statewideStats.trends.improving}
                </div>
              </div>
              <div className="text-sm text-green-600 mt-1">
                {Math.round((statewideStats.trends.improving / statewideStats.totalCounties) * 100)}% of counties
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Minus className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="font-medium text-gray-800">Stable Trends</span>
                </div>
                <div className="text-2xl font-bold text-gray-600">
                  {statewideStats.trends.stable}
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {Math.round((statewideStats.trends.stable / statewideStats.totalCounties) * 100)}% of counties
              </div>
            </div>
          </div>

          {/* Risk Distribution */}
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Current Risk Distribution</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-red-800">High Risk</span>
                  <span className="text-xl font-bold text-red-600">
                    {statewideStats.riskDistribution.high}
                  </span>
                </div>
                <div className="text-sm text-red-600">
                  {Math.round((statewideStats.riskDistribution.high / statewideStats.totalCounties) * 100)}%
                </div>
              </div>

              <div className="bg-orange-100 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-orange-800">Medium Risk</span>
                  <span className="text-xl font-bold text-orange-600">
                    {statewideStats.riskDistribution.medium}
                  </span>
                </div>
                <div className="text-sm text-orange-600">
                  {Math.round((statewideStats.riskDistribution.medium / statewideStats.totalCounties) * 100)}%
                </div>
              </div>

              <div className="bg-green-100 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-800">Low Risk</span>
                  <span className="text-xl font-bold text-green-600">
                    {statewideStats.riskDistribution.low}
                  </span>
                </div>
                <div className="text-sm text-green-600">
                  {Math.round((statewideStats.riskDistribution.low / statewideStats.totalCounties) * 100)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Findings */}
        <div>
          <h5 className="font-medium text-gray-900 mb-3">Key Statewide Findings</h5>
          <div className="space-y-3">
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800">Vulnerability Trends</span>
              </div>
              <div className="text-sm text-yellow-700">
                {statewideStats.trends.worsening} counties show worsening vulnerability trends over the recent 3-point analysis (2018-2022),
                indicating increasing community risk factors.
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-center mb-2">
                <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">Average Vulnerability</span>
              </div>
              <div className="text-sm text-blue-700">
                Statewide average vulnerability score is {statewideStats.avgVulnerability}/100,
                based on recent analysis using 3 data points from CDC Social Vulnerability Index (2018, 2020, 2022).
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
              <div className="flex items-center mb-2">
                <Activity className="h-5 w-5 text-purple-600 mr-2" />
                <span className="font-medium text-purple-800">High-Risk Communities</span>
              </div>
              <div className="text-sm text-purple-700">
                {statewideStats.riskDistribution.high + statewideStats.riskDistribution.medium} counties
                ({Math.round(((statewideStats.riskDistribution.high + statewideStats.riskDistribution.medium) / statewideStats.totalCounties) * 100)}%)
                require immediate or elevated attention for wildfire impact preparedness.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {selectedCounty ? renderCountyAnalysis() : renderStatewideAnalysis()}
    </div>
  );
};

export default TrendAnalysisCharts;