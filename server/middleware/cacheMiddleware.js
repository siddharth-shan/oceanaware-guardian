/**
 * Cache Middleware for Express Routes
 * Smart caching with emergency mode support and automatic invalidation
 */

import CacheManager from '../services/CacheManager.js';

// Global cache manager instance
const cacheManager = new CacheManager();

/**
 * Create cache middleware for specific route patterns
 */
export const createCacheMiddleware = (options = {}) => {
  const {
    keyGenerator = defaultKeyGenerator,
    ttl = null,
    tier = 'auto',
    emergencyAware = true,
    skipCache = () => false,
    tags = []
  } = options;

  return (req, res, next) => {
    // Skip cache if condition is met
    if (skipCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const emergencyMode = req.query.emergencyMode === 'true' || req.headers['x-emergency-mode'] === 'true';
    
    // Set emergency mode if detected
    if (emergencyMode && emergencyAware) {
      cacheManager.setEmergencyMode(true);
    }

    // Try to get from cache
    const cached = cacheManager.get(cacheKey, {
      tier,
      emergencyPriority: emergencyMode
    });

    if (cached) {
      console.log(`📋 Cache hit: ${cacheKey}`);
      
      // Add cache headers
      res.set({
        'X-Cache': 'HIT',
        'X-Cache-Key': cacheKey,
        'X-Cache-Tier': cached.tier || 'unknown',
        'X-Emergency-Mode': emergencyMode.toString()
      });

      return res.json({
        ...cached,
        cached: true,
        cacheKey,
        timestamp: new Date().toISOString()
      });
    }

    // Cache miss - intercept response
    console.log(`📋 Cache miss: ${cacheKey}`);
    
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200 && data && data.success !== false) {
        cacheManager.set(cacheKey, data, {
          tier,
          ttl,
          emergencyPriority: emergencyMode,
          tags
        });
      }

      // Add cache headers
      res.set({
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey,
        'X-Emergency-Mode': emergencyMode.toString()
      });

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Cache invalidation middleware
 */
export const createInvalidationMiddleware = (options = {}) => {
  const {
    patterns = [],
    location = true,
    emergency = false
  } = options;

  return (req, res, next) => {
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Wrap response methods to trigger invalidation after successful operations
    const wrapResponse = (method) => {
      return function(data) {
        // Only invalidate on successful operations
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Invalidate by patterns
          patterns.forEach(pattern => {
            cacheManager.invalidateByPattern(pattern, {
              reason: `${req.method} ${req.path}`
            });
          });

          // Location-based invalidation
          if (location && (req.body?.location || req.query?.lat)) {
            const lat = req.body?.location?.lat || parseFloat(req.query.lat);
            const lng = req.body?.location?.lng || parseFloat(req.query.lng);
            
            if (lat && lng) {
              cacheManager.invalidateByLocation(lat, lng);
            }
          }

          // Emergency invalidation
          if (emergency) {
            cacheManager.invalidateEmergencyData();
          }
        }

        return method.call(this, data);
      };
    };

    res.json = wrapResponse(originalJson);
    res.send = wrapResponse(originalSend);

    next();
  };
};

/**
 * Emergency mode middleware
 */
export const emergencyModeMiddleware = (req, res, next) => {
  const emergencyMode = req.query.emergencyMode === 'true' || 
                       req.headers['x-emergency-mode'] === 'true' ||
                       req.body?.emergencyMode === true;

  if (emergencyMode) {
    cacheManager.setEmergencyMode(true);
    req.emergencyMode = true;
  }

  next();
};

/**
 * Cache metrics middleware
 */
export const cacheMetricsMiddleware = (req, res, next) => {
  if (req.path.includes('/metrics') || req.path.includes('/health')) {
    const metrics = cacheManager.getMetrics();
    const health = cacheManager.healthCheck();
    
    req.cacheMetrics = metrics;
    req.cacheHealth = health;
  }
  
  next();
};

/**
 * Memory pressure monitoring middleware
 */
export const memoryMonitoringMiddleware = (req, res, next) => {
  // Check memory pressure before processing request
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
  
  if (heapUsedMB > 200) { // 200MB threshold
    console.log(`⚠️ High memory usage detected: ${heapUsedMB.toFixed(1)}MB`);
    cacheManager.manageMemoryPressure();
  }
  
  next();
};

// Default key generator
function defaultKeyGenerator(req) {
  const { path, query, method } = req;
  const queryString = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');
  
  return `${method}_${path}_${queryString}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

// Route-specific cache configurations
export const cacheConfigs = {
  // Community reports - warm cache, location-aware
  communityReports: createCacheMiddleware({
    keyGenerator: (req) => {
      const { lat, lng, types, urgentLevels, maxAge } = req.query;
      return `reports_${lat}_${lng}_${types || 'all'}_${urgentLevels || 'all'}_${maxAge || 7}`;
    },
    tier: 'warm',
    ttl: 300, // 5 minutes
    emergencyAware: true,
    tags: ['reports', 'location']
  }),

  // Clustered reports - hot cache for performance
  clusteredReports: createCacheMiddleware({
    keyGenerator: (req) => {
      const { lat, lng, radius, clusterRadius, emergencyMode } = req.query;
      return `clusters_${lat}_${lng}_${radius}_${clusterRadius}_${emergencyMode}`;
    },
    tier: 'hot',
    ttl: 180, // 3 minutes
    emergencyAware: true,
    tags: ['clusters', 'location']
  }),

  // Community status - cold cache, less frequent updates
  communityStatus: createCacheMiddleware({
    keyGenerator: (req) => {
      const { lat, lng, radius } = req.query;
      return `status_${lat}_${lng}_${radius}`;
    },
    tier: 'cold',
    ttl: 600, // 10 minutes
    emergencyAware: true,
    tags: ['status', 'location']
  }),

  // Health/metrics - no cache for real-time data
  skipCache: createCacheMiddleware({
    skipCache: () => true
  })
};

// Invalidation configurations
export const invalidationConfigs = {
  // Report submission invalidates reports and clusters
  reportSubmission: createInvalidationMiddleware({
    patterns: [/^reports_/, /^clusters_/],
    location: true,
    emergency: false
  }),

  // Emergency mode activation invalidates everything hot
  emergencyMode: createInvalidationMiddleware({
    patterns: [/^reports_/, /^clusters_/, /^status_/],
    location: false,
    emergency: true
  }),

  // Status updates invalidate status cache
  statusUpdate: createInvalidationMiddleware({
    patterns: [/^status_/],
    location: true,
    emergency: false
  })
};

// Export cache manager instance for direct access
export { cacheManager };

export default {
  createCacheMiddleware,
  createInvalidationMiddleware,
  emergencyModeMiddleware,
  cacheMetricsMiddleware,
  memoryMonitoringMiddleware,
  cacheConfigs,
  invalidationConfigs,
  cacheManager
};