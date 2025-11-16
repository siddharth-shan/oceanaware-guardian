/**
 * Profile Context for EcoQuest Wildfire Watch
 * Privacy-first profile state management with React Context
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import profileService from './ProfileService';

const ProfileContext = createContext({});

/**
 * Profile Provider Component
 * Manages user profile state and provides profile management methods
 */
export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user, isAuthenticated } = useAuth();

  // Initialize profile when user authentication changes
  useEffect(() => {
    let unsubscribe;
    
    const initializeProfile = async () => {
      if (!isAuthenticated) {
        setProfile(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔧 Initializing profile for authenticated user...');
        
        // Initialize profile service
        const initialProfile = await profileService.initialize();
        setProfile(initialProfile);
        
        // Subscribe to profile changes
        unsubscribe = profileService.subscribe((updatedProfile) => {
          console.log('👤 Profile updated:', updatedProfile?.uid);
          setProfile(updatedProfile);
        });
        
        console.log('✅ Profile initialization complete');
      } catch (error) {
        console.error('❌ Profile initialization failed:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    initializeProfile();
    
    // Cleanup subscription on unmount or auth change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAuthenticated, user]);

  /**
   * Create new profile with privacy settings
   */
  const createProfile = async (options) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👤 Creating new profile with options:', options);
      const newProfile = await profileService.createProfile(options);
      
      setProfile(newProfile);
      console.log('✅ Profile created successfully');
      return { success: true, profile: newProfile };
    } catch (error) {
      console.error('❌ Profile creation failed:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update profile settings
   */
  const updateProfile = async (updates) => {
    try {
      setError(null);
      
      console.log('🔄 Updating profile...', Object.keys(updates));
      const updatedProfile = await profileService.updateProfile(updates);
      
      setProfile(updatedProfile);
      console.log('✅ Profile updated successfully');
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  /**
   * Update user preferences
   */
  const updatePreferences = async (preferences) => {
    try {
      setError(null);
      
      console.log('⚙️ Updating preferences...', Object.keys(preferences));
      const updatedPreferences = await profileService.updatePreferences(preferences);
      
      // Profile will be updated via subscription
      console.log('✅ Preferences updated successfully');
      return { success: true, preferences: updatedPreferences };
    } catch (error) {
      console.error('❌ Preferences update failed:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  /**
   * Update emergency settings
   */
  const updateEmergencySettings = async (settings) => {
    try {
      setError(null);
      
      console.log('🚨 Updating emergency settings...', Object.keys(settings));
      const updatedSettings = await profileService.updateEmergencySettings(settings);
      
      // Profile will be updated via subscription
      console.log('✅ Emergency settings updated successfully');
      return { success: true, settings: updatedSettings };
    } catch (error) {
      console.error('❌ Emergency settings update failed:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  /**
   * Check if user can use family features
   */
  const canUseFamilyFeatures = () => {
    return profileService.canUseFamilyFeatures();
  };

  /**
   * Get privacy summary
   */
  const getPrivacySummary = () => {
    return profileService.getPrivacySummary();
  };

  /**
   * Delete all user data
   */
  const deleteAllData = async () => {
    try {
      setError(null);
      
      console.log('🗑️ Deleting all user data...');
      const result = await profileService.deleteAllData();
      
      setProfile(null);
      console.log('✅ All data deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Data deletion failed:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  /**
   * Export user data
   */
  const exportData = () => {
    try {
      const data = profileService.exportData();
      console.log('📤 User data exported');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Data export failed:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Clear any error state
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Get profile status for debugging
   */
  const getProfileStatus = () => {
    return {
      hasProfile: profile !== null,
      isInitialized: profileService.initialized,
      privacyMode: profile?.privacyMode || 'unknown',
      canUseFamilyFeatures: canUseFamilyFeatures(),
      isMinor: profile?.userAge && profile.userAge < 13,
      hasParentalConsent: profile?.hasParentalConsent || false,
      loading,
      error
    };
  };

  // Context value with all profile methods and state
  const value = {
    // State
    profile,
    loading,
    error,
    
    // Methods
    createProfile,
    updateProfile,
    updatePreferences,
    updateEmergencySettings,
    deleteAllData,
    exportData,
    clearError,
    
    // Computed properties
    canUseFamilyFeatures,
    getPrivacySummary,
    getProfileStatus,
    
    // Quick access to profile data
    preferences: profile?.preferences,
    emergencySettings: profile?.emergencySettings,
    privacyMode: profile?.privacyMode || 'anonymous',
    userAge: profile?.userAge,
    hasParentalConsent: profile?.hasParentalConsent || false,
    
    // Status flags
    isReady: !loading && profile !== null,
    needsProfile: !loading && profile === null && isAuthenticated,
    isMinor: profile?.userAge && profile.userAge < 13
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

/**
 * Custom hook to use profile context
 */
export const useProfile = () => {
  const context = useContext(ProfileContext);
  
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  
  return context;
};

/**
 * Higher-order component to require profile
 */
export const withProfile = (Component) => {
  return function ProfiledComponent(props) {
    const { profile, loading, needsProfile } = useProfile();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      );
    }
    
    if (needsProfile) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 m-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Profile Setup Required
          </h3>
          <p className="text-blue-700">
            Please complete your privacy-first profile setup to access this feature.
          </p>
        </div>
      );
    }
    
    return <Component {...props} profile={profile} />;
  };
};

/**
 * Hook to check family features access
 */
export const useFamilyFeatures = () => {
  const { canUseFamilyFeatures, profile, isMinor, hasParentalConsent } = useProfile();
  
  return {
    canUse: canUseFamilyFeatures(),
    reason: !canUseFamilyFeatures() 
      ? (profile?.privacyMode !== 'family-mode' 
          ? 'Family mode not enabled' 
          : (isMinor && !hasParentalConsent 
              ? 'Parental consent required' 
              : 'Unknown restriction'))
      : null,
    needsParentalConsent: isMinor && !hasParentalConsent,
    isInFamilyMode: profile?.privacyMode === 'family-mode'
  };
};

export default ProfileContext;