import { useState, useEffect } from 'react';
import {
  Waves, TrendingUp, TrendingDown, Droplets, Fish, AlertCircle,
  ThermometerSun, Wind, MapPin, Clock, Shield, Sparkles, Heart,
  Target, Users, BookOpen, Palette, Music, ArrowRight, ChevronRight,
  Globe, Leaf, Anchor, Compass, Activity
} from 'lucide-react';
import { useAccessibility } from '../accessibility/AccessibilityProvider';
import CaptainMarinaGuide, { marinaMessages } from '../guide/CaptainMarinaGuide';

/**
 * Ocean-Focused Dashboard for Bow Seat Contest
 * Beautiful, impactful landing page with ocean health metrics and quick actions
 */
const OceanAwareDashboard = ({ userLocation, onLocationChange, onNavigateToAlerts, onNavigateToTab }) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { translate } = useAccessibility();

  // Auto-refresh timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Ocean Health Metrics (these would come from real APIs in production)
  const oceanMetrics = {
    seaLevel: {
      value: '+3.4',
      unit: 'mm/year',
      trend: 'up',
      status: 'warning',
      description: 'Global sea level rise rate',
      icon: Waves
    },
    oceanTemp: {
      value: '+0.13',
      unit: '°C/decade',
      trend: 'up',
      status: 'critical',
      description: 'Ocean temperature increase',
      icon: ThermometerSun
    },
    plasticPollution: {
      value: '8M',
      unit: 'tons/year',
      trend: 'up',
      status: 'critical',
      description: 'Plastic entering oceans',
      icon: AlertCircle
    },
    protectedAreas: {
      value: '7.9',
      unit: '% of ocean',
      trend: 'up',
      status: 'improving',
      description: 'Marine protected areas',
      icon: Shield
    },
    fishStocks: {
      value: '34',
      unit: '% overfished',
      trend: 'stable',
      status: 'warning',
      description: 'Unsustainable fishing',
      icon: Fish
    },
    acidification: {
      value: '+30',
      unit: '% since 1800s',
      trend: 'up',
      status: 'critical',
      description: 'Ocean acidity increase',
      icon: Droplets
    }
  };

  // Quick action cards
  const quickActions = [
    {
      title: 'Interactive Ocean Story',
      description: 'Experience how coastlines transform from 2020 to 2100',
      icon: Waves,
      color: 'from-blue-500 to-cyan-500',
      action: () => onNavigateToTab?.('ocean-story'),
      badge: 'Popular'
    },
    {
      title: 'Ocean Data Art',
      description: 'Visualize ocean health through beautiful art',
      icon: Palette,
      color: 'from-purple-500 to-pink-500',
      action: () => onNavigateToTab?.('data-art'),
      badge: 'New'
    },
    {
      title: 'Ocean Curriculum',
      description: 'Free lessons, experiments, and worksheets',
      icon: BookOpen,
      color: 'from-green-500 to-emerald-500',
      action: () => onNavigateToTab?.('ocean-curriculum'),
      badge: 'Educators'
    },
    {
      title: 'Policy Actions',
      description: 'Take meaningful conservation action today',
      icon: Target,
      color: 'from-orange-500 to-red-500',
      action: () => onNavigateToTab?.('community-action'),
      badge: 'Impact'
    }
  ];

  // Feature highlights
  const features = [
    {
      title: 'Live Ocean Data',
      description: 'Real-time NOAA tsunami and sea-level monitoring',
      icon: Activity,
      tab: 'live-ocean-data'
    },
    {
      title: 'Conservation Games',
      description: 'Tsunami Escape, Beach Erosion, Coastal Defense',
      icon: Target,
      tab: 'ocean-quests'
    },
    {
      title: 'Data Sonification',
      description: 'Hear ocean health through sound',
      icon: Music,
      tab: 'ocean-sounds'
    },
    {
      title: 'Art Generator',
      description: 'Create and share custom ocean data visualizations',
      icon: Sparkles,
      tab: 'art-generator'
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'critical': return 'from-red-500 to-orange-500';
      case 'warning': return 'from-yellow-500 to-orange-500';
      case 'improving': return 'from-green-500 to-emerald-500';
      default: return 'from-blue-500 to-cyan-500';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'improving': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 text-white rounded-xl shadow-xl p-8 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-300 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-3 flex items-center">
                <Waves className="h-10 w-10 mr-3" />
                Welcome to OceanAware Guardian
              </h1>
              <p className="text-xl text-blue-100 mb-4">
                Your gateway to understanding and protecting our oceans
              </p>
              <div className="flex items-center space-x-4 text-sm">
                {userLocation && (
                  <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{userLocation.displayName}</span>
                  </div>
                )}
                <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Updated {lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <Globe className="h-12 w-12 mx-auto mb-2 animate-spin" style={{ animationDuration: '20s' }} />
              <div className="text-sm text-blue-100">Monitoring</div>
              <div className="text-2xl font-bold">24/7</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-100">Contest Entry</span>
                <Heart className="h-5 w-5 text-pink-300" />
              </div>
              <div className="text-2xl font-bold">Bow Seat 2026</div>
              <div className="text-xs text-blue-100">Ocean Awareness Contest</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-100">Features</span>
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </div>
              <div className="text-2xl font-bold">9+ Tools</div>
              <div className="text-xs text-blue-100">Interactive & Educational</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-100">Impact</span>
                <Users className="h-5 w-5 text-green-300" />
              </div>
              <div className="text-2xl font-bold">Community</div>
              <div className="text-xs text-blue-100">Conservation Together</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ocean Health Metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-blue-600" />
            Ocean Health Indicators
          </h2>
          <span className="text-sm text-gray-500">Live global data</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(oceanMetrics).map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className={`${getStatusBg(metric.status)} border-2 rounded-xl p-5 hover:shadow-lg transition-all`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`bg-gradient-to-br ${getStatusColor(metric.status)} p-3 rounded-lg text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex items-center space-x-1">
                    {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500" />}
                    {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-green-500" />}
                    {metric.trend === 'stable' && <Activity className="h-4 w-4 text-yellow-500" />}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {metric.value}
                  <span className="text-lg font-normal text-gray-600 ml-1">{metric.unit}</span>
                </div>
                <div className="text-sm text-gray-600">{metric.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-purple-600" />
            Quick Actions
          </h2>
          <span className="text-sm text-gray-500">Get started in seconds</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 text-left border-2 border-transparent hover:border-blue-200 relative overflow-hidden"
              >
                {action.badge && (
                  <span className="absolute top-3 right-3 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                    {action.badge}
                  </span>
                )}
                <div className={`bg-gradient-to-br ${action.color} p-3 rounded-lg text-white w-fit mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                <div className="flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                  Explore <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Target className="h-6 w-6 mr-2 text-green-600" />
            More Features
          </h2>
          <span className="text-sm text-gray-500">Explore all tools</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <button
                key={index}
                onClick={() => onNavigateToTab?.(feature.tab)}
                className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all text-left group"
              >
                <Icon className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-600">{feature.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Impact Section */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-3 flex items-center">
              <Leaf className="h-8 w-8 mr-3" />
              Make an Impact Today
            </h2>
            <p className="text-green-100 mb-6 text-lg">
              Every action counts - from learning about ocean science to taking policy action. Start your conservation journey now!
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigateToTab?.('community-action')}
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors inline-flex items-center shadow-lg"
              >
                Take Action Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => onNavigateToTab?.('ocean-curriculum')}
                className="bg-green-400 text-green-900 px-6 py-3 rounded-lg font-semibold hover:bg-green-300 transition-colors inline-flex items-center"
              >
                Learn More
                <BookOpen className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 text-center">
              <Anchor className="h-16 w-16 mx-auto mb-3 animate-bounce" />
              <div className="text-sm text-green-100">Join the movement</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="bg-white rounded-xl shadow-md border-2 border-blue-100 p-6">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Compass className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed">
              OceanAware Guardian combines cutting-edge ocean data with interactive storytelling,
              educational tools, and actionable policy recommendations to empower everyone—from students
              to policymakers—to protect our oceans. Through data visualization, conservation games,
              and community action, we're building a movement for ocean health.
            </p>
          </div>
        </div>
      </div>

      {/* Captain Marina Guide - Welcome Message */}
      <CaptainMarinaGuide
        message={marinaMessages.dashboard.welcome.message}
        emotion={marinaMessages.dashboard.welcome.emotion}
        position="bottom-right"
        dismissible={true}
        showInitially={true}
        actionButton={{
          label: "Start Marina's Journey",
          onClick: () => onNavigateToTab?.('guided-experience'),
          variant: 'primary'
        }}
      />
    </div>
  );
};

export default OceanAwareDashboard;
