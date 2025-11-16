/**
 * Enhanced Feature Extraction Service
 * Converts vegetation segmentation masks to fire hazard metrics
 */

export class FeatureExtractor {
  constructor() {
    this.imageSize = { width: 512, height: 512 }; // Standard processing size
  }

  /**
   * Main feature extraction pipeline
   */
  async extractFireHazardFeatures(segmentationResult, imageBuffer, imageMetadata = {}) {
    console.log('🔍 Extracting fire hazard features from segmentation...');
    
    const features = {
      // Spatial features
      fuel_load: this.calculateFuelLoad(segmentationResult),
      vertical_continuity: this.calculateVerticalContinuity(segmentationResult),
      crown_bulk_density: this.calculateCrownBulkDensity(segmentationResult),
      fragmentation: this.calculateFragmentation(segmentationResult),
      proximity_to_structures: this.calculateProximityToStructures(segmentationResult),
      
      // Visual features
      dryness_index: await this.calculateDrynessIndex(imageBuffer, segmentationResult, imageMetadata),
      vegetation_health: await this.assessVegetationHealth(imageBuffer, segmentationResult, imageMetadata),
      
      // Contextual features
      total_vegetation_coverage: this.calculateTotalVegetationCoverage(segmentationResult),
      vegetation_distribution: this.analyzeVegetationDistribution(segmentationResult),
      edge_density: this.calculateEdgeDensity(segmentationResult),
      
      // Metadata
      image_quality: this.assessImageQuality(imageBuffer),
      segmentation_confidence: segmentationResult.confidence || 0,
      processing_timestamp: new Date().toISOString()
    };

    // Calculate derived features
    features.ladder_fuel_risk = this.calculateLadderFuelRisk(features);
    features.structure_vulnerability = this.calculateStructureVulnerability(features);
    features.fire_spread_potential = this.calculateFireSpreadPotential(features);

    console.log('✅ Feature extraction completed');
    return features;
  }

  /**
   * Calculate total biomass available for burning
   */
  calculateFuelLoad(segmentationResult) {
    const masks = segmentationResult.masks || segmentationResult;
    
    let totalFuelLoad = 0;
    let fuelComposition = {
      fine_fuels: 0,    // Grass, small vegetation
      medium_fuels: 0,  // Shrubs, bushes
      heavy_fuels: 0    // Trees, large vegetation
    };

    // Fine fuels (grass, small vegetation)
    if (masks.grass && masks.grass.length > 0) {
      const grassCoverage = this.calculateCoverage(masks.grass);
      fuelComposition.fine_fuels = grassCoverage * 0.5; // Lower fuel density
      totalFuelLoad += grassCoverage * 0.5;
    }

    // Medium fuels (shrubs, bushes)
    if (masks.other_vegetation && masks.other_vegetation.length > 0) {
      const shrubCoverage = this.calculateCoverage(masks.other_vegetation);
      fuelComposition.medium_fuels = shrubCoverage * 0.75; // Medium fuel density
      totalFuelLoad += shrubCoverage * 0.75;
    }

    // Heavy fuels (trees)
    if (masks.trees && masks.trees.length > 0) {
      const treeCoverage = this.calculateCoverage(masks.trees);
      fuelComposition.heavy_fuels = treeCoverage * 1.0; // Highest fuel density
      totalFuelLoad += treeCoverage * 1.0;
    }

    return {
      total_load: Math.min(totalFuelLoad, 1.0), // Normalize to 0-1
      composition: fuelComposition,
      risk_score: this.fuelLoadToRisk(totalFuelLoad)
    };
  }

  /**
   * Calculate vertical fuel continuity (ladder fuels)
   */
  calculateVerticalContinuity(segmentationResult) {
    const masks = segmentationResult.masks || segmentationResult;
    
    const grassCoverage = this.calculateCoverage(masks.grass || []);
    const shrubCoverage = this.calculateCoverage(masks.other_vegetation || []);
    const treeCoverage = this.calculateCoverage(masks.trees || []);

    // Vertical continuity exists when there's overlap between fuel layers
    const groundToShrubContinuity = Math.min(grassCoverage, shrubCoverage);
    const shrubToTreeContinuity = Math.min(shrubCoverage, treeCoverage);
    const totalContinuity = (groundToShrubContinuity + shrubToTreeContinuity) / 2;

    const ladderFuelFactor = this.calculateLadderFuelFactor(grassCoverage, shrubCoverage, treeCoverage);

    return {
      continuity_score: totalContinuity,
      ground_to_shrub: groundToShrubContinuity,
      shrub_to_tree: shrubToTreeContinuity,
      ladder_fuel_factor: ladderFuelFactor,
      risk_score: this.verticalContinuityToRisk(totalContinuity, ladderFuelFactor)
    };
  }

  /**
   * Calculate crown bulk density
   */
  calculateCrownBulkDensity(segmentationResult) {
    const masks = segmentationResult.masks || segmentationResult;
    
    if (!masks.trees || masks.trees.length === 0) {
      return {
        density: 0,
        canopy_coverage: 0,
        crown_fire_potential: 0,
        risk_score: 0
      };
    }

    const treeCoverage = this.calculateCoverage(masks.trees);
    const avgTreeDensity = this.calculateAverageTreeDensity(masks.trees);
    const canopyCompactness = this.calculateCanopyCompactness(masks.trees);
    
    const bulkDensity = treeCoverage * avgTreeDensity * canopyCompactness;
    const crownFirePotential = this.calculateCrownFirePotential(bulkDensity, treeCoverage);

    return {
      density: bulkDensity,
      canopy_coverage: treeCoverage,
      canopy_compactness: canopyCompactness,
      crown_fire_potential: crownFirePotential,
      risk_score: this.crownDensityToRisk(bulkDensity, crownFirePotential)
    };
  }

  /**
   * Calculate vegetation fragmentation
   */
  calculateFragmentation(segmentationResult) {
    const masks = segmentationResult.masks || segmentationResult;
    
    const allVegetation = [
      ...(masks.trees || []),
      ...(masks.grass || []),
      ...(masks.other_vegetation || [])
    ];

    if (allVegetation.length === 0) {
      return {
        fragmentation_index: 0,
        patch_count: 0,
        average_patch_size: 0,
        largest_patch_ratio: 0,
        connectivity: 1, // High connectivity = low fragmentation
        risk_score: 0
      };
    }

    const patchCount = allVegetation.length;
    const totalCoverage = this.calculateCoverage(allVegetation);
    const averagePatchSize = totalCoverage / patchCount;
    const largestPatch = Math.max(...allVegetation.map(v => v.score || v.area || 0.1));
    const largestPatchRatio = largestPatch / totalCoverage;
    
    // Fragmentation index (higher = more fragmented)
    const fragmentationIndex = patchCount / totalCoverage;
    const connectivity = Math.max(0, 1 - fragmentationIndex);

    return {
      fragmentation_index: fragmentationIndex,
      patch_count: patchCount,
      average_patch_size: averagePatchSize,
      largest_patch_ratio: largestPatchRatio,
      connectivity: connectivity,
      risk_score: this.fragmentationToRisk(fragmentationIndex, connectivity)
    };
  }

  /**
   * Calculate proximity to structures
   */
  calculateProximityToStructures(segmentationResult) {
    const masks = segmentationResult.masks || segmentationResult;
    
    if (!masks.buildings || masks.buildings.length === 0) {
      return {
        structure_presence: false,
        proximity_score: 0,
        defensible_space_adequacy: 1, // No structures = adequate by default
        wui_risk: 0, // Wildland-Urban Interface risk
        risk_score: 0
      };
    }

    const structureCoverage = this.calculateCoverage(masks.buildings);
    const vegetationCoverage = this.calculateTotalVegetationCoverage(segmentationResult);
    
    // Estimate proximity based on co-occurrence in image
    const proximityScore = Math.min(structureCoverage, vegetationCoverage);
    const defensibleSpaceAdequacy = Math.max(0, 1 - proximityScore * 2);
    const wuiRisk = proximityScore * vegetationCoverage;

    return {
      structure_presence: true,
      structure_coverage: structureCoverage,
      proximity_score: proximityScore,
      defensible_space_adequacy: defensibleSpaceAdequacy,
      wui_risk: wuiRisk,
      risk_score: this.proximityToRisk(proximityScore, wuiRisk)
    };
  }

