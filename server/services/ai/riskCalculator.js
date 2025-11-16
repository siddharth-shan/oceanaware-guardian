/**
 * Enhanced Risk Calculator Service
 * Multi-modal fire risk assessment combining AI features and environmental data
 */

export class RiskCalculator {
  constructor() {
    this.riskWeights = {
      fuel_load: 0.25,           // Primary fire energy source
      vertical_continuity: 0.20, // Crown fire potential  
      dryness_index: 0.20,       // Ignition probability
      proximity_to_structures: 0.15, // Asset protection priority
      fragmentation: 0.10,       // Fire spread potential
      weather_modifier: 0.10     // Real-time conditions
    };

    this.riskThresholds = {
      low: 25,
      moderate: 50,
      high: 75,
      extreme: 100
    };
  }

  /**
   * Main risk calculation pipeline
   */
  async calculateFireRisk(features, weatherData = null, locationData = null) {
    console.log('🔥 Calculating comprehensive fire risk...');
    
    const riskAssessment = {
      // Core risk scores
      base_risk_score: this.calculateBaseRiskScore(features),
      environmental_risk: await this.calculateEnvironmentalRisk(weatherData, locationData),
      composite_risk_score: 0,
      
      // Risk components
      risk_components: this.analyzeRiskComponents(features),
      risk_factors: this.identifyRiskFactors(features),
      mitigation_priorities: this.identifyMitigationPriorities(features),
      
      // Risk categorization
      risk_category: '',
      risk_level: '',
      confidence_level: this.calculateConfidenceLevel(features),
      
      // Time-sensitive assessments
      immediate_risk: this.assessImmediateRisk(features, weatherData),
      seasonal_risk: this.assessSeasonalRisk(features, locationData),
      
      // Recommendations
      recommendations: [],
      emergency_actions: [],
      
      // Metadata
      calculation_timestamp: new Date().toISOString(),
      model_version: '2.0'
    };

    // Calculate composite risk score
    riskAssessment.composite_risk_score = this.calculateCompositeRisk(
      riskAssessment.base_risk_score,
      riskAssessment.environmental_risk
    );

    // Determine risk category and level
    riskAssessment.risk_category = this.getRiskCategory(riskAssessment.composite_risk_score);
    riskAssessment.risk_level = this.getRiskLevel(riskAssessment.composite_risk_score);

    // Generate recommendations
    riskAssessment.recommendations = this.generateRecommendations(riskAssessment);
    riskAssessment.emergency_actions = this.generateEmergencyActions(riskAssessment);

    console.log(`✅ Risk calculation complete: ${riskAssessment.risk_level} (${riskAssessment.composite_risk_score})`);
    return riskAssessment;
  }

  /**
   * Calculate base risk score from AI features
   */
  calculateBaseRiskScore(features) {
    const fuelLoadRisk = features.fuel_load?.risk_score || 0;
    const verticalContinuityRisk = features.vertical_continuity?.risk_score || 0;
    const drynessRisk = features.dryness_index?.risk_score || 0;
    const proximityRisk = features.proximity_to_structures?.risk_score || 0;
    const fragmentationRisk = features.fragmentation?.risk_score || 0;

    // ENHANCED: Check for fire indicators and emergency conditions
    const hasActiveFireIndicators = features.dryness_index?.fire_indicators?.active_fire || 
                                   features.dryness_index?.fire_indicators?.smoke_present;
    
    let baseScore = (
      fuelLoadRisk * this.riskWeights.fuel_load +
      verticalContinuityRisk * this.riskWeights.vertical_continuity +
      drynessRisk * this.riskWeights.dryness_index +
      proximityRisk * this.riskWeights.proximity_to_structures +
      fragmentationRisk * this.riskWeights.fragmentation
    );

    // CRITICAL: Emergency override for active fire detection only
    if (hasActiveFireIndicators) {
      console.log('🚨 ACTIVE FIRE DETECTED - Setting maximum risk score');
      baseScore = Math.max(baseScore, 95); // Minimum 95 for active fires
    }
    
    // Enhanced scaling for high-risk scenarios
    if (baseScore > 70) {
      // Apply exponential scaling for very high risk
      baseScore = 70 + (baseScore - 70) * 1.5;
    }

    return Math.min(100, Math.max(0, baseScore));
  }

