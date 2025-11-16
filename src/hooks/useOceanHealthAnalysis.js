/**
 * useOceanHealthAnalysis Hook
 *
 * React hook for ocean health image analysis
 * Provides coral health, erosion, and pollution detection
 *
 * Created for Ocean Awareness Contest 2026
 */

import { useState, useCallback } from 'react';
import {
  analyzeOceanImage,
  analyzeCoralHealth,
  analyzeCoastalErosion,
  analyzePollution,
  comprehensiveOceanAssessment,
  OCEAN_ANALYSIS_TYPES
} from '../services/ocean/oceanHealthAnalyzer';

/**
 * Main hook for ocean health analysis
 */
export function useOceanHealthAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const analyze = useCallback(async (imageData, analysisType = OCEAN_ANALYSIS_TYPES.GENERAL) => {
    try {
      setAnalyzing(true);
      setError(null);
      setProgress(0);

      setProgress(25);

      const analysisResult = await analyzeOceanImage(imageData, analysisType);

      setProgress(100);
      setResult(analysisResult);

      return analysisResult;

    } catch (err) {
      console.error('Ocean health analysis error:', err);
      setError(err.message);
      return null;

    } finally {
      setAnalyzing(false);
    }
  }, []);

  const analyzeCoralReef = useCallback(async (imageData) => {
    try {
      setAnalyzing(true);
      setError(null);
      setProgress(0);

      setProgress(25);

      const result = await analyzeCoralHealth(imageData);

      setProgress(100);
      setResult(result);

      return result;

    } catch (err) {
      console.error('Coral health analysis error:', err);
      setError(err.message);
      return null;

    } finally {
      setAnalyzing(false);
    }
  }, []);

  const analyzeErosion = useCallback(async (imageData) => {
    try {
      setAnalyzing(true);
      setError(null);
      setProgress(0);

      setProgress(25);

      const result = await analyzeCoastalErosion(imageData);

      setProgress(100);
      setResult(result);

      return result;

    } catch (err) {
      console.error('Erosion analysis error:', err);
      setError(err.message);
      return null;

    } finally {
      setAnalyzing(false);
    }
  }, []);

  const analyzePollutionLevels = useCallback(async (imageData) => {
    try {
      setAnalyzing(true);
      setError(null);
      setProgress(0);

      setProgress(25);

      const result = await analyzePollution(imageData);

      setProgress(100);
      setResult(result);

      return result;

    } catch (err) {
      console.error('Pollution analysis error:', err);
      setError(err.message);
      return null;

    } finally {
      setAnalyzing(false);
    }
  }, []);

  const comprehensiveAssessment = useCallback(async (imageData) => {
    try {
      setAnalyzing(true);
      setError(null);
      setProgress(0);

      setProgress(10);

      const result = await comprehensiveOceanAssessment(imageData);

      setProgress(100);
      setResult(result);

      return result;

    } catch (err) {
      console.error('Comprehensive assessment error:', err);
      setError(err.message);
      return null;

    } finally {
      setAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    analyzing,
    result,
    error,
    progress,
    analyze,
    analyzeCoralReef,
    analyzeErosion,
    analyzePollutionLevels,
    comprehensiveAssessment,
    reset,
    hasResult: result !== null
  };
}

/**
 * Helper hook to get health status colors
 */
export function useHealthStatusColors(status) {
  const colors = {
    excellent: {
      bg: 'bg-kelp-50',
      text: 'text-kelp-800',
      border: 'border-kelp-500',
      badge: 'bg-kelp-500 text-white'
    },
    good: {
      bg: 'bg-ocean-50',
      text: 'text-ocean-800',
      border: 'border-ocean-500',
      badge: 'bg-ocean-500 text-white'
    },
    fair: {
      bg: 'bg-sand-50',
      text: 'text-sand-800',
      border: 'border-sand-500',
      badge: 'bg-sand-500 text-white'
    },
    moderate: {
      bg: 'bg-warning-50',
      text: 'text-warning-800',
      border: 'border-warning-500',
      badge: 'bg-warning-500 text-white'
    },
    poor: {
      bg: 'bg-critical-50',
      text: 'text-critical-800',
      border: 'border-critical-500',
      badge: 'bg-critical-500 text-white'
    }
  };

  return colors[status] || colors.fair;
}

export { OCEAN_ANALYSIS_TYPES };
