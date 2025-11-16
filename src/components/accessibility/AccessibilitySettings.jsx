import { useState } from 'react';
import { Settings, Eye, Volume2, Type, Palette, Globe, RotateCcw } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';

/**
 * Accessibility Settings Panel
 * Allows users to customize accessibility preferences
 */
const AccessibilitySettings = ({ isOpen, onClose }) => {
  const { settings, updateSetting, toggleSetting, resetSettings, translate } = useAccessibility();
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleLanguageChange = (language) => {
    updateSetting('language', language);
  };

  const handleReset = () => {
    resetSettings();
    setShowConfirmReset(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              {translate('settings.title', 'Accessibility Settings')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            aria-label={translate('action.close', 'Close settings')}
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-6 space-y-6">
          {/* Language Settings */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">
                {translate('settings.language', 'Language / Idioma')}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  settings.language === 'en'
                    ? 'border-blue-500 bg-blue-100 text-blue-800'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">🇺🇸 English</div>
                <div className="text-sm text-gray-600">Default language</div>
              </button>
              
              <button
                onClick={() => handleLanguageChange('es')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  settings.language === 'es'
                    ? 'border-blue-500 bg-blue-100 text-blue-800'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">🇪🇸 Español</div>
                <div className="text-sm text-gray-600">Idioma español</div>
              </button>
            </div>
          </div>

          {/* Visual Accessibility */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Eye className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                {translate('settings.visual', 'Visual Accessibility')}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* High Contrast */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Palette className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">
                      {translate('settings.high-contrast', 'High Contrast')}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleSetting('highContrast')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.highContrast ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-pressed={settings.highContrast}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  {translate('settings.high-contrast-desc', 'Better visibility in smoke or bright sunlight')}
                </p>
              </div>

              {/* Large Text */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Type className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">
                      {translate('settings.large-text', 'Large Text')}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleSetting('largeText')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.largeText ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-pressed={settings.largeText}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.largeText ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  {translate('settings.large-text-desc', 'Easier reading for all age groups')}
                </p>
              </div>
            </div>
          </div>

          {/* Audio Accessibility */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Volume2 className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                {translate('settings.audio', 'Audio Accessibility')}
              </h3>
            </div>

            {/* Voice Alerts */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">
                    {translate('settings.voice-alerts', 'Voice Alerts')}
                  </span>
                </div>
                <button
                  onClick={() => toggleSetting('voiceAlerts')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.voiceAlerts ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  aria-pressed={settings.voiceAlerts}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.voiceAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {translate('settings.voice-alerts-desc', 'Speak emergency alerts and important messages')}
              </p>
              
              {settings.voiceAlerts && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    {translate('settings.test-voice', 'Test voice alerts:')}
                  </p>
                  <button
                    onClick={() => {
                      const testMessage = settings.language === 'es' 
                        ? 'Prueba de alertas de voz. EcoQuest Wildfire Watch está listo para ayudar.'
                        : 'Voice alert test. EcoQuest Wildfire Watch is ready to help keep you safe.';
                      
                      if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(testMessage);
                        utterance.lang = settings.language === 'es' ? 'es-US' : 'en-US';
                        window.speechSynthesis.speak(utterance);
                      }
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    🔊 {translate('action.test', 'Test')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Motion Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {translate('settings.motion', 'Motion & Animation')}
            </h3>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {translate('settings.reduced-motion', 'Reduced Motion')}
                </span>
                <button
                  onClick={() => toggleSetting('reducedMotion')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  aria-pressed={settings.reducedMotion}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {translate('settings.reduced-motion-desc', 'Minimize animations and motion effects')}
              </p>
            </div>
          </div>

          {/* Screen Reader Support */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              {translate('settings.screen-reader', '♿ Screen Reader Support')}
            </h3>
            <p className="text-sm text-green-700 mb-3">
              {translate('settings.screen-reader-desc', 'EcoQuest is optimized for screen readers with ARIA labels, semantic HTML, and keyboard navigation.')}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="font-medium text-green-800">
                {translate('settings.screen-reader-mode', 'Screen Reader Mode')}
              </span>
              <button
                onClick={() => toggleSetting('screenReader')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.screenReader ? 'bg-green-600' : 'bg-gray-200'
                }`}
                aria-pressed={settings.screenReader}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.screenReader ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              {!showConfirmReset ? (
                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{translate('action.reset', 'Reset to Defaults')}</span>
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {translate('confirm.reset', 'Are you sure?')}
                  </span>
                  <button
                    onClick={handleReset}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    {translate('action.confirm', 'Yes, Reset')}
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    {translate('action.cancel', 'Cancel')}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {translate('action.done', 'Done')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilitySettings;