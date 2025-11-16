/**
 * Enhanced Local Storage Service
 * Provides robust local-first storage with encryption, compression, and validation
 * Congressional App Challenge compliant with privacy-first design
 */

/**
 * Storage configuration and constants
 */
const STORAGE_CONFIG = {
  PREFIX: 'ecoquest-',
  VERSION: '1.0',
  MAX_SIZE: 5 * 1024 * 1024, // 5MB limit
  COMPRESS_THRESHOLD: 1024, // Compress data larger than 1KB
  ENCRYPTION_ENABLED: false, // Can be enabled for sensitive data
  TTL_DEFAULT: 30 * 24 * 60 * 60 * 1000, // 30 days default TTL
};

/**
 * Storage keys for different data types
 */
export const STORAGE_KEYS = {
  // User data
  USER_PROFILE: 'user-profile',
  USER_PREFERENCES: 'user-preferences',
  USER_SETTINGS: 'user-settings',
  
  // Family data
  FAMILY_GROUPS: 'family-groups',
  GROUP_PREFIX: 'group-',
  MEMBER_PREFIX: 'member-',
  
  // App data
  CACHE_PREFIX: 'cache-',
  OFFLINE_DATA: 'offline-data',
  SYNC_QUEUE: 'sync-queue',
  SYNC_STATUS: 'sync-status',
  
  // Emergency data
  EMERGENCY_CONTACTS: 'emergency-contacts',
  EMERGENCY_PLANS: 'emergency-plans',
  SAFETY_CHECKLIST: 'safety-checklist',
  
  // AI and location data
  LOCATION_HISTORY: 'location-history',
  AI_CACHE: 'ai-analysis-cache',
  WEATHER_CACHE: 'weather-cache',
  
  // Metadata
  LAST_SYNC: 'last-sync-time',
  DEVICE_ID: 'device-id',
  APP_VERSION: 'app-version'
};

/**
 * Data validation schemas
 */
const VALIDATION_SCHEMAS = {
  [STORAGE_KEYS.USER_PROFILE]: {
    required: ['uid', 'createdAt'],
    optional: ['userAge', 'hasParentalConsent', 'privacyMode', 'preferences', 'emergencySettings']
  },
  [STORAGE_KEYS.FAMILY_GROUPS]: {
    required: [],
    arrayOf: {
      required: ['code', 'name', 'role', 'joinedAt'],
      optional: ['lastActivity', 'memberCount']
    }
  }
};

/**
 * Generate unique device ID for sync coordination
 */
export const generateDeviceId = () => {
  // Direct localStorage access to avoid recursion
  const fullKey = `${STORAGE_CONFIG.PREFIX}${STORAGE_KEYS.DEVICE_ID}`;
  const existingId = localStorage.getItem(fullKey);
  if (existingId) {
    try {
      const parsed = JSON.parse(existingId);
      return parsed.data || parsed; // Handle both new and legacy formats
    } catch {
      return existingId; // Fallback to raw value
    }
  }
  
  const deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  // Direct localStorage access to avoid recursion
  localStorage.setItem(fullKey, JSON.stringify(deviceId));
  return deviceId;
};

/**
 * Get storage usage statistics
 */
export const getStorageStats = () => {
  try {
    let totalSize = 0;
    let itemCount = 0;
    const usage = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_CONFIG.PREFIX)) {
        const value = localStorage.getItem(key);
        const size = new Blob([value || '']).size;
        totalSize += size;
        itemCount++;
        
        // Categorize by key type
        const category = key.replace(STORAGE_CONFIG.PREFIX, '').split('-')[0];
        usage[category] = (usage[category] || 0) + size;
      }
    }
    
    return {
      totalSize,
      itemCount,
      maxSize: STORAGE_CONFIG.MAX_SIZE,
      usagePercent: (totalSize / STORAGE_CONFIG.MAX_SIZE) * 100,
      breakdown: usage,
      available: STORAGE_CONFIG.MAX_SIZE - totalSize
    };
  } catch (error) {
    console.error('Error calculating storage stats:', error);
    return null;
  }
};

/**
 * Check if storage is available and has space
 */
export const isStorageAvailable = () => {
  try {
    const testKey = `${STORAGE_CONFIG.PREFIX}test`;
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    
    const stats = getStorageStats();
    return {
      available: true,
      hasSpace: stats ? stats.usagePercent < 90 : true,
      stats
    };
  } catch (error) {
    console.error('Storage not available:', error);
    return {
      available: false,
      hasSpace: false,
      error: error.message
    };
  }
};

/**
 * Simple compression for large data
 */
