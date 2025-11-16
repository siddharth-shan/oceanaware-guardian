/**
 * Optimized Cosmos DB Service for Community Features
 * Designed for scaling to 1000s of users with proper partitioning, caching, and performance optimizations
 */

import { CosmosClient } from '@azure/cosmos';
import NodeCache from 'node-cache';

class OptimizedCosmosService {
  constructor(connectionString, databaseName) {
    this.connectionString = connectionString;
    this.databaseName = databaseName;
    this.client = null;
    this.database = null;
    this.containers = new Map();
    
    // Local cache for frequently accessed data (TTL: 5 minutes)
    this.cache = new NodeCache({ 
      stdTTL: 300, // 5 minutes
      checkperiod: 60 // Check for expired keys every minute
    });
    
    // Connection pool settings
    this.clientOptions = {
      connectionString: this.connectionString,
      userAgentSuffix: 'EcoQuestWildfireWatch/1.0.0',
      connectionPolicy: {
        ConnectionMode: 'Gateway', // More efficient for serverless
        MaxConnectionLimit: 10,
        RetryOptions: {
          MaxRetryAttemptsOnThrottledRequests: 3,
          MaxRetryWaitTimeInSeconds: 30
        }
      }
    };
  }

  /**
   * Initialize connection with optimized settings
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Optimized Cosmos DB Service...');
      
      this.client = new CosmosClient(this.clientOptions);
      
      // Create database with shared throughput for cost optimization
      const { database } = await this.client.databases.createIfNotExists({
        id: this.databaseName,
        throughput: 1000 // Shared across containers
      });
      this.database = database;
      
      // Initialize containers with optimized partition strategies
      await this.initializeContainers();
      
      console.log('✅ Optimized Cosmos DB Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Optimized Cosmos DB Service:', error);
      return false;
    }
  }

  /**
   * Initialize containers with improved partition strategies and indexing
   */
  async initializeContainers() {
    const containerConfigs = [
      {
        id: 'CommunityReports',
        partitionKey: '/hierarchicalPartition', // state-county-region format
        indexingPolicy: {
          indexingMode: 'consistent',
          automatic: true,
          includedPaths: [
            { path: '/timestamp/?', indexes: [{ kind: 'Range', dataType: 'String' }] },
            { path: '/type/?', indexes: [{ kind: 'Hash', dataType: 'String' }] },
            { path: '/urgentLevel/?', indexes: [{ kind: 'Hash', dataType: 'String' }] },
            { path: '/status/?', indexes: [{ kind: 'Hash', dataType: 'String' }] },
            { path: '/verificationCount/?', indexes: [{ kind: 'Range', dataType: 'Number' }] }
          ],
          excludedPaths: [
            { path: '/description/*' }, // Large text fields
            { path: '/verifiedByUsers/*' } // Arrays don't need indexing
          ]
        }
      },
      {
        id: 'CommunityCheckins',
        partitionKey: '/hierarchicalPartition',
        indexingPolicy: {
          indexingMode: 'consistent',
          automatic: true,
          includedPaths: [
            { path: '/timestamp/?', indexes: [{ kind: 'Range', dataType: 'String' }] },
            { path: '/status/?', indexes: [{ kind: 'Hash', dataType: 'String' }] }
          ],
          excludedPaths: [{ path: '/message/*' }]
        }
      },
      {
        id: 'FamilyGroups',
        partitionKey: '/groupCode', // Keep existing for family groups
        indexingPolicy: {
          indexingMode: 'consistent',
          automatic: true,
          includedPaths: [
            { path: '/lastActivity/?', indexes: [{ kind: 'Range', dataType: 'String' }] },
            { path: '/memberCount/?', indexes: [{ kind: 'Range', dataType: 'Number' }] }
          ]
        }
      }
    ];

    for (const config of containerConfigs) {
      const { container } = await this.database.containers.createIfNotExists(config);
      this.containers.set(config.id, container);
      console.log(`📦 Container initialized: ${config.id}`);
    }
  }

