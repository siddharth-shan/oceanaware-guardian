import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  Home, 
  Shield, 
  AlertTriangle,
  BarChart3,
  Clock,
  Target,
  Layers,
  ChevronDown,
  ChevronUp,
  Map
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';
import CommunityHeatmap from './CommunityHeatmap';

/**
 * Community Impact Analysis Section
 * Comprehensive social vulnerability and wildfire impact assessment for California
 */
const CommunityImpactSection = ({ userLocation }) => {
  const [loading, setLoading] = useState(false);
  const [vulnerabilityData, setVulnerabilityData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    social: false,
    economic: false,
    demographic: false,
    historical: false,
    heatmap: true
  });

  // Mock data structure - will be replaced with real API calls
  const mockCommunityData = useMemo(() => ({
    socialVulnerability: {
      overallScore: 78.5,
      rank: 'High Vulnerability',
      factors: {
        socioeconomic: 72,
        householdComposition: 65,
        minorityLanguage: 85,
        housingTransportation: 81
      }
    },
    economicImpact: {
      medianIncome: 68420,
      povertyRate: 12.8,
      uninsuredRate: 8.3,
      employmentRisk: 'Moderate',
      recoveryCapacity: 'Limited'
    },
    demographics: {
      totalPopulation: 156789,
      vulnerablePopulation: {
        under5: 6.2,
        over65: 14.8,
        disabled: 11.4,
        linguisticallyIsolated: 8.7
      },
      housingCharacteristics: {
        mobileHomes: 3.2,
        crowding: 7.1,
        noVehicle: 5.8
      }
    },
    historicalRisk: {
      fireFequency: 'High',
      lastMajorFire: '2020',
      averageRecoveryTime: '18 months',
      evacuationHistory: 3
    },
    evacuationAccessibility: {
      score: 65,
      primaryRoutes: 2,
      congestionRisk: 'High',
      specialNeedsSupport: 'Limited'
    }
  }), []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getVulnerabilityColor = (score) => {
    if (score >= 80) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getVulnerabilityLevel = (score) => {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <Users className="h-5 w-5 text-purple-600 mr-2" />
          Community Impact Analysis
        </h3>
        <div className="text-sm text-gray-600">
          California Statewide Assessment
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-6">
        Comprehensive social vulnerability and wildfire impact assessment combining demographic, 
        economic, and historical data for evidence-based community resilience planning.
      </p>

      {/* Overall Vulnerability Score */}
      <div className={`p-4 rounded-lg border-2 mb-6 ${getVulnerabilityColor(mockCommunityData.socialVulnerability.overallScore)}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold">Community Vulnerability Index</h4>
          <div className="text-2xl font-bold">
            {mockCommunityData.socialVulnerability.overallScore}/100
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium">Vulnerability Level</div>
            <div className="text-lg font-bold">
              {getVulnerabilityLevel(mockCommunityData.socialVulnerability.overallScore)}
            </div>
          </div>
          <div>
            <div className="font-medium">Population at Risk</div>
            <div className="text-lg font-bold">
              {Math.round(mockCommunityData.demographics.totalPopulation * 0.32).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="font-medium">Recovery Capacity</div>
            <div className="text-lg font-bold">
              {mockCommunityData.economicImpact.recoveryCapacity}
            </div>
          </div>
          <div>
            <div className="font-medium">Evacuation Risk</div>
            <div className="text-lg font-bold">
              {mockCommunityData.evacuationAccessibility.congestionRisk}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Heatmap Visualization */}
      <div className="border border-gray-200 rounded-lg mb-6">
        <button
          onClick={() => toggleSection('heatmap')}
          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
        >
          <div className="flex items-center">
            <Map className="h-5 w-5 text-indigo-600 mr-2" />
            <span className="font-medium">Interactive Vulnerability Heatmap</span>
            <span className="ml-2 text-sm text-gray-500">
              (California Statewide Analysis)
            </span>
          </div>
          {expandedSections.heatmap ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {expandedSections.heatmap && (
          <div className="p-4 border-t border-gray-100">
            <CommunityHeatmap userLocation={userLocation} />
          </div>
        )}
      </div>

      {/* Detailed Analysis Sections */}
      <div className="space-y-4">
        
        {/* Social Vulnerability */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('social')}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium">Social Vulnerability Factors</span>
              <span className="ml-2 text-sm text-gray-500">
                (CDC Social Vulnerability Index)
              </span>
            </div>
            {expandedSections.social ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.social && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Social Vulnerability Factors Chart */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-3">Vulnerability Factor Breakdown</h5>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Socioeconomic', value: mockCommunityData.socialVulnerability.factors.socioeconomic, color: '#3b82f6' },
                        { name: 'Household', value: mockCommunityData.socialVulnerability.factors.householdComposition, color: '#10b981' },
                        { name: 'Minority/Language', value: mockCommunityData.socialVulnerability.factors.minorityLanguage, color: '#f59e0b' },
                        { name: 'Housing/Transport', value: mockCommunityData.socialVulnerability.factors.housingTransportation, color: '#ef4444' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="value" fill={(entry) => entry.color} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Radial Progress Chart */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-3">Overall Vulnerability Score</h5>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" data={[
                        { name: 'Vulnerability', value: mockCommunityData.socialVulnerability.overallScore, fill: '#ef4444' }
                      ]}>
                        <RadialBar dataKey="value" cornerRadius={10} fill="#ef4444" />
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-gray-800">
                          {mockCommunityData.socialVulnerability.overallScore}
                        </text>
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Factor Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {mockCommunityData.socialVulnerability.factors.socioeconomic}
                  </div>
                  <div className="text-xs text-gray-600">Socioeconomic Status</div>
                  <div className="text-xs text-gray-500 mt-1">Income, education, employment</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {mockCommunityData.socialVulnerability.factors.householdComposition}
                  </div>
                  <div className="text-xs text-gray-600">Household Composition</div>
                  <div className="text-xs text-gray-500 mt-1">Age, disability, single parent</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded">
                  <div className="text-2xl font-bold text-orange-600">
                    {mockCommunityData.socialVulnerability.factors.minorityLanguage}
                  </div>
                  <div className="text-xs text-gray-600">Minority & Language</div>
                  <div className="text-xs text-gray-500 mt-1">Race, ethnicity, language barriers</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">
                    {mockCommunityData.socialVulnerability.factors.housingTransportation}
                  </div>
                  <div className="text-xs text-gray-600">Housing & Transportation</div>
                  <div className="text-xs text-gray-500 mt-1">Multi-unit housing, crowding, no vehicle</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Economic Impact */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('economic')}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium">Economic Vulnerability Assessment</span>
            </div>
            {expandedSections.economic ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.economic && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-green-50 p-3 rounded text-center">
                  <div className="text-lg font-bold text-green-600">
                    ${mockCommunityData.economicImpact.medianIncome.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-800">Median Household Income</div>
                </div>
                <div className="bg-orange-50 p-3 rounded text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {mockCommunityData.economicImpact.povertyRate}%
                  </div>
                  <div className="text-xs text-orange-800">Poverty Rate</div>
                </div>
                <div className="bg-red-50 p-3 rounded text-center">
                  <div className="text-lg font-bold text-red-600">
                    {mockCommunityData.economicImpact.uninsuredRate}%
                  </div>
                  <div className="text-xs text-red-800">Uninsured Rate</div>
                </div>
                <div className="bg-blue-50 p-3 rounded text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {mockCommunityData.economicImpact.employmentRisk}
                  </div>
                  <div className="text-xs text-blue-800">Employment Risk</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Demographic Profile */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('demographic')}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-medium">Demographic Risk Profile</span>
            </div>
            {expandedSections.demographic ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.demographic && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Vulnerable Population Pie Chart */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h5 className="font-medium text-purple-800 mb-3">Vulnerable Population Distribution</h5>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Under 5', value: mockCommunityData.demographics.vulnerablePopulation.under5, fill: '#8b5cf6' },
                            { name: 'Over 65', value: mockCommunityData.demographics.vulnerablePopulation.over65, fill: '#a855f7' },
                            { name: 'Disabled', value: mockCommunityData.demographics.vulnerablePopulation.disabled, fill: '#c084fc' },
                            { name: 'Linguistically Isolated', value: mockCommunityData.demographics.vulnerablePopulation.linguisticallyIsolated, fill: '#ddd6fe' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, value}) => `${name}: ${value}%`}
                          labelLine={false}
                        >
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Housing Characteristics Bar Chart */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-3">Housing Vulnerability Factors</h5>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Mobile Homes', value: mockCommunityData.demographics.housingCharacteristics.mobileHomes, fill: '#f59e0b' },
                        { name: 'Crowding', value: mockCommunityData.demographics.housingCharacteristics.crowding, fill: '#ef4444' },
                        { name: 'No Vehicle', value: mockCommunityData.demographics.housingCharacteristics.noVehicle, fill: '#3b82f6' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Demographics Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-xl font-bold text-purple-600">
                    {mockCommunityData.demographics.vulnerablePopulation.under5}%
                  </div>
                  <div className="text-xs text-gray-600">Children Under 5</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-xl font-bold text-purple-600">
                    {mockCommunityData.demographics.vulnerablePopulation.over65}%
                  </div>
                  <div className="text-xs text-gray-600">Adults Over 65</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-xl font-bold text-purple-600">
                    {mockCommunityData.demographics.vulnerablePopulation.disabled}%
                  </div>
                  <div className="text-xs text-gray-600">With Disability</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-xl font-bold text-purple-600">
                    {mockCommunityData.demographics.vulnerablePopulation.linguisticallyIsolated}%
                  </div>
                  <div className="text-xs text-gray-600">Linguistically Isolated</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Historical Risk Analysis */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('historical')}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-medium">Historical Impact & Recovery Analysis</span>
            </div>
            {expandedSections.historical ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.historical && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-red-50 p-3 rounded text-center">
                  <div className="text-lg font-bold text-red-600">
                    {mockCommunityData.historicalRisk.fireFequency}
                  </div>
                  <div className="text-xs text-red-800">Fire Frequency</div>
                  <div className="text-xs text-gray-500 mt-1">2000-2024 average</div>
                </div>
                <div className="bg-orange-50 p-3 rounded text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {mockCommunityData.historicalRisk.lastMajorFire}
                  </div>
                  <div className="text-xs text-orange-800">Last Major Fire</div>
                  <div className="text-xs text-gray-500 mt-1">Significant impact event</div>
                </div>
                <div className="bg-blue-50 p-3 rounded text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {mockCommunityData.historicalRisk.averageRecoveryTime}
                  </div>
                  <div className="text-xs text-blue-800">Average Recovery Time</div>
                  <div className="text-xs text-gray-500 mt-1">Infrastructure restoration</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {mockCommunityData.historicalRisk.evacuationHistory}
                  </div>
                  <div className="text-xs text-yellow-800">Evacuations (5 years)</div>
                  <div className="text-xs text-gray-500 mt-1">Community-wide events</div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Key Insights */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
          <Target className="h-4 w-4 mr-2" />
          Key Community Resilience Insights
        </h4>
        <div className="space-y-2 text-sm text-purple-700">
          <div className="flex items-start space-x-2">
            <span className="w-1 h-1 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
            <span>High vulnerability score indicates significant community support needs during wildfire events</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="w-1 h-1 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
            <span>Language barriers affect {mockCommunityData.demographics.vulnerablePopulation.linguisticallyIsolated}% of population - multilingual emergency communications critical</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="w-1 h-1 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
            <span>Limited transportation access requires enhanced evacuation assistance programs</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="w-1 h-1 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
            <span>Economic vulnerabilities suggest extended recovery periods requiring sustained community support</span>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600">
          <strong>Data Sources:</strong> CDC Social Vulnerability Index (SVI), 
          U.S. Census Bureau American Community Survey (ACS), 
          CalEnviroScreen 4.0, CAL FIRE Historical Data, 
          California Emergency Management Agency (Cal OES). 
          <span className="text-purple-600 font-medium"> Analysis updates quarterly.</span>
        </div>
      </div>
    </div>
  );
};

export default CommunityImpactSection;