/**
 * Community Service - Cosmos DB Integration
 * Handles community safety check-ins and reporting with backend API integration
 * Privacy-first design with geographic coordination
 */

/**
 * Submit safety check-in to community
 */
export const submitSafetyCheckin = async (userAuth, status, message = '', location = null, anonymousMode = true) => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required for safety check-in');
    }

    if (!location) {
      throw new Error('Location is required for community coordination');
    }

    console.log(`🛡️ Submitting safety check-in: ${status}`);

    const response = await fetch('/api/community/checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userAuth.uid,
        status,
        message: message.trim(),
        location,
        anonymousMode
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to submit safety check-in');
    }

    console.log(`✅ Safety check-in submitted successfully`);
    return result;
  } catch (error) {
    console.error('❌ Failed to submit safety check-in:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get community safety status for region
 */
export const getCommunityStatus = async (location, radius = 50) => {
  try {
    if (!location?.lat || !location?.lng) {
      throw new Error('Location coordinates are required');
    }

    console.log(`🌍 Fetching community status for region (${location.lat}, ${location.lng})`);

    const response = await fetch(
      `/api/community/status?lat=${location.lat}&lng=${location.lng}&radius=${radius}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch community status');
    }

    console.log(`✅ Retrieved community status: ${result.totalCheckins} check-ins`);
    return result;
  } catch (error) {
    console.error('❌ Failed to fetch community status:', error);
    return {
      success: false,
      error: error.message,
      statusCounts: {},
      recentCheckins: [],
      totalCheckins: 0
    };
  }
};

/**
 * Submit community report
 */
export const submitCommunityReport = async (userAuth, reportData, anonymousMode = true) => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required for community reporting');
    }

    const { type, title, description, location, urgentLevel = 'normal' } = reportData;

    if (!type || !description) {
      throw new Error('Report type and description are required');
    }

    if (!location) {
      throw new Error('Location is required for community reports');
    }

    console.log(`📋 Submitting community report: ${type}`);

    const response = await fetch('/api/community/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userAuth.uid,
        type,
        title,
        description: description.trim(),
        location,
        urgentLevel,
        anonymousMode
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to submit community report');
    }

    console.log(`✅ Community report submitted successfully`);
    return result;
  } catch (error) {
    console.error('❌ Failed to submit community report:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get community reports for region
 */
export const getCommunityReports = async (location, options = {}) => {
  try {
    if (!location?.lat || !location?.lng) {
      throw new Error('Location coordinates are required');
    }

    const { radius = 50, type = 'all', status = 'active', limit = 50, excludeInvalidLocations = true } = options;

    console.log(`📋 Fetching community reports for region (${location.lat}, ${location.lng})`);

    const params = new URLSearchParams({
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      radius: radius.toString(),
      status
    });

    if (type && type !== 'all') {
      params.append('type', type);
    }
    
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    if (excludeInvalidLocations) {
      params.append('excludeInvalidLocations', 'true');
    }

    const response = await fetch(`/api/community/reports?${params}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch community reports');
    }

    // Filter out reports with invalid locations on the client side as well
    let reports = result.reports || [];
    if (excludeInvalidLocations) {
      reports = reports.filter(report => {
        return report && 
               report.location && 
               typeof report.location.lat === 'number' && 
               typeof report.location.lng === 'number' &&
               report.location.lat !== 0 && 
               report.location.lng !== 0 &&
               !isNaN(report.location.lat) &&
               !isNaN(report.location.lng);
      });
    }

    console.log(`✅ Retrieved ${reports.length} valid community reports (${result.totalReports} total)`);
    return {
      ...result,
      reports,
      validReports: reports.length,
      totalReports: result.totalReports || 0
    };
  } catch (error) {
    console.error('❌ Failed to fetch community reports:', error);
    return {
      success: false,
      error: error.message,
      reports: [],
      totalReports: 0,
      validReports: 0
    };
  }
};

/**
 * Verify/upvote a community report
 * Supports both authenticated and anonymous verification
 */
export const verifyCommunityReport = async (userAuth, reportId, verificationNote = '', location = null) => {
  try {
    // Support anonymous verification - only require location for verification
    if (!location?.lat || !location?.lng) {
      throw new Error('Location is required for report verification');
    }

    // If user is authenticated, check verification status
    if (userAuth?.uid) {
      const verificationStatus = await checkUserVerification(userAuth, reportId);
      if (verificationStatus.error && !verificationStatus.error.includes('Service unavailable')) {
        throw new Error(verificationStatus.error);
      }
      
      if (verificationStatus.isOriginalAuthor) {
        throw new Error('Cannot verify your own report');
      }
      
      if (verificationStatus.hasVerified) {
        throw new Error('You have already verified this report');
      }
    }

    console.log(`✅ Verifying community report: ${reportId} ${userAuth?.uid ? '(authenticated)' : '(anonymous)'}`);

    const requestBody = {
      lat: location.lat,
      lng: location.lng,
      verificationNote: verificationNote.trim(),
      anonymous: !userAuth?.uid
    };

    // Include userId only if authenticated
    if (userAuth?.uid) {
      requestBody.userId = userAuth.uid;
    }

    const response = await fetch(`/api/community/reports/${reportId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to verify report');
    }

    console.log(`✅ Report verification recorded`);
    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error('❌ Failed to verify report:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if user has already verified a specific report
 * For anonymous users, always allow verification
 */
export const checkUserVerification = async (userAuth, reportId) => {
  try {
    if (!userAuth?.uid) {
      return { hasVerified: false, canVerify: true, isOriginalAuthor: false };
    }

    const response = await fetch(`/api/community/reports/${reportId}/verification-status?userId=${userAuth.uid}`);
    
    // Handle 404 - report not found in database
    if (response.status === 404) {
      // Use debug level logging for expected 404s to reduce console noise
      console.debug(`🔍 Report ${reportId} not found in verification database`);
      return {
        hasVerified: false,
        canVerify: false, // Don't allow verification of non-existent reports
        isOriginalAuthor: false,
        error: 'Report not found'
      };
    }
    
    // Handle 503 - service unavailable
    if (response.status === 503) {
      console.warn(`⚠️ Community services unavailable for report ${reportId}`);
      return {
        hasVerified: false,
        canVerify: false,
        isOriginalAuthor: false,
        error: 'Service unavailable'
      };
    }
    
    if (!response.ok) {
      console.warn(`⚠️ Verification check failed for report ${reportId}: ${response.status}`);
      return { hasVerified: false, canVerify: false, isOriginalAuthor: false };
    }

    const result = await response.json();
    return {
      hasVerified: result.hasVerified || false,
      canVerify: result.canVerify || false,
      isOriginalAuthor: result.isOriginalAuthor || false
    };
  } catch (error) {
    console.error('❌ Failed to check verification status:', error);
    return { hasVerified: false, canVerify: false, isOriginalAuthor: false };
  }
};

/**
 * Clean up reports with invalid locations from the database
 * This is an admin function that should be called sparingly
 */
/**
 * Clean up reports with invalid locations from the database
 * This is an admin function that should be called sparingly
 */
export const cleanupInvalidLocationReports = async (userAuth, dryRun = true) => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required for cleanup operations');
    }

    console.log(`🧹 ${dryRun ? 'Previewing' : 'Executing'} cleanup of invalid location reports`);

    const response = await fetch('/api/community/reports/cleanup-invalid-locations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userAuth.uid,
        dryRun
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to cleanup invalid reports');
    }

    console.log(`✅ Cleanup ${dryRun ? 'preview' : 'execution'} completed: ${result.affectedReports} reports`);
    return result;
  } catch (error) {
    console.error('❌ Failed to cleanup invalid reports:', error);
    return {
      success: false,
      error: error.message,
      affectedReports: 0
    };
  }
};

export const checkBatchUserVerifications = async (userAuth, reportIds) => {
  try {
    if (!userAuth?.uid || !reportIds.length) {
      return new Map();
    }

    // Try batch endpoint first
    const batchResponse = await fetch(`/api/community/reports/batch-verification-status?userId=${userAuth.uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportIds })
    });

    if (batchResponse.ok) {
      const batchResult = await batchResponse.json();
      return new Map(Object.entries(batchResult));
    }

    // Fallback to individual calls with rate limiting
    console.log('🔄 Batch endpoint unavailable, using individual calls with rate limiting');
    const verificationMap = new Map();
    
    // Process in chunks to avoid overwhelming the server
    const chunkSize = 3; // Reduced from 5 to be gentler on the API
    for (let i = 0; i < reportIds.length; i += chunkSize) {
      const chunk = reportIds.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(async (reportId) => {
        const status = await checkUserVerification(userAuth, reportId);
        return [reportId, status];
      });
      
      const chunkResults = await Promise.allSettled(chunkPromises);
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const [reportId, status] = result.value;
          verificationMap.set(reportId, status);
        } else {
          // Set safe defaults for failed verification checks
          const reportId = chunk[index];
          verificationMap.set(reportId, { hasVerified: false, canVerify: false, isOriginalAuthor: false });
        }
      });
      
      // Longer delay between chunks to be gentle on the server
      if (i + chunkSize < reportIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return verificationMap;
  } catch (error) {
    console.error('❌ Failed to batch check verification statuses:', error);
    return new Map();
  }
};

