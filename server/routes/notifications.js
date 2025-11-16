import express from 'express';
import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configure web-push with VAPID details (if available)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'noreply@example.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('✅ VAPID details configured for push notifications');
} else {
  console.log('⚠️ VAPID keys not configured - push notifications will have limited functionality');
}

// Store subscriptions in memory (in production, use a database)
const subscriptions = new Map();

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    console.log('📥 Subscription request received:', {
      hasSubscription: !!req.body.subscription,
      hasEndpoint: !!req.body.subscription?.endpoint,
      hasKeys: !!req.body.subscription?.keys,
      hasPreferences: !!req.body.preferences,
      userAgent: req.body.userAgent?.substring(0, 50) + '...'
    });
    
    const { subscription, preferences, userAgent, timestamp } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      console.log('❌ Invalid subscription request: missing subscription or endpoint');
      return res.status(400).json({
        error: 'Invalid subscription',
        message: 'Subscription object with endpoint is required'
      });
    }

    if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      console.log('❌ Invalid subscription request: missing keys');
      return res.status(400).json({
        error: 'Invalid subscription',
        message: 'Subscription keys (p256dh and auth) are required'
      });
    }

    // Store subscription with metadata
    const subscriptionData = {
      subscription,
      preferences: preferences || {},
      userAgent: userAgent || 'Unknown',
      subscribedAt: timestamp || new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    subscriptions.set(subscription.endpoint, subscriptionData);
    
    console.log('✅ New push notification subscription:', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      userAgent: userAgent || 'Unknown',
      totalSubscriptions: subscriptions.size
    });

    res.json({
      success: true,
      message: 'Successfully subscribed to push notifications',
      subscriptionId: subscription.endpoint.substring(0, 20) + '...',
      totalSubscriptions: subscriptions.size
    });

  } catch (error) {
    console.error('❌ Push notification subscription failed:', error);
    res.status(500).json({
      error: 'Subscription failed',
      message: error.message
    });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint, timestamp } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Endpoint is required'
      });
    }

    const wasSubscribed = subscriptions.has(endpoint);
    subscriptions.delete(endpoint);
    
    console.log('🗑️ Push notification unsubscription:', {
      endpoint: endpoint.substring(0, 50) + '...',
      wasSubscribed,
      totalSubscriptions: subscriptions.size
    });

    res.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications',
      wasSubscribed,
      totalSubscriptions: subscriptions.size
    });

  } catch (error) {
    console.error('❌ Push notification unsubscription failed:', error);
    res.status(500).json({
      error: 'Unsubscription failed',
      message: error.message
    });
  }
});

// Update subscription preferences
router.put('/preferences', async (req, res) => {
  try {
    const { endpoint, preferences, timestamp } = req.body;
    
    if (!endpoint || !preferences) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Endpoint and preferences are required'
      });
    }

    const subscriptionData = subscriptions.get(endpoint);
    if (!subscriptionData) {
      return res.status(404).json({
        error: 'Subscription not found',
        message: 'No subscription found for this endpoint'
      });
    }

    // Update preferences
    subscriptionData.preferences = { ...subscriptionData.preferences, ...preferences };
    subscriptionData.lastActive = timestamp || new Date().toISOString();
    subscriptions.set(endpoint, subscriptionData);
    
    console.log('🔄 Updated push notification preferences:', {
      endpoint: endpoint.substring(0, 50) + '...',
      preferences: Object.keys(preferences)
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: subscriptionData.preferences
    });

  } catch (error) {
    console.error('❌ Preference update failed:', error);
    res.status(500).json({
      error: 'Preference update failed',
      message: error.message
    });
  }
});

