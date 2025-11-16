import { createContext, useContext, useState, useEffect } from 'react';

/**
 * Accessibility Context Provider
 * Manages accessibility settings and features across the app
 */
const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('ecoquest-accessibility-settings');
    return saved ? JSON.parse(saved) : {
      language: 'en',
      highContrast: false,
      largeText: false,
      voiceAlerts: false,
      reducedMotion: false,
      screenReader: false
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ecoquest-accessibility-settings', JSON.stringify(settings));
    
    // Apply CSS classes based on settings
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
    document.documentElement.classList.toggle('large-text', settings.largeText);
    document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);
    
    // Apply language setting
    document.documentElement.lang = settings.language;
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const resetSettings = () => {
    setSettings({
      language: 'en',
      highContrast: false,
      largeText: false,
      voiceAlerts: false,
      reducedMotion: false,
      screenReader: false
    });
  };

  // Text-to-Speech functionality
  const speak = (text, options = {}) => {
    if (!settings.voiceAlerts || !('speechSynthesis' in window)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure speech options
      utterance.lang = settings.language === 'es' ? 'es-US' : 'en-US';
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      
      // Emergency alerts should be louder and slower
      if (options.emergency) {
        utterance.rate = 0.8;
        utterance.volume = 1;
        utterance.pitch = 1.2;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);
      
      window.speechSynthesis.speak(utterance);
    });
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Translation support
  const translations = {
    en: {
      // Emergency messages
      'emergency.critical': 'Critical wildfire emergency detected. Follow evacuation orders immediately.',
      'emergency.warning': 'Wildfire warning in your area. Stay alert and be prepared to evacuate.',
      'emergency.safe': 'You have been marked as safe.',
      'emergency.evacuating': 'You are currently evacuating.',
      'emergency.need-help': 'Help request submitted. Emergency services have been notified.',
      
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.ai-analysis': 'AI Analysis', 
      'nav.community': 'Community Hub',
      'nav.safety-quests': 'Safety Quests',
      'nav.alerts': 'Alerts',
      
      // Actions
      'action.scan-risk': 'Scan for fire risks',
      'action.check-in': 'Update safety status', 
      'action.report-issue': 'Report emergency',
      'action.call-911': 'Call 911',
      'action.evacuate': 'View emergency alerts and safety info',
      'action.ai-analysis': 'AI Analysis',
      'action.safety-guide': 'Safety Guide',
      
      // App sections
      'app.title': 'OceanAware Guardian',
      'app.subtitle': 'Real-time ocean hazard monitoring & conservation',
      'app.tagline': 'AI-powered ocean conservation platform',
      
      // AI Scanner
      'ai.title': 'AI Wildfire Risk Scanner',
      'ai.subtitle': 'Advanced computer vision analysis for vegetation fire risks',
      'ai.location': 'Analysis location',
      'ai.capture-method': 'Image Capture',
      'ai.use-camera': 'Use Camera',
      'ai.camera-desc': 'Scan environment directly',
      'ai.upload-file': 'Upload File',
      'ai.upload-desc': 'Select from gallery',
      'ai.preview': 'Image Preview',
      'ai.analyze': 'Analyze with AI',
      'ai.analyzing': 'Analyzing...',
      'ai.capture': 'Capture',
      'ai.cancel': 'Cancel',
      'ai.point-vegetation': 'Point camera at vegetation to scan for risks',
      'ai.camera-started': 'Camera started. Point at vegetation to scan for fire risks.',
      'ai.camera-error': 'Camera access denied. Please use file upload instead.',
      'ai.image-captured': 'Image captured. Ready for AI analysis.',
      'ai.file-selected': 'Image selected. Ready for AI risk analysis.',
      'ai.analysis-starting': 'Starting AI fire risk analysis. Please wait.',
      'ai.analysis-failed': 'AI analysis failed. Please try again or check your connection.',
      'ai.high-risk-detected': 'High fire risk detected. Please review recommendations immediately.',
      'ai.medium-risk-detected': 'Medium fire risk detected. Consider taking preventive action.',
      'ai.low-risk-detected': 'Low fire risk detected. Area appears relatively safe.',
      
      // Status
      'status.safe': 'Safe',
      'status.evacuating': 'Evacuating',
      'status.need-help': 'Need Help',
      'status.fire-detected': 'Fire detected nearby',
      'status.all-clear': 'All clear in your area'
    },
    es: {
      // Emergency messages  
      'emergency.critical': 'Emergencia crítica de incendio forestal detectada. Siga las órdenes de evacuación inmediatamente.',
      'emergency.warning': 'Advertencia de incendio forestal en su área. Manténgase alerta y prepárese para evacuar.',
      'emergency.safe': 'Ha sido marcado como seguro.',
      'emergency.evacuating': 'Actualmente está evacuando.',
      'emergency.need-help': 'Solicitud de ayuda enviada. Los servicios de emergencia han sido notificados.',
      
      // Navigation
      'nav.dashboard': 'Tablero',
      'nav.ai-analysis': 'Análisis IA',
      'nav.community': 'Centro Comunitario',
      'nav.safety-quests': 'Misiones de Seguridad',
      'nav.alerts': 'Alertas',
      
      // Actions
      'action.scan-risk': 'Escanear riesgos de incendio',
      'action.check-in': 'Actualizar estado de seguridad',
      'action.report-issue': 'Reportar emergencia',
      'action.call-911': 'Llamar al 911',
      'action.evacuate': 'Ver alertas de emergencia e información de seguridad',
      'action.ai-analysis': 'Análisis IA',
      'action.safety-guide': 'Guía de Seguridad',
      
      // App sections
      'app.title': 'EcoQuest Vigilancia de Incendios',
      'app.subtitle': 'Monitoreo y seguridad de incendios forestales en tiempo real',
      'app.tagline': 'Monitoreo de incendios forestales impulsado por IA y compañero de seguridad',
      
      // AI Scanner
      'ai.title': 'Escáner de Riesgo de Incendios IA',
      'ai.subtitle': 'Análisis avanzado de visión por computadora para riesgos de incendios en vegetación',
      'ai.location': 'Ubicación de análisis',
      'ai.capture-method': 'Captura de Imagen',
      'ai.use-camera': 'Usar Cámara',
      'ai.camera-desc': 'Escanear entorno directamente',
      'ai.upload-file': 'Subir Archivo',
      'ai.upload-desc': 'Seleccionar de galería',
      'ai.preview': 'Vista Previa de Imagen',
      'ai.analyze': 'Analizar con IA',
      'ai.analyzing': 'Analizando...',
      'ai.capture': 'Capturar',
      'ai.cancel': 'Cancelar',
      'ai.point-vegetation': 'Apunte la cámara a la vegetación para escanear riesgos',
      'ai.camera-started': 'Cámara iniciada. Apunte a la vegetación para escanear riesgos de incendio.',
      'ai.camera-error': 'Acceso a cámara denegado. Por favor use carga de archivo en su lugar.',
      'ai.image-captured': 'Imagen capturada. Lista para análisis de IA.',
      'ai.file-selected': 'Imagen seleccionada. Lista para análisis de riesgo de IA.',
      'ai.analysis-starting': 'Iniciando análisis de riesgo de incendio con IA. Por favor espere.',
      'ai.analysis-failed': 'Análisis de IA falló. Por favor intente de nuevo o verifique su conexión.',
      'ai.high-risk-detected': 'Alto riesgo de incendio detectado. Por favor revise las recomendaciones inmediatamente.',
      'ai.medium-risk-detected': 'Riesgo medio de incendio detectado. Considere tomar acción preventiva.',
      'ai.low-risk-detected': 'Bajo riesgo de incendio detectado. El área parece relativamente segura.',
      
      // Status
      'status.safe': 'Seguro',
      'status.evacuating': 'Evacuando', 
      'status.need-help': 'Necesito Ayuda',
      'status.fire-detected': 'Fuego detectado cerca',
      'status.all-clear': 'Todo despejado en su área'
    }
  };

  const translate = (key, fallback = key) => {
    return translations[settings.language]?.[key] || fallback;
  };

  const value = {
    settings,
    updateSetting,
    toggleSetting,
    resetSettings,
    speak,
    stopSpeaking,
    translate,
    isSpanish: settings.language === 'es'
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;