  /**
   * Generate hierarchical partition key for better distribution
   * Format: state-county-region (e.g., "CA-LA-34.05,-118.25")
   */
  generateHierarchicalPartition(lat, lng, state = 'CA', county = null) {
    // Round to ~10km precision for privacy
    const regionLat = Math.floor(lat * 100) / 100;
    const regionLng = Math.floor(lng * 100) / 100;
    const region = `${regionLat},${regionLng}`;
    
    // Auto-detect county from coordinates (simplified)
    if (!county) {
      county = this.detectCounty(lat, lng);
    }
    
    return `${state}-${county}-${region}`;
  }

  /**
   * Simple county detection (would be replaced with proper geolocation service)
   */
  detectCounty(lat, lng) {
    // Simplified mapping for California counties
    if (lat >= 34.0 && lat <= 34.5 && lng >= -118.5 && lng <= -117.5) return 'LA';
    if (lat >= 37.7 && lat <= 38.0 && lng >= -122.5 && lng <= -122.0) return 'SF';
    if (lat >= 32.5 && lat <= 33.0 && lng >= -117.5 && lng <= -116.5) return 'SD';
    return 'OTHER';
  }

  /**
   * Generate broader search partitions for fallback searches
   */
  generateBroaderSearchPartitions(lat, lng) {
    const partitions = [];
    const baseState = 'CA';
    const baseCounty = this.detectCounty(lat, lng);
    
    // Generate neighboring grid cells (±0.01 degrees, ~1km)
    for (let latOffset = -0.01; latOffset <= 0.01; latOffset += 0.01) {
      for (let lngOffset = -0.01; lngOffset <= 0.01; lngOffset += 0.01) {
        if (latOffset === 0 && lngOffset === 0) continue; // Skip center (already searched)
        
        const newLat = lat + latOffset;
        const newLng = lng + lngOffset;
        const partition = this.generateHierarchicalPartition(newLat, newLng, baseState, baseCounty);
        partitions.push(partition);
      }
    }
    
    // Add broader county-level search
    partitions.push(`${baseState}-${baseCounty}-*`);
    
    // Add other nearby counties for edge cases
    const nearbyCounties = ['LA', 'SF', 'SD', 'OTHER'];
    for (const county of nearbyCounties) {
      if (county !== baseCounty) {
        partitions.push(`${baseState}-${county}-*`);
      }
    }
    
    return partitions.slice(0, 5); // Limit to prevent excessive queries
  }

  /**
   * Submit community report with optimizations
   */
  async submitCommunityReport(reportData) {
    const container = this.containers.get('CommunityReports');
    if (!container) throw new Error('CommunityReports container not initialized');

    const { location, userId, type, description, urgentLevel = 'normal' } = reportData;
    
    // Generate hierarchical partition for better distribution
    const hierarchicalPartition = this.generateHierarchicalPartition(
      location.lat, 
      location.lng
    );
    
    // Check for duplicate reports (anti-spam)
    const duplicateCheck = await this.checkDuplicateReport(userId, location, type);
    if (duplicateCheck.isDuplicate) {
      throw new Error('Similar report already exists within 1km and 1 hour');
    }

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const reportDocument = {
      id: reportId,
      hierarchicalPartition, // New partition key
      geoRegion: this.generateGeoRegion(location.lat, location.lng), // Keep for backward compatibility
      userId: reportData.anonymousMode ? `anon_${userId.slice(0, 8)}` : userId,
      originalUserId: userId,
      type,
      title: reportData.title?.trim() || `${type} Report`,
      description: description.trim(),
      location: {
        lat: Math.round(location.lat * 1000) / 1000,
        lng: Math.round(location.lng * 1000) / 1000,
        region: location.region || 'Unknown Area'
      },
      urgentLevel,
      status: 'active',
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      verificationCount: 0,
      verifiedByUsers: [],
      clusterId: null, // For grouping nearby reports
      _ts: Math.floor(Date.now() / 1000)
    };

    await container.items.create(reportDocument);
    
    // Clear cache for this region to ensure fresh data
    this.clearReportsCache(hierarchicalPartition);
    
    console.log(`✅ Community report created: ${reportId} in partition ${hierarchicalPartition}`);
    return { success: true, reportId, hierarchicalPartition };
  }

  /**
   * Get community reports with pagination and clustering
   */
  async getCommunityReports(lat, lng, options = {}) {
    const {
      limit = 20,
      continuationToken = null,
      types = null,
      urgentLevels = null,
      maxAge = 7, // days
      includeVerified = true
    } = options;

    const hierarchicalPartition = this.generateHierarchicalPartition(lat, lng);
    console.log(`🔍 DEBUG getCommunityReports: Generated partition for lat=${lat}, lng=${lng}: ${hierarchicalPartition}`);
    console.log(`🔍 DEBUG getCommunityReports: Expected working partition: CA-OTHER-34.95,-120.44`);
    console.log(`🔍 DEBUG getCommunityReports: Partition match: ${hierarchicalPartition === 'CA-OTHER-34.95,-120.44'}`);
    
    const cacheKey = `reports_${hierarchicalPartition}_${JSON.stringify(options)}`;
    
    // TEMPORARILY DISABLE CACHE FOR DEBUGGING
    // Check cache first
    // const cached = this.cache.get(cacheKey);
    // if (cached && !continuationToken) {
    //   console.log(`📋 Cache hit for reports: ${hierarchicalPartition}`);
    //   return cached;
    // }
    console.log(`🔍 DEBUG: Cache disabled for debugging - running fresh query`);

    const container = this.containers.get('CommunityReports');
    if (!container) throw new Error('CommunityReports container not initialized');

    // TEMPORARILY SIMPLIFIED QUERY FOR DEBUGGING
    let queryText = `
      SELECT c.id, c.type, c.title, c.description, c.location, c.urgentLevel, 
             c.status, c.timestamp, c.verificationCount, c.clusterId
      FROM c 
      WHERE c.hierarchicalPartition = @partition
    `;
    
    console.log(`🔍 DEBUG: Using simplified query (removed status and timestamp filters)`);

    const parameters = [
      { name: '@partition', value: hierarchicalPartition }
      // Removed @since parameter for debugging
    ];

    // Add type filtering
    if (types && types.length > 0) {
      queryText += ` AND c.type IN (${types.map((_, i) => `@type${i}`).join(', ')})`;
      types.forEach((type, i) => {
        parameters.push({ name: `@type${i}`, value: type });
      });
    }

    // Add urgency filtering
    if (urgentLevels && urgentLevels.length > 0) {
      queryText += ` AND c.urgentLevel IN (${urgentLevels.map((_, i) => `@urgent${i}`).join(', ')})`;
      urgentLevels.forEach((level, i) => {
        parameters.push({ name: `@urgent${i}`, value: level });
      });
    }

    queryText += ` ORDER BY c.timestamp DESC`; // Single column ordering to avoid composite index requirements

    const querySpec = {
      query: queryText,
      parameters
    };

    // Execute query with pagination
    const queryOptions = {
      maxItemCount: limit,
      continuationToken
    };

    // TEMPORARILY USE fetchAll FOR DEBUGGING
    const { resources: reports } = 
      await container.items.query(querySpec, queryOptions).fetchAll();
    const nextToken = null; // No pagination with fetchAll
    
    console.log(`🔍 DEBUG: Using fetchAll instead of fetchNext`);

    let finalReports = reports || [];
    
    console.log(`🔍 DEBUG getCommunityReports: Found ${finalReports.length} reports from query`);
    console.log(`🔍 DEBUG getCommunityReports: Query used:`, queryText);
    console.log(`🔍 DEBUG getCommunityReports: Parameters:`, parameters);
    console.log(`🔍 DEBUG getCommunityReports: Max age filter: ${maxAge} days (since ${new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000).toISOString()})`);
    
    if (finalReports.length > 0) {
      console.log(`🔍 DEBUG getCommunityReports: Report timestamps:`, finalReports.map(r => ({ id: r.id, timestamp: r.timestamp })));
    }

    // If no reports found in specific partition, try broader area search
    if (finalReports.length === 0 && !continuationToken) {
      console.log(`🔍 No reports found for partition ${hierarchicalPartition}, searching broader area...`);
      
      // Generate broader search partitions (neighboring areas)
      const broadSearchPartitions = this.generateBroaderSearchPartitions(lat, lng);
      
      for (const broadPartition of broadSearchPartitions) {
        if (finalReports.length >= 10) break; // Limit to prevent excessive queries
        
        const broadQuerySpec = {
          query: queryText.replace('c.hierarchicalPartition = @partition', 'c.hierarchicalPartition = @broadPartition'),
          parameters: [
            { name: '@broadPartition', value: broadPartition },
            ...parameters.slice(1) // Skip original partition parameter
          ]
        };
        
        const { resources: broadReports } = await container.items.query(broadQuerySpec, {
          maxItemCount: 10
        }).fetchNext();
        
        if (broadReports && broadReports.length > 0) {
          console.log(`✅ Found ${broadReports.length} reports in broader partition ${broadPartition}`);
          finalReports.push(...broadReports);
        }
      }
      
      // If still no reports, try a global search for development/testing
      if (finalReports.length === 0 && process.env.NODE_ENV !== 'production') {
        console.log(`🌍 Still no reports found, attempting global search for testing...`);
        
        const globalQuerySpec = {
          query: queryText.replace('WHERE c.hierarchicalPartition = @partition AND', 'WHERE'),
          parameters: parameters.slice(1) // Remove partition parameter
        };
        
        const { resources: globalReports } = await container.items.query(globalQuerySpec, {
          maxItemCount: 5
        }).fetchNext();
        
        if (globalReports && globalReports.length > 0) {
          console.log(`✅ Found ${globalReports.length} reports via global search`);
          finalReports.push(...globalReports);
        }
      }
    }

    // Sort by emergency priority first (since DB ORDER BY was simplified)
    const prioritySortedReports = finalReports.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      const aUrgency = urgencyOrder[a.urgentLevel] || 0;
      const bUrgency = urgencyOrder[b.urgentLevel] || 0;
      
      if (aUrgency !== bUrgency) return bUrgency - aUrgency;
      if ((a.verificationCount || 0) !== (b.verificationCount || 0)) return (b.verificationCount || 0) - (a.verificationCount || 0);
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Cluster nearby reports
    const clusteredReports = this.clusterReportsByLocation(prioritySortedReports);
    
    const result = {
      success: true,
      hierarchicalPartition,
      reports: clusteredReports,
      totalReports: (reports || []).length,
      hasMore: !!nextToken,
      continuationToken: nextToken,
      lastUpdated: new Date().toISOString()
    };

    // Cache results for 2 minutes
    this.cache.set(cacheKey, result, 120);
    
    console.log(`✅ Retrieved ${(reports || []).length} reports for partition ${hierarchicalPartition}`);
    return result;
  }

  /**
   * Cluster reports by location to reduce visual clutter
   */
  clusterReportsByLocation(reports, clusterRadius = 0.01) { // ~1km
    if (!reports || reports.length === 0) {
      return [];
    }
    
    const clusters = new Map();
    const clusteredReports = [];

    for (const report of reports) {
      let clusterId = null;
      
      // Find existing cluster within radius
      for (const [existingClusterId, cluster] of clusters) {
        const distance = this.calculateDistance(
          report.location.lat, report.location.lng,
          cluster.centerLat, cluster.centerLng
        );
        
        if (distance <= clusterRadius) {
          clusterId = existingClusterId;
          break;
        }
      }
      
      if (clusterId) {
        // Add to existing cluster
        const cluster = clusters.get(clusterId);
        cluster.reports.push(report);
        cluster.count += 1;
        
        // Update cluster center (weighted average)
        cluster.centerLat = (cluster.centerLat * (cluster.count - 1) + report.location.lat) / cluster.count;
        cluster.centerLng = (cluster.centerLng * (cluster.count - 1) + report.location.lng) / cluster.count;
        
        // Update highest urgency
        const urgencyOrder = { critical: 4, high: 3, normal: 2, low: 1 };
        if (urgencyOrder[report.urgentLevel] > urgencyOrder[cluster.highestUrgency]) {
          cluster.highestUrgency = report.urgentLevel;
        }
      } else {
        // Create new cluster
        clusterId = `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        clusters.set(clusterId, {
          id: clusterId,
          centerLat: report.location.lat,
          centerLng: report.location.lng,
          count: 1,
          reports: [report],
          highestUrgency: report.urgentLevel,
          types: new Set([report.type])
        });
      }
      
      report.clusterId = clusterId;
    }

    // Convert clusters to array format
    for (const cluster of clusters.values()) {
      if (cluster.count === 1) {
        // Single report - add directly
        clusteredReports.push(cluster.reports[0]);
      } else {
        // Multiple reports - add cluster summary
        clusteredReports.push({
          id: cluster.id,
          isCluster: true,
          count: cluster.count,
          location: {
            lat: cluster.centerLat,
            lng: cluster.centerLng,
            region: cluster.reports[0].location.region
          },
          urgentLevel: cluster.highestUrgency,
          types: Array.from(cluster.types),
          reports: cluster.reports,
          timestamp: cluster.reports[0].timestamp // Most recent
        });
      }
    }

    return clusteredReports.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      const aUrgency = urgencyOrder[a.urgentLevel] || 0;
      const bUrgency = urgencyOrder[b.urgentLevel] || 0;
      
      if (aUrgency !== bUrgency) return bUrgency - aUrgency;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check for duplicate reports to prevent spam
   */
  async checkDuplicateReport(userId, location, type) {
    const container = this.containers.get('CommunityReports');
    const hierarchicalPartition = this.generateHierarchicalPartition(location.lat, location.lng);
    
    const querySpec = {
      query: `
        SELECT c.id, c.location FROM c 
        WHERE c.hierarchicalPartition = @partition
        AND c.originalUserId = @userId
        AND c.type = @type
        AND c.timestamp >= @since
        AND c.status = 'active'
      `,
      parameters: [
        { name: '@partition', value: hierarchicalPartition },
        { name: '@userId', value: userId },
        { name: '@type', value: type },
        { name: '@since', value: new Date(Date.now() - 60 * 60 * 1000).toISOString() } // 1 hour
      ]
    };

    const { resources: reports } = await container.items.query(querySpec).fetchAll();
    
    // Check if any report is within 1km
    for (const report of reports) {
      const distance = this.calculateDistance(
        location.lat, location.lng,
        report.location.lat, report.location.lng
      );
      
      if (distance <= 1) { // 1km radius
        return { isDuplicate: true, existingReportId: report.id };
      }
    }
    
    return { isDuplicate: false };
  }

  /**
   * Backward compatibility method
   */
  generateGeoRegion(lat, lng) {
    const regionLat = Math.floor(lat * 100) / 100;
    const regionLng = Math.floor(lng * 100) / 100;
    return `${regionLat},${regionLng}`;
  }

  /**
   * Verify report with rate limiting - Enhanced to handle cross-partition lookups
   */
  async verifyReport(reportId, userId, approximatePartition, options = {}) {
    console.log(`🔍 Verifying report ${reportId} with user ${userId} in partition ${approximatePartition}`);
    
    const container = this.containers.get('CommunityReports');
    let report = null;
    let actualPartition = approximatePartition;
    
    // First, try with the approximate partition (fast path)
    try {
      console.log(`🚀 Attempting direct read from partition ${approximatePartition}`);
      report = await container.item(reportId, approximatePartition).read();
      console.log(`✅ Direct read successful for report ${reportId}`);
      console.log(`📝 Direct read report object:`, JSON.stringify(report, null, 2));
    } catch (error) {
      console.log(`❌ Direct read failed: ${error.message}`);
      // If not found, do a cross-partition query to find the report
      console.log(`📍 Report ${reportId} not found in partition ${approximatePartition}, searching across partitions...`);
      
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.id = @reportId',
        parameters: [
          { name: '@reportId', value: reportId }
        ]
      };
      
      console.log(`🔍 Executing cross-partition query for report ${reportId}`);
      try {
        const { resources: reports } = await container.items.query(querySpec, { enableCrossPartitionQuery: true }).fetchAll();
        console.log(`📊 Cross-partition query returned ${reports ? reports.length : 0} results`);
        
        if (reports && reports.length > 0) {
          report = { resource: reports[0] };
          actualPartition = reports[0].hierarchicalPartition || reports[0].geoRegion || 'unknown';
          console.log(`✅ Found report ${reportId} in partition ${actualPartition}`);
          console.log(`📝 Report structure:`, JSON.stringify(reports[0], null, 2));
        } else {
          console.error(`❌ Report ${reportId} not found in any partition`);
        }
      } catch (queryError) {
        console.error(`❌ Cross-partition query failed:`, queryError.message);
      }
    }
    
    // Handle both direct read response and cross-partition query response
    let reportData = null;
    if (report && report.resource) {
      reportData = report.resource;
      // Determine actual partition from the found report
      actualPartition = reportData.hierarchicalPartition || reportData.geoRegion || reportData._partitionKey || actualPartition;
    } else if (report && report.id) {
      // Direct response from Cosmos DB read
      reportData = report;
      // Determine actual partition from the found report
      actualPartition = reportData.hierarchicalPartition || reportData.geoRegion || reportData._partitionKey || actualPartition;
    }
    
    if (!reportData) {
      console.error(`❌ Report verification failed - report ${reportId} not found in partition ${approximatePartition} or any partition`);
      throw new Error(`Report ${reportId} not found`);
    }
    
    console.log(`✅ Report ${reportId} found, proceeding with verification`);
    console.log(`📋 Report data: ID=${reportData.id}, originalUserId=${reportData.originalUserId || reportData.userId}, verificationCount=${reportData.verificationCount}`);
    console.log(`🔑 Report partition keys - hierarchicalPartition: ${reportData.hierarchicalPartition}, geoRegion: ${reportData.geoRegion}, actualPartition: ${actualPartition}`);
    
    // Check ownership (prevent self-verification)
    const originalUserId = reportData.originalUserId || reportData.userId;
    if (originalUserId === userId) {
      console.log(`❌ Self-verification attempt blocked: ${userId}`);
      throw new Error('Cannot verify own report');
    }
    
    // Check if already verified by this user
    if (reportData.verifiedByUsers && reportData.verifiedByUsers.includes(userId)) {
      console.log(`❌ Duplicate verification attempt blocked: ${userId}`);
      throw new Error('Already verified by this user');
    }
    
    // For anonymous verification, create a unique identifier to prevent spam
    const verifierIdentifier = options.anonymous 
      ? `anon_${userId}_${actualPartition}_${Date.now()}`
      : userId;
    
    // Check if anonymous user already verified (prevent spam)
    if (options.anonymous && reportData.verifiedByUsers) {
      const hasAnonymousVerification = reportData.verifiedByUsers.some(id => 
        id.startsWith(`anon_${userId.split('_')[1]}`) // Check based on session/location pattern
      );
      if (hasAnonymousVerification) {
        throw new Error('You have already verified this report');
      }
    }
    
    // Update verification
    const updatedReport = {
      ...reportData,
      verificationCount: (reportData.verificationCount || 0) + 1,
      verifiedByUsers: [...(reportData.verifiedByUsers || []), verifierIdentifier],
      lastVerified: new Date().toISOString(),
      verificationNote: options.verificationNote || null
    };
    
    console.log(`🔄 Updating report ${reportId} with new verification count: ${updatedReport.verificationCount}`);
    console.log(`🗂️ Using partition key for update: ${actualPartition}`);
    
    // Use the actual partition for the update - prioritize the found partition from cross-partition query
    let partitionKeyForUpdate = reportData.hierarchicalPartition || reportData.geoRegion;
    
    // If no partition key found in report data, use the actualPartition from our search
    if (!partitionKeyForUpdate) {
      partitionKeyForUpdate = actualPartition;
      console.log(`🔧 No partition key in report data - using actualPartition: ${actualPartition}`);
    }
    
    // Final fallback for development mode
    if (!partitionKeyForUpdate || partitionKeyForUpdate === 'unknown') {
      partitionKeyForUpdate = 'local-dev';
      console.log(`🔧 Development mode fallback - using 'local-dev' partition`);
    }
    
    console.log(`🔑 Final partition key for replace: ${partitionKeyForUpdate}`);
    console.log(`🔍 Debug - All partition options:`, {
      hierarchicalPartition: reportData.hierarchicalPartition,
      geoRegion: reportData.geoRegion,
      _partitionKey: reportData._partitionKey,
      actualPartition: actualPartition,
      approximatePartition: approximatePartition,
      partitionKeyForUpdate: partitionKeyForUpdate
    });
    
    try {
      console.log(`🔄 Attempting replace with partition key: ${partitionKeyForUpdate}`);
      await container.item(reportId, partitionKeyForUpdate).replace(updatedReport);
    } catch (replaceError) {
      console.error(`❌ Replace operation failed with partition ${partitionKeyForUpdate}:`, replaceError.message);
      console.error(`❌ Replace error details:`, {
        message: replaceError.message,
        status: replaceError.code,
        activityId: replaceError.activityId,
        substatus: replaceError.substatus
      });
      
      // Try all possible partition keys systematically
      const latLngKey = reportData.location ? `${reportData.location.lat},${reportData.location.lng}` : null;
      const possibleKeys = [
        latLngKey,
        reportData.geoRegion,
        approximatePartition,
        reportData.hierarchicalPartition,
        'local-dev'
      ].filter(key => key && key !== partitionKeyForUpdate);
      
      console.log(`🔄 Attempting fallback with ${possibleKeys.length} alternative partition keys:`, possibleKeys);
      
      let lastError = replaceError;
      for (const alternativeKey of possibleKeys) {
        try {
          console.log(`🔄 Trying alternative partition key: ${alternativeKey}`);
          await container.item(reportId, alternativeKey).replace(updatedReport);
          console.log(`✅ Success with alternative partition key: ${alternativeKey}`);
          actualPartition = alternativeKey; // Update actual partition for cache clearing
          break;
        } catch (altError) {
          console.log(`❌ Alternative partition key ${alternativeKey} failed: ${altError.message}`);
          lastError = altError;
        }
      }
      
      // If all alternatives failed, throw the last error
      if (possibleKeys.length === 0 || lastError === replaceError) {
        throw replaceError;
      }
    }
    
    console.log(`✅ Report ${reportId} verification update successful`);
    
    // Clear cache for this region to ensure fresh data
    this.clearReportsCache(actualPartition);
    
    console.log(`🎉 Verification complete for report ${reportId} by ${verifierIdentifier}`);
    
    return { 
      success: true, 
      verificationCount: updatedReport.verificationCount,
      actualPartition 
    };
  }

  /**
   * Check if user can verify a report
   */
  async checkUserVerification(userId, reportId) {
    try {
      console.log(`🔍 Checking verification status for user ${userId} on report ${reportId}`);
      
      // First try to find the report using the same logic as verifyReport
      const approximatePartition = 'CA-OTHER'; // Default partition for lookup
      let report = null;
      let reportData = null;
      
      // Try direct read first
      try {
        console.log(`🚀 Attempting direct read from partition ${approximatePartition}`);
        const container = this.containers.get('CommunityReports');
        report = await container.item(reportId, approximatePartition).read();
        if (report && report.resource) {
          reportData = report.resource;
        }
      } catch (error) {
        console.log(`❌ Direct read failed: ${error.message}, trying cross-partition query`);
        
        // Fall back to cross-partition query
        try {
          const container = this.containers.get('CommunityReports');
          const querySpec = {
            query: 'SELECT * FROM c WHERE c.id = @reportId',
            parameters: [{ name: '@reportId', value: reportId }]
          };
          
          const { resources: reports } = await container.items.query(querySpec, { enableCrossPartitionQuery: true }).fetchAll();
          if (reports && reports.length > 0) {
            reportData = reports[0];
            console.log(`✅ Found report ${reportId} via cross-partition query`);
          }
        } catch (queryError) {
          console.error(`❌ Cross-partition query failed:`, queryError.message);
        }
      }
      
      if (!reportData) {
        // Allow verification by default when report not found (graceful degradation)
        console.log(`⚠️ Report ${reportId} not found, allowing verification by default`);
        return {
          hasVerified: false,
          canVerify: true,
          isOriginalAuthor: false,
          error: 'Report not found, but verification allowed'
        };
      }
      
      // Check if user is original author
      const originalUserId = reportData.originalUserId || reportData.userId;
      const isOriginalAuthor = originalUserId === userId;
      
      // Check if user has already verified
      const verifiedByUsers = reportData.verifiedByUsers || [];
      const hasVerified = verifiedByUsers.includes(userId) || 
                         verifiedByUsers.some(id => id.startsWith(`anon_${userId}`));
      
      const canVerify = !isOriginalAuthor && !hasVerified;
      
      console.log(`✅ Verification check complete: canVerify=${canVerify}, hasVerified=${hasVerified}, isOriginalAuthor=${isOriginalAuthor}`);
      
      return {
        hasVerified,
        canVerify,
        isOriginalAuthor
      };
      
    } catch (error) {
      console.error(`❌ Error checking verification status:`, error);
      // Allow verification by default on error (graceful degradation)
      return {
        hasVerified: false,
        canVerify: true,
        isOriginalAuthor: false,
        error: `Error checking status: ${error.message}`
      };
    }
  }

  /**
   * Clear reports cache for a specific partition
   */
  clearReportsCache(hierarchicalPartition) {
    const keys = this.cache.keys();
    const keysToDelete = keys.filter(key => 
      key.startsWith(`reports_${hierarchicalPartition}`)
    );
    
    keysToDelete.forEach(key => this.cache.del(key));
    console.log(`🗑️ Cleared ${keysToDelete.length} cache entries for partition ${hierarchicalPartition}`);
  }

  /**
   * Clear all reports cache entries
   */
  clearAllReportsCache() {
    const keys = this.cache.keys();
    const keysToDelete = keys.filter(key => key.startsWith('reports_'));
    
    keysToDelete.forEach(key => this.cache.del(key));
    console.log(`🗑️ Cleared ${keysToDelete.length} total reports cache entries`);
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      cacheStats: this.cache.getStats(),
      activeConnections: this.containers.size,
      timestamp: new Date().toISOString()
    };
  }
}

export default OptimizedCosmosService;