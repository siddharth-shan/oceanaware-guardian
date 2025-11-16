/**
 * Enhanced Cache Manager with Smart Invalidation
 * Multi-tier caching system optimized for emergency scenarios
 */

import NodeCache from 'node-cache';

class CacheManager {
  constructor() {
    // Multi-tier cache system
    this.caches = {
      // L1: Hot data cache (30 seconds, emergency-optimized)
      hot: new NodeCache({ 
        stdTTL: 30,
        checkperiod: 10,
        useClones: false,
        maxKeys: 1000
      }),
      
      // L2: Warm data cache (5 minutes, general data)
      warm: new NodeCache({ 
        stdTTL: 300,
        checkperiod: 60,
        useClones: false,
        maxKeys: 5000
      }),
      
      // L3: Cold data cache (30 minutes, historical data)
      cold: new NodeCache({ 
        stdTTL: 1800,
        checkperiod: 300,
        useClones: false,
        maxKeys: 10000
      })
    };
    
    // Cache configuration
    this.config = {
      emergencyMode: false,
      emergencyTTL: 15, // 15 seconds in emergency mode
      normalTTL: 300,   // 5 minutes in normal mode
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB limit
    };
    
    // Performance metrics
    this.metrics = {
      hits: { hot: 0, warm: 0, cold: 0 },
      misses: { hot: 0, warm: 0, cold: 0 },
      invalidations: 0,
      emergencyInvalidations: 0,
      memoryUsage: 0,
      operations: 0
    };
    
    // Cache key patterns for smart invalidation
    this.patterns = {
      reports: /^reports_/,
      clusters: /^cluster_/,
      status: /^status_/,
      metrics: /^metrics_/,
      emergency: /^emergency_/
    };
    
    // Start monitoring
    this.startMonitoring();
    
    console.log('🚀 Enhanced Cache Manager initialized');
  }

