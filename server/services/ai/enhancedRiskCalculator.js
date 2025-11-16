/**
 * Enhanced Risk Calculator for Specialized AI Models
 * Works with fire detection and vegetation fuel analysis results
 */

export class EnhancedRiskCalculator {
  constructor() {
    this.riskWeights = {
      fire_detection: 0.50,      // Highest weight for actual fire/smoke
      vegetation_fuel: 0.25,     // Significant weight for fuel load
      environmental: 0.15,       // Weather and seasonal factors
      proximity: 0.10           // Structures and WUI risk
    };

    this.emergencyThresholds = {
      fire_detected: 95,         // Immediate maximum risk
      smoke_detected: 80,        // Very high risk
      extreme_fuel: 75,          // High fuel load threshold
      high_fuel: 60             // Moderate-high fuel threshold
    };
  }

  /**
   * Calculate comprehensive fire risk from enhanced analysis
   */
  async calculateEnhancedRisk(enhancedAnalysis, weatherData = null, locationData = null) {
    console.log('🔥 Computing enhanced fire risk assessment...');

    const riskAssessment = {
      // Primary risk components
      fire_risk_score: this.calculateFireRiskScore(enhancedAnalysis.fire_analysis),
      vegetation_risk_score: this.calculateVegetationRiskScore(enhancedAnalysis.vegetation_analysis),
      environmental_risk_score: await this.calculateEnvironmentalRisk(weatherData, locationData),
      
      // Combined assessment
      composite_risk_score: 0,
      base_risk_score: 0,
      
      // Risk categorization
      risk_category: '',
      risk_level: '',
      confidence_level: enhancedAnalysis.combined_assessment?.confidence || 0.5,
      
      // Emergency status
      emergency_detected: false,
      emergency_type: null,
      
      // Analysis breakdown
      risk_components: {},
      risk_factors: [],
      immediate_actions: [],
      recommendations: [],
      
      // Metadata
      analysis_timestamp: new Date().toISOString(),
      model_versions: {
        fire_detection: 'prithivMLmods/Fire-Detection-Siglip2',
        vegetation_analysis: 'Enhanced segmentation pipeline',
        risk_calculator: 'enhanced-v3.0'
      }
    };

    // Calculate component scores
    const fireScore = riskAssessment.fire_risk_score;
    const vegetationScore = riskAssessment.vegetation_risk_score;
    const environmentalScore = riskAssessment.environmental_risk_score;

    // Check for emergency conditions FIRST
    riskAssessment.emergency_detected = this.detectEmergencyConditions(enhancedAnalysis);
    
    if (riskAssessment.emergency_detected) {
      riskAssessment.emergency_type = this.identifyEmergencyType(enhancedAnalysis);
      riskAssessment.composite_risk_score = this.getEmergencyRiskScore(enhancedAnalysis);
      console.log(`🚨 EMERGENCY DETECTED: ${riskAssessment.emergency_type} - Risk Score: ${riskAssessment.composite_risk_score}`);
    } else {
      // Normal weighted calculation
      riskAssessment.base_risk_score = this.calculateBaseRisk(fireScore, vegetationScore);
      riskAssessment.composite_risk_score = this.calculateCompositeRisk(
        riskAssessment.base_risk_score,
        environmentalScore
      );
    }

    // Finalize assessment
    riskAssessment.risk_category = this.getRiskCategory(riskAssessment.composite_risk_score);
    riskAssessment.risk_level = this.getRiskLevel(riskAssessment.composite_risk_score);
    
    // Generate comprehensive detailed analysis
    riskAssessment.detailed_analysis = this.generateDetailedAnalysis(enhancedAnalysis, riskAssessment);
    riskAssessment.risk_components = this.analyzeRiskComponents(enhancedAnalysis, riskAssessment);
    riskAssessment.risk_factors = this.identifyRiskFactors(enhancedAnalysis, riskAssessment);
    riskAssessment.immediate_actions = this.generateImmediateActions(riskAssessment);
    riskAssessment.recommendations = this.generateRecommendations(riskAssessment, enhancedAnalysis);

    console.log(`✅ Enhanced risk calculation complete: ${riskAssessment.risk_level} (${riskAssessment.composite_risk_score.toFixed(1)})`);
    return riskAssessment;
  }

