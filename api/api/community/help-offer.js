/**
 * Anonymous Help Offer API
 * Handles privacy-preserving help coordination
 */

// In-memory storage for demo (would use Cosmos DB in production)
const helpOffers = new Map();
const helpNotifications = new Map(); // userId -> notifications

export default function handler(req, res) {
  if (req.method === 'POST') {
    return submitHelpOffer(req, res);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

async function submitHelpOffer(req, res) {
  try {
    const { offererUserId, targetCheckinId, offerType, message, location, anonymousMode } = req.body;

    if (!offererUserId || !targetCheckinId || !offerType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Create anonymous help offer
    const offerId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const helpOffer = {
      id: offerId,
      offererUserId: anonymousMode ? 'anonymous' : offererUserId,
      targetCheckinId,
      offerType,
      message: message || '',
      location: anonymousMode ? null : location,
      timestamp: new Date().toISOString(),
      status: 'pending',
      anonymousMode
    };

    // Store the offer
    helpOffers.set(offerId, helpOffer);

    // Add to target user's notifications (simulate finding target user)
    const targetUserId = `user_${targetCheckinId.slice(-6)}`; // Mock target user ID
    
    if (!helpNotifications.has(targetUserId)) {
      helpNotifications.set(targetUserId, { helpOffers: [], anonymousMessages: [] });
    }

    const userNotifications = helpNotifications.get(targetUserId);
    userNotifications.helpOffers.push(helpOffer);
    helpNotifications.set(targetUserId, userNotifications);

    console.log(`✅ Help offer created: ${offerId} for ${targetCheckinId}`);

    res.status(201).json({
      success: true,
      offerId,
      message: 'Help offer submitted successfully',
      offer: helpOffer
    });

  } catch (error) {
    console.error('❌ Failed to submit help offer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}