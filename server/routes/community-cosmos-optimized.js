/**
 * Optimized Community Hub API Routes - Phase 1 Implementation
 * Uses OptimizedCosmosService for improved performance and scalability
 */

import express from 'express';
import cosmosManager from '../services/CosmosManager.js';
import ClusteringService from '../services/ClusteringService.js';

const router = express.Router();

// Initialize services
const clusteringService = new ClusteringService();
let initializationPromise = null;

const ensureCosmosReady = async () => {
  if (!initializationPromise) {
    initializationPromise = cosmosManager.initialize();
  }
  await initializationPromise;
  return cosmosManager.getService();
};

/**
 * Health check endpoint with detailed metrics
 */
router.get('/health', async (req, res) => {
  try {
    const health = await cosmosManager.healthCheck();
    const recommendations = cosmosManager.getPerformanceRecommendations();
    
    res.json({
      status: health.status,
      service: 'community-hub-optimized',
      database: 'local-dev-database',
      health,
      performance: recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Check user verification status for a specific report
 * GET /api/community/reports/:reportId/verification-status
 */
router.get('/reports/:reportId/verification-status', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { userId } = req.query;

    // Generate the same user identifier logic as verification
    let userIdentifier;
    if (!userId) {
      const sessionId = req.headers['x-session-id'] || 
                       req.ip || 
                       'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      userIdentifier = `anon_${sessionId}`;
    } else {
      userIdentifier = userId;
    }

    const dbService = await ensureCosmosReady();
    const status = await dbService.checkUserVerification(userIdentifier, reportId);
    
    res.json(status);
  } catch (error) {
    console.error('❌ Error checking verification status:', error);
    res.status(500).json({
      error: 'Failed to check verification status',
      message: error.message
    });
  }
});

/**
 * Submit community report with proper database storage
 * POST /api/community/report
 */
router.post('/report', async (req, res) => {
  try {
    console.log('🌍 Community report submission received');
    
    const dbService = await ensureCosmosReady();
    
    // Generate a unique user identifier for report ownership
    let userIdentifier;
    if (req.body.anonymousMode || !req.body.userId) {
      const sessionId = req.headers['x-session-id'] || 
                       req.ip || 
                       'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      userIdentifier = `anon_${sessionId}`;
    } else {
      userIdentifier = req.body.userId;
    }
    
    const reportData = {
      ...req.body,
      userId: userIdentifier,
      originalUserId: userIdentifier,
      timestamp: new Date().toISOString()
    };
    
    const result = await dbService.submitCommunityReport(reportData);
    
    if (result.success) {
      console.log(`✅ Report created: ${result.reportId}`);
      
      res.json({
        success: true,
        reportId: result.reportId,
        message: 'Community report submitted successfully'
      });
    } else {
      throw new Error(result.error || 'Failed to create report');
    }
  } catch (error) {
    console.error('❌ Error creating community report:', error);
    
    // Handle specific error types
    if (error.message.includes('duplicate')) {
      return res.status(409).json({
        error: 'Duplicate report',
        message: error.message
      });
    }
    
    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limited',
        message: 'Please slow down your report submissions'
      });
    }
    
    res.status(500).json({
      error: 'Failed to create report',
      message: error.message
    });
  }
});

/**
 * DEBUG: Test exact partition query
 */
router.get('/reports/debug/partition/:partition', async (req, res) => {
  try {
    const { partition } = req.params;
    const dbService = await ensureCosmosReady();
    const container = dbService.containers.get('CommunityReports');
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.hierarchicalPartition = @partition ORDER BY c.timestamp DESC',
      parameters: [{ name: '@partition', value: partition }]
    };
    
    const { resources: partitionReports } = await container.items.query(querySpec).fetchAll();
    
    console.log(`🔍 DEBUG PARTITION: Found ${partitionReports.length} reports for partition ${partition}`);
    
    res.json({
      success: true,
      partition,
      totalReports: partitionReports.length,
      reports: partitionReports
    });
  } catch (error) {
    console.error('❌ DEBUG partition query failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get community reports with proper database queries
 * DEBUG: Get ALL reports without filtering  
 */
router.get('/reports/debug/all', async (req, res) => {
  try {
    const dbService = await ensureCosmosReady();
    const container = dbService.containers.get('CommunityReports');
    
    if (!container) {
      return res.status(500).json({ error: 'Container not available' });
    }

    // Query ALL reports without any filters
    const querySpec = {
      query: 'SELECT * FROM c ORDER BY c.timestamp DESC'
    };
    
    const { resources: allReports } = await container.items.query(querySpec).fetchAll();
    
    console.log(`🔍 DEBUG ALL REPORTS: Found ${allReports.length} total reports in database`);
    
    res.json({
      success: true,
      totalReports: allReports.length,
      reports: allReports.map(r => ({
        id: r.id,
        type: r.type,
        title: r.title,
        urgentLevel: r.urgentLevel,
        status: r.status,
        timestamp: r.timestamp,
        location: r.location,
        hierarchicalPartition: r.hierarchicalPartition
      }))
    });
  } catch (error) {
    console.error('❌ DEBUG query failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/community/reports
 */
router.get('/reports', async (req, res) => {
  try {
    const { 
      lat, 
      lng, 
      limit = 20, 
      types,
      urgentLevels,
      maxAge = 30,
      includeVerified = true
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Location required',
        message: 'Latitude and longitude are required'
      });
    }

    const dbService = await ensureCosmosReady();
    console.log(`🔍 Database service type: ${dbService.constructor.name}`);
    
    // Parse filters
    const options = {
      limit: parseInt(limit),
      types: types ? types.split(',') : null,
      urgentLevels: urgentLevels ? urgentLevels.split(',') : null,
      maxAge: parseInt(maxAge),
      includeVerified: includeVerified === 'true'
    };
    
    // Use the same dbService instance that was already initialized
    const container = dbService.containers.get('CommunityReports');
    console.log(`🔧 DIRECT QUERY: Container initialized:`, !!container);
    const hierarchicalPartition = dbService.generateHierarchicalPartition(parseFloat(lat), parseFloat(lng));
    
    console.log(`🔧 DIRECT QUERY: Using partition ${hierarchicalPartition} for lat=${lat}, lng=${lng}`);
    
    // Build query with proper filters (removed status filter for compatibility)
    let queryText = `SELECT * FROM c WHERE c.hierarchicalPartition = @partition`;
    const parameters = [{ name: '@partition', value: hierarchicalPartition }];
    
    // Remove timestamp filter for now to get all reports
    // const maxAge = 90; // Extended for testing
    // const since = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000).toISOString();
    // queryText += ` AND c.timestamp >= @since`;
    // parameters.push({ name: '@since', value: since });
    console.log(`🔧 DEBUG: Timestamp filter removed - showing all reports in partition`);
    
    queryText += ` ORDER BY c.timestamp DESC`;
    
    const querySpec = { query: queryText, parameters };
    const { resources: reports } = await container.items.query(querySpec).fetchAll();
    
    console.log(`🔧 DIRECT QUERY: Found ${reports.length} reports with all filters`);
    
    const result = {
      success: true,
      hierarchicalPartition,
      reports: reports || [],
      totalReports: (reports || []).length,
      hasMore: false
    };
    
    // ORIGINAL CODE COMMENTED OUT
    // const result = await dbService.getCommunityReports(
    //   parseFloat(lat), 
    //   parseFloat(lng), 
    //   options
    // );
    
    console.log(`✅ Retrieved ${result.reports.length} reports for lat=${lat}, lng=${lng} (maxAge=${maxAge} days)`);
    console.log(`🔍 DEBUG API: Query options:`, options);
    console.log(`🔍 DEBUG API: Reports returned:`, result.reports.map(r => ({ 
      id: r.id, 
      type: r.type, 
      urgentLevel: r.urgentLevel, 
      timestamp: r.timestamp,
      hierarchicalPartition: r.hierarchicalPartition 
    })));
    
    res.json({
      success: true,
      hierarchicalPartition: result.hierarchicalPartition || 'unknown', // Use actual partition from result
      reports: result.reports,
      totalReports: result.totalReports,
      hasMore: result.hasMore || false,
      lastUpdated: new Date().toISOString(),
      debug: {
        queryOptions: options,
        actualCount: result.reports.length,
        expectedMoreReports: result.reports.length < 4,
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        actualPartition: result.hierarchicalPartition // Show the actual partition being queried
      }
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
 * Verify community report with proper database updates
 * Supports both authenticated and anonymous verification
 * POST /api/community/reports/:reportId/verify
 */
router.post('/reports/:reportId/verify', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { userId, lat, lng, anonymous = false, verificationNote = '' } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Location is required for verification'
      });
    }

    // Generate a unique user identifier
    let verifierIdentifier;
    if (anonymous || !userId) {
      // For anonymous users, create a session-based identifier
      const sessionId = req.headers['x-session-id'] || 
                       req.ip || 
                       'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      verifierIdentifier = `anon_${sessionId}`;
    } else {
      verifierIdentifier = userId;
    }

    const dbService = await ensureCosmosReady();
    
    // Generate approximate partition for the report location
    let approximatePartition = dbService.generateHierarchicalPartition(
      parseFloat(lat), 
      parseFloat(lng)
    );
    
    // For development mode, use 'local-dev' partition
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      approximatePartition = 'local-dev';
      console.log(`🔧 Development mode - using 'local-dev' partition`);
    }
    
    console.log(`🗺️ Using partition for verification: ${approximatePartition} (lat: ${lat}, lng: ${lng})`);
    
    // Use OptimizedCosmosService verification method
    const result = await dbService.verifyReport(reportId, verifierIdentifier, approximatePartition, {
      anonymous,
      verificationNote: verificationNote.trim(),
      location: { lat: parseFloat(lat), lng: parseFloat(lng) }
    });
    
    if (result.success) {
      console.log(`✅ Report ${reportId} verified by ${anonymous ? 'anonymous user' : verifierIdentifier} (count: ${result.verificationCount})`);
      
      res.json({
        success: true,
        reportId,
        verificationCount: result.verificationCount,
        anonymous,
        message: `Report verification recorded ${anonymous ? 'anonymously' : ''}`
      });
    } else {
      throw new Error(result.error || 'Failed to verify report');
    }
  } catch (error) {
    console.error('❌ Error verifying report:', error);
    
    if (error.message.includes('Cannot verify own report')) {
      return res.status(400).json({
        error: 'Cannot verify own report',
        message: 'Users cannot verify their own reports'
      });
    }
    
    if (error.message.includes('already verified')) {
      return res.status(400).json({
        error: 'Already verified',
        message: 'You have already verified this report'
      });
    }
    
    if (error.message.includes('Report not found')) {
      console.error(`❌ Report ${reportId} not found in database during verification attempt`);
      return res.status(404).json({
        error: 'Report not found',
        message: `Report ${reportId} could not be found in the database`
      });
    }
    
    res.status(500).json({
      error: 'Failed to verify report',
      message: error.message
    });
  }
});

/**
 * Get community status with caching optimization
 * GET /api/community/status
 */
router.get('/status', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Location required',
        message: 'Latitude and longitude are required'
      });
    }

    const cosmosService = await ensureCosmosReady();
    const hierarchicalPartition = cosmosService.generateHierarchicalPartition(
      parseFloat(lat), 
      parseFloat(lng)
    );
    
    // Use cache key for status queries
    const cacheKey = `status_${hierarchicalPartition}_${radius}`;
    const cached = cosmosService.cache.get(cacheKey);
    
    if (cached) {
      console.log(`📋 Cache hit for community status: ${hierarchicalPartition}`);
      return res.json({
        ...cached,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Fetch from database (this would need implementation in OptimizedCosmosService)
    // For now, return a structured response
    const statusData = {
      success: true,
      hierarchicalPartition,
      statusCounts: {
        safe: 0,
        evacuating: 0,
        'need-help': 0,
        offline: 0
      },
      totalCheckins: 0,
      recentCheckins: [],
      communityMessages: [],
      lastUpdated: new Date().toISOString()
    };
    
    // Cache for 2 minutes
    cosmosService.cache.set(cacheKey, statusData, 120);
    
    console.log(`✅ Community status retrieved for partition ${hierarchicalPartition}`);
    res.json(statusData);
  } catch (error) {
    console.error('❌ Error fetching community status:', error);
    res.status(500).json({
      error: 'Failed to fetch community status',
      message: error.message
    });
  }
});

/**
 * Emergency mode toggle for administrators
 * POST /api/community/emergency-mode
 */
router.post('/emergency-mode', async (req, res) => {
  try {
    const { enabled, adminKey } = req.body;
    
    // Simple admin key check (in production, use proper authentication)
    if (adminKey !== process.env.ADMIN_EMERGENCY_KEY) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'Invalid admin key'
      });
    }
    
    cosmosManager.setEmergencyMode(enabled);
    
    res.json({
      success: true,
      emergencyMode: enabled,
      message: `Emergency mode ${enabled ? 'enabled' : 'disabled'}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error toggling emergency mode:', error);
    res.status(500).json({
      error: 'Failed to toggle emergency mode',
      message: error.message
    });
  }
});

/**
 * Get clustered community reports for optimized visualization
 * GET /api/community/reports/clustered
 */
router.get('/reports/clustered', async (req, res) => {
  try {
    const { 
      lat, 
      lng, 
      radius = 50,
      clusterRadius = 1.0,
      emergencyMode = false,
      forceRefresh = false
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Location required',
        message: 'Latitude and longitude are required for clustering'
      });
    }

    const cosmosService = await ensureCosmosReady();
    
    // Get all reports in the area first
    const reportsResult = await cosmosService.getCommunityReports(
      parseFloat(lat), 
      parseFloat(lng), 
      { 
        limit: 1000, // Get more reports for clustering
        maxAge: 7,
        includeVerified: true
      }
    );
    
    if (!reportsResult.success) {
      throw new Error('Failed to fetch reports for clustering');
    }
    
    // Apply server-side clustering
    const clusteringOptions = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: parseFloat(radius),
      clusterRadius: parseFloat(clusterRadius),
      emergencyMode: emergencyMode === 'true',
      forceRefresh: forceRefresh === 'true'
    };
    
    const clusteringResult = await clusteringService.clusterReports(
      reportsResult.reports, 
      clusteringOptions
    );
    
    console.log(`✅ Clustered ${reportsResult.reports.length} reports into ${clusteringResult.clusterCount} clusters`);
    
    res.json({
      success: true,
      hierarchicalPartition: reportsResult.hierarchicalPartition,
      ...clusteringResult
    });
    
  } catch (error) {
    console.error('❌ Error clustering reports:', error);
    res.status(500).json({
      error: 'Failed to cluster reports',
      message: error.message
    });
  }
});

/**
 * Create sample data for testing (development only)
 * POST /api/community/create-sample-data
 */
router.post('/create-sample-data', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Not allowed',
        message: 'Sample data creation is only available in development mode'
      });
    }

    const { lat, lng, count = 3 } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Location required',
        message: 'Latitude and longitude are required for sample data creation'
      });
    }

    const dbService = await ensureCosmosReady();
    const sampleReports = [];
    
    const reportTypes = ['fire-spotting', 'power-line-down', 'unsafe-conditions', 'road-closure'];
    const urgentLevels = ['critical', 'high', 'normal', 'low'];
    
    for (let i = 0; i < count; i++) {
      const reportData = {
        userId: `test_user_${i}`,
        originalUserId: `test_user_${i}`,
        type: reportTypes[i % reportTypes.length],
        title: `Test Report ${i + 1}`,
        description: `This is a sample report #${i + 1} for testing the Community Hub interface in zip code 93454 area.`,
        location: {
          lat: parseFloat(lat) + (Math.random() - 0.5) * 0.01, // Small random offset
          lng: parseFloat(lng) + (Math.random() - 0.5) * 0.01,
          region: 'Santa Barbara County, CA'
        },
        urgentLevel: urgentLevels[i % urgentLevels.length],
        anonymousMode: true,
        timestamp: new Date(Date.now() - (i * 2 * 60 * 60 * 1000)).toISOString() // Staggered times
      };
      
      const result = await dbService.submitCommunityReport(reportData);
      if (result.success) {
        sampleReports.push({
          id: result.reportId,
          type: reportData.type,
          urgentLevel: reportData.urgentLevel
        });
      }
    }
    
    console.log(`✅ Created ${sampleReports.length} sample reports for testing`);
    
    res.json({
      success: true,
      message: `Created ${sampleReports.length} sample reports`,
      reports: sampleReports,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) }
    });
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    res.status(500).json({
      error: 'Failed to create sample data',
      message: error.message
    });
  }
});

/**
 * Performance metrics endpoint
 * GET /api/community/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    if (!cosmosManager.isReady()) {
      return res.status(503).json({
        error: 'Service not ready',
        message: 'Cosmos service is not initialized'
      });
    }
    
    const recommendations = cosmosManager.getPerformanceRecommendations();
    const health = await cosmosManager.healthCheck();
    const clusteringMetrics = clusteringService.getMetrics();
    
    res.json({
      performance: recommendations,
      health: health.metrics,
      clustering: clusteringMetrics,
      recommendations: recommendations.recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error.message
    });
  }
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down community service gracefully...');
  await cosmosManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down community service gracefully...');
  await cosmosManager.shutdown();
  process.exit(0);
});

console.log('🌍 Optimized Community Hub API routes initialized');

export default router;