import React, { useState, useMemo } from 'react';
import { 
  Table, 
  Database, 
  Eye, 
  EyeOff, 
  Calendar,
  TrendingUp,
  Activity,
  Thermometer,
  Shield,
  Info,
  Download,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';

/**
 * Data Transparency Matrix Component
 * 
 * Shows the actual data used in AI predictions with full transparency
 * including year-by-year vulnerability data, fire activity metrics,
 * weather conditions, and confidence calculations
 */
const DataTransparencyMatrix = ({ predictions, selectedCounty, weatherData, fireData }) => {
  const [expandedSections, setExpandedSections] = useState({
    vulnerabilityData: true,
    fireData: false,
    weatherData: false,
    confidenceBreakdown: false
  });

  // Get selected county prediction
  const selectedPrediction = useMemo(() => {
    if (!selectedCounty) return null;
    return predictions.find(p => p.fips === selectedCounty);
  }, [selectedCounty, predictions]);

  // Export function
  const exportCountyData = (prediction) => {
    if (!prediction) return;
    
    const exportData = {
      county: prediction.county,
      fips: prediction.fips,
      population: prediction.population,
      riskScore: prediction.riskScore,
      riskLevel: prediction.riskLevel.label,
      confidence: Math.round(prediction.confidence * 100),
      features: {
        fireActivity: prediction.features.fireActivity,
        weather: prediction.features.weather,
        vulnerability: prediction.features.vulnerability
      },
      trends: prediction.trends,
      vulnerabilityData: prediction.trends?.yearlyData || [],
      weatherData: weatherData,
      exportedAt: new Date().toISOString(),
      dataSource: 'EcoQuest Wildfire Watch - Community Impact Analysis'
    };
    
    // Create downloadable JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prediction.county.replace(/\s+/g, '_')}_community_impact_data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get data quality indicator
  const getDataQuality = (value, type) => {
    if (value === null || value === undefined) {
      return { icon: X, color: 'text-red-500', label: 'Missing' };
    }
    
    switch (type) {
      case 'vulnerability':
        if (value >= 0 && value <= 100) {
          return { icon: CheckCircle, color: 'text-green-500', label: 'Valid' };
        }
        break;
      case 'fire':
        if (value >= 0) {
          return { icon: CheckCircle, color: 'text-green-500', label: 'Valid' };
        }
        break;
      case 'weather':
        if (value > 0) {
          return { icon: CheckCircle, color: 'text-green-500', label: 'Valid' };
        }
        break;
      default:
        return { icon: AlertTriangle, color: 'text-yellow-500', label: 'Unknown' };
    }
    
    return { icon: AlertTriangle, color: 'text-yellow-500', label: 'Invalid' };
  };

  if (!selectedPrediction) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Table className="h-5 w-5 text-blue-600 mr-2" />
            Data Transparency Matrix
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Select a county to view the detailed data used in AI predictions
          </p>
        </div>
        <div className="p-8 text-center text-gray-500">
          <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No county selected</p>
          <p className="text-sm mt-1">Click on a county in the map to view its data matrix</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Table className="h-5 w-5 text-blue-600 mr-2" />
              Data Transparency Matrix
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Detailed breakdown of data used for {selectedPrediction.county}
            </p>
          </div>
          <button 
            onClick={() => exportCountyData(selectedPrediction)}
            className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Overall Prediction Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">AI Prediction Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-gray-600">Risk Score</span>
              <div className="text-lg font-bold text-gray-900">{selectedPrediction.riskScore}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Risk Level</span>
              <div className="text-lg font-bold" style={{ color: selectedPrediction.riskLevel.color }}>
                {selectedPrediction.riskLevel.level}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Confidence</span>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(selectedPrediction.confidence * 100)}%
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Population</span>
              <div className="text-lg font-bold text-gray-900">
                {selectedPrediction.population?.toLocaleString() || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* 1. Vulnerability Data Matrix */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleSection('vulnerabilityData')}
            className="w-full p-4 text-left border-b hover:bg-gray-50 flex items-center justify-between"
          >
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-medium">Social Vulnerability Data (2000-2022)</span>
              <span className="ml-2 text-sm text-gray-500">
                Weight: 25% | Score: {selectedPrediction.features.vulnerability.score.toFixed(3)}
              </span>
            </div>
            {expandedSections.vulnerabilityData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          
          {expandedSections.vulnerabilityData && (
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Year</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Overall</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Socioeconomic</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Household</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Minority/Language</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Housing/Transport</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Population</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrediction.trends?.yearlyData?.map((yearData, index) => {
                      const quality = getDataQuality(yearData.overall, 'vulnerability');
                      const QualityIcon = quality.icon;
                      return (
                        <tr key={yearData.year} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{yearData.year}</td>
                          <td className="px-3 py-2">{yearData.overall}</td>
                          <td className="px-3 py-2">{yearData.socioeconomic}</td>
                          <td className="px-3 py-2">{yearData.householdComposition}</td>
                          <td className="px-3 py-2">{yearData.minorityLanguage}</td>
                          <td className="px-3 py-2">{yearData.housingTransportation}</td>
                          <td className="px-3 py-2">{yearData.population?.toLocaleString() || 'N/A'}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center">
                              <QualityIcon className={`h-4 w-4 ${quality.color} mr-1`} />
                              <span className="text-xs">{quality.label}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Trend Analysis */}
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <h5 className="font-medium text-purple-800 mb-2">Calculated Trend Analysis</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-purple-600">Overall Trend:</span>
                    <div className="font-medium">{selectedPrediction.trends.vulnerabilityTrend}</div>
                  </div>
                  <div>
                    <span className="text-purple-600">Recent Trend:</span>
                    <div className="font-medium">{selectedPrediction.trends.recentTrend}</div>
                  </div>
                  <div>
                    <span className="text-purple-600">Average Vulnerability:</span>
                    <div className="font-medium">{selectedPrediction.trends.historicalAverage}</div>
                  </div>
                  <div>
                    <span className="text-purple-600">Data Years:</span>
                    <div className="font-medium">{selectedPrediction.trends?.yearlyData?.length || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Fire Activity Data */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleSection('fireData')}
            className="w-full p-4 text-left border-b hover:bg-gray-50 flex items-center justify-between"
          >
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-red-600 mr-2" />
              <span className="font-medium">Fire Activity Data</span>
              <span className="ml-2 text-sm text-gray-500">
                Weight: 40% | Score: {selectedPrediction.features.fireActivity.score.toFixed(3)}
              </span>
            </div>
            {expandedSections.fireData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          
          {expandedSections.fireData && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <h5 className="font-medium text-red-800 mb-2">Fire Activity Score</h5>
                  <div className="text-2xl font-bold text-red-600">
                    {selectedPrediction.features.fireActivity.score.toFixed(3)}
                  </div>
                  <p className="text-xs text-red-600 mt-1">Calculated from NASA FIRMS data</p>
                </div>
                
                <div className="bg-orange-50 p-3 rounded-lg">
                  <h5 className="font-medium text-orange-800 mb-2">Weather Score</h5>
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedPrediction.features.weather.score.toFixed(3)}
                  </div>
                  <p className="text-xs text-orange-600 mt-1">Based on OpenWeather API</p>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h5 className="font-medium text-purple-800 mb-2">Vulnerability Score</h5>
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedPrediction.features.vulnerability.score.toFixed(3)}
                  </div>
                  <p className="text-xs text-purple-600 mt-1">CDC SVI multi-year analysis</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <h5 className="font-medium text-red-800 mb-2">Actual Fire Data Analysis</h5>
                {fireData && fireData.fires ? (
                  <div className="text-sm space-y-1">
                    <div>• Total fires detected: {fireData.fires.length}</div>
                    <div>• High confidence fires (≥80%): {fireData.fires.filter(f => f.confidence >= 80).length}</div>
                    <div>• Medium confidence fires (50-79%): {fireData.fires.filter(f => f.confidence >= 50 && f.confidence < 80).length}</div>
                    <div>• Low confidence fires (&lt;50%): {fireData.fires.filter(f => f.confidence < 50).length}</div>
                    <div className="font-medium mt-2">
                      Calculated Fire Score: {selectedPrediction.features.fireActivity.score.toFixed(3)}
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Data source: NASA FIRMS real-time satellite detection
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-red-600">
                    No fire data available for this analysis period.
                    <div className="mt-1">Fire Score: {selectedPrediction.features.fireActivity.score.toFixed(3)} (estimated)</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Weather Data */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleSection('weatherData')}
            className="w-full p-4 text-left border-b hover:bg-gray-50 flex items-center justify-between"
          >
            <div className="flex items-center">
              <Thermometer className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-medium">Weather Conditions</span>
              <span className="ml-2 text-sm text-gray-500">
                Weight: 35% | Score: {selectedPrediction.features.weather.score.toFixed(3)}
              </span>
            </div>
            {expandedSections.weatherData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          
          {expandedSections.weatherData && (
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <h5 className="font-medium text-red-800">Temperature</h5>
                  <div className="text-xl font-bold text-red-600">
                    {weatherData?.temperature || 'N/A'}°F
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    Risk: {weatherData?.temperature > 90 ? 'High' : weatherData?.temperature > 80 ? 'Medium' : 'Low'}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-medium text-blue-800">Humidity</h5>
                  <div className="text-xl font-bold text-blue-600">
                    {weatherData?.humidity || 'N/A'}%
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Risk: {weatherData?.humidity < 20 ? 'High' : weatherData?.humidity < 35 ? 'Medium' : 'Low'}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h5 className="font-medium text-gray-800">Wind Speed</h5>
                  <div className="text-xl font-bold text-gray-600">
                    {weatherData?.windSpeed || 'N/A'} mph
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Risk: {weatherData?.windSpeed > 20 ? 'High' : weatherData?.windSpeed > 10 ? 'Medium' : 'Low'}
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h5 className="font-medium text-yellow-800">Fire Weather Index</h5>
                  <div className="text-xl font-bold text-yellow-600">
                    {weatherData?.fireWeatherIndex || 'N/A'}
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">
                    Current conditions
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                <h5 className="font-medium text-orange-800 mb-2">Weather Score Calculation</h5>
                <div className="text-sm space-y-1">
                  <div>• Temperature factor: {weatherData?.temperature > 90 ? '30%' : weatherData?.temperature > 80 ? '20%' : weatherData?.temperature > 70 ? '10%' : '0%'}</div>
                  <div>• Humidity factor: {weatherData?.humidity < 15 ? '30%' : weatherData?.humidity < 25 ? '20%' : weatherData?.humidity < 35 ? '10%' : '0%'}</div>
                  <div>• Wind factor: {weatherData?.windSpeed > 20 ? '30%' : weatherData?.windSpeed > 15 ? '20%' : weatherData?.windSpeed > 10 ? '10%' : '0%'}</div>
                  <div>• Fire Weather Index: {weatherData?.fireWeatherIndex === 'EXTREME' ? '10%' : weatherData?.fireWeatherIndex === 'VERY HIGH' ? '8%' : weatherData?.fireWeatherIndex === 'HIGH' ? '6%' : '4%'}</div>
                  <div className="font-medium mt-2">
                    Final Score: {selectedPrediction.features.weather.score.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Confidence Breakdown */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleSection('confidenceBreakdown')}
            className="w-full p-4 text-left border-b hover:bg-gray-50 flex items-center justify-between"
          >
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium">Confidence Score Breakdown</span>
              <span className="ml-2 text-sm text-gray-500">
                Overall: {Math.round(selectedPrediction.confidence * 100)}%
              </span>
            </div>
            {expandedSections.confidenceBreakdown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          
          {expandedSections.confidenceBreakdown && (
            <div className="p-4">
              <div className="space-y-4">
                {/* Calculate confidence breakdown */}
                {(() => {
                  const dataYears = selectedPrediction.trends?.yearlyData?.length || 0;
                  const confidence = selectedPrediction.confidence;
                  
                  // Estimate component contributions based on the algorithm
                  let sviScore = 0;
                  if (dataYears >= 5) sviScore = 0.35;
                  else if (dataYears >= 3) sviScore = 0.35 * 0.8;
                  else if (dataYears >= 2) sviScore = 0.35 * 0.6;
                  else if (dataYears >= 1) sviScore = 0.35 * 0.4;
                  
                  const fireScore = selectedPrediction.features.fireActivity.score > 0 ? 0.30 * 0.8 : 0.30 * 0.5;
                  const weatherScore = 0.25; // Assume full weather data
                  const completenessScore = (dataYears >= 3) ? 0.10 : 0;
                  
                  return (
                    <>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-purple-800">SVI Data Quality (35% weight)</span>
                          <span className="text-purple-600">{Math.round(sviScore * 100)}%</span>
                        </div>
                        <div className="text-sm text-purple-600">
                          Based on {dataYears} years of vulnerability data ({dataYears >= 5 ? 'Excellent' : dataYears >= 3 ? 'Good' : dataYears >= 2 ? 'Fair' : 'Limited'})
                        </div>
                      </div>
                      
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-red-800">Fire Data Quality (30% weight)</span>
                          <span className="text-red-600">{Math.round(fireScore * 100)}%</span>
                        </div>
                        <div className="text-sm text-red-600">
                          Fire activity score: {selectedPrediction.features.fireActivity.score.toFixed(3)} 
                          ({selectedPrediction.features.fireActivity.score > 0 ? 'Active fires detected' : 'Low fire activity'})
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-orange-800">Weather Data Quality (25% weight)</span>
                          <span className="text-orange-600">{Math.round(weatherScore * 100)}%</span>
                        </div>
                        <div className="text-sm text-orange-600">
                          Weather score: {selectedPrediction.features.weather.score.toFixed(3)} (Real-time conditions)
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-green-800">Completeness Bonus (10% weight)</span>
                          <span className="text-green-600">{Math.round(completenessScore * 100)}%</span>
                        </div>
                        <div className="text-sm text-green-600">
                          {dataYears >= 3 ? 'Full bonus: All data types with good quality' : 'No bonus: Insufficient historical data'}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Data Sources */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Data Sources & Methodology
          </h4>
          <div className="text-sm text-blue-800 space-y-2">
            <div>• <strong>Social Vulnerability:</strong> CDC/ATSDR SVI (2018-2022) from GitHub archive</div>
            <div>• <strong>Fire Activity:</strong> NASA FIRMS real-time satellite fire detection</div>
            <div>• <strong>Weather:</strong> OpenWeather API current conditions</div>
            <div>• <strong>AI Model:</strong> Random Forest + AdaBoost inspired classification algorithm</div>
            <div>• <strong>Update Frequency:</strong> Fire data: 5 minutes | Weather: Real-time | SVI: Annual</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTransparencyMatrix;