/**
 * Family Groups API Routes - Cosmos DB Version
 * Provides family group data storage and retrieval for cross-device access
 * Privacy-first design with anonymous group codes
 * Uses Azure Cosmos DB for cloud storage
 */

import express from 'express';
import { CosmosClient } from '@azure/cosmos';
import dotenv from 'dotenv';

const router = express.Router();

// Load environment variables (Azure App Service will override with app settings)
dotenv.config({ path: '../.env.local' });

// Cosmos DB configuration
const cosmosConnectionString = process.env.COSMOS_PRIMARY_CONNECTION_STRING;
const databaseName = 'EcoQuestDB';
const containerName = 'FamilyGroups';

let cosmosClient;
let database;
let container;

// Initialize Cosmos DB connection
async function initializeCosmosDB() {
  try {
    console.log('Initializing Cosmos DB connection...');
    console.log('Connection string available:', !!cosmosConnectionString);
    
    if (!cosmosConnectionString) {
      console.error('COSMOS_PRIMARY_CONNECTION_STRING not found in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('COSMOS')));
      throw new Error('COSMOS_PRIMARY_CONNECTION_STRING not found in environment variables');
    }
    
    // Initialize CosmosClient with connection string and additional options
    cosmosClient = new CosmosClient({
      connectionString: cosmosConnectionString,
      userAgentSuffix: 'EcoQuestWildfireWatch/1.0.0'
    });
    
    // Create database if it doesn't exist
    const { database: db } = await cosmosClient.databases.createIfNotExists({
      id: databaseName
    });
    database = db;
    
    // Create container if it doesn't exist
    const { container: cont } = await database.containers.createIfNotExists({
      id: containerName,
      partitionKey: {
        kind: 'Hash',
        paths: ['/groupCode']
      }
    });
    container = cont;
    
    console.log(`✅ Connected to Cosmos DB: ${databaseName}/${containerName}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Cosmos DB:', error);
    return false;
  }
}

// Initialize on startup
let cosmosReady = false;
initializeCosmosDB().then(success => {
  cosmosReady = success;
});

/**
 * Validate group code format
 */
function isValidGroupCode(code) {
  if (!code || typeof code !== 'string') return false;
  
  const parts = code.split('-');
  if (parts.length !== 3) return false;
  
  const [word1, word2, numbers] = parts;
  
  // Check word format (uppercase letters only)
  if (!/^[A-Z]+$/.test(word1) || !/^[A-Z]+$/.test(word2)) return false;
  
  // Check numbers format (4 digits)
  if (!/^\d{4}$/.test(numbers)) return false;
  
  return true;
}

/**
 * Get health status
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'family-groups',
    storage: cosmosReady ? 'cosmos-db' : 'cosmos-db-unavailable',
    database: databaseName,
    container: containerName,
    connected: cosmosReady,
    timestamp: new Date().toISOString()
  });
});

/**
 * Save family group data
 * PUT /api/family-groups/:groupCode
 */
router.put('/:groupCode', async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { data } = req.body;

    if (!isValidGroupCode(groupCode)) {
      return res.status(400).json({
        error: 'Invalid group code format',
        message: 'Group code must be in format WORD-WORD-1234'
      });
    }

    if (!data) {
      return res.status(400).json({
        error: 'Missing group data',
        message: 'Group data is required in request body'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Cosmos DB unavailable',
        message: 'Cloud storage is currently unavailable'
      });
    }

    // Ensure data has proper structure with role assignments
    const processedData = {
      ...data,
      status: data.status || 'active',
      // Ensure all members have roles assigned
      members: data.members?.map((member, index) => ({
        ...member,
        role: member.role || (index === 0 ? 'creator' : 'member') // First member is creator by default
      })) || []
    };

    // Create Cosmos DB document
    const groupDocument = {
      id: groupCode, // Cosmos DB document ID
      groupCode,     // Partition key
      data: processedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _ts: Math.floor(Date.now() / 1000) // Cosmos DB timestamp
    };

    // Upsert (create or update) the document
    const { resource } = await container.items.upsert(groupDocument);

    console.log(`✅ Family group ${groupCode} saved to Cosmos DB successfully`);

    res.json({
      success: true,
      groupCode,
      cosmosId: resource.id,
      message: 'Group data saved to Cosmos DB successfully'
    });

  } catch (error) {
    console.error('Error saving family group to Cosmos DB:', error);
    res.status(500).json({
      error: 'Failed to save group data to Cosmos DB',
      message: error.message
    });
  }
});

/**
 * Load family group data
 * GET /api/family-groups/:groupCode
 */
router.get('/:groupCode', async (req, res) => {
  try {
    const { groupCode } = req.params;

    if (!isValidGroupCode(groupCode)) {
      return res.status(400).json({
        error: 'Invalid group code format',
        message: 'Group code must be in format WORD-WORD-1234'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Cosmos DB unavailable',
        message: 'Cloud storage is currently unavailable'
      });
    }

    try {
      // Query Cosmos DB for the document
      const { resource: groupDocument } = await container.item(groupCode, groupCode).read();

      if (groupDocument) {
        console.log(`✅ Family group ${groupCode} loaded from Cosmos DB successfully`);

        res.json({
          success: true,
          data: groupDocument.data,
          createdAt: groupDocument.createdAt,
          updatedAt: groupDocument.updatedAt,
          source: 'cosmos-db'
        });
      } else {
        throw new Error('Document not found');
      }

    } catch (cosmosError) {
      if (cosmosError.code === 404) {
        console.log(`📭 Family group ${groupCode} not found in Cosmos DB`);
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode} in Cosmos DB`
        });
      }
      throw cosmosError;
    }

  } catch (error) {
    console.error('Error loading family group from Cosmos DB:', error);
    res.status(500).json({
      error: 'Failed to load group data from Cosmos DB',
      message: error.message
    });
  }
});