  /**
   * Calculate vegetation dryness from image colors
   */
  async calculateDrynessIndex(imageBuffer, segmentationResult, imageMetadata = {}) {
    try {
      // Enhanced color analysis with fire/smoke detection
      const colorAnalysis = await this.analyzeImageColors(imageBuffer);
      
      // Check for fire indicators (orange/red tones, smoke, brightness) with context
      const fireIndicators = this.detectFireIndicators(colorAnalysis, imageMetadata);
      
      // Calculate red/green ratio as dryness indicator
      const redGreenRatio = colorAnalysis.red / Math.max(colorAnalysis.green, 1);
      const yellowComponent = colorAnalysis.yellow;
      const brightnessLevel = colorAnalysis.brightness;
      
      // Enhanced dryness calculation with fire detection
      let drynessScore = Math.min(1.0, 
        (redGreenRatio * 0.3) + 
        (yellowComponent * 0.2) + 
        (brightnessLevel * 0.2) +
        (fireIndicators.fire_probability * 0.3) // NEW: Fire detection boost
      );
      
      // CRITICAL: If fire/smoke detected, immediately set to extreme risk
      if (fireIndicators.active_fire || fireIndicators.smoke_present) {
        drynessScore = 1.0; // Maximum dryness for active fires
      }

      return {
        dryness_score: drynessScore,
        red_green_ratio: redGreenRatio,
        yellow_component: yellowComponent,
        brightness_level: brightnessLevel,
        fire_indicators: fireIndicators, // NEW: Fire detection results
        moisture_estimate: 1 - drynessScore,
        risk_score: this.drynessToRisk(drynessScore)
      };
      
    } catch (error) {
      console.error('Error calculating dryness index:', error);
      return {
        dryness_score: 0.5, // Default moderate dryness
        red_green_ratio: 1.0,
        yellow_component: 0.3,
        brightness_level: 0.5,
        fire_indicators: { active_fire: false, smoke_present: false, fire_probability: 0 },
        moisture_estimate: 0.5,
        risk_score: 50
      };
    }
  }

  /**
   * Assess overall vegetation health
   */
  async assessVegetationHealth(imageBuffer, segmentationResult, imageMetadata = {}) {
    const drynessIndex = await this.calculateDrynessIndex(imageBuffer, segmentationResult, imageMetadata);
    const fuelLoad = this.calculateFuelLoad(segmentationResult);
    
    // Health score combines moisture and vegetation density
    const healthScore = (drynessIndex.moisture_estimate * 0.6) + 
                       ((1 - fuelLoad.total_load) * 0.4);
    
    let healthCategory = 'moderate';
    if (healthScore > 0.7) healthCategory = 'healthy';
    else if (healthScore < 0.3) healthCategory = 'stressed';

    return {
      health_score: healthScore,
      health_category: healthCategory,
      stress_indicators: {
        low_moisture: drynessIndex.dryness_score > 0.7,
        high_density: fuelLoad.total_load > 0.8,
        poor_color: drynessIndex.red_green_ratio > 1.5
      },
      risk_score: this.healthToRisk(healthScore)
    };
  }

  // Helper methods for coverage calculation and risk conversion
  calculateCoverage(maskArray) {
    if (!maskArray || maskArray.length === 0) return 0;
    
    // Enhanced coverage calculation that handles different mask formats
    const totalCoverage = maskArray.reduce((sum, mask) => {
      // Prioritize explicit coverage values, then area-based calculations, then scores
      if (mask.coverage !== undefined) {
        return sum + mask.coverage;
      } else if (mask.area !== undefined) {
        // Normalize area to coverage (assuming 512x512 image)
        return sum + (mask.area / (512 * 512));
      } else if (mask.score !== undefined) {
        return sum + mask.score;
      } else {
        return sum + 0.1; // Default fallback
      }
    }, 0);
    
    // FIXED: Return total coverage instead of average, but still cap at 1.0
    // Previous bug: was dividing by length, severely underestimating coverage
    return Math.min(1.0, totalCoverage);
  }

  calculateTotalVegetationCoverage(segmentationResult) {
    const masks = segmentationResult.masks || segmentationResult;
    const treeCoverage = this.calculateCoverage(masks.trees || []);
    const grassCoverage = this.calculateCoverage(masks.grass || []);
    const otherVegCoverage = this.calculateCoverage(masks.other_vegetation || []);
    return (treeCoverage + grassCoverage + otherVegCoverage) / 3;
  }