  /**
   * Calculate fire risk score from specialized fire detection
   */
  calculateFireRiskScore(fireAnalysis) {
    if (!fireAnalysis || !fireAnalysis.success) {
      return 0; // No fire detection data
    }

    let fireRiskScore = 0;

    // CRITICAL: Active fire detection (MAXIMUM priority)
    if (fireAnalysis.fire_detected) {
      fireRiskScore = 100; // ALWAYS maximum for active fire
      console.log(`🔥 ACTIVE FIRE DETECTED: ${fireRiskScore} risk points (EMERGENCY)`);
    }
    // Smoke detection (very high priority)  
    else if (fireAnalysis.smoke_detected) {
      fireRiskScore = 85 + (fireAnalysis.scores?.smoke || 0) * 15; // 85-100 range
      console.log(`💨 SMOKE DETECTED: ${fireRiskScore.toFixed(1)} risk points (HIGH RISK)`);
    }
    // No fire/smoke detected
    else {
      fireRiskScore = 5; // Very low baseline risk
      console.log(`✅ No fire/smoke detected: ${fireRiskScore} risk points`);
    }

    return Math.min(100, Math.max(0, fireRiskScore));
  }

  /**
   * Calculate vegetation risk score from fuel analysis
   */
  calculateVegetationRiskScore(vegetationAnalysis) {
    if (!vegetationAnalysis || !vegetationAnalysis.success) {
      return 30; // Conservative default
    }

    const fuelAssessment = vegetationAnalysis.fuel_load_assessment;
    const fuelLoadScore = fuelAssessment?.fuel_load_score || 0;
    const ignitionPotential = fuelAssessment?.ignition_potential || 0;
    const fireSpreadRisk = fuelAssessment?.fire_spread_risk || 0;
    const drynessBonus = fuelAssessment?.dryness_factor || 0;

    // PROPERLY CALIBRATED: Major adjustments for green vs dry vegetation
    let vegetationRiskScore = (
      fuelLoadScore * 40 +           // Base fuel load 
      ignitionPotential * 20 +       // Ignition ease 
      fireSpreadRisk * 15            // Fire spread potential
    );

    // CHECK FOR GREEN VEGETATION (should get major discount)
    const colorAnalysis = vegetationAnalysis?.color_analysis;
    if (colorAnalysis && colorAnalysis.green_ratio > 0.4) {
      // MAJOR GREEN DISCOUNT for healthy landscapes
      const greenDiscount = colorAnalysis.green_ratio * 40;  // Up to -40 points for very green
      vegetationRiskScore = Math.max(5, vegetationRiskScore - greenDiscount);
      console.log(`🌿 MAJOR GREEN DISCOUNT: -${greenDiscount.toFixed(1)} points for ${(colorAnalysis.green_ratio*100).toFixed(1)}% green vegetation`);
    }
    // DRYNESS BONUS: only for truly dry conditions
    else if (drynessBonus > 0.6) {
      const drynessPoints = (drynessBonus - 0.6) * 30;  // Bonus above 60% dryness
      vegetationRiskScore += drynessPoints;
      console.log(`🔥 DRYNESS BONUS: +${drynessPoints.toFixed(1)} points for ${(drynessBonus * 100).toFixed(1)}% dryness`);
    }

    console.log(`🌿 Enhanced vegetation risk: Fuel=${fuelLoadScore.toFixed(2)}, Ignition=${ignitionPotential.toFixed(2)}, Spread=${fireSpreadRisk.toFixed(2)}, Dryness=${drynessBonus.toFixed(2)} -> ${vegetationRiskScore.toFixed(1)} points`);

    return Math.min(100, Math.max(0, vegetationRiskScore));
  }

  /**
   * Detect emergency conditions requiring immediate response
   */
  detectEmergencyConditions(enhancedAnalysis) {
    const fireAnalysis = enhancedAnalysis.fire_analysis;
    
    // CRITICAL: ANY fire detection is emergency
    if (fireAnalysis?.fire_detected) {
      return true;
    }
    
    // ANY smoke detection is emergency (even low confidence)
    if (fireAnalysis?.smoke_detected) {
      return true;
    }
    
    // Visual fire analysis emergency conditions
    if (fireAnalysis?.visual_analysis) {
      const visual = fireAnalysis.visual_analysis;
      if (visual.fire_pixels > 0 || visual.fire_ratio > 0.0001) {
        return true;  // Any visible fire pixels
      }
      if (visual.smoke_pixels > 2000 || visual.smoke_ratio > 0.08) {
        return true;  // Significant smoke presence (stricter threshold)
      }
    }
    
    // Vegetation-based emergencies - ONLY for extremely dry conditions
    const vegetationAnalysis = enhancedAnalysis.vegetation_analysis;
    
    // Check if vegetation is actually green (should NOT be emergency)
    const colorAnalysis = vegetationAnalysis?.color_analysis;
    if (colorAnalysis && colorAnalysis.green_ratio > 0.3) {
      // Green vegetation should never trigger emergency
      return false;
    }
    
    // Only trigger for extreme dry conditions
    if (vegetationAnalysis?.fuel_load_assessment?.fuel_load_score > 0.95) {
      return true;
    }
    
    if (vegetationAnalysis?.fuel_load_assessment?.dryness_factor > 0.95) {
      return true;
    }

    return false;
  }

  /**
   * Identify type of emergency detected
   */
  identifyEmergencyType(enhancedAnalysis) {
    const fireAnalysis = enhancedAnalysis.fire_analysis;
    
    if (fireAnalysis?.fire_detected) {
      return `Active Fire (${(fireAnalysis.scores?.fire * 100).toFixed(1)}% confidence)`;
    }
    
    if (fireAnalysis?.smoke_detected) {
      return `Smoke Detected (${(fireAnalysis.scores?.smoke * 100).toFixed(1)}% confidence)`;
    }
    
    const vegetationAnalysis = enhancedAnalysis.vegetation_analysis;
    if (vegetationAnalysis?.fuel_load_assessment?.fuel_load_score > 0.85) {
      return `Extreme Fuel Load (${(vegetationAnalysis.fuel_load_assessment.fuel_load_score * 100).toFixed(1)}%)`;
    }
    
    if (vegetationAnalysis?.fuel_load_assessment?.dryness_factor > 0.9) {
      return `Severe Vegetation Dryness (${(vegetationAnalysis.fuel_load_assessment.dryness_factor * 100).toFixed(1)}%)`;
    }

    return 'Emergency Conditions';
  }

  /**
   * Get emergency risk score based on emergency type
   */
  getEmergencyRiskScore(enhancedAnalysis) {
    const fireAnalysis = enhancedAnalysis.fire_analysis;
    
    if (fireAnalysis?.fire_detected) {
      return this.emergencyThresholds.fire_detected; // 95+
    }
    
    if (fireAnalysis?.smoke_detected) {
      return this.emergencyThresholds.smoke_detected; // 80+
    }
    
    const vegetationAnalysis = enhancedAnalysis.vegetation_analysis;
    if (vegetationAnalysis?.fuel_load_assessment?.fuel_load_score > 0.85) {
      return this.emergencyThresholds.extreme_fuel; // 75+
    }
    
    if (vegetationAnalysis?.fuel_load_assessment?.dryness_factor > 0.9) {
      return this.emergencyThresholds.extreme_fuel; // 75+ for severe dryness
    }

    return this.emergencyThresholds.high_fuel; // 60+
  }

  /**
   * Calculate base risk from primary factors
   */
  calculateBaseRisk(fireScore, vegetationScore) {
    return (
      fireScore * this.riskWeights.fire_detection +
      vegetationScore * this.riskWeights.vegetation_fuel
    );
  }

  /**
   * Calculate environmental risk factors
   */
  async calculateEnvironmentalRisk(weatherData, locationData) {
    let environmentalScore = 50; // Neutral baseline

    if (weatherData) {
      // Wind increases fire spread risk
      const windFactor = Math.min(25, (weatherData.windSpeed || 0) * 1.5);
      
      // Low humidity increases fire risk
      const humidityFactor = Math.max(0, 30 - (weatherData.humidity || 50));
      
      // High temperature increases fire risk
      const tempFactor = Math.min(20, Math.max(0, (weatherData.temperature || 20) - 20));
      
      environmentalScore = windFactor + humidityFactor + tempFactor;
    }

    // Location-based risk (California fire season, etc.)
    if (locationData) {
      const month = new Date().getMonth() + 1;
      if (locationData.state === 'CA' && month >= 6 && month <= 10) {
        environmentalScore += 15; // California fire season boost
      }
    }

    return Math.min(100, Math.max(0, environmentalScore));
  }

