/**
 * Community Hub API Routes - Cosmos DB Integration
 * Provides community safety check-ins and reporting with geographic coordination
 * Privacy-first design with geospatial queries and anonymous participation
 */

import express from 'express';
import { CosmosClient } from '@azure/cosmos';
import dotenv from 'dotenv';

const router = express.Router();

// Load environment variables from multiple sources
dotenv.config({ path: '../.env.local' });
dotenv.config({ path: '../.env.production' });
dotenv.config(); // Load from default .env

// Cosmos DB configuration - check multiple possible environment variable names
let cosmosConnectionString = process.env.COSMOS_PRIMARY_CONNECTION_STRING || 
                            process.env.APPSETTING_COSMOS_PRIMARY_CONNECTION_STRING ||  
                            process.env.AZURE_COSMOS_CONNECTION_STRING;

// Clean connection string (remove any whitespace, newlines, quotes)
if (cosmosConnectionString) {
  cosmosConnectionString = cosmosConnectionString.trim().replace(/["'\r\n]/g, '');
}
const databaseName = 'EcoQuestDB';
const checkinContainerName = 'CommunityCheckins';
const reportsContainerName = 'CommunityReports';
const helpOffersContainerName = 'HelpOffers';
const anonymousMessagesContainerName = 'AnonymousMessages';

let cosmosClient;
let database;
let checkinContainer;
let reportsContainer;
let helpOffersContainer;
let anonymousMessagesContainer;

// Initialize Cosmos DB connection
async function initializeCosmosDB() {
  try {
    console.log('🔄 Initializing Cosmos DB connection...');
    console.log('Connection string available:', !!cosmosConnectionString);
    console.log('Environment:', process.env.NODE_ENV);
    
    if (!cosmosConnectionString) {
      console.error('❌ COSMOS_PRIMARY_CONNECTION_STRING not found in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('COSMOS')));
      console.error('Full env check - NODE_ENV:', process.env.NODE_ENV);
      console.error('All env vars containing DB:', Object.keys(process.env).filter(k => k.toUpperCase().includes('DB')));
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
    
    // Create Community Checkins container
    const { container: checkinCont } = await database.containers.createIfNotExists({
      id: checkinContainerName,
      partitionKey: {
        kind: 'Hash',
        paths: ['/geoRegion'] // Partition by geographic region for efficient queries
      }
    });
    checkinContainer = checkinCont;
    
    // Create Community Reports container
    const { container: reportsCont } = await database.containers.createIfNotExists({
      id: reportsContainerName,
      partitionKey: {
        kind: 'Hash',
        paths: ['/geoRegion'] // Partition by geographic region
      }
    });
    reportsContainer = reportsCont;
    
    // Create Help Offers container
    const { container: helpOffersCont } = await database.containers.createIfNotExists({
      id: helpOffersContainerName,
      partitionKey: {
        kind: 'Hash',
        paths: ['/geoRegion'] // Partition by geographic region
      }
    });
    helpOffersContainer = helpOffersCont;
    
    // Create Anonymous Messages container
    const { container: messagesCont } = await database.containers.createIfNotExists({
      id: anonymousMessagesContainerName,
      partitionKey: {
        kind: 'Hash',
        paths: ['/geoRegion'] // Partition by geographic region
      }
    });
    anonymousMessagesContainer = messagesCont;
    
    console.log(`✅ Connected to Cosmos DB Community containers: ${checkinContainerName}, ${reportsContainerName}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Community Cosmos DB:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Specific error handling
    if (error.code === 401) {
      console.error('🔑 Authentication failed - check connection string and keys');
    } else if (error.code === 403) {
      console.error('🚫 Access forbidden - check account permissions');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('🌐 Network connectivity issue - check endpoint URL');
    }
    
    return false;
  }
}

// Initialize on startup
let cosmosReady = false;
initializeCosmosDB().then(success => {
  cosmosReady = success;
});

/**
 * Generate geographic region key for partitioning
 * Creates a region identifier based on approximate location for privacy
 */
function generateGeoRegion(lat, lng) {
  // Round to ~10km precision for privacy while enabling regional queries
  const regionLat = Math.floor(lat * 100) / 100;
  const regionLng = Math.floor(lng * 100) / 100;
  return `${regionLat},${regionLng}`;
}

/**
 * Get health status for community services
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'community-hub',
    storage: cosmosReady ? 'cosmos-db' : 'cosmos-db-unavailable',
    database: databaseName,
    containers: {
      checkins: checkinContainerName,
      reports: reportsContainerName
    },
    connected: cosmosReady,
    timestamp: new Date().toISOString()
  });
});

/**
 * Submit safety check-in
 * POST /api/community/checkin
 */
router.post('/checkin', async (req, res) => {
  try {
    const { 
      userId, 
      status, 
      message, 
      location, 
      anonymousMode = true 
    } = req.body;

    if (!userId || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'User ID and status are required'
      });
    }

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({
        error: 'Location required',
        message: 'Geographic location is required for community coordination'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Community services are currently unavailable'
      });
    }

    const geoRegion = generateGeoRegion(location.lat, location.lng);
    const checkinId = `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create check-in document with privacy controls
    const checkinDocument = {
      id: checkinId,
      geoRegion, // Partition key
      userId: anonymousMode ? `anon_${userId.slice(0, 8)}` : userId,
      status,
      message: message?.trim() || '',
      location: {
        // Store approximate location for privacy
        lat: Math.round(location.lat * 1000) / 1000, // ~100m precision
        lng: Math.round(location.lng * 1000) / 1000,
        region: location.region || 'Unknown Area'
      },
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Auto-delete after 7 days
      anonymousMode,
      _ts: Math.floor(Date.now() / 1000)
    };

    await checkinContainer.items.create(checkinDocument);

    console.log(`✅ Safety check-in recorded for region ${geoRegion}: ${status}`);

    res.json({
      success: true,
      checkinId,
      geoRegion,
      status,
      timestamp: checkinDocument.timestamp,
      message: 'Safety check-in recorded successfully'
    });

  } catch (error) {
    console.error('❌ Error recording safety check-in:', error);
    res.status(500).json({
      error: 'Failed to record check-in',
      message: error.message
    });
  }
});

/**
 * Get community safety status for region
 * GET /api/community/status?lat=&lng=&radius=
 */
router.get('/status', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query; // radius in km

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Location required',
        message: 'Latitude and longitude are required'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Community services are currently unavailable'
      });
    }

    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    const centerRegion = generateGeoRegion(centerLat, centerLng);

    // Query recent check-ins in the region
    const querySpec = {
      query: `
        SELECT 
          c.id,
          c.status,
          c.message,
          c.location,
          c.timestamp,
          c.anonymousMode
        FROM c 
        WHERE c.geoRegion = @geoRegion 
        AND c.timestamp >= @since
        ORDER BY c.timestamp DESC
      `,
      parameters: [
        { name: '@geoRegion', value: centerRegion },
        { name: '@since', value: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() } // Last 6 hours
      ]
    };

    const { resources: checkins } = await checkinContainer.items.query(querySpec).fetchAll();

    // Aggregate status counts
    const statusCounts = checkins.reduce((counts, checkin) => {
      counts[checkin.status] = (counts[checkin.status] || 0) + 1;
      return counts;
    }, {});

    // Filter recent check-ins for display (last 2 hours)
    const recentCheckins = checkins
      .filter(checkin => {
        const age = Date.now() - new Date(checkin.timestamp).getTime();
        return age <= 2 * 60 * 60 * 1000; // 2 hours
      })
      .slice(0, 20); // Limit to 20 most recent

    // Query community bulletin board messages for the region and nearby areas
    // Include both exact region match and global messages for broader coverage
    const messagesQuerySpec = {
      query: `
        SELECT 
          m.id,
          m.message,
          m.messageType,
          m.timestamp,
          m.geoRegion
        FROM m 
        WHERE (m.geoRegion = @geoRegion OR m.geoRegion = 'global')
        AND m.timestamp >= @since
        AND (m.targetCheckinId = 'community_board' OR m.messageType = 'community_bulletin' OR m.messageType = 'community_response')
        ORDER BY m.timestamp DESC
      `,
      parameters: [
        { name: '@geoRegion', value: centerRegion },
        { name: '@since', value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() } // Last 24 hours
      ]
    };

    let communityMessages = [];
    try {
      const { resources: messages } = await anonymousMessagesContainer.items.query(messagesQuerySpec).fetchAll();
      communityMessages = messages.slice(0, 50); // Limit to 50 most recent
    } catch (error) {
      console.warn('⚠️ Failed to fetch community messages:', error.message);
    }

    console.log(`✅ Retrieved ${checkins.length} check-ins and ${communityMessages.length} community messages for region ${centerRegion}`);

    res.json({
      success: true,
      geoRegion: centerRegion,
      statusCounts,
      totalCheckins: checkins.length,
      recentCheckins: recentCheckins.map(checkin => ({
        id: checkin.id,
        status: checkin.status,
        message: checkin.message,
        location: {
          region: checkin.location.region
          // Lat/lng excluded for privacy
        },
        timestamp: checkin.timestamp,
        anonymous: checkin.anonymousMode !== false
      })),
      communityMessages: communityMessages.map(msg => ({
        id: msg.id,
        message: msg.message,
        messageType: msg.messageType,
        timestamp: msg.timestamp,
        geoRegion: msg.geoRegion
      })),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching community status:', error);
    res.status(500).json({
      error: 'Failed to fetch community status',
      message: error.message
    });
  }
});

/**
 * Submit community report
 * POST /api/community/report
 */
router.post('/report', async (req, res) => {
  try {
    console.log('🌍 Community report submission received');
    
    const {
      userId,
      type,
      title,
      description,
      location,
      urgentLevel = 'normal',
      anonymousMode = true
    } = req.body;

    if (!userId || !type || !description) {
      console.log('⚠️ Missing required fields:', { userId: !!userId, type: !!type, description: !!description });
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'User ID, type, and description are required'
      });
    }

    if (!location || !location.lat || !location.lng) {
      console.log('⚠️ Missing location data:', location);
      return res.status(400).json({
        error: 'Location required',
        message: 'Geographic location is required for community reports'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Azure Cosmos DB service unavailable',
        message: 'Community services are currently unavailable. Please try again later.'
      });
    }

    const geoRegion = generateGeoRegion(location.lat, location.lng);
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create report document
    const reportDocument = {
      id: reportId,
      geoRegion, // Partition key
      userId: anonymousMode ? `anon_${userId.slice(0, 8)}` : userId,
      originalUserId: userId, // Store original user ID to prevent self-verification
      type,
      title: title?.trim() || `${type} Report`,
      description: description.trim(),
      location: {
        lat: Math.round(location.lat * 1000) / 1000, // ~100m precision for privacy
        lng: Math.round(location.lng * 1000) / 1000,
        region: location.region || 'Unknown Area',
        address: location.address || null
      },
      urgentLevel,
      status: 'active',
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Auto-delete after 30 days
      anonymousMode,
      verificationCount: 0,
      verifiedByUsers: [], // Track which users have verified this report
      helpOffers: [],
      _ts: Math.floor(Date.now() / 1000)
    };

    await reportsContainer.items.create(reportDocument);

    console.log(`✅ Community report created for region ${geoRegion}: ${type}`);

    res.json({
      success: true,
      reportId,
      geoRegion,
      type,
      urgentLevel,
      timestamp: reportDocument.timestamp,
      message: 'Community report submitted successfully'
    });

  } catch (error) {
    console.error('❌ Error creating community report:', error);
    res.status(500).json({
      error: 'Failed to create report',
      message: error.message
    });
  }
});

/**
 * Get community reports for region
 * GET /api/community/reports?lat=&lng=&radius=&type=
 */
router.get('/reports', async (req, res) => {
  try {
    const { lat, lng, radius = 50, type, status = 'active', urgentLevels } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Location required',
        message: 'Latitude and longitude are required'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Community services are currently unavailable'
      });
    }

    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    const centerRegion = generateGeoRegion(centerLat, centerLng);

    // Build query with optional filters
    let queryText = `
      SELECT 
      c.id,
      c.type,
      c.title,
      c.description,
      c.location,
      c.urgentLevel,
      c.status,
      c.timestamp,
      c.verificationCount,
      c.verifiedByUsers,
        c.originalUserId,
          c.anonymousMode
        FROM c
      WHERE c.geoRegion = @geoRegion 
      AND c.status = @status
      AND c.timestamp >= @since
    `;

    const parameters = [
      { name: '@geoRegion', value: centerRegion },
      { name: '@status', value: status },
      { name: '@since', value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() } // Last 7 days
    ];

    if (type && type !== 'all') {
      queryText += ' AND c.type = @type';
      parameters.push({ name: '@type', value: type });
    }

    // Add location validity filter if requested
    if (req.query.excludeInvalidLocations === 'true') {
      queryText += ` AND (
        c.location.lat IS NOT NULL AND 
        c.location.lng IS NOT NULL AND
        c.location.lat != 0 AND 
        c.location.lng != 0 AND
        c.location.lat >= -90 AND 
        c.location.lat <= 90 AND
        c.location.lng >= -180 AND 
        c.location.lng <= 180
      )`;
    }

    // Add urgentLevels filtering
    if (urgentLevels && urgentLevels !== 'all') {
      const levels = urgentLevels.split(',').map(level => level.trim());
      if (levels.length > 0) {
        const levelConditions = levels.map((_, index) => `c.urgentLevel = @urgentLevel${index}`).join(' OR ');
        queryText += ` AND (${levelConditions})`;
        levels.forEach((level, index) => {
          parameters.push({ name: `@urgentLevel${index}`, value: level });
        });
      }
    }

    const querySpec = { query: queryText, parameters };
    const { resources: reports } = await reportsContainer.items.query(querySpec).fetchAll();
    
    // Sort reports by urgency then timestamp (most urgent and recent first)
    const sortedReports = reports.sort((a, b) => {
      const urgencyOrder = { 'critical': 4, 'high': 3, 'normal': 2, 'low': 1 };
      const aUrgency = urgencyOrder[a.urgentLevel] || 0;
      const bUrgency = urgencyOrder[b.urgentLevel] || 0;
      
      if (aUrgency !== bUrgency) {
        return bUrgency - aUrgency; // Higher urgency first
      }
      
      return new Date(b.timestamp) - new Date(a.timestamp); // More recent first
    });

    console.log(`✅ Retrieved ${reports.length} reports for region ${centerRegion}`);

    res.json({
      success: true,
      geoRegion: centerRegion,
      totalReports: reports.length,
      reports: sortedReports.slice(0, 50).map(report => ({ // Limit to 50 reports
        id: report.id,
        type: report.type,
        title: report.title,
        description: report.description,
        location: {
          region: report.location.region,
          address: report.location.address,
          // Include lat/lng for location display
          lat: report.location.lat,
          lng: report.location.lng
        },
        urgentLevel: report.urgentLevel,
        status: report.status,
        timestamp: report.timestamp,
        verificationCount: report.verificationCount,
        verifiedByUsers: report.verifiedByUsers || [],
        originalUserId: report.originalUserId,
        anonymous: report.anonymousMode !== false
      })),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching community reports:', error);
    res.status(500).json({
      error: 'Failed to fetch reports',
      message: error.message
    });
  }
});

