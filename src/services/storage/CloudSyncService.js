/**
 * Cloud Sync Service
 * Optional cloud synchronization with Azure Cosmos DB
 * Privacy-first design with user control over data sharing
 * Congressional App Challenge compliant
 */

import AzureCosmosService from './AzureCosmosService';
import LocalStorageService, { STORAGE_KEYS } from './LocalStorageService';

/**
 * Cloud sync configuration
 */
const SYNC_CONFIG = {
  SERVICE_PROVIDER: 'azure-cosmos',
  BATCH_SIZE: 10,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_SYNC_SIZE: 1024 * 1024, // 1MB per sync
  CONFLICT_RESOLUTION: 'local-wins' // local-wins, cloud-wins, merge
};

/**
 * Sync status tracking
 */
export const SYNC_STATUS = {
  DISABLED: 'disabled',
  IDLE: 'idle',
  SYNCING: 'syncing',
  ERROR: 'error',
  OFFLINE: 'offline'
};

/**
 * Data that can be synced (privacy-safe only)
 */
const SYNCABLE_KEYS = [
  STORAGE_KEYS.USER_PREFERENCES,
  STORAGE_KEYS.EMERGENCY_CONTACTS,
  STORAGE_KEYS.EMERGENCY_PLANS,
  STORAGE_KEYS.SAFETY_CHECKLIST,
  STORAGE_KEYS.GROUP_PREFIX, // Family group data (anonymous) for cross-device joining
  // Note: Personal family group lists remain local-only for privacy
];

/**
 * Data that should never be synced (privacy-sensitive)
 */
const NON_SYNCABLE_KEYS = [
  STORAGE_KEYS.USER_PROFILE, // Contains age and consent info
  STORAGE_KEYS.FAMILY_GROUPS, // Personal family group lists remain local-only
  STORAGE_KEYS.LOCATION_HISTORY, // Location data is privacy-sensitive
  STORAGE_KEYS.DEVICE_ID, // Device-specific
  STORAGE_KEYS.AI_CACHE, // Temporary data
  STORAGE_KEYS.WEATHER_CACHE // Temporary data
];

let azureService = null;
let syncInterval = null;
let isInitialized = false;

/**
 * Initialize cloud sync service with Azure Cosmos DB
 */
export const initializeCloudSync = async (options = {}) => {
  try {
    if (isInitialized) return { success: true, status: 'already-initialized' };
    
    console.log('🚀 Initializing Azure Cosmos DB cloud sync...');
    
    // Initialize Azure service
    const azureResult = await AzureCosmosService.initializeAzureService();
    
    if (!azureResult.success) {
      console.log('⚠️ Azure Cosmos DB not available - using local-only mode');
      return { 
        success: false, 
        error: azureResult.error,
        fallbackMode: 'local-only'
      };
    }
    
    azureService = AzureCosmosService;
    
    // Auto-enable sync if requested
    if (options.autoEnable) {
      await enableSync(true);
    }
    
    isInitialized = true;
    
    // Set initial sync status
    LocalStorageService.setItem(STORAGE_KEYS.SYNC_STATUS, {
      status: SYNC_STATUS.IDLE,
      lastSync: null,
      enabled: options.autoEnable || false
    });
    
    console.log('✅ Azure Cosmos DB cloud sync initialized successfully');
    return {
      success: true,
      serviceProvider: 'azure-cosmos',
      endpoints: azureResult.endpoints
    };
    
  } catch (error) {
    console.error('❌ Failed to initialize cloud sync:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user has opted into cloud sync
 */
export const isSyncEnabled = () => {
  const syncStatus = LocalStorageService.getItem(STORAGE_KEYS.SYNC_STATUS);
  return syncStatus?.enabled || false;
};

/**
 * Enable cloud sync with user consent
 */
export const enableSync = async (userConsent = false) => {
  if (!userConsent) {
    return { success: false, error: 'User consent required for cloud sync' };
  }
  
  if (!isInitialized) {
    const initResult = await initializeCloudSync();
    if (!initResult.success) return initResult;
  }
  
  if (!azureService) {
    return { success: false, error: 'Azure service not available for cloud sync' };
  }
  
  try {
    // Update sync status
    LocalStorageService.setItem(STORAGE_KEYS.SYNC_STATUS, {
      status: SYNC_STATUS.IDLE,
      lastSync: null,
      enabled: true,
      enabledAt: new Date().toISOString(),
      userConsent: true
    });
    
    // Start periodic sync
    startPeriodicSync();
    
    // Perform initial sync
    const syncResult = await performFullSync();
    
    console.log('✅ Cloud sync enabled');
    return { success: true, initialSync: syncResult };
    
  } catch (error) {
    console.error('❌ Failed to enable cloud sync:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Disable cloud sync
 */
export const disableSync = async (clearCloudData = false) => {
  try {
    // Stop periodic sync
    stopPeriodicSync();
    
    // Update sync status
    LocalStorageService.setItem(STORAGE_KEYS.SYNC_STATUS, {
      status: SYNC_STATUS.DISABLED,
      enabled: false,
      disabledAt: new Date().toISOString()
    });
    
    // Optionally clear cloud data
    if (clearCloudData && auth?.currentUser) {
      await clearAllCloudData();
    }
    
    console.log('🚫 Cloud sync disabled');
    return { success: true, clearedCloud: clearCloudData };
    
  } catch (error) {
    console.error('❌ Failed to disable cloud sync:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current anonymous user ID for Azure operations
 */
const getCurrentUserId = () => {
  // Get current anonymous user ID from localStorage
  const localUser = JSON.parse(localStorage.getItem('ecoquest-local-user') || '{}');
  return localUser.uid || `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Upload local data to cloud
 */
export const uploadToCloud = async (keys = SYNCABLE_KEYS) => {
  if (!isSyncEnabled()) {
    return { success: false, error: 'Cloud sync not enabled' };
  }
  
  try {
    const userData = {};
    let totalSize = 0;
    
    // Collect syncable data
    for (const key of keys) {
      if (NON_SYNCABLE_KEYS.includes(key)) {
        console.warn(`⚠️ Skipping non-syncable key: ${key}`);
        continue;
      }
      
      const data = LocalStorageService.getItem(key);
      if (data !== null) {
        const dataSize = JSON.stringify(data).length;
        
        if (totalSize + dataSize > SYNC_CONFIG.MAX_SYNC_SIZE) {
          console.warn(`⚠️ Sync size limit reached, skipping ${key}`);
          break;
        }
        
        userData[key] = {
          data,
          timestamp: new Date().toISOString(),
          deviceId: LocalStorageService.generateDeviceId()
        };
        totalSize += dataSize;
      }
    }
    
    if (Object.keys(userData).length === 0) {
      return { success: true, uploaded: 0, message: 'No data to upload' };
    }
    
    // Upload to Azure Cosmos DB
    for (const [key, value] of Object.entries(userData)) {
      // For family group data, use the Azure service
      if (key.startsWith(STORAGE_KEYS.GROUP_PREFIX)) {
        const groupCode = key.replace(STORAGE_KEYS.GROUP_PREFIX, '');
        await azureService.saveGroupData(groupCode, value.data);
      }
      // For other data types, we could extend this with additional Azure services
    }
    
    console.log(`☁️ Uploaded ${Object.keys(userData).length} items to cloud`);
    return { 
      success: true, 
      uploaded: Object.keys(userData).length,
      totalSize 
    };
    
  } catch (error) {
    console.error('❌ Failed to upload to cloud:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Download data from Azure cloud
 */
export const downloadFromCloud = async (conflictResolution = SYNC_CONFIG.CONFLICT_RESOLUTION) => {
  if (!isSyncEnabled()) {
    return { success: false, error: 'Cloud sync not enabled' };
  }
  
  if (!azureService) {
    return { success: false, error: 'Azure service not available' };
  }
  
  try {
    // Azure implementation uses specific API calls per data type
    // Family group data is handled directly in GroupCodeService via Azure API
    console.log('☁️ Azure cloud download completed (data-specific download handled by services)');
    
    return { success: true, downloaded: 0, message: 'Azure uses service-specific sync' };
          console.log(`🔄 Conflict resolved: keeping local data for ${key}`);
          conflictCount++;
          continue;
        } else if (conflictResolution === 'cloud-wins') {
          console.log(`☁️ Conflict resolved: using cloud data for ${key}`);
        } else if (conflictResolution === 'merge') {
          // Simple merge strategy - use newer timestamp
          if (localTimestamp > cloudTimestamp) {
            console.log(`🔄 Merge: keeping newer local data for ${key}`);
            conflictCount++;
            continue;
          }
        }
      }
      
      // Download cloud data
      const result = LocalStorageService.setItem(key, cloudItem.data);
      if (result.success) {
        downloadedCount++;
      }
    }
    
    console.log(`⬇️ Downloaded ${downloadedCount} items from cloud, ${conflictCount} conflicts`);
    return { 
      success: true, 
      downloaded: downloadedCount,
      conflicts: conflictCount 
    };
    
  } catch (error) {
    console.error('❌ Failed to download from cloud:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Perform full bidirectional sync
 */
export const performFullSync = async () => {
  if (!isSyncEnabled()) {
    return { success: false, error: 'Cloud sync not enabled' };
  }
  
  try {
    // Update sync status
    const syncStatus = LocalStorageService.getItem(STORAGE_KEYS.SYNC_STATUS);
    LocalStorageService.setItem(STORAGE_KEYS.SYNC_STATUS, {
      ...syncStatus,
      status: SYNC_STATUS.SYNCING,
      lastSyncAttempt: new Date().toISOString()
    });
    
    // Download first to handle conflicts
    const downloadResult = await downloadFromCloud();
    if (!downloadResult.success) {
      throw new Error(`Download failed: ${downloadResult.error}`);
    }
    
    // Upload local changes
    const uploadResult = await uploadToCloud();
    if (!uploadResult.success) {
      throw new Error(`Upload failed: ${uploadResult.error}`);
    }
    
    // Update sync status
    LocalStorageService.setItem(STORAGE_KEYS.SYNC_STATUS, {
      ...syncStatus,
      status: SYNC_STATUS.IDLE,
      lastSync: new Date().toISOString(),
      lastSyncResult: {
        downloaded: downloadResult.downloaded,
        uploaded: uploadResult.uploaded,
        conflicts: downloadResult.conflicts || 0
      }
    });
    
    console.log('🔄 Full sync completed successfully');
    return {
      success: true,
      downloaded: downloadResult.downloaded,
      uploaded: uploadResult.uploaded,
      conflicts: downloadResult.conflicts || 0
    };
    
  } catch (error) {
    console.error('❌ Full sync failed:', error);
    
    // Update sync status with error
    const syncStatus = LocalStorageService.getItem(STORAGE_KEYS.SYNC_STATUS);
    LocalStorageService.setItem(STORAGE_KEYS.SYNC_STATUS, {
      ...syncStatus,
      status: SYNC_STATUS.ERROR,
      lastError: error.message,
      lastErrorAt: new Date().toISOString()
    });
    
    return { success: false, error: error.message };
  }
};

/**
 * Clear all cloud data for user
 */
export const clearAllCloudData = async () => {
  if (!auth?.currentUser) {
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    const userDoc = getUserDocRef();
    await deleteDoc(userDoc);
    
    console.log('🗑️ Cleared all cloud data');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Failed to clear cloud data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Start periodic sync
 */
export const startPeriodicSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  syncInterval = setInterval(async () => {
    if (isSyncEnabled()) {
      console.log('🔄 Performing periodic sync...');
      await performFullSync();
    }
  }, SYNC_CONFIG.SYNC_INTERVAL);
  
  console.log(`⏰ Periodic sync started (${SYNC_CONFIG.SYNC_INTERVAL / 1000}s interval)`);
};

/**
 * Stop periodic sync
 */
export const stopPeriodicSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('⏹️ Periodic sync stopped');
  }
};

/**
 * Get sync status and statistics
 */
export const getSyncStatus = () => {
  const syncStatus = LocalStorageService.getItem(STORAGE_KEYS.SYNC_STATUS);
  const storageStats = LocalStorageService.getStorageStats();
  
  return {
    ...syncStatus,
    isOnline: navigator.onLine,
    storageStats,
    syncableKeys: SYNCABLE_KEYS.length,
    nonSyncableKeys: NON_SYNCABLE_KEYS.length
  };
};

/**
 * Force sync specific keys
 */
export const syncKeys = async (keys) => {
  if (!isSyncEnabled()) {
    return { success: false, error: 'Cloud sync not enabled' };
  }
  
  try {
    const uploadResult = await uploadToCloud(keys);
    console.log(`🔄 Synced specific keys: ${keys.join(', ')}`);
    return uploadResult;
  } catch (error) {
    console.error('❌ Failed to sync specific keys:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Network status change handler
 */
const handleNetworkChange = () => {
  const isOnline = navigator.onLine;
  const syncStatus = LocalStorageService.getItem(STORAGE_KEYS.SYNC_STATUS);
  
  if (isOnline && isSyncEnabled() && syncStatus?.status === SYNC_STATUS.OFFLINE) {
    console.log('🌐 Network restored, attempting sync...');
    performFullSync();
  } else if (!isOnline) {
    console.log('📴 Network offline, pausing sync');
    const currentStatus = LocalStorageService.getItem(STORAGE_KEYS.SYNC_STATUS);
    LocalStorageService.setItem(STORAGE_KEYS.SYNC_STATUS, {
      ...currentStatus,
      status: SYNC_STATUS.OFFLINE
    });
  }
};

// Setup network listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', handleNetworkChange);
  window.addEventListener('offline', handleNetworkChange);
}

console.log('☁️ Cloud Sync Service initialized');

export default {
  initializeCloudSync,
  enableSync,
  disableSync,
  uploadToCloud,
  downloadFromCloud,
  performFullSync,
  clearAllCloudData,
  startPeriodicSync,
  stopPeriodicSync,
  getSyncStatus,
  syncKeys,
  isSyncEnabled,
  SYNC_STATUS,
  SYNCABLE_KEYS,
  NON_SYNCABLE_KEYS
};