  /**
   * Set emergency mode (affects TTL and invalidation strategy)
   */
  setEmergencyMode(enabled) {
    const wasEmergency = this.config.emergencyMode;
    this.config.emergencyMode = enabled;
    
    if (enabled !== wasEmergency) {
      console.log(`🚨 Cache emergency mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
      
      if (enabled) {
        // Clear non-critical caches and reduce TTL
        this.invalidateByPattern(this.patterns.status);
        this.invalidateByPattern(this.patterns.metrics);
        this.metrics.emergencyInvalidations++;
      }
    }
  }

  /**
   * Smart cache get with tier fallback
   */
  get(key, options = {}) {
    const { tier = 'auto', emergencyPriority = false } = options;
    this.metrics.operations++;
    
    // Emergency priority: check hot cache first
    if (emergencyPriority || this.config.emergencyMode) {
      const hotValue = this.caches.hot.get(key);
      if (hotValue !== undefined) {
        this.metrics.hits.hot++;
        return hotValue;
      }
    }
    
    // Auto-tier selection
    if (tier === 'auto') {
      // Try each tier in order
      for (const tierName of ['hot', 'warm', 'cold']) {
        const value = this.caches[tierName].get(key);
        if (value !== undefined) {
          this.metrics.hits[tierName]++;
          
          // Promote to hot cache if frequently accessed
          if (tierName !== 'hot' && this.shouldPromote(key, tierName)) {
            this.caches.hot.set(key, value, this.getEmergencyTTL());
          }
          
          return value;
        }
      }
      
      // Cache miss
      this.metrics.misses.hot++;
      return undefined;
    }
    
    // Specific tier request
    const value = this.caches[tier].get(key);
    if (value !== undefined) {
      this.metrics.hits[tier]++;
    } else {
      this.metrics.misses[tier]++;
    }
    
    return value;
  }

  /**
   * Smart cache set with tier selection
   */
  set(key, value, options = {}) {
    const { 
      tier = 'auto', 
      ttl = null, 
      emergencyPriority = false,
      tags = [] 
    } = options;
    
    this.metrics.operations++;
    
    // Calculate TTL
    const cacheTTL = ttl || (this.config.emergencyMode ? this.config.emergencyTTL : this.config.normalTTL);
    
    // Auto-tier selection based on data characteristics
    let targetTier = tier;
    if (tier === 'auto') {
      targetTier = this.selectOptimalTier(key, value, { emergencyPriority, tags });
    }
    
    // Set in target tier
    this.caches[targetTier].set(key, value, cacheTTL);
    
    // Emergency data also goes to hot cache
    if (emergencyPriority && targetTier !== 'hot') {
      this.caches.hot.set(key, value, this.getEmergencyTTL());
    }
    
    // Update memory usage estimate
    this.updateMemoryUsage();
    
    console.log(`📋 Cached ${key} in ${targetTier} tier (TTL: ${cacheTTL}s)`);
    return true;
  }

  /**
   * Delete from all tiers
   */
  del(key) {
    this.metrics.operations++;
    this.metrics.invalidations++;
    
    let deleted = false;
    Object.keys(this.caches).forEach(tier => {
      if (this.caches[tier].del(key)) {
        deleted = true;
      }
    });
    
    return deleted;
  }

  /**
   * Smart invalidation by pattern
   */
  invalidateByPattern(pattern, options = {}) {
    const { tier = 'all', reason = 'manual' } = options;
    
    let invalidatedCount = 0;
    const tiersToCheck = tier === 'all' ? Object.keys(this.caches) : [tier];
    
    tiersToCheck.forEach(tierName => {
      const keys = this.caches[tierName].keys();
      keys.forEach(key => {
        if (pattern.test(key)) {
          this.caches[tierName].del(key);
          invalidatedCount++;
        }
      });
    });
    
    this.metrics.invalidations += invalidatedCount;
    console.log(`🗑️ Invalidated ${invalidatedCount} keys matching pattern ${pattern} (reason: ${reason})`);
    
    return invalidatedCount;
  }

  /**
   * Geographic invalidation for location-based data
   */
  invalidateByLocation(lat, lng, radius = 10) {
    const pattern = new RegExp(`_(${lat.toFixed(1)}|${(lat + 0.1).toFixed(1)}|${(lat - 0.1).toFixed(1)}).*_(${lng.toFixed(1)}|${(lng + 0.1).toFixed(1)}|${(lng - 0.1).toFixed(1)})`);
    
    return this.invalidateByPattern(pattern, { 
      reason: `location change (${lat}, ${lng}, ${radius}km)` 
    });
  }

  /**
   * Emergency-specific invalidation
   */
  invalidateEmergencyData() {
    const patterns = [
      this.patterns.reports,
      this.patterns.clusters,
      this.patterns.status
    ];
    
    let totalInvalidated = 0;
    patterns.forEach(pattern => {
      totalInvalidated += this.invalidateByPattern(pattern, { 
        tier: 'hot',
        reason: 'emergency mode activated' 
      });
    });
    
    this.metrics.emergencyInvalidations++;
    console.log(`🚨 Emergency invalidation: ${totalInvalidated} keys cleared`);
    
    return totalInvalidated;
  }

  /**
   * Preload critical data for emergency scenarios
   */
  async preloadEmergencyData(location, emergencyLevel) {
    console.log(`🔄 Preloading emergency data for ${location.region} (level: ${emergencyLevel})`);
    
    const preloadKeys = [
      `reports_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}_emergency`,
      `clusters_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}_emergency`,
      `status_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}_emergency`
    ];
    
    // These would typically be loaded from the database
    // For now, we mark these as preloaded
    preloadKeys.forEach(key => {
      this.set(key, { preloaded: true, timestamp: Date.now() }, {
        tier: 'hot',
        emergencyPriority: true,
        ttl: this.getEmergencyTTL()
      });
    });
    
    return preloadKeys.length;
  }

  /**
   * Memory pressure management
   */
  manageMemoryPressure() {
    const memoryUsage = this.getMemoryUsage();
    
    if (memoryUsage > this.config.maxMemoryUsage) {
      console.log(`⚠️ Memory pressure detected: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
      
      // Start with cold cache
      let clearedKeys = this.caches.cold.keys().length;
      this.caches.cold.flushAll();
      
      // If still over limit, clear warm cache non-emergency items
      if (this.getMemoryUsage() > this.config.maxMemoryUsage * 0.8) {
        const warmKeys = this.caches.warm.keys();
        warmKeys.forEach(key => {
          if (!key.includes('emergency') && !key.includes('critical')) {
            this.caches.warm.del(key);
            clearedKeys++;
          }
        });
      }
      
      console.log(`🧹 Cleared ${clearedKeys} cache entries due to memory pressure`);
      this.updateMemoryUsage();
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  getMetrics() {
    const totalHits = Object.values(this.metrics.hits).reduce((a, b) => a + b, 0);
    const totalMisses = Object.values(this.metrics.misses).reduce((a, b) => a + b, 0);
    const hitRate = totalHits / (totalHits + totalMisses) || 0;
    
    return {
      hitRate: Math.round(hitRate * 100) / 100,
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      operations: this.metrics.operations,
      invalidations: this.metrics.invalidations,
      emergencyInvalidations: this.metrics.emergencyInvalidations,
      memoryUsage: this.getMemoryUsage(),
      cacheKeys: {
        hot: this.caches.hot.keys().length,
        warm: this.caches.warm.keys().length,
        cold: this.caches.cold.keys().length
      },
      emergencyMode: this.config.emergencyMode,
      timestamp: Date.now()
    };
  }

  /**
   * Health check for cache system
   */
  healthCheck() {
    const metrics = this.getMetrics();
    const memoryUsageMB = metrics.memoryUsage / 1024 / 1024;
    
    const health = {
      status: 'healthy',
      issues: []
    };
    
    // Check hit rate
    if (metrics.hitRate < 0.3) {
      health.issues.push(`Low hit rate: ${(metrics.hitRate * 100).toFixed(1)}%`);
    }
    
    // Check memory usage
    if (memoryUsageMB > 80) {
      health.issues.push(`High memory usage: ${memoryUsageMB.toFixed(1)}MB`);
    }
    
    // Check if emergency mode is stuck
    if (this.config.emergencyMode && this.metrics.emergencyInvalidations > 10) {
      health.issues.push('Excessive emergency invalidations detected');
    }
    
    if (health.issues.length > 0) {
      health.status = 'degraded';
    }
    
    return {
      ...health,
      metrics
    };
  }

  // Helper methods
  selectOptimalTier(key, value, options) {
    const { emergencyPriority, tags } = options;
    
    // Emergency data goes to hot cache
    if (emergencyPriority || this.config.emergencyMode) {
      return 'hot';
    }
    
    // Recent reports and clusters go to warm cache
    if (key.includes('reports_') || key.includes('cluster_')) {
      return 'warm';
    }
    
    // Metrics and status go to cold cache
    if (key.includes('metrics_') || key.includes('status_')) {
      return 'cold';
    }
    
    return 'warm'; // Default
  }

  shouldPromote(key, fromTier) {
    // Simple promotion logic - could be enhanced with access frequency tracking
    return fromTier === 'cold' && (key.includes('emergency') || key.includes('critical'));
  }

  getEmergencyTTL() {
    return this.config.emergencyMode ? this.config.emergencyTTL : this.config.normalTTL;
  }

  getMemoryUsage() {
    // Rough estimate of memory usage
    let totalKeys = 0;
    Object.keys(this.caches).forEach(tier => {
      totalKeys += this.caches[tier].keys().length;
    });
    
    // Estimate ~1KB per key on average
    return totalKeys * 1024;
  }

  updateMemoryUsage() {
    this.metrics.memoryUsage = this.getMemoryUsage();
  }

  startMonitoring() {
    // Periodic cleanup and health monitoring
    setInterval(() => {
      this.manageMemoryPressure();
      
      // Log health status in development
      if (process.env.NODE_ENV === 'development') {
        const health = this.healthCheck();
        if (health.status !== 'healthy') {
          console.log(`⚠️ Cache health: ${health.status} - ${health.issues.join(', ')}`);
        }
      }
    }, 30000); // Every 30 seconds
    
    // Emergency mode timeout (auto-disable after 1 hour)
    setInterval(() => {
      if (this.config.emergencyMode) {
        console.log('🔄 Auto-disabling emergency mode after timeout');
        this.setEmergencyMode(false);
      }
    }, 3600000); // 1 hour
  }

  /**
   * Flush all caches
   */
  flushAll() {
    Object.keys(this.caches).forEach(tier => {
      this.caches[tier].flushAll();
    });
    
    // Reset metrics
    this.metrics = {
      hits: { hot: 0, warm: 0, cold: 0 },
      misses: { hot: 0, warm: 0, cold: 0 },
      invalidations: 0,
      emergencyInvalidations: 0,
      memoryUsage: 0,
      operations: 0
    };
    
    console.log('🗑️ All caches flushed');
  }
}

export default CacheManager;