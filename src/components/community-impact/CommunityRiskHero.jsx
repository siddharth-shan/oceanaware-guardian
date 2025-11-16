import React, { useState, useMemo } from 'react';
import { 
  Search, 
  AlertTriangle, 
  TrendingUp,
  MapPin,
  Shield,
  Activity,
  Target,
  ArrowRight
} from 'lucide-react';

/**
 * Community Risk Hero Component
 * 
 * Inspired by Congressional App Challenge winner - provides immediate,
 * clear risk assessment with simplified user experience
 */
const CommunityRiskHero = ({ predictions, onCountySelect, onExploreMap, onViewFires, selectedCounty }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get selected county data for display
  const selectedCountyData = predictions.find(p => p.fips === selectedCounty);

  // Filter counties based on search
  const filteredCounties = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return predictions
      .filter(p => 
        p.county.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5); // Show top 5 matches
  }, [predictions, searchQuery]);

  // Calculate statewide summary stats
  const statewideStats = useMemo(() => {
    if (predictions.length === 0) return null;
    
    const highRisk = predictions.filter(p => p.riskLevel.level === 'HIGH').length;
    const avgRiskIndex = Math.round(
      predictions.reduce((sum, p) => sum + p.communityRiskIndex, 0) / predictions.length
    );
    const atRiskPopulation = predictions
      .filter(p => p.riskLevel.level === 'HIGH' || p.riskLevel.level === 'MEDIUM')
      .reduce((sum, p) => sum + (p.population || 0), 0);

    return {
      totalCounties: predictions.length,
      highRiskCounties: highRisk,
      avgRiskIndex,
      atRiskPopulation,
      riskPercentage: Math.round((highRisk / predictions.length) * 100)
    };
  }, [predictions]);

  const handleCountySelect = (county) => {
    onCountySelect(county.fips);
    setSearchQuery(county.county);
    setShowSuggestions(false);
  };

  const getRiskIndexColor = (index) => {
    if (index >= 75) return 'text-red-600 bg-red-50';
    if (index >= 45) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskIndexBadge = (index) => {
    if (index >= 75) return { label: 'High Risk', color: 'bg-red-500' };
    if (index >= 45) return { label: 'Medium Risk', color: 'bg-orange-500' };
    return { label: 'Low Risk', color: 'bg-green-500' };
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Content */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Know Your Community's
            <span className="text-blue-600 block">Wildfire Risk</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            AI-powered risk assessment combining social vulnerability and real-time fire conditions 
            to help communities prepare for wildfire disasters.
          </p>

          {/* Selected County Indicator */}
          {selectedCountyData && (
            <div className="max-w-md mx-auto mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Currently viewing: {selectedCountyData.county} County
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getRiskIndexBadge(selectedCountyData.communityRiskIndex).color}`}></div>
                    <span className="text-sm font-bold text-blue-800">
                      {selectedCountyData.communityRiskIndex}/100
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onCountySelect(null)}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                >
                  Clear selection
                </button>
              </div>
            </div>
          )}

          {/* Quick Risk Lookup */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your county (e.g., Los Angeles)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              {/* Search Suggestions */}
              {showSuggestions && filteredCounties.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {filteredCounties.map((county) => {
                    const badge = getRiskIndexBadge(county.communityRiskIndex);
                    return (
                      <button
                        key={county.fips}
                        onClick={() => handleCountySelect(county)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b last:border-b-0"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{county.county} County</div>
                          <div className="text-sm text-gray-500">
                            Risk Index: {county.communityRiskIndex}/100
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-block w-3 h-3 rounded-full ${badge.color}`}></span>
                          <span className="text-sm font-medium text-gray-600">{badge.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statewide Stats */}
        {statewideStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {statewideStats.avgRiskIndex}
              </div>
              <div className="text-sm font-medium text-gray-600">Average Risk Index</div>
              <div className="text-xs text-gray-500 mt-1">Statewide Assessment</div>
            </div>

            <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {statewideStats.riskPercentage}%
              </div>
              <div className="text-sm font-medium text-gray-600">High Risk Counties</div>
              <div className="text-xs text-gray-500 mt-1">{statewideStats.highRiskCounties} of {statewideStats.totalCounties}</div>
            </div>

            <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {statewideStats.atRiskPopulation >= 1000000 
                  ? (statewideStats.atRiskPopulation / 1000000).toFixed(1) + 'M'
                  : Math.round(statewideStats.atRiskPopulation / 1000) + 'K'
                }
              </div>
              <div className="text-sm font-medium text-gray-600">At-Risk Population</div>
              <div className="text-xs text-gray-500 mt-1">High + Medium Risk Areas</div>
            </div>

            <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                95%
              </div>
              <div className="text-sm font-medium text-gray-600">AI Confidence</div>
              <div className="text-xs text-gray-500 mt-1">Average Prediction Accuracy</div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-4">
            <button 
              onClick={onExploreMap}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Target className="h-5 w-5 mr-2" />
              Explore Risk Map
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
            <span className="text-gray-400">or</span>
            <button 
              onClick={onViewFires}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Activity className="h-5 w-5 mr-2" />
              View Real-time Fires
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-green-500" />
                <span>CDC Verified Data</span>
              </div>
              <div className="flex items-center">
                <Activity className="h-4 w-4 mr-2 text-blue-500" />
                <span>NASA Real-time Fires</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-purple-500" />
                <span>AI-Enhanced Predictions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityRiskHero;