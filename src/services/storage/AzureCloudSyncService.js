/**
 * Azure-Native Cloud Sync Service
 * Simplified cloud synchronization for Azure App Service + Cosmos DB
 * Privacy-first design with anonymous family group sharing
 */

import AzureCosmosService from './AzureCosmosService';
import LocalStorageService, { STORAGE_KEYS } from './LocalStorageService';

/**
 * Sync status types
 */
export const SYNC_STATUS = {
  DISABLED: 'disabled',
  IDLE: 'idle',
  SYNCING: 'syncing',
  ERROR: 'error',
  OFFLINE: 'offline'
};

/**
 * Data that can be synced to Azure (privacy-safe only)
 */
export const SYNCABLE_KEYS = [
  STORAGE_KEYS.GROUP_PREFIX, // Family group data (anonymous) for cross-device joining
  // Add other privacy-safe data types here as needed
];

/**
 * Data that should never be synced (privacy-sensitive)
 */
export const NON_SYNCABLE_KEYS = [
  STORAGE_KEYS.USER_PROFILE, // Contains age and consent info
  STORAGE_KEYS.FAMILY_GROUPS, // Personal family group lists remain local-only
  STORAGE_KEYS.LOCATION_HISTORY, // Location data is privacy-sensitive
  STORAGE_KEYS.DEVICE_ID, // Device-specific
  STORAGE_KEYS.AI_CACHE, // Temporary data
  STORAGE_KEYS.WEATHER_CACHE // Temporary data
];

let isInitialized = false;
let azureService = null;

/**
 * Initialize Azure cloud sync service
 */
