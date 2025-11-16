import { useState, useEffect, useCallback, useMemo } from 'react';
import { FirePredictionService } from '../services/ai/firePredictionService.js';

/**
 * React hook for AI-powered fire spread prediction
 * Provides transformer-based fire behavior modeling and risk assessment
 */
export const useFirePrediction = (fireData, weatherData, terrainData = {}, options = {}) => {
  const {
    predictionDays = 3,
    autoRefresh = true,
    refreshInterval = 1800000, // 30 minutes
    enableAdvancedModels = true
  } = options;

  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);

  const predictionService = useMemo(() => new FirePredictionService(), []);

  // Helper functions - defined first to avoid initialization issues
  // Analyze threat directions from predictions
  const analyzeThreatDirections = useCallback((dailyPredictions) => {
    const directionCounts = {};
    let maxThreatDirection = null;
    let maxThreatLevel = 0;

    dailyPredictions.forEach(day => {
      const direction = day.expectedSpreadDirection;
      if (direction) {
        directionCounts[direction] = (directionCounts[direction] || 0) + 1;
        
        if (day.riskScore > maxThreatLevel) {
          maxThreatLevel = day.riskScore;
          maxThreatDirection = direction;
        }
      }
    });

    return {
      primaryDirection: maxThreatDirection,
      maxThreatLevel,
      directionFrequency: directionCounts,
      mostCommonDirection: Object.keys(directionCounts).reduce((a, b) => 
        directionCounts[a] > directionCounts[b] ? a : b, null)
    };
  }, []);

  // Categorize overall threat level
  const categorizeOverallThreat = useCallback((summary) => {
    const { highestRisk, averageRisk, riskTrend } = summary;
    
    let threat = 'low';
    if (highestRisk > 80 || averageRisk > 60) threat = 'extreme';
    else if (highestRisk > 60 || averageRisk > 40) threat = 'high';
    else if (highestRisk > 40 || averageRisk > 25) threat = 'moderate';
    
    // Adjust for trend
    if (riskTrend === 'increasing' && threat !== 'extreme') {
      const levels = ['low', 'moderate', 'high', 'extreme'];
      const currentIndex = levels.indexOf(threat);
      threat = levels[Math.min(currentIndex + 1, levels.length - 1)];
    }
    
    return threat;
  }, []);

  // Calculate time until high risk conditions
  const calculateTimeToRisk = useCallback((dailyPredictions) => {
    const highRiskDay = dailyPredictions.find(day => day.riskScore > 60);
    if (!highRiskDay) return null;
    
    const now = new Date();
    const riskDate = new Date(highRiskDay.date);
    const hoursUntilRisk = Math.ceil((riskDate - now) / (1000 * 60 * 60));
    
    return {
      hours: hoursUntilRisk,
      days: Math.ceil(hoursUntilRisk / 24),
      riskLevel: highRiskDay.riskLevel,
      riskScore: highRiskDay.riskScore
    };
  }, []);

  // Calculate evacuation window
  const calculateEvacuationWindow = useCallback((dailyPredictions) => {
    const criticalDay = dailyPredictions.find(day => day.riskScore > 80);
    if (!criticalDay) return null;
    
    const now = new Date();
    const criticalDate = new Date(criticalDay.date);
    const hoursUntilCritical = Math.ceil((criticalDate - now) / (1000 * 60 * 60));
    
    // Evacuation should ideally happen 12-24 hours before critical conditions
    const recommendedEvacuationTime = Math.max(0, hoursUntilCritical - 12);
    
    return {
      hoursRemaining: recommendedEvacuationTime,
      urgency: recommendedEvacuationTime < 6 ? 'immediate' : 
               recommendedEvacuationTime < 24 ? 'urgent' : 'plan',
      criticalConditionsIn: hoursUntilCritical,
      recommendation: getEvacuationRecommendation(recommendedEvacuationTime)
    };
  }, []);

  // Get evacuation recommendation
  const getEvacuationRecommendation = useCallback((hoursRemaining) => {
    if (hoursRemaining <= 0) return 'Evacuate immediately if ordered';
    if (hoursRemaining <= 6) return 'Prepare for immediate evacuation';
    if (hoursRemaining <= 24) return 'Finalize evacuation plans within 24 hours';
    return 'Monitor conditions and prepare evacuation plan';
  }, []);

  const generatePrediction = useCallback(async () => {
    console.log('generatePrediction called with:', { 
      fireData: fireData ? 'available' : 'null', 
      weatherData: weatherData ? 'available' : 'null',
      fireDataType: fireData ? typeof fireData : 'undefined',
      weatherDataType: weatherData ? typeof weatherData : 'undefined'
    });
    
    if (!fireData || !weatherData) {
      console.log('Skipping prediction generation - missing data');
      return;
    }

    console.log('Starting prediction generation...');
    setLoading(true);
    setError(null);

    try {
      const predictionResult = await predictionService.predictFireSpread(
        fireData,
        weatherData,
        terrainData,
        predictionDays
      );
      
      console.log('Prediction result received:', predictionResult ? 'success' : 'null');
      setPredictions(predictionResult);
      setLastUpdate(new Date());
      setModelStatus(predictionService.getStatus());
    } catch (err) {
      console.error('Fire prediction error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log('Prediction generation completed, loading set to false');
    }
  }, [fireData, weatherData, terrainData, predictionDays]);

  // Auto-refresh predictions
  useEffect(() => {
    if (fireData && weatherData) {
      console.log('useEffect triggering prediction generation');
      generatePrediction();
    }
  }, [fireData, weatherData, predictionDays]); // Only re-run when input data changes

  // Separate effect for auto-refresh interval
  useEffect(() => {
    let interval;
    if (autoRefresh && fireData && weatherData) {
      interval = setInterval(() => {
        console.log('Auto-refresh triggering prediction generation');
        generatePrediction();
      }, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]); // Removed fireData, weatherData to prevent infinite loops

  // Processed prediction analytics
  const analytics = useMemo(() => {
    if (!predictions) return null;

    const { predictions: dailyPredictions, summary } = predictions;
    
    // Validate dailyPredictions exists and is an array
    if (!dailyPredictions || !Array.isArray(dailyPredictions)) {
      console.warn('⚠️ useFirePrediction: dailyPredictions is not an array:', dailyPredictions);
      return null;
    }
    
    // Risk progression analysis
    const riskProgression = dailyPredictions.map(day => ({
      day: day.day,
      date: day.date,
      risk: day.riskScore,
      level: day.riskLevel
    }));

    // Critical days identification
    const criticalDays = dailyPredictions.filter(day => 
      day.riskLevel === 'extreme' || day.riskScore > 80
    );

    const highRiskDays = dailyPredictions.filter(day => 
      day.riskLevel === 'very_high' || day.riskLevel === 'high'
    );

    // Threat direction analysis
    const threatDirections = analyzeThreatDirections(dailyPredictions);
    
    // Peak risk analysis
    const peakRiskDay = dailyPredictions.reduce((peak, day) => 
      day.riskScore > peak.riskScore ? day : peak, dailyPredictions[0]
    );

    // Confidence trends
    const avgConfidence = dailyPredictions.reduce((sum, day) => 
      sum + day.conditions.confidence, 0) / dailyPredictions.length;

    return {
      riskProgression,
      criticalDays: criticalDays.length,
      highRiskDays: highRiskDays.length,
      peakRiskDay,
      threatDirections,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      trendDirection: summary.riskTrend,
      overallThreat: categorizeOverallThreat(summary),
      timeToRisk: calculateTimeToRisk(dailyPredictions),
      evacuationWindow: calculateEvacuationWindow(dailyPredictions)
    };
  }, [predictions]);

  // Get predictions for specific day
  const getPredictionForDay = useCallback((day) => {
    if (!predictions) return null;
    return predictions.predictions.find(p => p.day === day);
  }, [predictions]);

  // Get threat level for specific direction
  const getThreatForDirection = useCallback((direction, day = 1) => {
    const dayPrediction = getPredictionForDay(day);
    if (!dayPrediction || !dayPrediction.threatAreas) return null;
    
    return dayPrediction.threatAreas.find(area => 
      area.direction.toLowerCase() === direction.toLowerCase()
    );
  }, [getPredictionForDay]);

  // Manual refresh
  const refresh = useCallback(() => {
    if (fireData && weatherData) {
      generatePrediction();
    }
  }, [fireData, weatherData, generatePrediction]);

  return {
    // Data
    predictions,
    analytics,
    
    // State
    loading,
    error,
    lastUpdate,
    modelStatus,
    
    // Actions
    refresh,
    getPredictionForDay,
    getThreatForDirection,
    
    // Service access
    predictionService
  };
};