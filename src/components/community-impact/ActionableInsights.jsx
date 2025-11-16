import React, { useMemo } from 'react';
import { 
  Lightbulb, 
  Target, 
  AlertTriangle,
  Shield,
  Users,
  Eye,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  ExternalLink
} from 'lucide-react';

/**
 * Actionable Insights Component
 * 
 * Generates and displays AI-driven recommendations and actionable insights
 * based on community impact predictions and stakeholder context
 */
const ActionableInsights = ({ predictions, selectedCounty, stakeholder }) => {
  // Get selected county prediction
  const selectedPrediction = useMemo(() => {
    if (!selectedCounty) return null;
    return predictions.find(p => p.fips === selectedCounty);
  }, [selectedCounty, predictions]);

  // Generate contextual insights based on current data
  const contextualInsights = useMemo(() => {
    const insights = [];
    
    // High-risk county insights
    const highRiskCounties = predictions.filter(p => p.riskLevel.level === 'HIGH');
    if (highRiskCounties.length > 0) {
      insights.push({
        type: 'urgent',
        icon: AlertTriangle,
        title: 'Immediate Attention Required',
        description: `${highRiskCounties.length} counties are classified as high community impact risk.`,
        action: 'Review high-risk counties and implement immediate preparedness measures.',
        priority: 'high',
        counties: highRiskCounties.slice(0, 3).map(c => c.county).join(', ')
      });
    }

    // Worsening trend insights
    const worseningCounties = predictions.filter(p => p.trends.vulnerabilityTrend === 'worsening');
    if (worseningCounties.length > 0) {
      insights.push({
        type: 'trend',
        icon: TrendingUp,
        title: 'Worsening Vulnerability Trends',
        description: `${worseningCounties.length} counties show increasing vulnerability over 22 years.`,
        action: 'Investigate root causes and implement long-term mitigation strategies.',
        priority: 'medium',
        counties: worseningCounties.slice(0, 3).map(c => c.county).join(', ')
      });
    }

    // Low confidence insights
    const lowConfidenceCounties = predictions.filter(p => p.confidence < 0.7);
    if (lowConfidenceCounties.length > 0) {
      insights.push({
        type: 'data',
        icon: Target,
        title: 'Data Quality Enhancement Needed',
        description: `${lowConfidenceCounties.length} counties have prediction confidence below 70%.`,
        action: 'Improve data collection and monitoring systems for better predictions.',
        priority: 'low',
        counties: lowConfidenceCounties.slice(0, 3).map(c => c.county).join(', ')
      });
    }

    return insights;
  }, [predictions]);

  // Get stakeholder-specific recommendations
  const stakeholderRecommendations = useMemo(() => {
    if (!selectedPrediction) return [];
    
    return selectedPrediction.recommendations.filter(rec => 
      stakeholder === 'overview' || rec.target === stakeholder
    );
  }, [selectedPrediction, stakeholder]);

  // Get insight icon color
  const getInsightIconColor = (type) => {
    switch (type) {
      case 'urgent':
        return 'text-red-600';
      case 'trend':
        return 'text-orange-600';
      case 'data':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-orange-100 text-orange-800',
      low: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[priority]}`}>
        {priority?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
          Actionable Insights
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          AI-generated recommendations and insights
        </p>
      </div>
      
      <div className="p-3 space-y-4">
        {/* Contextual Insights */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
          <div className="space-y-2">
            {contextualInsights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 mr-2 ${getInsightIconColor(insight.type)}`} />
                      <span className="font-medium text-gray-900">{insight.title}</span>
                    </div>
                    {getPriorityBadge(insight.priority)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {insight.description}
                  </p>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Target className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm font-medium text-gray-700">Recommended Action</span>
                    </div>
                    <p className="text-sm text-gray-600">{insight.action}</p>
                    {insight.counties && (
                      <p className="text-xs text-gray-500 mt-1">
                        Priority counties: {insight.counties}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected County Recommendations */}
        {selectedPrediction && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Recommendations for {selectedPrediction.county}
            </h4>
            
            {/* County Risk Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Current Risk Assessment</span>
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: selectedPrediction.riskLevel.color }}></span>
                  <span className="font-medium" style={{ color: selectedPrediction.riskLevel.color }}>
                    {selectedPrediction.riskLevel.label}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Risk Score</span>
                  <div className="font-medium">{selectedPrediction.riskScore.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Confidence</span>
                  <div className="font-medium">{Math.round(selectedPrediction.confidence * 100)}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Trend</span>
                  <div className="font-medium capitalize">{selectedPrediction.trends.vulnerabilityTrend}</div>
                </div>
                <div>
                  <span className="text-gray-600">Vulnerability</span>
                  <div className="font-medium">{selectedPrediction.trends.historicalAverage}/100</div>
                </div>
              </div>
            </div>

            {/* Stakeholder Recommendations */}
            {stakeholderRecommendations.length > 0 ? (
              <div className="space-y-3">
                {stakeholderRecommendations.map((rec, index) => {
                  const targetIcons = {
                    firefighters: Shield,
                    policymakers: Users,
                    nonprofits: Target,
                    community: Eye
                  };
                  const TargetIcon = targetIcons[rec.target] || CheckCircle;
                  
                  return (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <TargetIcon className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="font-medium text-gray-900">{rec.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {rec.priority && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize
                              ${rec.priority === 'immediate' ? 'bg-red-100 text-red-800' :
                                rec.priority === 'strategic' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'}`}>
                              {rec.priority}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 capitalize">
                            {rec.target}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{rec.description}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">
                  No specific recommendations at this time. 
                  Continue monitoring conditions.
                </p>
              </div>
            )}
          </div>
        )}

        {/* General Preparedness Actions */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">General Preparedness Actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Immediate Actions</h5>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Monitor fire weather conditions</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Review evacuation plans</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Check emergency supply kits</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Verify alert system registration</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Long-term Planning</h5>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-blue-500 mr-2" />
                  <span>Develop community partnerships</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-blue-500 mr-2" />
                  <span>Invest in infrastructure hardening</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-blue-500 mr-2" />
                  <span>Enhance vulnerable population support</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-blue-500 mr-2" />
                  <span>Improve data collection systems</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Resources */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Resources & Tools</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Download className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">Export Detailed Report</span>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </button>
            
            <button className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Target className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">Share with Stakeholders</span>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionableInsights;