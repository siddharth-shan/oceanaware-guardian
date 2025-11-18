import { useState } from 'react';
import {
  Shield, CheckCircle, ExternalLink, Users, Mail, FileText,
  Target, TrendingUp, MapPin, Calendar, Heart, Award,
  ChevronRight, ChevronDown, Sparkles, Waves, Globe, Leaf
} from 'lucide-react';
import CaptainMarinaGuide, { marinaMessages } from '../guide/CaptainMarinaGuide';

/**
 * Policy & Action Recommendation Engine
 * Provides personalized, actionable ocean conservation recommendations
 * with real resources, tracking, and impact metrics
 */
const PolicyActionEngine = ({ userLocation }) => {
  const [completedActions, setCompletedActions] = useState(new Set());
  const [expandedCategory, setExpandedCategory] = useState('individual');

  // Action categories with real, actionable recommendations
  const actionCategories = [
    {
      id: 'individual',
      title: 'Individual Actions',
      icon: Heart,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
      description: 'Make a daily impact through personal choices',
      actions: [
        {
          id: 'reduce-plastic',
          title: 'Eliminate Single-Use Plastics',
          description: 'Switch to reusable bags, bottles, and containers',
          impact: 'Prevents ~300 lbs of plastic waste per year',
          difficulty: 'Easy',
          timeframe: 'Start today',
          steps: [
            'Use reusable shopping bags for all purchases',
            'Carry a refillable water bottle and coffee cup',
            'Choose products with minimal packaging',
            'Refuse plastic straws and utensils'
          ],
          resources: [
            { name: 'Ocean Conservancy - Plastic Guide', url: 'https://oceanconservancy.org/trash-free-seas/plastics-in-the-ocean/' },
            { name: 'Plastic Free July', url: 'https://www.plasticfreejuly.org/' }
          ]
        },
        {
          id: 'sustainable-seafood',
          title: 'Choose Sustainable Seafood',
          description: 'Support responsible fishing practices',
          impact: 'Protects overfished species and marine ecosystems',
          difficulty: 'Easy',
          timeframe: 'Next grocery trip',
          steps: [
            'Download Seafood Watch app for sustainable choices',
            'Look for MSC (Marine Stewardship Council) certification',
            'Avoid endangered species like bluefin tuna',
            'Ask restaurants about seafood sourcing'
          ],
          resources: [
            { name: 'Monterey Bay Aquarium Seafood Watch', url: 'https://www.seafoodwatch.org/' },
            { name: 'MSC Certification Guide', url: 'https://www.msc.org/' }
          ]
        },
        {
          id: 'reduce-carbon',
          title: 'Reduce Your Carbon Footprint',
          description: 'Combat ocean acidification and warming',
          impact: 'Helps reduce ocean temperature rise and acidification',
          difficulty: 'Medium',
          timeframe: 'Ongoing',
          steps: [
            'Walk, bike, or use public transit when possible',
            'Reduce energy consumption at home',
            'Support renewable energy initiatives',
            'Eat less meat (livestock contributes to ocean dead zones)'
          ],
          resources: [
            { name: 'EPA Carbon Footprint Calculator', url: 'https://www.epa.gov/carbon-footprint-calculator' },
            { name: 'NOAA Climate Education', url: 'https://www.noaa.gov/education/resource-collections/climate' }
          ]
        }
      ]
    },
    {
      id: 'community',
      title: 'Community Actions',
      icon: Users,
      color: 'green',
      gradient: 'from-green-500 to-emerald-500',
      description: 'Organize and participate in local conservation efforts',
      actions: [
        {
          id: 'beach-cleanup',
          title: 'Organize Beach Cleanups',
          description: 'Remove trash and plastic from coastal areas',
          impact: 'Removes tons of debris from ocean ecosystems',
          difficulty: 'Medium',
          timeframe: 'Monthly event',
          steps: [
            'Join existing cleanup events through Ocean Conservancy',
            'Register your own cleanup on apps like Clean Swell',
            'Partner with local schools and community groups',
            'Document and report findings to contribute to science'
          ],
          resources: [
            { name: 'Ocean Conservancy - International Coastal Cleanup', url: 'https://oceanconservancy.org/trash-free-seas/international-coastal-cleanup/' },
            { name: 'Clean Swell App', url: 'https://oceanconservancy.org/trash-free-seas/take-deep-dive/cleanswell/' },
            { name: 'Surfrider Foundation Cleanups', url: 'https://www.surfrider.org/programs/beach-cleanups' }
          ]
        },
        {
          id: 'native-plantings',
          title: 'Coastal Habitat Restoration',
          description: 'Plant native species to prevent erosion',
          impact: 'Stabilizes coastlines and creates wildlife habitat',
          difficulty: 'Medium',
          timeframe: '2-4 events per year',
          steps: [
            'Contact local conservation districts for planting days',
            'Learn about native coastal plants in your region',
            'Volunteer with restoration organizations',
            'Create habitat corridors on private property'
          ],
          resources: [
            { name: 'NOAA Restoration Center', url: 'https://www.fisheries.noaa.gov/topic/habitat-restoration' },
            { name: 'Restore America\'s Estuaries', url: 'https://estuaries.org/' }
          ]
        },
        {
          id: 'education',
          title: 'Host Ocean Education Events',
          description: 'Teach others about ocean conservation',
          impact: 'Multiplies impact through community awareness',
          difficulty: 'Medium',
          timeframe: 'Quarterly',
          steps: [
            'Use our Ocean Curriculum for presentations',
            'Screen ocean documentaries (Blue Planet, Chasing Coral)',
            'Invite marine scientists for talks',
            'Create school programs and workshops'
          ],
          resources: [
            { name: 'NOAA Education Resources', url: 'https://www.noaa.gov/education' },
            { name: 'National Marine Sanctuary Foundation', url: 'https://marinesanctuary.org/education/' }
          ]
        }
      ]
    },
    {
      id: 'policy',
      title: 'Policy Advocacy',
      icon: Shield,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500',
      description: 'Influence legislation and corporate practices',
      actions: [
        {
          id: 'contact-legislators',
          title: 'Contact Your Representatives',
          description: 'Advocate for ocean protection policies',
          impact: 'Influences laws protecting marine ecosystems',
          difficulty: 'Easy',
          timeframe: '10 minutes',
          steps: [
            'Find your representatives at congress.gov',
            'Call or email about ocean conservation bills',
            'Support the Ocean-Based Climate Solutions Act',
            'Advocate for marine protected area expansion'
          ],
          resources: [
            { name: 'Find Your Representative', url: 'https://www.house.gov/representatives/find-your-representative' },
            { name: 'Ocean Conservancy Action Center', url: 'https://act.oceanconservancy.org/' },
            { name: 'Surfrider Foundation Legislative', url: 'https://www.surfrider.org/programs/federal-advocacy' }
          ]
        },
        {
          id: 'corporate-accountability',
          title: 'Demand Corporate Accountability',
          description: 'Push companies to reduce ocean plastic',
          impact: 'Changes corporate policies affecting millions',
          difficulty: 'Easy',
          timeframe: '5-15 minutes',
          steps: [
            'Sign petitions for plastic reduction commitments',
            'Contact brands about sustainable packaging',
            'Support companies with ocean-friendly practices',
            'Boycott worst polluters and publicize alternatives'
          ],
          resources: [
            { name: 'Break Free From Plastic', url: 'https://www.breakfreefromplastic.org/' },
            { name: 'Change.org Ocean Petitions', url: 'https://www.change.org/t/oceans-en-us' },
            { name: 'Environmental Working Group', url: 'https://www.ewg.org/' }
          ]
        },
        {
          id: 'local-ordinances',
          title: 'Support Local Ocean Protection',
          description: 'Advocate for city/county coastal policies',
          impact: 'Creates enforceable local protections',
          difficulty: 'Medium',
          timeframe: 'Attend 2-4 meetings',
          steps: [
            'Attend city council meetings on coastal issues',
            'Support plastic bag bans and straw ordinances',
            'Advocate for stormwater pollution controls',
            'Push for protected beach access and conservation zones'
          ],
          resources: [
            { name: 'Surfrider Coastal Preservation', url: 'https://www.surfrider.org/programs/coastal-preservation' },
            { name: 'Local Government Commission', url: 'https://www.lgc.org/' }
          ]
        }
      ]
    },
    {
      id: 'financial',
      title: 'Financial Actions',
      icon: Target,
      color: 'orange',
      gradient: 'from-orange-500 to-red-500',
      description: 'Support conservation with your wallet',
      actions: [
        {
          id: 'donate',
          title: 'Support Ocean Conservation Groups',
          description: 'Fund research, advocacy, and cleanup efforts',
          impact: 'Directly funds conservation work worldwide',
          difficulty: 'Easy',
          timeframe: 'One-time or monthly',
          steps: [
            'Research top-rated ocean charities on Charity Navigator',
            'Set up recurring monthly donations',
            'Donate to local coastal conservation groups',
            'Consider legacy giving in your estate planning'
          ],
          resources: [
            { name: 'Ocean Conservancy', url: 'https://oceanconservancy.org/donate/' },
            { name: 'Surfrider Foundation', url: 'https://www.surfrider.org/donate' },
            { name: 'Monterey Bay Aquarium', url: 'https://www.montereybayaquarium.org/support' },
            { name: 'Charity Navigator - Ocean Organizations', url: 'https://www.charitynavigator.org/' }
          ]
        },
        {
          id: 'divest',
          title: 'Divest from Ocean Polluters',
          description: 'Move investments away from harmful industries',
          impact: 'Pressures companies to improve practices',
          difficulty: 'Medium',
          timeframe: '1-2 hours research',
          steps: [
            'Review investment portfolios for fossil fuel exposure',
            'Switch to ESG (Environmental, Social, Governance) funds',
            'Choose banks that don\'t fund offshore drilling',
            'Support B-Corps and certified sustainable businesses'
          ],
          resources: [
            { name: 'Fossil Free Funds', url: 'https://fossilfreefunds.org/' },
            { name: 'Green America', url: 'https://www.greenamerica.org/' },
            { name: 'B Corporation Directory', url: 'https://www.bcorporation.net/' }
          ]
        }
      ]
    }
  ];

  // Calculate user's impact
  const impactStats = {
    actionsCompleted: completedActions.size,
    totalActions: actionCategories.reduce((sum, cat) => sum + cat.actions.length, 0),
    estimatedImpact: completedActions.size * 25, // pounds of plastic prevented
    communityReach: completedActions.size * 5 // people influenced
  };

  const toggleAction = (actionId) => {
    setCompletedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return 'text-green-700 bg-green-100';
      case 'Medium': return 'text-yellow-700 bg-yellow-100';
      case 'Hard': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="h-8 w-8" />
              <h2 className="text-3xl font-bold">Policy & Action Recommendations</h2>
            </div>
            <p className="text-blue-100 text-lg mb-4">
              Take meaningful action to protect our oceans - from individual choices to systemic change
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span>
                {userLocation?.displayName || 'Set your location for personalized recommendations'}
              </span>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{impactStats.actionsCompleted}</div>
            <div className="text-xs text-blue-100">Actions Completed</div>
          </div>
        </div>
      </div>

      {/* Impact Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Progress</div>
            <CheckCircle className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {impactStats.actionsCompleted}/{impactStats.totalActions}
          </div>
          <div className="text-xs text-gray-500 mt-1">Actions Completed</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Plastic Saved</div>
            <Leaf className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {impactStats.estimatedImpact} lbs
          </div>
          <div className="text-xs text-gray-500 mt-1">Estimated Annual Impact</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Influence</div>
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {impactStats.communityReach}+
          </div>
          <div className="text-xs text-gray-500 mt-1">People Reached</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Level</div>
            <Award className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {impactStats.actionsCompleted < 3 ? 'Beginner' :
             impactStats.actionsCompleted < 7 ? 'Advocate' :
             impactStats.actionsCompleted < 12 ? 'Champion' : 'Guardian'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Conservation Level</div>
        </div>
      </div>

      {/* Action Categories */}
      {actionCategories.map((category) => {
        const Icon = category.icon;
        const isExpanded = expandedCategory === category.id;

        return (
          <div key={category.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`bg-gradient-to-br ${category.gradient} p-3 rounded-lg text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {category.actions.filter(a => completedActions.has(a.id)).length} of {category.actions.length} completed
                    </span>
                  </div>
                </div>
              </div>
              {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
            </button>

            {/* Category Actions */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-4">
                {category.actions.map((action) => {
                  const isCompleted = completedActions.has(action.id);

                  return (
                    <div
                      key={action.id}
                      className={`bg-white rounded-lg p-5 shadow-sm border-2 transition-all ${
                        isCompleted ? 'border-green-400 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      {/* Action Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <button
                              onClick={() => toggleAction(action.id)}
                              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                isCompleted
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-gray-300 hover:border-green-400'
                              }`}
                            >
                              {isCompleted && <CheckCircle className="h-4 w-4 text-white" />}
                            </button>
                            <h4 className={`text-lg font-bold ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                              {action.title}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(action.difficulty)}`}>
                              {action.difficulty}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full font-medium text-blue-700 bg-blue-100">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              {action.timeframe}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full font-medium text-purple-700 bg-purple-100">
                              <TrendingUp className="inline h-3 w-3 mr-1" />
                              {action.impact}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Steps */}
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Action Steps:</h5>
                        <ul className="space-y-1">
                          {action.steps.map((step, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Resources */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Resources:</h5>
                        <div className="flex flex-wrap gap-2">
                          {action.resources.map((resource, idx) => (
                            <a
                              key={idx}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {resource.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Call to Action Footer */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Globe className="h-12 w-12" />
          <div>
            <h3 className="text-2xl font-bold mb-1">Every Action Counts</h3>
            <p className="text-cyan-100">
              You don't have to do everything - just pick one action and start today. Share your progress to inspire others!
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://www.ocean.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center"
          >
            Learn More About Ocean Issues
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
          <a
            href="https://www.bow.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-cyan-400 text-cyan-900 px-6 py-2 rounded-lg font-semibold hover:bg-cyan-300 transition-colors inline-flex items-center"
          >
            Join Bow Seat Contest
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Captain Marina Guide - Policy Introduction */}
      <CaptainMarinaGuide
        message={marinaMessages.policy.intro.message}
        emotion={marinaMessages.policy.intro.emotion}
        position="bottom-right"
        dismissible={true}
        showInitially={true}
        autoHide={true}
        autoHideDuration={15000}
      />
    </div>
  );
};

export default PolicyActionEngine;