// Send test notification
router.post('/test', async (req, res) => {
  try {
    console.log('🧪 Test notification request received:', {
      hasEndpoint: !!req.body.endpoint,
      hasTitle: !!req.body.title,
      hasOptions: !!req.body.options,
      subscriptionCount: subscriptions.size
    });
    
    const { endpoint, title, options } = req.body;
    
    if (!endpoint) {
      console.log('❌ Test notification failed: No endpoint provided');
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Endpoint is required'
      });
    }

    const subscriptionData = subscriptions.get(endpoint);
    if (!subscriptionData) {
      console.log('❌ Test notification failed: Subscription not found for endpoint:', endpoint.substring(0, 50) + '...');
      console.log('Available subscriptions:', Array.from(subscriptions.keys()).map(key => key.substring(0, 50) + '...'));
      return res.status(404).json({
        error: 'Subscription not found',
        message: 'No subscription found for this endpoint. Make sure you have subscribed first.'
      });
    }

    // Send test notification
    const payload = JSON.stringify({
      title: title || 'EcoQuest Test Notification',
      body: options?.body || 'This is a test notification to verify your push notification settings.',
      icon: options?.icon || '/icons/icon-192x192.png',
      badge: options?.badge || '/icons/icon-72x72.png',
      tag: options?.tag || 'test-notification',
      data: {
        ...options?.data,
        timestamp: new Date().toISOString(),
        type: 'test'
      },
      actions: [
        {
          action: 'view',
          title: 'View App',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    });

    await webpush.sendNotification(subscriptionData.subscription, payload);
    
    console.log('✅ Test notification sent:', {
      endpoint: endpoint.substring(0, 50) + '...',
      title: title || 'Test Notification'
    });

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      payload: JSON.parse(payload)
    });

  } catch (error) {
    console.error('❌ Test notification failed:', error);
    
    // Handle specific web-push errors
    if (error.statusCode === 410) {
      // Subscription expired, remove it
      subscriptions.delete(req.body.endpoint);
      return res.status(410).json({
        error: 'Subscription expired',
        message: 'The subscription has expired and been removed'
      });
    }

    res.status(500).json({
      error: 'Test notification failed',
      message: error.message,
      statusCode: error.statusCode
    });
  }
});

// Send notification to all subscribers
router.post('/broadcast', async (req, res) => {
  try {
    const { title, body, data, priority = 'normal', filterBy } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Title and body are required'
      });
    }

    let targetSubscriptions = Array.from(subscriptions.values());
    
    // Apply filters if specified
    if (filterBy) {
      targetSubscriptions = targetSubscriptions.filter(sub => {
        const prefs = sub.preferences || {};
        
        // Filter by notification types
        if (filterBy.types && filterBy.types.length > 0) {
          const hasMatchingType = filterBy.types.some(type => prefs.types?.[type] !== false);
          if (!hasMatchingType) return false;
        }
        
        // Filter by priority
        if (filterBy.minPriority) {
          const priorityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
          const notificationPriority = priorityLevels[priority] || 2;
          const userMinPriority = priorityLevels[filterBy.minPriority] || 2;
          if (notificationPriority < userMinPriority) return false;
        }
        
        return true;
      });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: `broadcast-${Date.now()}`,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        type: 'broadcast',
        priority
      },
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    });

    const results = {
      sent: 0,
      failed: 0,
      expired: 0,
      errors: []
    };

    // Send to all target subscriptions
    const sendPromises = targetSubscriptions.map(async (subscriptionData) => {
      try {
        await webpush.sendNotification(subscriptionData.subscription, payload);
        results.sent++;
      } catch (error) {
        if (error.statusCode === 410) {
          // Subscription expired, remove it
          subscriptions.delete(subscriptionData.subscription.endpoint);
          results.expired++;
        } else {
          results.failed++;
          results.errors.push({
            endpoint: subscriptionData.subscription.endpoint.substring(0, 50) + '...',
            error: error.message
          });
        }
      }
    });

    await Promise.all(sendPromises);
    
    console.log('📢 Broadcast notification sent:', {
      title,
      targeted: targetSubscriptions.length,
      sent: results.sent,
      failed: results.failed,
      expired: results.expired
    });

    res.json({
      success: true,
      message: 'Broadcast notification completed',
      results,
      totalSubscriptions: subscriptions.size
    });

  } catch (error) {
    console.error('❌ Broadcast notification failed:', error);
    res.status(500).json({
      error: 'Broadcast failed',
      message: error.message
    });
  }
});

// Get subscription stats
router.get('/stats', (req, res) => {
  console.log('📊 Stats request - Current subscriptions:', subscriptions.size);
  
  const stats = {
    totalSubscriptions: subscriptions.size,
    vapidConfigured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    subscriptions: Array.from(subscriptions.values()).map(sub => ({
      endpoint: sub.subscription.endpoint.substring(0, 50) + '...',
      userAgent: sub.userAgent,
      subscribedAt: sub.subscribedAt,
      lastActive: sub.lastActive,
      preferences: sub.preferences
    })),
    debug: {
      hasVapidPublicKey: !!process.env.VAPID_PUBLIC_KEY,
      hasVapidPrivateKey: !!process.env.VAPID_PRIVATE_KEY,
      hasVapidEmail: !!process.env.VAPID_EMAIL,
      vapidEmail: process.env.VAPID_EMAIL
    }
  };

  res.json({
    success: true,
    stats
  });
});

export default router;