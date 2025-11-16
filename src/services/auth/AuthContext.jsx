/**
 * Authentication Context for EcoQuest Wildfire Watch
 * Privacy-first authentication state management
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInAnonymousUser, 
  onAuthStateChange, 
  signOutUser,
  getCurrentUser,
  isFirebaseAvailable,
  handleAuthError
} from './firebase';

const AuthContext = createContext({});

/**
 * Authentication Provider Component
 * Manages authentication state and provides privacy-first auth methods
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(isFirebaseAvailable());

  // Monitor authentication state changes
  useEffect(() => {
    console.log('🔐 Initializing authentication context...');
    
    const unsubscribe = onAuthStateChange((authUser) => {
      if (authUser) {
        // Create privacy-safe user object (works for both Firebase and local users)
        const safeUser = {
          uid: authUser.uid,
          isAnonymous: authUser.isAnonymous,
          createdAt: authUser.metadata?.creationTime || authUser.metadata?.createdAt,
          lastSignIn: authUser.metadata?.lastSignInTime || authUser.metadata?.lastSignInTime,
          isAuthenticated: true,
          isLocal: authUser.uid?.startsWith('local-') || false
        };
        setUser(safeUser);
        console.log('✅ User authenticated in context:', safeUser.uid, safeUser.isLocal ? '(local)' : '(firebase)');
      } else {
        setUser(null);
        console.log('👤 No authenticated user');
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 App is online');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log('📴 App is offline - using local data only');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Sign in anonymously - privacy-first approach
   */
  const signInAnonymous = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Attempting anonymous sign-in...');
      const result = await signInAnonymousUser();
      
      if (result.success) {
        console.log('✅ Anonymous sign-in successful');
        // User state will be updated by onAuthStateChange listener
        return { success: true };
      }
    } catch (error) {
      const friendlyError = handleAuthError(error);
      setError(friendlyError);
      console.error('❌ Anonymous sign-in failed:', friendlyError);
      return { success: false, error: friendlyError };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👋 Signing out user...');
      await signOutUser();
      
      // Clear any local data related to the user
      localStorage.removeItem('ecoquest-user-preferences');
      sessionStorage.clear();
      
      console.log('✅ Sign out successful');
      return { success: true };
    } catch (error) {
      const friendlyError = handleAuthError(error);
      setError(friendlyError);
      console.error('❌ Sign out failed:', friendlyError);
      return { success: false, error: friendlyError };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get current user info (privacy-safe)
   */
  const getUserInfo = () => {
    return user;
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = () => {
    return user !== null && user.isAuthenticated;
  };

  /**
   * Check if user needs to authenticate for family features
   */
  const needsAuthForFamily = () => {
    return !isAuthenticated();
  };

  /**
   * Clear any error state
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Get authentication status for debugging
   */
  const getAuthStatus = () => {
    return {
      isAuthenticated: isAuthenticated(),
      isAnonymous: user?.isAnonymous || false,
      isOnline,
      isFirebaseAvailable: isFirebaseAvailable(),
      userId: user?.uid || null,
      hasError: error !== null,
      loading
    };
  };

  // Context value with all auth methods and state
  const value = {
    // State
    user,
    loading,
    error,
    isOnline,
    
    // Methods
    signInAnonymous,
    signOut,
    getUserInfo,
    isAuthenticated,
    needsAuthForFamily,
    clearError,
    getAuthStatus,
    
    // Computed properties
    isReady: !loading,
    canUseOnlineFeatures: isOnline && isFirebaseAvailable(),
    userDisplayName: user ? `Anonymous User (${user.uid.slice(0, 8)}...)` : 'Not signed in'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Higher-order component to require authentication
 */
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 m-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Authentication Required
          </h3>
          <p className="text-yellow-700">
            This feature requires anonymous authentication to protect your family's privacy and enable secure communication.
          </p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

export default AuthContext;