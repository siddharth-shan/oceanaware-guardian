/**
 * Storage Context
 * React context for unified storage management
 * Provides local-first storage with optional cloud sync
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import StorageManager from './StorageManager';
import { STORAGE_KEYS } from './LocalStorageService';
import AzureCloudSyncService, { SYNC_STATUS } from './AzureCloudSyncService';

const StorageContext = createContext({});

/**
 * Storage Provider Component
 * Manages storage state and provides storage operations
 */
export const StorageProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [storageStats, setStorageStats] = useState(null);
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.DISABLED);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize storage manager
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🚀 Initializing storage manager...');
        
        const result = await StorageManager.initialize({
          enableCloudSync: isAuthenticated(),
          cloudOptions: {
            autoEnable: false // Let user decide
          }
        });

        // Initialize Azure cloud sync
        if (isAuthenticated()) {
          try {
            const azureResult = await AzureCloudSyncService.initializeCloudSync({
              autoEnable: false
            });
            console.log('🔗 Azure cloud sync initialization:', azureResult.success ? 'Success' : 'Failed');
          } catch (error) {
            console.warn('⚠️ Azure cloud sync initialization failed:', error);
          }
        }

        if (result.success) {
          setIsInitialized(true);
          updateStorageStats();
          updateSyncStatus();
          console.log('✅ Storage manager initialized successfully');
        } else {
          setError(result.error);
          console.error('❌ Storage manager initialization failed:', result.error);
        }
      } catch (error) {
        setError(error.message);
        console.error('❌ Storage initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, [user]);

  // Update storage stats periodically
  useEffect(() => {
    if (!isInitialized) return;

    const updateInterval = setInterval(() => {
      updateStorageStats();
      updateSyncStatus();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(updateInterval);
  }, [isInitialized]);

  /**
   * Update storage statistics
   */
  const updateStorageStats = () => {
    try {
      const stats = StorageManager.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to update storage stats:', error);
    }
  };

  /**
   * Update sync status
   */
  const updateSyncStatus = () => {
    try {
      const status = AzureCloudSyncService.getSyncStatus();
      setSyncStatus(status.status || SYNC_STATUS.DISABLED);
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  };

  /**
   * Save data to storage
   */
  const saveData = async (key, data, options = {}) => {
    try {
      setError(null);
      const result = await StorageManager.save(key, data, options);
      
      if (result.success) {
        updateStorageStats();
        console.log(`💾 Saved ${key} successfully`);
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = `Failed to save ${key}: ${error.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Load data from storage
   */
  const loadData = async (key, options = {}) => {
    try {
      setError(null);
      const result = await StorageManager.load(key, options);
      
      if (!result.success && !options.defaultValue) {
        console.warn(`⚠️ No data found for ${key}`);
      }
      
      return result;
    } catch (error) {
      const errorMsg = `Failed to load ${key}: ${error.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Remove data from storage
   */
  const removeData = async (key, options = {}) => {
    try {
      setError(null);
      const result = await StorageManager.remove(key, options);
      
      if (result.success) {
        updateStorageStats();
        console.log(`🗑️ Removed ${key} successfully`);
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = `Failed to remove ${key}: ${error.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Enable cloud sync with user consent
   */
  const enableCloudSync = async (userConsent = false) => {
    if (!isAuthenticated()) {
      const errorMsg = 'Authentication required for cloud sync';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      setError(null);
      setSyncStatus(SYNC_STATUS.SYNCING);
      
      const result = await StorageManager.enableCloudSync(userConsent);
      
      if (result.success) {
        updateSyncStatus();
        updateStorageStats();
        console.log('☁️ Cloud sync enabled successfully');
      } else {
        setSyncStatus(SYNC_STATUS.ERROR);
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = `Failed to enable cloud sync: ${error.message}`;
      setError(errorMsg);
      setSyncStatus(SYNC_STATUS.ERROR);
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Disable cloud sync
   */
  const disableCloudSync = async (clearCloudData = false) => {
    try {
      setError(null);
      
      const result = await StorageManager.disableCloudSync(clearCloudData);
      
      if (result.success) {
        setSyncStatus(SYNC_STATUS.DISABLED);
        updateStorageStats();
        console.log('🚫 Cloud sync disabled successfully');
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = `Failed to disable cloud sync: ${error.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Perform manual sync
   */
  const performSync = async () => {
    if (!AzureCloudSyncService.isSyncEnabled()) {
      const errorMsg = 'Cloud sync is not enabled';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      setError(null);
      setSyncStatus(SYNC_STATUS.SYNCING);
      
      const result = await StorageManager.sync();
      
      if (result.success) {
        updateSyncStatus();
        updateStorageStats();
        console.log('🔄 Manual sync completed successfully');
      } else {
        setSyncStatus(SYNC_STATUS.ERROR);
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = `Manual sync failed: ${error.message}`;
      setError(errorMsg);
      setSyncStatus(SYNC_STATUS.ERROR);
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Export all data
   */
  const exportAllData = () => {
    try {
      setError(null);
      const result = StorageManager.exportAllData();
      
      if (result.success) {
        console.log('📦 Data exported successfully');
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = `Export failed: ${error.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Import data
   */
  const importData = async (importData, options = {}) => {
    try {
      setError(null);
      
      const result = await StorageManager.importAllData(importData, options);
      
      if (result.success) {
        updateStorageStats();
        updateSyncStatus();
        console.log('📥 Data imported successfully');
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = `Import failed: ${error.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Clear all data
   */
  const clearAllData = async (confirmation = null, clearCloud = false) => {
    try {
      setError(null);
      
      const result = await StorageManager.clearAllData(confirmation, clearCloud);
      
      if (result.success) {
        updateStorageStats();
        setSyncStatus(SYNC_STATUS.DISABLED);
        console.log('🧹 All data cleared successfully');
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMsg = `Clear all failed: ${error.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Get all storage keys
   */
  const getAllKeys = (prefix = '', includeNonSyncable = true) => {
    return StorageManager.getAllKeys(prefix, includeNonSyncable);
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Check if cloud sync is available
   */
  const isCloudSyncAvailable = () => {
    return isAuthenticated() && navigator.onLine;
  };

  /**
   * Check if cloud sync is enabled
   */
  const isCloudSyncEnabled = () => {
    return AzureCloudSyncService.isSyncEnabled();
  };

  /**
   * Get storage health status
   */
  const getHealthStatus = () => {
    return {
      isInitialized,
      isOnline: navigator.onLine,
      isAuthenticated: isAuthenticated(),
      syncEnabled: isCloudSyncEnabled(),
      syncStatus,
      hasError: error !== null,
      storageAvailable: storageStats?.local?.available || false
    };
  };

  // Context value with all storage operations and state
  const value = {
    // State
    isInitialized,
    isLoading,
    error,
    storageStats,
    syncStatus,
    
    // Storage Operations
    saveData,
    loadData,
    removeData,
    getAllKeys,
    
    // Cloud Sync Operations
    enableCloudSync,
    disableCloudSync,
    performSync,
    isCloudSyncAvailable,
    isCloudSyncEnabled,
    
    // Data Management
    exportAllData,
    importData,
    clearAllData,
    
    // Utility
    clearError,
    getHealthStatus,
    updateStorageStats,
    
    // Constants
    STORAGE_KEYS,
    SYNC_STATUS,
    
    // Computed Properties
    isReady: isInitialized && !isLoading,
    canUseCloudSync: isAuthenticated() && navigator.onLine,
    isSyncing: syncStatus === SYNC_STATUS.SYNCING,
    hasStorageSpace: storageStats?.local?.usagePercent < 90,
    totalStorageUsed: storageStats?.local?.totalSize || 0
  };

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
};

/**
 * Custom hook to use storage context
 */
export const useStorage = () => {
  const context = useContext(StorageContext);
  
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  
  return context;
};

/**
 * Higher-order component to require storage
 */
export const withStorage = (Component) => {
  return function StorageComponent(props) {
    const { isReady, isLoading, error } = useStorage();
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading storage...</p>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Storage Error
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reload Application
          </button>
        </div>
      );
    }
    
    if (!isReady) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 m-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Storage Not Ready
          </h3>
          <p className="text-yellow-700">
            Storage system is initializing. Please wait a moment.
          </p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

export default StorageContext;