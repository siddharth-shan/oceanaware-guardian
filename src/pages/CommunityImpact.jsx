import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  Shield, 
  Users, 
  MapPin,
  BarChart3,
  Download,
  Eye,
  EyeOff,
  Filter,
  Info,
  Target,
  Brain,
  Activity
} from 'lucide-react';

import { CommunityImpactService } from '../services/api/communityImpactService';
import { useFireData } from '../hooks/useFireData';
import { WeatherService } from '../services/api/weatherService';
import RiskClassificationMap from '../components/community-impact/RiskClassificationMap';
import TrendAnalysisCharts from '../components/community-impact/TrendAnalysisCharts';
import StakeholderDashboard from '../components/community-impact/StakeholderDashboard';
import ActionableInsights from '../components/community-impact/ActionableInsights';
import DataTransparencyMatrix from '../components/community-impact/DataTransparencyMatrix';
import CommunityRiskHero from '../components/community-impact/CommunityRiskHero';

/**
 * Community Impact Page
 * 
 * AI-driven analysis combining 22-year social vulnerability trends with 
 * real-time wildfire risk data to provide actionable insights for multiple stakeholders.
 * 
 * Features:
 * - Interactive risk classification map
 * - Multi-year trend analysis
 * - Stakeholder-specific dashboards
 * - Actionable recommendations
 * - Downloadable reports
 */
const CommunityImpact = ({ userLocation }) => {
  // Services
  const [impactService] = useState(() => new CommunityImpactService());
  const [weatherService] = useState(() => new WeatherService());
  
  // Data state
  const [predictions, setPredictions] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI state
  const [selectedStakeholder, setSelectedStakeholder] = useState('overview');
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [showLegend, setShowLegend] = useState(true);
  const [riskLevelFilter, setRiskLevelFilter] = useState('all');
  const [showRealTimeFires, setShowRealTimeFires] = useState(false);
  
  // Get real-time fire data
  const { fires, loading: fireLoading, error: fireError } = useFireData(userLocation, {
    radius: 300, // Cover all of California
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  });

  // Debug fire data
  useEffect(() => {
    console.log('🔥 Community Impact fire data:', {
      userLocation,
      fires,
      fireLoading,
      fireError,
      showRealTimeFires,
      fireCount: fires?.length || 0
    });
  }, [fires, fireLoading, fireError, showRealTimeFires, userLocation]);

  // Load community impact predictions
  useEffect(() => {
    const loadPredictions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get weather data for California center
        const lat = userLocation?.lat || 36.7783;
        const lng = userLocation?.lng || -119.4179;
        
        let weather;
        try {
          weather = await weatherService.getCurrentWeather(lat, lng);
        } catch (weatherError) {
          console.warn('Weather service failed, using fallback data:', weatherError);
          weather = {
            temperature: 75,
            humidity: 30,
            windSpeed: 10,
            fireWeatherIndex: 'MEDIUM'
          };
        }
        setWeatherData(weather);
        
        // Get fire data in the correct format
        const fireData = { fires: fires || [] };
        
        // Get predictions for all counties
        const countyPredictions = await impactService.getPredictionsForAllCounties(fireData, weather);
        setPredictions(countyPredictions);
        
        // Enhanced error reporting for data quality
        if (countyPredictions.length === 0) {
          setError('No county predictions could be generated. All data sources are currently unavailable.');
        } else {
          // Check data quality and report issues
          const lowConfidencePredictions = countyPredictions.filter(p => p.confidence < 0.70);
          const insufficientDataCounties = countyPredictions.filter(p => 
            !p.trends || !p.trends.yearlyData || p.trends.yearlyData.length < 3
          );
          
          if (lowConfidencePredictions.length > countyPredictions.length * 0.5) {
            console.warn(`⚠️ DATA QUALITY ALERT: ${lowConfidencePredictions.length} of ${countyPredictions.length} counties have confidence below 70%`);
          }
          
          if (insufficientDataCounties.length > 0) {
            console.warn(`⚠️ INSUFFICIENT DATA: ${insufficientDataCounties.length} counties have less than 3 years of historical data`);
          }
          
          // Report overall confidence statistics
          const avgConfidence = countyPredictions.reduce((sum, p) => sum + p.confidence, 0) / countyPredictions.length;
          console.log(`✅ Analysis complete: ${countyPredictions.length} counties analyzed with average confidence of ${Math.round(avgConfidence * 100)}%`);
        }
        
      } catch (err) {
        console.error('Failed to load community impact predictions:', err);
        setError(`Analysis failed: ${err.message}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };

    if (!fireLoading && fires !== null) {
      loadPredictions();
    }
  }, [fires, fireLoading, impactService, weatherService, userLocation]);

  // Filter predictions based on selected risk level
  const filteredPredictions = useMemo(() => {
    if (riskLevelFilter === 'all') {
      return predictions;
    }
    return predictions.filter(pred => pred.riskLevel.level === riskLevelFilter);
  }, [predictions, riskLevelFilter]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (predictions.length === 0) return null;
    
    const highRisk = predictions.filter(p => p.riskLevel.level === 'HIGH').length;
    const mediumRisk = predictions.filter(p => p.riskLevel.level === 'MEDIUM').length;
    const lowRisk = predictions.filter(p => p.riskLevel.level === 'LOW').length;
    const totalPopulation = predictions.reduce((sum, p) => sum + (p.population || 0), 0);
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    
    // Calculate actual years of data available
    const dataYears = predictions.length > 0 ? predictions[0].trends?.yearlyData?.length || 0 : 0;
    
    // Calculate average Community Risk Index
    const avgCommunityRiskIndex = predictions.length > 0 
      ? Math.round(predictions.reduce((sum, p) => sum + (p.communityRiskIndex || 0), 0) / predictions.length)
      : 0;
    
    // Find user's county population if available
    let displayPopulation = totalPopulation;
    let populationLabel = 'Total Population';
    
    if (selectedCounty) {
      const selectedPrediction = predictions.find(p => p.fips === selectedCounty);
      if (selectedPrediction?.population) {
        displayPopulation = selectedPrediction.population;
        populationLabel = `${selectedPrediction.county} Population`;
      }
    } else if (userLocation && userLocation.zipCode) {
      // Try to find county based on user location
      // This is a simplified approach - in production you'd use a zip-to-county lookup
      const userCounty = predictions.find(p => 
        Math.abs(p.coordinates?.lat - userLocation.lat) < 0.5 && 
        Math.abs(p.coordinates?.lng - userLocation.lng) < 0.5
      );
      if (userCounty?.population) {
        displayPopulation = userCounty.population;
        populationLabel = `${userCounty.county} Population`;
      }
    }
    
    return {
      totalCounties: predictions.length,
      highRisk,
      mediumRisk,
      lowRisk,
      totalPopulation,
      displayPopulation,
      populationLabel,
      avgConfidence: Math.round(avgConfidence * 100),
      avgCommunityRiskIndex,
      dataYears
    };
  }, [predictions, selectedCounty, userLocation]);

  // Stakeholder options
  const stakeholderOptions = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'firefighters', label: 'Firefighters', icon: Shield },
    { id: 'policymakers', label: 'Policymakers', icon: Users },
    { id: 'nonprofits', label: 'Nonprofits', icon: Target },
    { id: 'public', label: 'Public', icon: Eye }
  ];

  // Risk level filter options
  const riskFilterOptions = [
    { value: 'all', label: 'All Risk Levels' },
    { value: 'HIGH', label: 'High Risk Only' },
    { value: 'MEDIUM', label: 'Medium Risk Only' },
    { value: 'LOW', label: 'Low Risk Only' }
  ];

  // Handler functions for hero section buttons
  const handleExploreMap = () => {
    // Scroll to map section
    const mapSection = document.querySelector('[data-section="risk-map"]');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleViewFires = () => {
    setShowRealTimeFires(true);
    // Scroll to map section to show fires
    const mapSection = document.querySelector('[data-section="risk-map"]');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Export report functionality
  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      reportType: 'Community Impact Analysis',
      stakeholderView: selectedStakeholder,
      riskFilter: riskLevelFilter,
      summaryStats: summaryStats,
      predictions: filteredPredictions.map(pred => ({
        county: pred.county,
        fips: pred.fips,
        population: pred.population,
        riskLevel: pred.riskLevel.level,
        riskScore: pred.riskScore,
        confidence: Math.round(pred.confidence * 100),
        features: pred.features,
        trends: pred.trends,
        insights: pred.insights,
        recommendations: pred.recommendations
      })),
      weatherData: weatherData,
      dataSource: 'EcoQuest Wildfire Watch - Community Impact Analysis',
      methodology: 'AI-driven analysis combining multi-year social vulnerability trends with real-time wildfire risk data',
      confidenceNote: 'Confidence levels based on data quality and completeness across multiple data sources'
    };

    // Create downloadable JSON file
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `community_impact_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  if (loading || fireLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Community Impact Analysis</h3>
          <p className="text-gray-600">Processing AI predictions and 22-year vulnerability trends...</p>
        </div>
      </div>
    );
  }

  if (error || fireError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Error</h3>
          <p className="text-gray-600 mb-4">{error || fireError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <CommunityRiskHero 
        predictions={predictions}
        selectedCounty={selectedCounty}
        onCountySelect={setSelectedCounty}
        onExploreMap={handleExploreMap}
        onViewFires={handleViewFires}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Brain className="h-8 w-8 text-blue-600 mr-3" />
                  Community Impact Analysis
                </h1>
                <p className="text-gray-600 mt-2">
                  AI-driven wildfire risk assessment combining {summaryStats?.dataYears || 3} years of recent social vulnerability data (2018-2022)
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Activity className="h-4 w-4 mr-1" />
                  Real-time data
                </div>
                <button 
                  onClick={exportReport}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </button>
              </div>
            </div>

            {/* Summary Statistics */}
            {summaryStats && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{summaryStats.avgCommunityRiskIndex}</div>
                  <div className="text-sm text-blue-600">Avg Risk Index</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{summaryStats.totalCounties}</div>
                  <div className="text-sm text-gray-600">Counties Analyzed</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{summaryStats.highRisk}</div>
                  <div className="text-sm text-red-600">High Risk</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{summaryStats.mediumRisk}</div>
                  <div className="text-sm text-orange-600">Medium Risk</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{summaryStats.lowRisk}</div>
                  <div className="text-sm text-green-600">Low Risk</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{summaryStats.avgConfidence}%</div>
                  <div className="text-sm text-blue-600">Avg Confidence</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {summaryStats.displayPopulation >= 1000000 
                      ? (summaryStats.displayPopulation / 1000000).toFixed(1) + 'M'
                      : summaryStats.displayPopulation >= 1000
                        ? (summaryStats.displayPopulation / 1000).toFixed(0) + 'K'
                        : summaryStats.displayPopulation?.toLocaleString() || 'N/A'
                    }
                  </div>
                  <div className="text-sm text-purple-600">{summaryStats.populationLabel}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Stakeholder selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex rounded-md border border-gray-300">
                {stakeholderOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedStakeholder(option.id)}
                      className={`px-3 py-2 text-sm font-medium flex items-center first:rounded-l-md last:rounded-r-md ${
                        selectedStakeholder === option.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Risk level filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={riskLevelFilter}
                onChange={(e) => setRiskLevelFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {riskFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Real-time fires toggle */}
            <button
              onClick={() => setShowRealTimeFires(!showRealTimeFires)}
              className={`flex items-center px-3 py-2 text-sm border rounded-md transition-colors ${
                showRealTimeFires 
                  ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Activity className="h-4 w-4 mr-2" />
              {showRealTimeFires ? 'Hide' : 'Show'} Fires
            </button>

            {/* Legend toggle */}
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {showLegend ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Legend
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Row - Map and Quick Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Map Section */}
          <div className="lg:col-span-3" data-section="risk-map">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                  Community Impact Risk Map
                  {showRealTimeFires && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      Live Fires
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  AI-predicted risk levels based on vulnerability trends and fire conditions
                  {showRealTimeFires && ' • Real-time fire locations from NASA FIRMS'}
                </p>
              </div>
              <div className="p-4">
                <RiskClassificationMap
                  predictions={filteredPredictions}
                  selectedCounty={selectedCounty}
                  onCountySelect={setSelectedCounty}
                  showLegend={showLegend}
                  userLocation={userLocation}
                  showRealTimeFires={showRealTimeFires}
                  fireData={fires}
                />
              </div>
            </div>
          </div>

          {/* Quick Insights Panel */}
          <div className="lg:col-span-1">
            <StakeholderDashboard
              stakeholder={selectedStakeholder}
              predictions={filteredPredictions}
              selectedCounty={selectedCounty}
              weatherData={weatherData}
            />
          </div>
        </div>

        {/* Second Row - Actionable Insights and Trend Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ActionableInsights
            predictions={filteredPredictions}
            selectedCounty={selectedCounty}
            stakeholder={selectedStakeholder}
          />

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                Recent Vulnerability Trends
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Key patterns from 2018-2022 analysis
              </p>
            </div>
            <div className="p-4">
              <TrendAnalysisCharts
                predictions={filteredPredictions}
                selectedCounty={selectedCounty}
              />
            </div>
          </div>
        </div>

        {/* Data Transparency Matrix */}
        <DataTransparencyMatrix
          predictions={filteredPredictions}
          selectedCounty={selectedCounty}
          weatherData={weatherData}
          fireData={{ fires: fires || [] }}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <Info className="h-4 w-4 mr-1" />
              Data sources: CDC/ATSDR SVI (2018-2022), NASA FIRMS, OpenWeather
            </div>
            <div>
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityImpact;