/**
 * Server-side Clustering Service
 * High-performance clustering for large datasets with caching optimization
 */

import NodeCache from 'node-cache';

class ClusteringService {
  constructor() {
    // Cache clusters for 3 minutes (180s)
    this.clusterCache = new NodeCache({ 
      stdTTL: 180,
      checkperiod: 60,
      useClones: false // Improve performance
    });
    
    // Performance metrics
    this.metrics = {
      clusteringOperations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgClusteringTime: 0
    };
  }

  /**
   * Main clustering method with caching and performance optimization
   * @param {Array} reports - Array of reports to cluster
   * @param {Object} options - Clustering options
   * @returns {Object} Clustering results with metadata
   */
  async clusterReports(reports, options = {}) {
    const startTime = Date.now();
    
    const {
      lat,
      lng,
      radius = 50, // km
      clusterRadius = 1.0,
      gridSize = 2.0,
      emergencyMode = false,
      forceRefresh = false
    } = options;

    // Generate cache key
    const cacheKey = this.generateCacheKey(lat, lng, radius, options);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.clusterCache.get(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        console.log(`📋 Cluster cache hit: ${cacheKey}`);
        return {
          ...cached,
          fromCache: true,
          cacheAge: Date.now() - cached.timestamp
        };
      }
    }
    
    this.metrics.cacheMisses++;
    
    // Filter reports by location and emergency criteria
    const filteredReports = this.filterReportsByLocation(reports, lat, lng, radius, emergencyMode);
    
    // Choose clustering algorithm based on dataset size and mode
    let clusters;
    if (filteredReports.length > 1000) {
      clusters = this.gridBasedClustering(filteredReports, gridSize);
    } else if (filteredReports.length > 100) {
      clusters = this.densityBasedClustering(filteredReports, clusterRadius);
    } else {
      clusters = this.simpleClustering(filteredReports, clusterRadius);
    }
    
    // Sort by priority (emergency-first)
    const sortedClusters = this.sortClustersByPriority(clusters, emergencyMode);
    
    const result = {
      success: true,
      clusters: sortedClusters,
      totalReports: filteredReports.length,
      originalReports: reports.length,
      clusterCount: sortedClusters.length,
      algorithm: this.getAlgorithmName(filteredReports.length),
      processingTime: Date.now() - startTime,
      timestamp: Date.now(),
      emergencyMode,
      locationFilter: { lat, lng, radius }
    };
    
    // Cache the result
    this.clusterCache.set(cacheKey, result);
    
    // Update metrics
    this.metrics.clusteringOperations++;
    this.updateAvgClusteringTime(result.processingTime);
    
    console.log(`✅ Clustered ${filteredReports.length} reports into ${sortedClusters.length} clusters (${result.processingTime}ms)`);
    
    return result;
  }

  /**
   * Filter reports by geographic location and emergency criteria
   */
  filterReportsByLocation(reports, centerLat, centerLng, radius, emergencyMode) {
    return reports.filter(report => {
      // Geographic filter
      const distance = this.calculateDistance(
        centerLat, centerLng,
        report.location.lat, report.location.lng
      );
      
      if (distance > radius) return false;
      
      // Emergency mode filter
      if (emergencyMode) {
        return report.urgentLevel === 'critical' || report.urgentLevel === 'high';
      }
      
      // Age filter (last 7 days)
      const reportAge = (Date.now() - new Date(report.timestamp)) / (1000 * 60 * 60 * 24);
      return reportAge <= 7;
    });
  }

  /**
   * Simple clustering for small datasets (<100 reports)
   */
  simpleClustering(reports, clusterRadius) {
    if (reports.length === 0) return [];
    
    const clusters = [];
    const processed = new Set();
    
    reports.forEach((report, index) => {
      if (processed.has(index)) return;
      
      const nearbyReports = this.findNearbyReports(reports, report, clusterRadius, processed);
      
      if (nearbyReports.length >= 2) {
        // Create cluster
        const cluster = this.createCluster([report, ...nearbyReports.map(nr => nr.report)]);
        clusters.push(cluster);
        
        // Mark as processed
        processed.add(index);
        nearbyReports.forEach(nr => processed.add(nr.index));
      } else {
        // Standalone report
        clusters.push(this.createStandaloneReport(report));
        processed.add(index);
      }
    });
    
    return clusters;
  }

  /**
   * Density-based clustering for medium datasets (100-1000 reports)
   */
  densityBasedClustering(reports, clusterRadius) {
    // DBSCAN-like algorithm optimized for geographic data
    const clusters = [];
    const processed = new Set();
    const CLUSTER_ID = 'CLUSTER';
    const NOISE_ID = 'NOISE';
    const labels = new Array(reports.length).fill(null);
    
    let clusterId = 0;
    
    reports.forEach((report, index) => {
      if (labels[index] !== null) return;
      
      const neighbors = this.findNeighbors(reports, index, clusterRadius);
      
      if (neighbors.length < 2) {
        labels[index] = NOISE_ID;
      } else {
        clusterId++;
        labels[index] = clusterId;
        
        const seedSet = [...neighbors];
        let i = 0;
        
        while (i < seedSet.length) {
          const neighborIndex = seedSet[i];
          
          if (labels[neighborIndex] === NOISE_ID) {
            labels[neighborIndex] = clusterId;
          }
          
          if (labels[neighborIndex] === null) {
            labels[neighborIndex] = clusterId;
            const newNeighbors = this.findNeighbors(reports, neighborIndex, clusterRadius);
            
            if (newNeighbors.length >= 2) {
              newNeighbors.forEach(nn => {
                if (!seedSet.includes(nn)) seedSet.push(nn);
              });
            }
          }
          
          i++;
        }
      }
    });
    
    // Group reports by cluster ID
    const clusterGroups = new Map();
    const noise = [];
    
    labels.forEach((label, index) => {
      if (label === NOISE_ID) {
        noise.push(reports[index]);
      } else if (typeof label === 'number') {
        if (!clusterGroups.has(label)) {
          clusterGroups.set(label, []);
        }
        clusterGroups.get(label).push(reports[index]);
      }
    });
    
    // Create cluster objects
    clusterGroups.forEach(clusterReports => {
      if (clusterReports.length > 1) {
        clusters.push(this.createCluster(clusterReports));
      }
    });
    
    // Add noise as standalone reports
    noise.forEach(report => {
      clusters.push(this.createStandaloneReport(report));
    });
    
    return clusters;
  }

  /**
   * Grid-based clustering for large datasets (1000+ reports)
   */
  gridBasedClustering(reports, gridSize) {
    const grid = new Map();
    
    // Assign reports to grid cells
    reports.forEach(report => {
      const cellKey = this.getGridCell(report.location.lat, report.location.lng, gridSize);
      
      if (!grid.has(cellKey)) {
        grid.set(cellKey, []);
      }
      grid.get(cellKey).push(report);
    });
    
    const clusters = [];
    
    // Process each grid cell
    grid.forEach(cellReports => {
      if (cellReports.length === 1) {
        clusters.push(this.createStandaloneReport(cellReports[0]));
      } else {
        clusters.push(this.createCluster(cellReports));
      }
    });
    
    return clusters;
  }

  /**
   * Create cluster object from multiple reports
   */
  createCluster(reports) {
    const urgencyWeights = { critical: 4, high: 3, normal: 2, low: 1 };
    
    // Calculate weighted center
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;
    
    reports.forEach(report => {
      const weight = urgencyWeights[report.urgentLevel] || 1;
      totalWeight += weight;
      weightedLat += report.location.lat * weight;
      weightedLng += report.location.lng * weight;
    });
    
    const centerLat = weightedLat / totalWeight;
    const centerLng = weightedLng / totalWeight;
    
    // Determine cluster properties
    const urgencyLevels = reports.map(r => r.urgentLevel);
    const highestUrgency = this.getHighestUrgency(urgencyLevels);
    
    const typeGroups = {};
    reports.forEach(report => {
      typeGroups[report.type] = (typeGroups[report.type] || 0) + 1;
    });
    
    return {
      id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'cluster',
      location: {
        lat: centerLat,
        lng: centerLng,
        region: reports[0].location.region
      },
      urgentLevel: highestUrgency,
      timestamp: reports.reduce((latest, report) => 
        new Date(report.timestamp) > new Date(latest) ? report.timestamp : latest
      , reports[0].timestamp),
      count: reports.length,
      reports: reports,
      typeGroups: typeGroups,
      summary: this.generateClusterSummary(reports, typeGroups)
    };
  }

  /**
   * Create standalone report object
   */
  createStandaloneReport(report) {
    return {
      id: `standalone_${report.id}`,
      type: 'standalone',
      report: report,
      location: report.location,
      urgentLevel: report.urgentLevel,
      timestamp: report.timestamp,
      count: 1
    };
  }

  /**
   * Sort clusters by priority (emergency-first)
   */
  sortClustersByPriority(clusters, emergencyMode) {
    const urgencyOrder = { critical: 4, high: 3, normal: 2, low: 1 };
    
    return clusters.sort((a, b) => {
      // In emergency mode, prioritize critical/high urgency more heavily
      const multiplier = emergencyMode ? 2 : 1;
      
      const aUrgency = (urgencyOrder[a.urgentLevel] || 0) * multiplier;
      const bUrgency = (urgencyOrder[b.urgentLevel] || 0) * multiplier;
      
      if (aUrgency !== bUrgency) return bUrgency - aUrgency;
      if (a.count !== b.count) return b.count - a.count;
      
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }

  // Helper methods
  findNearbyReports(reports, centerReport, radius, processed) {
    const nearby = [];
    
    reports.forEach((report, index) => {
      if (processed.has(index) || report.id === centerReport.id) return;
      
      const distance = this.calculateDistance(
        centerReport.location.lat, centerReport.location.lng,
        report.location.lat, report.location.lng
      );
      
      if (distance <= radius) {
        nearby.push({ report, index, distance });
      }
    });
    
    return nearby;
  }

  findNeighbors(reports, centerIndex, radius) {
    const neighbors = [];
    const centerReport = reports[centerIndex];
    
    reports.forEach((report, index) => {
      if (index === centerIndex) return;
      
      const distance = this.calculateDistance(
        centerReport.location.lat, centerReport.location.lng,
        report.location.lat, report.location.lng
      );
      
      if (distance <= radius) {
        neighbors.push(index);
      }
    });
    
    return neighbors;
  }

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

  getGridCell(lat, lng, gridSize) {
    const cellLat = Math.floor(lat / (gridSize / 111));
    const cellLng = Math.floor(lng / (gridSize / 111));
    return `${cellLat},${cellLng}`;
  }

  getHighestUrgency(urgencyLevels) {
    const priorities = { critical: 4, high: 3, normal: 2, low: 1 };
    return urgencyLevels.reduce((highest, current) => 
      priorities[current] > priorities[highest] ? current : highest
    );
  }

  generateClusterSummary(reports, typeGroups) {
    const types = Object.keys(typeGroups);
    if (types.length === 1) {
      return `${reports.length} ${types[0].replace('-', ' ')} reports`;
    } else if (types.length === 2) {
      return `${types[0].replace('-', ' ')} and ${types[1].replace('-', ' ')} reports`;
    } else {
      return `${types.length} different types of reports`;
    }
  }

  generateCacheKey(lat, lng, radius, options) {
    const optionsHash = Buffer.from(JSON.stringify(options)).toString('base64').slice(0, 8);
    return `cluster_${lat.toFixed(3)}_${lng.toFixed(3)}_${radius}_${optionsHash}`;
  }

  getAlgorithmName(reportCount) {
    if (reportCount > 1000) return 'grid-based';
    if (reportCount > 100) return 'density-based';
    return 'simple';
  }

  updateAvgClusteringTime(newTime) {
    const totalOps = this.metrics.clusteringOperations;
    this.metrics.avgClusteringTime = 
      ((this.metrics.avgClusteringTime * (totalOps - 1)) + newTime) / totalOps;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      cacheSize: this.clusterCache.keys().length,
      timestamp: Date.now()
    };
  }

  /**
   * Clear cache (for testing or manual refresh)
   */
  clearCache() {
    this.clusterCache.flushAll();
    console.log('🗑️ Clustering cache cleared');
  }
}

export default ClusteringService;