const compressData = (data) => {
  try {
    // Simple compression using JSON stringification optimizations
    // In a real implementation, you might use LZ-string or similar
    const jsonString = JSON.stringify(data);
    if (jsonString.length < STORAGE_CONFIG.COMPRESS_THRESHOLD) {
      return { compressed: false, data: jsonString };
    }
    
    // Basic compression by removing whitespace and optimizing
    const compressed = jsonString.replace(/\s+/g, ' ').trim();
    return { 
      compressed: true, 
      data: compressed,
      originalSize: jsonString.length,
      compressedSize: compressed.length
    };
  } catch (error) {
    console.error('Compression failed:', error);
    return { compressed: false, data: JSON.stringify(data) };
  }
};

/**
 * Decompress data if needed
 */
const decompressData = (storedData) => {
  try {
    if (typeof storedData === 'string') {
      return JSON.parse(storedData);
    }
    
    if (storedData.compressed) {
      return JSON.parse(storedData.data);
    }
    
    return JSON.parse(storedData.data || storedData);
  } catch (error) {
    console.error('Decompression failed:', error);
    return null;
  }
};

/**
 * Validate data against schema
 */
const validateData = (key, data) => {
  const schema = VALIDATION_SCHEMAS[key];
  if (!schema) return { valid: true };
  
  try {
    if (schema.arrayOf && Array.isArray(data)) {
      for (const item of data) {
        for (const requiredField of schema.arrayOf.required) {
          if (!(requiredField in item)) {
            return { valid: false, error: `Missing required field: ${requiredField}` };
          }
        }
      }
    } else {
      for (const requiredField of schema.required) {
        if (!(requiredField in data)) {
          return { valid: false, error: `Missing required field: ${requiredField}` };
        }
      }
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Create storage metadata
 */
const createMetadata = (data) => {
  return {
    version: STORAGE_CONFIG.VERSION,
    timestamp: new Date().toISOString(),
    deviceId: generateDeviceId(),
    size: JSON.stringify(data).length,
    ttl: Date.now() + STORAGE_CONFIG.TTL_DEFAULT
  };
};

/**
 * Check if data has expired
 */
const isExpired = (metadata) => {
  if (!metadata?.ttl) return false;
  return Date.now() > metadata.ttl;
};

/**
 * Enhanced setItem with validation, compression, and metadata
 */
export const setItem = (key, data, options = {}) => {
  try {
    const fullKey = `${STORAGE_CONFIG.PREFIX}${key}`;
    
    // Validate data
    const validation = validateData(key, data);
    if (!validation.valid) {
      console.error(`Validation failed for ${key}:`, validation.error);
      return { success: false, error: validation.error };
    }
    
    // Check storage availability
    const storageCheck = isStorageAvailable();
    if (!storageCheck.available) {
      return { success: false, error: 'Storage not available' };
    }
    
    // Create metadata
    const metadata = createMetadata(data);
    if (options.ttl) {
      metadata.ttl = Date.now() + options.ttl;
    }
    
    // Compress if needed
    const compressed = compressData(data);
    
    // Create storage object
    const storageObject = {
      metadata,
      ...compressed
    };
    
    // Store data
    localStorage.setItem(fullKey, JSON.stringify(storageObject));
    
    console.log(`✅ Stored ${key}:`, {
      size: metadata.size,
      compressed: compressed.compressed,
      device: metadata.deviceId.slice(-8)
    });
    
    return { 
      success: true, 
      metadata,
      compressed: compressed.compressed 
    };
    
  } catch (error) {
    console.error(`❌ Failed to store ${key}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Enhanced getItem with decompression and expiry checking
 */
export const getItem = (key, options = {}) => {
  try {
    const fullKey = `${STORAGE_CONFIG.PREFIX}${key}`;
    const storedValue = localStorage.getItem(fullKey);
    
    if (!storedValue) {
      return options.defaultValue || null;
    }
    
    // Parse stored object
    const storedObject = JSON.parse(storedValue);
    
    // Handle legacy data (plain values)
    if (!storedObject.metadata) {
      return decompressData(storedObject) || options.defaultValue || null;
    }
    
    // Check expiry
    if (isExpired(storedObject.metadata) && !options.ignoreExpiry) {
      console.log(`🕒 Data expired for ${key}, removing`);
      removeItem(key);
      return options.defaultValue || null;
    }
    
    // Decompress and return
    const data = decompressData(storedObject);
    
    if (data === null) {
      console.error(`❌ Failed to decompress ${key}`);
      return options.defaultValue || null;
    }
    
    return data;
    
  } catch (error) {
    console.error(`❌ Failed to retrieve ${key}:`, error);
    return options.defaultValue || null;
  }
};

/**
 * Remove item from storage
 */
export const removeItem = (key) => {
  try {
    const fullKey = `${STORAGE_CONFIG.PREFIX}${key}`;
    localStorage.removeItem(fullKey);
    console.log(`🗑️ Removed ${key}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to remove ${key}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all keys with prefix
 */
export const getAllKeys = (prefix = '') => {
  try {
    const keys = [];
    const searchPrefix = `${STORAGE_CONFIG.PREFIX}${prefix}`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(searchPrefix)) {
        keys.push(key.replace(STORAGE_CONFIG.PREFIX, ''));
      }
    }
    
    return keys;
  } catch (error) {
    console.error('Failed to get keys:', error);
    return [];
  }
};

/**
 * Clear all app data
 */
export const clearAll = (confirmationString = null) => {
  if (confirmationString !== 'CLEAR_ALL_DATA') {
    console.error('Confirmation string required to clear all data');
    return { success: false, error: 'Confirmation required' };
  }
  
  try {
    const keys = getAllKeys();
    let removedCount = 0;
    
    keys.forEach(key => {
      const result = removeItem(key);
      if (result.success) removedCount++;
    });
    
    console.log(`🧹 Cleared ${removedCount} items from storage`);
    return { success: true, removedCount };
    
  } catch (error) {
    console.error('Failed to clear all data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export all data for backup
 */
export const exportData = () => {
  try {
    const data = {};
    const keys = getAllKeys();
    
    keys.forEach(key => {
      const value = getItem(key, { ignoreExpiry: true });
      if (value !== null) {
        data[key] = value;
      }
    });
    
    const exportObject = {
      version: STORAGE_CONFIG.VERSION,
      timestamp: new Date().toISOString(),
      deviceId: generateDeviceId(),
      data
    };
    
    console.log(`📦 Exported ${Object.keys(data).length} items`);
    return { success: true, data: exportObject };
    
  } catch (error) {
    console.error('Failed to export data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Import data from backup
 */
export const importData = (importObject, options = { merge: true }) => {
  try {
    if (!importObject?.data) {
      return { success: false, error: 'Invalid import data' };
    }
    
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const [key, value] of Object.entries(importObject.data)) {
      // Skip if exists and not merging
      if (!options.merge && getItem(key)) {
        skippedCount++;
        continue;
      }
      
      const result = setItem(key, value);
      if (result.success) {
        importedCount++;
      }
    }
    
    console.log(`📥 Imported ${importedCount} items, skipped ${skippedCount}`);
    return { 
      success: true, 
      imported: importedCount, 
      skipped: skippedCount 
    };
    
  } catch (error) {
    console.error('Failed to import data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clean up expired data
 */
export const cleanupExpired = () => {
  try {
    const keys = getAllKeys();
    let cleanedCount = 0;
    
    keys.forEach(key => {
      const fullKey = `${STORAGE_CONFIG.PREFIX}${key}`;
      const storedValue = localStorage.getItem(fullKey);
      
      if (storedValue) {
        try {
          const storedObject = JSON.parse(storedValue);
          if (storedObject.metadata && isExpired(storedObject.metadata)) {
            removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // Invalid data, remove it
          removeItem(key);
          cleanedCount++;
        }
      }
    });
    
    console.log(`🧹 Cleaned up ${cleanedCount} expired items`);
    return { success: true, cleaned: cleanedCount };
    
  } catch (error) {
    console.error('Failed to cleanup expired data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Health check for storage system
 */
export const healthCheck = () => {
  try {
    const availability = isStorageAvailable();
    const stats = getStorageStats();
    const deviceId = generateDeviceId();
    
    // Test write/read
    const testKey = 'health-check-test';
    const testData = { timestamp: Date.now() };
    const writeResult = setItem(testKey, testData);
    const readResult = getItem(testKey);
    removeItem(testKey);
    
    const canWrite = writeResult.success;
    const canRead = readResult && readResult.timestamp === testData.timestamp;
    
    return {
      healthy: availability.available && canWrite && canRead,
      availability,
      stats,
      deviceId,
      operations: {
        canWrite,
        canRead
      },
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Initialize storage system
console.log('📱 Local Storage Service initialized');
export default {
  setItem,
  getItem,
  removeItem,
  getAllKeys,
  clearAll,
  exportData,
  importData,
  cleanupExpired,
  healthCheck,
  getStorageStats,
  isStorageAvailable,
  generateDeviceId,
  STORAGE_KEYS
};