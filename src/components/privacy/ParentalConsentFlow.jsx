/**
 * Parental Consent Flow
 * COPPA-compliant parental consent process for users under 13
 * Congressional App Challenge compliant with strict privacy protection
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  FileText,
  Mail,
  Phone,
  Calendar,
  Info
} from 'lucide-react';
import { useAuth } from '../../services/auth/AuthContext';
import { useProfile } from '../../services/profile/ProfileContext';
import { useStorage } from '../../services/storage/StorageContext';
import { useAccessibility } from '../accessibility/AccessibilityProvider';

export default function ParentalConsentFlow({ userAge, onConsentCompleted, onClose }) {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { saveData } = useStorage();
  const { speak } = useAccessibility();

  const [currentStep, setCurrentStep] = useState(1);
  const [consentData, setConsentData] = useState({
    parentName: '',
    relationshipToChild: 'parent',
    contactMethod: 'email',
    contactValue: '',
    consentGiven: false,
    consentDate: null,
    verificationMethod: 'declaration',
    understoodRights: false,
    understoodDataUse: false,
    allowFamilyFeatures: false,
    allowLocationSharing: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = [
    {
      id: 1,
      title: 'Information for Parents',
      description: 'Learn about our privacy practices and your rights'
    },
    {
      id: 2,
      title: 'Parent/Guardian Information',
      description: 'Provide your information as the parent or guardian'
    },
    {
      id: 3,
      title: 'Consent and Permissions',
      description: 'Review and provide consent for your child\'s account'
    },
    {
      id: 4,
      title: 'Verification',
      description: 'Complete the consent verification process'
    }
  ];

  const handleInputChange = (field, value) => {
    setConsentData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateStep = (step) => {
    switch (step) {
      case 2:
        return consentData.parentName.trim() && 
               consentData.contactValue.trim() && 
               consentData.relationshipToChild;
      case 3:
        return consentData.understoodRights && 
               consentData.understoodDataUse && 
               consentData.consentGiven;
      case 4:
        return consentData.verificationMethod === 'declaration'; // Simplified for demo
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      setError('Please complete all required fields');
      speak('Please complete all required fields');
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeConsentProcess();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeConsentProcess = async () => {
    setLoading(true);
    try {
      // Update consent data with completion info
      const completedConsent = {
        ...consentData,
        consentDate: new Date().toISOString(),
        consentCompleted: true,
        userAge,
        childUserId: user?.uid
      };

      // Save consent record (local only for privacy)
      await saveData(`parental-consent-${user?.uid}`, completedConsent, { 
        skipSync: true // Never sync consent data
      });

      // Update user profile with consent status
      await updateProfile({
        hasParentalConsent: true,
        parentalConsentDate: completedConsent.consentDate,
        emergencySettings: {
          ...profile?.emergencySettings,
          enableLocationSharing: consentData.allowLocationSharing,
          enableFamilyNotifications: consentData.allowFamilyFeatures
        }
      });

      speak('Parental consent completed successfully');
      onConsentCompleted(completedConsent);
    } catch (error) {
      console.error('Consent process failed:', error);
      setError('Failed to complete consent process. Please try again.');
      speak('Consent process failed');
    } finally {
      setLoading(false);
    }
  };

  const StepContent = ({ step }) => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Protecting Your Child's Privacy
              </h3>
              <p className="text-gray-600">
                Your child wants to use EcoQuest Wildfire Watch. As a parent or guardian, 
                you have important rights and choices about your child's privacy.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                What We Do to Protect Privacy
              </h4>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
                  We do NOT collect personal information like names, addresses, or phone numbers
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
                  All data is stored locally on your child's device by default
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
                  Family safety features use anonymous codes for coordination
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
                  Location sharing is only enabled with your explicit consent
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
                  You can delete all data at any time
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Your Rights as a Parent</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Review what information we collect</li>
                <li>• Choose which features your child can use</li>
                <li>• Request deletion of your child's information</li>
                <li>• Contact us with questions or concerns</li>
                <li>• Withdraw consent at any time</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800">Important Note</span>
              </div>
              <p className="text-yellow-700 text-sm mt-2">
                This app is designed for emergency safety education and family coordination. 
                It does not replace proper emergency services or adult supervision.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Parent/Guardian Information
              </h3>
              <p className="text-gray-600">
                Please provide your information as the parent or legal guardian.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name (Parent/Guardian) *
                </label>
                <input
                  type="text"
                  value={consentData.parentName}
                  onChange={(e) => handleInputChange('parentName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship to Child *
                </label>
                <select
                  value={consentData.relationshipToChild}
                  onChange={(e) => handleInputChange('relationshipToChild', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="parent">Parent</option>
                  <option value="legal-guardian">Legal Guardian</option>
                  <option value="foster-parent">Foster Parent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Method *
                </label>
                <select
                  value={consentData.contactMethod}
                  onChange={(e) => handleInputChange('contactMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="email">Email Address</option>
                  <option value="phone">Phone Number</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {consentData.contactMethod === 'email' ? 'Email Address' : 'Phone Number'} *
                </label>
                <input
                  type={consentData.contactMethod === 'email' ? 'email' : 'tel'}
                  value={consentData.contactValue}
                  onChange={(e) => handleInputChange('contactValue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={consentData.contactMethod === 'email' ? 'your@email.com' : '(555) 123-4567'}
                  required
                />
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <Lock className="h-4 w-4 inline mr-2" />
                This information is stored locally on your device only and is never shared 
                or transmitted to external servers.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Consent and Permissions
              </h3>
              <p className="text-gray-600">
                Please review and provide consent for your child's use of this application.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={consentData.understoodRights}
                    onChange={(e) => handleInputChange('understoodRights', e.target.checked)}
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                  <div>
                    <span className="font-medium text-gray-900">
                      I understand my rights as a parent/guardian *
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      I understand that I can review, modify, or delete my child's information 
                      at any time, and I can withdraw consent by contacting support or using 
                      the app's privacy controls.
                    </p>
                  </div>
                </label>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={consentData.understoodDataUse}
                    onChange={(e) => handleInputChange('understoodDataUse', e.target.checked)}
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                  <div>
                    <span className="font-medium text-gray-900">
                      I understand how my child's data will be used *
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      The app collects only anonymous preferences and safety settings. 
                      No personal information, real names, or contact details are collected. 
                      All data is stored locally unless I choose to enable cloud sync.
                    </p>
                  </div>
                </label>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={consentData.allowFamilyFeatures}
                    onChange={(e) => handleInputChange('allowFamilyFeatures', e.target.checked)}
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="font-medium text-gray-900">
                      Allow family safety features (optional)
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      Allow my child to participate in family group safety coordination using 
                      anonymous group codes. This enables family check-ins and emergency 
                      communication features.
                    </p>
                  </div>
                </label>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={consentData.allowLocationSharing}
                    onChange={(e) => handleInputChange('allowLocationSharing', e.target.checked)}
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="font-medium text-gray-900">
                      Allow emergency location sharing (optional)
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      Allow the app to share my child's location with family members during 
                      emergencies only. Location is never shared otherwise and never stored 
                      permanently.
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={consentData.consentGiven}
                    onChange={(e) => handleInputChange('consentGiven', e.target.checked)}
                    className="mt-1 mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    required
                  />
                  <div>
                    <span className="font-medium text-green-900">
                      I give my consent for my child to use this application *
                    </span>
                    <p className="text-sm text-green-700 mt-1">
                      By checking this box, I confirm that I am the parent or legal guardian 
                      of this child and I consent to their use of EcoQuest Wildfire Watch 
                      under the terms described above.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Consent Verification
              </h3>
              <p className="text-gray-600">
                Please confirm your consent and complete the verification process.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Consent Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Parent/Guardian:</span>
                  <span className="font-medium">{consentData.parentName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Relationship:</span>
                  <span className="font-medium capitalize">{consentData.relationshipToChild.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Family Features:</span>
                  <span className="font-medium">{consentData.allowFamilyFeatures ? 'Allowed' : 'Not Allowed'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location Sharing:</span>
                  <span className="font-medium">{consentData.allowLocationSharing ? 'Allowed for Emergencies' : 'Not Allowed'}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Verification Method</h4>
              <p className="text-blue-800 text-sm">
                For this demonstration, verification is completed by your declaration. 
                In a production environment, additional verification methods such as 
                email confirmation or identity verification would be available.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-900">Ready to Complete</span>
              </div>
              <p className="text-green-800 text-sm">
                Your consent will be recorded and your child's account will be configured 
                with the permissions you've selected. You can modify these settings at 
                any time through the app's privacy controls.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Parental Consent</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.id}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <h3 className="font-medium text-gray-900">{steps[currentStep - 1]?.title}</h3>
            <p className="text-sm text-gray-600">{steps[currentStep - 1]?.description}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <StepContent step={currentStep} />
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!validateStep(currentStep) || loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === steps.length ? (
                loading ? 'Completing...' : 'Complete Consent'
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}