  /**
   * Calculate environmental risk modifier
   */
  async calculateEnvironmentalRisk(weatherData, locationData) {
    let environmentalScore = 50; // Neutral baseline

    if (weatherData) {
      // Wind factor (higher wind = higher risk)
      const windFactor = Math.min(30, (weatherData.windSpeed || 0) * 2);
      
      // Humidity factor (lower humidity = higher risk)  
      const humidityFactor = Math.max(0, 30 - (weatherData.humidity || 50));
      
      // Temperature factor (higher temp = higher risk)
      const tempFactor = Math.min(20, Math.max(0, (weatherData.temperature || 20) - 20));
      
      // Precipitation factor (less recent rain = higher risk)
      const precipFactor = this.calculatePrecipitationFactor(weatherData);

      environmentalScore = windFactor + humidityFactor + tempFactor + precipFactor;
    }

    // Location-based adjustments
    if (locationData) {
      const locationRisk = this.calculateLocationRisk(locationData);
      environmentalScore = (environmentalScore + locationRisk) / 2;
    }

    return Math.min(100, Math.max(0, environmentalScore));
  }

  /**
   * Analyze individual risk components
   */
  analyzeRiskComponents(features) {
    return {
      fuel_availability: {
        score: features.fuel_load?.risk_score || 0,
        status: this.getComponentStatus(features.fuel_load?.risk_score || 0),
        details: features.fuel_load
      },
      ignition_potential: {
        score: features.dryness_index?.risk_score || 0,
        status: this.getComponentStatus(features.dryness_index?.risk_score || 0),
        details: features.dryness_index
      },
      fire_behavior: {
        score: features.vertical_continuity?.risk_score || 0,
        status: this.getComponentStatus(features.vertical_continuity?.risk_score || 0),
        details: features.vertical_continuity
      },
      asset_exposure: {
        score: features.proximity_to_structures?.risk_score || 0,
        status: this.getComponentStatus(features.proximity_to_structures?.risk_score || 0),
        details: features.proximity_to_structures
      },
      suppression_difficulty: {
        score: features.fragmentation?.risk_score || 0,
        status: this.getComponentStatus(features.fragmentation?.risk_score || 0),
        details: features.fragmentation
      }
    };
  }

  /**
   * Identify key risk factors
   */
  identifyRiskFactors(features) {
    const riskFactors = [];

    // CRITICAL: Active fire detection
    if (features.dryness_index?.fire_indicators?.active_fire) {
      riskFactors.push({
        factor: 'Active Fire Detected',
        severity: 'critical',
        description: 'Active fire or flames visible in the image',
        impact: 'Immediate threat to life and property - evacuate immediately'
      });
    }

    // CRITICAL: Smoke detection  
    if (features.dryness_index?.fire_indicators?.smoke_present) {
      riskFactors.push({
        factor: 'Smoke Detected',
        severity: 'critical',
        description: 'Smoke plumes visible indicating nearby fire activity',
        impact: 'High probability of fire in the area - prepare for evacuation'
      });
    }

    // High fuel load
    if (features.fuel_load?.risk_score > 70) {
      riskFactors.push({
        factor: 'High Fuel Load',
        severity: 'high',
        description: 'Significant amount of combustible vegetation present',
        impact: 'Increases fire intensity and duration'
      });
    }

    // Ladder fuels present
    if (features.vertical_continuity?.ladder_fuel_factor > 0.7) {
      riskFactors.push({
        factor: 'Ladder Fuels',
        severity: 'high',
        description: 'Continuous fuel from ground to tree canopy',
        impact: 'Enables fire to reach tree crowns, creating crown fires'
      });
    }

    // Dry vegetation
    if (features.dryness_index?.dryness_score > 0.7) {
      riskFactors.push({
        factor: 'Dry Vegetation',
        severity: 'medium',
        description: 'Vegetation shows signs of moisture stress',
        impact: 'Increases ignition probability and fire spread rate'
      });
    }

    // Structures at risk
    if (features.proximity_to_structures?.structure_presence && 
        features.proximity_to_structures?.defensible_space_adequacy < 0.5) {
      riskFactors.push({
        factor: 'Inadequate Defensible Space',
        severity: 'high',
        description: 'Vegetation too close to structures',
        impact: 'Increases risk of structure ignition'
      });
    }

    // Dense canopy
    if (features.crown_bulk_density?.crown_fire_potential > 0.7) {
      riskFactors.push({
        factor: 'Dense Tree Canopy',
        severity: 'medium',
        description: 'High density tree canopy present',
        impact: 'Supports crown fire development and spread'
      });
    }

    return riskFactors;
  }

  /**
   * Identify mitigation priorities
   */
  identifyMitigationPriorities(features) {
    const priorities = [];

    // Priority 1: Defensible space around structures
    if (features.proximity_to_structures?.structure_presence && 
        features.proximity_to_structures?.defensible_space_adequacy < 0.7) {
      priorities.push({
        priority: 1,
        action: 'Create Defensible Space',
        description: 'Remove vegetation within 30 feet of structures',
        timeline: 'Immediate (1-2 weeks)',
        impact: 'High'
      });
    }

    // Priority 2: Remove ladder fuels
    if (features.vertical_continuity?.ladder_fuel_factor > 0.6) {
      priorities.push({
        priority: 2,
        action: 'Remove Ladder Fuels',
        description: 'Prune lower tree branches and remove understory vegetation',
        timeline: 'Short-term (1-2 months)',
        impact: 'High'
      });
    }

    // Priority 3: Reduce fuel load
    if (features.fuel_load?.risk_score > 60) {
      priorities.push({
        priority: 3,
        action: 'Fuel Load Reduction',
        description: 'Thin dense vegetation and remove dead/dry material',
        timeline: 'Medium-term (2-6 months)',
        impact: 'Medium'
      });
    }

    // Priority 4: Improve vegetation health
    if (features.vegetation_health?.health_score < 0.5) {
      priorities.push({
        priority: 4,
        action: 'Improve Vegetation Health',
        description: 'Irrigate and maintain healthy vegetation',
        timeline: 'Ongoing',
        impact: 'Medium'
      });
    }

    return priorities.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Calculate composite risk score
   */
  calculateCompositeRisk(baseRisk, environmentalRisk) {
    // Weight base risk more heavily, but allow environmental factors to modify
    const compositeScore = (baseRisk * 0.7) + (environmentalRisk * 0.3);
    
    // Apply multipliers for extreme conditions
    let multiplier = 1.0;
    if (environmentalRisk > 80) multiplier = 1.2; // Extreme weather conditions
    if (baseRisk > 80 && environmentalRisk > 60) multiplier = 1.3; // High base + moderate weather
    
    return Math.min(100, compositeScore * multiplier);
  }

  /**
   * Assess immediate fire risk (24-48 hours)
   */
  assessImmediateRisk(features, weatherData) {
    let immediateRisk = features.dryness_index?.risk_score || 50;
    
    if (weatherData) {
      // Red flag warning conditions
      if (weatherData.windSpeed > 25 && weatherData.humidity < 20) {
        immediateRisk = Math.min(100, immediateRisk * 1.5);
      }
      
      // High temperature with low humidity
      if (weatherData.temperature > 85 && weatherData.humidity < 30) {
        immediateRisk = Math.min(100, immediateRisk * 1.3);
      }
    }

    return {
      risk_score: immediateRisk,
      status: this.getRiskLevel(immediateRisk),
      warning_level: immediateRisk > 75 ? 'RED FLAG' : immediateRisk > 50 ? 'ELEVATED' : 'NORMAL'
    };
  }

  /**
   * Assess seasonal fire risk
   */
  assessSeasonalRisk(features, locationData) {
    const month = new Date().getMonth() + 1; // 1-12
    let seasonalMultiplier = 1.0;

    // California fire season adjustments
    if (locationData?.state === 'CA' || locationData?.region === 'California') {
      if (month >= 6 && month <= 10) seasonalMultiplier = 1.3; // Peak fire season
      else if (month >= 4 && month <= 11) seasonalMultiplier = 1.1; // Extended season
    }

    const seasonalRisk = (features.fuel_load?.risk_score || 50) * seasonalMultiplier;
    
    return {
      risk_score: Math.min(100, seasonalRisk),
      season_factor: seasonalMultiplier,
      peak_season: seasonalMultiplier > 1.2
    };
  }

  /**
   * Generate detailed recommendations
   */
  generateRecommendations(riskAssessment) {
    const recommendations = [];
    const riskScore = riskAssessment.composite_risk_score;

    // General recommendations based on risk level
    if (riskScore < 25) {
      recommendations.push({
        category: 'Maintenance',
        action: 'Continue regular vegetation maintenance',
        priority: 'low',
        timeline: 'ongoing'
      });
    } else if (riskScore < 50) {
      recommendations.push({
        category: 'Prevention',
        action: 'Increase defensible space to 50 feet',
        priority: 'medium',
        timeline: '2-4 weeks'
      });
    } else if (riskScore < 75) {
      recommendations.push({
        category: 'Mitigation',
        action: 'Implement comprehensive fuel reduction program',
        priority: 'high',
        timeline: '1-2 weeks'
      });
    } else {
      recommendations.push({
        category: 'Emergency',
        action: 'Immediate vegetation removal around structures',
        priority: 'critical',
        timeline: 'immediately'
      });
    }

    // Specific recommendations based on risk factors
    riskAssessment.risk_factors.forEach(factor => {
      if (factor.factor === 'Ladder Fuels') {
        recommendations.push({
          category: 'Fuel Management',
          action: 'Remove ladder fuels by pruning trees 6-10 feet from ground',
          priority: 'high',
          timeline: '1-2 weeks'
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate emergency actions for high-risk situations
   */
  generateEmergencyActions(riskAssessment) {
    const actions = [];
    const riskScore = riskAssessment.composite_risk_score;

    if (riskScore > 75) {
      actions.push({
        action: 'Prepare evacuation plan and routes',
        urgency: 'immediate',
        description: 'Review and practice evacuation procedures'
      });

      actions.push({
        action: 'Create emergency supply kit',
        urgency: 'immediate',
        description: 'Include water, medications, documents, and emergency supplies'
      });

      actions.push({
        action: 'Clear immediate ignition sources',
        urgency: 'immediate',
        description: 'Remove all combustible materials within 5 feet of structures'
      });
    }

    if (riskAssessment.immediate_risk?.warning_level === 'RED FLAG') {
      actions.push({
        action: 'Monitor weather and fire conditions closely',
        urgency: 'ongoing',
        description: 'Check fire weather forecasts and local fire activity every 2-3 hours'
      });

      actions.push({
        action: 'Prepare for potential power shutoffs',
        urgency: 'immediate',
        description: 'Charge devices, prepare alternative power sources'
      });
    }

    return actions;
  }

  // Helper methods
  getComponentStatus(score) {
    if (score < 25) return 'low';
    if (score < 50) return 'moderate';
    if (score < 75) return 'high';
    return 'extreme';
  }

  getRiskCategory(score) {
    if (score < this.riskThresholds.low) return 'LOW';
    if (score < this.riskThresholds.moderate) return 'MODERATE';
    if (score < this.riskThresholds.high) return 'HIGH';
    return 'EXTREME';
  }

  getRiskLevel(score) {
    if (score < this.riskThresholds.low) return 'Low Risk';
    if (score < this.riskThresholds.moderate) return 'Moderate Risk';
    if (score < this.riskThresholds.high) return 'High Risk';
    return 'Extreme Risk';
  }

  calculateConfidenceLevel(features) {
    const segmentationConfidence = features.segmentation_confidence || 0.5;
    const imageQuality = features.image_quality?.resolution_score || 0.7;
    const dataCompleteness = this.assessDataCompleteness(features);
    
    return (segmentationConfidence * 0.4) + (imageQuality * 0.3) + (dataCompleteness * 0.3);
  }

  assessDataCompleteness(features) {
    let completeness = 0;
    const requiredFeatures = ['fuel_load', 'vertical_continuity', 'dryness_index', 'proximity_to_structures'];
    
    requiredFeatures.forEach(feature => {
      if (features[feature]) completeness += 0.25;
    });
    
    return completeness;
  }

  calculatePrecipitationFactor(weatherData) {
    // Simplified precipitation factor - would use historical data in production
    const recentPrecip = weatherData.precipitation_24h || 0;
    if (recentPrecip > 10) return 0;   // Recent heavy rain = low risk
    if (recentPrecip > 5) return 5;    // Moderate rain = reduced risk
    if (recentPrecip > 1) return 10;   // Light rain = slightly reduced risk
    return 20; // No recent rain = increased risk
  }

  calculateLocationRisk(locationData) {
    // Simplified location-based risk assessment
    let locationRisk = 50; // Baseline
    
    if (locationData.region === 'California') locationRisk += 20; // High fire risk state
    if (locationData.wildland_urban_interface) locationRisk += 15; // WUI areas higher risk
    if (locationData.historical_fire_activity === 'high') locationRisk += 10;
    
    return Math.min(100, locationRisk);
  }
}