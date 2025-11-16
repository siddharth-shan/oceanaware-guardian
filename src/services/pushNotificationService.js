/**
 * Enhanced Push Notification Service
 * Manages subscription, preferences, and intelligent notification delivery
 */

class PushNotificationService {
  constructor() {
    this.subscription = null;
    this.preferences = this.loadPreferences();
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.notificationQueue = [];
    this.apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace('/api', '');
  }

  // Load user notification preferences
  loadPreferences() {
    const saved = localStorage.getItem('notification-preferences');
    return saved ? JSON.parse(saved) : {
      enabled: false,
      types: {
        fire: true,
        smoke: true,
        evacuation: true,
        'air-quality': true,
        weather: false,
        uv: false
      },
      priorities: {
        critical: true,
        high: true,
        medium: true,
        low: false
      },
      schedules: {
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00'
        }
      },
      location: {
        radius: 25, // miles
        followLocation: true
      }
    };
  }

  // Save user notification preferences
  savePreferences(preferences) {
    this.preferences = { ...this.preferences, ...preferences };
    localStorage.setItem('notification-preferences', JSON.stringify(this.preferences));
    
    // Update server-side preferences if subscribed
    if (this.subscription) {
      this.updateServerPreferences();
    }
  }

  // Check if notifications are supported
  isNotificationSupported() {
    return this.isSupported && 'Notification' in window;
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isNotificationSupported()) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      this.preferences.enabled = true;
      this.savePreferences(this.preferences);
      return true;
    } else {
      this.preferences.enabled = false;
      this.savePreferences(this.preferences);
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribe() {
    console.log('🔔 Starting push notification subscription process...');
    
    if (!this.isNotificationSupported()) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission !== 'granted') {
      console.log('🔔 Requesting notification permission...');
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Notification permission denied');
      }
    }

    try {
      // Register service worker if not already registered
      console.log('🔔 Getting service worker registration...');
      const registration = await this.getServiceWorkerRegistration();
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('🔔 Found existing subscription, unsubscribing first...');
        await existingSubscription.unsubscribe();
      }
      
      console.log('🔔 Creating new push subscription...');
      console.log('🔔 VAPID Public Key:', import.meta.env.VITE_VAPID_PUBLIC_KEY?.substring(0, 20) + '...');
      
      // Subscribe to push notifications
      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
      });

      console.log('🔔 Push subscription created successfully:', {
        endpoint: this.subscription.endpoint.substring(0, 50) + '...',
        hasKeys: !!this.subscription.keys
      });

      // Send subscription to server
      console.log('🔔 Sending subscription to server...');
      await this.sendSubscriptionToServer(this.subscription);
      
      this.preferences.enabled = true;
      this.savePreferences(this.preferences);

      console.log('✅ Successfully subscribed to push notifications');
      return this.subscription;
    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        await this.removeSubscriptionFromServer();
        this.subscription = null;
      }
      
      this.preferences.enabled = false;
      this.savePreferences(this.preferences);
      
      console.log('✅ Successfully unsubscribed from push notifications');
    } catch (error) {
      console.error('❌ Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  // Get current subscription status
  async getSubscription() {
    try {
      const registration = await this.getServiceWorkerRegistration();
      this.subscription = await registration.pushManager.getSubscription();
      return this.subscription;
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  // Get service worker registration
  async getServiceWorkerRegistration() {
    const registration = await navigator.serviceWorker.ready;
    return registration;
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    try {
      console.log('📤 Sending subscription to server:', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        hasKeys: !!subscription.keys,
        p256dh: subscription.keys?.p256dh?.substring(0, 20) + '...',
        auth: subscription.keys?.auth?.substring(0, 20) + '...'
      });

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          preferences: this.preferences,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server subscription failed:', response.status, errorText);
        throw new Error(`Server subscription failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Subscription sent to server successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to send subscription to server:', error);
      throw error; // We need to know if this fails
    }
  }

  // Remove subscription from server
  async removeSubscriptionFromServer() {
    try {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: this.subscription?.endpoint,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  // Update server-side preferences
  async updateServerPreferences() {
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: this.subscription?.endpoint,
          preferences: this.preferences,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Failed to update server preferences:', error);
    }
  }

  // Show local notification (fallback for when push isn't available)
  async showLocalNotification(title, options = {}) {
    if (!this.isNotificationSupported()) {
      console.warn('Local notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    // Check if notification should be shown based on preferences
    if (!this.shouldShowNotification(options)) {
      console.log('Notification filtered by user preferences');
      return;
    }

    const notification = new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options
    });

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      notification.close();
      
      // Navigate to appropriate page
      if (options.data?.clickAction) {
        window.location.href = options.data.clickAction;
      }
    };

    return notification;
  }

  // Check if notification should be shown based on user preferences
  shouldShowNotification(options) {
    const { type, priority } = options;

    // Check if notifications are enabled
    if (!this.preferences.enabled) return false;

    // Check type preferences
    if (type && this.preferences.types[type] === false) return false;

    // Check priority preferences
    if (priority && this.preferences.priorities[priority] === false) return false;

    // Check quiet hours
    if (this.preferences.schedules.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                         now.getMinutes().toString().padStart(2, '0');
      
      const { start, end } = this.preferences.schedules.quietHours;
      
      if (this.isInTimeRange(currentTime, start, end)) {
        // Only allow critical notifications during quiet hours
        return priority === 'critical';
      }
    }

    return true;
  }

  // Check if current time is within a time range
  isInTimeRange(current, start, end) {
    const [currentHour, currentMin] = current.split(':').map(Number);
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    const currentMinutes = currentHour * 60 + currentMin;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes <= endMinutes) {
      // Same day range
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight range
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  // Test notification (for user to verify settings)
  async sendTestNotification() {
    const testOptions = {
      body: 'This is a test notification to verify your settings are working correctly.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'test-notification',
      type: 'test',
      priority: 'medium',
      data: {
        clickAction: '/?source=test-notification'
      }
    };

    if (this.subscription) {
      // Try to send via push service
      try {
        const response = await fetch('/api/notifications/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: this.subscription.endpoint,
            title: 'EcoQuest Test Notification',
            options: testOptions
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
          }
          const errorText = await response.text();
          throw new Error(`Server error (${response.status}): ${errorText}`);
        }
      } catch (error) {
        console.warn('Push test failed, falling back to local notification');
        await this.showLocalNotification('EcoQuest Test Notification', testOptions);
      }
    } else {
      // Fallback to local notification
      await this.showLocalNotification('EcoQuest Test Notification', testOptions);
    }
  }

  // Utility function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Listen for service worker messages
  setupMessageListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'EMERGENCY_CALL':
            this.handleEmergencyCall(data);
            break;
          case 'NOTIFICATION_RECEIVED':
            this.handleNotificationReceived(data);
            break;
          default:
            console.log('Unknown service worker message:', event.data);
        }
      });
    }
  }

  // Handle emergency call from service worker
  handleEmergencyCall(data) {
    // Implement emergency calling logic
    console.log('Emergency call requested:', data);
    
    // In a real app, this might:
    // - Show emergency contact modal
    // - Pre-dial emergency services
    // - Send location to emergency services
  }

  // Handle notification received
  handleNotificationReceived(data) {
    console.log('Notification received:', data);
    
    // Update UI to reflect new notifications
    // This could update badge counts, refresh alert lists, etc.
    const event = new CustomEvent('notification-received', { detail: data });
    document.dispatchEvent(event);
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

// Setup message listener on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    pushNotificationService.setupMessageListener();
  });
}

export default pushNotificationService;