/**
 * Verify/upvote a community report
 * POST /api/community/reports/:reportId/verify
 */
router.post('/reports/:reportId/verify', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { userId, verificationNote } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID required',
        message: 'User ID is required for verification'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Community services are currently unavailable'
      });
    }

    // Get the report first
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @reportId',
      parameters: [{ name: '@reportId', value: reportId }]
    };

    const { resources: reports } = await reportsContainer.items.query(querySpec).fetchAll();
    
    if (reports.length === 0) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'No report found with the specified ID'
      });
    }

    const report = reports[0];

    // Check if user is trying to verify their own report
    if (report.originalUserId === userId) {
      return res.status(400).json({
        error: 'Cannot verify own report',
        message: 'Users cannot verify their own reports'
      });
    }

    // Check if user has already verified this report
    const verifiedByUsers = report.verifiedByUsers || [];
    if (verifiedByUsers.includes(userId)) {
      return res.status(400).json({
        error: 'Already verified',
        message: 'You have already verified this report'
      });
    }

    // Add user to verification list and increment count
    const updatedReport = {
      ...report,
      verificationCount: (report.verificationCount || 0) + 1,
      verifiedByUsers: [...verifiedByUsers, userId],
      lastVerified: new Date().toISOString()
    };

    await reportsContainer.item(reportId, report.geoRegion).replace(updatedReport);

    console.log(`✅ Report ${reportId} verified by ${userId} (count: ${updatedReport.verificationCount})`);

    res.json({
      success: true,
      reportId,
      verificationCount: updatedReport.verificationCount,
      message: 'Report verification recorded'
    });

  } catch (error) {
    console.error('❌ Error verifying report:', error);
    res.status(500).json({
      error: 'Failed to verify report',
      message: error.message
    });
  }
});

/**
 * Check verification status for a report by a specific user
 * GET /api/community/reports/:reportId/verification-status?userId=
 */
router.get('/reports/:reportId/verification-status', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID required',
        message: 'User ID is required to check verification status'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Community services are currently unavailable'
      });
    }

    // Get the report
    const querySpec = {
      query: 'SELECT c.verifiedByUsers, c.originalUserId FROM c WHERE c.id = @reportId',
      parameters: [{ name: '@reportId', value: reportId }]
    };

    const { resources: reports } = await reportsContainer.items.query(querySpec).fetchAll();
    
    if (reports.length === 0) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'No report found with the specified ID'
      });
    }

    const report = reports[0];
    const verifiedByUsers = report.verifiedByUsers || [];
    const isOriginalAuthor = report.originalUserId === userId;
    const hasVerified = verifiedByUsers.includes(userId);

    res.json({
      success: true,
      hasVerified,
      isOriginalAuthor,
      canVerify: !isOriginalAuthor && !hasVerified
    });

  } catch (error) {
    console.error('❌ Error checking verification status:', error);
    res.status(500).json({
      error: 'Failed to check verification status',
      message: error.message,
      hasVerified: false,
      isOriginalAuthor: false,
      canVerify: false
    });
  }
});

/**
 * Clean up reports with invalid locations
 * POST /api/community/reports/cleanup-invalid-locations
 */
