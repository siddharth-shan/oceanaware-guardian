/**
 * Real-time Updates Hook
 * WebSocket-based live updates for community reports and emergency notifications
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export const useRealtimeUpdates = ({
  location,
  onReportUpdate,
  onEmergencyAlert,
  emergencyMode = false,
  enabled = true
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 1000;

  // Connection management
  const connect = useCallback(() => {
    if (!enabled || !location) return;

    try {
      // Use current protocol (http/https) to determine ws/wss
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.NODE_ENV === 'production' 
        ? window.location.host 
        : 'localhost:3001';
      
      const wsUrl = `${protocol}//${host}/ws/community-updates`;
      
      console.log(`🔄 Connecting to WebSocket: ${wsUrl}`);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;

        // Subscribe to location-based updates
        const subscribeMessage = {
          type: 'subscribe',
          location: {
            lat: location.lat,
            lng: location.lng,
            radius: 50 // km
          },
          emergencyMode,
          filters: {
            urgentLevels: ['critical', 'high', 'normal', 'low'],
            maxAge: 24 // hours
          }
        };

        ws.current.send(JSON.stringify(subscribeMessage));
        console.log('📡 Subscribed to location updates:', location);
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt reconnection if not intentional
        if (event.code !== 1000 && enabled && reconnectAttempts.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionError('Connection failed');
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      setConnectionError(error.message);
      scheduleReconnect();
    }
  }, [location, emergencyMode, enabled]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (ws.current) {
      console.log('🔌 Disconnecting WebSocket...');
      ws.current.close(1000, 'User disconnect');
    }
    
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
  }, []);

  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeout.current) return;
    
    const delay = Math.min(
      baseReconnectDelay * Math.pow(2, reconnectAttempts.current),
      30000 // Max 30 seconds
    );
    
    console.log(`🔄 Scheduling reconnection in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
    
    reconnectTimeout.current = setTimeout(() => {
      reconnectAttempts.current++;
      reconnectTimeout.current = null;
      connect();
    }, delay);
  }, [connect]);

  // Handle incoming messages
  const handleMessage = useCallback((message) => {
    console.log('📨 WebSocket message received:', message.type);
    setLastUpdate(new Date());

    switch (message.type) {
      case 'report_update':
        handleReportUpdate(message);
        break;
        
      case 'emergency_alert':
        handleEmergencyAlert(message);
        break;
        
      case 'batch_update':
        handleBatchUpdate(message);
        break;
        
      case 'connection_status':
        handleConnectionStatus(message);
        break;
        
      case 'error':
        console.error('❌ Server error:', message.error);
        setConnectionError(message.error);
        break;
        
      default:
        console.log('❓ Unknown message type:', message.type);
    }
  }, []);

  const handleReportUpdate = useCallback((message) => {
    const { action, report, clusterId } = message.data;
    
    console.log(`📊 Report ${action}:`, report?.id || clusterId);
    
    onReportUpdate?.({
      action, // 'created', 'updated', 'deleted', 'verified'
      report,
      clusterId,
      timestamp: message.timestamp
    });
  }, [onReportUpdate]);

  const handleEmergencyAlert = useCallback((message) => {
    const { level, alert, location: alertLocation } = message.data;
    
    console.log(`🚨 Emergency alert (${level}):`, alert.title);
    
    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(`🚨 ${level.toUpperCase()} ALERT`, {
        body: alert.description,
        icon: '/icons/emergency-alert.png',
        requireInteraction: level === 'critical',
        tag: `emergency-${alert.id}`
      });
    }
    
    onEmergencyAlert?.({
      level, // 'critical', 'high', 'normal'
      alert,
      location: alertLocation,
      timestamp: message.timestamp
    });
  }, [onEmergencyAlert]);

  const handleBatchUpdate = useCallback((message) => {
    const { updates } = message.data;
    
    console.log(`📦 Batch update: ${updates.length} items`);
    
    updates.forEach(update => {
      if (update.type === 'report') {
        handleReportUpdate({ data: update });
      } else if (update.type === 'emergency') {
        handleEmergencyAlert({ data: update });
      }
    });
  }, [handleReportUpdate, handleEmergencyAlert]);

  const handleConnectionStatus = useCallback((message) => {
    const { status, subscribers, region } = message.data;
    
    console.log(`📡 Connection status: ${status} (${subscribers} subscribers in ${region})`);
  }, []);

  // Send message to server
  const sendMessage = useCallback((message) => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    
    console.warn('⚠️ Cannot send message: WebSocket not connected');
    return false;
  }, [isConnected]);

  // Update location subscription
  const updateLocation = useCallback((newLocation) => {
    if (isConnected) {
      sendMessage({
        type: 'update_location',
        location: {
          lat: newLocation.lat,
          lng: newLocation.lng,
          radius: 50
        }
      });
    }
  }, [isConnected, sendMessage]);

  // Toggle emergency mode
  const setEmergencyMode = useCallback((enabled) => {
    if (isConnected) {
      sendMessage({
        type: 'emergency_mode',
        enabled
      });
    }
  }, [isConnected, sendMessage]);

  // Connection lifecycle
  useEffect(() => {
    if (enabled && location) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [enabled, location, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, []);

  return {
    // Connection state
    isConnected,
    connectionError,
    lastUpdate,
    
    // Connection methods
    connect,
    disconnect,
    
    // Data methods
    updateLocation,
    setEmergencyMode,
    sendMessage,
    
    // Status
    reconnectAttempts: reconnectAttempts.current,
    maxReconnectAttempts
  };
};

/**
 * Hook for real-time community updates
 */
export const useCommunityUpdates = ({
  location,
  onNewReport,
  onReportUpdate,
  onEmergencyAlert,
  emergencyMode = false
}) => {
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  const handleReportUpdate = useCallback(({ action, report, timestamp }) => {
    switch (action) {
      case 'created':
        setReports(prev => [report, ...prev]);
        onNewReport?.(report);
        break;
        
      case 'updated':
      case 'verified':
        setReports(prev => prev.map(r => 
          r.id === report.id ? { ...r, ...report } : r
        ));
        onReportUpdate?.(report, action);
        break;
        
      case 'deleted':
        setReports(prev => prev.filter(r => r.id !== report.id));
        break;
    }
  }, [onNewReport, onReportUpdate]);

  const handleEmergencyAlert = useCallback((alertData) => {
    setAlerts(prev => [alertData, ...prev.slice(0, 9)]); // Keep last 10 alerts
    onEmergencyAlert?.(alertData);
  }, [onEmergencyAlert]);

  const realtimeUpdates = useRealtimeUpdates({
    location,
    onReportUpdate: handleReportUpdate,
    onEmergencyAlert: handleEmergencyAlert,
    emergencyMode
  });

  // Clear alerts older than 1 hour
  useEffect(() => {
    const interval = setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      setAlerts(prev => prev.filter(alert => 
        new Date(alert.timestamp).getTime() > oneHourAgo
      ));
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...realtimeUpdates,
    
    // Real-time data
    realtimeReports: reports,
    realtimeAlerts: alerts,
    
    // Data management
    clearReports: () => setReports([]),
    clearAlerts: () => setAlerts([])
  };
};

export default useRealtimeUpdates;