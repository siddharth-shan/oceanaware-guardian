/**
 * Anonymous Message API
 * Handles privacy-preserving messaging
 */

// In-memory storage for demo (would use Cosmos DB in production)
const anonymousMessages = new Map();
const helpNotifications = new Map(); // userId -> notifications

export default function handler(req, res) {
  if (req.method === 'POST') {
    return sendAnonymousMessage(req, res);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

async function sendAnonymousMessage(req, res) {
  try {
    const { senderUserId, targetCheckinId, message, messageType, anonymousMode } = req.body;

    if (!senderUserId || !targetCheckinId || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Create anonymous message
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const anonymousMessage = {
      id: messageId,
      senderUserId: anonymousMode ? 'anonymous' : senderUserId,
      targetCheckinId,
      message: message.trim(),
      messageType: messageType || 'support',
      timestamp: new Date().toISOString(),
      status: 'sent',
      anonymousMode: anonymousMode !== false
    };

    // Store the message
    anonymousMessages.set(messageId, anonymousMessage);

    // Add to target user's notifications (simulate finding target user)
    const targetUserId = `user_${targetCheckinId.slice(-6)}`; // Mock target user ID
    
    if (!helpNotifications.has(targetUserId)) {
      helpNotifications.set(targetUserId, { helpOffers: [], anonymousMessages: [] });
    }

    const userNotifications = helpNotifications.get(targetUserId);
    userNotifications.anonymousMessages.push(anonymousMessage);
    helpNotifications.set(targetUserId, userNotifications);

    console.log(`✅ Anonymous message created: ${messageId} for ${targetCheckinId}`);

    res.status(201).json({
      success: true,
      messageId,
      message: 'Anonymous message sent successfully',
      anonymousMessage
    });

  } catch (error) {
    console.error('❌ Failed to send anonymous message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}