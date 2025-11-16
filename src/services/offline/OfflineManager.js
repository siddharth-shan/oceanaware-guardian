/**
 * Offline Manager - Client-side offline functionality
 * Phase 3.2: Handles offline detection, report queuing, and sync management
 */

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = new Set();
    this.syncInProgress = false;
    this.offlineReports = [];
    this.lastSyncAttempt = null;
    
    // Initialize event listeners
    this.initializeEventListeners();
    
    // Register service worker
    // this.registerServiceWorker(); // Temporarily disabled
    
    // Setup periodic sync attempts
    this.setupPeriodicSync();
  }

  /**
   * Initialize online/offline event listeners
   */
  initializeEventListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored');
      this.isOnline = true;
      this.notifyListeners('online');
      this.attemptSync();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Connection lost - entering offline mode');
      this.isOnline = false;
      this.notifyListeners('offline');
    });

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });
    }
  }

  /**
   * Register service worker for offline functionality
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('✅ Service Worker registered successfully');
        
        // Setup background sync if supported
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          console.log('✅ Background Sync supported');
          this.syncRegistration = registration;
        }
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Service Worker update found');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 Service Worker updated - reload to activate');
                this.notifyListeners('update-available');
              }
            });
          }
        });
        
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Handle messages from service worker
   */
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'OFFLINE_SYNC_COMPLETE':
        console.log(`📤 Offline sync complete: ${data.syncedCount} synced, ${data.failedCount} failed`);
        this.syncInProgress = false;
        this.notifyListeners('sync-complete', {
          syncedCount: data.syncedCount,
          failedCount: data.failedCount
        });
        break;
        
      case 'CACHE_UPDATED':
        console.log('📦 Cache updated');
        this.notifyListeners('cache-updated');
        break;
        
      default:
        console.log('📨 Service Worker message:', data);
    }
  }

  /**
   * Setup periodic sync attempts
   */
  setupPeriodicSync() {
    // Attempt sync every 30 seconds when offline
    setInterval(() => {
      if (!this.isOnline && !this.syncInProgress) {
        this.checkConnectionAndSync();
      }
    }, 30000);
  }

  /**
   * Check connection and attempt sync
   */
  async checkConnectionAndSync() {
    try {
      // Try a lightweight network request
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache',
        timeout: 5000
      });
      
      if (response.ok && !this.isOnline) {
        // Connection restored
        this.isOnline = true;
        this.notifyListeners('online');
        this.attemptSync();
      }
    } catch (error) {
      // Still offline
      console.log('🔍 Connection check failed - still offline');
    }
  }

  /**
   * Attempt to sync offline data
   */
  async attemptSync() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    this.lastSyncAttempt = Date.now();
    
    try {
      console.log('🔄 Starting offline sync...');
      
      // Trigger background sync if supported
      if (this.syncRegistration && 'sync' in window.ServiceWorkerRegistration.prototype) {
        await this.syncRegistration.sync.register('sync-offline-reports');
        console.log('✅ Background sync registered');
      } else {
        // Fallback to manual sync
        await this.manualSync();
      }
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.syncInProgress = false;
      this.notifyListeners('sync-failed', { error: error.message });
    }
  }

  /**
   * Manual sync for browsers without background sync
   */
  async manualSync() {
    try {
      // Get offline reports from IndexedDB via service worker
      const offlineReports = await this.getOfflineReports();
      
      let syncedCount = 0;
      let failedCount = 0;
      
      for (const report of offlineReports) {
        try {
          const response = await fetch(report.url, {
            method: report.method,
            headers: report.headers,
            body: JSON.stringify(report.data)
          });
          
          if (response.ok) {
            await this.markReportAsSynced(report.id);
            syncedCount++;
          } else {
            await this.markReportAsFailed(report.id, `HTTP ${response.status}`);
            failedCount++;
          }
        } catch (error) {
          await this.markReportAsFailed(report.id, error.message);
          failedCount++;
        }
      }
      
      this.syncInProgress = false;
      this.notifyListeners('sync-complete', { syncedCount, failedCount });
      
    } catch (error) {
      this.syncInProgress = false;
      throw error;
    }
  }

  /**
   * Get offline reports from IndexedDB
   */
  async getOfflineReports() {
    return new Promise((resolve) => {
      // This would typically use IndexedDB directly
      // For now, return empty array as service worker handles this
      resolve([]);
    });
  }

  /**
   * Mark report as synced
   */
  async markReportAsSynced(reportId) {
    // Implementation would update IndexedDB
    console.log('✅ Report synced:', reportId);
  }

  /**
   * Mark report as failed
   */
  async markReportAsFailed(reportId, error) {
    // Implementation would update IndexedDB
    console.error('❌ Report sync failed:', reportId, error);
  }

  /**
   * Submit report with offline support
   */
  async submitReport(reportData, endpoint = '/api/community/report') {
    try {
      if (this.isOnline) {
        // Try online submission first
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reportData)
        });

        if (response.ok) {
          return await response.json();
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } else {
        // Offline - let service worker handle it
        throw new Error('Offline - will queue for sync');
      }
    } catch (error) {
      console.log('📝 Report will be queued for offline sync');
      
      // The service worker will catch the failed request and queue it
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });

      return await response.json();
    }
  }

  /**
   * Get cached data for offline use
   */
  async getCachedData(endpoint) {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.offline) {
        console.log('📦 Serving cached data for:', endpoint);
        this.notifyListeners('cache-served', { endpoint });
      }
      
      return data;
    } catch (error) {
      console.error('❌ Failed to get cached data:', error);
      return {
        success: false,
        error: 'Data not available offline',
        offline: true
      };
    }
  }

  /**
   * Preload critical data for offline use
   */
  async preloadCriticalData(userLocation) {
    if (!this.isOnline) {
      console.log('⏸️ Skipping preload - offline');
      return;
    }

    const criticalEndpoints = [
      `/api/community/reports?lat=${userLocation.lat}&lng=${userLocation.lng}`,
      `/api/community/status?lat=${userLocation.lat}&lng=${userLocation.lng}`,
      '/api/emergency/contacts',
      '/api/emergency/procedures'
    ];

    console.log('📦 Preloading critical data for offline use...');
    
    const preloadPromises = criticalEndpoints.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          console.log('✅ Preloaded:', endpoint);
        }
      } catch (error) {
        console.warn('⚠️ Failed to preload:', endpoint, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log('📦 Critical data preload complete');
  }

  /**
   * Add listener for offline events
   */
  addListener(callback) {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data = null) {
    this.listeners.forEach(callback => {
      try {
        callback({ event, data, timestamp: Date.now() });
      } catch (error) {
        console.error('❌ Error in offline listener:', error);
      }
    });
  }

  /**
   * Get offline status info
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      lastSyncAttempt: this.lastSyncAttempt,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasBackgroundSync: 'sync' in window.ServiceWorkerRegistration.prototype
    };
  }

  /**
   * Force reload application
   */
  reloadApplication() {
    window.location.reload();
  }

  /**
   * Clear offline cache
   */
  async clearCache() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('🗑️ Cache cleared');
      this.notifyListeners('cache-cleared');
    }
  }
}

// Create singleton instance
const offlineManager = new OfflineManager();

export default offlineManager;