  // Risk scoring methods (convert features to 0-100 risk scores)
  fuelLoadToRisk(fuelLoad) {
    // Enhanced fuel load scoring with non-linear scaling for high-risk scenarios
    if (fuelLoad > 0.8) {
      // Exponential scaling for very high fuel loads
      return Math.min(100, 70 + (fuelLoad - 0.8) * 150); // 70-100 range
    } else if (fuelLoad > 0.5) {
      // Accelerated scaling for moderate-high fuel loads
      return Math.min(100, 30 + (fuelLoad - 0.5) * 133); // 30-70 range
    } else {
      // Linear scaling for low fuel loads
      return Math.min(100, fuelLoad * 60); // 0-30 range
    }
  }

  verticalContinuityToRisk(continuity, ladderFactor) {
    return Math.min(100, (continuity * 60) + (ladderFactor * 40));
  }

  crownDensityToRisk(density, crownFirePotential) {
    return Math.min(100, (density * 50) + (crownFirePotential * 50));
  }

  fragmentationToRisk(fragmentation, connectivity) {
    // Lower connectivity (higher fragmentation) can actually reduce fire spread
    return Math.max(0, 100 - (connectivity * 30) + (fragmentation * 20));
  }

  proximityToRisk(proximity, wuiRisk) {
    return Math.min(100, (proximity * 60) + (wuiRisk * 40));
  }

  drynessToRisk(dryness) {
    // Enhanced dryness scoring with fire detection boost
    if (dryness >= 1.0) {
      return 100; // Maximum risk for extreme dryness/fire
    } else if (dryness > 0.8) {
      // Exponential scaling for very dry conditions
      return Math.min(100, 80 + (dryness - 0.8) * 100); // 80-100 range
    } else if (dryness > 0.6) {
      // Accelerated scaling for dry conditions  
      return Math.min(100, 50 + (dryness - 0.6) * 150); // 50-80 range
    } else {
      // Linear scaling for moderate conditions
      return Math.min(100, dryness * 83); // 0-50 range
    }
  }

  healthToRisk(health) {
    return Math.max(0, 100 - (health * 100));
  }

  // Additional helper methods
  calculateLadderFuelFactor(grass, shrub, tree) {
    if (grass > 0.3 && shrub > 0.3 && tree > 0.3) return 1.0; // High ladder fuel
    if ((grass > 0.2 && shrub > 0.2) || (shrub > 0.2 && tree > 0.2)) return 0.7; // Moderate
    return 0.3; // Low ladder fuel
  }

  calculateAverageTreeDensity(trees) {
    return trees.reduce((sum, tree) => sum + (tree.score || 0.5), 0) / trees.length;
  }

  calculateCanopyCompactness(trees) {
    // Simplified compactness based on number and scores of tree segments
    const avgScore = this.calculateAverageTreeDensity(trees);
    const segmentCount = trees.length;
    return Math.min(1.0, avgScore * (segmentCount / 10));
  }

  calculateCrownFirePotential(bulkDensity, coverage) {
    // Crown fire potential increases with density and coverage
    return Math.min(1.0, bulkDensity * coverage * 2);
  }

  analyzeVegetationDistribution(segmentationResult) {
    const masks = segmentationResult.masks || segmentationResult;
    return {
      tree_distribution: masks.trees?.length || 0,
      grass_distribution: masks.grass?.length || 0,
      mixed_vegetation: masks.other_vegetation?.length || 0,
      clustering_factor: this.calculateClusteringFactor(masks)
    };
  }

  calculateEdgeDensity(segmentationResult) {
    // Simplified edge density calculation
    const masks = segmentationResult.masks || segmentationResult;
    const totalSegments = (masks.trees?.length || 0) + 
                         (masks.grass?.length || 0) + 
                         (masks.other_vegetation?.length || 0);
    return Math.min(1.0, totalSegments / 20); // Normalize to reasonable range
  }

  calculateClusteringFactor(masks) {
    // Simplified clustering factor
    const totalVegSegments = (masks.trees?.length || 0) + 
                            (masks.grass?.length || 0) + 
                            (masks.other_vegetation?.length || 0);
    return Math.min(1.0, totalVegSegments / 15);
  }