/**
 * Delete family group data
 * DELETE /api/family-groups/:groupCode
 */
router.delete('/:groupCode', async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { deletedBy, permanent = false } = req.body;

    if (!isValidGroupCode(groupCode)) {
      return res.status(400).json({
        error: 'Invalid group code format',
        message: 'Group code must be in format WORD-WORD-1234'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Cosmos DB unavailable',
        message: 'Cloud storage is currently unavailable'
      });
    }

    try {
      // Get existing group to check permissions and emergency status
      const { resource: existingGroup } = await container.item(groupCode, groupCode).read();
      
      if (!existingGroup) {
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode}`
        });
      }

      // Check if group is already deleted
      if (existingGroup.data.status === 'deleted') {
        return res.status(400).json({
          error: 'Group already deleted',
          message: 'This group has already been deleted'
        });
      }

      // Check for emergency status - prevent deletion during emergency
      const hasEmergencyMembers = existingGroup.data.members?.some(member => 
        member.status === 'emergency'
      );
      
      if (hasEmergencyMembers && !permanent) {
        return res.status(403).json({
          error: 'Cannot delete during emergency',
          message: 'Group cannot be deleted while members are in emergency status'
        });
      }

      // Verify deletion permissions
      if (deletedBy) {
        const isCreator = existingGroup.data.members?.some(member => 
          member.id === deletedBy && member.role === 'creator'
        );
        
        if (!isCreator) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            message: 'Only group creators can delete groups'
          });
        }
      }

      if (permanent) {
        // Hard delete - permanently remove from database
        await container.item(groupCode, groupCode).delete();
        
        console.log(`🗑️ Family group ${groupCode} permanently deleted from Cosmos DB`);
        
        res.json({
          success: true,
          groupCode,
          action: 'permanent_delete',
          message: 'Group permanently deleted from database'
        });
      } else {
        // Soft delete - mark as deleted but retain data
        const updatedGroupData = {
          ...existingGroup.data,
          status: 'deleted',
          deletedAt: new Date().toISOString(),
          deletedBy: deletedBy || 'unknown',
          lastActivity: new Date().toISOString()
        };

        const groupDocument = {
          ...existingGroup,
          data: updatedGroupData,
          updatedAt: new Date().toISOString()
        };

        await container.items.upsert(groupDocument);
        
        console.log(`🗑️ Family group ${groupCode} soft deleted (30-day retention)`);
        
        res.json({
          success: true,
          groupCode,
          action: 'soft_delete',
          deletedAt: updatedGroupData.deletedAt,
          message: 'Group marked as deleted (30-day retention period)'
        });
      }

    } catch (cosmosError) {
      if (cosmosError.code === 404) {
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode}`
        });
      }
      throw cosmosError;
    }

  } catch (error) {
    console.error('Error deleting family group:', error);
    res.status(500).json({
      error: 'Failed to delete group',
      message: error.message
    });
  }
});

/**
 * Member leaves group (self-removal)
 * POST /api/family-groups/:groupCode/leave
 */
router.post('/:groupCode/leave', async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { memberId, reason = 'voluntary' } = req.body;

    if (!isValidGroupCode(groupCode)) {
      return res.status(400).json({
        error: 'Invalid group code format',
        message: 'Group code must be in format WORD-WORD-1234'
      });
    }

    if (!memberId) {
      return res.status(400).json({
        error: 'Missing member ID',
        message: 'Member ID is required to leave group'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Cosmos DB unavailable',
        message: 'Cloud storage is currently unavailable'
      });
    }

    try {
      const { resource: existingGroup } = await container.item(groupCode, groupCode).read();
      
      if (!existingGroup) {
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode}`
        });
      }

      // Check if group is deleted
      if (existingGroup.data.status === 'deleted') {
        return res.status(400).json({
          error: 'Group deleted',
          message: 'Cannot leave a deleted group'
        });
      }

      // Find the member
      const memberIndex = existingGroup.data.members?.findIndex(member => member.id === memberId);
      
      if (memberIndex === -1) {
        return res.status(404).json({
          error: 'Member not found',
          message: 'You are not a member of this group'
        });
      }

      const leavingMember = existingGroup.data.members[memberIndex];

      // Check emergency status - prevent leaving during emergency
      if (leavingMember.status === 'emergency' && reason === 'voluntary') {
        return res.status(403).json({
          error: 'Cannot leave during emergency',
          message: 'Cannot leave group while in emergency status'
        });
      }

      // Remove member from group
      const updatedMembers = existingGroup.data.members.filter(member => member.id !== memberId);
      
      // Handle special cases
      let updatedGroupData = { ...existingGroup.data };
      
      if (updatedMembers.length === 0) {
        // Last member leaving - mark group for deletion
        updatedGroupData = {
          ...updatedGroupData,
          members: [],
          status: 'deleted',
          deletedAt: new Date().toISOString(),
          deletedBy: memberId,
          lastActivity: new Date().toISOString()
        };
      } else {
        // Handle creator leaving
        if (leavingMember.role === 'creator') {
          // Transfer ownership to oldest remaining member
          const oldestMember = updatedMembers.reduce((oldest, member) => 
            new Date(member.joinedAt) < new Date(oldest.joinedAt) ? member : oldest
          );
          oldestMember.role = 'creator';
        }

        updatedGroupData = {
          ...updatedGroupData,
          members: updatedMembers,
          lastActivity: new Date().toISOString(),
          // Add anonymous leave log
          leaveLog: [
            ...(updatedGroupData.leaveLog || []),
            {
              timestamp: new Date().toISOString(),
              reason,
              memberCount: updatedMembers.length
            }
          ]
        };
      }

      const groupDocument = {
        ...existingGroup,
        data: updatedGroupData,
        updatedAt: new Date().toISOString()
      };

      await container.items.upsert(groupDocument);
      
      console.log(`👋 Member ${memberId} left group ${groupCode}`);
      
      res.json({
        success: true,
        groupCode,
        action: 'member_left',
        remainingMembers: updatedMembers.length,
        ownershipTransferred: leavingMember.role === 'creator' && updatedMembers.length > 0,
        groupDeleted: updatedMembers.length === 0,
        message: updatedMembers.length === 0 ? 'Group deleted (last member left)' : 'Successfully left group'
      });

    } catch (cosmosError) {
      if (cosmosError.code === 404) {
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode}`
        });
      }
      throw cosmosError;
    }

  } catch (error) {
    console.error('Error processing member leave:', error);
    res.status(500).json({
      error: 'Failed to leave group',
      message: error.message
    });
  }
});

/**
 * Remove member from group (creator action)
 * DELETE /api/family-groups/:groupCode/members/:memberId
 */
router.delete('/:groupCode/members/:memberId', async (req, res) => {
  try {
    const { groupCode, memberId } = req.params;
    const { removedBy, reason = 'removed by creator' } = req.body;

    if (!isValidGroupCode(groupCode)) {
      return res.status(400).json({
        error: 'Invalid group code format',
        message: 'Group code must be in format WORD-WORD-1234'
      });
    }

    if (!removedBy) {
      return res.status(400).json({
        error: 'Missing remover ID',
        message: 'Remover ID is required for member removal'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Cosmos DB unavailable',
        message: 'Cloud storage is currently unavailable'
      });
    }

    try {
      const { resource: existingGroup } = await container.item(groupCode, groupCode).read();
      
      if (!existingGroup) {
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode}`
        });
      }

      // Check if group is deleted
      if (existingGroup.data.status === 'deleted') {
        return res.status(400).json({
          error: 'Group deleted',
          message: 'Cannot remove members from deleted group'
        });
      }

      // Verify remover is creator
      const remover = existingGroup.data.members?.find(member => member.id === removedBy);
      if (!remover || remover.role !== 'creator') {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: 'Only group creators can remove members'
        });
      }

      // Find the member to remove
      const memberIndex = existingGroup.data.members?.findIndex(member => member.id === memberId);
      
      if (memberIndex === -1) {
        return res.status(404).json({
          error: 'Member not found',
          message: 'Member not found in this group'
        });
      }

      // Prevent creator from removing themselves (use leave instead)
      if (memberId === removedBy) {
        return res.status(400).json({
          error: 'Cannot remove self',
          message: 'Creators cannot remove themselves. Use leave group instead.'
        });
      }

      const removedMember = existingGroup.data.members[memberIndex];

      // Remove member from group
      const updatedMembers = existingGroup.data.members.filter(member => member.id !== memberId);
      
      const updatedGroupData = {
        ...existingGroup.data,
        members: updatedMembers,
        lastActivity: new Date().toISOString(),
        // Add anonymous removal log
        leaveLog: [
          ...(existingGroup.data.leaveLog || []),
          {
            timestamp: new Date().toISOString(),
            reason,
            memberCount: updatedMembers.length,
            action: 'removed'
          }
        ]
      };

      const groupDocument = {
        ...existingGroup,
        data: updatedGroupData,
        updatedAt: new Date().toISOString()
      };

      await container.items.upsert(groupDocument);
      
      console.log(`🚫 Member ${memberId} removed from group ${groupCode} by ${removedBy}`);
      
      res.json({
        success: true,
        groupCode,
        action: 'member_removed',
        removedMemberId: memberId,
        remainingMembers: updatedMembers.length,
        message: 'Member successfully removed from group'
      });

    } catch (cosmosError) {
      if (cosmosError.code === 404) {
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode}`
        });
      }
      throw cosmosError;
    }

  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      error: 'Failed to remove member',
      message: error.message
    });
  }
});

/**
 * Transfer group ownership
 * PUT /api/family-groups/:groupCode/transfer-ownership
 */
router.put('/:groupCode/transfer-ownership', async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { currentCreatorId, newCreatorId } = req.body;

    if (!isValidGroupCode(groupCode)) {
      return res.status(400).json({
        error: 'Invalid group code format',
        message: 'Group code must be in format WORD-WORD-1234'
      });
    }

    if (!currentCreatorId || !newCreatorId) {
      return res.status(400).json({
        error: 'Missing IDs',
        message: 'Both current and new creator IDs are required'
      });
    }

    if (currentCreatorId === newCreatorId) {
      return res.status(400).json({
        error: 'Same user',
        message: 'Current and new creator cannot be the same'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Cosmos DB unavailable',
        message: 'Cloud storage is currently unavailable'
      });
    }

    try {
      const { resource: existingGroup } = await container.item(groupCode, groupCode).read();
      
      if (!existingGroup) {
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode}`
        });
      }

      // Check if group is deleted
      if (existingGroup.data.status === 'deleted') {
        return res.status(400).json({
          error: 'Group deleted',
          message: 'Cannot transfer ownership of deleted group'
        });
      }

      // Verify current creator
      const currentCreator = existingGroup.data.members?.find(member => 
        member.id === currentCreatorId && member.role === 'creator'
      );
      
      if (!currentCreator) {
        return res.status(403).json({
          error: 'Not authorized',
          message: 'Current user is not the group creator'
        });
      }

      // Find new creator
      const newCreatorIndex = existingGroup.data.members?.findIndex(member => 
        member.id === newCreatorId
      );
      
      if (newCreatorIndex === -1) {
        return res.status(404).json({
          error: 'New creator not found',
          message: 'New creator is not a member of this group'
        });
      }

      // Update member roles
      const updatedMembers = existingGroup.data.members.map(member => {
        if (member.id === currentCreatorId) {
          return { ...member, role: 'member' };
        } else if (member.id === newCreatorId) {
          return { ...member, role: 'creator' };
        }
        return member;
      });

      const updatedGroupData = {
        ...existingGroup.data,
        members: updatedMembers,
        lastActivity: new Date().toISOString(),
        // Add ownership transfer log
        ownershipLog: [
          ...(existingGroup.data.ownershipLog || []),
          {
            timestamp: new Date().toISOString(),
            previousCreator: currentCreatorId,
            newCreator: newCreatorId,
            action: 'ownership_transferred'
          }
        ]
      };

      const groupDocument = {
        ...existingGroup,
        data: updatedGroupData,
        updatedAt: new Date().toISOString()
      };

      await container.items.upsert(groupDocument);
      
      console.log(`👑 Ownership of group ${groupCode} transferred from ${currentCreatorId} to ${newCreatorId}`);
      
      res.json({
        success: true,
        groupCode,
        action: 'ownership_transferred',
        previousCreator: currentCreatorId,
        newCreator: newCreatorId,
        message: 'Group ownership successfully transferred'
      });

    } catch (cosmosError) {
      if (cosmosError.code === 404) {
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode}`
        });
      }
      throw cosmosError;
    }

  } catch (error) {
    console.error('Error transferring ownership:', error);
    res.status(500).json({
      error: 'Failed to transfer ownership',
      message: error.message
    });
  }
});

/**
 * Add message to group
 * POST /api/family-groups/:groupCode/messages
 */