  /**
   * Calculate final composite risk
   */
  calculateCompositeRisk(baseRisk, environmentalRisk) {
    const compositeScore = (baseRisk * 0.8) + (environmentalRisk * 0.2);
    
    // Apply multipliers for extreme conditions
    let multiplier = 1.0;
    if (environmentalRisk > 80) multiplier = 1.2;
    if (baseRisk > 80 && environmentalRisk > 60) multiplier = 1.3;
    
    return Math.min(100, compositeScore * multiplier);
  }

  /**
   * Generate comprehensive detailed analysis breakdown
   */
  generateDetailedAnalysis(enhancedAnalysis, riskAssessment) {
    const fireAnalysis = enhancedAnalysis.fire_analysis || {};
    const vegetationAnalysis = enhancedAnalysis.vegetation_analysis || {};
    const colorAnalysis = vegetationAnalysis.color_analysis || {};
    
    return {
      // FIRE/SMOKE DETECTION DETAILS
      fire_smoke_detection: {
        fire_detected: fireAnalysis.fire_detected || false,
        smoke_detected: fireAnalysis.smoke_detected || false,
        detection_confidence: ((fireAnalysis.confidence || 0) * 100).toFixed(1) + '%',
        detection_method: fireAnalysis.visual_analysis ? 'Visual Analysis' : 'AI Model',
        visual_analysis: fireAnalysis.visual_analysis ? {
          fire_pixels_detected: fireAnalysis.visual_analysis.fire_pixels || 0,
          smoke_pixels_detected: fireAnalysis.visual_analysis.smoke_pixels || 0,
          fire_coverage_percentage: ((fireAnalysis.visual_analysis.fire_ratio || 0) * 100).toFixed(3) + '%',
          smoke_coverage_percentage: ((fireAnalysis.visual_analysis.smoke_ratio || 0) * 100).toFixed(1) + '%'
        } : null,
        detection_summary: fireAnalysis.detection_summary || 'No fire or smoke detected'
      },
      
      // VEGETATION ANALYSIS DETAILS
      vegetation_analysis: {
        analysis_success: vegetationAnalysis.success || false,
        vegetation_coverage: ((vegetationAnalysis.vegetation_coverage || 0) * 100).toFixed(1) + '%',
        vegetation_breakdown: {
          dry_vegetation: ((vegetationAnalysis.vegetation_breakdown?.dry_vegetation || 0) * 100).toFixed(1) + '%',
          dense_trees: ((vegetationAnalysis.vegetation_breakdown?.dense_trees || 0) * 100).toFixed(1) + '%',
          grass_ground: ((vegetationAnalysis.vegetation_breakdown?.grass_ground || 0) * 100).toFixed(1) + '%',
          shrubs_bushes: ((vegetationAnalysis.vegetation_breakdown?.shrubs_bushes || 0) * 100).toFixed(1) + '%'
        },
        fuel_assessment: {
          fuel_load_score: ((vegetationAnalysis.fuel_load_assessment?.fuel_load_score || 0) * 100).toFixed(1) + '%',
          fuel_density: vegetationAnalysis.fuel_load_assessment?.fuel_density || 'Unknown',
          ignition_potential: ((vegetationAnalysis.fuel_load_assessment?.ignition_potential || 0) * 100).toFixed(1) + '%',
          fire_spread_risk: ((vegetationAnalysis.fuel_load_assessment?.fire_spread_risk || 0) * 100).toFixed(1) + '%',
          dryness_factor: ((vegetationAnalysis.fuel_load_assessment?.dryness_factor || 0) * 100).toFixed(1) + '%'
        }
      },
      
      // COLOR ANALYSIS DETAILS
      color_analysis: colorAnalysis.golden_ratio !== undefined ? {
        green_vegetation: (colorAnalysis.green_ratio * 100).toFixed(1) + '%',
        golden_vegetation: (colorAnalysis.golden_ratio * 100).toFixed(1) + '%',
        brown_vegetation: (colorAnalysis.brown_ratio * 100).toFixed(1) + '%',
        yellow_vegetation: (colorAnalysis.yellow_ratio * 100).toFixed(1) + '%',
        overall_dryness: (colorAnalysis.dryness_factor * 100).toFixed(1) + '%',
        analysis_method: 'RGB Pixel Analysis'
      } : null,
      
      // OBJECTS DETECTED
      objects_detected: enhancedAnalysis.combined_assessment?.objects_detected || [],
      
      // SCORING BREAKDOWN
      scoring_breakdown: {
        fire_risk_score: riskAssessment.fire_risk_score?.toFixed(1) || '0.0',
        vegetation_risk_score: riskAssessment.vegetation_risk_score?.toFixed(1) || '0.0',
        environmental_risk_score: riskAssessment.environmental_risk_score?.toFixed(1) || '0.0',
        base_risk_score: riskAssessment.base_risk_score?.toFixed(1) || '0.0',
        final_composite_score: riskAssessment.composite_risk_score.toFixed(1),
        scoring_methodology: {
          fire_detection_weight: (this.riskWeights.fire_detection * 100).toFixed(0) + '%',
          vegetation_weight: (this.riskWeights.vegetation_fuel * 100).toFixed(0) + '%',
          environmental_weight: (this.riskWeights.environmental * 100).toFixed(0) + '%',
          proximity_weight: (this.riskWeights.proximity * 100).toFixed(0) + '%'
        }
      },
      
      // CONFIDENCE ANALYSIS
      confidence_analysis: {
        overall_confidence: (riskAssessment.confidence_level * 100).toFixed(1) + '%',
        fire_detection_confidence: fireAnalysis.confidence ? (fireAnalysis.confidence * 100).toFixed(1) + '%' : 'N/A',
        vegetation_analysis_confidence: vegetationAnalysis.confidence ? (vegetationAnalysis.confidence * 100).toFixed(1) + '%' : 'N/A',
        confidence_factors: this.getConfidenceFactors(enhancedAnalysis)
      },
      
      // TECHNICAL METADATA
      technical_metadata: {
        analysis_timestamp: riskAssessment.analysis_timestamp,
        processing_time_ms: enhancedAnalysis.processing_time || 'Unknown',
        ai_models_used: riskAssessment.model_versions || {},
        emergency_thresholds: {
          fire_detection: this.emergencyThresholds.fire_detected,
          smoke_detection: this.emergencyThresholds.smoke_detected,
          extreme_fuel: this.emergencyThresholds.extreme_fuel,
          high_fuel: this.emergencyThresholds.high_fuel
        }
      }
    };
  }
  
