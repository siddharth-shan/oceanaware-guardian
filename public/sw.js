/**
 * EcoQuest Service Worker - Phase 3.2: Offline Capabilities
 * Provides offline functionality for emergency reporting and critical data caching
 */

const CACHE_NAME = 'ecoquest-v1.2.0';
const OFFLINE_PAGE = '/offline.html';

// Critical resources that should always be cached
const CRITICAL_CACHE_RESOURCES = [
  '/',
  '/offline.html'
  // Note: manifest.json and other assets will be cached dynamically
];

// API endpoints that should be cached for offline access
// Note: community/reports removed to prevent stale data after DB deletion
const CACHE_API_PATTERNS = [
  /^\/api\/community\/status/,
  /^\/api\/family\/groups/,
  /^\/api\/weather/
];

// Emergency data that should be cached aggressively
const EMERGENCY_CACHE_PATTERNS = [
  /^\/api\/community\/reports.*urgentLevels=critical/,
  /^\/api\/emergency/,
  /^\/api\/alerts/
];

// IndexedDB for offline report queue
const DB_NAME = 'EcoQuestOffline';
const DB_VERSION = 1;
const OFFLINE_REPORTS_STORE = 'offlineReports';
const CACHED_DATA_STORE = 'cachedData';

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('🔧 EcoQuest Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('📦 Caching critical resources');
        // Cache resources individually to handle failures gracefully
        const cachePromises = CRITICAL_CACHE_RESOURCES.map(async (resource) => {
          try {
            await cache.add(resource);
            console.log('✅ Cached:', resource);
          } catch (error) {
            console.warn('⚠️ Failed to cache:', resource, error);
          }
        });
        await Promise.allSettled(cachePromises);
      })
      .then(() => {
        // Initialize IndexedDB for offline functionality
        return initializeOfflineDB();
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('❌ Service Worker installation failed:', error);
      })
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 EcoQuest Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Clean up old caches
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting outdated cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * Fetch Event Handler - Network-first with cache fallback
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    // Handle POST requests for offline report submission (but not verification)
    if (request.method === 'POST' && url.pathname === '/api/community/report') {
      event.respondWith(handleOfflineReportSubmission(request));
      return;
    }
    return;
  }

  // CRITICAL FIX: Skip OpenStreetMap tile requests to prevent 503 errors
  // OSM forbids no-cache headers and service worker interference
  if (url.hostname.includes('tile.openstreetmap.org') || 
      url.hostname.includes('openstreetmap.org') ||
      url.hostname.match(/^[a-c]\.tile\.openstreetmap\.org$/)) {
    // Let the browser handle OSM tiles naturally without service worker interference
    return;
  }
  
  // Skip all cross-origin tile servers to prevent similar issues
  if (url.hostname !== self.location.hostname && 
      (url.pathname.match(/\/\d+\/\d+\/\d+\.(png|jpg|jpeg)$/) || 
       url.hostname.includes('tile'))) {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - use network-first strategy with emergency priority
    event.respondWith(handleAPIRequest(request));
  } else if (url.pathname.endsWith('.html') || url.pathname === '/') {
    // HTML pages - use network-first with cache fallback
    event.respondWith(handlePageRequest(request));
  } else {
    // Static assets - use cache-first strategy
    event.respondWith(handleStaticAssetRequest(request));
  }
});

/**
 * Handle API Requests with Emergency Priority
 */
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const isEmergencyAPI = EMERGENCY_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname + url.search));
  const isCacheableAPI = CACHE_API_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && (isEmergencyAPI || isCacheableAPI)) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      const responseClone = networkResponse.clone();
      
      // Cache with appropriate strategy
      if (isEmergencyAPI) {
        // Emergency data gets higher priority and longer cache time
        cache.put(request, responseClone);
        await cacheEmergencyData(request.url, await networkResponse.clone().json());
      } else if (isCacheableAPI) {
        cache.put(request, responseClone);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed, trying cache for:', request.url);
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // If it's emergency data, try IndexedDB
    if (isEmergencyAPI) {
      const offlineData = await getOfflineEmergencyData(request.url);
      if (offlineData) {
        return new Response(JSON.stringify(offlineData), {
          headers: {
            'Content-Type': 'application/json',
            'X-Served-By': 'ServiceWorker-OfflineDB'
          }
        });
      }
    }
    
    // Return offline response for API failures
    return new Response(JSON.stringify({
      success: false,
      error: 'Offline - data not available',
      offline: true,
      timestamp: Date.now()
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Served-By': 'ServiceWorker-Offline'
      }
    });
  }
}

/**
 * Handle Page Requests
 */
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful page responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Serve offline page as fallback
    const offlineResponse = await caches.match(OFFLINE_PAGE);
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

/**
 * Handle Static Asset Requests (cache-first)
 */
async function handleStaticAssetRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a basic offline response for failed static assets
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Handle Offline Report Submission
 */
