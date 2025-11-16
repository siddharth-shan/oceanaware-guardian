import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Zap, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';
import { useAccessibility } from '../accessibility/AccessibilityProvider';

/**
 * Quick Risk Assessment - Simplified camera-first interface inspired by Congressional App Challenge winners
 * Features prominent camera upload and instant risk results like "Terrain Fire Risk Analyzer"
 */
export default function QuickRiskAssessment({ onNavigateToFullAnalysis }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  
  const { translate, speak } = useAccessibility();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Camera functionality
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      videoRef.current.srcObject = stream;
      setCameraMode(true);
      speak(translate('quick.camera-started', 'Camera ready - point at vegetation to check fire risk'));
    } catch (error) {
      console.error('Camera access error:', error);
      speak(translate('quick.camera-error', 'Camera unavailable. Please use file upload.'));
    }
  }, [speak, translate]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraMode(false);
  }, []);

  const captureImage = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        setSelectedFile(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        stopCamera();
        analyzeImageQuick(blob);
        speak(translate('quick.analyzing', 'Analyzing terrain for fire risk...'));
      }, 'image/jpeg', 0.9);
    }
  }, [stopCamera, speak, translate]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setAnalysis(null);
      
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Auto-analyze for quick workflow
      analyzeImageQuick(file);
      speak(translate('quick.file-analyzing', 'Image selected. Analyzing for fire risk...'));
    }
  };

  const analyzeImageQuick = async (imageFile) => {
    if (!imageFile) return;

    setLoading(true);
    setAnalysis(null);
    
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/ai-analysis/analyze', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result && result.success && result.analysis) {
          setAnalysis(result);
          
          // Quick voice announcement
          const riskLevel = result.analysis.riskLevel || 'unknown';
          const riskScore = result.analysis.riskScore || 0;
          
          let announcement;
          if (riskLevel === 'HIGH' || riskScore >= 70) {
            announcement = `High fire risk detected. Risk score ${riskScore} out of 100. Take immediate precautions.`;
          } else if (riskLevel === 'MEDIUM' || riskScore >= 40) {
            announcement = `Medium fire risk detected. Risk score ${riskScore} out of 100. Consider preventive measures.`;
          } else {
            announcement = `Low fire risk detected. Risk score ${riskScore} out of 100. Area appears relatively safe.`;
          }
          
          speak(announcement, { emergency: riskLevel === 'HIGH' });
        } else {
          throw new Error('Invalid analysis response');
        }
      } else {
        throw new Error(`Analysis failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Quick analysis error:', error);
      setAnalysis({ 
        error: 'Analysis failed. Please try again.',
        analysis: null 
      });
      speak(translate('quick.analysis-failed', 'Analysis failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 70) return 'text-red-600 bg-red-50 border-red-300';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    return 'text-green-600 bg-green-50 border-green-300';
  };

  const getRiskEmoji = (score) => {
    if (score >= 70) return '🚨';
    if (score >= 40) return '⚠️';
    return '✅';
  };

  const getRiskText = (score) => {
    if (score >= 70) return 'HIGH RISK';
    if (score >= 40) return 'MEDIUM RISK';
    return 'LOW RISK';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header - Inspired by winning apps */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <Target className="h-10 w-10 text-orange-600 mr-3" />
          Quick Fire Risk Check
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upload a photo or use your camera to instantly assess wildfire risk in your area
        </p>
      </div>

      {/* Main Interface */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        
        {/* Camera/Upload Section */}
        {!previewUrl && (
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Camera Option - Primary */}
              <button
                onClick={startCamera}
                disabled={cameraMode || loading}
                className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 text-white p-8 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                aria-label="Start camera to scan terrain"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white/20 p-4 rounded-full group-hover:bg-white/30 transition-colors">
                    <Camera className="h-12 w-12" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">📸 Scan Now</h3>
                    <p className="text-orange-100">Point your camera at vegetation</p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                  INSTANT
                </div>
              </button>

              {/* Upload Option - Secondary */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="group bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                aria-label="Upload image from device"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white/20 p-4 rounded-full group-hover:bg-white/30 transition-colors">
                    <Upload className="h-12 w-12" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">📁 Upload Photo</h3>
                    <p className="text-blue-100">Select from your gallery</p>
                  </div>
                </div>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Camera View */}
            {cameraMode && (
              <div className="bg-black rounded-xl overflow-hidden">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute inset-0 border-4 border-white/30 pointer-events-none"></div>
                  
                  {/* Camera Controls */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                    <button
                      onClick={stopCamera}
                      className="bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={captureImage}
                      className="bg-red-600 text-white px-8 py-4 rounded-full hover:bg-red-700 transition-colors font-semibold text-lg shadow-lg"
                    >
                      📸 Capture & Analyze
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-900 text-white p-4 text-center">
                  <p className="text-sm">Point camera at vegetation, grass, or surrounding area to check fire risk</p>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Results Section */}
        {(previewUrl || loading) && (
          <div className="p-8">
            {/* Image Preview */}
            {previewUrl && (
              <div className="mb-6">
                <img 
                  src={previewUrl} 
                  alt="Terrain analysis"
                  className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                />
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Analyzing Terrain...</h3>
                <p className="text-gray-600">AI models processing vegetation and fire risk factors</p>
              </div>
            )}

            {/* Error State */}
            {analysis?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Analysis Failed</h3>
                <p className="text-red-600">{analysis.error}</p>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Success Results - Inspired by "Terrain Fire Risk Analyzer" */}
            {analysis?.analysis && !loading && (
              <div className="space-y-6">
                {/* Primary Risk Display */}
                <div className={`border-4 rounded-xl p-8 text-center ${getRiskColor(analysis.analysis.riskScore)}`}>
                  <div className="text-6xl mb-4">{getRiskEmoji(analysis.analysis.riskScore)}</div>
                  <h2 className="text-3xl font-bold mb-2">{getRiskText(analysis.analysis.riskScore)}</h2>
                  <div className="text-5xl font-bold mb-4">{analysis.analysis.riskScore}/100</div>
                  <p className="text-lg opacity-90">
                    {analysis.analysis.riskScore >= 70 
                      ? 'Take immediate fire safety precautions'
                      : analysis.analysis.riskScore >= 40
                      ? 'Consider defensive space improvements'
                      : 'Area shows relatively low fire risk'
                    }
                  </p>
                </div>

                {/* Quick Recommendations */}
                {analysis.analysis.recommendations && analysis.analysis.recommendations.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Immediate Actions
                    </h3>
                    <ul className="space-y-2">
                      {analysis.analysis.recommendations.slice(0, 3).map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-800">
                            {typeof rec === 'string' ? rec : rec.action || rec.description || JSON.stringify(rec)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Analysis Timestamp */}
                <div className="text-center text-sm text-gray-500 flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Analysis completed at {new Date().toLocaleTimeString()}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={() => {
                      setPreviewUrl(null);
                      setAnalysis(null);
                      setSelectedFile(null);
                    }}
                    className="flex-1 bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                  >
                    📸 Check Another Area
                  </button>
                  <button 
                    onClick={() => {
                      if (onNavigateToFullAnalysis) {
                        onNavigateToFullAnalysis();
                      } else {
                        // Navigate to AI analysis subtab
                        window.dispatchEvent(new CustomEvent('navigateSubTab', { 
                          detail: { tab: 'fire-monitoring', subTab: 'ai-analysis' } 
                        }));
                      }
                    }}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    📊 View Full Analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Usage Tips */}
      {!previewUrl && !cameraMode && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">💡 Best Results Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="flex items-start">
              <span className="mr-2">🌿</span>
              <span>Include vegetation in your photo (grass, trees, bushes)</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2">☀️</span>
              <span>Take photos in good lighting conditions</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2">🏠</span>
              <span>Show the area around your property</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2">🔍</span>
              <span>Include close-up details of vegetation condition</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}