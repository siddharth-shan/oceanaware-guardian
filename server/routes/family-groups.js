/**
 * Family Groups API Routes
 * Provides family group data storage and retrieval for cross-device access
 * Privacy-first design with anonymous group codes
 * Uses Azure Cosmos DB for cloud storage
 */

import express from 'express';
import { CosmosClient } from '@azure/cosmos';
import dotenv from 'dotenv';

const router = express.Router();

// Load environment variables
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
    if (!cosmosConnectionString) {
      throw new Error('COSMOS_PRIMARY_CONNECTION_STRING not found in environment variables');
    }
    
    cosmosClient = new CosmosClient(cosmosConnectionString);
    
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

    // Create Cosmos DB document
    const groupDocument = {
      id: groupCode, // Cosmos DB document ID
      groupCode,     // Partition key
      data,
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

    // Load group data from file
    const filePath = path.join(DATA_DIR, `${groupCode}.json`);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const groupRecord = JSON.parse(fileContent);

      console.log(`✅ Family group ${groupCode} loaded successfully`);

      res.json({
        success: true,
        data: groupRecord.data,
        createdAt: groupRecord.createdAt,
        updatedAt: groupRecord.updatedAt
      });

    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        console.log(`📭 Family group ${groupCode} not found`);
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode}`
        });
      }
      throw fileError;
    }

  } catch (error) {
    console.error('Error loading family group:', error);
    res.status(500).json({
      error: 'Failed to load group data',
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

    if (!isValidGroupCode(groupCode)) {
      return res.status(400).json({
        error: 'Invalid group code format',
        message: 'Group code must be in format WORD-WORD-1234'
      });
    }

    // Delete group data file
    const filePath = path.join(DATA_DIR, `${groupCode}.json`);
    
    try {
      await fs.unlink(filePath);
      
      console.log(`✅ Family group ${groupCode} deleted successfully`);

      res.json({
        success: true,
        groupCode,
        message: 'Group data deleted successfully'
      });

    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        console.log(`📭 Family group ${groupCode} not found for deletion`);
        return res.status(404).json({
          error: 'Group not found',
          message: `No group found with code ${groupCode}`
        });
      }
      throw fileError;
    }

  } catch (error) {
    console.error('Error deleting family group:', error);
    res.status(500).json({
      error: 'Failed to delete group data',
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
    
    // Read all group files
    const files = await fs.readdir(DATA_DIR);
    const groupFiles = files.filter(file => file.endsWith('.json'));
    
    const groups = [];
    
    for (const file of groupFiles.slice(0, limit)) {
      try {
        const filePath = path.join(DATA_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const groupRecord = JSON.parse(fileContent);
        
        // Return summary info (not full data for privacy)
        groups.push({
          groupCode: groupRecord.groupCode,
          memberCount: groupRecord.data?.members?.length || 0,
          createdAt: groupRecord.createdAt,
          updatedAt: groupRecord.updatedAt
        });
      } catch (error) {
        console.warn(`Failed to read group file ${file}:`, error);
      }
    }

    res.json({
      success: true,
      groups,
      total: groups.length,
      limit
    });

  } catch (error) {
    console.error('Error listing family groups:', error);
    res.status(500).json({
      error: 'Failed to list groups',
      message: error.message
    });
  }
});

console.log('🏠 Family Groups API routes initialized');

export default router;