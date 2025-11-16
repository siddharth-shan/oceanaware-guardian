/**
 * Family Group Code Service
 * Manages anonymous family group codes for privacy-first coordination
 * Congressional App Challenge compliant with no personal data collection
 * Now uses unified storage manager for enhanced capabilities
 */

import StorageManager from '../storage/StorageManager';
import AzureCloudSyncService from '../storage/AzureCloudSyncService';
import { STORAGE_KEYS } from '../storage/LocalStorageService';

/**
 * Generate a secure, human-readable family group code
 * Format: FIRE-SAFE-1234 (memorable fire safety words + random numbers)
 */
export const generateGroupCode = () => {
  const words = [
    'FIRE', 'SAFE', 'WATCH', 'GUARD', 'SHIELD', 'ALERT',
    'READY', 'BRAVE', 'SWIFT', 'CLEAR', 'STRONG', 'WISE'
  ];
  
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const numbers = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  
  return `${word1}-${word2}-${numbers}`;
};

/**
 * Validate group code format
 */
export const isValidGroupCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  
  const parts = code.split('-');
  if (parts.length !== 3) return false;
  
  const [word1, word2, numbers] = parts;
  
  // Check word format (uppercase letters only)
  if (!/^[A-Z]+$/.test(word1) || !/^[A-Z]+$/.test(word2)) return false;
  
  // Check numbers format (4 digits)
  if (!/^\d{4}$/.test(numbers)) return false;
  
  return true;
};

/**
 * Group member status types
 */
export const MemberStatus = {
  SAFE: 'safe',
  CHECK_IN_NEEDED: 'check-in-needed',
  EMERGENCY: 'emergency',
  OFFLINE: 'offline'
};

/**
 * Group data structure for local storage
 */
const GROUP_SCHEMA = {
  code: '',
  createdAt: '',
  createdBy: '', // anonymous user ID
  name: '', // optional friendly name
  members: [], // array of member objects
  lastActivity: '',
  settings: {
    requireCheckIn: true,
    checkInIntervalHours: 24,
    emergencyAutoShare: false,
    allowNewMembers: true
  }
};

/**
 * Member data structure
 */
const MEMBER_SCHEMA = {
  id: '', // anonymous ID
  joinedAt: '',
  nickname: '', // optional display name (not real name)
  status: MemberStatus.SAFE,
  lastSeen: '',
  location: null, // only if explicitly shared
  emergencyContacts: []
};

/**
 * Storage keys for family groups (using unified storage system)
 */
const FAMILY_STORAGE_KEYS = {
  MY_GROUPS: STORAGE_KEYS.FAMILY_GROUPS,
  GROUP_PREFIX: STORAGE_KEYS.GROUP_PREFIX,
  MEMBER_PREFIX: STORAGE_KEYS.MEMBER_PREFIX
};

/**
 * Create a new family group
 */
