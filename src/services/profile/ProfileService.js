/**
 * Privacy-First User Profile Service
 * Manages user profiles with minimal data collection and local-first storage
 * Now uses unified storage manager for enhanced capabilities
 */

import { getCurrentUser } from '../auth/firebase';
import StorageManager from '../storage/StorageManager';
import { STORAGE_KEYS as UNIFIED_STORAGE_KEYS } from '../storage/LocalStorageService';

/**
 * User Profile Schema (Privacy-First)
 * Only stores essential information for emergency coordination
 */
const PROFILE_SCHEMA = {
  // Anonymous identifier (never personal info)
  uid: '', // Firebase anonymous UID
  
  // Privacy compliance
  userAge: null, // Only for COPPA compliance
  hasParentalConsent: false, // For users under 13
  privacyMode: 'anonymous', // 'anonymous' or 'family-mode'
  
  // Emergency settings (no personal info)
  emergencySettings: {
    enableLocationSharing: false,
    enableFamilyNotifications: false,
    emergencyContactsCount: 0, // Count only, not actual contacts
    autoEvacuationMode: false
  },
  
  // App preferences (functional only)
  preferences: {
    theme: 'auto', // 'light', 'dark', 'auto'
    language: 'en', // 'en', 'es'
    accessibilityMode: false,
    soundEnabled: true,
    vibrationEnabled: true
  },
  
  // Timestamps (for data management)
  createdAt: null,
  lastActive: null,
  dataRetentionDays: 30 // User can adjust
};

/**
 * Storage keys using unified storage system
 */
const STORAGE_KEYS = {
  PROFILE: UNIFIED_STORAGE_KEYS.USER_PROFILE,
  PREFERENCES: UNIFIED_STORAGE_KEYS.USER_PREFERENCES,
  EMERGENCY_SETTINGS: 'emergency-settings', // Custom key for emergency settings
  PRIVACY_SETTINGS: 'ecoquest-privacy-settings'
};

class ProfileService {
  constructor() {
    this.profile = null;
    this.listeners = new Set();
    this.initialized = false;
  }

  /**
   * Initialize profile service
   */
  async initialize() {
    if (this.initialized) return this.profile;
    
    console.log('🔧 Initializing privacy-first profile service...');
    
    try {
      // Load existing profile or create new one
      this.profile = await this.loadProfile();
      
      // Update last active timestamp
      this.profile.lastActive = new Date().toISOString();
      await this.saveProfile();
      
      this.initialized = true;
      this.notifyListeners();
      
      console.log('✅ Profile service initialized');
      return this.profile;
    } catch (error) {
      console.error('❌ Profile initialization failed:', error);
      
      // Create minimal fallback profile
      this.profile = this.createMinimalProfile();
      this.initialized = true;
      return this.profile;
    }
  }

  /**
   * Create a new privacy-first profile
   */
  async createProfile(options = {}) {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('Authentication required to create profile');
    }
    
    console.log('👤 Creating new privacy-first profile...');
    
    const profile = {
      ...PROFILE_SCHEMA,
      uid: currentUser.uid,
      userAge: options.userAge || null,
      hasParentalConsent: options.hasParentalConsent || false,
      privacyMode: options.privacyMode || 'anonymous',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    
    // Apply privacy-specific defaults
    if (profile.userAge && profile.userAge < 13) {
      profile.emergencySettings.enableLocationSharing = false;
      profile.emergencySettings.enableFamilyNotifications = profile.hasParentalConsent;
    }
    
    this.profile = profile;
    await this.saveProfile();
    this.notifyListeners();
    
    console.log('✅ Profile created successfully');
    return profile;
  }

  /**
   * Load existing profile from unified storage system
   */
  async loadProfile() {
    try {
      const result = await StorageManager.load(STORAGE_KEYS.PROFILE, {
        defaultValue: null
      });
      
      if (!result.success || !result.data) {
        console.log('📝 No existing profile found, creating new one...');
        return this.createMinimalProfile();
      }
      
      const profile = result.data;
      
      // Validate profile structure
      if (!this.validateProfile(profile)) {
        console.warn('⚠️ Invalid profile structure, creating new one...');
        return this.createMinimalProfile();
      }
      
      // Update profile to latest schema if needed
      const updatedProfile = this.migrateProfile(profile);
      
      console.log(`✅ Profile loaded successfully from ${result.source}`);
      return updatedProfile;
    } catch (error) {
      console.error('❌ Failed to load profile:', error);
      return this.createMinimalProfile();
    }
  }

  /**
   * Save profile using unified storage system with cloud sync support
   */
  async saveProfile() {
    if (!this.profile) return;
    
    try {
      // Update last active timestamp
      this.profile.lastActive = new Date().toISOString();
      
      // Save main profile (will auto-sync if enabled)
      const profileResult = await StorageManager.save(STORAGE_KEYS.PROFILE, this.profile, {
        skipSync: false // Allow sync for profiles (contains no personal data)
      });
      
      // Save preferences separately for quick access (syncable)
      const preferencesResult = await StorageManager.save(STORAGE_KEYS.PREFERENCES, this.profile.preferences);
      
      // Save emergency settings separately (non-syncable for privacy)
      const emergencyResult = await StorageManager.save(STORAGE_KEYS.EMERGENCY_SETTINGS, this.profile.emergencySettings, {
        skipSync: true // Emergency settings stay local for privacy
      });
      
      if (profileResult.success && preferencesResult.success && emergencyResult.success) {
        console.log('💾 Profile saved successfully with enhanced storage');
      } else {
        console.warn('⚠️ Some profile data failed to save');
      }
    } catch (error) {
      console.error('❌ Failed to save profile:', error);
      throw new Error('Profile save failed');
    }
  }

