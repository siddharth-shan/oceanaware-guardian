import React, { useMemo } from 'react';
import { 
  Shield, 
  Users, 
  Target, 
  Eye, 
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  MapPin,
  Thermometer,
  Wind,
  Droplets,
  BarChart3
} from 'lucide-react';

/**
 * Stakeholder Dashboard Component
 * 
 * Provides tailored views and insights for different stakeholder types:
 * - Firefighters: Resource deployment and tactical priorities
 * - Policymakers: Strategic planning and resource allocation
 * - Nonprofits: Community support and vulnerability targeting
 * - Public: Personal risk awareness and preparedness
 */
const StakeholderDashboard = ({ 
  stakeholder, 
  predictions, 
  selectedCounty, 
  weatherData 
}) => {
  // Get selected county prediction
  const selectedPrediction = useMemo(() => {
    if (!selectedCounty) return null;
    return predictions.find(p => p.fips === selectedCounty);
  }, [selectedCounty, predictions]);

  // Calculate stakeholder-specific metrics
  const stakeholderMetrics = useMemo(() => {
    const highRisk = predictions.filter(p => p.riskLevel.level === 'HIGH');
    const mediumRisk = predictions.filter(p => p.riskLevel.level === 'MEDIUM');
    const worseningTrend = predictions.filter(p => p.trends.vulnerabilityTrend === 'worsening');
    
    return {
      highRiskCount: highRisk.length,
      mediumRiskCount: mediumRisk.length,
      worseningTrendCount: worseningTrend.length,
      topRiskCounties: [...predictions]
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5),
      avgConfidence: predictions.length > 0 
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length 
        : 0
    };
  }, [predictions]);

  // Render overview dashboard
  const renderOverviewDashboard = () => (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-3 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
          Statewide Overview
        </h3>
      </div>
      <div className="p-3 space-y-3">
        {/* Risk Distribution */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Risk Distribution</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">High Risk Counties</span>
              <span className="font-medium text-red-600">{stakeholderMetrics.highRiskCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Medium Risk Counties</span>
              <span className="font-medium text-orange-600">{stakeholderMetrics.mediumRiskCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Worsening Trends</span>
              <span className="font-medium text-purple-600">{stakeholderMetrics.worseningTrendCount}</span>
            </div>
          </div>
        </div>

        {/* Top Risk Counties */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Highest Risk Counties</h4>
          <div className="space-y-2">
            {stakeholderMetrics.topRiskCounties.map((county, index) => (
              <div key={county.fips} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {index + 1}. {county.county}
                </span>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: county.riskLevel.color }}></span>
                  <span className="font-medium">{county.riskScore.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Conditions */}
        {weatherData && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Current Conditions</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center">
                <Thermometer className="h-4 w-4 text-red-500 mr-2" />
                <span>{weatherData.temperature}°F</span>
              </div>
              <div className="flex items-center">
                <Droplets className="h-4 w-4 text-blue-500 mr-2" />
                <span>{weatherData.humidity}%</span>
              </div>
              <div className="flex items-center">
                <Wind className="h-4 w-4 text-gray-500 mr-2" />
                <span>{weatherData.windSpeed} mph</span>
              </div>
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-yellow-500 mr-2" />
                <span>{weatherData.fireWeatherIndex || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render firefighter dashboard
  const renderFirefighterDashboard = () => (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-3 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Shield className="h-5 w-5 text-red-600 mr-2" />
          Firefighter Operations
        </h3>
      </div>
      <div className="p-3 space-y-3">
        {/* Priority Deployments */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Priority Deployments</h4>
          <div className="space-y-2">
            {stakeholderMetrics.topRiskCounties.slice(0, 3).map((county, index) => (
              <div key={county.fips} className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-red-800">{county.county}</span>
                  <span className="text-sm text-red-600">Priority {index + 1}</span>
                </div>
                <div className="text-sm text-red-700">
                  Risk Score: {county.riskScore.toFixed(2)} • 
                  Confidence: {Math.round(county.confidence * 100)}%
                </div>
                <div className="text-xs text-red-600 mt-1">
                  {county.recommendations
                    .filter(r => r.target === 'firefighters')
                    .map(r => r.title)
                    .join(', ') || 'Enhanced monitoring recommended'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tactical Considerations */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Tactical Considerations</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
              <span>{stakeholderMetrics.highRiskCount} counties require immediate attention</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-purple-500 mr-2" />
              <span>{stakeholderMetrics.worseningTrendCount} counties showing worsening vulnerability</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-blue-500 mr-2" />
              <span>Avg prediction confidence: {Math.round(stakeholderMetrics.avgConfidence * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Selected County Details */}
        {selectedPrediction && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Selected: {selectedPrediction.county}</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Risk Level:</span>
                  <span className="font-medium ml-2" style={{ color: selectedPrediction.riskLevel.color }}>
                    {selectedPrediction.riskLevel.label}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Fire Activity:</span>
                  <span className="font-medium ml-2">
                    {Math.round(selectedPrediction.features.fireActivity.contribution * 100)}%
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {selectedPrediction.recommendations
                  .filter(r => r.target === 'firefighters')
                  .map(r => r.description)
                  .join('. ') || 'Standard monitoring protocols recommended.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render policymaker dashboard
  const renderPolicymakerDashboard = () => (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-3 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="h-5 w-5 text-blue-600 mr-2" />
          Policy & Planning
        </h3>
      </div>
      <div className="p-3 space-y-3">
        {/* Resource Allocation */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Resource Allocation Priorities</h4>
          <div className="space-y-2">
            {stakeholderMetrics.topRiskCounties.slice(0, 3).map((county, index) => (
              <div key={county.fips} className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-blue-800">{county.county}</span>
                  <span className="text-sm text-blue-600">Funding Priority {index + 1}</span>
                </div>
                <div className="text-sm text-blue-700">
                  Vulnerability Trend: {county.trends.vulnerabilityTrend}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {county.recommendations
                    .filter(r => r.target === 'policymakers')
                    .map(r => r.title)
                    .join(', ') || 'Strategic planning recommended'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Insights */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Strategic Insights</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-red-500 mr-2" />
              <span>{stakeholderMetrics.worseningTrendCount} counties need long-term intervention</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-orange-500 mr-2" />
              <span>{stakeholderMetrics.highRiskCount + stakeholderMetrics.mediumRiskCount} counties require immediate policy attention</span>
            </div>
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-green-500 mr-2" />
              <span>Data-driven decisions supported by {Math.round(stakeholderMetrics.avgConfidence * 100)}% confidence</span>
            </div>
          </div>
        </div>

        {/* Selected County Policy Focus */}
        {selectedPrediction && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Policy Focus: {selectedPrediction.county}</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-600">Current Vulnerability:</span>
                  <span className="font-medium ml-2">{selectedPrediction.trends.historicalAverage}/100</span>
                </div>
                <div>
                  <span className="text-gray-600">22-Year Trend:</span>
                  <span className="font-medium ml-2">{selectedPrediction.trends.vulnerabilityTrend}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {selectedPrediction.recommendations
                  .filter(r => r.target === 'policymakers')
                  .map(r => r.description)
                  .join('. ') || 'Continued monitoring and strategic planning recommended.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render nonprofit dashboard
  const renderNonprofitDashboard = () => (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-3 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Target className="h-5 w-5 text-green-600 mr-2" />
          Community Support
        </h3>
      </div>
      <div className="p-3 space-y-3">
        {/* Vulnerable Communities */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Most Vulnerable Communities</h4>
          <div className="space-y-2">
            {stakeholderMetrics.topRiskCounties.slice(0, 3).map((county, index) => (
              <div key={county.fips} className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-green-800">{county.county}</span>
                  <span className="text-sm text-green-600">Support Priority {index + 1}</span>
                </div>
                <div className="text-sm text-green-700">
                  Social Vulnerability: {county.trends.historicalAverage}/100
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {county.recommendations
                    .filter(r => r.target === 'nonprofits')
                    .map(r => r.title)
                    .join(', ') || 'Community outreach recommended'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outreach Opportunities */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Outreach Opportunities</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-purple-500 mr-2" />
              <span>{stakeholderMetrics.highRiskCount} communities need immediate support</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-red-500 mr-2" />
              <span>{stakeholderMetrics.worseningTrendCount} communities showing increasing vulnerability</span>
            </div>
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-blue-500 mr-2" />
              <span>Preparedness programs needed across {predictions.length} counties</span>
            </div>
          </div>
        </div>

        {/* Selected Community */}
        {selectedPrediction && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Community: {selectedPrediction.county}</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-600">Risk Level:</span>
                  <span className="font-medium ml-2" style={{ color: selectedPrediction.riskLevel.color }}>
                    {selectedPrediction.riskLevel.label}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Vulnerability Score:</span>
                  <span className="font-medium ml-2">{selectedPrediction.features.vulnerability.score.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {selectedPrediction.recommendations
                  .filter(r => r.target === 'nonprofits')
                  .map(r => r.description)
                  .join('. ') || 'Community engagement and support programs recommended.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render public dashboard
  const renderPublicDashboard = () => (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-3 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Eye className="h-5 w-5 text-purple-600 mr-2" />
          Public Awareness
        </h3>
      </div>
      <div className="p-3 space-y-3">
        {/* Risk Awareness */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Know Your Risk</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
              <span>{stakeholderMetrics.highRiskCount} counties are at high risk</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-orange-500 mr-2" />
              <span>{stakeholderMetrics.worseningTrendCount} counties showing increasing vulnerability</span>
            </div>
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-blue-500 mr-2" />
              <span>Predictions based on recent data (2018-2022)</span>
            </div>
          </div>
        </div>

        {/* Preparedness Actions */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Preparedness Actions</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div>• Create a family evacuation plan</div>
            <div>• Prepare emergency supply kit</div>
            <div>• Sign up for emergency alerts</div>
            <div>• Know your evacuation routes</div>
            <div>• Create defensible space around your home</div>
          </div>
        </div>

        {/* Your Area */}
        {selectedPrediction && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Your Area: {selectedPrediction.county}</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: selectedPrediction.riskLevel.color }}></span>
                <span className="font-medium">{selectedPrediction.riskLevel.label}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Risk Score: {selectedPrediction.riskScore.toFixed(2)}/1.0</div>
                <div>Trend: {selectedPrediction.trends.vulnerabilityTrend}</div>
                <div>Prediction Confidence: {Math.round(selectedPrediction.confidence * 100)}%</div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {selectedPrediction.recommendations
                  .filter(r => r.target === 'community')
                  .map(r => r.description)
                  .join('. ') || 'Stay informed and be prepared.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render appropriate dashboard based on stakeholder
  switch (stakeholder) {
    case 'firefighters':
      return renderFirefighterDashboard();
    case 'policymakers':
      return renderPolicymakerDashboard();
    case 'nonprofits':
      return renderNonprofitDashboard();
    case 'public':
      return renderPublicDashboard();
    default:
      return renderOverviewDashboard();
  }
};

export default StakeholderDashboard;