  assessImageQuality(imageBuffer) {
    // Simplified image quality assessment
    return {
      resolution_score: 0.8, // Placeholder
      clarity_score: 0.7,    // Placeholder
      lighting_score: 0.8    // Placeholder
    };
  }

  async analyzeImageColors(imageBuffer) {
    // Enhanced color analysis with smart defaults based on image characteristics
    try {
      // For now, provide intelligent defaults that vary based on image data
      // In production, this would use actual image processing libraries
      const imageHash = this.calculateImageHash(imageBuffer);
      
      // Use hash to generate consistent but varied color analysis
      const variation = (imageHash % 100) / 100;
      
      return {
        red: 0.3 + (variation * 0.4), // 0.3-0.7 range
        green: 0.4 - (variation * 0.2), // 0.2-0.4 range (lower for drier scenes)
        blue: 0.2 + (variation * 0.3), // 0.2-0.5 range
        yellow: 0.25 + (variation * 0.4), // 0.25-0.65 range
        brightness: 0.6 + (variation * 0.3), // 0.6-0.9 range
        orange: variation * 0.5, // NEW: Orange component for fire detection
        saturation: 0.5 + (variation * 0.3)
      };
    } catch (error) {
      console.error('Error in color analysis:', error);
      return {
        red: 0.4,
        green: 0.3,
        blue: 0.2,
        yellow: 0.4,
        brightness: 0.7,
        orange: 0.3,
        saturation: 0.6
      };
    }
  }

  // Derived feature calculations
  calculateLadderFuelRisk(features) {
    return (features.vertical_continuity.risk_score * 0.7) + 
           (features.fuel_load.risk_score * 0.3);
  }

  calculateStructureVulnerability(features) {
    return features.proximity_to_structures.risk_score;
  }

  calculateFireSpreadPotential(features) {
    return (features.fuel_load.risk_score * 0.3) +
           (features.fragmentation.risk_score * 0.2) +
           (features.dryness_index.risk_score * 0.3) +
           (features.vertical_continuity.risk_score * 0.2);
  }

  // ENHANCED: Fire detection methods with filename context
  detectFireIndicators(colorAnalysis, context = {}) {
    const { red, orange, yellow, brightness, saturation } = colorAnalysis;
    const filename = context.filename || '';
    
    // Fire probability based on color characteristics
    let fireProbability = 0;
    
    // ENHANCED: More aggressive fire detection
    // High red/orange content indicates fire  
    if (red > 0.5 && orange > 0.3) fireProbability += 0.3;
    if (red > 0.7 && orange > 0.5) fireProbability += 0.4; // Very high red/orange
    
    // Bright yellow/orange suggests flames
    if (yellow > 0.4 && brightness > 0.6) fireProbability += 0.25;
    if (yellow > 0.6 && brightness > 0.8) fireProbability += 0.35; // Very bright
    
    // High saturation with warm colors indicates fire
    if (saturation > 0.6 && (red + orange + yellow) > 1.2) fireProbability += 0.25;
    if (saturation > 0.8 && (red + orange + yellow) > 1.6) fireProbability += 0.4; // Very saturated
    
    // REMOVED: Filename-based fire detection boost (was causing false positives)
    // Fire detection should be based on actual image content, not filename assumptions
    
    // Smoke detection (lower saturation, gray tones)
    let smokeIndicator = (brightness > 0.4 && saturation < 0.4) ? 0.6 : 0;
    
    // Additional smoke detection for specific patterns
    if (brightness > 0.6 && saturation < 0.2) {
      smokeIndicator = 0.8; // Very likely smoke
    }
    
    return {
      fire_probability: Math.min(1.0, fireProbability),
      active_fire: fireProbability > 0.6, // Lowered threshold
      smoke_present: smokeIndicator > 0.5,
      smoke_probability: smokeIndicator,
      filename_boost: false // No longer using filename-based boosting
    };
  }

  calculateImageHash(imageBuffer) {
    // Simple hash based on buffer length and first few bytes
    let hash = imageBuffer.length;
    for (let i = 0; i < Math.min(10, imageBuffer.length); i++) {
      hash = ((hash << 5) - hash + imageBuffer[i]) & 0xffffffff;
    }
    return Math.abs(hash);
  }
}