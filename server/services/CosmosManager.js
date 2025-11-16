/**
 * Cosmos DB Manager - Singleton service for optimized database operations
 * Integrates OptimizedCosmosService with application lifecycle
 */

import OptimizedCosmosService from './OptimizedCosmosService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env.local' });
dotenv.config({ path: '../.env.production' });
dotenv.config();

class CosmosManager {
  constructor() {
    this.cosmosService = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Initialize the Cosmos service (singleton pattern)
   */
  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initializeService();
    return this.initializationPromise;
  }

  async _initializeService() {
    try {
      console.log('🚀 Initializing Cosmos Manager...');
      
      // Get connection string from multiple possible sources
      const connectionString = process.env.COSMOS_PRIMARY_CONNECTION_STRING || 
                              process.env.APPSETTING_COSMOS_PRIMARY_CONNECTION_STRING ||  
                              process.env.AZURE_COSMOS_CONNECTION_STRING;

      if (!connectionString) {
        throw new Error('COSMOS_PRIMARY_CONNECTION_STRING is required. Please set up Cosmos DB connection string.');
      }

      // Clean connection string
      const cleanConnectionString = connectionString.trim().replace(/["'\r\n]/g, '');
      
      // Initialize optimized service
      this.cosmosService = new OptimizedCosmosService(cleanConnectionString, 'EcoQuestDB');
      
      const success = await this.cosmosService.initialize();
      
      if (success) {
        this.isInitialized = true;
        console.log('✅ Cosmos Manager initialized successfully');
        
        // Set up health monitoring
        this._setupHealthMonitoring();
        
        return true;
      } else {
        throw new Error('Failed to initialize OptimizedCosmosService');
      }
    } catch (error) {
      console.error('❌ Cosmos Manager initialization failed:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Get the initialized database service
   */
  getService() {
    if (!this.isInitialized || !this.cosmosService) {
      throw new Error('Cosmos service not initialized. Call initialize() first.');
    }
    return this.cosmosService;
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.isInitialized && this.cosmosService !== null;
  }

  /**
   * Health check for service monitoring
   */
  async healthCheck() {
    try {
      if (!this.isReady()) {
        return {
          status: 'unhealthy',
          error: 'Service not initialized',
          timestamp: new Date().toISOString()
        };
      }

      // Get service metrics
      const metrics = this.cosmosService.getMetrics();
      
      return {
        status: 'healthy',
        metrics,
        timestamp: new Date().toISOString(),
        initialized: this.isInitialized
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      console.log('🔄 Shutting down Cosmos Manager...');
      
      if (this.cosmosService && this.cosmosService.cache) {
        this.cosmosService.cache.close();
      }
      
      this.cosmosService = null;
      this.isInitialized = false;
      this.initializationPromise = null;
      
      console.log('✅ Cosmos Manager shut down successfully');
    } catch (error) {
      console.error('❌ Error during Cosmos Manager shutdown:', error);
    }
  }

  /**
   * Set up health monitoring and alerting
   */
  _setupHealthMonitoring() {
    // Monitor performance every 5 minutes
    setInterval(() => {
      if (this.isReady()) {
        const metrics = this.cosmosService.getMetrics();
        const cacheStats = metrics.cacheStats;
        
        // Log performance metrics
        console.log('📊 Cosmos Performance Metrics:', {
          cacheHitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100,
          cacheKeys: cacheStats.keys,
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
        });
        
        // Alert on low cache hit rate
        const hitRate = cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100;
        if (hitRate < 50 && (cacheStats.hits + cacheStats.misses) > 10) {
          console.warn('⚠️ Low cache hit rate detected:', hitRate.toFixed(2) + '%');
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('📈 Health monitoring setup completed');
  }

  /**
   * Emergency mode - prioritize critical operations
   */
  setEmergencyMode(enabled = true) {
    if (this.isReady()) {
      console.log(`🚨 Emergency mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
      
      if (this.cosmosService) {
        if (enabled) {
          // Reduce cache TTL for fresher data during emergencies
          this.cosmosService.cache.options.stdTTL = 60; // 1 minute
          console.log('⚡ Cache TTL reduced to 1 minute for emergency mode');
        } else {
          // Restore normal cache TTL
          this.cosmosService.cache.options.stdTTL = 300; // 5 minutes
          console.log('🔄 Cache TTL restored to 5 minutes');
        }
      }
    }
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations() {
    if (!this.isReady()) {
      return { error: 'Service not ready' };
    }

    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    const recommendations = [];
    
    const metrics = this.cosmosService.getMetrics();
    const cacheStats = metrics.cacheStats;
    const hitRate = cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100;
    
    if (hitRate < 70) {
      recommendations.push({
        type: 'cache',
        priority: 'high',
        message: `Low cache hit rate: ${hitRate.toFixed(1)}%. Consider increasing cache TTL or optimizing query patterns.`
      });
    }
    
    if (cacheStats.keys > 1000) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: `High cache key count: ${cacheStats.keys}. Consider implementing cache eviction policies.`
      });
    }
    
    if (memoryUsage > 400) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: `High memory usage: ${memoryUsage.toFixed(1)}MB. Consider reducing cache size or implementing memory optimization.`
      });
    }
    
    return {
      service: 'cosmos',
      hitRate,
      memoryUsage,
      cacheKeys: cacheStats.keys,
      recommendations,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
const cosmosManager = new CosmosManager();

export default cosmosManager;