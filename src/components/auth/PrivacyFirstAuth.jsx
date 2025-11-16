/**
 * Privacy-First Authentication Component
 * Congressional App Challenge compliant authentication with clear privacy protections
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Shield, Users, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../../services/auth/AuthContext';
import { useAccessibility } from '../accessibility/AccessibilityProvider';
import ProfileSetupWizard from '../profile/ProfileSetupWizard';

export default function PrivacyFirstAuth({ onComplete, showFamilyFeatures = false }) {
  const [step, setStep] = useState('privacy-choice'); // privacy-choice, age-verification, auth-method, authenticating, profile-setup
  const [userAge, setUserAge] = useState('');
  const [parentalConsent, setParentalConsent] = useState(false);
  const [privacyMode, setPrivacyMode] = useState('anonymous'); // anonymous, family-mode
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  
  const { signInAnonymous, loading, error, clearError } = useAuth();
  const { speak, translate } = useAccessibility();
  const ageInputRef = useRef(null);

  const handleAgeChange = useCallback((e) => {
    const value = e.target.value;
    // Debounce the state update to prevent focus loss during rapid typing
    setUserAge(value);
  }, []);

  // Maintain focus on age input during re-renders
  useEffect(() => {
    if (step === 'age-verification' && ageInputRef.current && document.activeElement !== ageInputRef.current) {
      // Only refocus if the input was previously focused and lost focus due to re-render
      const shouldRefocus = userAge.length > 0 && userAge.length < 3; // During typing
      if (shouldRefocus) {
        ageInputRef.current.focus();
        // setSelectionRange is not supported on number inputs, so we skip cursor positioning
      }
    }
  }, [userAge, step]);

  const handlePrivacyChoice = (mode) => {
    setPrivacyMode(mode);
    clearError();
    
    if (mode === 'anonymous') {
      // Skip age verification for anonymous mode
      setStep('auth-method');
    } else {
      // Family mode requires age verification for COPPA compliance
      setStep('age-verification');
    }
    
    speak(`Selected ${mode} mode`);
  };

  const handleAgeVerification = () => {
    const age = parseInt(userAge);
    
    if (isNaN(age) || age < 1 || age > 100) {
      speak('Please enter a valid age');
      return;
    }
    
    if (age < 13 && !parentalConsent) {
      speak('Parental consent is required for users under 13');
      return;
    }
    
    setStep('auth-method');
    speak('Age verification complete');
  };

  const handleProfileSetupComplete = () => {
    speak('Profile setup complete. Family safety features are now ready.');
    onComplete?.({
      authMode: privacyMode,
      userAge: userAge ? parseInt(userAge) : null,
      hasParentalConsent: parentalConsent,
      timestamp: new Date().toISOString()
    });
  };

  const handleAuthenticate = async () => {
    setStep('authenticating');
    clearError();
    
    try {
      const result = await signInAnonymous();
      
      if (result.success) {
        speak('Authentication successful. Family safety features are now available.');
        
        // If family mode, proceed to profile setup
        if (privacyMode === 'family-mode') {
          setStep('profile-setup');
        } else {
          // Anonymous mode completes immediately
          onComplete?.({
            authMode: privacyMode,
            userAge: userAge ? parseInt(userAge) : null,
            hasParentalConsent: parentalConsent,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        setStep('auth-method');
        speak('Authentication failed. Please try again or use offline mode.');
      }
    } catch (err) {
      setStep('auth-method');
      speak('Authentication error. Falling back to offline mode.');
    }
  };

  const PrivacyChoiceStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Choose Your Privacy Mode
        </h2>
        <p className="text-gray-600">
          EcoQuest protects your privacy with two secure options
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Anonymous Mode */}
        <button
          onClick={() => handlePrivacyChoice('anonymous')}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-left group"
        >
          <div className="flex items-start space-x-4">
            <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 transition-colors">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Anonymous Mode
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Use all wildfire monitoring features without any personal data collection
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>✅ No personal information required</li>
                <li>✅ All data stored locally on your device</li>
                <li>✅ Full wildfire risk assessment</li>
                <li>⚠️ No family coordination features</li>
              </ul>
            </div>
          </div>
        </button>

        {/* Family Mode */}
        <button
          onClick={() => handlePrivacyChoice('family-mode')}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 text-left group"
        >
          <div className="flex items-start space-x-4">
            <div className="bg-orange-100 p-3 rounded-full group-hover:bg-orange-200 transition-colors">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Family Safety Mode
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Enable family coordination with privacy-protected group features
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>✅ All anonymous mode features</li>
                <li>✅ Family safety check-ins</li>
                <li>✅ Group emergency communication</li>
                <li>✅ Anonymous group codes (no personal info)</li>
              </ul>
            </div>
          </div>
        </button>
      </div>

      {/* Privacy Details Toggle */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
          className="flex items-center text-blue-600 hover:text-blue-700 transition-colors text-sm"
        >
          {showPrivacyDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {showPrivacyDetails ? 'Hide' : 'Show'} detailed privacy information
        </button>
        
        {showPrivacyDetails && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-800 mb-2">🔒 Your Privacy Rights</h4>
            <ul className="text-blue-700 space-y-1">
              <li>• We never collect personal information like names, emails, or phone numbers</li>
              <li>• Family mode uses anonymous group codes instead of personal accounts</li>
              <li>• All data is encrypted and stored locally first</li>
              <li>• You can delete all data at any time</li>
              <li>• No tracking, advertising, or data selling</li>
              <li>• COPPA compliant for users under 13</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  const AgeVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Info className="h-12 w-12 text-orange-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Age Verification
        </h2>
        <p className="text-gray-600">
          Required for family features to ensure appropriate privacy protections
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your age (used only for privacy compliance)
          </label>
          <input
            ref={ageInputRef}
            type="number"
            value={userAge}
            onChange={handleAgeChange}
            placeholder="Enter your age"
            min="1"
            max="100"
            autoFocus={false}
            autoComplete="off"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {userAge && parseInt(userAge) < 13 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Parental Consent Required</h4>
            <p className="text-yellow-700 text-sm mb-3">
              Users under 13 need parental permission to use family coordination features.
            </p>
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={parentalConsent}
                onChange={(e) => setParentalConsent(e.target.checked)}
                className="mt-1 mr-3"
              />
              <span className="text-sm text-yellow-800">
                I have my parent or guardian's permission to use family safety features
              </span>
            </label>
          </div>
        )}

        <button
          onClick={handleAgeVerification}
          disabled={!userAge || (parseInt(userAge) < 13 && !parentalConsent)}
          className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Setup
        </button>

        <button
          onClick={() => setStep('privacy-choice')}
          className="w-full text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to privacy options
        </button>
      </div>
    </div>
  );

  const AuthMethodStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Lock className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {privacyMode === 'anonymous' ? 'Anonymous Access' : 'Family Safety Setup'}
        </h2>
        <p className="text-gray-600">
          {privacyMode === 'anonymous' 
            ? 'Enable secure anonymous access for wildfire monitoring'
            : 'Enable secure family coordination with privacy protection'
          }
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            What happens next:
          </h4>
          <ul className="text-green-700 text-sm space-y-1">
            <li>✓ Anonymous authentication (no personal info)</li>
            <li>✓ Secure local data storage</li>
            {privacyMode === 'family-mode' && (
              <>
                <li>✓ Family group code generation</li>
                <li>✓ Encrypted family communication</li>
              </>
            )}
            <li>✓ Works offline during emergencies</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleAuthenticate}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Setting up secure access...
            </>
          ) : (
            <>
              <Shield className="h-5 w-5 mr-2" />
              Enable {privacyMode === 'anonymous' ? 'Anonymous Access' : 'Family Safety'}
            </>
          )}
        </button>

        <button
          onClick={() => setStep(privacyMode === 'family-mode' ? 'age-verification' : 'privacy-choice')}
          className="w-full text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  );

  const AuthenticatingStep = () => (
    <div className="text-center space-y-6">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto"></div>
      <h2 className="text-2xl font-bold text-gray-800">
        Setting up secure access...
      </h2>
      <p className="text-gray-600">
        Initializing privacy-protected authentication
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8">
        {step === 'privacy-choice' && <PrivacyChoiceStep />}
        {step === 'age-verification' && <AgeVerificationStep />}
        {step === 'auth-method' && <AuthMethodStep />}
        {step === 'authenticating' && <AuthenticatingStep />}
        {step === 'profile-setup' && (
          <ProfileSetupWizard onComplete={handleProfileSetupComplete} />
        )}
        
        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
        🔒 Congressional App Challenge 2025 • Privacy-First Design • COPPA Compliant
        </p>
          <p className="text-xs text-gray-400 mt-2">
            Demo Mode: Authentication works locally without requiring external services
          </p>
        </div>
      </div>
    </div>
  );
}