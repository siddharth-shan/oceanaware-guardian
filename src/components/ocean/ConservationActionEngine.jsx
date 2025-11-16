/**
 * Conservation Action Engine
 *
 * Personalized ocean conservation recommendations based on:
 * - User location and nearby hazards
 * - Ocean health assessment results
 * - Available conservation opportunities
 * - User skill level and time availability
 *
 * Created for Ocean Awareness Contest 2026
 */

import { useState } from 'react';
import { Leaf, Users, Droplet, Fish, Heart, CheckCircle, ExternalLink, Clock, Target } from 'lucide-react';

export default function ConservationActionEngine({ hazardData, userLocation }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [completedActions, setCompletedActions] = useState([]);

  // Generate personalized recommendations based on hazard data
  const recommendations = generateRecommendations(hazardData, userLocation);

  const categories = [
    { id: 'all', label: 'All Actions', icon: Heart },
    { id: 'immediate', label: 'Immediate', icon: Target },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'lifestyle', label: 'Lifestyle', icon: Leaf },
    { id: 'advocacy', label: 'Advocacy', icon: Droplet }
  ];

  const filteredRecommendations = selectedCategory === 'all'
    ? recommendations
    : recommendations.filter(r => r.category === selectedCategory);

  const handleToggleAction = (actionId) => {
    setCompletedActions(prev =>
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  const completionStats = {
    total: recommendations.length,
    completed: completedActions.length,
    percentage: recommendations.length > 0
      ? Math.round((completedActions.length / recommendations.length) * 100)
      : 0
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conservation Action Plan</h2>
        <p className="text-gray-600">
          Personalized recommendations to protect our oceans based on your location and ocean health data
        </p>
      </div>

      {/* Progress Stats */}
      <div className="bg-ocean-50 border-2 border-ocean-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-ocean-900 font-semibold">Your Progress</span>
          <span className="text-ocean-700 font-bold">{completionStats.percentage}%</span>
        </div>
        <div className="bg-white rounded-full h-4 overflow-hidden">
          <div
            className="bg-ocean-600 h-4 transition-all duration-500"
            style={{ width: `${completionStats.percentage}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-ocean-700">
          {completionStats.completed} of {completionStats.total} actions completed
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-ocean-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Fish className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No recommendations in this category</p>
          </div>
        ) : (
          filteredRecommendations.map(recommendation => (
            <ActionCard
              key={recommendation.id}
              recommendation={recommendation}
              isCompleted={completedActions.includes(recommendation.id)}
              onToggle={() => handleToggleAction(recommendation.id)}
            />
          ))
        )}
      </div>

      {/* Impact Summary */}
      {completedActions.length > 0 && (
        <div className="mt-6 p-4 bg-kelp-50 border border-kelp-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-kelp-600" />
            <h3 className="font-semibold text-kelp-900">Your Conservation Impact</h3>
          </div>
          <p className="text-sm text-kelp-800">
            By completing {completedActions.length} action{completedActions.length !== 1 ? 's' : ''},{' '}
            you're directly contributing to ocean conservation. Every action matters!
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Action Card Component
 */
function ActionCard({ recommendation, isCompleted, onToggle }) {
  const priorityColors = {
    high: 'border-critical-500 bg-critical-50',
    medium: 'border-warning-500 bg-warning-50',
    low: 'border-ocean-500 bg-ocean-50'
  };

  const difficultyLabels = {
    easy: { label: 'Easy', color: 'text-kelp-700' },
    medium: { label: 'Medium', color: 'text-sand-700' },
    hard: { label: 'Hard', color: 'text-warning-700' }
  };

  const difficulty = difficultyLabels[recommendation.difficulty] || difficultyLabels.medium;

  return (
    <div className={`border-2 rounded-lg p-4 transition-all ${
      isCompleted
        ? 'border-kelp-500 bg-kelp-50 opacity-75'
        : priorityColors[recommendation.priority]
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className={`font-bold text-gray-900 ${isCompleted ? 'line-through' : ''}`}>
              {recommendation.title}
            </h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
              recommendation.priority === 'high' ? 'bg-critical-100 text-critical-700' :
              recommendation.priority === 'medium' ? 'bg-warning-100 text-warning-700' :
              'bg-ocean-100 text-ocean-700'
            }`}>
              {recommendation.priority}
            </span>
          </div>
          <p className="text-gray-700 text-sm mb-2">{recommendation.description}</p>

          {/* Meta information */}
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{recommendation.timeEstimate}</span>
            </div>
            <div className={`font-medium ${difficulty.color}`}>
              {difficulty.label}
            </div>
            <div className="text-ocean-600 font-medium">
              +{recommendation.impactPoints} impact pts
            </div>
          </div>
        </div>

        <button
          onClick={onToggle}
          className={`ml-4 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-kelp-600 border-kelp-600'
              : 'border-gray-300 hover:border-ocean-500'
          }`}
        >
          {isCompleted && <CheckCircle className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Action Steps */}
      {recommendation.steps && recommendation.steps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Action Steps:</p>
          <ul className="space-y-1">
            {recommendation.steps.map((step, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start">
                <span className="mr-2">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resources */}
      {recommendation.resources && recommendation.resources.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Resources:</p>
          <div className="space-y-1">
            {recommendation.resources.map((resource, idx) => (
              <a
                key={idx}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm text-ocean-600 hover:text-ocean-700 hover:underline"
              >
                <span>{resource.title}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Generate personalized recommendations based on hazard data
 */
function generateRecommendations(hazardData, userLocation) {
  const recommendations = [];
  let idCounter = 1;

  // Tsunami-related actions
  if (hazardData?.tsunami?.active) {
    recommendations.push({
      id: `action-${idCounter++}`,
      category: 'immediate',
      priority: 'high',
      title: 'Review Tsunami Evacuation Routes',
      description: 'Familiarize yourself with local tsunami evacuation routes and assembly points',
      timeEstimate: '30 minutes',
      difficulty: 'easy',
      impactPoints: 50,
      steps: [
        'Find your nearest tsunami evacuation route map',
        'Identify multiple evacuation routes from home/work',
        'Locate designated tsunami safe zones',
        'Practice evacuation route with family',
        'Prepare emergency go-bag'
      ],
      resources: [
        { title: 'NOAA Tsunami Safety', url: 'https://www.tsunami.noaa.gov/safety/' }
      ]
    });
  }

  // Sea level rise actions
  if (hazardData?.seaLevel?.current?.trend === 'rising') {
    recommendations.push({
      id: `action-${idCounter++}`,
      category: 'advocacy',
      priority: 'high',
      title: 'Advocate for Climate Action',
      description: 'Contact local representatives about sea level rise preparedness',
      timeEstimate: '20 minutes',
      difficulty: 'easy',
      impactPoints: 40,
      steps: [
        'Find your local representative contact info',
        'Write email about coastal adaptation needs',
        'Request support for renewable energy policies',
        'Ask about local sea level rise planning',
        'Share with community groups'
      ],
      resources: [
        { title: 'Climate Action Toolkit', url: 'https://citizensclimatelobby.org/' }
      ]
    });
  }

  // Erosion-related actions
  if (hazardData?.erosion?.isCoastal && hazardData?.erosion?.vulnerability !== 'low') {
    recommendations.push({
      id: `action-${idCounter++}`,
      category: 'community',
      priority: 'medium',
      title: 'Plant Native Coastal Vegetation',
      description: 'Help stabilize shorelines by planting native dune grass and shrubs',
      timeEstimate: '2-4 hours',
      difficulty: 'medium',
      impactPoints: 60,
      steps: [
        'Research native coastal plants for your area',
        'Connect with local conservation groups',
        'Get permission for planting locations',
        'Source native plant materials',
        'Organize community planting day',
        'Monitor and maintain plantings'
      ],
      resources: [
        { title: 'Coastal Restoration Guide', url: 'https://www.coastalrestoration.noaa.gov/' }
      ]
    });
  }

  // Temperature/coral health actions
  if (hazardData?.temperature?.coralBleachingRisk !== 'low') {
    recommendations.push({
      id: `action-${idCounter++}`,
      category: 'lifestyle',
      priority: 'medium',
      title: 'Switch to Reef-Safe Sunscreen',
      description: 'Use sunscreen without oxybenzone and octinoxate to protect coral reefs',
      timeEstimate: '10 minutes',
      difficulty: 'easy',
      impactPoints: 30,
      steps: [
        'Check current sunscreen ingredients',
        'Look for "reef-safe" or "ocean-friendly" labels',
        'Choose mineral-based sunscreen (zinc oxide)',
        'Avoid chemicals: oxybenzone, octinoxate, octocrylene',
        'Spread awareness to friends and family'
      ],
      resources: [
        { title: 'Reef-Safe Sunscreen Guide', url: 'https://oceanservice.noaa.gov/news/sunscreen-corals.html' }
      ]
    });
  }

  // Universal ocean actions
  recommendations.push(
    {
      id: `action-${idCounter++}`,
      category: 'immediate',
      priority: 'high',
      title: 'Organize Beach Cleanup',
      description: 'Remove marine debris to protect ocean wildlife and ecosystems',
      timeEstimate: '2-3 hours',
      difficulty: 'easy',
      impactPoints: 70,
      steps: [
        'Choose a beach and set a date',
        'Gather cleanup supplies (gloves, bags)',
        'Invite friends and post on social media',
        'Document debris collected',
        'Submit data to Ocean Conservancy',
        'Properly dispose of collected waste'
      ],
      resources: [
        { title: 'Ocean Conservancy Cleanup', url: 'https://oceanconservancy.org/trash-free-seas/' }
      ]
    },
    {
      id: `action-${idCounter++}`,
      category: 'lifestyle',
      priority: 'medium',
      title: 'Reduce Single-Use Plastics',
      description: 'Eliminate plastic bottles, bags, and straws from daily life',
      timeEstimate: '1 week challenge',
      difficulty: 'medium',
      impactPoints: 50,
      steps: [
        'Get reusable water bottle',
        'Carry reusable shopping bags',
        'Use metal/bamboo straws',
        'Choose glass/paper packaging',
        'Track plastic saved for 1 week',
        'Challenge friends to join'
      ],
      resources: [
        { title: 'Plastic Free July', url: 'https://www.plasticfreejuly.org/' }
      ]
    },
    {
      id: `action-${idCounter++}`,
      category: 'community',
      priority: 'low',
      title: 'Join Ocean Conservation Group',
      description: 'Connect with local or online ocean conservation communities',
      timeEstimate: '30 minutes',
      difficulty: 'easy',
      impactPoints: 35,
      steps: [
        'Research local ocean conservation groups',
        'Attend a group meeting or webinar',
        'Sign up for volunteer opportunities',
        'Follow on social media',
        'Participate in campaigns',
        'Recruit others to join'
      ],
      resources: [
        { title: 'Ocean Conservancy', url: 'https://oceanconservancy.org/' },
        { title: 'Surfrider Foundation', url: 'https://www.surfrider.org/' }
      ]
    },
    {
      id: `action-${idCounter++}`,
      category: 'advocacy',
      priority: 'medium',
      title: 'Support Sustainable Seafood',
      description: 'Choose ocean-friendly seafood to protect marine ecosystems',
      timeEstimate: '15 minutes',
      difficulty: 'easy',
      impactPoints: 40,
      steps: [
        'Download Seafood Watch app',
        'Learn about sustainable fishing practices',
        'Check seafood ratings before purchasing',
        'Avoid endangered species',
        'Ask restaurants about seafood sources',
        'Share guide with family'
      ],
      resources: [
        { title: 'Monterey Bay Aquarium Seafood Watch', url: 'https://www.seafoodwatch.org/' }
      ]
    }
  );

  return recommendations;
}
