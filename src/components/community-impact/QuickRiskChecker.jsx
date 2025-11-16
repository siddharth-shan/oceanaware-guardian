import React, { useState } from 'react';
import { 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ExternalLink,
  Phone
} from 'lucide-react';

/**
 * Quick Risk Checker Component
 * 
 * Simplified, immediate risk assessment inspired by Congressional winner
 * Provides instant value without complex navigation
 */
const QuickRiskChecker = ({ predictions, onDetailedView }) => {
  const [selectedCounty, setSelectedCounty] = useState(null);

  const getRiskColor = (riskIndex) => {
    if (riskIndex >= 75) return 'bg-red-500';
    if (riskIndex >= 45) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getRiskMessage = (riskIndex, riskLevel) => {
    if (riskIndex >= 75) {
      return {
        title: 'High Risk - Take Action Now',
        message: 'Your community has elevated wildfire risk. Review evacuation plans and emergency supplies.',
        actions: ['Create evacuation plan', 'Prepare emergency kit', 'Monitor fire alerts'],
        urgency: 'immediate'
      };
    }
    if (riskIndex >= 45) {
      return {
        title: 'Medium Risk - Stay Prepared',
        message: 'Your community has moderate wildfire risk. Stay informed and maintain readiness.',
        actions: ['Review fire safety', 'Check emergency contacts', 'Monitor conditions'],
        urgency: 'moderate'
      };
    }
    return {
      title: 'Low Risk - Stay Informed',
      message: 'Your community currently has low wildfire risk. Continue monitoring seasonal changes.',
      actions: ['Seasonal awareness', 'Community preparedness', 'Resource planning'],
      urgency: 'low'
    };
  };

  if (!selectedCounty) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 text-blue-600 mr-2" />
          Quick Risk Assessment
        </h3>
        <p className="text-gray-600 mb-4">
          Select a county from the list below to get immediate risk assessment and recommendations.
        </p>
        
        <div className="grid gap-2 max-h-64 overflow-y-auto">
          {predictions.slice(0, 10).map((county) => (
            <button
              key={county.fips}
              onClick={() => setSelectedCounty(county)}
              className="text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{county.county} County</div>
                  <div className="text-sm text-gray-500">
                    Population: {county.population?.toLocaleString() || 'N/A'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getRiskColor(county.communityRiskIndex)}`}></div>
                  <span className="text-sm font-medium">{county.communityRiskIndex}/100</span>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <button 
          onClick={onDetailedView}
          className="mt-4 w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View all counties on map →
        </button>
      </div>
    );
  }

  const riskInfo = getRiskMessage(selectedCounty.communityRiskIndex, selectedCounty.riskLevel);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* County Header */}
      <div className={`p-4 ${
        riskInfo.urgency === 'immediate' ? 'bg-red-50 border-b border-red-200' :
        riskInfo.urgency === 'moderate' ? 'bg-orange-50 border-b border-orange-200' :
        'bg-green-50 border-b border-green-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedCounty.county} County
          </h3>
          <button
            onClick={() => setSelectedCounty(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        {/* Risk Score Display */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full ${getRiskColor(selectedCounty.communityRiskIndex)}`}></div>
            <span className="text-2xl font-bold text-gray-900">{selectedCounty.communityRiskIndex}</span>
            <span className="text-gray-600">/ 100</span>
          </div>
          <div className="text-sm text-gray-600">
            Risk Index | {Math.round(selectedCounty.confidence * 100)}% Confidence
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="p-4">
        <div className={`flex items-start space-x-3 p-4 rounded-lg ${
          riskInfo.urgency === 'immediate' ? 'bg-red-50' :
          riskInfo.urgency === 'moderate' ? 'bg-orange-50' :
          'bg-green-50'
        }`}>
          {riskInfo.urgency === 'immediate' ? (
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          ) : riskInfo.urgency === 'moderate' ? (
            <Info className="h-5 w-5 text-orange-600 mt-0.5" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          )}
          <div>
            <h4 className={`font-medium mb-1 ${
              riskInfo.urgency === 'immediate' ? 'text-red-800' :
              riskInfo.urgency === 'moderate' ? 'text-orange-800' :
              'text-green-800'
            }`}>
              {riskInfo.title}
            </h4>
            <p className={`text-sm ${
              riskInfo.urgency === 'immediate' ? 'text-red-700' :
              riskInfo.urgency === 'moderate' ? 'text-orange-700' :
              'text-green-700'
            }`}>
              {riskInfo.message}
            </p>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="mt-4">
          <h5 className="font-medium text-gray-900 mb-2">Recommended Actions</h5>
          <div className="space-y-2">
            {riskInfo.actions.map((action, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        {riskInfo.urgency === 'immediate' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2 flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              Emergency Resources
            </h5>
            <div className="space-y-1 text-sm">
              <div>Emergency: <span className="font-medium">911</span></div>
              <div>Fire Info: <span className="font-medium">1-877-424-4075</span></div>
              <div>Evacuation Updates: <span className="font-medium">Local Emergency Services</span></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          <button 
            onClick={onDetailedView}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Detailed Analysis
            <ExternalLink className="h-4 w-4 ml-2" />
          </button>
          <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Share Risk Assessment
          </button>
        </div>

        {/* Data Attribution */}
        <div className="mt-4 pt-3 border-t text-xs text-gray-500">
          Risk assessment based on CDC Social Vulnerability Index, NASA fire data, and weather conditions.
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default QuickRiskChecker;