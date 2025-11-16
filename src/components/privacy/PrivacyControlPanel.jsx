/**
 * Privacy Control Panel
 * Comprehensive privacy controls with COPPA compliance
 * Congressional App Challenge compliant with full user control
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Settings,
  Users,
  Cloud,
  HardDrive,
  Calendar,
  Database
} from 'lucide-react';
import { useAuth } from '../../services/auth/AuthContext';
import { useProfile } from '../../services/profile/ProfileContext';
import { useStorage } from '../../services/storage/StorageContext';
import { useAccessibility } from '../accessibility/AccessibilityProvider';

export default function PrivacyControlPanel({ isOpen, onClose }) {
  const { user, isAuthenticated } = useAuth();
  const { profile, updateProfile, updatePreferences, deleteAllData, exportData: exportProfileData } = useProfile();
  const { 
    storageStats, 
    syncStatus, 
    enableCloudSync, 
    disableCloudSync, 
    isCloudSyncEnabled, 
    exportAllData, 
    clearAllData,
    getHealthStatus 
  } = useStorage();
  const { speak } = useAccessibility();

  const [activeTab, setActiveTab] = useState('overview');
  const [confirmDeletion, setConfirmDeletion] = useState('');
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [privacySettings, setPrivacySettings] = useState({
    allowCloudSync: false,
    dataRetentionDays: 30,
    shareAnalytics: false,
    allowLocationSharing: false,
    enableFamilyFeatures: false
  });

  useEffect(() => {
    if (profile) {
      setPrivacySettings({
        allowCloudSync: isCloudSyncEnabled(),
        dataRetentionDays: profile.dataRetentionDays || 30,
        shareAnalytics: false, // Always false for privacy
        allowLocationSharing: profile.emergencySettings?.enableLocationSharing || false,
        enableFamilyFeatures: profile.privacyMode === 'family-mode'
      });
    }
  }, [profile, isCloudSyncEnabled]);

  if (!isOpen) return null;

  const handlePrivacySettingChange = async (setting, value) => {
    setLoading(true);
    try {
      const updatedSettings = { ...privacySettings, [setting]: value };
      setPrivacySettings(updatedSettings);

      switch (setting) {
        case 'allowCloudSync':
          if (value) {
            const result = await enableCloudSync(true);
            if (!result.success) {
              setPrivacySettings(prev => ({ ...prev, [setting]: !value }));
              speak('Failed to enable cloud sync');
            } else {
              speak('Cloud sync enabled with user consent');
            }
          } else {
            await disableCloudSync(false);
            speak('Cloud sync disabled');
          }
          break;
          
        case 'dataRetentionDays':
          await updateProfile({ dataRetentionDays: value });
          speak(`Data retention set to ${value} days`);
          break;
          
        case 'allowLocationSharing':
          await updateProfile({
            emergencySettings: {
              ...profile.emergencySettings,
              enableLocationSharing: value
            }
          });
          speak(value ? 'Location sharing enabled for emergencies' : 'Location sharing disabled');
          break;
          
        case 'enableFamilyFeatures':
          await updateProfile({
            privacyMode: value ? 'family-mode' : 'anonymous'
          });
          speak(value ? 'Family features enabled' : 'Family features disabled');
          break;
      }
    } catch (error) {
      console.error('Privacy setting update failed:', error);
      speak('Failed to update privacy setting');
      // Revert the setting
      setPrivacySettings(prev => ({ ...prev, [setting]: !value }));
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const result = await exportAllData();
      if (result.success) {
        setExportData(result.data);
        
        // Create downloadable file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ecoquest-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        speak('Data exported successfully');
      } else {
        speak('Failed to export data');
      }
    } catch (error) {
      console.error('Export failed:', error);
      speak('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (confirmDeletion !== 'DELETE ALL DATA') {
      speak('Please type DELETE ALL DATA to confirm');
      return;
    }

    setLoading(true);
    try {
      const result = await clearAllData('CLEAR_ALL_DATA', true);
      if (result.success) {
        await deleteAllData();
        speak('All data deleted successfully');
        onClose();
        // Redirect to home or show confirmation
        window.location.reload();
      } else {
        speak('Failed to delete data');
      }
    } catch (error) {
      console.error('Data deletion failed:', error);
      speak('Data deletion failed');
    } finally {
      setLoading(false);
    }
  };

  const getPrivacyScore = () => {
    let score = 100; // Start with perfect privacy
    if (privacySettings.allowCloudSync) score -= 20;
    if (privacySettings.allowLocationSharing) score -= 15;
    if (privacySettings.enableFamilyFeatures) score -= 10;
    return Math.max(score, 0);
  };

  const getDataStorageInfo = () => {
    const healthStatus = getHealthStatus();
    return {
      totalSize: storageStats?.local?.totalSize || 0,
      itemCount: storageStats?.local?.itemCount || 0,
      cloudEnabled: isCloudSyncEnabled(),
      lastSync: storageStats?.cloud?.lastSync,
      healthy: healthStatus?.isInitialized || false
    };
  };

  const tabs = [
    { id: 'overview', label: 'Privacy Overview', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'consent', label: 'Consent & Controls', icon: Lock },
    { id: 'export', label: 'Export & Delete', icon: Download }
  ];

  const TabContent = ({ tabId }) => {
    switch (tabId) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Privacy Score */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Privacy Score</h3>
                <div className="text-3xl font-bold text-green-600">{getPrivacyScore()}/100</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getPrivacyScore()}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Your privacy settings provide strong protection with minimal data collection.
              </p>
            </div>

            {/* Current Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <HardDrive className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-gray-800">Local Storage</h4>
                </div>
                <p className="text-sm text-gray-600">
                  {getDataStorageInfo().itemCount} items stored locally
                </p>
                <p className="text-xs text-gray-500">
                  Size: {(getDataStorageInfo().totalSize / 1024).toFixed(1)} KB
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Cloud className="h-5 w-5 text-gray-400 mr-2" />
                  <h4 className="font-semibold text-gray-800">Cloud Sync</h4>
                </div>
                <p className="text-sm text-gray-600">
                  {isCloudSyncEnabled() ? 'Enabled with consent' : 'Disabled for privacy'}
                </p>
                {isCloudSyncEnabled() && getDataStorageInfo().lastSync && (
                  <p className="text-xs text-gray-500">
                    Last sync: {new Date(getDataStorageInfo().lastSync).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* COPPA Compliance */}
            {profile?.userAge && profile.userAge < 13 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-yellow-600 mr-2" />
                  <h4 className="font-semibold text-yellow-800">COPPA Protection Active</h4>
                </div>
                <p className="text-sm text-yellow-700">
                  Enhanced privacy protections are active for users under 13. 
                  {profile.hasParentalConsent ? ' Parental consent verified.' : ' Parental consent required for some features.'}
                </p>
              </div>
            )}
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Storage Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Cloud Synchronization</label>
                    <p className="text-sm text-gray-600">Sync preferences across devices (optional)</p>
                  </div>
                  <button
                    onClick={() => handlePrivacySettingChange('allowCloudSync', !privacySettings.allowCloudSync)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.allowCloudSync ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    disabled={loading}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        privacySettings.allowCloudSync ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Data Retention</label>
                    <p className="text-sm text-gray-600">How long to keep your data</p>
                  </div>
                  <select
                    value={privacySettings.dataRetentionDays}
                    onChange={(e) => handlePrivacySettingChange('dataRetentionDays', parseInt(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                    disabled={loading}
                  >
                    <option value={7}>1 week</option>
                    <option value={30}>1 month</option>
                    <option value={90}>3 months</option>
                    <option value={365}>1 year</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">What Data We Store</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700">Anonymous User ID</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700">App Preferences</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700">Emergency Settings</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700">Family Group Codes</span>
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>We do NOT store:</strong> Real names, addresses, phone numbers, emails, 
                  or any personally identifiable information.
                </p>
              </div>
            </div>
          </div>
        );

      case 'consent':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Feature Controls</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Emergency Location Sharing</label>
                    <p className="text-sm text-gray-600">Share location during emergencies only</p>
                  </div>
                  <button
                    onClick={() => handlePrivacySettingChange('allowLocationSharing', !privacySettings.allowLocationSharing)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.allowLocationSharing ? 'bg-orange-600' : 'bg-gray-200'
                    }`}
                    disabled={loading}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        privacySettings.allowLocationSharing ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Family Safety Features</label>
                    <p className="text-sm text-gray-600">Enable family group coordination</p>
                  </div>
                  <button
                    onClick={() => handlePrivacySettingChange('enableFamilyFeatures', !privacySettings.enableFamilyFeatures)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.enableFamilyFeatures ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    disabled={loading}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        privacySettings.enableFamilyFeatures ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Age Verification Status */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Age Verification</h3>
              
              {profile?.userAge ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-gray-700">Age verification completed</span>
                  </div>
                  
                  {profile.userAge < 13 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Shield className="h-5 w-5 text-yellow-600 mr-2" />
                        <span className="font-medium text-yellow-800">COPPA Protections Active</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        Additional privacy protections are automatically applied for users under 13.
                      </p>
                      {!profile.hasParentalConsent && (
                        <p className="text-sm text-yellow-700 mt-2">
                          Some features require parental consent. Please have a parent or guardian 
                          complete the consent process.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Info className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Age verification not completed</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm underline">
                    Complete age verification
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'export':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Your Data</h3>
              <p className="text-gray-600 mb-4">
                Download all your data in a portable JSON format. This includes all settings, 
                preferences, and non-sensitive information.
              </p>
              
              <button
                onClick={handleExportData}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <Download className="h-5 w-5 mr-2" />
                {loading ? 'Exporting...' : 'Export All Data'}
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Delete All Data
              </h3>
              <p className="text-red-700 mb-4">
                This will permanently delete all your data from our systems and cannot be undone. 
                This includes your profile, settings, family groups, and all stored information.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">
                    Type "DELETE ALL DATA" to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmDeletion}
                    onChange={(e) => setConfirmDeletion(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Type DELETE ALL DATA"
                  />
                </div>
                
                <button
                  onClick={handleDeleteAllData}
                  disabled={confirmDeletion !== 'DELETE ALL DATA' || loading}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  {loading ? 'Deleting...' : 'Delete All Data'}
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-blue-600" />
            Privacy Control Panel
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close privacy controls"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 inline mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <TabContent tabId={activeTab} />
        </div>
      </div>
    </div>
  );
}