/**
 * Family Group Context
 * React context for managing family group state and operations
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  createFamilyGroup,
  joinFamilyGroup,
  getMyGroups,
  getGroupData,
  updateMemberStatus,
  leaveGroup,
  removeMemberFromGroup,
  deleteGroup,
  transferGroupOwnership,
  isGroupCreator,
  getGroupMemberWithRole,
  getGroupMembers,
  getGroupSummary,
  needsCheckIn,
  triggerGroupEmergency,
  sendGroupMessage,
  getGroupMessages,
  MemberStatus
} from './GroupCodeService';

const FamilyContext = createContext({});

/**
 * Family Provider Component
 * Manages family group state and provides group operations
 */
export const FamilyProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user's groups on auth state change
  useEffect(() => {
    const loadGroups = async () => {
      if (isAuthenticated()) {
        try {
          // Clear localStorage if there's a user change to prevent cross-user data contamination
          const lastUserId = localStorage.getItem('ecoquest-last-user-id');
          const currentUserId = user?.uid;
          
          if (lastUserId && lastUserId !== currentUserId) {
            console.log('🔄 User changed, clearing localStorage cache');
            localStorage.removeItem('ecoquest-last-active-group');
            localStorage.removeItem('ecoquest-family-groups-cache');
          }
          
          if (currentUserId) {
            localStorage.setItem('ecoquest-last-user-id', currentUserId);
          }
          
          const groups = await getMyGroups();
          console.log('📋 Loaded groups from storage:', groups);
          setMyGroups(groups);
          
          // Auto-select active group logic
          if (groups && groups.length > 0) {
            // Try to restore last active group from localStorage
            const lastActiveGroupCode = localStorage.getItem('ecoquest-last-active-group');
            
            let groupToActivate = null;
            
            // First try to restore the last active group
            if (lastActiveGroupCode) {
              groupToActivate = groups.find(g => g.code === lastActiveGroupCode);
              console.log('🔄 Attempting to restore last active group:', lastActiveGroupCode, groupToActivate ? 'found' : 'not found');
            }
            
            // If no last active group or it's not found, use the first group
            if (!groupToActivate && groups.length > 0) {
              groupToActivate = groups[0];
              console.log('🎯 No last active group, selecting first group:', groupToActivate.code);
            }
            
            // Load the full group data and set as active
            if (groupToActivate && (!activeGroup || activeGroup.code !== groupToActivate.code)) {
              console.log('🔥 Loading full group data for:', groupToActivate.code);
              const fullGroupData = await getGroupData(groupToActivate.code);
              if (fullGroupData) {
                // Validate that the current user is still a member
                const currentMember = fullGroupData.members?.find(m => m.id === currentUserId);
                if (currentMember) {
                  setActiveGroup(fullGroupData);
                  // Save as last active group
                  localStorage.setItem('ecoquest-last-active-group', groupToActivate.code);
                  console.log('✅ Set active group:', fullGroupData.name, fullGroupData.code);
                } else {
                  console.warn('⚠️ Current user is no longer a member of group:', groupToActivate.code);
                  // Remove from localStorage as user is no longer a member
                  localStorage.removeItem('ecoquest-last-active-group');
                  localStorage.removeItem(`ecoquest-group-${groupToActivate.code}`);
                }
              } else {
                console.warn('⚠️ Could not load full data for group (may be deleted):', groupToActivate.code);
                // Remove from localStorage as group no longer exists
                localStorage.removeItem('ecoquest-last-active-group');
                localStorage.removeItem(`ecoquest-group-${groupToActivate.code}`);
              }
            }
          } else {
            console.log('📭 No groups found, clearing active group');
            setActiveGroup(null);
            localStorage.removeItem('ecoquest-last-active-group');
          }
          
          // If we already had an active group, refresh its data
          if (activeGroup && groups.some(g => g.code === activeGroup.code)) {
            console.log('🔄 Refreshing existing active group data:', activeGroup.code);
            const updatedGroupData = await getGroupData(activeGroup.code);
            if (updatedGroupData) {
              setActiveGroup(updatedGroupData);
            }
          }
        } catch (error) {
          console.error('❌ Error loading groups:', error);
          setError('Failed to load family groups');
        }
      } else {
        console.log('🚪 User not authenticated, clearing groups');
        setMyGroups([]);
        setActiveGroup(null);
        localStorage.removeItem('ecoquest-last-active-group');
      }
    };
    
    loadGroups();
  }, [user, isAuthenticated]); // Removed activeGroup from deps to prevent infinite loop

  // Auto-refresh active group data (only when not loading to prevent focus issues)
  useEffect(() => {
    let interval;
    if (activeGroup && !loading) {
      interval = setInterval(async () => {
        if (activeGroup?.code) {
          console.log('🔄 Auto-refreshing group data from cloud...');
          const updatedGroupData = await getGroupData(activeGroup.code, true); // Force cloud sync
          if (updatedGroupData) {
            // Check if there are actually changes before updating state
            const currentMemberCount = activeGroup.members?.length || 0;
            const newMemberCount = updatedGroupData.members?.length || 0;
            
            if (currentMemberCount !== newMemberCount || 
                JSON.stringify(activeGroup.members) !== JSON.stringify(updatedGroupData.members)) {
              console.log(`✅ Group data updated: ${currentMemberCount} -> ${newMemberCount} members`);
              setActiveGroup(updatedGroupData);
            }
          }
        }
      }, 15000); // Refresh every 15 seconds for better real-time experience
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeGroup, loading]);

  /**
   * Load user's groups from local storage
   */
  const loadMyGroups = useCallback(async () => {
    try {
      const groups = await getMyGroups();
      setMyGroups(groups);
    } catch (error) {
      console.error('Error loading groups:', error);
      setError('Failed to load family groups');
    }
  }, []);

  /**
   * Validate if active group still exists and is accessible
   */
  const validateActiveGroup = useCallback(async () => {
    if (!activeGroup?.code) return { valid: false, error: 'No active group' };
    
    try {
      const groupData = await getGroupData(activeGroup.code, true); // Force cloud sync
      
      if (!groupData) {
        // Group has been deleted or is no longer accessible
        console.warn('⚠️ Active group is no longer accessible:', activeGroup.code);
        
        // Clear invalid group from state and storage
        setActiveGroup(null);
        localStorage.removeItem('ecoquest-last-active-group');
        localStorage.removeItem(`ecoquest-group-${activeGroup.code}`);
        
        return { 
          valid: false, 
          error: `Group "${activeGroup.name}" is no longer available. It may have been deleted or you may have been removed from it.` 
        };
      }
      
      // Check if current user is still a member
      const currentMember = groupData.members?.find(m => m.id === user?.uid);
      if (!currentMember) {
        console.warn('⚠️ Current user is no longer a member of group:', activeGroup.code);
        
        // Clear group from state and storage
        setActiveGroup(null);
        localStorage.removeItem('ecoquest-last-active-group');
        localStorage.removeItem(`ecoquest-group-${activeGroup.code}`);
        
        return {
          valid: false,
          error: `You are no longer a member of group "${activeGroup.name}". You may have been removed from the group.`
        };
      }
      
      return { valid: true, groupData };
    } catch (error) {
      console.error('❌ Error validating active group:', error);
      return { valid: false, error: 'Failed to validate group membership' };
    }
  }, [activeGroup, user]);

  /**
   * Refresh active group data with cloud sync
   */
  const refreshActiveGroup = useCallback(async () => {
    if (activeGroup?.code) {
      console.log('🔄 Manually refreshing group data from cloud...');
      const validation = await validateActiveGroup();
      
      if (validation.valid && validation.groupData) {
        console.log('✅ Group data refreshed successfully');
        setActiveGroup(validation.groupData);
      } else if (!validation.valid) {
        setError(validation.error);
      }
    }
  }, [activeGroup, validateActiveGroup]);

  /**
   * Create a new family group
   */
  const createGroup = async (groupName = '') => {
    if (!isAuthenticated()) {
      setError('Authentication required to create family group');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createFamilyGroup(user, groupName);
      
      if (result.success) {
        loadMyGroups();
        setActiveGroup(result.group);
        // Save as last active group
        localStorage.setItem('ecoquest-last-active-group', result.group.code);
        console.log('✅ Family group created successfully:', result.group.code);
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = 'Failed to create family group';
      setError(errorMsg);
      console.error('❌', errorMsg, error);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Join an existing family group
   */
  const joinGroup = async (groupCode, nickname = '') => {
    if (!isAuthenticated()) {
      setError('Authentication required to join family group');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await joinFamilyGroup(user, groupCode.toUpperCase(), nickname);
      
      if (result.success) {
        loadMyGroups();
        setActiveGroup(result.group);
        // Save as last active group
        localStorage.setItem('ecoquest-last-active-group', result.group.code);
        console.log('✅ Joined family group successfully:', result.group.code);
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = 'Failed to join family group';
      setError(errorMsg);
      console.error('❌', errorMsg, error);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Leave a family group
   */
  const leaveActiveGroup = async () => {
    if (!activeGroup || !isAuthenticated()) {
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await leaveGroup(user, activeGroup.code);
      
      if (result.success) {
        // Clear all localStorage entries related to this group
        localStorage.removeItem('ecoquest-last-active-group');
        localStorage.removeItem(`ecoquest-group-${activeGroup.code}`);
        localStorage.removeItem('ecoquest-family-groups-cache');
        
        // Clear state immediately to prevent UI inconsistencies
        setActiveGroup(null);
        setMyGroups([]);
        
        // Reload groups from server to get updated list
        setTimeout(async () => {
          await loadMyGroups();
        }, 100);
        
        console.log('✅ Left family group successfully and cleared cache');
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = 'Failed to leave family group';
      setError(errorMsg);
      console.error('❌', errorMsg, error);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user's status in active group with validation
   */
  const updateMyStatus = async (status, location = null) => {
    if (!activeGroup || !isAuthenticated()) {
      return { success: false, error: 'No active group or authentication required' };
    }

    // Validate group before updating status
    const validation = await validateActiveGroup();
    if (!validation.valid) {
      setError(validation.error);
      return { success: false, error: validation.error };
    }

    try {
      const result = await updateMemberStatus(user, activeGroup.code, status, location);
      
      if (result.success) {
        setActiveGroup(result.group);
        console.log('✅ Status updated successfully');
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = 'Failed to update status';
      setError(errorMsg);
      console.error('❌', errorMsg, error);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Set group to active/selected state
   */
  const selectGroup = async (groupCode) => {
    const groupData = await getGroupData(groupCode);
    if (groupData) {
      setActiveGroup(groupData);
    }
  };

  /**
   * Get members of active group
   */
  const getActiveGroupMembers = async () => {
    if (!activeGroup) return [];
    return await getGroupMembers(activeGroup.code);
  };

  /**
   * Get summary of active group
   */
  const getActiveGroupSummary = async () => {
    if (!activeGroup) return null;
    return await getGroupSummary(activeGroup.code);
  };

  /**
   * Check if user needs to check in to active group
   */
  const userNeedsCheckIn = async () => {
    if (!activeGroup || !isAuthenticated()) return false;
    return await needsCheckIn(user, activeGroup.code);
  };

  /**
   * Trigger emergency for active group
   */
  const triggerEmergency = async (message = '') => {
    if (!activeGroup || !isAuthenticated()) {
      return { success: false };
    }

    try {
      const result = await triggerGroupEmergency(user, activeGroup.code, message);
      
      if (result.success) {
        setActiveGroup(result.group);
        console.log('🚨 Emergency triggered successfully');
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = 'Failed to trigger emergency';
      setError(errorMsg);
      console.error('❌', errorMsg, error);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Quick status update shortcuts
   */
  const markSafe = () => updateMyStatus(MemberStatus.SAFE);
  const markEmergency = () => updateMyStatus(MemberStatus.EMERGENCY);
  const requestCheckIn = () => updateMyStatus(MemberStatus.CHECK_IN_NEEDED);

  /**
   * Remove member from active group (creator only)
   */
  const removeMember = async (memberId, reason = 'removed by creator') => {
    if (!activeGroup || !isAuthenticated()) {
      return { success: false };
    }

    setLoading(true);
    try {
      const result = await removeMemberFromGroup(user, activeGroup.code, memberId, reason);
      
      if (result.success) {
        await refreshActiveGroup(); // Refresh to show updated member list
        console.log('✅ Member removed successfully');
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = 'Failed to remove member';
      setError(errorMsg);
      console.error('❌', errorMsg, error);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete active group (creator only)
   */
  const deleteActiveGroup = async (permanent = false) => {
    if (!activeGroup || !isAuthenticated()) {
      return { success: false };
    }

    setLoading(true);
    try {
      const result = await deleteGroup(user, activeGroup.code, permanent);
      
      if (result.success) {
        setActiveGroup(null);
        loadMyGroups();
        console.log('✅ Group deleted successfully');
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = 'Failed to delete group';
      setError(errorMsg);
      console.error('❌', errorMsg, error);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Transfer ownership of active group
   */
  const transferOwnership = async (newCreatorId) => {
    if (!activeGroup || !isAuthenticated()) {
      return { success: false };
    }

    setLoading(true);
    try {
      const result = await transferGroupOwnership(user, activeGroup.code, newCreatorId);
      
      if (result.success) {
        await refreshActiveGroup(); // Refresh to show updated roles
        console.log('✅ Ownership transferred successfully');
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = 'Failed to transfer ownership';
      setError(errorMsg);
      console.error('❌', errorMsg, error);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if current user is creator of active group
   */
  const isCreator = async () => {
    if (!activeGroup || !isAuthenticated()) {
      return false;
    }
    return await isGroupCreator(user, activeGroup.code);
  };

  /**
   * Get current user's role in active group
   */
  const getMyRole = async () => {
    if (!activeGroup || !isAuthenticated()) {
      return null;
    }
    const member = await getGroupMemberWithRole(user, activeGroup.code);
    return member?.role || null;
  };

  /**
   * Send message to active group with validation
   */
  const sendMessage = async (message, messageType = 'status_update') => {
    if (!activeGroup || !isAuthenticated()) {
      return { success: false, error: 'No active group or authentication required' };
    }

    // Validate group before sending message
    const validation = await validateActiveGroup();
    if (!validation.valid) {
      setError(validation.error);
      return { success: false, error: validation.error };
    }

    try {
      const result = await sendGroupMessage(user, activeGroup.code, message, messageType);
      
      if (result.success) {
        // Refresh group data to show new message
        await refreshActiveGroup();
        console.log('✅ Message sent successfully');
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = 'Failed to send message';
      setError(errorMsg);
      console.error('❌', errorMsg, error);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Get messages from active group
   */
  const getActiveGroupMessages = async (limit = 20) => {
    if (!activeGroup || !isAuthenticated()) {
      return [];
    }

    try {
      return await getGroupMessages(user, activeGroup.code, limit);
    } catch (error) {
      console.error('❌ Failed to get group messages:', error);
      return [];
    }
  };

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get family group statistics
   */
  const getGroupStats = async () => {
    const totalGroups = myGroups.length;
    let totalMembers = 0;
    
    for (const group of myGroups) {
      const groupData = await getGroupData(group.code);
      totalMembers += groupData?.members?.length || 0;
    }

    return {
      totalGroups,
      totalMembers,
      hasActiveGroup: activeGroup !== null,
      needsCheckIn: await userNeedsCheckIn()
    };
  };

  // Context value with all family operations and state (memoized to prevent re-renders)
  const value = useMemo(() => ({
    // State
    myGroups,
    activeGroup,
    loading,
    error,
    
    // Group Operations
    createGroup,
    joinGroup,
    leaveActiveGroup,
    deleteActiveGroup,
    transferOwnership,
    selectGroup,
    refreshActiveGroup,
    
    // Member Operations
    updateMyStatus,
    removeMember,
    markSafe,
    markEmergency,
    requestCheckIn,
    triggerEmergency,
    
    // Data Access
    getActiveGroupMembers,
    getActiveGroupSummary,
    getActiveGroupMessages,
    getGroupStats,
    userNeedsCheckIn,
    isCreator,
    getMyRole,
    
    // Messaging
    sendMessage,
    
    // Utility
    clearError,
    loadMyGroups,
    
    // Constants
    MemberStatus,
    
    // Computed Properties
    hasGroups: myGroups.length > 0,
    isInGroup: activeGroup !== null,
    canUseFamily: isAuthenticated(),
    userIsGroupCreator: activeGroup?.createdBy === user?.uid
  }), [
    myGroups,
    activeGroup,
    loading,
    error,
    user,
    clearError,
    loadMyGroups,
    refreshActiveGroup
  ]);

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
};

/**
 * Custom hook to use family context
 */
export const useFamily = () => {
  const context = useContext(FamilyContext);
  
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  
  return context;
};

/**
 * Higher-order component to require family group membership
 */
export const withFamilyGroup = (Component) => {
  return function FamilyGroupComponent(props) {
    const { isInGroup, loading } = useFamily();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading family group...</p>
          </div>
        </div>
      );
    }
    
    if (!isInGroup) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 m-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Family Group Required
          </h3>
          <p className="text-blue-700">
            This feature requires being part of a family group. Create or join a group to access family safety features.
          </p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

export default FamilyContext;