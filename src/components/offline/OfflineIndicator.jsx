/**
 * Offline Status Indicator - Phase 3.2
 * Shows offline status and sync progress to users
 */

import { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Info,
  X,
  Download
} from 'lucide-react';
import { useOffline } from '../../hooks/useOfflineSimple';

const OfflineIndicator = ({ className = '' }) => {
  const { 
    isOnline, 
    syncInProgress, 
    syncStatus, 
    cacheStatus, 
    triggerSync, 
    clearStatus 
  } = useOffline();
  
  const [showDetails, setShowDetails] = useState(false);
  const [dismissedStatus, setDismissedStatus] = useState(new Set());

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    if (syncStatus?.type === 'success') {
      const timer = setTimeout(() => {
        clearStatus();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus, clearStatus]);

  // Don't show anything if online and no status messages
  if (isOnline && !syncStatus && !cacheStatus && !syncInProgress) {
    return null;
  }

  const getStatusIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBg = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const dismissStatus = (statusType) => {
    setDismissedStatus(prev => new Set([...prev, statusType]));
    clearStatus();
  };

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {/* Main Status Indicator */}
      <div
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border-2 transition-all duration-300 cursor-pointer ${
          isOnline 
            ? 'bg-white border-gray-200 text-gray-800' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-yellow-600" />
          )}
          
          {syncInProgress && (
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          )}
        </div>
        
        <div>
          <div className="font-medium text-sm">
            {isOnline ? 'Online' : 'Offline Mode'}
          </div>
          {syncInProgress && (
            <div className="text-xs text-gray-600">Syncing data...</div>
          )}
          {!isOnline && !syncInProgress && (
            <div className="text-xs text-yellow-700">Emergency features available</div>
          )}
        </div>
      </div>

      {/* Sync Status Messages */}
      {syncStatus && !dismissedStatus.has('sync') && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-lg border-2 ${getStatusBg(syncStatus.type)}`}>
          <div className="flex items-center space-x-2">
            {getStatusIcon(syncStatus.type)}
            <span className="text-sm font-medium">{syncStatus.message}</span>
          </div>
          <button
            onClick={() => dismissStatus('sync')}
            className="ml-3 p-1 hover:bg-white hover:bg-opacity-50 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Cache Status Messages */}
      {cacheStatus && !dismissedStatus.has('cache') && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-lg border-2 ${getStatusBg(cacheStatus.type)}`}>
          <div className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">{cacheStatus.message}</span>
          </div>
          <button
            onClick={() => dismissStatus('cache')}
            className="ml-3 p-1 hover:bg-white hover:bg-opacity-50 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Detailed Status Panel */}
      {showDetails && (
        <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg p-4 min-w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Connection Status</h3>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Network Status:</span>
              <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-yellow-600'}`}>
                {isOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Data Sync:</span>
              <span className={`font-medium ${syncInProgress ? 'text-blue-600' : 'text-gray-600'}`}>
                {syncInProgress ? 'In Progress' : 'Idle'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Offline Features:</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
            
            {!isOnline && (
              <div className="pt-3 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">Available Offline:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Submit emergency reports</li>
                  <li>• View cached community data</li>
                  <li>• Access emergency contacts</li>
                  <li>• View safety procedures</li>
                </ul>
              </div>
            )}
            
            <div className="pt-3 border-t border-gray-200 flex space-x-2">
              <button
                onClick={triggerSync}
                disabled={syncInProgress || !isOnline}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs font-medium flex items-center justify-center space-x-1"
              >
                <RefreshCw className={`h-3 w-3 ${syncInProgress ? 'animate-spin' : ''}`} />
                <span>{syncInProgress ? 'Syncing...' : 'Sync Now'}</span>
              </button>
              
              <button
                onClick={clearStatus}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-xs font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;