async function handleOfflineReportSubmission(request) {
  try {
    // Try to submit immediately
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
    throw new Error('Network submission failed');
  } catch (error) {
    console.log('📝 Network unavailable, queuing report for later submission');
    
    // Store report in IndexedDB for later submission
    const reportData = await request.json();
    const queuedReport = {
      id: generateOfflineReportId(),
      data: reportData,
      timestamp: Date.now(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      status: 'queued'
    };
    
    await storeOfflineReport(queuedReport);
    
    // Return success response to avoid user confusion
    return new Response(JSON.stringify({
      success: true,
      offline: true,
      message: 'Report queued for submission when online',
      reportId: queuedReport.id,
      timestamp: queuedReport.timestamp
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Served-By': 'ServiceWorker-OfflineQueue'
      }
    });
  }
}

/**
 * Initialize IndexedDB for offline functionality
 */
function initializeOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store for offline reports queue
      if (!db.objectStoreNames.contains(OFFLINE_REPORTS_STORE)) {
        const reportsStore = db.createObjectStore(OFFLINE_REPORTS_STORE, { keyPath: 'id' });
        reportsStore.createIndex('timestamp', 'timestamp');
        reportsStore.createIndex('status', 'status');
      }
      
      // Store for cached emergency data
      if (!db.objectStoreNames.contains(CACHED_DATA_STORE)) {
        const cacheStore = db.createObjectStore(CACHED_DATA_STORE, { keyPath: 'url' });
        cacheStore.createIndex('timestamp', 'timestamp');
        cacheStore.createIndex('type', 'type');
      }
    };
  });
}

/**
 * Store offline report in IndexedDB
 */
async function storeOfflineReport(report) {
  const db = await initializeOfflineDB();
  const transaction = db.transaction([OFFLINE_REPORTS_STORE], 'readwrite');
  const store = transaction.objectStore(OFFLINE_REPORTS_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.add(report);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cache emergency data in IndexedDB
 */
async function cacheEmergencyData(url, data) {
  const db = await initializeOfflineDB();
  const transaction = db.transaction([CACHED_DATA_STORE], 'readwrite');
  const store = transaction.objectStore(CACHED_DATA_STORE);
  
  const cacheEntry = {
    url,
    data,
    timestamp: Date.now(),
    type: 'emergency'
  };
  
  return new Promise((resolve, reject) => {
    const request = store.put(cacheEntry);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get offline emergency data from IndexedDB
 */
async function getOfflineEmergencyData(url) {
  try {
    const db = await initializeOfflineDB();
    const transaction = db.transaction([CACHED_DATA_STORE], 'readonly');
    const store = transaction.objectStore(CACHED_DATA_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(url);
      request.onsuccess = () => {
        const result = request.result;
        if (result && (Date.now() - result.timestamp) < 24 * 60 * 60 * 1000) { // 24 hours
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting offline emergency data:', error);
    return null;
  }
}

/**
 * Generate unique ID for offline reports
 */
function generateOfflineReportId() {
  return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Sync queued reports when online
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-reports') {
    console.log('🔄 Background sync triggered - syncing offline reports');
    event.waitUntil(syncOfflineReports());
  }
});

/**
 * Sync offline reports to server
 */
async function syncOfflineReports() {
  try {
    const db = await initializeOfflineDB();
    const transaction = db.transaction([OFFLINE_REPORTS_STORE], 'readwrite');
    const store = transaction.objectStore(OFFLINE_REPORTS_STORE);
    
    // Get all queued reports
    const queuedReports = await new Promise((resolve, reject) => {
      const request = store.index('status').getAll('queued');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    console.log(`📤 Syncing ${queuedReports.length} offline reports`);
    
    for (const report of queuedReports) {
      try {
        const response = await fetch(report.url, {
          method: report.method,
          headers: report.headers,
          body: JSON.stringify(report.data)
        });
        
        if (response.ok) {
          // Mark as synced
          report.status = 'synced';
          report.syncedAt = Date.now();
          await updateOfflineReport(report);
          console.log('✅ Synced offline report:', report.id);
        } else {
          // Mark as failed
          report.status = 'failed';
          report.failedAt = Date.now();
          report.error = `HTTP ${response.status}: ${response.statusText}`;
          await updateOfflineReport(report);
          console.error('❌ Failed to sync report:', report.id, report.error);
        }
      } catch (error) {
        console.error('❌ Error syncing report:', report.id, error);
        report.status = 'failed';
        report.failedAt = Date.now();
        report.error = error.message;
        await updateOfflineReport(report);
      }
    }
    
    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'OFFLINE_SYNC_COMPLETE',
        syncedCount: queuedReports.filter(r => r.status === 'synced').length,
        failedCount: queuedReports.filter(r => r.status === 'failed').length
      });
    });
    
  } catch (error) {
    console.error('❌ Error during offline sync:', error);
  }
}

/**
 * Update offline report in IndexedDB
 */
async function updateOfflineReport(report) {
  const db = await initializeOfflineDB();
  const transaction = db.transaction([OFFLINE_REPORTS_STORE], 'readwrite');
  const store = transaction.objectStore(OFFLINE_REPORTS_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.put(report);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Handle push notifications for emergency alerts
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    if (data.type === 'emergency-alert') {
      console.log('🚨 Emergency push notification received');
      
      const notificationOptions = {
        body: data.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'emergency-alert',
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View Details'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ],
        data: {
          url: data.url || '/',
          timestamp: Date.now()
        }
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title || '🚨 Emergency Alert', notificationOptions)
      );
    }
  }
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Service worker temporarily disabled to fix loading issues
// console.log('🚀 EcoQuest Service Worker loaded successfully');