router.post('/:groupCode/messages', async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { senderId, senderNickname, message, messageType = 'status_update' } = req.body;

    if (!isValidGroupCode(groupCode)) {
      return res.status(400).json({
        error: 'Invalid group code format',
        message: 'Group code must be in format WORD-WORD-1234'
      });
    }

    if (!senderId || !message?.trim()) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Sender ID and message are required'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Cosmos DB unavailable',
        message: 'Cloud storage is currently unavailable'
      });
    }

    try {
      const { resource: existingGroup } = await container.item(groupCode, groupCode).read();
      
      if (!existingGroup) {
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode}`
        });
      }

      // Check if group is deleted
      if (existingGroup.data.status === 'deleted') {
        return res.status(400).json({
          error: 'Group deleted',
          message: 'Cannot send messages to deleted group'
        });
      }

      // Verify sender is a member
      const isMember = existingGroup.data.members?.some(member => member.id === senderId);
      if (!isMember) {
        return res.status(403).json({
          error: 'Not a member',
          message: 'Only group members can send messages'
        });
      }

      // Create message object
      const newMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId,
        senderNickname: senderNickname || 'Anonymous',
        message: message.trim(),
        messageType,
        timestamp: new Date().toISOString()
      };

      // Add message to group (keep last 50 messages)
      const messages = existingGroup.data.messages || [];
      messages.push(newMessage);
      
      // Keep only last 50 messages to prevent document size issues
      const trimmedMessages = messages.slice(-50);

      const updatedGroupData = {
        ...existingGroup.data,
        messages: trimmedMessages,
        lastActivity: new Date().toISOString()
      };

      const groupDocument = {
        ...existingGroup,
        data: updatedGroupData,
        updatedAt: new Date().toISOString()
      };

      await container.items.upsert(groupDocument);
      
      console.log(`💬 Message added to group ${groupCode} by ${senderNickname}`);
      
      res.json({
        success: true,
        groupCode,
        message: newMessage,
        totalMessages: trimmedMessages.length
      });

    } catch (cosmosError) {
      if (cosmosError.code === 404) {
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode}`
        });
      }
      throw cosmosError;
    }

  } catch (error) {
    console.error('Error adding message to group:', error);
    res.status(500).json({
      error: 'Failed to add message',
      message: error.message
    });
  }
});

/**
 * Get group messages
 * GET /api/family-groups/:groupCode/messages
 */
router.get('/:groupCode/messages', async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { limit = 20, memberId } = req.query;

    if (!isValidGroupCode(groupCode)) {
      return res.status(400).json({
        error: 'Invalid group code format',
        message: 'Group code must be in format WORD-WORD-1234'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Cosmos DB unavailable',
        message: 'Cloud storage is currently unavailable'
      });
    }

    try {
      const { resource: existingGroup } = await container.item(groupCode, groupCode).read();
      
      if (!existingGroup) {
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode}`
        });
      }

      // Check if group is deleted
      if (existingGroup.data.status === 'deleted') {
        return res.status(400).json({
          error: 'Group deleted',
          message: 'Cannot access messages from deleted group'
        });
      }

      // Verify requester is a member (if memberId provided)
      if (memberId) {
        const isMember = existingGroup.data.members?.some(member => member.id === memberId);
        if (!isMember) {
          return res.status(403).json({
            error: 'Not a member',
            message: 'Only group members can view messages'
          });
        }
      }

      // Get messages (latest first)
      const messages = existingGroup.data.messages || [];
      const sortedMessages = messages
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, parseInt(limit));

      console.log(`💬 Retrieved ${sortedMessages.length} messages for group ${groupCode}`);
      
      res.json({
        success: true,
        groupCode,
        messages: sortedMessages,
        totalMessages: messages.length
      });

    } catch (cosmosError) {
      if (cosmosError.code === 404) {
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode}`
        });
      }
      throw cosmosError;
    }

  } catch (error) {
    console.error('Error retrieving group messages:', error);
    res.status(500).json({
      error: 'Failed to retrieve messages',
      message: error.message
    });
  }
});

/**
 * List all family groups (for debugging/admin)
 * GET /api/family-groups
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Cosmos DB unavailable',
        message: 'Cloud storage is currently unavailable'
      });
    }
    
    // Query all documents in the container
    const querySpec = {
      query: "SELECT c.groupCode, c.createdAt, c.updatedAt, ARRAY_LENGTH(c.data.members) as memberCount FROM c ORDER BY c._ts DESC",
      parameters: []
    };

    const { resources: groupDocuments } = await container.items.query(querySpec, {
      maxItemCount: limit
    }).fetchAll();
    
    const groups = groupDocuments.map(doc => ({
      groupCode: doc.groupCode,
      memberCount: doc.memberCount || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    res.json({
      success: true,
      groups,
      total: groups.length,
      limit,
      source: 'cosmos-db'
    });

  } catch (error) {
    console.error('Error listing family groups from Cosmos DB:', error);
    res.status(500).json({
      error: 'Failed to list groups from Cosmos DB',
      message: error.message
    });
  }
});

console.log('🏠 Family Groups API routes (Cosmos DB) initialized');

export default router;