  /**
   * Get factors contributing to confidence level
   */
  getConfidenceFactors(enhancedAnalysis) {
    const factors = [];
    
    const fireAnalysis = enhancedAnalysis.fire_analysis;
    if (fireAnalysis?.success) {
      if (fireAnalysis.fire_detected || fireAnalysis.smoke_detected) {
        factors.push('Positive fire/smoke detection increases confidence');
      }
      if (fireAnalysis.visual_analysis) {
        factors.push('Visual pixel analysis provides additional validation');
      }
    }
    
    const vegetationAnalysis = enhancedAnalysis.vegetation_analysis;
    if (vegetationAnalysis?.success) {
      if (vegetationAnalysis.color_analysis) {
        factors.push('Color analysis provides vegetation dryness validation');
      }
      if (vegetationAnalysis.fuel_load_assessment) {
        factors.push('Fuel load assessment completed successfully');
      }
    }
    
    if (factors.length === 0) {
      factors.push('Limited analysis components available');
    }
    
    return factors;
  }

  /**
   * Analyze individual risk components
   */
  analyzeRiskComponents(enhancedAnalysis, riskAssessment) {
    return {
      fire_detection: {
        score: riskAssessment.fire_risk_score,
        status: this.getComponentStatus(riskAssessment.fire_risk_score),
        details: enhancedAnalysis.fire_analysis
      },
      vegetation_fuel: {
        score: riskAssessment.vegetation_risk_score,
        status: this.getComponentStatus(riskAssessment.vegetation_risk_score),
        details: enhancedAnalysis.vegetation_analysis
      },
      environmental: {
        score: riskAssessment.environmental_risk_score,
        status: this.getComponentStatus(riskAssessment.environmental_risk_score),
        details: 'Weather and seasonal factors'
      },
      emergency_status: {
        detected: riskAssessment.emergency_detected,
        type: riskAssessment.emergency_type,
        requires_immediate_action: riskAssessment.emergency_detected
      }
    };
  }

