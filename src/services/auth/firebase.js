/**
 * Firebase Configuration for EcoQuest Wildfire Watch
 * Privacy-first authentication setup for Congressional App Challenge
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  connectAuthEmulator 
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';

// Firebase configuration for Congressional App Challenge demo
// In production, these would be environment variables
const firebaseConfig = {
  // Demo configuration - will fallback to local mode if not configured
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ecoquest-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ecoquest-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ecoquest-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:demo-app-id"
};

// Check if we have valid Firebase configuration
const hasValidFirebaseConfig = import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_PROJECT_ID && 
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('demo');

// Initialize Firebase
let app;
let auth;
let db;
let firebaseAvailable = false;

try {
  if (hasValidFirebaseConfig) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseAvailable = true;
    console.log('📱 Firebase initialized with real configuration');
  } else {
    console.log('📱 Firebase config not found - using local-only mode for demo');
    auth = null;
    db = null;
    firebaseAvailable = false;
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // Fallback to local-only mode
  auth = null;
  db = null;
  firebaseAvailable = false;
}

// Development mode: Use Firebase emulators for testing
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    if (auth && !auth._delegate._config.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099');
    }
    if (db && !db._delegate._settings?.host?.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    console.log('🔧 Connected to Firebase emulators for development');
  } catch (error) {
    console.warn('⚠️ Firebase emulator connection failed:', error.message);
  }
}

/**
 * Privacy-First Anonymous Authentication
 * No personal information collected, perfect for Congressional App Challenge demo
 */
export const signInAnonymousUser = async () => {
  if (!auth || !firebaseAvailable) {
    console.log('🔐 Firebase not available - creating local anonymous user');
    return createLocalAnonymousUser();
  }
  
  try {
    console.log('🔐 Starting Firebase anonymous authentication...');
    const result = await signInAnonymously(auth);
    
    console.log('✅ Firebase anonymous authentication successful');
    console.log('👤 User ID (anonymous):', result.user.uid);
    
    return {
      success: true,
      user: {
        uid: result.user.uid,
        isAnonymous: result.user.isAnonymous,
        metadata: {
          creationTime: result.user.metadata.creationTime,
          lastSignInTime: result.user.metadata.lastSignInTime
        }
      }
    };
  } catch (error) {
    console.error('❌ Firebase authentication failed:', error);
    console.log('🔐 Falling back to local anonymous user');
    return createLocalAnonymousUser();
  }
};

/**
 * Create a local anonymous user for demo purposes
 * This allows the app to function without Firebase
 */
function createLocalAnonymousUser() {
  const localUserId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const localUser = {
    uid: localUserId,
    isAnonymous: true,
    metadata: {
      creationTime: now,
      lastSignInTime: now
    }
  };
  
  // Store in localStorage for persistence
  localStorage.setItem('ecoquest-local-user', JSON.stringify(localUser));
  
  console.log('✅ Local anonymous user created:', localUserId);
  
  // Notify all auth state listeners about the new user
  setTimeout(() => {
    authStateCallbacks.forEach(callback => {
      try {
        callback(localUser);
      } catch (error) {
        console.error('Error in auth state callback:', error);
      }
    });
  }, 50);
  
  return {
    success: true,
    user: localUser
  };
}

// Store auth state change callbacks for local mode
let authStateCallbacks = [];

/**
 * Monitor authentication state changes
 */
export const onAuthStateChange = (callback) => {
  if (!auth || !firebaseAvailable) {
    // Store callback for local auth state changes
    authStateCallbacks.push(callback);
    
    // Check for existing local user and notify immediately
    const localUser = getLocalUser();
    setTimeout(() => callback(localUser), 100);
    
    // Return cleanup function
    return () => {
      authStateCallbacks = authStateCallbacks.filter(cb => cb !== callback);
    };
  }
  
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('👤 Firebase user authenticated:', {
        uid: user.uid,
        isAnonymous: user.isAnonymous,
        lastSignIn: user.metadata.lastSignInTime
      });
    } else {
      console.log('👤 Firebase user signed out');
    }
    callback(user);
  });
};

/**
 * Get local user from localStorage
 */
function getLocalUser() {
  try {
    const stored = localStorage.getItem('ecoquest-local-user');
    if (stored) {
      const localUser = JSON.parse(stored);
      console.log('👤 Found local user:', localUser.uid);
      return localUser;
    }
  } catch (error) {
    console.warn('Error reading local user:', error);
  }
  return null;
}

/**
 * Get current authenticated user
 */
export const getCurrentUser = () => {
  if (auth && firebaseAvailable) {
    return auth.currentUser;
  }
  
  // Return local user if Firebase not available
  return getLocalUser();
};

/**
 * Sign out current user
 */
export const signOutUser = async () => {
  if (auth && firebaseAvailable && auth.currentUser) {
    try {
      await auth.signOut();
      console.log('👋 Firebase user signed out successfully');
    } catch (error) {
      console.error('❌ Firebase sign out failed:', error);
    }
  }
  
  // Always clear local user
  localStorage.removeItem('ecoquest-local-user');
  console.log('👋 Local user signed out successfully');
  
  // Notify auth state listeners about sign out
  setTimeout(() => {
    authStateCallbacks.forEach(callback => {
      try {
        callback(null);
      } catch (error) {
        console.error('Error in auth state callback during sign out:', error);
      }
    });
  }, 50);
  
  return { success: true, message: 'Signed out successfully' };
};

/**
 * Check if Firebase is available and user is online
 */
export const isFirebaseAvailable = () => {
  return firebaseAvailable && auth !== null && db !== null;
};

/**
 * Enable/disable network for offline testing
 */
export const setNetworkEnabled = async (enabled) => {
  if (!db) return;
  
  try {
    if (enabled) {
      await enableNetwork(db);
      console.log('🌐 Network enabled');
    } else {
      await disableNetwork(db);
      console.log('📴 Network disabled');
    }
  } catch (error) {
    console.warn('⚠️ Network toggle failed:', error.message);
  }
};

/**
 * Privacy-first error handling
 * Never expose sensitive information in errors
 */
export const handleAuthError = (error) => {
  const errorCode = error.code;
  
  switch (errorCode) {
    case 'auth/network-request-failed':
      return 'Network connection failed. App will work in offline mode.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/operation-not-allowed':
      return 'Anonymous authentication not enabled.';
    default:
      return 'Authentication service temporarily unavailable. Using offline mode.';
  }
};

// Export Firebase instances for use in other services
export { app, auth, db };

// Export configuration for testing
export const getFirebaseConfig = () => firebaseConfig;