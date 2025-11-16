/**
 * Help Notifications API
 * Retrieves help offers and anonymous messages for users
 */

// In-memory storage for demo (would use Cosmos DB in production)
const helpNotifications = new Map(); // userId -> notifications

// Mock data for testing
if (helpNotifications.size === 0) {
  // Add some mock notifications for testing
  helpNotifications.set('test_user_123', {
    helpOffers: [
      {
        id: 'offer_mock_1',
        offererUserId: 'anonymous',
        targetCheckinId: 'checkin_123',
        offerType: 'general_help',
        message: 'I can help with evacuation if needed',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        status: 'pending',
        anonymousMode: true
      },
      {
        id: 'offer_mock_2',
        offererUserId: 'anonymous',
        targetCheckinId: 'checkin_123',
        offerType: 'transportation',
        message: 'I have a vehicle available for transport',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        status: 'pending',
        anonymousMode: true
      }
    ],
    anonymousMessages: [
      {
        id: 'msg_mock_1',
        senderUserId: 'anonymous',
        targetCheckinId: 'checkin_123',
        message: 'Stay safe! Help is on the way.',
        messageType: 'support',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        status: 'sent',
        anonymousMode: true
      },
      {
        id: 'msg_mock_2',
        senderUserId: 'anonymous',
        targetCheckinId: 'checkin_123',
        message: 'I saw emergency services heading your way. Hang in there!',
        messageType: 'information',
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 minutes ago
        status: 'sent',
        anonymousMode: true
      }
    ]
  });
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    return getHelpNotifications(req, res);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getHelpNotifications(req, res) {
  try {
    const { userId, lat, lng } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    // Get user's notifications
    const userNotifications = helpNotifications.get(userId) || { helpOffers: [], anonymousMessages: [] };

    const totalNotifications = userNotifications.helpOffers.length + userNotifications.anonymousMessages.length;

    console.log(`📬 Retrieved ${totalNotifications} notifications for user: ${userId}`);

    res.status(200).json({
      success: true,
      helpOffers: userNotifications.helpOffers,
      anonymousMessages: userNotifications.anonymousMessages,
      totalNotifications,
      location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
    });

  } catch (error) {
    console.error('❌ Failed to get help notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      helpOffers: [],
      anonymousMessages: [],
      totalNotifications: 0
    });
  }
}