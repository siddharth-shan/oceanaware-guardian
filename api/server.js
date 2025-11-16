/**
 * Azure-Native API Server for EcoQuest Family Groups
 * Designed for Azure App Service hosting with Cosmos DB
 * Privacy-first anonymous family coordination
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { CosmosClient } = require('@azure/cosmos');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

// Rate limiting for API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Azure Cosmos DB Configuration
const cosmosConfig = {
  connectionString: process.env.COSMOS_PRIMARY_CONNECTION_STRING,
  endpoint: process.env.COSMOS_DB_ENDPOINT,
  key: process.env.COSMOS_DB_KEY,
  databaseId: 'EcoQuestDB',
  containerId: 'FamilyGroups'
};

let cosmosClient;
let database;
let container;

// Initialize Cosmos DB
async function initializeCosmosDB() {
  try {
    // Try connection string first, then fallback to endpoint/key
    if (!cosmosConfig.connectionString && (!cosmosConfig.endpoint || !cosmosConfig.key)) {
      console.log('⚠️ Cosmos DB credentials not configured - API will run in mock mode');
      return false;
    }

    if (cosmosConfig.connectionString) {
      console.log('🔗 Using Cosmos DB connection string...');
      cosmosClient = new CosmosClient(cosmosConfig.connectionString);
    } else {
      console.log('🔑 Using Cosmos DB endpoint and key...');
      cosmosClient = new CosmosClient({
        endpoint: cosmosConfig.endpoint,
        key: cosmosConfig.key
      });
    }

    // Create database if it doesn't exist
    const { database: db } = await cosmosClient.databases.createIfNotExists({
      id: cosmosConfig.databaseId
    });
    database = db;

    // Create container if it doesn't exist
    const { container: cont } = await database.containers.createIfNotExists({
      id: cosmosConfig.containerId,
      partitionKey: '/groupCode',
      throughput: 400 // Minimum throughput for cost efficiency
    });
    container = cont;

    console.log('✅ Azure Cosmos DB initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Cosmos DB:', error.message);
    return false;
  }
}

// Validation helpers
function isValidGroupCode(code) {
  if (!code || typeof code !== 'string') return false;
  const parts = code.split('-');
  if (parts.length !== 3) return false;
  const [word1, word2, numbers] = parts;
  return /^[A-Z]+$/.test(word1) && /^[A-Z]+$/.test(word2) && /^\d{4}$/.test(numbers);
}

function isValidAnonymousUserId(userId) {
  return userId && typeof userId === 'string' && userId.length > 5;
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const cosmosStatus = container ? 'connected' : 'disconnected';
    
    // Test Cosmos DB connection if available
    let cosmosTest = 'not_tested';
    if (container) {
      try {
        await container.items.query('SELECT TOP 1 * FROM c').fetchNext();
        cosmosTest = 'healthy';
      } catch (error) {
        cosmosTest = 'error';
      }
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        cosmos: {
          status: cosmosStatus,
          test: cosmosTest,
          database: cosmosConfig.databaseId,
          container: cosmosConfig.containerId
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Create or update family group
app.put('/api/family-groups/:groupCode', async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { data, timestamp } = req.body;
    const userId = req.headers['x-anonymous-user-id'];

    // Validation
    if (!isValidGroupCode(groupCode)) {
      return res.status(400).json({ error: 'Invalid group code format' });
    }

    if (!isValidAnonymousUserId(userId)) {
      return res.status(400).json({ error: 'Valid anonymous user ID required' });
    }

    if (!data) {
      return res.status(400).json({ error: 'Group data required' });
    }

    const groupDocument = {
      id: groupCode,
      groupCode,
      data,
      lastUpdated: timestamp || new Date().toISOString(),
      updatedBy: userId,
      version: '1.0'
    };

    if (container) {
      // Save to Cosmos DB
      await container.items.upsert(groupDocument);
      console.log(`✅ Group ${groupCode} saved to Cosmos DB by ${userId.substring(0, 8)}...`);
    } else {
      // Mock mode for development
      console.log(`📝 Mock: Would save group ${groupCode} for user ${userId.substring(0, 8)}...`);
    }

    res.json({
      success: true,
      groupCode,
      timestamp: groupDocument.lastUpdated,
      message: 'Group saved successfully'
    });

  } catch (error) {
    console.error('❌ Error saving group:', error);
    res.status(500).json({
      error: 'Failed to save group',
      message: error.message
    });
  }
});

// Get family group by code
app.get('/api/family-groups/:groupCode', async (req, res) => {
  try {
    const { groupCode } = req.params;
    const userId = req.headers['x-anonymous-user-id'];

    // Validation
    if (!isValidGroupCode(groupCode)) {
      return res.status(400).json({ error: 'Invalid group code format' });
    }

    if (!isValidAnonymousUserId(userId)) {
      return res.status(400).json({ error: 'Valid anonymous user ID required' });
    }

    if (container) {
      // Query from Cosmos DB
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.groupCode = @groupCode',
        parameters: [{ name: '@groupCode', value: groupCode }]
      };

      const { resources: results } = await container.items.query(querySpec).fetchAll();

      if (results.length === 0) {
        return res.status(404).json({
          error: 'Group not found',
          groupCode,
          message: 'The group code you entered does not exist or has expired'
        });
      }

      const group = results[0];
      console.log(`📱 Group ${groupCode} retrieved by ${userId.substring(0, 8)}...`);

      res.json({
        success: true,
        groupCode,
        data: group.data,
        lastUpdated: group.lastUpdated,
        found: true
      });

    } else {
      // Mock mode for development
      console.log(`🔍 Mock: Would retrieve group ${groupCode} for user ${userId.substring(0, 8)}...`);
      
      res.json({
        success: true,
        groupCode,
        data: {
          code: groupCode,
          name: `Mock Group ${groupCode}`,
          members: [
            {
              id: userId,
              nickname: 'Mock User',
              status: 'safe',
              joinedAt: new Date().toISOString(),
              lastSeen: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString(),
          createdBy: userId,
          lastActivity: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString(),
        found: true,
        mockMode: true
      });
    }

  } catch (error) {
    console.error('❌ Error retrieving group:', error);
    res.status(500).json({
      error: 'Failed to retrieve group',
      message: error.message
    });
  }
});

// Delete family group
app.delete('/api/family-groups/:groupCode', async (req, res) => {
  try {
    const { groupCode } = req.params;
    const userId = req.headers['x-anonymous-user-id'];

    // Validation
    if (!isValidGroupCode(groupCode)) {
      return res.status(400).json({ error: 'Invalid group code format' });
    }

    if (!isValidAnonymousUserId(userId)) {
      return res.status(400).json({ error: 'Valid anonymous user ID required' });
    }

    if (container) {
      // Delete from Cosmos DB
      await container.item(groupCode, groupCode).delete();
      console.log(`🗑️ Group ${groupCode} deleted by ${userId.substring(0, 8)}...`);
    } else {
      // Mock mode
      console.log(`🗑️ Mock: Would delete group ${groupCode} for user ${userId.substring(0, 8)}...`);
    }

    res.json({
      success: true,
      groupCode,
      message: 'Group deleted successfully'
    });

  } catch (error) {
    if (error.code === 404) {
      return res.status(404).json({
        error: 'Group not found',
        groupCode: req.params.groupCode
      });
    }

    console.error('❌ Error deleting group:', error);
    res.status(500).json({
      error: 'Failed to delete group',
      message: error.message
    });
  }
});

// List groups (admin/debugging endpoint)
app.get('/api/family-groups', async (req, res) => {
  try {
    const userId = req.headers['x-anonymous-user-id'];
    const limit = parseInt(req.query.limit) || 50;

    if (!isValidAnonymousUserId(userId)) {
      return res.status(400).json({ error: 'Valid anonymous user ID required' });
    }

    if (container) {
      // Query from Cosmos DB
      const querySpec = {
        query: 'SELECT c.groupCode, c.lastUpdated, c.updatedBy FROM c ORDER BY c.lastUpdated DESC OFFSET 0 LIMIT @limit',
        parameters: [{ name: '@limit', value: limit }]
      };

      const { resources: results } = await container.items.query(querySpec).fetchAll();

      res.json({
        success: true,
        groups: results,
        total: results.length,
        limit
      });

    } else {
      // Mock mode
      res.json({
        success: true,
        groups: [
          {
            groupCode: 'MOCK-TEST-1234',
            lastUpdated: new Date().toISOString(),
            updatedBy: 'mock-user-id'
          }
        ],
        total: 1,
        limit,
        mockMode: true
      });
    }

  } catch (error) {
    console.error('❌ Error listing groups:', error);
    res.status(500).json({
      error: 'Failed to list groups',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'API endpoint not found',
    availableEndpoints: [
      'GET /api/health',
      'GET /api/family-groups/:groupCode',
      'PUT /api/family-groups/:groupCode',
      'DELETE /api/family-groups/:groupCode',
      'GET /api/family-groups'
    ]
  });
});

// Initialize and start server
async function startServer() {
  await initializeCosmosDB();
  
  app.listen(port, () => {
    console.log(`🚀 EcoQuest Azure API Server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
    console.log(`☁️ Cosmos DB: ${container ? 'Connected' : 'Mock Mode'}`);
    console.log(`🔒 CORS origins: ${process.env.ALLOWED_ORIGINS || 'localhost development'}`);
  });
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;