/**
 * Safety status options for community check-ins
 * Enhanced with community-oriented options based on emergency management research
 */
export const SafetyStatus = {
  // Individual Status (Legacy)
  SAFE: 'safe',
  EVACUATING: 'evacuating', 
  NEED_HELP: 'need-help',
  SHELTERING: 'sheltering',
  
  // Community Resilience Status (Novel)
  NEIGHBORHOOD_PREPARED: 'neighborhood-prepared',
  COMMUNITY_ORGANIZING: 'community-organizing', 
  STREET_COORDINATED: 'street-coordinated',
  VULNERABLE_CHECKED: 'vulnerable-checked',
  RESOURCES_AVAILABLE: 'resources-available',
  EVACUATION_COORDINATED: 'evacuation-coordinated',
  PROFESSIONAL_SKILLS_ACTIVE: 'professional-skills-active',
  COMMUNITY_HELP_NEEDED: 'community-help-needed'
};

/**
 * Community report types
 */
export const ReportTypes = {
  FIRE_SPOTTING: 'fire-spotting',
  POWER_LINE_DOWN: 'power-line-down',
  ROAD_CLOSURE: 'road-closure',
  NEED_EVAC_HELP: 'need-evac-help',
  OFFER_HELP: 'offer-help',
  RESOURCE_SHORTAGE: 'resource-shortage',
  UNSAFE_CONDITIONS: 'unsafe-conditions'
};