  /**
   * Update profile settings
   */
  async updateProfile(updates) {
    if (!this.profile) {
      throw new Error('Profile not initialized');
    }
    
    console.log('🔄 Updating profile...', Object.keys(updates));
    
    // Validate updates don't contain sensitive data
    this.validateUpdates(updates);
    
    // Apply updates
    this.profile = {
      ...this.profile,
      ...updates,
      lastActive: new Date().toISOString()
    };
    
    await this.saveProfile();
    this.notifyListeners();
    
    console.log('✅ Profile updated successfully');
    return this.profile;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences) {
    if (!this.profile) {
      throw new Error('Profile not initialized');
    }
    
    console.log('⚙️ Updating user preferences...', Object.keys(preferences));
    
    this.profile.preferences = {
      ...this.profile.preferences,
      ...preferences
    };
    
    await this.saveProfile();
    this.notifyListeners();
    
    return this.profile.preferences;
  }

  /**
   * Update emergency settings
   */
  async updateEmergencySettings(settings) {
    if (!this.profile) {
      throw new Error('Profile not initialized');
    }
    
    // Check parental consent for users under 13
    if (this.profile.userAge && this.profile.userAge < 13) {
      if (!this.profile.hasParentalConsent && (settings.enableLocationSharing || settings.enableFamilyNotifications)) {
        throw new Error('Parental consent required for emergency features');
      }
    }
    
    console.log('🚨 Updating emergency settings...', Object.keys(settings));
    
    this.profile.emergencySettings = {
      ...this.profile.emergencySettings,
      ...settings
    };
    
    await this.saveProfile();
    this.notifyListeners();
    
    return this.profile.emergencySettings;
  }

  /**
   * Get current profile
   */
  getProfile() {
    return this.profile;
  }

  /**
   * Get user preferences
   */
  getPreferences() {
    return this.profile?.preferences || PROFILE_SCHEMA.preferences;
  }

  /**
   * Get emergency settings
   */
  getEmergencySettings() {
    return this.profile?.emergencySettings || PROFILE_SCHEMA.emergencySettings;
  }

  /**
   * Check if user can use family features
   */
  canUseFamilyFeatures() {
    if (!this.profile) return false;
    
    // Must be in family mode
    if (this.profile.privacyMode !== 'family-mode') return false;
    
    // Users under 13 need parental consent
    if (this.profile.userAge && this.profile.userAge < 13) {
      return this.profile.hasParentalConsent;
    }
    
    return true;
  }

  /**
   * Get privacy summary for user
   */
  getPrivacySummary() {
    if (!this.profile) return null;
    
    return {
      privacyMode: this.profile.privacyMode,
      isMinor: this.profile.userAge && this.profile.userAge < 13,
      hasParentalConsent: this.profile.hasParentalConsent,
      canUseFamilyFeatures: this.canUseFamilyFeatures(),
      dataRetentionDays: this.profile.dataRetentionDays,
      createdAt: this.profile.createdAt
    };
  }

  /**
   * Delete all user data (GDPR compliance)
   */
  async deleteAllData() {
    console.log('🗑️ Deleting all user data...');
    
    try {
      // Remove from localStorage
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear in-memory profile
      this.profile = null;
      this.initialized = false;
      
      // Notify listeners
      this.notifyListeners();
      
      console.log('✅ All user data deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete user data:', error);
      throw new Error('Data deletion failed');
    }
  }

  /**
   * Export user data (GDPR compliance)
   */
  exportData() {
    if (!this.profile) return null;
    
    return {
      profile: this.profile,
      exported: new Date().toISOString(),
      format: 'JSON',
      privacy: 'This data contains no personal information - only anonymous preferences and settings'
    };
  }

  /**
   * Subscribe to profile changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of profile changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.profile);
      } catch (error) {
        console.error('Profile listener error:', error);
      }
    });
  }

  /**
   * Create minimal profile for fallback
   */
  createMinimalProfile() {
    const currentUser = getCurrentUser();
    
    return {
      ...PROFILE_SCHEMA,
      uid: currentUser?.uid || 'anonymous',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
  }

  /**
   * Validate profile structure
   */
  validateProfile(profile) {
    if (!profile || typeof profile !== 'object') return false;
    if (!profile.uid) return false;
    if (!profile.preferences) return false;
    if (!profile.emergencySettings) return false;
    return true;
  }

  /**
   * Validate updates don't contain sensitive data
   */
  validateUpdates(updates) {
    const sensitiveFields = ['email', 'phone', 'name', 'address', 'socialSecurity'];
    
    const checkObject = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check for sensitive field names
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          throw new Error(`Sensitive field not allowed: ${currentPath}`);
        }
        
        // Check for patterns that might be personal data
        if (typeof value === 'string') {
          if (value.includes('@')) {
            throw new Error(`Email-like data not allowed: ${currentPath}`);
          }
          if (/\d{3}-\d{3}-\d{4}/.test(value)) {
            throw new Error(`Phone-like data not allowed: ${currentPath}`);
          }
        }
        
        // Recursively check nested objects
        if (value && typeof value === 'object') {
          checkObject(value, currentPath);
        }
      }
    };
    
    checkObject(updates);
  }

  /**
   * Migrate profile to latest schema
   */
  migrateProfile(profile) {
    const migrated = { ...PROFILE_SCHEMA, ...profile };
    
    // Ensure all required fields exist
    if (!migrated.preferences) migrated.preferences = PROFILE_SCHEMA.preferences;
    if (!migrated.emergencySettings) migrated.emergencySettings = PROFILE_SCHEMA.emergencySettings;
    
    return migrated;
  }
}

// Export singleton instance
const profileService = new ProfileService();
export default profileService;