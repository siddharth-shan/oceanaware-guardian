/**
 * Azure Cosmos DB Service
 * Native Azure cloud storage for family group data
 * Privacy-first design with anonymous group sharing
 */

/**
 * Azure Cosmos DB configuration
 */
const COSMOS_CONFIG = {
  DATABASE_NAME: 'EcoQuestDB',
  CONTAINER_NAME: 'FamilyGroups',
  PARTITION_KEY: '/groupCode',
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  BATCH_SIZE: 10
};

/**
 * Azure API endpoints (to be hosted on your Azure App Service)
 */
const getApiBaseUrl = () => {
  // Use environment variable or fallback to current host
  const baseUrl = import.meta.env.VITE_AZURE_API_BASE_URL;
  if (baseUrl) return baseUrl;
  
  // In production, use same host as frontend
  if (import.meta.env.PROD) {
    return `${window.location.origin}/api`;
  }
  
  // Development fallback
  return 'http://localhost:3001/api';
};

const API_ENDPOINTS = {
  GROUPS: `${getApiBaseUrl()}/family-groups`,
  HEALTH: `${getApiBaseUrl()}/family-groups/health`
};

/**
 * Service availability tracking
 */
let isServiceAvailable = false;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if Azure Cosmos DB service is available
 */
export const checkServiceHealth = async () => {
  const now = Date.now();
  
  // Return cached result if recent
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL && isServiceAvailable) {
    return { available: true, source: 'cache' };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_ENDPOINTS.HEALTH}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      isServiceAvailable = true;
      lastHealthCheck = now;
      console.log('☁️ Azure Cosmos DB service available');
      return { available: true, status: data.status, source: 'live' };
    } else {
      throw new Error(`Service responded with ${response.status}`);
    }
  } catch (error) {
    console.warn('⚠️ Azure Cosmos DB service unavailable:', error.message);
    isServiceAvailable = false;
    return { available: false, error: error.message };
  }
};

/**
 * Create anonymous authentication header
 */
const createAuthHeader = () => {
  // Get current anonymous user ID
  const localUser = JSON.parse(localStorage.getItem('ecoquest-local-user') || '{}');
  const anonymousUserId = localUser.uid || `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    'Content-Type': 'application/json',
    'X-Anonymous-User-ID': anonymousUserId,
    'X-App-Version': '1.0.0'
  };
};

/**
 * Make authenticated request to Azure API
 */
const makeApiRequest = async (endpoint, method = 'GET', data = null) => {
  const headers = createAuthHeader();
  
  const config = {
    method,
    headers,
    ...(data && { body: JSON.stringify(data) })
  };
  
  try {
    const response = await fetch(endpoint, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Azure API request failed:', error);
    throw error;
  }
};

/**
 * Save family group data to Azure Cosmos DB
 */
export const saveGroupData = async (groupCode, groupData) => {
  if (!isServiceAvailable) {
    const health = await checkServiceHealth();
    if (!health.available) {
      throw new Error('Azure Cosmos DB service unavailable');
    }
  }
  
  try {
    console.log(`💾 Saving group ${groupCode} to Azure Cosmos DB...`);
    
    const response = await makeApiRequest(
      `${API_ENDPOINTS.GROUPS}/${groupCode}`,
      'PUT',
      {
        groupCode,
        data: groupData,
        timestamp: new Date().toISOString()
      }
    );
    
    console.log(`✅ Group ${groupCode} saved to Azure Cosmos DB`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error(`❌ Failed to save group ${groupCode}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Load family group data from Azure Cosmos DB
 */
export const loadGroupData = async (groupCode) => {
  if (!isServiceAvailable) {
    const health = await checkServiceHealth();
    if (!health.available) {
      throw new Error('Azure Cosmos DB service unavailable');
    }
  }
  
  try {
    console.log(`📱 Loading group ${groupCode} from Azure Cosmos DB...`);
    
    const response = await makeApiRequest(
      `${API_ENDPOINTS.GROUPS}/${groupCode}`,
      'GET'
    );
    
    if (response && response.data) {
      console.log(`✅ Group ${groupCode} loaded from Azure Cosmos DB`);
      return {
        success: true,
        data: response.data,
        source: 'azure-cosmos'
      };
    } else {
      console.log(`📭 Group ${groupCode} not found in Azure Cosmos DB`);
      return {
        success: false,
        error: 'Group not found',
        notFound: true
      };
    }
  } catch (error) {
    console.error(`❌ Failed to load group ${groupCode}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete family group data from Azure Cosmos DB
 */
export const deleteGroupData = async (groupCode) => {
  if (!isServiceAvailable) {
    const health = await checkServiceHealth();
    if (!health.available) {
      throw new Error('Azure Cosmos DB service unavailable');
    }
  }
  
  try {
    console.log(`🗑️ Deleting group ${groupCode} from Azure Cosmos DB...`);
    
    await makeApiRequest(
      `${API_ENDPOINTS.GROUPS}/${groupCode}`,
      'DELETE'
    );
    
    console.log(`✅ Group ${groupCode} deleted from Azure Cosmos DB`);
    return {
      success: true
    };
  } catch (error) {
    console.error(`❌ Failed to delete group ${groupCode}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * List all available groups (for admin/debugging)
 */
export const listGroups = async (limit = 50) => {
  if (!isServiceAvailable) {
    const health = await checkServiceHealth();
    if (!health.available) {
      throw new Error('Azure Cosmos DB service unavailable');
    }
  }
  
  try {
    console.log('📋 Listing groups from Azure Cosmos DB...');
    
    const response = await makeApiRequest(
      `${API_ENDPOINTS.GROUPS}?limit=${limit}`,
      'GET'
    );
    
    return {
      success: true,
      groups: response.groups || [],
      total: response.total || 0
    };
  } catch (error) {
    console.error('❌ Failed to list groups:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get service statistics
 */
export const getServiceStats = async () => {
  try {
    const health = await checkServiceHealth();
    
    return {
      available: health.available,
      lastHealthCheck: new Date(lastHealthCheck).toISOString(),
      apiBaseUrl: getApiBaseUrl(),
      config: {
        database: COSMOS_CONFIG.DATABASE_NAME,
        container: COSMOS_CONFIG.CONTAINER_NAME,
        partitionKey: COSMOS_CONFIG.PARTITION_KEY
      }
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
};

/**
 * Initialize Azure Cosmos DB service
 */
export const initializeAzureService = async () => {
  try {
    console.log('🚀 Initializing Azure Cosmos DB service...');
    
    const health = await checkServiceHealth();
    
    if (health.available) {
      console.log('✅ Azure Cosmos DB service initialized successfully');
      return {
        success: true,
        status: health.status,
        endpoints: API_ENDPOINTS
      };
    } else {
      console.log('⚠️ Azure Cosmos DB service unavailable - using local-only mode');
      return {
        success: false,
        error: health.error,
        fallbackMode: 'local-only'
      };
    }
  } catch (error) {
    console.error('❌ Azure Cosmos DB service initialization failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

console.log('☁️ Azure Cosmos DB Service initialized');

export default {
  saveGroupData,
  loadGroupData,
  deleteGroupData,
  listGroups,
  getServiceStats,
  initializeAzureService,
  checkServiceHealth,
  COSMOS_CONFIG
};