export const initializeCloudSync = async (options = {}) => {
  try {
    if (isInitialized) return { success: true, status: 'already-initialized' };
    
    console.log('🚀 Initializing Azure cloud sync...');
    
    // Initialize Azure service
    const azureResult = await AzureCosmosService.initializeAzureService();
    
    if (!azureResult.success) {
      console.log('⚠️ Azure service not available - using local-only mode');
      return { 
        success: false, 
        error: azureResult.error,
        fallbackMode: 'local-only'
      };
    }
    
    azureService = AzureCosmosService;
    isInitialized = true;
    
    // Set initial sync status
    LocalStorageService.setItem(STORAGE_KEYS.SYNC_STATUS, {
      status: SYNC_STATUS.IDLE,
      lastSync: null,
      enabled: options.autoEnable || false,
      serviceProvider: 'azure-cosmos'
    });
    
    console.log('✅ Azure cloud sync initialized successfully');
    return {
      success: true,
      serviceProvider: 'azure-cosmos'
    };
    
  } catch (error) {
    console.error('❌ Failed to initialize Azure cloud sync:', error);
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
      serviceProvider: 'azure-cosmos'
    });
    
    console.log('✅ Azure cloud sync enabled with user consent');
    return { success: true, enabled: true };
    
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
    // Update local sync status
    LocalStorageService.setItem(STORAGE_KEYS.SYNC_STATUS, {
      status: SYNC_STATUS.DISABLED,
      enabled: false,
      disabledAt: new Date().toISOString()
    });
    
    if (clearCloudData && azureService) {
      // Note: In a full implementation, you might want to delete user's cloud data
      console.log('⚠️ Cloud data clearing would need to be implemented based on requirements');
    }
    
    console.log('🚫 Azure cloud sync disabled');
    return { success: true, enabled: false };
    
  } catch (error) {
    console.error('❌ Failed to disable cloud sync:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload family group data to Azure
 * This is called automatically when group data changes
 * Note: Family groups always sync to cloud for cross-device access, regardless of general sync settings
 */
export const uploadGroupData = async (groupCode, groupData) => {
  // Initialize Azure service if not already done
  if (!azureService) {
    const initResult = await initializeCloudSync();
    if (!initResult.success) {
      return { success: false, error: 'Azure service unavailable' };
    }
  }
  
  if (!azureService) {
    return { success: false, error: 'Azure service not available' };
  }
  
  try {
    console.log(`⬆️ Uploading group ${groupCode} to Azure...`);
    
    const result = await azureService.saveGroupData(groupCode, groupData);
    
    if (result.success) {
      console.log(`✅ Group ${groupCode} uploaded to Azure successfully`);
      
      // Update sync status
      const syncStatus = LocalStorageService.getItem(STORAGE_KEYS.SYNC_STATUS);
      LocalStorageService.setItem(STORAGE_KEYS.SYNC_STATUS, {
        ...syncStatus,
        lastSync: new Date().toISOString(),
        lastUpload: new Date().toISOString()
      });
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to upload group ${groupCode}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Download family group data from Azure
 * This is called when trying to join a group that's not found locally
 * Note: Family groups always sync from cloud for cross-device access, regardless of general sync settings
 */
export const downloadGroupData = async (groupCode) => {
  // Initialize Azure service if not already done
  if (!azureService) {
    const initResult = await initializeCloudSync();
    if (!initResult.success) {
      return { success: false, error: 'Azure service unavailable' };
    }
  }
  
  if (!azureService) {
    return { success: false, error: 'Azure service not available' };
  }
  
  try {
    console.log(`⬇️ Downloading group ${groupCode} from Azure...`);
    
    const result = await azureService.loadGroupData(groupCode);
    
    if (result.success) {
      console.log(`✅ Group ${groupCode} downloaded from Azure successfully`);
      
      // Update sync status if sync is enabled
      if (isSyncEnabled()) {
        const syncStatus = LocalStorageService.getItem(STORAGE_KEYS.SYNC_STATUS);
        LocalStorageService.setItem(STORAGE_KEYS.SYNC_STATUS, {
          ...syncStatus,
          lastSync: new Date().toISOString(),
          lastDownload: new Date().toISOString()
        });
      }
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to download group ${groupCode}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete family group data from Azure
 */
export const deleteGroupData = async (groupCode) => {
  if (!isSyncEnabled() || !azureService) {
    return { success: false, error: 'Azure sync not enabled' };
  }
  
  try {
    console.log(`🗑️ Deleting group ${groupCode} from Azure...`);
    
    const result = await azureService.deleteGroupData(groupCode);
    
    if (result.success) {
      console.log(`✅ Group ${groupCode} deleted from Azure successfully`);
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to delete group ${groupCode}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Get sync status and statistics
 */
export const getSyncStatus = () => {
  const syncStatus = LocalStorageService.getItem(STORAGE_KEYS.SYNC_STATUS);
  const azureStats = azureService ? azureService.getServiceStats() : null;
  
  return {
    ...syncStatus,
    azure: azureStats,
    initialized: isInitialized,
    serviceAvailable: azureService !== null
  };
};

/**
 * Check Azure service health
 */
export const checkServiceHealth = async () => {
  if (!azureService) {
    return { available: false, error: 'Service not initialized' };
  }
  
  return await azureService.checkServiceHealth();
};

/**
 * Sync specific keys (compatibility with existing code)
 */
export const syncKeys = async (keys) => {
  if (!isSyncEnabled()) {
    return { success: false, error: 'Cloud sync not enabled' };
  }
  
  console.log(`🔄 Azure sync: ${keys.length} keys requested`);
  
  // For Azure implementation, group data sync is handled specifically
  // Other data types would be implemented as needed
  
  return { 
    success: true, 
    message: 'Azure uses service-specific sync',
    keys: keys.length 
  };
};

/**
 * Perform full sync (compatibility method)
 */
export const performFullSync = async () => {
  if (!isSyncEnabled()) {
    return { success: false, error: 'Cloud sync not enabled' };
  }
  
  console.log('🔄 Azure full sync: Service-specific sync in progress...');
  
  // Update sync status
  const syncStatus = LocalStorageService.getItem(STORAGE_KEYS.SYNC_STATUS);
  LocalStorageService.setItem(STORAGE_KEYS.SYNC_STATUS, {
    ...syncStatus,
    status: SYNC_STATUS.IDLE,
    lastSync: new Date().toISOString()
  });
  
  return { 
    success: true, 
    message: 'Azure uses service-specific sync' 
  };
};

// Compatibility exports for existing code
export const uploadToCloud = () => {
  console.log('☁️ Azure: Use uploadGroupData() for specific data uploads');
  return { success: true, message: 'Use service-specific upload methods' };
};

export const downloadFromCloud = () => {
  console.log('☁️ Azure: Use downloadGroupData() for specific data downloads');
  return { success: true, message: 'Use service-specific download methods' };
};

console.log('☁️ Azure Cloud Sync Service ready');

export default {
  initializeCloudSync,
  enableSync,
  disableSync,
  uploadGroupData,
  downloadGroupData,
  deleteGroupData,
  isSyncEnabled,
  getSyncStatus,
  checkServiceHealth,
  syncKeys,
  performFullSync,
  uploadToCloud,
  downloadFromCloud,
  SYNC_STATUS,
  SYNCABLE_KEYS,
  NON_SYNCABLE_KEYS
};