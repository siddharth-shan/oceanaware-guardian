import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Navigation, Users, Clock, MapPin, Phone, MessageCircle, Bell } from 'lucide-react';
import { useAuth } from '../../services/auth/AuthContext';
import { useAccessibility } from '../accessibility/AccessibilityProvider';
import { getStatusTheme, communityThemes } from '../../utils/communityThemes';
import { 
  submitSafetyCheckin, 
  getCommunityStatus, 
  SafetyStatus,
  submitHelpOffer,
  sendAnonymousMessage,
  getMyHelpNotifications,
  acceptHelpOffer,
  sendAnonymousChat,
  getAnonymousChat,
  HelpOfferTypes,
  AnonymousMessageTypes
} from '../../services/community/CommunityService';

/**
 * Community Safety Coordination System
 * Enables community members to coordinate emergency response and mutual aid
 * Focuses on aggregate community status and neighbor assistance
 * Individual personal status sharing should be done via Family Safety Hub
 */
const SafetyCheckin = ({ userLocation, emergencyLevel }) => {
  const { user, isAuthenticated } = useAuth();
  const [userStatus, setUserStatus] = useState(null);
  const [checkinHistory, setCheckinHistory] = useState([]);
  const [nearbyCheckins, setNearbyCheckins] = useState([]);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [helpNotifications, setHelpNotifications] = useState({ helpOffers: [], anonymousMessages: [], totalNotifications: 0 });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedCheckinForHelp, setSelectedCheckinForHelp] = useState(null);
  const [showCommunityBoard, setShowCommunityBoard] = useState(false);
  const [communityMessages, setCommunityMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState('support');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState('');
  const [customDetail, setCustomDetail] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { speak, translate } = useAccessibility();

  // Helper function to get button colors for modals
  const getButtonColors = (statusId) => {
    const statusConfig = statusOptions.find(s => s.id === statusId);
    if (!statusConfig) return {
      background: 'bg-blue-600 hover:bg-blue-700',
      border: 'border-blue-500',
      bgLight: 'bg-blue-50',
      text: 'text-blue-600'
    };

    // Map theme categories to button colors
    switch (statusConfig.category) {
      case 'emergency':
        return {
          background: 'bg-red-600 hover:bg-red-700',
          border: 'border-red-500',
          bgLight: 'bg-red-50',
          text: 'text-red-600'
        };
      case 'status':
        if (statusId === SafetyStatus.SAFE) {
          return {
            background: 'bg-green-600 hover:bg-green-700',
            border: 'border-green-500',
            bgLight: 'bg-green-50',
            text: 'text-green-600'
          };
        } else {
          return {
            background: 'bg-orange-600 hover:bg-orange-700',
            border: 'border-orange-500',
            bgLight: 'bg-orange-50',
            text: 'text-orange-600'
          };
        }
      case 'community':
        return {
          background: 'bg-blue-600 hover:bg-blue-700',
          border: 'border-blue-500',
          bgLight: 'bg-blue-50',
          text: 'text-blue-600'
        };
      default:
        return {
          background: 'bg-gray-600 hover:bg-gray-700',
          border: 'border-gray-500',
          bgLight: 'bg-gray-50',
          text: 'text-gray-600'
        };
    }
  };

  // Simplified status options with progressive disclosure (reduced from 11 to 6 core options)
  const statusOptions = [
    // Emergency Status - Always visible first (Priority 1)
    {
      id: SafetyStatus.NEED_HELP,
      label: 'Need Help',
      icon: AlertTriangle,
      theme: communityThemes.emergency.primary,
      description: 'Request immediate assistance',
      category: 'emergency',
      priority: 1,
      hasDetails: true,
      detailOptions: [
        'Medical emergency',
        'Evacuation assistance needed',
        'Trapped or unable to leave',
        'Vehicle breakdown',
        'Other emergency'
      ]
    },
    {
      id: SafetyStatus.COMMUNITY_HELP_NEEDED,
      label: 'Community Emergency',
      icon: AlertTriangle,
      theme: communityThemes.emergency.primary,
      description: 'Neighborhood-wide emergency',
      category: 'emergency',
      priority: 1,
      hasDetails: true,
      detailOptions: [
        'Road blocked or dangerous',
        'Power lines down',
        'Fire spotted in area',
        'Multiple people need help',
        'Infrastructure damage'
      ]
    },
    
    // Core Status - Primary options (Priority 2)
    {
      id: SafetyStatus.SAFE,
      label: 'Safe & Ready',
      icon: Shield,
      theme: communityThemes.status.safe,
      description: 'Safe and prepared for emergencies',
      category: 'status',
      priority: 2,
      hasDetails: true,
      detailOptions: [
        'At home and prepared',
        'Evacuated to safe location',
        'At designated shelter',
        'With family/friends',
        'Temporarily relocated'
      ]
    },
    {
      id: SafetyStatus.EVACUATING,
      label: 'Evacuating',
      icon: Navigation,
      theme: communityThemes.status.evacuating,
      description: 'Currently leaving the area',
      category: 'status',
      priority: 2,
      hasDetails: true,
      detailOptions: [
        'Following evacuation order',
        'Voluntary evacuation',
        'Going to shelter',
        'Staying with family/friends',
        'Route to safe location'
      ]
    },
    
    // Community Coordination - Simplified to 2 core options (Priority 3)
    {
      id: SafetyStatus.NEIGHBORHOOD_PREPARED,
      label: 'Neighborhood Coordinated',
      icon: Users,
      theme: communityThemes.community.primary,
      description: 'Our area is prepared and neighbors connected',
      category: 'community',
      priority: 3,
      hasDetails: true,
      detailOptions: [
        'Evacuation plans shared',
        'Vulnerable neighbors checked',
        'Communication network active',
        'Emergency supplies distributed',
        'Contact lists updated'
      ]
    },
    {
      id: SafetyStatus.RESOURCES_AVAILABLE,
      label: 'Resources Available',
      icon: Users,
      theme: communityThemes.community.primary,
      description: 'Can provide assistance to community',
      category: 'community',
      priority: 3,
      hasDetails: true,
      detailOptions: [
        'Transportation/evacuation help',
        'Medical/first aid skills',
        'Technical skills (generator, etc)',
        'Emergency supplies to share',
        'Professional emergency training'
      ]
    }
  ];

  // Load community status and user's previous check-ins
  useEffect(() => {
    const savedStatus = localStorage.getItem('ecoquest-safety-status');
    if (savedStatus) {
      setUserStatus(JSON.parse(savedStatus));
    }

    // Load nearby check-ins from Cosmos DB
    loadNearbyCheckins();
    
    // Load help notifications
    loadHelpNotifications();
    
    // Load community bulletin board messages
    loadCommunityMessages();
  }, [userLocation, isAuthenticated]);

  // Auto-refresh help notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated()) return;
    
    const interval = setInterval(loadHelpNotifications, 30000);
    return () => clearInterval(interval);
  }, [userLocation, isAuthenticated]);

  const loadNearbyCheckins = async () => {
    if (!userLocation || !isAuthenticated()) return;

    try {
      const result = await getCommunityStatus(userLocation);
      if (result.success !== false) {
        setNearbyCheckins(result.recentCheckins || []);
      }
    } catch (error) {
      console.error('Failed to load nearby check-ins:', error);
    }
  };

  // Load help notifications
  const loadHelpNotifications = async () => {
    if (!isAuthenticated() || !userLocation) return;
    
    try {
      const result = await getMyHelpNotifications(user, userLocation);
      if (result.success !== false) {
        setHelpNotifications(result);
      }
    } catch (error) {
      console.error('Failed to load help notifications:', error);
    }
  };

  // Privacy-respecting help handlers with real backend integration
  const handleOfferHelp = async (checkinId) => {
    if (!isAuthenticated()) {
      alert('Please authenticate to offer help');
      return;
    }

    setSelectedCheckinForHelp(checkinId);
    setShowHelpModal(true);
  };

  const submitHelpOfferWithType = async (offerType, message = '') => {
    try {
      const result = await submitHelpOffer(user, selectedCheckinForHelp, offerType, message, userLocation);
      
      if (result.success !== false) {
        setShowHelpModal(false);
        setSelectedCheckinForHelp(null);
        speak('Anonymous help offer submitted successfully');
        
        // Show success message
        alert('Your help offer has been sent! It will be visible to the community and emergency coordinators on the public bulletin board.');
      } else {
        alert(`Failed to send help offer: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to submit help offer:', error);
      alert('Failed to send help offer. Please try again.');
    }
  };

  const handlePrivateContact = async (checkinId) => {
    if (!isAuthenticated()) {
      alert('Please authenticate to send messages');
      return;
    }

    const message = prompt('Send an anonymous support message (your identity will remain private):');
    if (message && message.trim()) {
      try {
        const result = await sendAnonymousMessage(user, checkinId, message.trim(), AnonymousMessageTypes.SUPPORT);
        
        if (result.success !== false) {
          speak('Anonymous message sent successfully');
          alert('Your anonymous message has been sent through our secure, privacy-preserving system. The recipient can respond anonymously.');
          
          // Refresh notifications to show any immediate updates
          setTimeout(loadHelpNotifications, 1000);
        } else {
          alert(`Failed to send message: ${result.error}`);
        }
      } catch (error) {
        console.error('Failed to send anonymous message:', error);
        alert('Failed to send message. Please try again.');
      }
    }
  };

  // Helper function to get approximate location for better community context
  const getApproximateLocation = (location) => {
    if (!location) return 'Unknown Area';
    
    // Use region, city, or create a general area description
    if (location.region) return location.region;
    if (location.city) return `${location.city} Area`;
    if (location.county) return `${location.county} County`;
    if (location.state) return `${location.state} Area`;
    if (location.displayName) return location.displayName;
    
    // Create approximate coordinate description
    if (location.lat && location.lng) {
      const lat = Math.round(location.lat * 10) / 10;
      const lng = Math.round(location.lng * 10) / 10;
      return `Area near ${lat}, ${lng}`;
    }
    
    return 'Unknown Area';
  };

  // Helper function for help type descriptions
  const getHelpTypeDescription = (type) => {
    const descriptions = {
      [HelpOfferTypes.GENERAL_HELP]: 'General assistance and support',
      [HelpOfferTypes.EVACUATION_ASSIST]: 'Help with evacuation process',
      [HelpOfferTypes.TRANSPORTATION]: 'Vehicle or transport assistance',
      [HelpOfferTypes.SUPPLIES]: 'Food, water, or emergency supplies',
      [HelpOfferTypes.SHELTER]: 'Temporary housing or shelter',
      [HelpOfferTypes.MEDICAL]: 'Medical assistance or first aid',
      [HelpOfferTypes.COMMUNICATION]: 'Communication relay or coordination'
    };
    return descriptions[type] || 'Assistance available';
  };

  // Handle posting to community bulletin board
  const handlePostToCommunity = async (offerId, responseMessage) => {
    const confirmed = confirm('Post a public message to the community bulletin board? This will be visible to everyone in your area.');
    if (confirmed && responseMessage.trim()) {
      try {
        // Post to community bulletin board instead of 1-to-1 chat
        const result = await sendAnonymousMessage(user, offerId, responseMessage.trim(), 'community_response', userLocation);
        
        if (result.success !== false) {
          speak('Message posted to community bulletin board.');
          alert('Your message has been posted to the community bulletin board where local emergency coordinators and community members can see it.');
        } else {
          throw new Error(result.error || 'Failed to post message');
        }
        
        // Refresh notifications
        setTimeout(loadHelpNotifications, 1000);
      } catch (error) {
        console.error('Failed to post to community:', error);
        alert(`Failed to post message: ${error.message}`);
      }
    }
  };

  // Load community bulletin board messages
  const loadCommunityMessages = async () => {
    try {
      // Load community bulletin board messages for the area
      const result = await getCommunityStatus(userLocation);
      if (result.success !== false && result.communityMessages) {
        setCommunityMessages(result.communityMessages || []);
      }
    } catch (error) {
      console.error('Failed to load community messages:', error);
    }
  };

  // Post to community bulletin board
  const handlePostCommunityMessage = async () => {
    if (!newMessage.trim()) return;
    
    // Content filtering - basic safety checks
    const prohibitedWords = ['meet', 'address', 'phone', 'personal', 'private', 'contact'];
    const hasProhibited = prohibitedWords.some(word => 
      newMessage.toLowerCase().includes(word)
    );
    
    if (hasProhibited) {
      alert('Message contains prohibited content. Please keep messages focused on emergency coordination and avoid sharing personal contact information.');
      return;
    }
    
    try {
      const result = await sendAnonymousMessage(
        user, 
        'community_board', 
        `[${messageType?.toUpperCase() || 'MESSAGE'}] ${newMessage.trim()}`, 
        'community_bulletin',
        userLocation
      );
      
      if (result.success !== false) {
        setNewMessage('');
        speak('Message posted to community bulletin board.');
        // Reload messages
        setTimeout(loadCommunityMessages, 500);
      } else {
        alert(`Failed to post message: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to post community message:', error);
      alert('Failed to post message. Please try again.');
    }
  };

  // Handle accepting help via community bulletin board
  const handleAcceptHelp = async (offerId) => {
    const response = prompt('Post a message to the community bulletin board accepting this help offer (visible to all):');
    if (response && response.trim()) {
      await handlePostToCommunity(offerId, response);
    }
  };

  // Handle responding to messages via community bulletin board
  const handleRespondToMessage = async (messageId) => {
    const response = prompt('Post a public response to the community bulletin board (visible to all):');
    if (response && response.trim()) {
      // Content filtering
      const prohibitedWords = ['meet', 'address', 'phone', 'personal', 'private', 'contact'];
      const hasProhibited = prohibitedWords.some(word => 
        response.toLowerCase().includes(word)
      );
      
      if (hasProhibited) {
        alert('Response contains prohibited content. Please keep messages focused on emergency coordination and avoid sharing personal contact information.');
        return;
      }
      
      try {
        const result = await sendAnonymousMessage(user, 'community_board', `[RESPONSE] ${response.trim()}`, 'community_response', userLocation);
        
        if (result.success !== false) {
          alert('Your response has been posted to the community bulletin board where everyone can see it.');
          speak('Response posted to community bulletin board.');
        } else {
          throw new Error(result.error || 'Failed to post response');
        }
        
        // Refresh notifications
        setTimeout(loadHelpNotifications, 1000);
      } catch (error) {
        console.error('Failed to post response:', error);
        alert(`Failed to post response: ${error.message}`);
      }
    }
  };

  // Updated to handle progressive disclosure
  const handleStatusSelection = (statusId) => {
    const statusConfig = getStatusConfig(statusId);
    
    if (statusConfig?.hasDetails) {
      setSelectedStatus(statusConfig);
      setSelectedDetail('');
      setCustomDetail('');
      setShowDetailModal(true);
    } else {
      // Direct submission for simple statuses
      handleStatusUpdate(statusId);
    }
  };

  const handleStatusUpdate = async (statusId, message = '') => {
    if (!isAuthenticated() || !userLocation) {
      alert('Authentication and location are required for safety check-in');
      return;
    }

    setLoading(true);
    
    try {
      // Build detailed message from progressive disclosure
      let finalMessage = message;
      if (selectedDetail && selectedDetail !== 'Other') {
        finalMessage = selectedDetail;
      } else if (customDetail.trim()) {
        finalMessage = customDetail.trim();
      }
      
      // Process location data to ensure proper region field for backend
      const processedLocation = {
        ...userLocation,
        region: getApproximateLocation(userLocation)
      };
      
      // Submit to backend with processed location and detailed message
      const result = await submitSafetyCheckin(user, statusId, finalMessage, processedLocation, true);
      
      if (result.success !== false) {
        const timestamp = new Date();
        const newStatus = {
          status: statusId,
          timestamp,
          location: {
            displayName: getApproximateLocation(userLocation),
            region: getApproximateLocation(userLocation),
            coordinates: userLocation ? `${userLocation.lat?.toFixed(3)}, ${userLocation.lng?.toFixed(3)}` : null
          },
          message: message.trim()
        };

        setUserStatus(newStatus);
        setCheckinHistory(prev => [newStatus, ...prev.slice(0, 9)]); // Keep last 10 check-ins
        
        // Save to localStorage
        localStorage.setItem('ecoquest-safety-status', JSON.stringify(newStatus));
        
        setShowCheckinForm(false);

        // Voice announcement for status update
        const statusConfig = getStatusConfig(statusId);
        const announcement = statusId === SafetyStatus.SAFE ? translate('emergency.safe', 'You have been marked as safe') :
                            statusId === SafetyStatus.EVACUATING ? translate('emergency.evacuating', 'You are currently evacuating') :
                            statusId === SafetyStatus.NEED_HELP ? translate('emergency.need-help', 'Help request submitted. Emergency services have been notified') :
                            `Status updated to ${statusConfig?.label || statusId}`;
        
        speak(announcement, { emergency: statusId === SafetyStatus.NEED_HELP });

        // Refresh nearby check-ins
        await loadNearbyCheckins();
        
        console.log('✅ Safety status updated successfully:', newStatus);
      } else {
        throw new Error(result.error || 'Failed to update safety status');
      }
    } catch (error) {
      console.error('❌ Failed to update safety status:', error);
      alert(`Failed to update safety status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (statusId) => {
    return statusOptions.find(option => option.id === statusId);
  };

  const shouldShowEmergencyPrompt = () => {
    return emergencyLevel === 'critical' && (!userStatus || 
      (new Date() - new Date(userStatus.timestamp)) > 30 * 60 * 1000); // 30 minutes old
  };

  return (
    <div className="space-y-6" data-testid="safety-checkin-section">
      {/* Community Bulletin Board */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <MessageCircle className="h-6 w-6 text-green-600 mr-3" />
            Emergency Bulletin Board
          </h2>
          <button
            onClick={() => setShowCommunityBoard(!showCommunityBoard)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            {showCommunityBoard ? 'Hide Board' : 'View Board'}
          </button>
        </div>
        
        {showCommunityBoard && (
          <div className="space-y-4">
            {/* Post Message Form */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Post to Community Board</h3>
              <div className="space-y-3">
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="support">SUPPORT - Offering help or resources</option>
                  <option value="request">REQUEST - Needing assistance</option>
                  <option value="information">INFO - Sharing emergency information</option>
                  <option value="coordination">COORDINATION - Group coordination</option>
                </select>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Share information, offer help, or coordinate with your community. Keep personal information private."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
                <button
                  onClick={handlePostCommunityMessage}
                  disabled={!newMessage.trim()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post to Community Board
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                ⚠️ All messages are public and visible to emergency coordinators. Do not share personal contact information.
              </div>
            </div>
            
            {/* Community Messages */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-gray-700">Community Messages</h4>
              {communityMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No community messages yet. Be the first to post!</p>
                </div>
              ) : (
                communityMessages.map((msg, index) => (
                  <div key={msg.id || index} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-800">{msg.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Anonymous • {new Date(msg.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help Notifications - Updated for Bulletin Board */}
      {helpNotifications.totalNotifications > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Bell className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">
              Community Help & Messages ({helpNotifications.totalNotifications})
            </h3>
          </div>
          
          {/* Help Offers */}
          {helpNotifications.helpOffers.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Help Offers</h4>
              <div className="space-y-2">
                {helpNotifications.helpOffers.map((offer) => (
                  <div key={offer.id} className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          🤝 Anonymous helper offering: {offer.offerType?.replace('_', ' ') || 'Unknown'}
                        </p>
                        {offer.message && (
                          <p className="text-sm text-gray-700 mt-1">"{offer.message}"</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(offer.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAcceptHelp(offer.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Accept via Board
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Anonymous Messages */}
          {helpNotifications.anonymousMessages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-2">Anonymous Messages</h4>
              <div className="space-y-2">
                {helpNotifications.anonymousMessages.map((msg) => (
                  <div key={msg.id} className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          💬 "{msg.message}"
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Anonymous • {new Date(msg.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRespondToMessage(msg.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 ml-2"
                      >
                        Respond on Board
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Emergency Check-in Prompt - Redesigned for gentle urgency */}
      {shouldShowEmergencyPrompt() && (
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 border-2 border-orange-200 rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-orange-100 p-2 rounded-full">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Emergency Status Update</h2>
              <p className="text-gray-700">Your community needs to know your status and if you can help coordinate.</p>
            </div>
          </div>

          {/* Quick Personal Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">👤 Your Personal Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {statusOptions
                .filter(option => option.category === 'individual')
                .map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleStatusUpdate(option.id)}
                  disabled={loading}
                  data-testid={`status-${option.id}`}
                  aria-label={`Update status to ${option.label}`}
                  className={`bg-white p-4 rounded-lg hover:shadow-md transition-all duration-200 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed border-2 ${
                    option.id === SafetyStatus.SAFE ? 'border-green-200 hover:border-green-300' :
                    option.id === SafetyStatus.EVACUATING ? 'border-yellow-200 hover:border-yellow-300' :
                    option.id === SafetyStatus.NEED_HELP ? 'border-red-200 hover:border-red-300' :
                    'border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <option.icon className={`h-6 w-6 text-${option.color}-600`} />
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">{option.label}</div>
                    <div className="text-xs text-gray-600">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Community Coordination Options */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">🏘️ Community Coordination</h3>
            <p className="text-sm text-gray-600 mb-3">Can you help coordinate neighborhood emergency response?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {statusOptions
                .filter(option => option.category === 'community')
                .slice(0, 4) // Show most relevant community options
                .map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleStatusUpdate(option.id)}
                  disabled={loading}
                  data-testid={`status-${option.id}`}
                  aria-label={`Update status to ${option.label}`}
                  className={`bg-white p-3 rounded-lg hover:shadow-md transition-all duration-200 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 hover:border-gray-300`}
                >
                  <option.icon className={`h-5 w-5 text-${option.color}-600`} />
                  <div className="text-left">
                    <div className="font-medium text-gray-800 text-sm">{option.label}</div>
                    <div className="text-xs text-gray-600">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current Status Display */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Shield className="h-6 w-6 text-blue-600 mr-3" />
            Your Status
          </h2>
          
          {!showCheckinForm && (
            <button
              onClick={() => setShowCheckinForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              Update Status
            </button>
          )}
        </div>

        {/* Your Current Status */}
        {userStatus ? (
          <div className={`${getStatusConfig(userStatus.status)?.theme?.background} ${getStatusConfig(userStatus.status)?.theme?.border} border-2 rounded-lg p-4 mb-4`} data-testid="current-status">
            <div className="flex items-start space-x-3">
              {(() => {
                const config = getStatusConfig(userStatus.status);
                const IconComponent = config?.icon || Shield;
                return <IconComponent className={`h-6 w-6 ${config?.theme?.iconColor} mt-1`} />;
              })()}
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className={`font-semibold ${getStatusConfig(userStatus.status)?.theme?.text}`}>
                    Your Status: {getStatusConfig(userStatus.status)?.label}
                  </h3>
                  <span className="text-xs text-gray-500" data-testid="status-timestamp">
                    {new Date(userStatus.timestamp).toLocaleString()}
                  </span>
                </div>
                
                {userStatus.message && (
                  <p className={`${getStatusConfig(userStatus.status)?.theme?.text} opacity-90 mb-2`} data-testid="status-message">
                    {userStatus.message}
                  </p>
                )}
                
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-3 w-3 mr-1" />
                  {typeof userStatus.location === 'string' ? userStatus.location : 
                   userStatus.location?.region || userStatus.location?.displayName || 'Location not specified'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-gray-600 text-center">
              No safety status set. Click "Update Status" to let your community know you're safe.
            </p>
          </div>
        )}

        {/* Status Update Form */}
        {showCheckinForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Update Your Safety Status</h3>
            
            {/* Simplified Status Selection - Emergency First Design */}
            <div className="space-y-3 mb-4">
              {/* Emergency Options - Always First */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Emergency Assistance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {statusOptions
                    .filter(option => option.category === 'emergency')
                    .map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleStatusSelection(option.id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${option.theme.bg} ${option.theme.border} hover:scale-[1.02]`}
                    >
                      <div className="flex items-center space-x-3">
                        <option.icon className={`h-5 w-5 ${option.theme.icon}`} />
                        <div>
                          <div className={`font-semibold ${option.theme.text}`}>{option.label}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Updates */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  Status Update
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {statusOptions
                    .filter(option => option.category === 'status')
                    .map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleStatusSelection(option.id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${option.theme.bg} ${option.theme.border} hover:scale-[1.02]`}
                    >
                      <div className="flex items-center space-x-3">
                        <option.icon className={`h-5 w-5 ${option.theme.icon}`} />
                        <div>
                          <div className={`font-semibold ${option.theme.text}`}>{option.label}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Community Coordination */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Community Coordination
                </h4>
                <div className="space-y-2">
                  {statusOptions
                    .filter(option => option.category === 'community')
                    .map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleStatusSelection(option.id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${option.theme.bg} ${option.theme.border} hover:scale-[1.02]`}
                    >
                      <div className="flex items-center space-x-3">
                        <option.icon className={`h-5 w-5 ${option.theme.icon}`} />
                        <div>
                          <div className={`font-semibold ${option.theme.text}`}>{option.label}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowCheckinForm(false)}
              className="text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Recent Community Activity */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h3>
        
        {/* Recent Check-ins */}
        <div className="space-y-3" data-testid="recent-checkins">
          <h4 className="font-semibold text-gray-700 text-sm">Recent Safety Updates</h4>
          {nearbyCheckins.map((checkin) => {
            const config = getStatusConfig(checkin.status);
            const IconComponent = config?.icon || Shield;
            
            return (
              <div key={checkin.id} className="border border-gray-200 rounded-lg p-3" data-testid="checkin-item">
                <div className="flex items-start space-x-3">
                  <div className={`p-1.5 rounded-full ${config?.bgColor}`}>
                    <IconComponent className={`h-4 w-4 text-${config?.color}-600`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium text-sm ${config?.textColor}`}>
                        {config?.label}
                      </span>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(checkin.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    
                    {checkin.message && (
                      <p className="text-sm text-gray-700 mb-1">{checkin.message}</p>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    {typeof checkin.location === 'string' ? checkin.location : 
                       checkin.location?.region || checkin.location?.displayName || 'Location not specified'}
                </div>
                  </div>
                </div>
                
                {checkin.status === 'need-help' && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleOfferHelp(checkin.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                          title="Offer help via community board"
                        >
                          <Shield className="h-3 w-3 inline mr-1" />
                          Offer Help
                        </button>
                        <button 
                          onClick={() => {
                            const message = prompt('Post a public support message to the community board:');
                            if (message && message.trim()) {
                              handlePostToCommunity(checkin.id, message);
                            }
                          }}
                          className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-50 transition-colors"
                          title="Send support message via community board"
                        >
                          <MessageCircle className="h-3 w-3 inline mr-1" />
                          Send Support
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Public Board
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-600 bg-green-50 px-2 py-1 rounded">
                      📢 Community coordination - posted to public emergency board
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">🔒 Privacy & Community Safety</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Your location is only shared with nearby community members during emergencies</li>
          <li>• All community board messages are public and moderated for safety</li>
          <li>• Personal contact information is filtered and blocked from messages</li>
          <li>• Emergency services and coordinators can access the bulletin board</li>
          <li>• Check-in data and messages are automatically deleted after 7 days</li>
          <li>• You can update or delete your status at any time</li>
        </ul>
      </div>

      {/* Help Offer Modal */}
      {showHelpModal && selectedCheckinForHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🤝 Offer Anonymous Help</h3>
              <button
                onClick={() => {
                  setShowHelpModal(false);
                  setSelectedCheckinForHelp(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Select the type of help you can offer. Your identity will remain anonymous.
              </p>
              
              {Object.entries(HelpOfferTypes).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => submitHelpOfferWithType(value)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  <div className="font-medium text-gray-800">
                    {value?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || ''}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {getHelpTypeDescription(value)}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-700">
                📢 Your help offer will be posted to the community bulletin board where local emergency coordinators and community members can see it. Your identity remains anonymous.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progressive Disclosure Modal */}
      {showDetailModal && selectedStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <selectedStatus.icon className={`h-5 w-5 mr-2 ${getButtonColors(selectedStatus.id).text}`} />
                {selectedStatus.label}
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedStatus(null);
                  setSelectedDetail('');
                  setCustomDetail('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {selectedStatus.description}. Please provide more details to help your community understand the situation better.
              </p>
              
              {/* Pre-defined detail options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select the most appropriate option:
                </label>
                <div className="space-y-2">
                  {selectedStatus.detailOptions?.map((detail, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedDetail(detail)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedDetail === detail
                          ? `${getButtonColors(selectedStatus.id).border} ${getButtonColors(selectedStatus.id).bgLight}`
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-800">{detail}</div>
                    </button>
                  ))}
                  
                  {/* Custom option */}
                  <button
                    onClick={() => setSelectedDetail('Other')}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDetail === 'Other'
                        ? `${getButtonColors(selectedStatus.id).border} ${getButtonColors(selectedStatus.id).bgLight}`
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-800">Other (specify below)</div>
                  </button>
                </div>
              </div>
              
              {/* Custom detail input */}
              {selectedDetail === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please describe:
                  </label>
                  <textarea
                    value={customDetail}
                    onChange={(e) => setCustomDetail(e.target.value)}
                    placeholder="Provide specific details about the situation..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedStatus(null);
                    setSelectedDetail('');
                    setCustomDetail('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedDetail && (selectedDetail !== 'Other' || customDetail.trim())) {
                      handleStatusUpdate(selectedStatus.id);
                      setShowDetailModal(false);
                      setSelectedStatus(null);
                      setSelectedDetail('');
                      setCustomDetail('');
                    }
                  }}
                  disabled={!selectedDetail || (selectedDetail === 'Other' && !customDetail.trim())}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getButtonColors(selectedStatus.id).background}`}
                >
                  {loading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                📢 Your status update will be shared with your local community to help coordinate emergency response and mutual aid.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SafetyCheckin;