  /**
   * Identify specific risk factors
   */
  identifyRiskFactors(enhancedAnalysis, riskAssessment) {
    const riskFactors = [];

    // Emergency factors
    if (riskAssessment.emergency_detected) {
      riskFactors.push({
        factor: riskAssessment.emergency_type,
        severity: 'critical',
        description: 'Emergency conditions detected requiring immediate attention',
        impact: 'Immediate threat to life and property'
      });
    }

    // Fire detection factors
    const fireAnalysis = enhancedAnalysis.fire_analysis;
    if (fireAnalysis?.fire_detected) {
      riskFactors.push({
        factor: 'Active Fire Detected',
        severity: 'critical',
        description: fireAnalysis.detection_summary,
        impact: 'Immediate evacuation may be required'
      });
    } else if (fireAnalysis?.smoke_detected) {
      riskFactors.push({
        factor: 'Smoke Detected',
        severity: 'high',
        description: fireAnalysis.detection_summary,
        impact: 'Nearby fire activity likely - monitor alerts'
      });
    }

    // Vegetation factors
    const vegetationAnalysis = enhancedAnalysis.vegetation_analysis;
    if (vegetationAnalysis?.fuel_load_assessment?.fuel_load_score > 0.6) {
      riskFactors.push({
        factor: 'High Fuel Load',
        severity: 'high',
        description: `${vegetationAnalysis.fuel_load_assessment.fuel_density} vegetation density detected`,
        impact: 'Increases fire intensity and spread rate'
      });
    }

    // Add vegetation-specific risk factors
    if (vegetationAnalysis?.fire_risk_factors) {
      vegetationAnalysis.fire_risk_factors.forEach(factor => {
        riskFactors.push({
          factor: factor,
          severity: 'medium',
          description: 'Vegetation pattern increases fire risk',
          impact: 'May contribute to fire spread'
        });
      });
    }

    return riskFactors;
  }

  /**
   * Generate immediate actions for high-risk situations
   */
  generateImmediateActions(riskAssessment) {
    const actions = [];

    if (riskAssessment.emergency_detected) {
      if (riskAssessment.emergency_type.includes('Active Fire')) {
        actions.push({
          action: 'EVACUATE IMMEDIATELY if safe to do so',
          urgency: 'immediate',
          description: 'Active fire detected - follow evacuation routes'
        });
        actions.push({
          action: 'Call 911 if not already reported',
          urgency: 'immediate',
          description: 'Report fire location and conditions'
        });
      } else if (riskAssessment.emergency_type.includes('Smoke')) {
        actions.push({
          action: 'Prepare for potential evacuation',
          urgency: 'immediate',
          description: 'Monitor emergency alerts and evacuation routes'
        });
        actions.push({
          action: 'Close windows and doors',
          urgency: 'immediate',
          description: 'Protect against smoke inhalation'
        });
      }
    }

    if (riskAssessment.composite_risk_score >= 75) {
      actions.push({
        action: 'Create emergency supply kit',
        urgency: 'immediate',
        description: 'Include water, medications, documents, and essentials'
      });
    }

    return actions;
  }

  /**
   * Generate recommendations based on risk level
   */
  generateRecommendations(riskAssessment, enhancedAnalysis) {
    const recommendations = [];
    const riskScore = riskAssessment.composite_risk_score;

    // Risk-level based recommendations
    if (riskScore >= 75) {
      recommendations.push({
        category: 'Emergency Preparedness',
        action: 'Maintain evacuation readiness',
        priority: 'critical',
        timeline: 'ongoing'
      });
    } else if (riskScore >= 50) {
      recommendations.push({
        category: 'Fire Safety',
        action: 'Create 100-foot defensible space',
        priority: 'high',
        timeline: '1-2 weeks'
      });
    } else if (riskScore >= 25) {
      recommendations.push({
        category: 'Prevention',
        action: 'Maintain basic fire safety measures',
        priority: 'medium',
        timeline: '1-2 months'
      });
    }

    // Vegetation-specific recommendations
    const vegetationAnalysis = enhancedAnalysis.vegetation_analysis;
    if (vegetationAnalysis?.fuel_load_assessment?.fuel_load_score > 0.5) {
      recommendations.push({
        category: 'Fuel Reduction',
        action: 'Remove dry vegetation and create fuel breaks',
        priority: 'high',
        timeline: '2-4 weeks'
      });
    }

    return recommendations;
  }

  // Helper methods
  getComponentStatus(score) {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'moderate';
    return 'low';
  }

  getRiskCategory(score) {
    if (score >= 75) return 'EXTREME';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MODERATE';
    return 'LOW';
  }

  getRiskLevel(score) {
    if (score >= 75) return 'Extreme Risk';
    if (score >= 50) return 'High Risk';
    if (score >= 25) return 'Moderate Risk';
    return 'Low Risk';
  }
}