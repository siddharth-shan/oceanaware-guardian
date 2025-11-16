import { AlertTriangle, Navigation, Phone, Users, Brain, Target } from 'lucide-react';
import { useAccessibility } from '../accessibility/AccessibilityProvider';

/**
 * Emergency Action Bar - Always visible quick action buttons
 * Provides one-tap access to critical features during emergencies
 */
const EmergencyActionBar = ({ emergencyLevel, onNavigateToTab, onEmergencyCall }) => {
  const { translate } = useAccessibility();
  const getActionBarStyle = () => {
    switch (emergencyLevel) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'watch':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const actions = [
    {
      id: 'ai-scanner',
      label: translate('action.scan-risk', 'AI Scanner'),
      icon: Brain,
      description: translate('action.scan-risk', 'Scan environment for risks'),
      onClick: () => onNavigateToTab('ai-analysis'),
      priority: emergencyLevel === 'normal' ? 'normal' : 'high'
    },
    {
      id: 'safety-quests',
      label: 'Safety Guide',
      icon: Target,
      description: 'Emergency preparedness steps',
      onClick: () => onNavigateToTab('quests'),
      priority: 'normal'
    },
    {
      id: 'evacuation',
      label: translate('action.evacuate', 'Live Alerts'),
      icon: Navigation,
      description: translate('action.evacuate', 'View emergency alerts and safety info'),
      onClick: () => {
        onNavigateToTab('fire-monitoring');
        // Navigate to alerts subtab after a brief delay to ensure main tab loads
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('navigateSubTab', { 
            detail: { tab: 'fire-monitoring', subTab: 'alerts' } 
          }));
        }, 100);
      },
      priority: emergencyLevel === 'critical' ? 'critical' : 'normal'
    },
    {
      id: 'emergency-call',
      label: translate('action.call-911', 'Call 911'),
      icon: Phone,
      description: translate('action.call-911', 'Emergency services'),
      onClick: onEmergencyCall || (() => window.open('tel:911')),
      priority: emergencyLevel === 'critical' ? 'critical' : 'normal'
    },
    {
      id: 'community',
      label: translate('action.check-in', 'Check In'),
      icon: Users,
      description: translate('action.check-in', 'Community safety check'),
      onClick: () => onNavigateToTab('community-hub'),
      priority: emergencyLevel === 'critical' ? 'high' : 'normal'
    }
  ];

  const criticalActions = actions.filter(action => action.priority === 'critical');
  const highPriorityActions = actions.filter(action => action.priority === 'high');
  const normalActions = actions.filter(action => action.priority === 'normal');

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-gray-600" />
          Quick Actions
        </h3>
        <span className="text-xs px-2 py-1 rounded-full font-medium"
              style={{
                backgroundColor: emergencyLevel === 'critical' ? 'var(--color-fire-100)' :
                                emergencyLevel === 'warning' ? 'var(--color-warning-100)' :
                                emergencyLevel === 'watch' ? 'var(--color-warning-100)' :
                                'var(--color-success-100)',
                color: emergencyLevel === 'critical' ? 'var(--color-fire-800)' :
                       emergencyLevel === 'warning' ? 'var(--color-warning-800)' :
                       emergencyLevel === 'watch' ? 'var(--color-warning-800)' :
                       'var(--color-success-800)'
              }}>
          {emergencyLevel === 'critical' ? 'EMERGENCY' :
           emergencyLevel === 'warning' ? 'WARNING' :
           emergencyLevel === 'watch' ? 'WATCH' : 'NORMAL'}
        </span>
      </div>

      {/* Emergency Actions First - Larger Touch Targets */}
      {emergencyLevel === 'critical' && criticalActions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {criticalActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="p-4 md:p-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
              style={{
                backgroundColor: 'var(--color-emergency-critical)',
                color: 'white'
              }}
              title={action.description}
              aria-label={`Emergency action: ${action.label}. ${action.description}`}
              style={{ minHeight: '72px' }} // Ensure large touch target
            >
              <action.icon className="h-6 w-6 md:h-8 md:w-8" />
              <span className="text-base md:text-lg font-bold">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* High Priority Actions - Medium Touch Targets */}
      {(emergencyLevel === 'critical' || emergencyLevel === 'warning') && highPriorityActions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {highPriorityActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="p-3 rounded-lg transition-all duration-200 flex flex-col items-center justify-center space-y-2 text-center shadow-md hover:shadow-lg"
              style={{
                backgroundColor: 'var(--color-warning-100)',
                borderColor: 'var(--color-warning-300)',
                color: 'var(--color-warning-800)',
                border: '2px solid'
              }}
              title={action.description}
              style={{ minHeight: '60px' }} // Good touch target size
            >
              <action.icon className="h-5 w-5" />
              <span className="text-sm font-semibold">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Normal Actions - Responsive Layout */}
      <div className={`grid gap-2 ${
        emergencyLevel === 'normal' 
          ? 'grid-cols-3 md:grid-cols-5' 
          : 'grid-cols-2 md:grid-cols-4'
      }`}>
        {normalActions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`p-3 rounded-lg transition-all duration-200 flex flex-col items-center justify-center space-y-1 text-center ${
              emergencyLevel === 'normal' 
                ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
            }`}
            title={action.description}
            style={{ minHeight: '52px' }} // Consistent touch target
          >
            <action.icon className="h-4 w-4" />
            <span className="text-xs font-medium leading-tight">{action.label}</span>
          </button>
        ))}
      </div>

      {emergencyLevel === 'critical' && (
        <div className="mt-3 p-2 bg-red-100 rounded-lg">
          <p className="text-red-800 text-xs text-center">
            🚨 Emergency detected. Follow evacuation orders and stay safe.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmergencyActionBar;