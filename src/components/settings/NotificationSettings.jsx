import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings, TestTube, Shield, Clock, MapPin } from 'lucide-react';
import pushNotificationService from '../../services/pushNotificationService';
import { useNotifications } from '../ui/EnhancedNotification';

/**
 * Notification Settings Component
 * Allows users to configure push notifications and test them
 */
const NotificationSettings = () => {
  const [subscription, setSubscription] = useState(null);
  const [preferences, setPreferences] = useState(pushNotificationService.preferences);
  const [loading, setLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { showSuccess, showError, showInfo } = useNotifications();

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported(pushNotificationService.isNotificationSupported());
    
    // Load current subscription status
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const currentSubscription = await pushNotificationService.getSubscription();
      setSubscription(currentSubscription);
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const newSubscription = await pushNotificationService.subscribe();
      setSubscription(newSubscription);
      showSuccess(
        'Notifications Enabled!', 
        'You will now receive wildfire alerts and safety notifications.'
      );
    } catch (error) {
      console.error('Subscription failed:', error);
      showError(
        'Subscription Failed', 
        error.message === 'Notification permission denied' 
          ? 'Please enable notifications in your browser settings and try again.'
          : 'Unable to set up notifications. Please check your browser settings.'
      );
    }
    setLoading(false);
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      await pushNotificationService.unsubscribe();
      setSubscription(null);
      showInfo('Notifications Disabled', 'You will no longer receive push notifications.');
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      showError('Unsubscribe Failed', 'Unable to disable notifications.');
    }
    setLoading(false);
  };

  const handleTestNotification = async () => {
    try {
      await pushNotificationService.sendTestNotification();
      showSuccess('Test Sent!', 'Check for a test notification in a few seconds.');
    } catch (error) {
      console.error('Test notification failed:', error);
      showError('Test Failed', error.message || 'Unable to send test notification.');
    }
  };


  const handleServerHealthCheck = async () => {
    try {
      const response = await fetch('/api/notifications/stats');
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Server stats:', data);
        
        showSuccess(
          'Server Connected!', 
          `Backend server is running. Subscriptions: ${data.stats?.totalSubscriptions || 0}, VAPID: ${data.stats?.vapidConfigured ? 'OK' : 'Missing'}`
        );
      } else {
        showError('Server Error', `Backend returned ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      showError('Connection Failed', 'Cannot connect to backend server. Make sure it\'s running on port 3001.');
    }
  };

  const handlePreferenceChange = (category, key, value) => {
    const newPreferences = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [key]: value
      }
    };
    setPreferences(newPreferences);
    pushNotificationService.savePreferences(newPreferences);
  };

  if (!isSupported) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <BellOff className="w-6 h-6 text-gray-500" />
          <h2 className="text-xl font-bold text-gray-800">Push Notifications</h2>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Push notifications are not supported in your current browser or device. 
            You can still receive in-app alerts while using EcoQuest.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Push Notifications</h2>
        </div>
        <div className="flex items-center space-x-2">
          {subscription && (
            <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
      </div>

      {/* Main Toggle */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800">Enable Push Notifications</h3>
            <p className="text-sm text-gray-600">
              Receive wildfire alerts, safety updates, and emergency notifications
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleServerHealthCheck}
                className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm">Check Server</span>
              </button>
              {subscription && (
                <button
                  onClick={handleTestNotification}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <TestTube className="w-4 h-4" />
                  <span className="text-sm">Test</span>
                </button>
              )}
            </div>
            <button
              onClick={subscription ? handleUnsubscribe : handleSubscribe}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                subscription
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {loading ? 'Working...' : subscription ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {subscription && (
          <div className="text-xs text-gray-500">
            <strong>Endpoint:</strong> {subscription.endpoint.substring(0, 60)}...
          </div>
        )}
      </div>

      {/* Notification Type Preferences */}
      {subscription && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Notification Types
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(preferences.types).map(([type, enabled]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium capitalize text-gray-800">
                    {type.replace('-', ' ')} Alerts
                  </span>
                  <p className="text-xs text-gray-600">
                    {getTypeDescription(type)}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handlePreferenceChange('types', type, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Settings */}
      {subscription && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Priority Levels
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(preferences.priorities).map(([priority, enabled]) => (
              <div key={priority} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className={`font-medium capitalize ${getPriorityColor(priority)}`}>
                    {priority} Priority
                  </span>
                  <p className="text-xs text-gray-600">
                    {getPriorityDescription(priority)}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handlePreferenceChange('priorities', priority, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location Settings */}
      {subscription && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Location Settings
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-800">Follow My Location</span>
                <p className="text-xs text-gray-600">
                  Automatically update alert area when you move
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.location.followLocation}
                  onChange={(e) => handlePreferenceChange('location', 'followLocation', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Radius: {preferences.location.radius} miles
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={preferences.location.radius}
                onChange={(e) => handlePreferenceChange('location', 'radius', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5 miles</span>
                <span>100 miles</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiet Hours */}
      {subscription && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Quiet Hours
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-800">Enable Quiet Hours</span>
                <p className="text-xs text-gray-600">
                  Only critical alerts during specified hours
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.schedules.quietHours.enabled}
                  onChange={(e) => handlePreferenceChange('schedules', 'quietHours', {
                    ...preferences.schedules.quietHours,
                    enabled: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {preferences.schedules.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.schedules.quietHours.start}
                    onChange={(e) => handlePreferenceChange('schedules', 'quietHours', {
                      ...preferences.schedules.quietHours,
                      start: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.schedules.quietHours.end}
                    onChange={(e) => handlePreferenceChange('schedules', 'quietHours', {
                      ...preferences.schedules.quietHours,
                      end: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Browser Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Testing Instructions</h4>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Click "Enable" to subscribe to notifications</li>
          <li>Allow notifications when your browser prompts you</li>
          <li>Click "Test" to send a test push notification</li>
          <li>Check your system's notification area for the test message</li>
        </ol>
        
        <div className="mt-3 p-3 bg-blue-100 rounded border-l-4 border-blue-400">
          <h5 className="font-medium text-blue-800 mb-1">Mac Chrome Troubleshooting:</h5>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li><strong>System Settings:</strong> System Preferences → Notifications → Chrome → Allow</li>
            <li><strong>Chrome Settings:</strong> Settings → Privacy & Security → Site Settings → Notifications → Allow</li>
            <li><strong>Do Not Disturb:</strong> Disable Do Not Disturb mode in Mac System Preferences</li>
            <li><strong>Focus Modes:</strong> Check if Mac Focus modes are blocking notifications</li>
            <li><strong>Service Worker:</strong> Check DevTools → Application → Service Workers</li>
            <li><strong>Console Logs:</strong> Watch DevTools Console for "🔔 Service Worker" messages</li>
          </ul>
        </div>
        
        <p className="text-xs text-blue-600 mt-2">
          <strong>Still not working?</strong> Try: chrome://settings/content/notifications and ensure this site is allowed.
        </p>
      </div>
    </div>
  );
};

// Helper functions
const getTypeDescription = (type) => {
  const descriptions = {
    fire: 'Active wildfire alerts and updates',
    smoke: 'Air quality and smoke warnings',
    evacuation: 'Emergency evacuation orders',
    'air-quality': 'Air quality index updates',
    weather: 'Weather condition alerts',
    uv: 'UV index warnings'
  };
  return descriptions[type] || 'General notifications';
};

const getPriorityColor = (priority) => {
  const colors = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    medium: 'text-yellow-600',
    low: 'text-green-600'
  };
  return colors[priority] || 'text-gray-600';
};

const getPriorityDescription = (priority) => {
  const descriptions = {
    critical: 'Life-threatening emergencies',
    high: 'Immediate action required',
    medium: 'Important updates',
    low: 'General information'
  };
  return descriptions[priority] || 'Standard notifications';
};

export default NotificationSettings;