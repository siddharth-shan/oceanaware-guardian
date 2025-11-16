import { AlertTriangle, Navigation, Phone, Users, Brain, Target, Clock } from 'lucide-react';
import { useAccessibility } from '../accessibility/AccessibilityProvider';

/**
 * Enhanced Emergency Action Bar - Modern UX redesign
 * Implements progressive disclosure, hero emergency actions, and improved visual hierarchy
 * Based on UX review recommendations for 2025 emergency UI patterns
 */
const EnhancedEmergencyActionBar = ({ emergencyLevel, onNavigateToTab, onEmergencyCall, lastUpdate }) => {
  const { translate } = useAccessibility();

  const getEmergencyStatusConfig = () => {
    const statusConfig = {
      critical: {
        text: "EMERGENCY ACTIVE",
        description: "Immediate action required",
        color: "var(--color-emergency-critical)",
        bgColor: "var(--color-fire-100)",
        pulse: true
      },
      warning: {
        text: "WARNING LEVEL",
        description: "Heightened alert status",
        color: "var(--color-emergency-warning)", 
        bgColor: "var(--color-warning-100)",
        pulse: false
      },
      watch: {
        text: "WATCH LEVEL",
        description: "Monitor conditions",
        color: "var(--color-emergency-watch)",
        bgColor: "var(--color-warning-100)",
        pulse: false
      },
      normal: {
        text: "NORMAL CONDITIONS",
        description: "No immediate threats",
        color: "var(--color-success-600)",
        bgColor: "var(--color-success-100)",
        pulse: false
      }
    };
    
    return statusConfig[emergencyLevel] || statusConfig.normal;
  };

  const getEmergencyGuidanceText = (level) => {
    switch (level) {
      case 'critical':
        return 'Emergency detected. Follow evacuation orders and stay safe.';
      case 'warning':
        return 'Fire warning active. Monitor alerts and prepare for action.';
      case 'watch':
        return 'Weather watch active. Stay informed of changing conditions.';
      default:
        return 'No immediate threats detected. System monitoring continues.';
    }
  };

  const getEnhancedActions = () => [
    {
      id: 'emergency-call',
      label: 'Call 911',
      destination: 'Emergency Services',
      icon: Phone,
      description: 'Connect to emergency services immediately',
      onClick: onEmergencyCall || (() => window.open('tel:911')),
      category: 'emergency',
      priority: emergencyLevel === 'critical' ? 'critical' : 'normal'
    },
    {
      id: 'evacuation-info',
      label: 'Live Alerts',
      destination: 'Fire Monitoring',
      icon: Navigation,
      description: 'View evacuation routes and emergency alerts',
      onClick: () => {
        onNavigateToTab('fire-monitoring');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('navigateSubTab', { 
            detail: { tab: 'fire-monitoring', subTab: 'alerts' } 
          }));
        }, 100);
      },
      category: 'emergency',
      priority: emergencyLevel === 'critical' ? 'critical' : 'normal'
    },
    {
      id: 'ai-risk-scan',
      label: 'Risk Scanner',
      destination: 'AI Risk Analysis',
      icon: Brain,
      description: 'Scan your area for immediate risks',
      onClick: () => {
        onNavigateToTab('fire-monitoring');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('navigateSubTab', { 
            detail: { tab: 'fire-monitoring', subTab: 'quick-scan' } 
          }));
        }, 100);
      },
      category: 'monitoring',
      priority: emergencyLevel === 'normal' ? 'normal' : 'high'
    },
    {
      id: 'family-checkin',
      label: 'Family Check-in',
      destination: 'Family Safety Hub',
      icon: Users,
      description: 'Check on family members and report status',
      onClick: () => {
        onNavigateToTab('community');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('navigateSubTab', { 
            detail: { tab: 'community', subTab: 'family-safety' } 
          }));
        }, 100);
      },
      category: 'communication',
      priority: emergencyLevel === 'critical' ? 'high' : 'normal'
    },
    {
      id: 'safety-guide',
      label: 'Safety Steps',
      destination: 'Emergency Preparedness',
      icon: Target,
      description: 'Follow step-by-step safety instructions',
      onClick: () => onNavigateToTab('safety-prep'),
      category: 'guidance',
      priority: 'normal'
    }
  ];

  const actions = getEnhancedActions();
  const criticalActions = actions.filter(action => action.priority === 'critical');
  const highPriorityActions = actions.filter(action => action.priority === 'high');
  const normalActions = actions.filter(action => action.priority === 'normal');
  const statusConfig = getEmergencyStatusConfig();

  const HeroActionButton = ({ action }) => (
    <button
      onClick={action.onClick}
      className="hero-action-button group"
      title={action.description}
      aria-label={`Emergency action: ${action.label}. ${action.description}`}
      style={{
        minHeight: '56px',
        background: 'var(--color-emergency-critical)',
        color: 'white'
      }}
    >
      <action.icon className="h-5 w-5 flex-shrink-0" />
      <div className="flex flex-col">
        <span className="text-sm font-bold leading-tight">{action.label}</span>
        <div className="text-xs opacity-90">{action.destination}</div>
      </div>
    </button>
  );

  const QuickActionCard = ({ action }) => (
    <button
      onClick={action.onClick}
      className="quick-action-card group"
      title={action.description}
      aria-label={`${action.label}: ${action.description}`}
    >
      <action.icon className="h-5 w-5 mb-2" style={{ color: 'var(--color-neutral-600)' }} />
      <span className="text-xs font-medium leading-tight text-center">{action.label}</span>
      <div className="text-xs opacity-70 mt-1">{action.destination}</div>
    </button>
  );

  return (
    <div className="emergency-action-bar">
      {/* Emergency Status Header */}
      <div className="emergency-status-header">
        <div className="status-indicator">
          <div 
            className={`status-pulse ${statusConfig.pulse ? 'pulse-active' : ''}`} 
            style={{ backgroundColor: statusConfig.color }}
          />
          <div>
            <span className="status-text" style={{ color: statusConfig.color }}>
              {statusConfig.text}
            </span>
            <div className="status-description">
              {statusConfig.description}
            </div>
          </div>
        </div>
        <div className="last-updated">
          <Clock className="h-4 w-4" />
          <span>Updated {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'now'}</span>
        </div>
      </div>

      {/* Emergency Actions Section */}
      {emergencyLevel === 'critical' && criticalActions.length > 0 && (
        <div className="hero-emergency-section">
          <div className="emergency-context-bar">
            <AlertTriangle className="h-5 w-5" style={{ color: 'var(--color-emergency-critical)' }} />
            <p className="emergency-guidance">
              {getEmergencyGuidanceText(emergencyLevel)}
            </p>
          </div>
          
          <div className="hero-actions-grid">
            {criticalActions.map((action) => (
              <HeroActionButton key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}

      {/* High Priority Actions */}
      {(emergencyLevel === 'critical' || emergencyLevel === 'warning') && highPriorityActions.length > 0 && (
        <div className="high-priority-section">
          <h4 className="section-title">Priority Actions</h4>
          <div className="high-priority-grid">
            {highPriorityActions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className="high-priority-button"
                title={action.description}
                style={{ minHeight: '72px' }}
              >
                <action.icon className="h-6 w-6 mb-2" style={{ color: 'var(--color-warning-700)' }} />
                <span className="text-sm font-semibold">{action.label}</span>
                <div className="text-xs opacity-80 mt-1">{action.destination}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Access Actions */}
      <div className="quick-actions-section">
        <h4 className="section-title">Quick Actions</h4>
        <div className="actions-carousel">
          {normalActions.map((action) => (
            <QuickActionCard key={action.id} action={action} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedEmergencyActionBar;