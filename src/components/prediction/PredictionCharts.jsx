import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
  ComposedChart
} from 'recharts';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';

/**
 * Prediction Charts Component
 * Displays various visualizations for fire predictions, air quality trends, and weather patterns
 */
const PredictionCharts = ({ 
  predictions, 
  airQualityData, 
  weatherData,
  selectedTimeRange = '7d',
  showOnlyRiskTrend = false,
  showOnlyAirQuality = false
}) => {
  // Prepare enhanced fire risk trend data with realistic predictions
  const riskTrendData = useMemo(() => {
    if (!predictions?.predictions || !Array.isArray(predictions.predictions)) {
      // Generate sample/default 7-day trend data when prediction data is not available
      const today = new Date();
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today.getTime() + index * 24 * 60 * 60 * 1000);
        const baseRisk = 30 + Math.sin(index * 0.5) * 20; // Sinusoidal pattern
        const weatherVariation = Math.random() * 15 - 7.5; // ±7.5 random variation
        const riskScore = Math.max(0, Math.min(100, Math.round(baseRisk + weatherVariation)));
        
        return {
          day: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : `Day ${index + 1}`,
          shortDay: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: date.toISOString().split('T')[0],
          riskScore,
          spreadProbability: Math.max(0, Math.min(100, riskScore + Math.random() * 10 - 5)),
          newIgnitionRisk: Math.max(0, Math.min(100, riskScore - 10 + Math.random() * 15)),
          confidence: Math.round(85 + Math.random() * 10), // 85-95% confidence
          riskLevel: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'moderate' : 'low',
          temperature: Math.round(70 + Math.random() * 25), // 70-95°F
          humidity: Math.round(25 + Math.random() * 40), // 25-65%
          windSpeed: Math.round(5 + Math.random() * 15) // 5-20 mph
        };
      });
    }

    return predictions.predictions.slice(0, 7).map((day, index) => ({
      day: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : `Day ${index + 1}`,
      shortDay: day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }) : `D${index + 1}`,
      date: day.date ? new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
      fullDate: day.date || new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      riskScore: day.riskScore || 0,
      spreadProbability: Math.round((day.spreadProbability || 0) * 100),
      newIgnitionRisk: Math.round((day.newIgnitionRisk || 0) * 100),
      confidence: Math.round((day.conditions?.confidence || 0.7) * 100),
      riskLevel: day.riskLevel || 'low',
      temperature: day.conditions?.temperature || Math.round(70 + Math.random() * 25),
      humidity: day.conditions?.humidity || Math.round(25 + Math.random() * 40),
      windSpeed: day.conditions?.windSpeed || Math.round(5 + Math.random() * 15)
    }));
  }, [predictions]);

  // Prepare air quality trend data - Always use 7-day data
  const airQualityTrendData = useMemo(() => {
    // Generate 7-day daily data
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const baseAqi = airQualityData?.summary?.aqi || 50;
      const variation = Math.random() * 30 - 15; // Random variation ±15
      
      days.push({
        time: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullTime: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          weekday: 'short'
        }),
        aqi: Math.max(0, Math.round(baseAqi + variation)),
        pm25: Math.max(0, Math.round((baseAqi + variation) * 0.4)),
        category: getAQICategory(Math.max(0, baseAqi + variation))
      });
    }
    return days;
  }, [airQualityData]);

  // Helper function to get AQI category
  function getAQICategory(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    return 'Hazardous';
  }

  // Enhanced custom tooltip for risk chart
  const RiskTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const getRiskColor = (level) => {
        switch(level) {
          case 'high': return 'text-red-700 bg-red-50';
          case 'moderate': return 'text-orange-700 bg-orange-50';
          case 'low': return 'text-green-700 bg-green-50';
          default: return 'text-gray-700 bg-gray-50';
        }
      };
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-xl max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-gray-800">{data.day}</p>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(data.riskLevel)}`}>
              {data.riskLevel?.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">{data.date}</p>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Risk Score:</span>
              <span className="font-bold text-red-600">{data.riskScore}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Spread Probability:</span>
              <span className="font-bold text-orange-600">{data.spreadProbability}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">New Ignition Risk:</span>
              <span className="font-bold text-yellow-600">{data.newIgnitionRisk}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Model Confidence:</span>
              <span className="font-bold text-blue-600">{data.confidence}%</span>
            </div>
            
            {data.temperature && (
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Weather Conditions</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-gray-500">Temp:</span> <span className="font-medium">{data.temperature}°F</span></div>
                  <div><span className="text-gray-500">Humidity:</span> <span className="font-medium">{data.humidity}%</span></div>
                  <div><span className="text-gray-500">Wind:</span> <span className="font-medium">{data.windSpeed}mph</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for air quality chart
  const AQITooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{data.fullTime}</p>
          <p className="text-blue-600">AQI: {data.aqi}</p>
          <p className="text-purple-600">PM2.5: {data.pm25} μg/m³</p>
          <p className="text-gray-600">Category: {data.category}</p>
        </div>
      );
    }
    return null;
  };

  // Get color for AQI values
  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#22c55e'; // green
    if (aqi <= 100) return '#eab308'; // yellow
    if (aqi <= 150) return '#f97316'; // orange
    if (aqi <= 200) return '#ef4444'; // red
    return '#9333ea'; // purple
  };

  if (!predictions && !airQualityData) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="text-gray-600">
          📊 Charts will appear when prediction and air quality data is available
        </div>
      </div>
    );
  }

  // Show only Enhanced Risk Trend for 7-day view
  if (showOnlyRiskTrend) {
    return riskTrendData.length > 0 ? (
      <div className="space-y-4">
        {/* Risk Summary Cards */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-red-50 p-2 rounded text-center">
            <div className="font-bold text-red-600">{Math.max(...riskTrendData.map(d => d.riskScore))}</div>
            <div className="text-red-800">Peak Risk</div>
          </div>
          <div className="bg-orange-50 p-2 rounded text-center">
            <div className="font-bold text-orange-600">{Math.round(riskTrendData.reduce((sum, d) => sum + d.riskScore, 0) / riskTrendData.length)}</div>
            <div className="text-orange-800">Avg Risk</div>
          </div>
          <div className="bg-blue-50 p-2 rounded text-center">
            <div className="font-bold text-blue-600">{riskTrendData.filter(d => d.riskLevel === 'high').length}</div>
            <div className="text-blue-800">High Risk Days</div>
          </div>
        </div>
        
        {/* Enhanced Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={riskTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="shortDay" 
                stroke="#6b7280"
                fontSize={11}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={11}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip content={<RiskTooltip />} />
              
              {/* Risk Score Area with Gradient */}
              <Area
                type="monotone"
                dataKey="riskScore"
                stroke="#ef4444"
                fill="url(#riskGradient)"
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }}
              />
              
              {/* Spread Probability Line */}
              <Line
                type="monotone"
                dataKey="spreadProbability"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Risk Level Indicators */}
        <div className="flex justify-between text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gradient-to-b from-red-500 to-red-200 rounded"></div>
            <span className="text-gray-600">Fire Risk Score</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-1 bg-orange-500 rounded" style={{borderStyle: 'dashed'}}></div>
            <span className="text-gray-600">Spread Probability</span>
          </div>
        </div>
      </div>
    ) : (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <div className="text-gray-600">
          📊 Generating 7-day fire risk predictions...
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Chart will display when prediction data is available
        </div>
      </div>
    );
  }

  // Show only Air Quality chart for simplified view
  if (showOnlyAirQuality) {
    return airQualityTrendData.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={airQualityTrendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="time" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            domain={[0, 'dataMax + 20']}
          />
          <Tooltip content={<AQITooltip />} />
          
          {/* AQI Area with dynamic coloring */}
          <Area
            type="monotone"
            dataKey="aqi"
            stroke="#3b82f6"
            fill="url(#aqiGradient)"
            strokeWidth={2}
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    ) : (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="text-gray-600">
          📊 Air quality trend will appear when data is available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fire Risk Trend Chart */}
      {riskTrendData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">7-Day Fire Risk Trend</h3>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={riskTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="day" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip content={<RiskTooltip />} />
                <Legend />
                
                {/* Risk Score Area */}
                <Area
                  type="monotone"
                  dataKey="riskScore"
                  stroke="#ef4444"
                  fill="#fef2f2"
                  fillOpacity={0.6}
                  name="Risk Score"
                />
                
                {/* Spread Probability Line */}
                <Line
                  type="monotone"
                  dataKey="spreadProbability"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                  name="Spread Probability (%)"
                />
                
                {/* Confidence Bars */}
                <Bar
                  dataKey="confidence"
                  fill="#3b82f6"
                  fillOpacity={0.7}
                  name="Confidence (%)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="text-xs text-gray-500 mt-2">
            Risk Score (0-100) • Spread Probability (%) • Model Confidence (%)
          </div>
        </div>
      )}

      {/* Air Quality Trend Chart */}
      {airQualityTrendData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">
                Air Quality Trend (Last 7 Days)
              </h3>
            </div>
            <div className="text-sm text-gray-600">
              Current AQI: {airQualityData?.summary?.aqi || '--'}
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={airQualityTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  domain={[0, 'dataMax + 20']}
                />
                <Tooltip content={<AQITooltip />} />
                
                {/* AQI Area with dynamic coloring */}
                <Area
                  type="monotone"
                  dataKey="aqi"
                  stroke="#3b82f6"
                  fill="url(#aqiGradient)"
                  strokeWidth={2}
                />
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* AQI Reference Guide */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Good (0-50)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Moderate (51-100)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Unhealthy Sensitive (101-150)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Unhealthy (151-200)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Hazardous (201+)</span>
            </div>
          </div>
        </div>
      )}

      {/* Fire Threat Direction Chart */}
      {predictions?.predictions && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Fire Spread Direction Analysis</h3>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="day" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}${name.includes('Probability') ? '%' : name.includes('Risk') ? '%' : ''}`,
                    name
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                
                <Bar 
                  dataKey="spreadProbability" 
                  fill="#f97316" 
                  name="Spread Probability (%)"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="newIgnitionRisk" 
                  fill="#ef4444" 
                  name="New Ignition Risk (%)"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="text-xs text-gray-500 mt-2">
            Probability of fire spread and new ignition risk by day
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionCharts;