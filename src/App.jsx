import { useState, useEffect } from 'react';
import './index.css';
import './styles/accessibility.css';
import './styles/themes.css';
import { Home, Brain, Map, Target, AlertTriangle, Zap, Users, Settings, Activity, Bell, X, Shield, MapPin, Waves, GraduationCap, Palette, Music, Sparkles, ChevronDown, Heart } from 'lucide-react';

// Import components
import WeatherWidget from './components/weather/WeatherWidget';
import HazardDetector from './components/ai/HazardDetector';
import QuickRiskAssessment from './components/ai/QuickRiskAssessment';
import AlertBanner from './components/alerts/AlertBanner';
import AlertsDashboard from './components/alerts/AlertsDashboard';
import LoadingSpinner from './components/ui/LoadingSpinner';
import LocationInput from './components/location/LocationInput';
import OceanAwareDashboard from './components/dashboard/OceanAwareDashboard';
import CommunityHub from './components/community/CommunityHub';
import FamilySafetyHub from './components/family/FamilySafetyHub';
import AccessibilityProvider from './components/accessibility/AccessibilityProvider';
import { AuthProvider } from './services/auth/AuthContext';
import { ProfileProvider } from './services/profile/ProfileContext';
import { FamilyProvider } from './services/family/FamilyContext';
import { StorageProvider } from './services/storage/StorageContext';
import AccessibilitySettings from './components/accessibility/AccessibilitySettings';
import NotificationSettings from './components/settings/NotificationSettings';
import PrivacyControlPanel from './components/privacy/PrivacyControlPanel';
import { NotificationContainer, useNotifications } from './components/ui/EnhancedNotification';
import PrivacyFirstAuth from './components/auth/PrivacyFirstAuth';
import HooksErrorBoundary from './components/ui/HooksErrorBoundary';
import OceanHazardDashboard from './components/ocean/OceanHazardDashboard';
import InteractiveCoastalStory from './components/narrative/InteractiveCoastalStory';
import OceanConservationGames from './components/games/OceanConservationGames';
import DataArtTriptych from './components/visualization/DataArtTriptych';
import OceanCurriculumHub from './components/curriculum/OceanCurriculumHub';
import DataSonification from './components/visualization/DataSonification';
import GenerativeArtTool from './components/visualization/GenerativeArtTool';
import PolicyActionEngine from './components/policy/PolicyActionEngine';
import AIMarineTrainer from './components/ai/AIMarineTrainer';
import AboutMe from './components/about/AboutMe';
import GuidedExperience from './components/guided/GuidedExperience';
// import OfflineIndicator from './components/offline/OfflineIndicator'; // Temporarily disabled

// Import services
import { useOffline } from './hooks/useOfflineSimple';
import { useLocationManager } from './hooks/useLocationManager';
import { useWeatherData } from './hooks/useWeatherData';
import { useAccessibility } from './components/accessibility/AccessibilityProvider';
import { useAuth } from './services/auth/AuthContext';