router.post('/reports/cleanup-invalid-locations', async (req, res) => {
  try {
    const { userId, dryRun = true } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID required',
        message: 'User ID is required for cleanup operations'
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Community services are currently unavailable'
      });
    }

    console.log(`🧹 ${dryRun ? 'Preview' : 'Execute'} cleanup of invalid location reports by user: ${userId}`);

    // Query for reports with invalid locations
    const querySpec = {
      query: `
        SELECT * FROM c 
        WHERE (
          c.location.lat = 0 OR 
          c.location.lng = 0 OR 
          IS_NULL(c.location.lat) OR
          IS_NULL(c.location.lng) OR
          c.location.lat < -90 OR
          c.location.lat > 90 OR
          c.location.lng < -180 OR
          c.location.lng > 180
        )
        AND c.timestamp >= @cutoffDate
      `,
      parameters: [
        { name: '@cutoffDate', value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() } // Last 30 days
      ]
    };

    const { resources: invalidReports } = await reportsContainer.items.query(querySpec).fetchAll();

    console.log(`🔍 Found ${invalidReports.length} reports with invalid locations`);

    let affectedReports = 0;
    const cleanupResults = [];

    if (!dryRun && invalidReports.length > 0) {
      // Actually delete the invalid reports
      for (const report of invalidReports) {
        try {
          await reportsContainer.item(report.id, report.geoRegion).delete();
          affectedReports++;
          cleanupResults.push({
            id: report.id,
            type: report.type,
            timestamp: report.timestamp,
            location: report.location,
            action: 'deleted'
          });
        } catch (deleteError) {
          console.error(`❌ Failed to delete report ${report.id}:`, deleteError);
          cleanupResults.push({
            id: report.id,
            type: report.type,
            timestamp: report.timestamp,
            location: report.location,
            action: 'delete_failed',
            error: deleteError.message
          });
        }
      }
    } else {
      // Dry run - just count and return details
      affectedReports = invalidReports.length;
      cleanupResults.push(...invalidReports.map(report => ({
        id: report.id,
        type: report.type,
        timestamp: report.timestamp,
        location: report.location,
        action: 'would_delete'
      })));
    }

    console.log(`✅ Cleanup ${dryRun ? 'preview' : 'execution'} completed: ${affectedReports} reports affected`);

    res.status(200).json({
      success: true,
      dryRun,
      affectedReports,
      totalInvalidFound: invalidReports.length,
      cleanupResults: cleanupResults.slice(0, 100), // Limit response size
      message: dryRun 
        ? `Found ${invalidReports.length} reports with invalid locations` 
        : `Cleaned up ${affectedReports} reports with invalid locations`
    });

  } catch (error) {
    console.error('❌ Error during cleanup operation:', error);
    res.status(500).json({
      error: 'Cleanup operation failed',
      message: error.message,
      affectedReports: 0
    });
  }
});

/**
 * Anonymous Help Offer API
 * POST /api/community/help-offer
 */
router.post('/help-offer', async (req, res) => {
  try {
    const { offererUserId, targetCheckinId, offerType, message, location, anonymousMode } = req.body;

    if (!offererUserId || !targetCheckinId || !offerType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Community services are currently unavailable'
      });
    }

    // Generate geo region from location or target checkin
    let geoRegion = 'global';
    if (location?.lat && location?.lng) {
      geoRegion = generateGeoRegion(location.lat, location.lng);
    }

    const offerId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const helpOffer = {
      id: offerId,
      geoRegion,
      offererUserId: anonymousMode ? 'anonymous' : offererUserId,
      targetCheckinId,
      offerType,
      message: message || '',
      location: anonymousMode ? null : location,
      timestamp: new Date().toISOString(),
      status: 'pending',
      anonymousMode: anonymousMode !== false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      _ts: Math.floor(Date.now() / 1000)
    };

    await helpOffersContainer.items.create(helpOffer);

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
});

/**
 * Anonymous Message API
 * POST /api/community/anonymous-message
 */
router.post('/anonymous-message', async (req, res) => {
  try {
    const { senderUserId, targetCheckinId, message, messageType, anonymousMode, location } = req.body;

    if (!senderUserId || !targetCheckinId || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Community services are currently unavailable'
      });
    }

    // Generate geo region from location if available, otherwise use global
    let geoRegion = 'global';
    if (location && location.lat && location.lng) {
      geoRegion = generateGeoRegion(parseFloat(location.lat), parseFloat(location.lng));
    }
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const anonymousMessage = {
      id: messageId,
      geoRegion,
      senderUserId: anonymousMode !== false ? 'anonymous' : senderUserId,
      targetCheckinId,
      message: message.trim(),
      messageType: messageType || 'support',
      timestamp: new Date().toISOString(),
      status: 'sent',
      anonymousMode: anonymousMode !== false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      _ts: Math.floor(Date.now() / 1000)
    };

    await anonymousMessagesContainer.items.create(anonymousMessage);

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
});

/**
 * Accept Help Offer
 * POST /api/community/help-offer/:offerId/accept
 */
router.post('/help-offer/:offerId/accept', async (req, res) => {
  try {
    const { offerId } = req.params;
    const { accepterId, contactMethod = 'anonymous_chat' } = req.body;

    if (!accepterId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Accepter ID is required' 
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Community services are currently unavailable'
      });
    }

    // Find the help offer
    const helpQuery = {
      query: 'SELECT * FROM c WHERE c.id = @offerId',
      parameters: [{ name: '@offerId', value: offerId }]
    };
    
    const { resources: offers } = await helpOffersContainer.items.query(helpQuery).fetchAll();
    
    if (offers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Help offer not found'
      });
    }

    const helpOffer = offers[0];
    
    // Update help offer status to accepted
    const updatedOffer = {
      ...helpOffer,
      status: 'accepted',
      accepterId,
      acceptedAt: new Date().toISOString(),
      contactMethod
    };

    await helpOffersContainer.item(offerId, helpOffer.geoRegion).replace(updatedOffer);

    // Create anonymous chat channel ID
    const chatChannelId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`✅ Help offer ${offerId} accepted by ${accepterId}`);

    res.status(200).json({
      success: true,
      message: 'Help offer accepted successfully',
      chatChannelId,
      helpOffer: updatedOffer
    });

  } catch (error) {
    console.error('❌ Failed to accept help offer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Anonymous Chat Message
 * POST /api/community/chat/:channelId/message
 */
router.post('/chat/:channelId/message', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { senderId, message, messageType = 'chat' } = req.body;

    if (!senderId || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sender ID and message are required' 
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Community services are currently unavailable'
      });
    }

    const messageId = `chatmsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chatMessage = {
      id: messageId,
      geoRegion: 'global', // Chat messages are global
      channelId,
      senderId: 'anonymous', // Always anonymous
      message: message.trim(),
      messageType,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      _ts: Math.floor(Date.now() / 1000)
    };

    await anonymousMessagesContainer.items.create(chatMessage);

    console.log(`💬 Chat message sent in channel ${channelId}`);

    res.status(201).json({
      success: true,
      messageId,
      message: 'Message sent successfully',
      chatMessage
    });

  } catch (error) {
    console.error('❌ Failed to send chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Get Chat Messages
 * GET /api/community/chat/:channelId/messages
 */
router.get('/chat/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50 } = req.query;

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Community services are currently unavailable'
      });
    }

    const messageQuery = {
      query: `
        SELECT * FROM c 
        WHERE c.channelId = @channelId
        ORDER BY c.timestamp ASC
      `,
      parameters: [{ name: '@channelId', value: channelId }]
    };
    
    const { resources: messages } = await anonymousMessagesContainer.items.query(messageQuery).fetchAll();
    
    console.log(`💬 Retrieved ${messages.length} chat messages for channel ${channelId}`);

    res.status(200).json({
      success: true,
      messages: messages.slice(-parseInt(limit)), // Get latest messages
      channelId
    });

  } catch (error) {
    console.error('❌ Failed to get chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      messages: []
    });
  }
});

/**
 * Get Help Notifications
 * GET /api/community/help-notifications?userId=&lat=&lng=
 */
router.get('/help-notifications', async (req, res) => {
  try {
    const { userId, lat, lng } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    if (!cosmosReady) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Community services are currently unavailable'
      });
    }

    // Get user's check-ins to find relevant help offers and messages
    let userCheckins = [];
    let geoRegion = 'global';
    
    if (lat && lng) {
      geoRegion = generateGeoRegion(parseFloat(lat), parseFloat(lng));
      
      // Find user's recent check-ins
      const checkinQuery = {
        query: `
          SELECT c.id 
          FROM c 
          WHERE c.geoRegion = @geoRegion 
          AND (c.userId = @userId OR c.userId = @anonUserId)
          AND c.timestamp >= @since
        `,
        parameters: [
          { name: '@geoRegion', value: geoRegion },
          { name: '@userId', value: userId },
          { name: '@anonUserId', value: `anon_${userId.slice(0, 8)}` },
          { name: '@since', value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
        ]
      };
      
      const { resources: checkins } = await checkinContainer.items.query(checkinQuery).fetchAll();
      userCheckins = checkins.map(c => c.id);
    }

    // Get help offers for user's check-ins
    let helpOffers = [];
    if (userCheckins.length > 0) {
      const helpQuery = {
        query: `
          SELECT * FROM c 
          WHERE c.targetCheckinId IN (${userCheckins.map((_, i) => `@checkin${i}`).join(', ')})
          AND c.status = 'pending'
          ORDER BY c.timestamp DESC
        `,
        parameters: userCheckins.map((checkinId, i) => ({ name: `@checkin${i}`, value: checkinId }))
      };
      
      const { resources: offers } = await helpOffersContainer.items.query(helpQuery).fetchAll();
      helpOffers = offers.slice(0, 10); // Limit to 10 most recent
    }

    // Get anonymous messages for user's check-ins
    let anonymousMessages = [];
    if (userCheckins.length > 0) {
      const messageQuery = {
        query: `
          SELECT * FROM c 
          WHERE c.targetCheckinId IN (${userCheckins.map((_, i) => `@checkin${i}`).join(', ')})
          AND c.status = 'sent'
          ORDER BY c.timestamp DESC
        `,
        parameters: userCheckins.map((checkinId, i) => ({ name: `@checkin${i}`, value: checkinId }))
      };
      
      const { resources: messages } = await anonymousMessagesContainer.items.query(messageQuery).fetchAll();
      anonymousMessages = messages.slice(0, 10); // Limit to 10 most recent
    }

    const totalNotifications = helpOffers.length + anonymousMessages.length;

    console.log(`📬 Retrieved ${totalNotifications} notifications for user: ${userId}`);

    res.status(200).json({
      success: true,
      helpOffers,
      anonymousMessages,
      totalNotifications,
      location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
    });

  } catch (error) {
    console.error('❌ Failed to get help notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      helpOffers: [],
      anonymousMessages: [],
      totalNotifications: 0
    });
  }
});

console.log('🌍 Community Hub API routes (Cosmos DB) initialized');

export default router;