/**
 * Age Verification Component
 * COPPA-compliant age verification for new users
 * Congressional App Challenge compliant with privacy protection
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../services/auth/AuthContext';
import { useProfile } from '../../services/profile/ProfileContext';
import { useAccessibility } from '../accessibility/AccessibilityProvider';
import ParentalConsentFlow from './ParentalConsentFlow';

export default function AgeVerification({ onVerificationComplete, onSkip }) {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { speak } = useAccessibility();

  const [step, setStep] = useState(1);
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [userAge, setUserAge] = useState(null);
  const [showConsentFlow, setShowConsentFlow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 100;
  const maxYear = currentYear;

  const calculateAge = (year, month) => {
    const now = new Date();
    const birthDate = new Date(year, month - 1, 1);
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0) {
      age--;
    }
    
    return age;
  };

  const handleAgeSubmit = () => {
    if (!birthYear || !birthMonth) {
      setError('Please select both birth year and month');
      speak('Please select both birth year and month');
      return;
    }

    const year = parseInt(birthYear);
    const month = parseInt(birthMonth);
    
    if (year < minYear || year > maxYear) {
      setError('Please enter a valid birth year');
      speak('Please enter a valid birth year');
      return;
    }

    const calculatedAge = calculateAge(year, month);
    setUserAge(calculatedAge);
    setError(null);
    
    if (calculatedAge < 13) {
      setStep(2); // Show COPPA information
      speak('Additional privacy protections will be applied for users under 13');
    } else {
      setStep(3); // Show completion for 13+
      speak(`Age verified. You are ${calculatedAge} years old.`);
    }
  };

  const handleVerificationComplete = async (consentData = null) => {
    setLoading(true);
    try {
      const updateData = {
        userAge,
        ageVerifiedAt: new Date().toISOString()
      };

      if (userAge < 13 && consentData) {
        updateData.hasParentalConsent = true;
        updateData.parentalConsentDate = consentData.consentDate;
        updateData.emergencySettings = {
          ...profile?.emergencySettings,
          enableLocationSharing: consentData.allowLocationSharing,
          enableFamilyNotifications: consentData.allowFamilyFeatures
        };
      }

      await updateProfile(updateData);
      
      speak('Age verification completed successfully');
      onVerificationComplete({
        age: userAge,
        requiresParentalConsent: userAge < 13,
        hasParentalConsent: userAge >= 13 || !!consentData,
        consentData
      });
    } catch (error) {
      console.error('Age verification failed:', error);
      setError('Failed to complete verification. Please try again.');
      speak('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const StepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Age Verification
              </h2>
              <p className="text-gray-600 mb-6">
                To ensure we provide appropriate privacy protections, please verify your age.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Privacy Protection</span>
              </div>
              <p className="text-blue-800 text-sm">
                Your age helps us apply the right privacy protections. Users under 13 receive 
                additional protections under COPPA (Children's Online Privacy Protection Act).
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Year *
                </label>
                <input
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  min={minYear}
                  max={maxYear}
                  placeholder="e.g., 1990"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Month *
                </label>
                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Month</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                We only collect birth year and month for age verification. This information 
                is stored locally on your device and never shared.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleAgeSubmit}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Verify Age
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
              
              <button
                onClick={onSkip}
                className="w-full text-gray-600 hover:text-gray-800 py-2 px-4 text-sm underline"
              >
                Skip for now (Limited features)
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Additional Privacy Protections
              </h2>
              <p className="text-gray-600 mb-6">
                Since you're under 13, we need parental consent for you to use this app.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                COPPA Protection Required
              </h3>
              <div className="space-y-2 text-yellow-800 text-sm">
                <p>As someone under 13, you're protected by COPPA laws that require:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Parental consent before using the app</li>
                  <li>Additional privacy protections for your data</li>
                  <li>Limited data collection and sharing</li>
                  <li>Parent/guardian control over your account</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
              <p className="text-blue-800 text-sm">
                A parent or guardian will need to complete a consent process that explains 
                how the app works and gives permission for you to use it safely.
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={() => setShowConsentFlow(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Users className="h-4 w-4 mr-2" />
                Get Parental Consent
              </button>
              
              <p className="text-center text-sm text-gray-600">
                Ask a parent or guardian to complete the consent process
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Age Verified Successfully
              </h2>
              <p className="text-gray-600 mb-6">
                You are {userAge} years old. You can now access all app features.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-3">Your Privacy Rights</h3>
              <div className="space-y-2 text-green-800 text-sm">
                <p>As a user 13 or older, you have full control over:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Your privacy settings and data sharing preferences</li>
                  <li>Family safety features and group coordination</li>
                  <li>Emergency location sharing (optional)</li>
                  <li>Cloud sync settings (optional)</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Privacy-First Design</h4>
              <p className="text-blue-800 text-sm">
                EcoQuest Wildfire Watch is designed with privacy in mind. All your data 
                is stored locally by default, and you control what (if anything) gets 
                shared or synced.
              </p>
            </div>

            <button
              onClick={handleVerificationComplete}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? 'Completing...' : 'Complete Verification'}
              <CheckCircle className="h-4 w-4 ml-2" />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 overflow-y-auto">
            <StepContent />
          </div>
        </div>
      </div>

      {showConsentFlow && (
        <ParentalConsentFlow
          userAge={userAge}
          onConsentCompleted={(consentData) => {
            setShowConsentFlow(false);
            handleVerificationComplete(consentData);
          }}
          onClose={() => setShowConsentFlow(false)}
        />
      )}
    </>
  );
}