export const createFamilyGroup = async (userAuth, groupName = '') => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required to create family group');
    }

    const groupCode = generateGroupCode();
    const now = new Date().toISOString();
    
    const groupData = {
      ...GROUP_SCHEMA,
      code: groupCode,
      createdAt: now,
      createdBy: userAuth.uid,
      name: groupName || `Family Group ${groupCode}`,
      lastActivity: now,
      members: [{
        ...MEMBER_SCHEMA,
        id: userAuth.uid,
        joinedAt: now,
        nickname: 'Group Creator',
        status: MemberStatus.SAFE,
        lastSeen: now
      }]
    };

    // Store group data locally first
    await StorageManager.save(
      `${FAMILY_STORAGE_KEYS.GROUP_PREFIX}${groupCode}`,
      groupData,
      { skipSync: true } // Save locally first, then sync to Azure
    );

    // Upload to Azure for cross-device discovery
    try {
      await AzureCloudSyncService.uploadGroupData(groupCode, groupData);
      console.log(`☁️ Group ${groupCode} uploaded to Azure for cross-device joining`);
    } catch (error) {
      console.warn(`⚠️ Failed to upload group to Azure (will work locally):`, error);
    }

    // Add to user's group list
    const myGroups = await getMyGroups();
    myGroups.push({
      code: groupCode,
      name: groupData.name,
      role: 'creator',
      joinedAt: now
    });
    await StorageManager.save(FAMILY_STORAGE_KEYS.MY_GROUPS, myGroups, {
      skipSync: true // Personal group lists remain local-only for privacy
    });

    console.log('✅ Family group created:', groupCode);
    return {
      success: true,
      groupCode,
      group: groupData
    };
  } catch (error) {
    console.error('❌ Failed to create family group:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Join an existing family group
 */
export const joinFamilyGroup = async (userAuth, groupCode, nickname = '') => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required to join family group');
    }

    if (!isValidGroupCode(groupCode)) {
      throw new Error('Invalid group code format');
    }

    // Check if group exists locally first
    let groupData = await getGroupData(groupCode);
    
    // If not found locally, try to discover from Azure cloud (cross-device joining)
    if (!groupData) {
      console.log('🔍 Group not found locally, attempting Azure cloud discovery...');
      try {
        const azureResult = await AzureCloudSyncService.downloadGroupData(groupCode);
        
        if (azureResult.success && azureResult.data) {
          groupData = azureResult.data;
          console.log('✅ Found group in Azure cloud storage');
          
          // Save to local storage for future access
          await StorageManager.save(
            `${FAMILY_STORAGE_KEYS.GROUP_PREFIX}${groupCode}`,
            groupData,
            { skipSync: true } // Already from cloud, no need to sync back
          );
        }
      } catch (error) {
        console.log('⚠️ Azure cloud discovery failed:', error);
      }
    }
    
    if (!groupData) {
      throw new Error('Group not found. Make sure the group code is correct and that the group creator has enabled cloud sync.');
    }

    if (!groupData.settings.allowNewMembers) {
      throw new Error('This group is not accepting new members');
    }

    // Check if user is already a member
    const existingMember = groupData.members.find(m => m.id === userAuth.uid);
    if (existingMember) {
      return {
        success: true,
        message: 'Already a member of this group',
        group: groupData
      };
    }

    const now = new Date().toISOString();
    
    // Add new member
    const newMember = {
      ...MEMBER_SCHEMA,
      id: userAuth.uid,
      joinedAt: now,
      nickname: nickname || `Member ${groupData.members.length + 1}`,
      status: MemberStatus.SAFE,
      lastSeen: now
    };

    groupData.members.push(newMember);
    groupData.lastActivity = now;

    // Update group data locally first
    await StorageManager.save(
      `${FAMILY_STORAGE_KEYS.GROUP_PREFIX}${groupCode}`,
      groupData,
      { skipSync: true } // Save locally first, then sync to Azure
    );

    // Upload updated group to Azure for cross-device synchronization
    try {
      await AzureCloudSyncService.uploadGroupData(groupCode, groupData);
      console.log(`☁️ Group ${groupCode} updated in Azure for cross-device sync`);
    } catch (error) {
      console.warn(`⚠️ Failed to sync group update to Azure:`, error);
    }

    // Add to user's group list
    const myGroups = await getMyGroups();
    myGroups.push({
      code: groupCode,
      name: groupData.name,
      role: 'member',
      joinedAt: now
    });
    await StorageManager.save(FAMILY_STORAGE_KEYS.MY_GROUPS, myGroups, {
      skipSync: true // Personal group lists remain local-only for privacy
    });

    console.log('✅ Joined family group:', groupCode);
    return {
      success: true,
      group: groupData
    };
  } catch (error) {
    console.error('❌ Failed to join family group:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all groups user belongs to
 */
export const getMyGroups = async () => {
  try {
    const result = await StorageManager.load(FAMILY_STORAGE_KEYS.MY_GROUPS, {
      defaultValue: []
    });
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error loading user groups:', error);
    return [];
  }
};

/**
 * Get group data by code with cloud sync
 * Attempts to fetch latest data from cloud first, then falls back to local storage
 */
export const getGroupData = async (groupCode, forceCloudSync = false) => {
  try {
    // If force cloud sync is requested or we want fresh data, try cloud first
    if (forceCloudSync || Math.random() < 0.3) { // 30% chance to check cloud for freshness
      try {
        console.log(`🔄 Attempting to sync group ${groupCode} from cloud...`);
        const azureResult = await AzureCloudSyncService.downloadGroupData(groupCode);
        
        if (azureResult.success && azureResult.data) {
          console.log(`✅ Got fresh group data from cloud for ${groupCode}`);
          
          // Update local storage with fresh data
          await StorageManager.save(
            `${FAMILY_STORAGE_KEYS.GROUP_PREFIX}${groupCode}`,
            azureResult.data,
            { skipSync: true } // Already from cloud
          );
          
          return azureResult.data;
        }
      } catch (error) {
        console.log(`⚠️ Could not sync from cloud, using local data:`, error.message);
      }
    }
    
    // Fallback to local storage
    const result = await StorageManager.load(`${FAMILY_STORAGE_KEYS.GROUP_PREFIX}${groupCode}`, {
      defaultValue: null
    });
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Error loading group data:', error);
    return null;
  }
};

/**
 * Get group data from local storage only (for performance-critical operations)
 */
export const getGroupDataLocal = async (groupCode) => {
  try {
    const result = await StorageManager.load(`${FAMILY_STORAGE_KEYS.GROUP_PREFIX}${groupCode}`, {
      defaultValue: null
    });
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Error loading local group data:', error);
    return null;
  }
};

/**
 * Update member status in a group
 */
export const updateMemberStatus = async (userAuth, groupCode, status, location = null) => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required');
    }

    const groupData = await getGroupData(groupCode);
    if (!groupData) {
      throw new Error('Group not found');
    }

    const memberIndex = groupData.members.findIndex(m => m.id === userAuth.uid);
    if (memberIndex === -1) {
      throw new Error('Not a member of this group');
    }

    const now = new Date().toISOString();
    
    // Update member status
    groupData.members[memberIndex] = {
      ...groupData.members[memberIndex],
      status,
      lastSeen: now,
      location: location // Only if explicitly provided
    };

    groupData.lastActivity = now;

    // Save updated group data locally first
    await StorageManager.save(
      `${FAMILY_STORAGE_KEYS.GROUP_PREFIX}${groupCode}`,
      groupData,
      { skipSync: true } // Save locally first, then sync to Azure
    );

    // Upload status update to Azure for real-time cross-device updates
    try {
      await AzureCloudSyncService.uploadGroupData(groupCode, groupData);
      console.log(`☁️ Status update synced to Azure for group ${groupCode}`);
    } catch (error) {
      console.warn(`⚠️ Failed to sync status update to Azure:`, error);
    }

    console.log('✅ Member status updated:', status);
    return {
      success: true,
      group: groupData
    };
  } catch (error) {
    console.error('❌ Failed to update member status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};


/**
 * Get group members with privacy protection
 */
export const getGroupMembers = async (groupCode) => {
  const groupData = await getGroupData(groupCode);
  if (!groupData) return [];

  // Return privacy-safe member data
  return groupData.members.map(member => ({
    id: member.id.slice(0, 8) + '...', // Truncated ID for privacy
    nickname: member.nickname,
    status: member.status,
    lastSeen: member.lastSeen,
    joinedAt: member.joinedAt,
    hasLocation: member.location !== null
  }));
};

/**
 * Check if user needs to check in
 */
export const needsCheckIn = async (userAuth, groupCode) => {
  const groupData = await getGroupData(groupCode);
  if (!groupData || !userAuth?.uid) return false;

  const member = groupData.members.find(m => m.id === userAuth.uid);
  if (!member) return false;

  const lastSeen = new Date(member.lastSeen);
  const now = new Date();
  const hoursSinceCheckIn = (now - lastSeen) / (1000 * 60 * 60);

  return hoursSinceCheckIn >= groupData.settings.checkInIntervalHours;
};

/**
 * Get privacy-safe group summary for UI
 */
export const getGroupSummary = async (groupCode) => {
  const groupData = await getGroupData(groupCode);
  if (!groupData) return null;

  const statusCounts = groupData.members.reduce((counts, member) => {
    counts[member.status] = (counts[member.status] || 0) + 1;
    return counts;
  }, {});

  return {
    code: groupCode,
    name: groupData.name,
    memberCount: groupData.members.length,
    lastActivity: groupData.lastActivity,
    statusCounts,
    settings: groupData.settings
  };
};

/**
 * Emergency: Set all group members to emergency status
 */
export const triggerGroupEmergency = async (userAuth, groupCode, message = '') => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required');
    }

    const result = await updateMemberStatus(userAuth, groupCode, MemberStatus.EMERGENCY);
    
    if (result.success) {
      // Log emergency trigger for local records
      const emergencyLog = {
        triggeredBy: userAuth.uid,
        groupCode,
        message,
        timestamp: new Date().toISOString()
      };
      
      const emergencyKey = `emergency-log-${Date.now()}`;
      await StorageManager.save(emergencyKey, emergencyLog, {
        skipSync: true // Emergency logs remain local-only for privacy
      });
      
      console.log('🚨 Group emergency triggered:', groupCode);
    }

    return result;
  } catch (error) {
    console.error('❌ Failed to trigger group emergency:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Leave a group (self-removal)
 */
export const leaveGroup = async (userAuth, groupCode, reason = 'voluntary') => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required');
    }

    console.log(`🚪 Attempting to leave group ${groupCode}...`);

    const response = await fetch(`/api/family-groups/${groupCode}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memberId: userAuth.uid,
        reason
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to leave group');
    }

    // Remove group from local storage if successfully left
    if (result.success) {
      await StorageManager.remove(`${FAMILY_STORAGE_KEYS.GROUP_PREFIX}${groupCode}`);
      console.log(`✅ Successfully left group ${groupCode}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Failed to leave group:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Remove a member from group (creator only)
 */
export const removeMemberFromGroup = async (userAuth, groupCode, memberId, reason = 'removed by creator') => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required');
    }

    console.log(`🚫 Attempting to remove member ${memberId} from group ${groupCode}...`);

    const response = await fetch(`/api/family-groups/${groupCode}/members/${memberId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        removedBy: userAuth.uid,
        reason
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to remove member');
    }

    // Refresh local group data if successful
    if (result.success) {
      await getGroupData(groupCode, true); // Force refresh from cloud
      console.log(`✅ Successfully removed member from group ${groupCode}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Failed to remove member:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete a group (soft delete with 30-day retention)
 */
export const deleteGroup = async (userAuth, groupCode, permanent = false) => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required');
    }

    console.log(`🗑️ Attempting to delete group ${groupCode} (permanent: ${permanent})...`);

    const response = await fetch(`/api/family-groups/${groupCode}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deletedBy: userAuth.uid,
        permanent
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete group');
    }

    // Remove group from local storage if successfully deleted
    if (result.success) {
      await StorageManager.remove(`${FAMILY_STORAGE_KEYS.GROUP_PREFIX}${groupCode}`);
      console.log(`✅ Successfully deleted group ${groupCode}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Failed to delete group:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Transfer group ownership to another member
 */
export const transferGroupOwnership = async (userAuth, groupCode, newCreatorId) => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required');
    }

    console.log(`👑 Attempting to transfer ownership of group ${groupCode} to ${newCreatorId}...`);

    const response = await fetch(`/api/family-groups/${groupCode}/transfer-ownership`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentCreatorId: userAuth.uid,
        newCreatorId
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to transfer ownership');
    }

    // Refresh local group data if successful
    if (result.success) {
      await getGroupData(groupCode, true); // Force refresh from cloud
      console.log(`✅ Successfully transferred ownership of group ${groupCode}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Failed to transfer ownership:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if user is creator of a group
 */
export const isGroupCreator = async (userAuth, groupCode) => {
  try {
    if (!userAuth?.uid) return false;

    const groupData = await getGroupData(groupCode);
    if (!groupData) return false;

    const member = groupData.members?.find(m => m.id === userAuth.uid);
    return member?.role === 'creator';
  } catch (error) {
    console.error('❌ Failed to check creator status:', error);
    return false;
  }
};

/**
 * Get group member with role information
 */
export const getGroupMemberWithRole = async (userAuth, groupCode) => {
  try {
    if (!userAuth?.uid) return null;

    const groupData = await getGroupData(groupCode);
    if (!groupData) return null;

    return groupData.members?.find(m => m.id === userAuth.uid) || null;
  } catch (error) {
    console.error('❌ Failed to get member info:', error);
    return null;
  }
};

/**
 * Send message to group (using Cosmos DB API)
 */
export const sendGroupMessage = async (userAuth, groupCode, message, messageType = 'status_update') => {
  try {
    if (!userAuth?.uid) {
      throw new Error('Authentication required');
    }

    // Get member info for sender nickname
    const member = await getGroupMemberWithRole(userAuth, groupCode);
    const senderNickname = member?.nickname || 'Anonymous';

    console.log(`💬 Sending message to group ${groupCode}...`);

    const response = await fetch(`/api/family-groups/${groupCode}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: userAuth.uid,
        senderNickname,
        message: message.trim(),
        messageType
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send message');
    }

    console.log(`✅ Message sent to group ${groupCode}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send message:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get group messages (latest first)
 */
export const getGroupMessages = async (userAuth, groupCode, limit = 20) => {
  try {
    if (!userAuth?.uid) return [];

    console.log(`💬 Fetching messages for group ${groupCode}...`);

    const response = await fetch(`/api/family-groups/${groupCode}/messages?limit=${limit}&memberId=${userAuth.uid}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get messages');
    }

    const result = await response.json();
    console.log(`✅ Retrieved ${result.messages?.length || 0} messages for group ${groupCode}`);
    
    return result.messages || [];
  } catch (error) {
    console.error('❌ Failed to get messages:', error);
    return [];
  }
};