const AppContent = () => {
  const { translate } = useAccessibility();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showPrivacyControls, setShowPrivacyControls] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { notifications, removeNotification } = useNotifications();
  const { isAuthenticated, needsAuthForFamily } = useAuth();
  const { isOnline, preloadData } = useOffline();
  
  // Get user location with zip code support
  const { 
    location, 
    error: locationError, 
    loading: locationLoading,
    updateLocation 
  } = useLocationManager();
  
  // Get weather data
  const { weather: weatherData, loading: weatherLoading } = useWeatherData(location);

  useEffect(() => {
    // Set loading to false once initial data is loaded
    console.log('Loading state check:', { weatherLoading, locationLoading, loading });
    if (!weatherLoading && !locationLoading) {
      console.log('Setting loading to false - all data loaded');
      setLoading(false);
    }
  }, [weatherLoading, locationLoading, loading]);

  // Backup timeout to prevent infinite loading
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout reached, forcing app to load');
        setLoading(false);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [loading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('nav')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  // Ocean conservation app - no fire alerts, always normal status
  const emergencyLevel = 'normal';

  // Ocean Awareness Contest 2026 - Reorganized Navigation
  // Grouped into 5 main categories for better UX
  const navigationCategories = [
    {
      id: 'dashboard',
      label: translate('nav.dashboard', 'Dashboard'),
      icon: Home,
      description: 'Ocean health overview with key metrics and quick actions',
      type: 'single',
      highlight: true
    },
    {
      id: 'guided-experience',
      label: "Marina's Journey",
      icon: Waves,
      description: "A Day in the Life of an Ocean Guardian - Complete guided tour",
      type: 'single',
      highlight: true,
      badge: 'START HERE'
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: Sparkles,
      description: 'Interactive stories, art, and immersive experiences',
      type: 'dropdown',
      highlight: true,
      badge: 'NEW',
      items: [
        {
          id: 'ocean-story',
          label: 'Ocean Story',
          icon: Map,
          description: 'Interactive journey: How climate change transforms our coasts',
          badge: 'Popular'
        },
        {
          id: 'ai-ocean-guardian',
          label: 'AI Ocean Guardian',
          icon: Brain,
          description: 'Train an AI to identify marine life & pollution - Learn ML basics',
          badge: 'NEW'
        },
        {
          id: 'data-art',
          label: 'Data Art',
          icon: Palette,
          description: 'Ocean data as artistic visualizations - science meets beauty'
        },
        {
          id: 'ocean-sounds',
          label: 'Ocean Sounds',
          icon: Music,
          description: 'Hear the ocean\'s story through data sonification'
        },
        {
          id: 'art-generator',
          label: 'Art Generator',
          icon: Sparkles,
          description: 'Create custom ocean data art - download & share'
        }
      ]
    },
    {
      id: 'learn',
      label: 'Learn',
      icon: GraduationCap,
      description: 'Educational curriculum and interactive games',
      type: 'dropdown',
      highlight: true,
      items: [
        {
          id: 'ocean-curriculum',
          label: 'Ocean Curriculum',
          icon: GraduationCap,
          description: 'Free experiments, lessons & worksheets for educators',
          badge: 'Free'
        },
        {
          id: 'ocean-quests',
          label: 'Ocean Quests',
          icon: Target,
          description: 'Educational games: Tsunami Escape, Rebuild the Coast & more'
        }
      ]
    },
    {
      id: 'live-ocean-data',
      label: 'Live Data',
      icon: Waves,
      description: 'Real-time NOAA/USGS tsunami, erosion & sea-level rise monitoring',
      type: 'single',
      highlight: true
    },
    {
      id: 'community-action',
      label: 'Take Action',
      icon: Target,
      description: 'Policy recommendations and community coastal reporting',
      type: 'single',
      highlight: true,
      badge: 'Impact'
    },
    {
      id: 'about',
      label: 'About',
      icon: Heart,
      description: 'Meet the creator and learn the story behind OceanAware Guardian',
      type: 'single'
    }
  ];

  // No sub-navigation needed - each tab has focused, unique content

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        // Ocean-focused dashboard with health metrics, quick actions, and feature highlights
        return (
          <OceanAwareDashboard
            userLocation={location}
            onLocationChange={updateLocation}
            onNavigateToAlerts={() => setActiveTab('live-ocean-data')}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        );

      case 'ocean-story':
        // UNIQUE FEATURE: Interactive storytelling - "A Day in the Life of a Coastline"
        // Point VII from ocean-contest.txt - Scroll-based narrative experience
        return <InteractiveCoastalStory />;

      case 'ai-ocean-guardian':
        // AI Education: Train ML model to identify marine life vs pollution
        // Teaches AI literacy, bias, ethics, and real-world conservation applications
        return <AIMarineTrainer />;

      case 'data-art':
        // Point V from ocean-contest.txt - Data as artistic visualization
        return <DataArtTriptych userLocation={location} />;

      case 'art-generator':
        // Phase 3: Generative Art Tool - User-customizable ocean data art
        return <GenerativeArtTool />;

      case 'ocean-sounds':
        // Phase 3: Data Sonification - Multi-sensory ocean data experience
        return <DataSonification />;

      case 'live-ocean-data':
        // Real-time NOAA/USGS data - tsunami, erosion, sea-level rise
        return <OceanHazardDashboard userLocation={location} />;

      case 'community-action':
        // Community reporting + Policy & Action Recommendations
        return (
          <HooksErrorBoundary
            onNavigateHome={() => setActiveTab('dashboard')}
            showDetails={process.env.NODE_ENV === 'development'}
          >
            <div className="space-y-6">
              {/* Policy & Action Recommendations Engine - Enhanced with real actions */}
              <PolicyActionEngine userLocation={location} />

              {/* Community Coastal Safety Reports */}
              <CommunityHub
                userLocation={location}
                emergencyLevel={emergencyLevel}
              />
            </div>
          </HooksErrorBoundary>
        );

      case 'ocean-curriculum':
        // Point IV from ocean-contest.txt - Educational curriculum for community impact
        return <OceanCurriculumHub />;

      case 'ocean-quests':
        // Educational games: Tsunami Escape, Rebuild the Coast, Stop the Shrinking Beach
        // Point VI from ocean-contest.txt - Interactive conservation games
        return <OceanConservationGames />;

      case 'guided-experience':
        // CRITICAL CONTEST FEATURE: "A Day in the Life" guided tour
        // Addresses gap: "Structure modules into a storyline"
        // 7-chapter narrative connecting all features
        return <GuidedExperience onNavigate={setActiveTab} />;

      case 'about':
        // CRITICAL CONTEST FEATURE: Creator's personal story
        // Addresses gap: "Make sure your own artistic voice comes through"
        // Personal beach story, technical journey, vision
        return <AboutMe />;

      default:
        return (
          <div className="text-center py-12">
            <Waves className="h-16 w-16 text-ocean-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a feature to explore ocean conservation</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-emergency-normal flex items-center justify-center">
        <div className="enhanced-card p-8">
          <LoadingSpinner
            size="xl"
            enhanced={true}
            text="Initializing OceanAware Guardian System..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 bg-emergency-${emergencyLevel}`}>
        {/* Skip to main content link for screen readers */}
        <a 
          href="#main-content" 
          className="skip-link"
          onFocus={(e) => e.target.style.top = '6px'}
          onBlur={(e) => e.target.style.top = '-40px'}
        >
          Skip to main content
        </a>

        {/* Header */}
        <header className="bg-gradient-to-r from-ocean-500 to-ocean-700 text-white shadow-xl" role="banner" data-testid="app-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-18 lg:h-20">
              <div className="flex items-center">
                <img
                  src="/icons/oceanaware-guardian.png"
                  alt="OceanAware Guardian Logo"
                  className="h-10 w-10 lg:h-12 lg:w-12 mr-3 lg:mr-4 rounded-full shadow-lg ring-2 ring-white/20"
                />
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
                    {translate('app.title', 'OceanAware Guardian')}
                  </h1>
                  <p className="text-ocean-100 text-xs lg:text-sm font-medium hidden sm:block">
                    {translate('app.subtitle', 'Real-time ocean hazard monitoring & conservation')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 lg:space-x-6">
                {/* Location Display - Moved from dashboard */}
                {location && (
                  <div className="flex items-center space-x-2 text-white/90">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium hidden sm:inline">
                      {location.displayName}
                    </span>
                    <span className="text-sm font-medium sm:hidden">
                      {location.displayName.split(',')[0]}
                    </span>
                  </div>
                )}
                
                {/* Emergency Status Indicator */}
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  emergencyLevel === 'critical' ? 'bg-red-100 text-red-800' :
                  emergencyLevel === 'warning' ? 'bg-orange-100 text-orange-800' :
                  emergencyLevel === 'watch' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  <Activity className="h-3 w-3" />
                  <span>
                    {emergencyLevel === 'critical' && 'CRITICAL'}
                    {emergencyLevel === 'warning' && 'WARNING'}
                    {emergencyLevel === 'watch' && 'WATCH'}
                    {emergencyLevel === 'normal' && 'ALL CLEAR'}
                  </span>
                </div>
                
                <LocationInput 
                  onLocationChange={updateLocation}
                  currentLocation={location}
                />
                <button
                  onClick={() => setShowNotificationSettings(true)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Notification Settings"
                  title="Notification Settings"
                >
                  <Bell className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowPrivacyControls(true)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Privacy Controls"
                  title="Privacy Controls"
                >
                  <Shield className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowAccessibilitySettings(true)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Accessibility Settings"
                  title="Accessibility Settings"
                >
                  <Settings className="h-5 w-5" />
                </button>
                <div className="text-right hidden lg:block">
                  <div className="text-sm font-semibold">
                    AI-Powered Ocean Conservation
                  </div>
                  <div className="text-xs text-ocean-100">
                    Advanced Ocean Monitoring System
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Mobile-First Navigation */}
        <nav className="enhanced-card !rounded-none shadow-lg border-b border-gray-200 sticky top-0 z-40 bg-white" role="navigation" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto">
            {/* Desktop Navigation */}
            <div className="hidden md:block px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center space-x-1 py-2">
                {navigationCategories.map((category) => {
                  const IconComponent = category.icon;
                  const isActive = category.type === 'single'
                    ? activeTab === category.id
                    : category.items?.some(item => item.id === activeTab);
                  const isOpen = openDropdown === category.id;

                  if (category.type === 'single') {
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setActiveTab(category.id);
                          setOpenDropdown(null);
                        }}
                        className={`group relative flex flex-col items-center px-6 py-4 text-base font-medium transition-all duration-200 min-w-0 rounded-lg hover:shadow-sm ${
                          isActive ? 'bg-ocean-50' : 'hover:bg-gray-50'
                        }`}
                        title={category.description}
                        aria-label={`Navigate to ${category.label}`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className="relative mb-1">
                          <IconComponent
                            className={`h-6 w-6 transition-all duration-200 ${
                              isActive
                                ? 'text-ocean-600 scale-110'
                                : 'text-gray-500 group-hover:text-ocean-500 group-hover:scale-105'
                            }`}
                          />
                          {category.badge && (
                            <span className="absolute -top-2 -right-2 text-xs bg-ocean-100 text-ocean-700 px-1.5 py-0.5 rounded-full font-bold">
                              {category.badge}
                            </span>
                          )}
                        </div>
                        <span className={`text-sm font-semibold transition-all duration-200 ${
                          isActive
                            ? 'text-ocean-700'
                            : 'text-gray-600 group-hover:text-ocean-600'
                        }`}>
                          {category.label}
                        </span>
                        {isActive && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-ocean-500 to-ocean-700 rounded-t-full" />
                        )}
                      </button>
                    );
                  } else {
                    return (
                      <div key={category.id} className="relative">
                        <button
                          onClick={() => setOpenDropdown(isOpen ? null : category.id)}
                          className={`group relative flex flex-col items-center px-6 py-4 text-base font-medium transition-all duration-200 min-w-0 rounded-lg hover:shadow-sm ${
                            isActive ? 'bg-ocean-50' : 'hover:bg-gray-50'
                          }`}
                          title={category.description}
                          aria-label={`${category.label} menu`}
                          aria-expanded={isOpen}
                        >
                          <div className="relative mb-1">
                            <IconComponent
                              className={`h-6 w-6 transition-all duration-200 ${
                                isActive
                                  ? 'text-ocean-600 scale-110'
                                  : 'text-gray-500 group-hover:text-ocean-500 group-hover:scale-105'
                              }`}
                            />
                            {category.badge && (
                              <span className="absolute -top-2 -right-2 text-xs bg-ocean-100 text-ocean-700 px-1.5 py-0.5 rounded-full font-bold">
                                {category.badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className={`text-sm font-semibold transition-all duration-200 ${
                              isActive
                                ? 'text-ocean-700'
                                : 'text-gray-600 group-hover:text-ocean-600'
                            }`}>
                              {category.label}
                            </span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${
                              isActive ? 'text-ocean-600' : 'text-gray-400'
                            }`} />
                          </div>
                          {isActive && (
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-ocean-500 to-ocean-700 rounded-t-full" />
                          )}
                        </button>

                        {/* Dropdown Menu */}
                        {isOpen && (
                          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[280px] z-50">
                            {category.items.map((item) => {
                              const ItemIcon = item.icon;
                              const itemActive = activeTab === item.id;

                              return (
                                <button
                                  key={item.id}
                                  onClick={() => {
                                    setActiveTab(item.id);
                                    setOpenDropdown(null);
                                  }}
                                  className={`w-full text-left px-4 py-3 hover:bg-ocean-50 transition-colors flex items-start space-x-3 ${
                                    itemActive ? 'bg-ocean-50 border-l-4 border-ocean-500' : ''
                                  }`}
                                >
                                  <ItemIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                                    itemActive ? 'text-ocean-600' : 'text-gray-400'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className={`font-semibold text-sm ${
                                        itemActive ? 'text-ocean-700' : 'text-gray-900'
                                      }`}>
                                        {item.label}
                                      </span>
                                      {item.badge && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                          {item.badge}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                })}
              </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
              <div className="flex justify-around py-2">
                {navigationCategories.map((category) => {
                  const IconComponent = category.icon;
                  const isActive = category.type === 'single'
                    ? activeTab === category.id
                    : category.items?.some(item => item.id === activeTab);

                  // For mobile, dropdown categories navigate to the first item
                  const handleClick = () => {
                    if (category.type === 'single') {
                      setActiveTab(category.id);
                    } else if (category.items && category.items.length > 0) {
                      // Navigate to first item in category or keep current if already in this category
                      const currentInCategory = category.items.find(item => item.id === activeTab);
                      setActiveTab(currentInCategory ? activeTab : category.items[0].id);
                    }
                  };

                  return (
                    <button
                      key={category.id}
                      onClick={handleClick}
                      className={`flex flex-col items-center py-2 px-2 min-w-0 flex-1 transition-all duration-200 ${
                        isActive ? 'text-ocean-600' : 'text-gray-500'
                      }`}
                      aria-label={`Navigate to ${category.label}`}
                      aria-current={isActive ? 'page' : undefined}
                      style={{ minHeight: '60px' }}
                    >
                      <div className="relative mb-1">
                        <IconComponent
                          className={`h-6 w-6 transition-all duration-200 ${
                            isActive ? 'scale-110' : ''
                          }`}
                        />
                        {category.badge && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-ocean-400" />
                        )}
                      </div>
                      <span className={`text-xs font-medium leading-tight text-center ${
                        isActive ? 'text-ocean-600' : 'text-gray-500'
                      }`}>
                        {category.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-20 md:pb-8" role="main" data-testid="main-content">
        {/* Page Header with Active Tab Info */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              {(() => {
                // Find active tab in navigation categories
                let activeTabData = navigationCategories.find(cat => cat.id === activeTab);
                if (!activeTabData) {
                  // Look in dropdown items
                  for (const category of navigationCategories) {
                    if (category.items) {
                      const found = category.items.find(item => item.id === activeTab);
                      if (found) {
                        activeTabData = found;
                        break;
                      }
                    }
                  }
                }
                const IconComponent = activeTabData?.icon;
                return (
                  <>
                    {IconComponent && (
                      <div className="relative">
                        <IconComponent className="h-6 w-6 lg:h-7 lg:w-7 text-ocean-600" />
                        {activeTabData?.badge && (
                          <span className="absolute -top-2 -right-2 text-xs bg-ocean-100 text-ocean-700 px-1.5 py-0.5 rounded-full font-bold">
                            {activeTabData.badge}
                          </span>
                        )}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl lg:text-3xl font-bold text-gray-900 leading-tight">
                        {activeTabData?.label || 'Ocean Conservation'}
                      </h2>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Quick Navigation Breadcrumb for Mobile */}
            <div className="md:hidden">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {navigationCategories.length} sections
              </span>
            </div>
          </div>

          <p className="text-gray-600 text-sm lg:text-base leading-relaxed">
            {(() => {
              let desc = navigationCategories.find(cat => cat.id === activeTab)?.description;
              if (!desc) {
                for (const category of navigationCategories) {
                  if (category.items) {
                    const found = category.items.find(item => item.id === activeTab);
                    if (found) {
                      desc = found.description;
                      break;
                    }
                  }
                }
              }
              return desc || 'Explore ocean conservation tools and data';
            })()}
          </p>
        </div>

        {locationError && (
          <AlertBanner 
            type="error" 
            message={`Location Error: ${locationError}. You can manually enter a ZIP code in the header.`}
          />
        )}
        
          {/* Content Area */}
          <div className="transition-all duration-300 ease-in-out">
            {renderTabContent()}
          </div>
        </main>

        {/* Accessibility Settings Modal */}
        <AccessibilitySettings 
          isOpen={showAccessibilitySettings}
          onClose={() => setShowAccessibilitySettings(false)}
        />

        {/* Privacy Control Panel */}
        <PrivacyControlPanel 
          isOpen={showPrivacyControls}
          onClose={() => setShowPrivacyControls(false)}
        />

        {/* Notification Settings Modal */}
        {showNotificationSettings && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowNotificationSettings(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowNotificationSettings(false);
              }
            }}
            tabIndex={-1}
          >
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
                <button
                  onClick={() => setShowNotificationSettings(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  aria-label="Close notification settings"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <NotificationSettings />
              </div>
            </div>
          </div>
        )}

        {/* Authentication Modal */}
        {showAuth && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <PrivacyFirstAuth 
                onComplete={(authResult) => {
                  console.log('Authentication completed:', authResult);
                  setShowAuth(false);
                  
                  // Wait a moment for auth state to update, then navigate
                  setTimeout(() => {
                    setActiveTab('community');
                    setActiveSubTab(prev => ({...prev, 'community': 'family-safety'}));
                  }, 500);
                }}
                showFamilyFeatures={true}
              />
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <NotificationContainer 
          notifications={notifications} 
          onRemove={removeNotification} 
        />
        
        {/* Offline Status Indicator */}
        {/* <OfflineIndicator /> */}

        {/* Footer */}
        <footer className="bg-gray-800 text-white mt-12" role="contentinfo">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-400">
                © 2025 OceanAware Guardian - AI-Powered Ocean Conservation Platform
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Built with AI for ocean conservation and education
              </p>
            </div>
          </div>
        </footer>
    </div>
  );
};

function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <StorageProvider>
          <ProfileProvider>
            <FamilyProvider>
              <AppContent />
            </FamilyProvider>
          </ProfileProvider>
        </StorageProvider>
      </AuthProvider>
    </AccessibilityProvider>
  );
}

export default App;