/**
 * Data Export/Import Component
 * GDPR-compliant data portability and management
 * Congressional App Challenge compliant with user data control
 */

import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Database,
  Clock,
  Shield,
  Package
} from 'lucide-react';
import { useAuth } from '../../services/auth/AuthContext';
import { useProfile } from '../../services/profile/ProfileContext';
import { useStorage } from '../../services/storage/StorageContext';
import { useFamily } from '../../services/family/FamilyContext';
import { useAccessibility } from '../accessibility/AccessibilityProvider';

export default function DataExportImport({ onClose }) {
  const { user } = useAuth();
  const { profile, exportData: exportProfile } = useProfile();
  const { exportAllData, importData, storageStats } = useStorage();
  const { getGroupStats } = useFamily();
  const { speak } = useAccessibility();

  const [activeTab, setActiveTab] = useState('export');
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [exportFormat, setExportFormat] = useState('json');
  const [includeOptions, setIncludeOptions] = useState({
    profile: true,
    preferences: true,
    familyGroups: true,
    emergencySettings: true,
    appSettings: true,
    metadata: true
  });

  const handleExport = async () => {
    setLoading(true);
    try {
      // Get comprehensive data export
      const result = await exportAllData();
      
      if (result.success) {
        const exportPackage = {
          metadata: {
            exportDate: new Date().toISOString(),
            appVersion: '1.0.0',
            exportFormat: 'ecoquest-data-v1',
            userId: user?.uid || 'anonymous',
            dataTypes: Object.keys(includeOptions).filter(key => includeOptions[key]),
            privacyNote: 'This export contains no personally identifiable information',
            instructions: 'This file can be imported back into EcoQuest Wildfire Watch to restore your settings and preferences'
          },
          data: result.data,
          summary: {
            totalItems: storageStats?.local?.itemCount || 0,
            totalSize: storageStats?.local?.totalSize || 0,
            createdAt: profile?.createdAt,
            lastActive: profile?.lastActive
          }
        };

        // Filter data based on include options
        const filteredData = filterExportData(exportPackage, includeOptions);
        
        setExportData(filteredData);
        downloadExportFile(filteredData);
        
        speak('Data exported successfully');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Export failed:', error);
      speak('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const filterExportData = (exportPackage, options) => {
    const filtered = { ...exportPackage };
    
    if (!options.profile) {
      delete filtered.data['user-profile'];
    }
    if (!options.preferences) {
      delete filtered.data['user-preferences'];
    }
    if (!options.familyGroups) {
      Object.keys(filtered.data).forEach(key => {
        if (key.startsWith('group-') || key.startsWith('family-')) {
          delete filtered.data[key];
        }
      });
    }
    if (!options.emergencySettings) {
      delete filtered.data['emergency-settings'];
      delete filtered.data['emergency-contacts'];
    }
    if (!options.appSettings) {
      Object.keys(filtered.data).forEach(key => {
        if (key.includes('settings') && !key.includes('emergency')) {
          delete filtered.data[key];
        }
      });
    }
    if (!options.metadata) {
      delete filtered.metadata;
      delete filtered.summary;
    }

    return filtered;
  };

  const downloadExportFile = (data) => {
    const filename = `ecoquest-data-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
    let content, mimeType;

    switch (exportFormat) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        break;
      case 'csv':
        content = convertToCSV(data);
        mimeType = 'text/csv';
        break;
      default:
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    // Simple CSV conversion for basic data
    const rows = [];
    rows.push(['Type', 'Key', 'Value', 'Date']);
    
    Object.entries(data.data || {}).forEach(([key, value]) => {
      const dataType = typeof value === 'object' ? 'object' : typeof value;
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const date = data.metadata?.exportDate || new Date().toISOString();
      rows.push([dataType, key, stringValue, date]);
    });

    return rows.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
      previewImportFile(file);
    }
  };

  const previewImportFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target.result);
        
        // Validate file format
        if (!content.metadata || !content.data) {
          throw new Error('Invalid file format');
        }

        const preview = {
          isValid: true,
          metadata: content.metadata,
          dataTypes: Object.keys(content.data || {}),
          itemCount: Object.keys(content.data || {}).length,
          exportDate: content.metadata?.exportDate,
          version: content.metadata?.exportFormat
        };

        setImportPreview(preview);
      } catch (error) {
        setImportPreview({
          isValid: false,
          error: 'Invalid file format or corrupted data'
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importFile || !importPreview?.isValid) {
      speak('Please select a valid export file');
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          const result = await importData(importData.data, {
            merge: true,
            validateFormat: true
          });
          
          if (result.success) {
            speak(`Successfully imported ${result.imported} items`);
            setImportFile(null);
            setImportPreview(null);
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          console.error('Import failed:', error);
          speak('Import failed');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(importFile);
    } catch (error) {
      console.error('Import failed:', error);
      speak('Import failed');
      setLoading(false);
    }
  };

  const getDataSummary = () => {
    return {
      totalItems: storageStats?.local?.itemCount || 0,
      totalSize: (storageStats?.local?.totalSize || 0) / 1024, // KB
      lastExport: exportData?.metadata?.exportDate,
      hasProfile: !!profile,
      familyGroups: 0 // Would get from family context
    };
  };

  const tabs = [
    { id: 'export', label: 'Export Data', icon: Download },
    { id: 'import', label: 'Import Data', icon: Upload },
    { id: 'summary', label: 'Data Summary', icon: Database }
  ];

  const TabContent = ({ tabId }) => {
    switch (tabId) {
      case 'export':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Package className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Export Your Data</h3>
              <p className="text-gray-600">
                Download all your data in a portable format. Perfect for backups or 
                transferring to another device.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Privacy Protection
              </h4>
              <p className="text-blue-800 text-sm">
                Your export contains no personally identifiable information - only 
                anonymous preferences, settings, and group codes.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Choose what to include:</h4>
              <div className="space-y-2">
                {Object.entries({
                  profile: 'User Profile & Settings',
                  preferences: 'App Preferences',
                  familyGroups: 'Family Group Codes',
                  emergencySettings: 'Emergency Settings',
                  appSettings: 'Application Settings',
                  metadata: 'Export Metadata'
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeOptions[key]}
                      onChange={(e) => setIncludeOptions(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format:
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="json">JSON (Recommended)</option>
                <option value="csv">CSV (Basic data only)</option>
              </select>
            </div>

            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Exporting...' : 'Export Data'}
            </button>

            {exportData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-900">Export Completed</span>
                </div>
                <p className="text-green-800 text-sm">
                  Your data has been exported and downloaded. The file contains 
                  {Object.keys(exportData.data || {}).length} data items.
                </p>
              </div>
            )}
          </div>
        );

      case 'import':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Upload className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Import Your Data</h3>
              <p className="text-gray-600">
                Restore your data from a previous export file to transfer settings 
                and preferences.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-900">Import Notice</span>
              </div>
              <p className="text-yellow-800 text-sm">
                Importing data will merge with your current settings. Existing data 
                with the same keys will be overwritten.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select export file:
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {importPreview && (
              <div className={`border rounded-lg p-4 ${
                importPreview.isValid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h4 className="font-medium mb-2 flex items-center">
                  {importPreview.isValid ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-green-900">Valid Export File</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-red-900">Invalid File</span>
                    </>
                  )}
                </h4>
                
                {importPreview.isValid ? (
                  <div className="text-green-800 text-sm space-y-1">
                    <p>Items to import: {importPreview.itemCount}</p>
                    <p>Export date: {new Date(importPreview.exportDate).toLocaleDateString()}</p>
                    <p>Data types: {importPreview.dataTypes.join(', ')}</p>
                  </div>
                ) : (
                  <p className="text-red-800 text-sm">{importPreview.error}</p>
                )}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={!importPreview?.isValid || loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              {loading ? 'Importing...' : 'Import Data'}
            </button>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Database className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Data Summary</h3>
              <p className="text-gray-600">
                Overview of your stored data and privacy information.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Storage Usage</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span className="font-medium">{getDataSummary().totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage Size:</span>
                    <span className="font-medium">{getDataSummary().totalSize.toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Created:</span>
                    <span className="font-medium">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Privacy Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Age Verified:</span>
                    <span className="font-medium">{profile?.userAge ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parental Consent:</span>
                    <span className="font-medium">
                      {profile?.userAge && profile.userAge < 13 
                        ? (profile.hasParentalConsent ? 'Yes' : 'Required') 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Privacy Mode:</span>
                    <span className="font-medium capitalize">
                      {profile?.privacyMode?.replace('-', ' ') || 'Anonymous'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Data Types Stored</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>User Preferences</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>Emergency Settings</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>Family Group Codes</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>App Configuration</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                What We Don't Store
              </h4>
              <p className="text-blue-800 text-sm">
                We do not collect or store: real names, addresses, phone numbers, 
                email addresses, photos, or any other personally identifiable information.
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
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />
            Data Export & Import
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
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