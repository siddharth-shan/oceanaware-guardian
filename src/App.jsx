import { useState, useEffect } from 'react';
import './index.css';
import './styles/accessibility.css';
import './styles/themes.css';
import { Home, Brain, Map, Target, AlertTriangle, Zap, Users, Settings, Activity, Bell, X, Shield, MapPin } from 'lucide-react';

// Import components
import WeatherWidget from './components/weather/WeatherWidget';
import HazardDetector from './components/ai/HazardDetector';
import QuickRiskAssessment from './components/ai/QuickRiskAssessment';
import AlertBanner from './components/alerts/AlertBanner';
import AlertsDashboard from './components/alerts/AlertsDashboard';
import SafetyQuestHub from './components/quests/SafetyQuestHub';
import LoadingSpinner from './components/ui/LoadingSpinner';
import LocationInput from './components/location/LocationInput';
import EnhancedDashboard from './components/dashboard/EnhancedDashboard';
import PredictiveDashboard from './components/prediction/PredictiveDashboard';
import CommunityImpact from './pages/CommunityImpact';
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
// import OfflineIndicator from './components/offline/OfflineIndicator'; // Temporarily disabled

// Import services
import { useOffline } from './hooks/useOfflineSimple';
import { useLocationManager } from './hooks/useLocationManager';
import { useWeatherData } from './hooks/useWeatherData';
import { useAlerts } from './hooks/useAlerts';
import { useAccessibility } from './components/accessibility/AccessibilityProvider';
import { useAuth } from './services/auth/AuthContext';
import { calculateEmergencyLevel } from './utils/emergencyHelpers';

