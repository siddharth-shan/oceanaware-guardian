import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Enhanced Notification Component with accessibility features
 */
const EnhancedNotification = ({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  autoClose = true, 
  duration = 5000,
  actions = [],
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (autoClose && duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            clearInterval(interval);
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          progressColor: 'bg-green-600',
          Icon: CheckCircle
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          progressColor: 'bg-yellow-600',
          Icon: AlertTriangle
        };
      case 'error':
        return {
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          progressColor: 'bg-red-600',
          Icon: AlertCircle
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          progressColor: 'bg-blue-600',
          Icon: Info
        };
    }
  };

  const config = getTypeConfig();
  const { bgColor, textColor, iconColor, progressColor, Icon } = config;

  if (!isVisible) return null;

  return (
    <div
      className={`enhanced-card border ${bgColor} ${className} transition-all duration-300 ease-in-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {/* Progress bar for auto-close */}
      {autoClose && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
          <div 
            className={`h-full ${progressColor} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start space-x-3 p-4">
        {/* Icon */}
        <div className={`flex-shrink-0 ${iconColor}`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`text-sm font-semibold ${textColor} mb-1`}>
              {title}
            </h3>
          )}
          {message && (
            <p className={`text-sm ${textColor} leading-relaxed`}>
              {message}
            </p>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex items-center space-x-3 mt-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`enhanced-button text-xs px-3 py-1 ${action.className || ''}`}
                  aria-label={action.label}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleClose}
            className={`rounded-lg p-1 hover:bg-black/10 transition-colors ${textColor}`}
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Notification Container for managing multiple notifications
 */
export const NotificationContainer = ({ notifications = [], onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-50 space-y-3 max-w-sm"
      aria-label="Notifications"
      role="region"
    >
      {notifications.map(notification => (
        <EnhancedNotification
          key={notification.id}
          {...notification}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

/**
 * Hook for managing notifications
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      ...notification,
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Helper functions for different types
  const showSuccess = (title, message, options = {}) => {
    return addNotification({ type: 'success', title, message, ...options });
  };

  const showError = (title, message, options = {}) => {
    return addNotification({ 
      type: 'error', 
      title, 
      message, 
      autoClose: false, // Don't auto-close error messages
      ...options 
    });
  };

  const showWarning = (title, message, options = {}) => {
    return addNotification({ type: 'warning', title, message, ...options });
  };

  const showInfo = (title, message, options = {}) => {
    return addNotification({ type: 'info', title, message, ...options });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default EnhancedNotification;