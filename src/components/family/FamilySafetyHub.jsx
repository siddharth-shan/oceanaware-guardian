/**
 * Enhanced Family Safety Hub - Updated for Group Code System
 * Integrates with privacy-first family group codes for anonymous coordination
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Shield, AlertTriangle, Phone, MessageCircle, Clock, Copy, CheckCircle, Settings, LogOut, Bell, CheckSquare, RefreshCw, Trash2, UserMinus, Crown, X } from 'lucide-react';
import { useFamily } from '../../services/family/FamilyContext';
import { useAuth } from '../../services/auth/AuthContext';
import { useAccessibility } from '../accessibility/AccessibilityProvider';
import { useStorage } from '../../services/storage/StorageContext';
import IsolatedGroupSetup from './IsolatedGroupSetup';
import InviteMembers from './InviteMembers';
import QuickJoinGroup from './QuickJoinGroup';

export default function FamilySafetyHub() {
  const { 
    isInGroup, 
    activeGroup, 
    getActiveGroupMembers, 
    getActiveGroupSummary,
    getActiveGroupMessages,
    updateMyStatus,
    markSafe,
    markEmergency,
    requestCheckIn,
    triggerEmergency,
    userNeedsCheckIn,
    leaveActiveGroup,
    refreshActiveGroup,
    removeMember,
    deleteActiveGroup,
    transferOwnership,
    isCreator,
    getMyRole,
    sendMessage,
    MemberStatus,
    loading,
    error,
    clearError
  } = useFamily();
  
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  // Debug authentication state and re-renders
  useEffect(() => {
    console.log('🔐 FamilySafetyHub - Auth state check:', {
      isAuth: isAuthenticated(),
      user: user,
      authLoading: authLoading,
      isInGroup: isInGroup,
      activeGroup: activeGroup?.code,
      loading: loading
    });
  }, [isAuthenticated, user, authLoading, isInGroup, activeGroup, loading]);
  const { speak } = useAccessibility();
  const { saveData, loadData } = useStorage();
  
  const [groupMessage, setGroupMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [members, setMembers] = useState([]);
  const [groupSummary, setGroupSummary] = useState(null);
  const [checkInNeeded, setCheckInNeeded] = useState(false);
  const [groupMessages, setGroupMessages] = useState([]);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [showQuickJoin, setShowQuickJoin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Group management state
  const [showManageGroup, setShowManageGroup] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferOwnership, setShowTransferOwnership] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState('');
  const [memberToRemove, setMemberToRemove] = useState(null);

  // Memoize the onComplete handler to prevent GroupSetup re-renders
  const handleGroupSetupComplete = useCallback(() => {
    // Trigger a context refresh to load the new group
    // Stay within the Family Safety Hub instead of reloading page
    setTimeout(async () => {
      try {
        // Refresh the family context to load the new group
        await refreshActiveGroup();
        console.log('✅ Group setup completed, staying in Family Safety Hub');
        speak('Successfully joined family group');
      } catch (error) {
        console.error('❌ Failed to refresh after group setup:', error);
        // Fallback to page reload if refresh fails
        window.location.reload();
      }
    }, 500); // Slightly longer delay to ensure backend operations are complete
  }, [refreshActiveGroup, speak]);

  // Debug: Log every render with what changed
  console.log('🔐 FamilySafetyHub - RENDER:', {
    isAuth: isAuthenticated(),
    isInGroup,
    activeGroupCode: activeGroup?.code,
    loading,
    authLoading,
    userUid: user?.uid
  });
  
  if (!isAuthenticated()) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-blue-900 mb-2">
            Family Safety Features
          </h2>
          <p className="text-blue-700 mb-4">
            Enable family coordination and emergency communication with privacy protection.
          </p>
          <p className="text-sm text-blue-600">
            Please complete authentication setup to access family safety features.
          </p>
        </div>
      </div>
    );
  }

  // Load group data when activeGroup changes
  useEffect(() => {
    const loadGroupData = async () => {
      if (activeGroup && isInGroup) {
        try {
          const [membersData, summaryData, checkInStatus, role, messages] = await Promise.all([
            getActiveGroupMembers(),
            getActiveGroupSummary(),
            userNeedsCheckIn(),
            getMyRole(),
            getActiveGroupMessages(10) // Get last 10 messages
          ]);
          
          setMembers(membersData || []);
          setGroupSummary(summaryData);
          setCheckInNeeded(checkInStatus);
          setUserRole(role);
          setGroupMessages(messages || []);
          
          // Load last check-in time
          const checkInKey = `last-checkin-${activeGroup.code}`;
          const checkInResult = await loadData(checkInKey);
          if (checkInResult.success) {
            setLastCheckIn(checkInResult.data);
          }
        } catch (error) {
          console.error('Error loading group data:', error);
        }
      }
    };

    loadGroupData();
  }, [activeGroup, isInGroup]);

  // If not in a group, show group setup or quick join
  if (!isInGroup) {
    if (showQuickJoin) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <QuickJoinGroup 
            onSuccess={handleGroupSetupComplete}
            onCancel={() => setShowQuickJoin(false)}
          />
        </div>
      );
    }
    
    return (
      <div className="max-w-4xl mx-auto">
        {/* Quick Join Option */}
        <div className="mb-6 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Already have a group code?</h3>
            <button
              onClick={() => setShowQuickJoin(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Join Existing Group
            </button>
          </div>
        </div>
        
        <IsolatedGroupSetup onComplete={handleGroupSetupComplete} />
      </div>
    );
  }

  const copyGroupCode = async () => {
    try {
      await navigator.clipboard.writeText(activeGroup.code);
      setCopiedCode(true);
      speak('Group code copied to clipboard');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy group code:', error);
    }
  };

  const handleStatusUpdate = async (status) => {
    const result = await updateMyStatus(status);
    if (result.success) {
      const statusLabels = {
        [MemberStatus.SAFE]: 'Safe',
        [MemberStatus.CHECK_IN_NEEDED]: 'Check-in Needed',
        [MemberStatus.EMERGENCY]: 'Emergency',
        [MemberStatus.OFFLINE]: 'Offline'
      };
      
      // Update last check-in time if marking safe
      if (status === MemberStatus.SAFE) {
        const checkInKey = `last-checkin-${activeGroup.code}`;
        const checkInTime = new Date().toISOString();
        await saveData(checkInKey, checkInTime, { skipSync: true });
        setLastCheckIn(checkInTime);
        setCheckInNeeded(false);
      }
      
      speak(`Status updated to ${statusLabels[status]}`, { 
        emergency: status === MemberStatus.EMERGENCY 
      });
      
      // Reload group data to reflect changes
      const [membersData, summaryData] = await Promise.all([
        getActiveGroupMembers(),
        getActiveGroupSummary()
      ]);
      setMembers(membersData || []);
      setGroupSummary(summaryData);
    }
  };

  const handleEmergencyTrigger = async () => {
    const confirmed = window.confirm(
      'This will alert all family members of an emergency situation. Continue?'
    );
    
    if (confirmed) {
      const result = await triggerEmergency('Emergency situation - immediate assistance needed');
      if (result.success) {
        speak('Emergency alert sent to all family members', { emergency: true });
      }
    }
  };

  const handleLeaveGroup = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to leave this family group? You will need the group code to rejoin.'
    );
    
    if (confirmed) {
      const result = await leaveActiveGroup();
      if (result.success) {
        speak('Left family group');
      }
    }
  };

  const handleSendMessage = async () => {
    if (!groupMessage.trim()) return;
    
    try {
      const result = await sendMessage(groupMessage.trim(), 'status_update');
      
      if (result.success) {
        // Clear input and speak confirmation
        setGroupMessage('');
        speak('Safety update sent to family group');
        console.log('✅ Group message sent successfully');
        
        // Refresh messages to show the new message and updates from other members
        const updatedMessages = await getActiveGroupMessages(10);
        setGroupMessages(updatedMessages || []);
      } else {
        speak('Failed to send message');
        console.error('❌ Failed to send message:', result.error);
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      speak('Failed to send message');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case MemberStatus.SAFE:
        return 'bg-green-100 text-green-800 border-green-200';
      case MemberStatus.CHECK_IN_NEEDED:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case MemberStatus.EMERGENCY:
        return 'bg-red-100 text-red-800 border-red-200';
      case MemberStatus.OFFLINE:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case MemberStatus.SAFE:
        return <Shield className="h-5 w-5 text-green-600" />;
      case MemberStatus.EMERGENCY:
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Group Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-3 rounded-full">
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{activeGroup.name}</h1>
              <p className="text-gray-600">
                {members.length} member{members.length !== 1 ? 's' : ''} • Group Code: {activeGroup.code}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={copyGroupCode}
              className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Copy group code"
            >
              {copiedCode ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="text-sm">Copy Code</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowGroupSettings(!showGroupSettings)}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Group settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Group Management - only show for creators */}
            {userRole === 'creator' && (
              <button
                onClick={() => setShowManageGroup(true)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="Manage group"
              >
                <Crown className="h-4 w-4" />
              </button>
            )}

            {/* Leave Group Button */}
            <button
              onClick={async () => {
                const result = await leaveActiveGroup();
                if (result.success) {
                  speak('Left group successfully');
                }
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Leave group"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Group Status Summary */}
        {groupSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {groupSummary.statusCounts[MemberStatus.SAFE] || 0}
              </div>
              <div className="text-sm text-green-800">Safe</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {groupSummary.statusCounts[MemberStatus.CHECK_IN_NEEDED] || 0}
              </div>
              <div className="text-sm text-yellow-800">Check-in Needed</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {groupSummary.statusCounts[MemberStatus.EMERGENCY] || 0}
              </div>
              <div className="text-sm text-red-800">Emergency</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {groupSummary.statusCounts[MemberStatus.OFFLINE] || 0}
              </div>
              <div className="text-sm text-gray-800">Offline</div>
            </div>
          </div>
        )}

        {/* Group Settings */}
        {showGroupSettings && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">Group Settings</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Leave this family group</p>
                <p className="text-xs text-gray-500">You'll need the group code to rejoin</p>
              </div>
              <button
                onClick={handleLeaveGroup}
                className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Leave Group</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* My Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">My Status</h2>
          {lastCheckIn && (
            <div className="text-sm text-gray-600">
              Last check-in: {new Date(lastCheckIn).toLocaleString()}
            </div>
          )}
        </div>
        
        {checkInNeeded && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800 font-medium">Check-in reminder</p>
              </div>
              <p className="text-yellow-700 text-sm">Your family is waiting for a status update.</p>
            </div>
            <button
              onClick={() => handleStatusUpdate(MemberStatus.SAFE)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <CheckSquare className="h-4 w-4 inline mr-1" />
              Check In
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleStatusUpdate(MemberStatus.SAFE)}
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">I'm Safe</span>
            </div>
            <p className="text-xs text-green-700 mt-1">Safe and accounted for</p>
          </button>
          
          <button
            onClick={() => handleStatusUpdate(MemberStatus.CHECK_IN_NEEDED)}
            className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Request Check-in</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">Ask family to check in</p>
          </button>
          
          <button
            onClick={handleEmergencyTrigger}
            className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">Emergency</span>
            </div>
            <p className="text-xs text-red-700 mt-1">Alert all family members</p>
          </button>
        </div>
      </div>

      {/* Invite Members */}
      <InviteMembers 
        groupCode={activeGroup.code}
        groupName={activeGroup.name}
        memberCount={members.length}
      />

      {/* Family Members */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Family Members</h2>
          <button
            onClick={async () => {
              setRefreshing(true);
              try {
                await refreshActiveGroup();
                // Reload the member list and messages after refresh
                const [membersData, summaryData, messages] = await Promise.all([
                  getActiveGroupMembers(),
                  getActiveGroupSummary(),
                  getActiveGroupMessages(10)
                ]);
                setMembers(membersData || []);
                setGroupSummary(summaryData);
                setGroupMessages(messages || []);
                speak('Member list and messages refreshed');
              } catch (error) {
                console.error('Failed to refresh:', error);
              } finally {
                setRefreshing(false);
              }
            }}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh member list"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
        
        <div className="space-y-3">
          {members.map((member, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(member.status)}
                  <div>
                    <h3 className="font-semibold text-gray-800">{member.nickname}</h3>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(member.status)}`}>
                      {member.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last seen: {new Date(member.lastSeen).toLocaleString()}
                  </p>
                  {member.hasLocation && (
                    <p className="text-xs text-blue-600">📍 Location shared</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Communication */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
          Quick Communication
        </h2>
        
        <div className="space-y-4">
          {/* Recent Messages */}
          {groupMessages.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Updates</h3>
              <div className="space-y-2">
                {groupMessages.slice(0, 5).map((msg, index) => (
                  <div key={msg.id || index} className="text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800">
                          {msg.senderNickname || msg.sender || 'Anonymous'}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {msg.senderId === user?.uid && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">You</span>
                      )}
                    </div>
                    <p className="text-gray-700 mt-1">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send Update to Family
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={groupMessage}
                onChange={(e) => setGroupMessage(e.target.value)}
                placeholder="Type your safety update..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSendMessage}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && groupMessage.trim()) {
                    handleSendMessage();
                  }
                }}
                disabled={!groupMessage.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
          
          {/* Quick Message Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Messages</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "I'm safe and staying informed",
                "Currently evacuating, will update soon",
                "Need assistance, please respond",
                "Power is out but we're okay"
              ].map((template, index) => (
                <button
                  key={index}
                  onClick={() => setGroupMessage(template)}
                  className="text-left p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert - Moved to top for better visibility */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md w-full mx-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 text-lg font-semibold ml-2"
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Group Management Modal */}
      {showManageGroup && userRole === 'creator' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Manage Group</h3>
              <button
                onClick={() => setShowManageGroup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Remove Member */}
              {members.length > 1 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Remove Members</h4>
                  <div className="space-y-2">
                    {members.filter(member => member.role !== 'creator').map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{member.nickname}</span>
                        <button
                          onClick={() => setMemberToRemove(member)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transfer Ownership */}
              {members.length > 1 && (
                <button
                  onClick={() => {
                    setShowTransferOwnership(true);
                    setShowManageGroup(false);
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Transfer Ownership
                </button>
              )}

              {/* Delete Group */}
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setShowManageGroup(false);
                }}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Group</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this group? This action will remove all members and cannot be undone.
                The group will be soft-deleted with a 30-day retention period.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const result = await deleteActiveGroup();
                    if (result.success) {
                      speak('Group deleted successfully');
                      setShowDeleteConfirm(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferOwnership && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Transfer Ownership</h3>
              <button
                onClick={() => setShowTransferOwnership(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Select a new group creator. You will become a regular member.
              </p>

              <div className="space-y-2">
                {members.filter(member => member.role !== 'creator').map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedNewOwner(member.id)}
                    className={`w-full text-left p-3 rounded-lg border ${
                      selectedNewOwner === member.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{member.nickname}</span>
                      {selectedNewOwner === member.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowTransferOwnership(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (selectedNewOwner) {
                      const result = await transferOwnership(selectedNewOwner);
                      if (result.success) {
                        speak('Ownership transferred successfully');
                        setShowTransferOwnership(false);
                        setSelectedNewOwner('');
                      }
                    }
                  }}
                  disabled={!selectedNewOwner}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <UserMinus className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Member</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove <strong>{memberToRemove.nickname}</strong> from the group?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setMemberToRemove(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const result = await removeMember(memberToRemove.id);
                    if (result.success) {
                      speak('Member removed successfully');
                      setMemberToRemove(null);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}