/**
 * Urgent levels for reports
 */
export const UrgentLevels = {
  CRITICAL: 'critical',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low'
};

/**
 * Anonymous Help and Messaging System
 * Privacy-first communication for community assistance
 */

/**
 * Submit anonymous help offer
 */
export const submitHelpOffer = async (userAuth, targetCheckinId, offerType = 'general_help', message = '', location = null) => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required for help offers');
    }

    console.log(`🤝 Submitting anonymous help offer for checkin: ${targetCheckinId}`);

    const response = await fetch('/api/community/help-offer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offererUserId: userAuth.uid,
        targetCheckinId,
        offerType,
        message: message.trim(),
        location,
        anonymousMode: true
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to submit help offer');
    }

    console.log(`✅ Anonymous help offer submitted successfully`);
    return result;
  } catch (error) {
    console.error('❌ Failed to submit help offer:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send anonymous message to someone who needs help
 */
export const sendAnonymousMessage = async (userAuth, targetCheckinId, message, messageType = 'support', userLocation = null) => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required for anonymous messaging');
    }

    if (!message.trim()) {
      throw new Error('Message content is required');
    }

    console.log(`💬 Sending anonymous message to checkin: ${targetCheckinId}`);

    const response = await fetch('/api/community/anonymous-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderUserId: userAuth.uid,
        targetCheckinId,
        message: message.trim(),
        messageType,
        anonymousMode: true,
        location: userLocation
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send anonymous message');
    }

    console.log(`✅ Anonymous message sent successfully`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send anonymous message:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get help offers and messages for current user
 */
export const getMyHelpNotifications = async (userAuth, location = null) => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required to fetch notifications');
    }

    console.log(`📬 Fetching help notifications for user`);

    const params = new URLSearchParams({
      userId: userAuth.uid
    });

    if (location?.lat && location?.lng) {
      params.append('lat', location.lat.toString());
      params.append('lng', location.lng.toString());
    }

    const response = await fetch(`/api/community/help-notifications?${params}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch help notifications');
    }

    console.log(`✅ Retrieved ${result.totalNotifications} help notifications`);
    return result;
  } catch (error) {
    console.error('❌ Failed to fetch help notifications:', error);
    return {
      success: false,
      error: error.message,
      helpOffers: [],
      anonymousMessages: [],
      totalNotifications: 0
    };
  }
};

/**
 * Respond to anonymous message
 */
export const respondToAnonymousMessage = async (userAuth, messageId, responseMessage) => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required to respond to messages');
    }

    if (!responseMessage.trim()) {
      throw new Error('Response message is required');
    }

    console.log(`💬 Responding to anonymous message: ${messageId}`);

    const response = await fetch(`/api/community/anonymous-message/${messageId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        responderId: userAuth.uid,
        response: responseMessage.trim()
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to respond to message');
    }

    console.log(`✅ Response sent successfully`);
    return result;
  } catch (error) {
    console.error('❌ Failed to respond to message:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Accept help offer
 */
export const acceptHelpOffer = async (userAuth, offerId, contactMethod = 'anonymous_chat') => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required to accept help');
    }

    console.log(`🤝 Accepting help offer: ${offerId}`);

    const response = await fetch(`/api/community/help-offer/${offerId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accepterId: userAuth.uid,
        contactMethod
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to accept help offer');
    }

    console.log(`✅ Help offer accepted successfully`);
    return result;
  } catch (error) {
    console.error('❌ Failed to accept help offer:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send anonymous chat message
 */
export const sendAnonymousChat = async (userAuth, channelId, message, messageType = 'chat') => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required to send messages');
    }

    if (!message.trim()) {
      throw new Error('Message content is required');
    }

    console.log(`💬 Sending anonymous chat message to channel: ${channelId}`);

    const response = await fetch(`/api/community/chat/${channelId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: userAuth.uid,
        message: message.trim(),
        messageType
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send chat message');
    }

    console.log(`✅ Anonymous chat message sent successfully`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send chat message:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get anonymous chat messages
 */
export const getAnonymousChat = async (channelId, limit = 50) => {
  try {
    console.log(`💬 Fetching chat messages for channel: ${channelId}`);

    const response = await fetch(`/api/community/chat/${channelId}/messages?limit=${limit}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch chat messages');
    }

    console.log(`✅ Retrieved ${result.messages?.length || 0} chat messages`);
    return result;
  } catch (error) {
    console.error('❌ Failed to fetch chat messages:', error);
    return {
      success: false,
      error: error.message,
      messages: []
    };
  }
};

/**
 * Help offer types
 */
export const HelpOfferTypes = {
  GENERAL_HELP: 'general_help',
  EVACUATION_ASSIST: 'evacuation_assist',
  TRANSPORTATION: 'transportation',
  SUPPLIES: 'supplies',
  SHELTER: 'shelter',
  MEDICAL: 'medical',
  COMMUNICATION: 'communication'
};

/**
 * Message types for anonymous communication
 */
export const AnonymousMessageTypes = {
  SUPPORT: 'support',
  COORDINATION: 'coordination',
  INFORMATION: 'information',
  EMERGENCY: 'emergency'
};