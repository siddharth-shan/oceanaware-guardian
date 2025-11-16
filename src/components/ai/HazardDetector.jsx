import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, RefreshCw, AlertTriangle, CheckCircle, Eye, Zap, MapPin } from 'lucide-react';
import { useLocationManager } from '../../hooks/useLocationManager';
import { useAccessibility } from '../accessibility/AccessibilityProvider';

export default function HazardDetector() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  
  const { location } = useLocationManager();
  const { translate, speak } = useAccessibility();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Camera functionality
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Back camera for scanning environment
      });
      videoRef.current.srcObject = stream;
      setCameraMode(true);
      speak(translate('ai.camera-started', 'Camera started. Point at vegetation to scan for fire risks.'));
    } catch (error) {
      console.error('Camera access error:', error);
      speak(translate('ai.camera-error', 'Camera access denied. Please use file upload instead.'));
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
        speak(translate('ai.image-captured', 'Image captured. Ready for AI analysis.'));
      }, 'image/jpeg', 0.8);
    }
  }, [stopCamera, speak, translate]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setAnalysis(null);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      speak(translate('ai.file-selected', 'Image selected. Ready for AI risk analysis.'));
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    console.log('🚀 Starting AI analysis...');
    setLoading(true);
    setAnalysis(null);
    setScanProgress(0);
    
    speak(translate('ai.analysis-starting', 'Starting AI fire risk analysis. Please wait.'));
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10 + 5;
      });
    }, 500);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Include location data for enhanced weather integration
      if (location && location.lat && location.lng) {
        formData.append('location', JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          displayName: location.displayName
        }));
      }

      const response = await fetch('/api/ai-analysis/analyze', {
        method: 'POST',
        body: formData
      });

      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Analysis result received:', result);
        
        // Validate the response structure
        if (result && result.success && result.analysis) {
          console.log('✅ Setting analysis state with:', result);
          
          // Create a safe copy of the result with proper array handling
          const safeResult = {
            ...result,
            analysis: {
              ...result.analysis,
              // Ensure recommendations is an array
              recommendations: Array.isArray(result.analysis.recommendations) 
                ? result.analysis.recommendations 
                : result.analysis.recommendations 
                  ? [result.analysis.recommendations] 
                  : [],
              // Ensure hazards is an array
              hazards: Array.isArray(result.analysis.hazards) 
                ? result.analysis.hazards 
                : result.analysis.hazards 
                  ? [result.analysis.hazards] 
                  : [],
              // Ensure emergencyActions is an array
              emergencyActions: Array.isArray(result.analysis.emergencyActions) 
                ? result.analysis.emergencyActions 
                : result.analysis.emergencyActions 
                  ? [result.analysis.emergencyActions] 
                  : []
            }
          };
          
          console.log('🔧 Safe analysis structure:', safeResult);
          
          // Update state - the component should be mounted at this point
          setAnalysis(safeResult);
          setScanProgress(100);
          clearInterval(progressInterval);
          console.log('✅ Analysis state updated successfully');
          
          // Voice announcement of results
          const riskLevel = safeResult.analysis.riskLevel || 'unknown';
          const announcement = riskLevel === 'HIGH' 
            ? translate('ai.high-risk-detected', 'High fire risk detected. Please review recommendations immediately.')
            : riskLevel === 'MEDIUM'
            ? translate('ai.medium-risk-detected', 'Medium fire risk detected. Consider taking preventive action.')
            : translate('ai.low-risk-detected', 'Low fire risk detected. Area appears relatively safe.');
          
          speak(announcement, { emergency: riskLevel === 'HIGH' });
        } else {
          console.error('❌ Invalid response structure:', result);
          setAnalysis({ 
            error: 'Invalid response from server',
            analysis: null 
          });
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Server error:', response.status, errorText);
        throw new Error(`Analysis failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      clearInterval(progressInterval);
      setScanProgress(0);
      setAnalysis({ 
        error: 'Analysis failed. Please try again.',
        analysis: null 
      });
      speak(translate('ai.analysis-failed', 'AI analysis failed. Please try again or check your connection.'));
    } finally {
      console.log('🔄 Setting loading to false...');
      setLoading(false);
      console.log('✅ Loading state updated');
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'extreme': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskScoreColor = (score) => {
    if (score >= 80) return 'text-red-700 bg-red-100';
    if (score >= 60) return 'text-red-600 bg-red-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getResultsBoxColor = (overallRisk, riskScore) => {
    const risk = overallRisk?.toLowerCase();
    const score = riskScore || 0;
    
    // Check both overall risk and score for comprehensive color coding
    if (risk === 'extreme' || score >= 80) {
      return 'bg-red-50 border-red-200';
    } else if (risk === 'high' || score >= 60) {
      return 'bg-orange-50 border-orange-200';
    } else if (risk === 'medium' || score >= 40) {
      return 'bg-yellow-50 border-yellow-200';
    } else {
      return 'bg-green-50 border-green-200';
    }
  };

  const getResultsTextColor = (overallRisk, riskScore) => {
    const risk = overallRisk?.toLowerCase();
    const score = riskScore || 0;
    
    if (risk === 'extreme' || score >= 80) {
      return 'text-red-800';
    } else if (risk === 'high' || score >= 60) {
      return 'text-orange-800';
    } else if (risk === 'medium' || score >= 40) {
      return 'text-yellow-800';
    } else {
      return 'text-green-800';
    }
  };

  const getResultsIcon = (overallRisk, riskScore) => {
    const risk = overallRisk?.toLowerCase();
    const score = riskScore || 0;
    
    if (risk === 'extreme' || score >= 80) {
      return '🚨'; // Emergency
    } else if (risk === 'high' || score >= 60) {
      return '⚠️'; // Warning
    } else if (risk === 'medium' || score >= 40) {
      return '⚡'; // Caution
    } else {
      return '✅'; // Safe
    }
  };

  // Debug current state
  console.log('🔍 Current HazardDetector state:', {
    loading,
    hasAnalysis: !!analysis,
    hasError: !!analysis?.error,
    hasResults: !!analysis?.analysis,
    analysisType: typeof analysis,
    analysisKeys: analysis ? Object.keys(analysis) : 'none'
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Eye className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              {translate('ai.title', 'AI Wildfire Risk Scanner')}
            </h2>
            <p className="text-gray-600">
              {translate('ai.subtitle', 'Advanced computer vision analysis for vegetation fire risks')}
            </p>
          </div>
        </div>
        
        {location && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-blue-800 text-sm">
              {translate('ai.location', 'Analysis location')}: {location.displayName}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Capture Methods */}
        <div className="space-y-6">
          {/* Camera/Upload Controls */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Zap className="h-5 w-5 text-orange-600 mr-2" />
              {translate('ai.capture-method', 'Image Capture')}
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={startCamera}
                disabled={cameraMode || loading}
                className="flex flex-col items-center p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={translate('ai.start-camera', 'Start camera to scan environment')}
              >
                <Camera className="h-8 w-8 text-blue-600 mb-2" />
                <span className="font-medium text-blue-800">
                  {translate('ai.use-camera', 'Use Camera')}
                </span>
                <span className="text-xs text-gray-600 text-center">
                  {translate('ai.camera-desc', 'Scan environment directly')}
                </span>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex flex-col items-center p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={translate('ai.upload-image', 'Upload image from device')}
              >
                <Upload className="h-8 w-8 text-green-600 mb-2" />
                <span className="font-medium text-green-800">
                  {translate('ai.upload-file', 'Upload File')}
                </span>
                <span className="text-xs text-gray-600 text-center">
                  {translate('ai.upload-desc', 'Select from gallery')}
                </span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Select image file for analysis"
            />

            {/* Camera View */}
            {cameraMode && (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover"
                    aria-label="Camera view for scanning vegetation"
                  />
                  <div className="absolute inset-0 border-4 border-white/30 rounded-lg pointer-events-none"></div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={captureImage}
                      className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition-colors font-medium"
                      aria-label="Capture image for AI analysis"
                    >
                      📸 {translate('ai.capture', 'Capture')}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button
                    onClick={stopCamera}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {translate('ai.cancel', 'Cancel')}
                  </button>
                  <span className="text-sm text-gray-600">
                    {translate('ai.point-vegetation', 'Point camera at vegetation to scan for risks')}
                  </span>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Image Preview */}
          {previewUrl && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Eye className="h-5 w-5 text-green-600 mr-2" />
                {translate('ai.preview', 'Image Preview')}
              </h4>
              <div className="space-y-4">
                <img 
                  src={previewUrl} 
                  alt={translate('ai.preview-alt', 'Selected vegetation for analysis')}
                  className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                />
                {selectedFile && (
                  <div className="text-sm text-gray-600">
                    <p>📁 {selectedFile.name}</p>
                    <p>💾 {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
                
                {/* Analysis Button */}
                <button
                  onClick={analyzeImage}
                  disabled={loading || !selectedFile}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                    loading 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg hover:shadow-xl'
                  }`}
                  aria-label={translate('ai.analyze-button', 'Start AI analysis of selected image')}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>{translate('ai.analyzing', 'Analyzing...')}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      <span>{translate('ai.analyze', 'Analyze with AI')}</span>
                    </>
                  )}
                </button>
                
                {/* Progress Bar */}
                {loading && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Analysis Results */}
        <div className="space-y-6">
          
          {analysis?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium">Analysis Failed</p>
              </div>
              <p className="text-red-600 text-sm mt-1">{analysis.error}</p>
            </div>
          )}

          {analysis?.analysis && (
            <div className="bg-white border rounded-lg p-6 space-y-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <svg className="w-6 h-6 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Analysis Results
              </h3>
              
              {/* Dynamic Risk-Based Results Display */}
              <div className={`p-4 rounded-lg border-2 ${getResultsBoxColor(analysis.analysis.overallRisk, analysis.analysis.riskScore)}`}>
                <h4 className={`font-semibold ${getResultsTextColor(analysis.analysis.overallRisk, analysis.analysis.riskScore)}`}>
                  {getResultsIcon(analysis.analysis.overallRisk, analysis.analysis.riskScore)} Analysis Complete!
                </h4>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${getResultsTextColor(analysis.analysis.overallRisk, analysis.analysis.riskScore)}`}>
                      Risk Score:
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskScoreColor(analysis.analysis.riskScore)}`}>
                      {analysis.analysis.riskScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${getResultsTextColor(analysis.analysis.overallRisk, analysis.analysis.riskScore)}`}>
                      Overall Risk:
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskColor(analysis.analysis.overallRisk)}`}>
                      {analysis.analysis.overallRisk}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${getResultsTextColor(analysis.analysis.overallRisk, analysis.analysis.riskScore)}`}>
                      Confidence:
                    </span>
                    <span className={`text-sm ${getResultsTextColor(analysis.analysis.overallRisk, analysis.analysis.riskScore)} opacity-80`}>
                      {Math.round((analysis.analysis.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
                
                {analysis.analysis.detectedObjects && (
                  <div className="mt-4 pt-4 border-t border-opacity-30">
                    <h5 className={`font-medium ${getResultsTextColor(analysis.analysis.overallRisk, analysis.analysis.riskScore)}`}>
                      Detected Objects:
                    </h5>
                    <p className={`text-sm mt-1 ${getResultsTextColor(analysis.analysis.overallRisk, analysis.analysis.riskScore)} opacity-80`}>
                      {analysis.analysis.detectedObjects.summary}
                    </p>
                  </div>
                )}
                
                {analysis.analysis.recommendations && analysis.analysis.recommendations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-opacity-30">
                    <h5 className={`font-medium ${getResultsTextColor(analysis.analysis.overallRisk, analysis.analysis.riskScore)}`}>
                      Key Recommendations:
                    </h5>
                    <ul className={`text-sm mt-2 space-y-1 ${getResultsTextColor(analysis.analysis.overallRisk, analysis.analysis.riskScore)} opacity-80`}>
                      {analysis.analysis.recommendations.slice(0, 3).map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>
                            {typeof rec === 'string' ? rec : rec.action || rec.description || JSON.stringify(rec)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* ENHANCED DETAILED ANALYSIS SECTION */}
              {analysis.analysis.detailedAnalysis && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    🔍 Detailed Analysis Breakdown
                  </h4>

                  {/* Fire/Smoke Detection Details */}
                  {analysis.analysis.detailedAnalysis.fire_smoke_detection && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-700 mb-2">🔥 Fire & Smoke Detection</h5>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Fire Detected:</span> 
                          <span className={analysis.analysis.detailedAnalysis.fire_smoke_detection.fire_detected ? 'text-red-600 ml-1' : 'text-green-600 ml-1'}>
                            {analysis.analysis.detailedAnalysis.fire_smoke_detection.fire_detected ? '🔥 YES' : '✅ No'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Smoke Detected:</span> 
                          <span className={analysis.analysis.detailedAnalysis.fire_smoke_detection.smoke_detected ? 'text-orange-600 ml-1' : 'text-green-600 ml-1'}>
                            {analysis.analysis.detailedAnalysis.fire_smoke_detection.smoke_detected ? '💨 YES' : '✅ No'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span> 
                          <span className="ml-1">{analysis.analysis.detailedAnalysis.fire_smoke_detection.detection_confidence}</span>
                        </div>
                        <div>
                          <span className="font-medium">Method:</span> 
                          <span className="ml-1">{analysis.analysis.detailedAnalysis.fire_smoke_detection.detection_method}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="font-medium">Summary:</span> 
                        <span className="ml-1 text-gray-600">{analysis.analysis.detailedAnalysis.fire_smoke_detection.detection_summary}</span>
                      </div>
                    </div>
                  )}

                  {/* Vegetation Analysis Details */}
                  {analysis.analysis.detailedAnalysis.vegetation_analysis && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-700 mb-2">🌿 Vegetation Analysis</h5>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="font-medium">Analysis Success:</span> 
                          <span className={analysis.analysis.detailedAnalysis.vegetation_analysis.analysis_success ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                            {analysis.analysis.detailedAnalysis.vegetation_analysis.analysis_success ? '✅' : '❌'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Coverage:</span> 
                          <span className="ml-1">{analysis.analysis.detailedAnalysis.vegetation_analysis.vegetation_coverage}</span>
                        </div>
                      </div>
                      
                      {analysis.analysis.detailedAnalysis.vegetation_analysis.vegetation_breakdown && (
                        <div className="mb-3">
                          <h6 className="font-medium text-gray-600 mb-1">Vegetation Breakdown:</h6>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>• Dry Vegetation: {analysis.analysis.detailedAnalysis.vegetation_analysis.vegetation_breakdown.dry_vegetation}</div>
                            <div>• Dense Trees: {analysis.analysis.detailedAnalysis.vegetation_analysis.vegetation_breakdown.dense_trees}</div>
                            <div>• Grass/Ground: {analysis.analysis.detailedAnalysis.vegetation_analysis.vegetation_breakdown.grass_ground}</div>
                            <div>• Shrubs/Bushes: {analysis.analysis.detailedAnalysis.vegetation_analysis.vegetation_breakdown.shrubs_bushes}</div>
                          </div>
                        </div>
                      )}

                      {analysis.analysis.detailedAnalysis.vegetation_analysis.fuel_assessment && (
                        <div>
                          <h6 className="font-medium text-gray-600 mb-1">Fuel Assessment:</h6>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>• Fuel Load: {analysis.analysis.detailedAnalysis.vegetation_analysis.fuel_assessment.fuel_load_score}</div>
                            <div>• Ignition Potential: {analysis.analysis.detailedAnalysis.vegetation_analysis.fuel_assessment.ignition_potential}</div>
                            <div>• Fire Spread Risk: {analysis.analysis.detailedAnalysis.vegetation_analysis.fuel_assessment.fire_spread_risk}</div>
                            <div>• Dryness Factor: {analysis.analysis.detailedAnalysis.vegetation_analysis.fuel_assessment.dryness_factor}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Color Analysis */}
                  {analysis.analysis.detailedAnalysis.color_analysis && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-700 mb-2">🎨 Color Analysis</h5>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Green Vegetation:</span> 
                          <span className="ml-1 text-green-600">{analysis.analysis.detailedAnalysis.color_analysis.green_vegetation}</span>
                        </div>
                        <div>
                          <span className="font-medium">Golden Vegetation:</span> 
                          <span className="ml-1 text-yellow-600">{analysis.analysis.detailedAnalysis.color_analysis.golden_vegetation}</span>
                        </div>
                        <div>
                          <span className="font-medium">Brown Vegetation:</span> 
                          <span className="ml-1 text-amber-600">{analysis.analysis.detailedAnalysis.color_analysis.brown_vegetation}</span>
                        </div>
                        <div>
                          <span className="font-medium">Overall Dryness:</span> 
                          <span className="ml-1 text-red-600">{analysis.analysis.detailedAnalysis.color_analysis.overall_dryness}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Objects Detected */}
                  {analysis.analysis.detailedAnalysis.objects_detected && analysis.analysis.detailedAnalysis.objects_detected.length > 0 && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-700 mb-2">🔍 Objects Detected</h5>
                      <div className="space-y-2">
                        {analysis.analysis.detailedAnalysis.objects_detected.map((obj, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-gray-800">{obj.object}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                obj.risk_level === 'HIGH' ? 'bg-red-100 text-red-700' :
                                obj.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {obj.risk_level} RISK
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{obj.description}</p>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Confidence: {(obj.confidence * 100).toFixed(1)}%</span>
                              {obj.coverage_percentage && <span>Coverage: {obj.coverage_percentage}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scoring Breakdown */}
                  {analysis.analysis.detailedAnalysis.scoring_breakdown && (
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-700 mb-2">📈 Scoring Breakdown</h5>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="font-medium">Fire Risk Score:</span> 
                          <span className="ml-1">{analysis.analysis.detailedAnalysis.scoring_breakdown.fire_risk_score}/100</span>
                        </div>
                        <div>
                          <span className="font-medium">Vegetation Risk:</span> 
                          <span className="ml-1">{analysis.analysis.detailedAnalysis.scoring_breakdown.vegetation_risk_score}/100</span>
                        </div>
                        <div>
                          <span className="font-medium">Environmental Risk:</span> 
                          <span className="ml-1">{analysis.analysis.detailedAnalysis.scoring_breakdown.environmental_risk_score}/100</span>
                        </div>
                        <div>
                          <span className="font-medium">Final Score:</span> 
                          <span className="ml-1 font-semibold">{analysis.analysis.detailedAnalysis.scoring_breakdown.final_composite_score}/100</span>
                        </div>
                      </div>
                      
                      {analysis.analysis.detailedAnalysis.scoring_breakdown.scoring_methodology && (
                        <div>
                          <h6 className="font-medium text-gray-600 mb-1">Methodology Weights:</h6>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>• Fire Detection: {analysis.analysis.detailedAnalysis.scoring_breakdown.scoring_methodology.fire_detection_weight}</div>
                            <div>• Vegetation: {analysis.analysis.detailedAnalysis.scoring_breakdown.scoring_methodology.vegetation_weight}</div>
                            <div>• Environmental: {analysis.analysis.detailedAnalysis.scoring_breakdown.scoring_methodology.environmental_weight}</div>
                            <div>• Proximity: {analysis.analysis.detailedAnalysis.scoring_breakdown.scoring_methodology.proximity_weight}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confidence Analysis */}
                  {analysis.analysis.detailedAnalysis.confidence_analysis && (
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-700 mb-2">🎯 Confidence Analysis</h5>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="font-medium">Overall Confidence:</span> 
                          <span className="ml-1">{analysis.analysis.detailedAnalysis.confidence_analysis.overall_confidence}</span>
                        </div>
                        <div>
                          <span className="font-medium">Fire Detection:</span> 
                          <span className="ml-1">{analysis.analysis.detailedAnalysis.confidence_analysis.fire_detection_confidence}</span>
                        </div>
                      </div>
                      
                      {analysis.analysis.detailedAnalysis.confidence_analysis.confidence_factors && (
                        <div>
                          <h6 className="font-medium text-gray-600 mb-1">Contributing Factors:</h6>
                          <ul className="text-xs space-y-1">
                            {analysis.analysis.detailedAnalysis.confidence_analysis.confidence_factors.map((factor, index) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-1">•</span>
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Technical Metadata */}
                  {analysis.analysis.detailedAnalysis.technical_metadata && (
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-700 mb-2">⚙️ Technical Details</h5>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Analysis Time:</span> 
                          <span className="ml-1">{analysis.analysis.detailedAnalysis.technical_metadata.analysis_timestamp}</span>
                        </div>
                        <div>
                          <span className="font-medium">Processing Time:</span> 
                          <span className="ml-1">{analysis.analysis.detailedAnalysis.technical_metadata.processing_time_ms}ms</span>
                        </div>
                      </div>
                      
                      {analysis.analysis.detailedAnalysis.technical_metadata.ai_models_used && (
                        <div className="mt-2">
                          <h6 className="font-medium text-gray-600 mb-1">AI Models Used:</h6>
                          <div className="text-xs space-y-1">
                            {Object.entries(analysis.analysis.detailedAnalysis.technical_metadata.ai_models_used).map(([key, value]) => (
                              <div key={key}>• {key}: {value}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!analysis && !loading && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>Upload an image to get started with AI analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}