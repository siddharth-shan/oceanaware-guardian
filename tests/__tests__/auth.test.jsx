/**
 * Authentication System Tests
 * Tests for privacy-first Firebase authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Firebase before importing our components
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({}))
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  signInAnonymously: vi.fn(() => Promise.resolve({
    user: {
      uid: 'test-anonymous-uid',
      isAnonymous: true,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      }
    }
  })),
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Simulate immediate callback with null user
    callback(null);
    return vi.fn(); // Return unsubscribe function
  }),
  connectAuthEmulator: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  connectFirestoreEmulator: vi.fn(),
  enableNetwork: vi.fn(),
  disableNetwork: vi.fn()
}));

import { AuthProvider, useAuth } from '../../src/services/auth/AuthContext';
import PrivacyFirstAuth from '../../src/components/auth/PrivacyFirstAuth';
import AccessibilityProvider from '../../src/components/accessibility/AccessibilityProvider';

// Test component to access auth context
function TestAuthComponent() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="auth-status">
        {auth.isAuthenticated() ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="loading-status">
        {auth.loading ? 'loading' : 'ready'}
      </div>
      <div data-testid="user-id">
        {auth.user?.uid || 'no-user'}
      </div>
      <button 
        data-testid="signin-btn" 
        onClick={auth.signInAnonymous}
      >
        Sign In
      </button>
    </div>
  );
}

function renderWithProviders(component) {
  return render(
    <AccessibilityProvider>
      <AuthProvider>
        {component}
      </AuthProvider>
    </AccessibilityProvider>
  );
}

describe('Authentication System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthContext', () => {
    it('provides initial unauthenticated state', async () => {
      renderWithProviders(<TestAuthComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('loading-status')).toHaveTextContent('ready');
        expect(screen.getByTestId('user-id')).toHaveTextContent('no-user');
      });
    });

    it('handles anonymous sign in', async () => {
      const { signInAnonymously } = await import('firebase/auth');
      
      renderWithProviders(<TestAuthComponent />);
      
      const signInBtn = screen.getByTestId('signin-btn');
      fireEvent.click(signInBtn);
      
      await waitFor(() => {
        expect(signInAnonymously).toHaveBeenCalled();
      });
    });

    it('provides authentication status methods', async () => {
      renderWithProviders(<TestAuthComponent />);
      
      await waitFor(() => {
        const authStatus = screen.getByTestId('auth-status');
        expect(authStatus).toBeInTheDocument();
      });
    });
  });

  describe('PrivacyFirstAuth Component', () => {
    it('renders privacy choice step initially', () => {
      renderWithProviders(<PrivacyFirstAuth />);
      
      expect(screen.getByText('Choose Your Privacy Mode')).toBeInTheDocument();
      expect(screen.getByText('Anonymous Mode')).toBeInTheDocument();
      expect(screen.getByText('Family Safety Mode')).toBeInTheDocument();
    });

    it('shows privacy details when requested', async () => {
      renderWithProviders(<PrivacyFirstAuth />);
      
      const showDetailsBtn = screen.getByText(/Show detailed privacy information/);
      fireEvent.click(showDetailsBtn);
      
      await waitFor(() => {
        expect(screen.getByText('🔒 Your Privacy Rights')).toBeInTheDocument();
        expect(screen.getByText(/We never collect personal information/)).toBeInTheDocument();
      });
    });

    it('handles anonymous mode selection', async () => {
      renderWithProviders(<PrivacyFirstAuth />);
      
      const anonymousBtn = screen.getByText('Anonymous Mode').closest('button');
      fireEvent.click(anonymousBtn);
      
      await waitFor(() => {
        expect(screen.getByText('Anonymous Access')).toBeInTheDocument();
      });
    });

    it('handles family mode selection with age verification', async () => {
      renderWithProviders(<PrivacyFirstAuth />);
      
      const familyBtn = screen.getByText('Family Safety Mode').closest('button');
      fireEvent.click(familyBtn);
      
      await waitFor(() => {
        expect(screen.getByText('Age Verification')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your age')).toBeInTheDocument();
      });
    });

    it('shows parental consent for users under 13', async () => {
      renderWithProviders(<PrivacyFirstAuth />);
      
      // Select family mode
      const familyBtn = screen.getByText('Family Safety Mode').closest('button');
      fireEvent.click(familyBtn);
      
      await waitFor(() => {
        const ageInput = screen.getByPlaceholderText('Enter your age');
        fireEvent.change(ageInput, { target: { value: '12' } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Parental Consent Required')).toBeInTheDocument();
        expect(screen.getByText(/parent or guardian's permission/)).toBeInTheDocument();
      });
    });
  });

  describe('Privacy Compliance', () => {
    it('requires parental consent for users under 13', async () => {
      renderWithProviders(<PrivacyFirstAuth />);
      
      // Navigate to age verification
      const familyBtn = screen.getByText('Family Safety Mode').closest('button');
      fireEvent.click(familyBtn);
      
      await waitFor(() => {
        const ageInput = screen.getByPlaceholderText('Enter your age');
        fireEvent.change(ageInput, { target: { value: '12' } });
        
        const continueBtn = screen.getByText('Continue to Setup');
        expect(continueBtn).toBeDisabled();
      });
    });

    it('allows users 13+ to proceed without parental consent', async () => {
      renderWithProviders(<PrivacyFirstAuth />);
      
      // Navigate to age verification
      const familyBtn = screen.getByText('Family Safety Mode').closest('button');
      fireEvent.click(familyBtn);
      
      await waitFor(() => {
        const ageInput = screen.getByPlaceholderText('Enter your age');
        fireEvent.change(ageInput, { target: { value: '16' } });
        
        const continueBtn = screen.getByText('Continue to Setup');
        expect(continueBtn).not.toBeDisabled();
      });
    });
  });

  describe('Offline Handling', () => {
    it('handles Firebase unavailable gracefully', async () => {
      // Mock Firebase as unavailable
      vi.mocked(vi.doMock)('../../src/services/auth/firebase', () => ({
        isFirebaseAvailable: () => false,
        signInAnonymousUser: () => Promise.reject(new Error('Firebase not available - using local-only mode')),
        onAuthStateChange: (callback) => {
          callback(null);
          return () => {};
        }
      }));
      
      renderWithProviders(<TestAuthComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });
    });
  });
});

describe('Privacy Features', () => {
  it('never exposes sensitive user information', async () => {
    renderWithProviders(<TestAuthComponent />);
    
    // Check that no personal information is rendered
    const component = screen.getByTestId('auth-status').closest('div');
    const textContent = component.textContent;
    
    // Ensure no email, phone, or personal data patterns
    expect(textContent).not.toMatch(/@/);
    expect(textContent).not.toMatch(/\+\d/);
    expect(textContent).not.toMatch(/\b\d{3}-\d{3}-\d{4}\b/);
  });

  it('uses anonymous authentication only', async () => {
    renderWithProviders(<TestAuthComponent />);
    
    const signInBtn = screen.getByTestId('signin-btn');
    fireEvent.click(signInBtn);
    
    const { signInAnonymously } = await import('firebase/auth');
    
    await waitFor(() => {
      expect(signInAnonymously).toHaveBeenCalled();
    });
  });
});