/**
 * Unified Storage Manager
 * Combines local-first storage with optional cloud sync
 * Provides a single interface for all storage operations
 * Congressional App Challenge compliant with privacy controls
 */

import LocalStorageService, { STORAGE_KEYS } from './LocalStorageService';
import AzureCloudSyncService, { SYNC_STATUS } from './AzureCloudSyncService';

/**
 * Storage manager configuration
 */
const MANAGER_CONFIG = {
  AUTO_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
  AUTO_SYNC_TRIGGERS: ['save', 'critical'], // When to auto-sync
  BACKUP_RETENTION: 7, // Keep 7 days of backups
  OFFLINE_QUEUE_SIZE: 100 // Max offline operations to queue
};

/**
 * Operation queue for offline sync
 */
let offlineQueue = [];
let cleanupInterval = null;
let isInitialized = false;

/**
 * Initialize the storage manager
 */
export const initialize = async (options = {}) => {
  try {
    if (isInitialized) return { success: true, status: 'already-initialized' };
    
    // Initialize local storage
    const localHealth = LocalStorageService.healthCheck();
    if (!localHealth.healthy) {
      console.error('❌ Local storage health check failed');
      return { success: false, error: 'Local storage not healthy' };
    }
    
    // Clean up expired data
    LocalStorageService.cleanupExpired();
    
    // Initialize cloud sync if requested
    let cloudStatus = { success: false, error: 'Not requested' };
    if (options.enableCloudSync) {
      cloudStatus = await AzureCloudSyncService.initializeCloudSync(options.cloudOptions);
    }
    
    // Load offline queue
    loadOfflineQueue();
    
    // Setup periodic cleanup
    setupPeriodicCleanup();
    
    // Setup network handlers
    setupNetworkHandlers();
    
    isInitialized = true;
    
    console.log('🚀 Storage Manager initialized');
    return {
      success: true,
      localHealth,
      cloudStatus,
      offlineQueueSize: offlineQueue.length
    };
    
  } catch (error) {
    console.error('❌ Storage Manager initialization failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Save data with automatic sync if enabled
 */
export const save = async (key, data, options = {}) => {
  try {
    // Always save locally first (local-first approach)
    const localResult = LocalStorageService.setItem(key, data, options);
    if (!localResult.success) {
      return localResult;
    }
    
    console.log(`💾 Saved ${key} locally`);
    
    // Add to sync queue if cloud sync is enabled
    if (AzureCloudSyncService.isSyncEnabled() && shouldSync(key, options)) {
      if (navigator.onLine) {
        // Sync immediately if online
        try {
          await AzureCloudSyncService.syncKeys([key]);
          console.log(`☁️ Synced ${key} to cloud`);
        } catch (error) {
          console.warn(`⚠️ Cloud sync failed for ${key}, queuing for later:`, error);
          addToOfflineQueue('sync', { key, data, timestamp: Date.now() });
        }
      } else {
        // Queue for offline sync
        addToOfflineQueue('sync', { key, data, timestamp: Date.now() });
        console.log(`📴 Queued ${key} for offline sync`);
      }
    }
    
    return {
      success: true,
      savedLocally: true,
      syncedToCloud: AzureCloudSyncService.isSyncEnabled() && navigator.onLine,
      queuedForSync: !navigator.onLine && AzureCloudSyncService.isSyncEnabled()
    };
    
  } catch (error) {
    console.error(`❌ Failed to save ${key}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Load data with fallback to cloud if needed
 */
export const load = async (key, options = {}) => {
  try {
    // Try local storage first
    const localData = LocalStorageService.getItem(key, options);
    
    if (localData !== null) {
      console.log(`📱 Loaded ${key} from local storage`);
      return {
        success: true,
        data: localData,
        source: 'local'
      };
    }
    
    // If not found locally and cloud sync is enabled, try cloud
    if (AzureCloudSyncService.isSyncEnabled() && navigator.onLine && !options.localOnly) {
      try {
        console.log(`☁️ Attempting to load ${key} from cloud...`);
        
        // Download specific key from cloud
        const downloadResult = await AzureCloudSyncService.downloadFromCloud();
        if (downloadResult.success && downloadResult.downloaded > 0) {
          // Try loading again after cloud download
          const cloudData = LocalStorageService.getItem(key, options);
          if (cloudData !== null) {
            console.log(`☁️ Loaded ${key} from cloud`);
            return {
              success: true,
              data: cloudData,
              source: 'cloud'
            };
          }
        }
      } catch (error) {
        console.warn(`⚠️ Cloud load failed for ${key}:`, error);
      }
    }
    
    // Return default value if provided
    if (options.defaultValue !== undefined) {
      return {
        success: true,
        data: options.defaultValue,
        source: 'default'
      };
    }
    
    console.log(`❌ No data found for ${key}`);
    return {
      success: false,
      error: 'Data not found',
      source: 'none'
    };
    
  } catch (error) {
    console.error(`❌ Failed to load ${key}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove data from both local and cloud
 */
export const remove = async (key, options = {}) => {
  try {
    // Remove from local storage
    const localResult = LocalStorageService.removeItem(key);
    
    // Queue cloud removal if cloud sync is enabled
    if (AzureCloudSyncService.isSyncEnabled() && shouldSync(key, options)) {
      if (navigator.onLine) {
        try {
          // Note: This would need cloud implementation to handle deletions
          console.log(`☁️ Queued ${key} for cloud removal`);
          addToOfflineQueue('remove', { key, timestamp: Date.now() });
        } catch (error) {
          console.warn(`⚠️ Cloud removal failed for ${key}:`, error);
          addToOfflineQueue('remove', { key, timestamp: Date.now() });
        }
      } else {
        addToOfflineQueue('remove', { key, timestamp: Date.now() });
      }
    }
    
    return {
      success: localResult.success,
      removedLocally: localResult.success,
      queuedForCloudRemoval: AzureCloudSyncService.isSyncEnabled()
    };
    
  } catch (error) {
    console.error(`❌ Failed to remove ${key}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all keys with optional filtering
 */
export const getAllKeys = (prefix = '', includeNonSyncable = true) => {
  const allKeys = LocalStorageService.getAllKeys(prefix);
  
  if (includeNonSyncable) {
    return allKeys;
  }
  
  // Filter out non-syncable keys
  return allKeys.filter(key => 
    AzureCloudSyncService.SYNCABLE_KEYS.some(syncableKey => 
      key.startsWith(syncableKey)
    )
  );
};

/**
 * Get comprehensive storage statistics
 */
export const getStorageStats = () => {
  const localStats = LocalStorageService.getStorageStats();
  const syncStatus = AzureCloudSyncService.getSyncStatus();
  
  return {
    local: localStats,
    cloud: {
      enabled: AzureCloudSyncService.isSyncEnabled(),
      status: syncStatus.status,
      lastSync: syncStatus.lastSync,
      syncableItems: getAllKeys('', false).length,
      totalItems: getAllKeys('', true).length
    },
    offline: {
      queueSize: offlineQueue.length,
      isOnline: navigator.onLine
    },
    manager: {
      initialized: isInitialized,
      autoCleanupEnabled: cleanupInterval !== null
    }
  };
};

/**
 * Enable cloud sync with user consent
 */
export const enableCloudSync = async (userConsent = false, options = {}) => {
  try {
    const result = await AzureCloudSyncService.enableSync(userConsent);
    
    if (result.success) {
      // Process offline queue
      await processOfflineQueue();
      
      console.log('☁️ Cloud sync enabled and offline queue processed');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Failed to enable cloud sync:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Disable cloud sync
 */
export const disableCloudSync = async (clearCloudData = false) => {
  try {
    const result = await AzureCloudSyncService.disableSync(clearCloudData);
    
    if (result.success) {
      // Clear offline queue
      clearOfflineQueue();
      console.log('🚫 Cloud sync disabled and offline queue cleared');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Failed to disable cloud sync:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Perform manual sync
 */
export const sync = async () => {
  if (!AzureCloudSyncService.isSyncEnabled()) {
    return { success: false, error: 'Cloud sync not enabled' };
  }
  
  try {
    console.log('🔄 Starting manual sync...');
    
    // Perform full sync
    const syncResult = await AzureCloudSyncService.performFullSync();
    
    if (syncResult.success) {
      // Process offline queue
      await processOfflineQueue();
    }
    
    return {
      ...syncResult,
      offlineQueueProcessed: true
    };
    
  } catch (error) {
    console.error('❌ Manual sync failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export all data for backup
 */
export const exportAllData = () => {
  try {
    const localExport = LocalStorageService.exportData();
    const stats = getStorageStats();
    
    if (!localExport.success) {
      return localExport;
    }
    
    const exportData = {
      ...localExport.data,
      metadata: {
        ...localExport.data.metadata,
        storageStats: stats,
        offlineQueue: offlineQueue,
        exportedAt: new Date().toISOString()
      }
    };
    
    console.log('📦 Exported all storage data');
    return { success: true, data: exportData };
    
  } catch (error) {
    console.error('❌ Failed to export data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Import data from backup
 */
export const importAllData = async (importData, options = { merge: true, enableSync: false }) => {
  try {
    // Import to local storage
    const localResult = LocalStorageService.importData(importData, options);
    
    if (!localResult.success) {
      return localResult;
    }
    
    // Optionally sync to cloud
    if (options.enableSync && AzureCloudSyncService.isSyncEnabled()) {
      try {
        await AzureCloudSyncService.uploadToCloud();
        console.log('☁️ Imported data synced to cloud');
      } catch (error) {
        console.warn('⚠️ Failed to sync imported data to cloud:', error);
      }
    }
    
    return {
      ...localResult,
      syncedToCloud: options.enableSync && AzureCloudSyncService.isSyncEnabled()
    };
    
  } catch (error) {
    console.error('❌ Failed to import data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear all data with confirmation
 */
export const clearAllData = async (confirmation = null, clearCloud = false) => {
  try {
    // Clear local data
    const localResult = LocalStorageService.clearAll(confirmation);
    
    if (!localResult.success) {
      return localResult;
    }
    
    // Clear cloud data if requested
    let cloudResult = { success: true, cleared: false };
    if (clearCloud && AzureCloudSyncService.isSyncEnabled()) {
      cloudResult = await AzureCloudSyncService.clearAllCloudData();
      cloudResult.cleared = true;
    }
    
    // Clear offline queue
    clearOfflineQueue();
    
    console.log('🧹 Cleared all storage data');
    return {
      success: true,
      clearedLocal: localResult.success,
      clearedCloud: cloudResult.success && clearCloud,
      clearedQueue: true
    };
    
  } catch (error) {
    console.error('❌ Failed to clear all data:', error);
    return { success: false, error: error.message };
  }
};

// Helper functions

/**
 * Check if a key should be synced
 */
const shouldSync = (key, options = {}) => {
  if (options.skipSync) return false;
  if (AzureCloudSyncService.NON_SYNCABLE_KEYS.includes(key)) return false;
  
  // Check for exact key match or prefix match (for dynamic keys like group codes)
  const isSyncable = AzureCloudSyncService.SYNCABLE_KEYS.includes(key) || 
    AzureCloudSyncService.SYNCABLE_KEYS.some(syncableKey => key.startsWith(syncableKey));
    
  return isSyncable || options.forceSync;
};

/**
 * Add operation to offline queue
 */
const addToOfflineQueue = (operation, data) => {
  offlineQueue.push({
    operation,
    data,
    queuedAt: Date.now()
  });
  
  // Limit queue size
  if (offlineQueue.length > MANAGER_CONFIG.OFFLINE_QUEUE_SIZE) {
    offlineQueue = offlineQueue.slice(-MANAGER_CONFIG.OFFLINE_QUEUE_SIZE);
  }
  
  // Save queue to storage
  saveOfflineQueue();
};

/**
 * Save offline queue to storage
 */
const saveOfflineQueue = () => {
  LocalStorageService.setItem(STORAGE_KEYS.SYNC_QUEUE, offlineQueue);
};

/**
 * Load offline queue from storage
 */
const loadOfflineQueue = () => {
  const stored = LocalStorageService.getItem(STORAGE_KEYS.SYNC_QUEUE, { defaultValue: [] });
  offlineQueue = Array.isArray(stored) ? stored : [];
  console.log(`📥 Loaded ${offlineQueue.length} items from offline queue`);
};

/**
 * Clear offline queue
 */
const clearOfflineQueue = () => {
  offlineQueue = [];
  LocalStorageService.removeItem(STORAGE_KEYS.SYNC_QUEUE);
  console.log('🗑️ Cleared offline queue');
};

/**
 * Process offline queue
 */
const processOfflineQueue = async () => {
  if (!AzureCloudSyncService.isSyncEnabled() || !navigator.onLine || offlineQueue.length === 0) {
    return { success: true, processed: 0 };
  }
  
  try {
    console.log(`⚡ Processing ${offlineQueue.length} offline operations...`);
    
    let processedCount = 0;
    const errors = [];
    
    // Process each queued operation
    for (const queueItem of offlineQueue) {
      try {
        if (queueItem.operation === 'sync') {
          await AzureCloudSyncService.syncKeys([queueItem.data.key]);
          processedCount++;
        } else if (queueItem.operation === 'remove') {
          // Handle removal - would need cloud implementation
          processedCount++;
        }
      } catch (error) {
        errors.push({ item: queueItem, error: error.message });
      }
    }
    
    // Clear successfully processed items
    offlineQueue = offlineQueue.filter((_, index) => 
      errors.some(err => err.item === offlineQueue[index])
    );
    saveOfflineQueue();
    
    console.log(`✅ Processed ${processedCount} offline operations, ${errors.length} failed`);
    return {
      success: true,
      processed: processedCount,
      failed: errors.length,
      errors
    };
    
  } catch (error) {
    console.error('❌ Failed to process offline queue:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Setup periodic cleanup
 */
const setupPeriodicCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(() => {
    console.log('🧹 Running periodic cleanup...');
    LocalStorageService.cleanupExpired();
    
    // Clean old offline queue items (older than 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const initialLength = offlineQueue.length;
    offlineQueue = offlineQueue.filter(item => item.queuedAt > sevenDaysAgo);
    
    if (offlineQueue.length !== initialLength) {
      saveOfflineQueue();
      console.log(`🗑️ Cleaned ${initialLength - offlineQueue.length} old queue items`);
    }
  }, MANAGER_CONFIG.AUTO_CLEANUP_INTERVAL);
  
  console.log('⏰ Periodic cleanup scheduled');
};

/**
 * Setup network change handlers
 */
const setupNetworkHandlers = () => {
  if (typeof window === 'undefined') return;
  
  const handleOnline = () => {
    console.log('🌐 Network restored, processing offline queue...');
    if (AzureCloudSyncService.isSyncEnabled()) {
      processOfflineQueue();
    }
  };
  
  const handleOffline = () => {
    console.log('📴 Network lost, queuing operations for offline sync');
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
};

console.log('🔧 Storage Manager ready');

export default {
  initialize,
  save,
  load,
  remove,
  getAllKeys,
  getStorageStats,
  enableCloudSync,
  disableCloudSync,
  sync,
  exportAllData,
  importAllData,
  clearAllData,
  STORAGE_KEYS
};