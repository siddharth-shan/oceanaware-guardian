import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Shield, Users, Settings, Info } from 'lucide-react';
import { useProfile } from '../../services/profile/ProfileContext';

export default function ProfileSetupWizard({ onComplete }) {
  const { profile, updateProfile } = useProfile();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    preferences: {
      notifications: true,
      location: false,
      dataSharing: false
    },
    emergencySettings: {
      enableEmergencyMode: true,
      autoShare: false,
      emergencyContacts: []
    }
  });

  const [expandedSection, setExpandedSection] = useState(null);
  const [showingPrivacyInfo, setShowingPrivacyInfo] = useState(false);

  const handlePreferenceChange = (category, key, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await updateProfile({
        ...formData,
        setupCompleted: true,
        completedAt: new Date().toISOString()
      });
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Profile setup error:', error);
    }
  };

  const PrivacyInfoBox = ({ title, children }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-2">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-900 mb-1">{title}</h4>
          <p className="text-sm text-blue-700">{children}</p>
        </div>
      </div>
    </div>
  );

  const ExpandableSection = ({ icon: Icon, title, description, isExpanded, onToggle, children }) => (
    <div className="border border-gray-200 rounded-lg mb-3">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center space-x-3">
          <Icon className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-6 bg-white">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Profile Setup</span>
          <span className="text-sm text-gray-500">{step}/3</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Welcome & Privacy Overview */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Welcome to Family Safety
            </h2>
            <p className="text-gray-600">
              Let's set up your profile to keep your family safe while protecting your privacy.
            </p>
          </div>

          <PrivacyInfoBox title="Your Privacy Matters">
            All data stays on your device unless you explicitly choose to share. 
            We follow privacy-first design principles to keep your family information secure.
          </PrivacyInfoBox>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="font-medium text-green-900">No personal data required</p>
                <p className="text-sm text-green-700">Anonymous by default</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="font-medium text-green-900">Local storage first</p>
                <p className="text-sm text-green-700">Your device keeps your data</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="font-medium text-green-900">You control sharing</p>
                <p className="text-sm text-green-700">Only share what you choose</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleNextStep}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Continue Setup
          </button>
        </div>
      )}

      {/* Step 2: Preferences */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <Settings className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Your Preferences
            </h2>
            <p className="text-gray-600">
              Customize how the app works for you.
            </p>
          </div>

          <ExpandableSection
            icon={Settings}
            title="App Notifications"
            description="Control when and how you receive alerts"
            isExpanded={expandedSection === 'notifications'}
            onToggle={() => setExpandedSection(
              expandedSection === 'notifications' ? null : 'notifications'
            )}
          >
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Fire risk alerts
                </span>
                <input
                  type="checkbox"
                  checked={formData.preferences.notifications}
                  onChange={(e) => handlePreferenceChange('preferences', 'notifications', e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </label>
              <p className="text-xs text-gray-500">
                Get notified about high fire risk conditions in your area
              </p>
            </div>
          </ExpandableSection>

          <ExpandableSection
            icon={Shield}
            title="Location Services"
            description="Help us provide relevant safety information"
            isExpanded={expandedSection === 'location'}
            onToggle={() => setExpandedSection(
              expandedSection === 'location' ? null : 'location'
            )}
          >
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Use current location
                </span>
                <input
                  type="checkbox"
                  checked={formData.preferences.location}
                  onChange={(e) => handlePreferenceChange('preferences', 'location', e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </label>
              <p className="text-xs text-gray-500">
                Location stays on your device. Used only for local fire risk assessment.
              </p>
            </div>
          </ExpandableSection>

          <div className="flex space-x-3">
            <button
              onClick={handlePrevStep}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Emergency Settings */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <Users className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Emergency Settings
            </h2>
            <p className="text-gray-600">
              Configure how family safety features work.
            </p>
          </div>

          <ExpandableSection
            icon={Shield}
            title="Emergency Mode"
            description="Quick access to safety features during emergencies"
            isExpanded={expandedSection === 'emergency'}
            onToggle={() => setExpandedSection(
              expandedSection === 'emergency' ? null : 'emergency'
            )}
          >
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Enable emergency mode
                </span>
                <input
                  type="checkbox"
                  checked={formData.emergencySettings.enableEmergencyMode}
                  onChange={(e) => handlePreferenceChange('emergencySettings', 'enableEmergencyMode', e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </label>
              <p className="text-xs text-gray-500">
                Provides quick access to communication and location sharing during emergencies
              </p>
            </div>
          </ExpandableSection>

          <PrivacyInfoBox title="Setup Complete!">
            Your profile is configured with privacy-first settings. You can always change these preferences later in Settings.
          </PrivacyInfoBox>

          <div className="flex space-x-3">
            <button
              onClick={handlePrevStep}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Complete Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}