const AppContent = () => {
  const { translate } = useAccessibility();
  const [activeTab, setActiveTab] = useState('dashboard');
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
  
  // Get alerts data for emergency level calculation
  const { 
    alerts, 
    getHighPriorityAlerts,
    getAlertsByType,
    getActiveAlertsCount 
  } = useAlerts(location);

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

  // Calculate emergency level based on alerts and community reports
  const getEmergencyLevel = () => {
    if (!getHighPriorityAlerts || !getAlertsByType || !getActiveAlertsCount) {
      return 'normal';
    }

    try {
      const highPriorityAlerts = getHighPriorityAlerts() || [];
      const fireAlerts = getAlertsByType('fire') || [];
      const nearbyFires = fireAlerts.filter(alert => alert?.data?.distance <= 25);
      
      // Convert alerts to reports format for emergency calculation
      const alertsAsReports = [
        ...nearbyFires.map(alert => ({
          type: 'fire-spotting',
          urgentLevel: 'critical',
          timestamp: new Date().toISOString()
        })),
        ...highPriorityAlerts.map(alert => ({
          type: 'unsafe-conditions', 
          urgentLevel: 'high',
          timestamp: new Date().toISOString()
        }))
      ];
      
      // Use the centralized emergency level calculation
      return calculateEmergencyLevel(alertsAsReports, alerts, { userLocation: location });
    } catch (error) {
      console.error('Error calculating emergency level:', error);
      return 'normal';
    }
  };

  // Streamlined navigation for Congressional App Challenge - focusing on top 5 winning features
  const tabs = [
    { 
      id: 'dashboard', 
      label: translate('nav.dashboard', 'Dashboard'), 
      icon: Home,
      description: translate('nav.dashboard', 'Real-time overview & emergency status'),
      highlight: true // Key feature #1: Real-time integration
    },
    { 
      id: 'fire-monitoring', 
      label: 'Fire Monitoring', 
      icon: Brain,
      description: 'AI-powered fire risk assessment & real-time alerts',
      highlight: true, // Key features #1 & #2: AI analysis & real-time data
      subFeatures: ['prediction', 'ai-analysis', 'alerts']
    },
    { 
      id: 'community', 
      label: translate('nav.community', 'Community'), 
      icon: Users,
      description: translate('nav.community', 'Hazard reports & family safety coordination'),
      highlight: true, // Key feature #2: Community coordination
      subFeatures: ['community-hub']
    },
    { 
      id: 'impact-analysis', 
      label: 'Impact Analysis', 
      icon: Map,
      description: 'Community vulnerability & risk analysis mapping',
      highlight: true, // Key feature #3: Impact analysis
      subFeatures: []
    },
    { 
      id: 'safety-prep', 
      label: translate('nav.safety-quests', 'Safety Prep'), 
      icon: Target,
      description: translate('nav.safety-quests', 'Gamified safety education & preparedness'),
      highlight: true, // Key feature #4: Gamified education
      subFeatures: ['quests']
    },
  ];

  // Sub-navigation state for consolidated tabs
  const [activeSubTab, setActiveSubTab] = useState({
    'fire-monitoring': 'quick-scan',
    'community': 'hazard-reports'
  });

  // Handle sub-tab navigation from showcase
  useEffect(() => {
    const handleSubTabNavigation = (event) => {
      const { tab, subTab } = event.detail;
      if (subTab) {
        setActiveSubTab(prev => ({...prev, [tab]: subTab}));
      }
    };

    window.addEventListener('navigateSubTab', handleSubTabNavigation);
    return () => window.removeEventListener('navigateSubTab', handleSubTabNavigation);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        try {
          return (
            <EnhancedDashboard 
              userLocation={location}
              onLocationChange={updateLocation}
              onNavigateToAlerts={() => {
                setActiveTab('fire-monitoring');
                setActiveSubTab({...activeSubTab, 'fire-monitoring': 'alerts'});
              }}
              onNavigateToTab={(tab) => {
                // Route old tab navigation to new consolidated structure
                if (tab === 'alerts' || tab === 'prediction' || tab === 'ai-analysis') {
                  setActiveTab('fire-monitoring');
                  setActiveSubTab({...activeSubTab, 'fire-monitoring': tab});
                } else if (tab === 'community-hub' || tab === 'community-impact') {
                  setActiveTab('community');
                  setActiveSubTab({...activeSubTab, 'community': tab});
                } else if (tab === 'quests') {
                  setActiveTab('safety-prep');
                } else {
                  setActiveTab(tab);
                }
              }}
            />
          );
        } catch (error) {
          console.error('Enhanced Dashboard Error:', error);
          return (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-red-800 mb-4">Dashboard Error</h2>
                <p className="text-red-600">Enhanced dashboard failed to load: {error.message}</p>
                <p className="text-red-600 text-sm mt-2">Falling back to basic dashboard...</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Basic Dashboard</h2>
                {location && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Location: {location.displayName}</h3>
                    <p className="text-blue-600">{location.lat}, {location.lng}</p>
                  </div>
                )}
              </div>
              <WeatherWidget data={weatherData} />
            </div>
          );
        }
      
      case 'fire-monitoring':
        return renderFireMonitoringContent();
      
      case 'community':
        return renderCommunityContent();
      
      case 'impact-analysis':
        return (
          <HooksErrorBoundary 
            onNavigateHome={() => setActiveTab('dashboard')}
            showDetails={process.env.NODE_ENV === 'development'}
          >
            <CommunityImpact userLocation={location} />
          </HooksErrorBoundary>
        );
      
      case 'safety-prep':
        return (
          <SafetyQuestHub userLocation={location} />
        );
      
      default:
        return <div>Select a tab to get started</div>;
    }
  };

  // Render Fire Monitoring content with sub-navigation
  const renderFireMonitoringContent = () => {
    const currentSubTab = activeSubTab['fire-monitoring'] || 'prediction';
    
    const subTabs = [
      { id: 'quick-scan', label: 'Quick Scan', icon: Target },
      { id: 'prediction', label: 'AI Prediction', icon: Zap },
      { id: 'ai-analysis', label: 'Full Analysis', icon: Brain },
      { id: 'alerts', label: 'Live Alerts', icon: AlertTriangle }
    ];

    return (
      <div className="space-y-4">
        {/* Sub-navigation - Clean design */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-center space-x-1 p-3 overflow-x-auto scrollbar-hide">
            {subTabs.map((subTab, index) => {
              const Icon = subTab.icon;
              const isActive = currentSubTab === subTab.id;
              return (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab({...activeSubTab, 'fire-monitoring': subTab.id})}
                  className={`flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 min-w-0 flex-1 max-w-[120px] ${
                    isActive 
                      ? 'shadow-sm border' 
                      : 'hover:shadow-sm'
                  }`}
                  style={{ 
                    minHeight: '60px',
                    backgroundColor: isActive ? 'var(--color-fire-50)' : 'transparent',
                    borderColor: isActive ? 'var(--color-fire-200)' : 'transparent',
                    color: isActive ? 'var(--color-fire-700)' : 'var(--color-neutral-600)'
                  }}
                >
                  <Icon className="h-5 w-5 mb-1" 
                        style={{ color: isActive ? 'var(--color-fire-600)' : 'var(--color-neutral-500)' }} />
                  <span className="leading-tight text-center">{subTab.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 rounded-full mt-1" 
                         style={{ backgroundColor: 'var(--color-fire-500)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div>
          {currentSubTab === 'quick-scan' && <QuickRiskAssessment />}
          {currentSubTab === 'prediction' && <PredictiveDashboard userLocation={location} />}
          {currentSubTab === 'ai-analysis' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <HazardDetector />
            </div>
          )}
          {currentSubTab === 'alerts' && <AlertsDashboard userLocation={location} />}
        </div>
      </div>
    );
  };

  // Render Community content with sub-navigation
  const renderCommunityContent = () => {
    const currentSubTab = activeSubTab['community'] || 'hazard-reports';
    
    const subTabs = [
      { id: 'hazard-reports', label: 'Hazard Reports', icon: AlertTriangle },
      { id: 'family-safety', label: 'Family Safety', icon: Users }
    ];

    return (
      <HooksErrorBoundary 
        onNavigateHome={() => setActiveTab('dashboard')}
        showDetails={process.env.NODE_ENV === 'development'}
      >
        <div className="space-y-4">
          {/* Sub-navigation - Clean design */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-center space-x-1 p-3 overflow-x-auto scrollbar-hide">
              {subTabs.map((subTab, index) => {
                const Icon = subTab.icon;
                const isActive = currentSubTab === subTab.id;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveSubTab({...activeSubTab, 'community': subTab.id})}
                    className={`flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 min-w-0 flex-1 max-w-[120px] ${
                      isActive 
                        ? 'shadow-sm border' 
                        : 'hover:shadow-sm'
                    }`}
                    style={{ 
                      minHeight: '60px',
                      backgroundColor: isActive ? 'var(--color-info-50)' : 'transparent',
                      borderColor: isActive ? 'var(--color-info-200)' : 'transparent',
                      color: isActive ? 'var(--color-info-700)' : 'var(--color-neutral-600)'
                    }}
                  >
                    <Icon className="h-5 w-5 mb-1" 
                          style={{ color: isActive ? 'var(--color-info-600)' : 'var(--color-neutral-500)' }} />
                    <span className="leading-tight text-center">{subTab.label}</span>
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 rounded-full mt-1" 
                           style={{ backgroundColor: 'var(--color-info-500)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content - Each tab wrapped individually for better error isolation */}
          <div>
            {currentSubTab === 'hazard-reports' && (
              <HooksErrorBoundary 
                onNavigateHome={() => setActiveTab('dashboard')}
                showDetails={process.env.NODE_ENV === 'development'}
              >
                <CommunityHub 
                  userLocation={location}
                  emergencyLevel={getEmergencyLevel()}
                />
              </HooksErrorBoundary>
            )}
            {currentSubTab === 'family-safety' && (
              <HooksErrorBoundary 
                onNavigateHome={() => setActiveTab('dashboard')}
                showDetails={process.env.NODE_ENV === 'development'}
              >
                {needsAuthForFamily() ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-blue-900 mb-2">
                      Family Safety Features
                    </h2>
                    <p className="text-blue-700 mb-4">
                      Enable family coordination and emergency communication with privacy protection.
                    </p>
                    <button
                      onClick={() => setShowAuth(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Set Up Family Safety
                    </button>
                  </div>
                ) : (
                  <FamilySafetyHub />
                )}
              </HooksErrorBoundary>
            )}
          </div>
        </div>
      </HooksErrorBoundary>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-emergency-normal flex items-center justify-center">
        <div className="enhanced-card p-8">
          <LoadingSpinner 
            size="xl" 
            enhanced={true} 
            text="Initializing EcoQuest Wildfire Watch System..." 
          />
        </div>
      </div>
    );
  }

  const emergencyLevel = getEmergencyLevel();
  
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
        <header className="bg-gradient-to-r from-orange-500 to-orange-700 text-white shadow-xl" role="banner" data-testid="app-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-18 lg:h-20">
              <div className="flex items-center">
                <img 
                  src="/icons/ecoquest_fw_logo.png" 
                  alt="EcoQuest Wildfire Watch Logo" 
                  className="h-10 w-10 lg:h-12 lg:w-12 mr-3 lg:mr-4 rounded-full shadow-lg ring-2 ring-white/20"
                />
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
                    {translate('app.title', 'EcoQuest Wildfire Watch')}
                  </h1>
                  <p className="text-orange-100 text-xs lg:text-sm font-medium hidden sm:block">
                    {translate('app.subtitle', 'Real-time wildfire monitoring & safety')}
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
                    AI-Powered Fire Safety
                  </div>
                  <div className="text-xs text-orange-100">
                    Advanced Fire Detection System
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
              <div className="flex justify-center space-x-2 py-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group relative flex flex-col items-center px-6 py-4 text-base font-medium transition-all duration-200 min-w-0 rounded-lg hover:shadow-sm ${
                        isActive ? 'active' : ''
                      }`}
                      title={tab.description}
                      aria-label={`Navigate to ${tab.label}: ${tab.description}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="relative mb-1">
                        <IconComponent 
                          className={`h-6 w-6 transition-all duration-200 ${
                            isActive 
                              ? 'text-orange-600 scale-110' 
                              : 'text-gray-500 group-hover:text-orange-500 group-hover:scale-105'
                          }`} 
                        />
                        {tab.highlight && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full shadow-sm" 
                               style={{ backgroundColor: 'var(--color-fire-400)' }} />
                        )}
                      </div>
                      <span className={`text-sm font-semibold transition-all duration-200 ${
                        isActive 
                          ? 'text-orange-700' 
                          : 'text-gray-600 group-hover:text-orange-600'
                      }`}>
                        {tab.label}
                      </span>
                      
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-t-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
              <div className="flex justify-around py-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 transition-all duration-200 ${
                        isActive ? 'text-orange-600' : 'text-gray-500'
                      }`}
                      aria-label={`Navigate to ${tab.label}`}
                      aria-current={isActive ? 'page' : undefined}
                      style={{ minHeight: '60px' }} // Ensure proper touch target size
                    >
                      <div className="relative mb-1">
                        <IconComponent 
                          className={`h-6 w-6 transition-all duration-200 ${
                            isActive ? 'scale-110' : ''
                          }`} 
                        />
                        {tab.highlight && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full" 
                               style={{ backgroundColor: 'var(--color-fire-400)' }} />
                        )}
                      </div>
                      <span className={`text-xs font-medium leading-tight text-center ${
                        isActive ? 'text-orange-600' : 'text-gray-500'
                      }`}>
                        {tab.label}
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
                const activeTabData = tabs.find(tab => tab.id === activeTab);
                const IconComponent = activeTabData?.icon;
                return (
                  <>
                    {IconComponent && (
                      <div className="relative">
                        <IconComponent className="h-6 w-6 lg:h-7 lg:w-7 text-orange-600" />
                        {activeTabData?.highlight && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full shadow-sm" 
                               style={{ backgroundColor: 'var(--color-fire-400)' }} />
                        )}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl lg:text-3xl font-bold text-gray-900 leading-tight">
                        {activeTabData?.label}
                      </h2>
                    </div>
                  </>
                );
              })()}
            </div>
            
            {/* Quick Navigation Breadcrumb for Mobile */}
            <div className="md:hidden">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {tabs.findIndex(tab => tab.id === activeTab) + 1} of {tabs.length}
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm lg:text-base leading-relaxed">
            {tabs.find(tab => tab.id === activeTab)?.description}
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
                © 2024 EcoQuest Wildfire Watch - AI-Powered Fire Safety Platform
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Built with AI for wildfire safety and education
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