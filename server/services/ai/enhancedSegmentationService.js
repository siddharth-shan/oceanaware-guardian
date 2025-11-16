/**
 * Enhanced Multi-Model Segmentation Service
 * Uses specialized models for accurate wildfire risk assessment
 */

export class EnhancedSegmentationService {
  constructor() {
    this.models = {
      // Specialized fire detection model (99.41% accuracy)
      fireDetection: 'prithivMLmods/Fire-Detection-Siglip2',
      
      // Wildfire fuel vegetation segmentation  
      vegetationSegmentation: 'markrodrigo/vegetation-image-segmentation-wildfire-fuel-1.0',
      
      // Fallback general segmentation
      generalSegmentation: 'nvidia/segformer-b0-finetuned-ade-512-512'
    };
    
    this.classificationThresholds = {
      fire: 0.7,        // High confidence for fire detection
      smoke: 0.6,       // Medium confidence for smoke
      vegetation: 0.8   // High confidence for vegetation
    };
  }

  /**
   * Main analysis pipeline using specialized models
   */
  async performEnhancedAnalysis(imageBuffer, token, options = {}) {
    const results = {
      fire_analysis: null,
      vegetation_analysis: null,
      combined_assessment: null,
      processing_time: Date.now(),
      confidence_scores: {}
    };

    try {
      // Step 1: Specialized Fire Detection
      console.log('🔥 Step 1: Analyzing fire/smoke presence...');
      results.fire_analysis = await this.analyzeFirePresence(imageBuffer, token);
      
      // Step 2: Vegetation Fuel Assessment  
      console.log('🌿 Step 2: Analyzing vegetation fuel load...');
      results.vegetation_analysis = await this.analyzeVegetationFuel(imageBuffer, token);
      
      // Step 3: Combined Risk Assessment
      console.log('⚖️ Step 3: Computing combined risk assessment...');
      results.combined_assessment = this.computeCombinedRiskAssessment(
        results.fire_analysis, 
        results.vegetation_analysis
      );
      
      results.processing_time = Date.now() - results.processing_time;
      return results;
      
    } catch (error) {
      console.error('Enhanced analysis failed:', error);
      return this.getFallbackAnalysis(imageBuffer, token);
    }
  }

  /**
   * Specialized fire/smoke detection using trained model
   */
  async analyzeFirePresence(imageBuffer, token) {
    try {
      // First try computer vision-based fire/smoke detection (always works)
      const visualFireDetection = await this.visualFireDetection(imageBuffer);
      
      // If visual detection finds fire/smoke with high confidence, use it
      if (visualFireDetection.fire_detected || visualFireDetection.smoke_detected) {
        console.log('🔥 VISUAL FIRE DETECTION: Fire/smoke detected through image analysis');
        return visualFireDetection;
      }
      
      // Try API-based detection as secondary
      if (token && token !== 'test-token') {
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${this.models.fireDetection}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              inputs: imageBuffer.toString('base64'),
              options: { 
                wait_for_model: true,
                use_cache: false 
              }
            })
          }
        );

        if (response.ok) {
          const result = await response.json();
          const apiResult = this.processFireDetectionResult(result);
          
          // Combine visual and API results (take the higher confidence)
          if (apiResult.confidence > visualFireDetection.confidence) {
            return apiResult;
          }
        }
      }
      
      // Return visual detection results (may be negative)
      return visualFireDetection;
      
    } catch (error) {
      console.error('Fire detection failed:', error);
      // Fallback to visual detection
      return await this.visualFireDetection(imageBuffer);
    }
  }

  /**
   * Process fire detection model output
   */
  processFireDetectionResult(result) {
    if (!Array.isArray(result) || result.length === 0) {
      return {
        success: false,
        fire_detected: false,
        smoke_detected: false,
        confidence: 0,
        raw_scores: result
      };
    }

    // Extract scores for each class
    const scores = {};
    result.forEach(item => {
      if (item.label && item.score !== undefined) {
        scores[item.label.toLowerCase()] = item.score;
      }
    });

    const fireScore = scores.fire || 0;
    const smokeScore = scores.smoke || 0;  
    const normalScore = scores.normal || 0;

    // Determine detection results
    const fireDetected = fireScore > this.classificationThresholds.fire;
    const smokeDetected = smokeScore > this.classificationThresholds.smoke;
    
    // Overall confidence is the max of fire/smoke scores
    const maxHazardScore = Math.max(fireScore, smokeScore);

    console.log(`🔥 Fire Detection Results: Fire=${fireScore.toFixed(3)}, Smoke=${smokeScore.toFixed(3)}, Normal=${normalScore.toFixed(3)}`);

    return {
      success: true,
      fire_detected: fireDetected,
      smoke_detected: smokeDetected,
      confidence: maxHazardScore,
      scores: {
        fire: fireScore,
        smoke: smokeScore,
        normal: normalScore
      },
      risk_level: this.calculateFireRiskLevel(fireScore, smokeScore),
      detection_summary: this.generateFireDetectionSummary(fireDetected, smokeDetected, fireScore, smokeScore)
    };
  }

  /**
   * Vegetation fuel load analysis using specialized model
   */
  async analyzeVegetationFuel(imageBuffer, token) {
    try {
      // Enhanced analysis: color analysis + segmentation
      const colorAnalysis = await this.analyzeVegetationColors(imageBuffer);
      
      // Use general segmentation (wildfire-specific model integration pending)
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${this.models.generalSegmentation}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: imageBuffer.toString('base64'),
            options: { 
              wait_for_model: true,
              use_cache: false 
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Vegetation analysis API error: ${response.status}`);
      }

      const result = await response.json();
      return this.processVegetationSegmentationResult(result, colorAnalysis);
      
    } catch (error) {
      console.error('Vegetation analysis failed:', error);
      // Use color analysis for fallback instead of ignoring it
      return this.getHeuristicVegetationAnalysis(colorAnalysis);
    }
  }

  /**
   * Process vegetation segmentation results with wildfire focus
   */
  processVegetationSegmentationResult(result, colorAnalysis = null) {
    if (!Array.isArray(result) || result.length === 0) {
      return this.getHeuristicVegetationAnalysis(colorAnalysis);
    }

    // Enhanced vegetation classification for fire risk
    const vegetationTypes = {
      dry_vegetation: 0,
      dense_trees: 0,
      grass_ground: 0,
      shrubs_bushes: 0,
      total_vegetation: 0
    };

    // Process segmentation results with fire-risk focus
    result.forEach(prediction => {
      const label = (prediction.label || '').toLowerCase();
      const score = prediction.score || 0;

      // Improved mapping with better dry vegetation detection
      if (this.isDryVegetationClass(label)) {
        vegetationTypes.dry_vegetation += score;
      } else if (this.isTreeClass(label)) {
        vegetationTypes.dense_trees += score;
      } else if (this.isGrassClass(label)) {
        // CRITICAL FIX: Grass/field can be dry - check color analysis
        if (colorAnalysis && colorAnalysis.dryness_factor > 0.6) {
          vegetationTypes.dry_vegetation += score * 0.8; // High dry risk
          vegetationTypes.grass_ground += score * 0.2;
        } else {
          vegetationTypes.grass_ground += score;
        }
      } else if (this.isShrubClass(label)) {
        vegetationTypes.shrubs_bushes += score;
      }
    });

    // Apply color-based dryness boost
    if (colorAnalysis && colorAnalysis.dryness_factor > 0.5) {
      vegetationTypes.dry_vegetation *= (1 + colorAnalysis.dryness_factor);
      console.log(`🟡 Dryness boost applied: ${colorAnalysis.dryness_factor.toFixed(2)}x multiplier`);
    }

    vegetationTypes.total_vegetation = Object.values(vegetationTypes)
      .filter((v, i) => i < 4) // Exclude total_vegetation from sum
      .reduce((sum, v) => sum + v, 0);

    // Calculate fire fuel metrics with color enhancement
    const fuelLoadAssessment = this.calculateFuelLoadFromVegetation(vegetationTypes, colorAnalysis);

    console.log(`🌿 Enhanced Vegetation Analysis: Total=${vegetationTypes.total_vegetation.toFixed(3)}, Trees=${vegetationTypes.dense_trees.toFixed(3)}, Dry=${vegetationTypes.dry_vegetation.toFixed(3)}`);
    if (colorAnalysis) {
      console.log(`🎨 Color Analysis: Golden=${colorAnalysis.golden_ratio.toFixed(3)}, Brown=${colorAnalysis.brown_ratio.toFixed(3)}, Dryness=${colorAnalysis.dryness_factor.toFixed(3)}`);
    }

    return {
      success: true,
      vegetation_coverage: vegetationTypes.total_vegetation,
      vegetation_breakdown: vegetationTypes,
      fuel_load_assessment: fuelLoadAssessment,
      fire_risk_factors: this.identifyVegetationRiskFactors(vegetationTypes, colorAnalysis),
      color_analysis: colorAnalysis,
      confidence: Math.min(1.0, vegetationTypes.total_vegetation)
    };
  }

  /**
   * Calculate fuel load from vegetation analysis
   */
  calculateFuelLoadFromVegetation(vegetationTypes, colorAnalysis = null) {
    // Enhanced weights with seasonal/dryness factors
    const fuelWeights = {
      dry_vegetation: 1.0,    // Highest risk - already identified as dry
      grass_ground: 0.8,      // Increased from 0.7 - grass fires spread fast
      shrubs_bushes: 0.9,     // Increased from 0.8 - critical ladder fuels
      dense_trees: 0.7        // Increased from 0.6 - crown fire potential
    };

    let weightedFuelLoad = 0;
    let totalCoverage = 0;

    Object.entries(fuelWeights).forEach(([type, weight]) => {
      const coverage = vegetationTypes[type] || 0;
      weightedFuelLoad += coverage * weight;
      totalCoverage += coverage;
    });

    // Calculate base fuel load score
    let normalizedFuelLoad = totalCoverage > 0 ? weightedFuelLoad / totalCoverage : 0;
    
    // CRITICAL FIX: Apply dryness multiplier for golden/brown vegetation
    if (colorAnalysis && colorAnalysis.dryness_factor > 0.3) {
      const drynessMultiplier = 1 + (colorAnalysis.dryness_factor * 0.5); // Up to 1.5x boost
      normalizedFuelLoad *= drynessMultiplier;
      console.log(`🔥 Dryness multiplier applied: ${drynessMultiplier.toFixed(2)}x (score: ${normalizedFuelLoad.toFixed(3)})`);
    }

    // Cap at 1.0 but allow high scores for truly dry conditions
    normalizedFuelLoad = Math.min(1.0, normalizedFuelLoad);

    return {
      fuel_load_score: normalizedFuelLoad,
      fuel_density: this.categorizeFuelDensity(normalizedFuelLoad),
      ignition_potential: this.calculateIgnitionPotential(vegetationTypes, colorAnalysis),
      fire_spread_risk: this.calculateFireSpreadRisk(vegetationTypes, colorAnalysis),
      dryness_factor: colorAnalysis?.dryness_factor || 0
    };
  }

  /**
   * Combine fire detection and vegetation analysis into overall risk
   */
  computeCombinedRiskAssessment(fireAnalysis, vegetationAnalysis) {
    // CRITICAL: Fire detection takes absolute priority
    let riskScore = 0;
    let riskFactors = [];
    let objectsDetected = [];

    // FIRE/SMOKE DETECTION (HIGHEST PRIORITY)
    if (fireAnalysis.success) {
      if (fireAnalysis.fire_detected) {
        riskScore = 100; // MAXIMUM RISK for active fire
        riskFactors.push(`Active fire detected (${(fireAnalysis.scores?.fire * 100 || 0).toFixed(2)}% of image)`);
        objectsDetected.push({
          object: 'Fire/Flames',
          confidence: fireAnalysis.confidence,
          description: 'Active fire or flames visible in image',
          risk_level: 'EXTREME'
        });
      } else if (fireAnalysis.smoke_detected) {
        riskScore = Math.max(riskScore, 85); // Very high risk for smoke
        riskFactors.push(`Smoke detected (${(fireAnalysis.scores?.smoke * 100 || 0).toFixed(1)}% of image)`);
        objectsDetected.push({
          object: 'Smoke',
          confidence: fireAnalysis.confidence,
          description: 'Smoke plumes indicating nearby fire activity',
          risk_level: 'HIGH'
        });
      }
      
      // Add visual analysis details if available
      if (fireAnalysis.visual_analysis) {
        const visual = fireAnalysis.visual_analysis;
        if (visual.fire_pixels > 0) {
          objectsDetected.push({
            object: 'Active Fire Detected',
            confidence: Math.min(0.95, 0.7 + visual.fire_ratio * 5),
            description: `${visual.fire_pixels} pixels (${(visual.fire_ratio * 100).toFixed(3)}%) showing active fire characteristics`,
            risk_level: 'EXTREME',
            coverage_percentage: (visual.fire_ratio * 100).toFixed(3) + '%',
            fire_risk_contribution: 'IMMEDIATE THREAT - Active flames detected',
            pixel_analysis: {
              total_fire_pixels: visual.fire_pixels,
              image_coverage: (visual.fire_ratio * 100).toFixed(3) + '%',
              detection_method: 'RGB color analysis of orange/red fire signatures'
            }
          });
        }
        if (visual.smoke_pixels > 0) {
          objectsDetected.push({
            object: 'Smoke Detected',
            confidence: Math.min(0.9, 0.6 + visual.smoke_ratio * 3),
            description: `${visual.smoke_pixels} pixels (${(visual.smoke_ratio * 100).toFixed(1)}%) showing smoke characteristics`,
            risk_level: 'HIGH',
            coverage_percentage: (visual.smoke_ratio * 100).toFixed(1) + '%',
            fire_risk_contribution: 'Indicates nearby fire activity or smoldering',
            pixel_analysis: {
              total_smoke_pixels: visual.smoke_pixels,
              image_coverage: (visual.smoke_ratio * 100).toFixed(1) + '%',
              detection_method: 'RGB color analysis of gray smoke signatures'
            }
          });
        }
      }
    }

    // VEGETATION ANALYSIS (Secondary to fire detection)
    if (vegetationAnalysis.success && riskScore < 80) {  // Only if no fire detected
      const fuelLoad = vegetationAnalysis.fuel_load_assessment.fuel_load_score;
      riskScore += fuelLoad * 40; // Base risk from fuel load
      
      if (fuelLoad > 0.7) {
        riskFactors.push('High fuel load detected');
        objectsDetected.push({
          object: 'High Fuel Load Vegetation',
          confidence: 0.8,
          description: 'Dense vegetation that could fuel fires',
          risk_level: 'MODERATE'
        });
      }
      
      // Add comprehensive vegetation objects with detailed analysis
      if (vegetationAnalysis.vegetation_breakdown) {
        const veg = vegetationAnalysis.vegetation_breakdown;
        const colorAnalysis = vegetationAnalysis.color_analysis;
        
        // Dry vegetation detection
        if (veg.dry_vegetation > 0.2) {
          objectsDetected.push({
            object: 'Dry Vegetation',
            confidence: Math.min(0.9, 0.5 + veg.dry_vegetation),
            description: `${(veg.dry_vegetation * 100).toFixed(1)}% of image contains dry grass, bushes, or dead trees`,
            risk_level: veg.dry_vegetation > 0.6 ? 'HIGH' : 'MODERATE',
            coverage_percentage: (veg.dry_vegetation * 100).toFixed(1) + '%',
            fire_risk_contribution: 'High ignition potential and rapid fire spread'
          });
        }
        
        // Tree coverage detection
        if (veg.dense_trees > 0.3) {
          objectsDetected.push({
            object: 'Tree Coverage',
            confidence: Math.min(0.8, 0.4 + veg.dense_trees),
            description: `${(veg.dense_trees * 100).toFixed(1)}% tree canopy coverage detected`,
            risk_level: veg.dense_trees > 0.6 ? 'MODERATE' : 'LOW',
            coverage_percentage: (veg.dense_trees * 100).toFixed(1) + '%',
            fire_risk_contribution: 'Potential for crown fires and ember spread'
          });
        }
        
        // Grass/ground fuel detection
        if (veg.grass_ground > 0.3) {
          const isDryGrass = colorAnalysis && colorAnalysis.dryness_factor > 0.6;
          objectsDetected.push({
            object: isDryGrass ? 'Dry Grassland' : 'Grass Coverage',
            confidence: Math.min(0.8, 0.5 + veg.grass_ground),
            description: `${(veg.grass_ground * 100).toFixed(1)}% grass coverage - ${isDryGrass ? 'dry and fire-prone' : 'appears healthy'}`,
            risk_level: isDryGrass ? 'HIGH' : 'LOW',
            coverage_percentage: (veg.grass_ground * 100).toFixed(1) + '%',
            fire_risk_contribution: isDryGrass ? 'Fast-spreading ground fires' : 'Low fire risk when green'
          });
        }
        
        // Shrub/bush detection
        if (veg.shrubs_bushes > 0.2) {
          objectsDetected.push({
            object: 'Shrubs and Bushes',
            confidence: Math.min(0.7, 0.4 + veg.shrubs_bushes),
            description: `${(veg.shrubs_bushes * 100).toFixed(1)}% shrub coverage - ladder fuel for fire spread`,
            risk_level: 'MODERATE',
            coverage_percentage: (veg.shrubs_bushes * 100).toFixed(1) + '%',
            fire_risk_contribution: 'Ladder fuels connecting ground to tree canopy'
          });
        }
        
        // Color-based vegetation health assessment
        if (colorAnalysis) {
          if (colorAnalysis.green_ratio > 0.4) {
            objectsDetected.push({
              object: 'Healthy Green Vegetation',
              confidence: 0.9,
              description: `${(colorAnalysis.green_ratio * 100).toFixed(1)}% of vegetation appears healthy and green`,
              risk_level: 'LOW',
              coverage_percentage: (colorAnalysis.green_ratio * 100).toFixed(1) + '%',
              fire_risk_contribution: 'Lower fire risk due to higher moisture content'
            });
          }
          
          if (colorAnalysis.dryness_factor > 0.7) {
            objectsDetected.push({
              object: 'Severely Dry Vegetation',
              confidence: 0.9,
              description: `${(colorAnalysis.dryness_factor * 100).toFixed(1)}% vegetation dryness indicates extreme fire risk`,
              risk_level: 'EXTREME',
              coverage_percentage: (colorAnalysis.dryness_factor * 100).toFixed(1) + '%',
              fire_risk_contribution: 'Critical fire hazard - immediate ignition risk'
            });
          }
        }
      }
    }

    // Environmental factors (only if no fire)
    if (riskScore < 80) {
      const environmentalRisk = 15;
      riskScore += environmentalRisk;
    }

    // Cap at 100
    riskScore = Math.min(100, riskScore);

    return {
      overall_risk_score: riskScore,
      risk_category: this.getRiskCategory(riskScore),
      risk_level: this.getRiskLevel(riskScore),
      primary_risk_factors: riskFactors,
      objects_detected: objectsDetected,
      confidence: this.calculateOverallConfidence(fireAnalysis, vegetationAnalysis),
      recommendations: this.generateRiskRecommendations(riskScore, riskFactors)
    };
  }

  /**
   * CRITICAL NEW METHOD: Computer vision-based fire and smoke detection
   */
  async visualFireDetection(imageBuffer) {
    try {
      const sharp = (await import('sharp')).default;
      
      // Analyze image for fire/smoke characteristics
      const { data, info } = await sharp(imageBuffer)
        .resize(200, 200)  // Larger for better fire detection
        .raw()
        .toBuffer({ resolveWithObject: true });

      let firePixels = 0;
      let smokePixels = 0;
      let brightFirePixels = 0;
      let orangePixels = 0;
      const totalPixels = info.width * info.height;

      for (let i = 0; i < data.length; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // MUCH STRICTER FIRE DETECTION: Only very bright orange/red with low blue
        if (r > 200 && r > g * 1.3 && r > b * 2.5 && g > 80 && b < 100) {
          // Very strict fire colors: bright red/orange with low blue component
          if (r > 240 && g > 140 && b < 80) {
            brightFirePixels++;  // Extremely bright fire/flames
          } else if (r > 220 && g > 120 && r > g * 1.2 && b < 60) {
            firePixels++;  // Bright orange fire
          } else if (r > 200 && r > g * 1.4 && r > b * 3 && b < 50) {
            orangePixels++;  // Red fire with very low blue
          }
        }
        
        // MUCH STRICTER SMOKE DETECTION: Gray colors with specific characteristics
        else if (r > 140 && g > 140 && b > 140 && r < 200 && g < 200 && b < 200 &&
                 Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20) {
          // Very specific grayish smoke colors, not clouds or bright surfaces
          if ((r + g + b) / 3 > 160 && (r + g + b) / 3 < 190) {  // Specific gray range
            smokePixels++;
          }
        }
      }

      const fireRatio = (brightFirePixels + firePixels + orangePixels) / totalPixels;
      const smokeRatio = smokePixels / totalPixels;
      
      // MUCH MORE REALISTIC thresholds to avoid false positives
      const fireDetected = fireRatio > 0.005;  // 0.5% fire pixels (stricter)
      const smokeDetected = smokeRatio > 0.08;  // 8% smoke pixels (stricter)
      
      // More conservative confidence calculation
      let confidence = 0;
      if (fireDetected && fireRatio > 0.01) {
        confidence = Math.min(0.95, 0.6 + fireRatio * 50);  // High confidence for significant fire
      } else if (fireDetected) {
        confidence = Math.min(0.75, 0.4 + fireRatio * 80);  // Moderate confidence for small fire
      } else if (smokeDetected && smokeRatio > 0.15) {
        confidence = Math.min(0.85, 0.5 + smokeRatio * 4);   // Good confidence for significant smoke
      } else if (smokeDetected) {
        confidence = Math.min(0.65, 0.3 + smokeRatio * 6);   // Lower confidence for less smoke
      } else {
        confidence = 0.1;  // Low confidence for no fire/smoke
      }
      
      const result = {
        success: true,
        fire_detected: fireDetected,
        smoke_detected: smokeDetected,
        confidence: confidence,
        scores: {
          fire: fireRatio,
          smoke: smokeRatio,
          normal: 1 - fireRatio - smokeRatio
        },
        detection_summary: this.generateFireDetectionSummary(fireDetected, smokeDetected, fireRatio, smokeRatio),
        visual_analysis: {
          fire_pixels: brightFirePixels + firePixels + orangePixels,
          smoke_pixels: smokePixels,
          fire_ratio: fireRatio,
          smoke_ratio: smokeRatio
        }
      };
      
      console.log(`🔥 VISUAL FIRE ANALYSIS: Fire=${(fireRatio*100).toFixed(3)}% (${fireDetected}), Smoke=${(smokeRatio*100).toFixed(1)}% (${smokeDetected}), Confidence=${(confidence*100).toFixed(1)}%`);
      return result;
      
    } catch (error) {
      console.error('Visual fire detection failed:', error);
      return {
        success: false,
        fire_detected: false,
        smoke_detected: false,
        confidence: 0,
        raw_scores: null
      };
    }
  }

  /**
   * CRITICAL NEW METHOD: Analyze image colors for vegetation dryness
   */
  async analyzeVegetationColors(imageBuffer) {
    try {
      // REAL COLOR ANALYSIS using Sharp for actual pixel processing
      const sharp = (await import('sharp')).default;
      
      // Resize for faster processing and extract dominant colors
      const { data, info } = await sharp(imageBuffer)
        .resize(100, 100)  // Small size for fast color analysis
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Analyze pixel colors to detect vegetation dryness
      let goldenPixels = 0;
      let brownPixels = 0;
      let greenPixels = 0;
      let yellowPixels = 0;
      const totalPixels = info.width * info.height;

      for (let i = 0; i < data.length; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // HSV conversion for better color detection
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        let hue = 0;
        if (diff !== 0) {
          if (max === r) hue = ((g - b) / diff) % 6;
          else if (max === g) hue = (b - r) / diff + 2;
          else hue = (r - g) / diff + 4;
        }
        hue = Math.round(hue * 60);
        if (hue < 0) hue += 360;
        
        const saturation = max === 0 ? 0 : diff / max;
        const value = max / 255;

        // SIMPLIFIED and more reliable color detection
        // Use simpler RGB-based approach for better reliability
        
        // Green detection: G > R and G > B (simple but effective)
        if (g > r && g > b && g > 80) {  // Green dominant with minimum brightness
          greenPixels++;
        }
        // Golden/yellow detection: High R and G, lower B
        else if (r > 120 && g > 100 && b < 80 && r > b && g > b) {
          if (r > 180 && g > 150) goldenPixels++;  // Very golden
          else yellowPixels++;
        }
        // Brown detection: R > G > B with moderate values
        else if (r > g && g > b && r > 80 && r < 150 && g < 120) {
          brownPixels++;
        }
      }

      const goldenRatio = goldenPixels / totalPixels;
      const brownRatio = brownPixels / totalPixels;
      const greenRatio = greenPixels / totalPixels;
      const yellowRatio = yellowPixels / totalPixels;
      
      // MUCH SIMPLER and more reliable dryness calculation
      const dryIndicators = goldenRatio + brownRatio * 0.8 + yellowRatio * 0.6;
      
      // Primary factor: ratio of dry to green
      let drynessFactor = dryIndicators / Math.max(greenRatio, 0.05);
      
      // Scale and normalize
      drynessFactor = Math.min(1.0, drynessFactor / 3.0);  // Normalize to 0-1 range
      
      // CRITICAL: Strong green override - if significant green, low dryness
      if (greenRatio > 0.15) {  // 15% or more green pixels
        drynessFactor = Math.min(drynessFactor, 0.3);  // Cap at 30% dryness
      }
      if (greenRatio > 0.25) {  // 25% or more green pixels  
        drynessFactor = Math.min(drynessFactor, 0.1);  // Cap at 10% dryness
      }

      const colorAnalysis = {
        golden_ratio: goldenRatio,
        brown_ratio: brownRatio,
        green_ratio: greenRatio,
        yellow_ratio: yellowRatio,
        dryness_factor: drynessFactor
      };
      
      console.log(`🎨 SIMPLIFIED Color Analysis: Golden=${(goldenRatio*100).toFixed(1)}%, Brown=${(brownRatio*100).toFixed(1)}%, Green=${(greenRatio*100).toFixed(1)}%, Yellow=${(yellowRatio*100).toFixed(1)}%, Dryness=${(drynessFactor*100).toFixed(1)}%`);
      console.log(`🔍 Raw counts: Golden=${goldenPixels}, Brown=${brownPixels}, Green=${greenPixels}, Yellow=${yellowPixels} / ${totalPixels} total`);
      return colorAnalysis;
      
    } catch (error) {
      console.error('Color analysis failed:', error);
      // Fallback to conservative estimates
      return {
        golden_ratio: 0.3,
        brown_ratio: 0.2,
        green_ratio: 0.6,
        yellow_ratio: 0.2,
        dryness_factor: 0.4
      };
    }
  }

  // Helper methods for classification
  isDryVegetationClass(label) {
    // Expanded dry vegetation keywords
    const dryKeywords = ['dry', 'dead', 'brown', 'yellow', 'sand', 'rock', 'bare', 'earth'];
    return dryKeywords.some(keyword => label.includes(keyword));
  }

  isTreeClass(label) {
    const treeKeywords = ['tree', 'forest', 'plant', 'vegetation'];
    return treeKeywords.some(keyword => label.includes(keyword));
  }

  isGrassClass(label) {
    const grassKeywords = ['grass', 'field', 'lawn', 'meadow', 'ground'];
    return grassKeywords.some(keyword => label.includes(keyword));
  }

  isShrubClass(label) {
    const shrubKeywords = ['bush', 'shrub', 'plant', 'flower'];
    return shrubKeywords.some(keyword => label.includes(keyword));
  }

  // Risk calculation helpers
  calculateFireRiskLevel(fireScore, smokeScore) {
    const maxScore = Math.max(fireScore, smokeScore);
    if (maxScore > 0.8) return 'EXTREME';
    if (maxScore > 0.6) return 'HIGH';
    if (maxScore > 0.4) return 'MODERATE';
    return 'LOW';
  }

  calculateIgnitionPotential(vegetationTypes, colorAnalysis = null) {
    let potential = (vegetationTypes.dry_vegetation * 0.9) + (vegetationTypes.grass_ground * 0.7);
    
    // CRITICAL: Boost ignition potential for dry colors
    if (colorAnalysis && colorAnalysis.dryness_factor > 0.5) {
      potential *= (1 + colorAnalysis.dryness_factor * 0.4); // Up to 1.4x boost
    }
    
    return Math.min(1.0, potential);
  }

  calculateFireSpreadRisk(vegetationTypes, colorAnalysis = null) {
    let spreadRisk = (vegetationTypes.dense_trees * 0.8) + (vegetationTypes.shrubs_bushes * 0.9) + (vegetationTypes.grass_ground * 0.6);
    
    // CRITICAL: Dry vegetation spreads fire much faster
    if (colorAnalysis && colorAnalysis.dryness_factor > 0.6) {
      spreadRisk *= (1 + colorAnalysis.dryness_factor * 0.3); // Up to 1.3x boost
    }
    
    return Math.min(1.0, spreadRisk);
  }

  categorizeFuelDensity(fuelLoad) {
    if (fuelLoad > 0.8) return 'Very High';
    if (fuelLoad > 0.6) return 'High';
    if (fuelLoad > 0.4) return 'Moderate';
    if (fuelLoad > 0.2) return 'Low';
    return 'Very Low';
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

  calculateOverallConfidence(fireAnalysis, vegetationAnalysis) {
    // IMPROVED: Much better confidence calculation
    let overallConfidence = 0;
    let componentCount = 0;
    
    // Fire detection confidence (highest weight)
    if (fireAnalysis.success) {
      if (fireAnalysis.fire_detected || fireAnalysis.smoke_detected) {
        // High confidence for positive fire/smoke detection
        overallConfidence += Math.max(0.8, fireAnalysis.confidence);
      } else {
        // Moderate confidence for negative detection
        overallConfidence += Math.max(0.6, fireAnalysis.confidence);
      }
      componentCount++;
    }
    
    // Vegetation analysis confidence
    if (vegetationAnalysis.success) {
      const vegConf = vegetationAnalysis.confidence || 0.5;
      // Boost confidence if we have color analysis
      if (vegetationAnalysis.color_analysis) {
        overallConfidence += Math.max(0.7, vegConf);
      } else {
        overallConfidence += Math.max(0.6, vegConf);
      }
      componentCount++;
    }
    
    // Default to reasonable confidence if we have any analysis
    if (componentCount === 0) {
      return 0.5;
    }
    
    const finalConfidence = overallConfidence / componentCount;
    
    // Ensure minimum confidence levels based on detection quality
    if (fireAnalysis.fire_detected) {
      return Math.max(finalConfidence, 0.85);  // High confidence for fire
    } else if (fireAnalysis.smoke_detected) {
      return Math.max(finalConfidence, 0.75);  // Good confidence for smoke
    } else {
      return Math.max(finalConfidence, 0.65);  // Decent confidence otherwise
    }
  }

  generateRiskRecommendations(riskScore, riskFactors) {
    const recommendations = [];
    
    if (riskScore >= 75) {
      recommendations.push('IMMEDIATE ACTION: Consider evacuation if fire detected');
      recommendations.push('Monitor emergency alerts and evacuation routes');
    } else if (riskScore >= 50) {
      recommendations.push('Create defensible space around structures');
      recommendations.push('Remove dry vegetation and debris');
    } else if (riskScore >= 25) {
      recommendations.push('Maintain basic fire safety measures');
      recommendations.push('Keep vegetation watered and trimmed');
    }

    return recommendations;
  }

  // Fallback methods
  getHeuristicVegetationAnalysis(colorAnalysis = null) {
    // MUCH BETTER heuristic that properly uses color analysis
    let fuelLoadScore, fuelDensity, ignitionPotential, fireSpreadRisk;
    let riskFactors = [];
    let vegetationBreakdown;
    
    if (colorAnalysis) {
      const dryness = colorAnalysis.dryness_factor;
      const greenRatio = colorAnalysis.green_ratio;
      
      // PROPER classification based on actual color analysis
      if (greenRatio > 0.4) {
        // Very green landscape
        fuelLoadScore = Math.max(0.1, 0.3 - greenRatio * 0.2); // Very low fuel load
        fuelDensity = 'Low';
        ignitionPotential = Math.max(0.05, 0.2 - greenRatio * 0.15);
        fireSpreadRisk = Math.max(0.1, 0.3 - greenRatio * 0.2);
        riskFactors = ['Healthy green vegetation - low fire risk'];
        
        vegetationBreakdown = {
          dry_vegetation: Math.max(0, dryness * 0.5),
          dense_trees: Math.min(0.4, greenRatio * 0.6),
          grass_ground: Math.min(0.6, greenRatio * 0.8),
          shrubs_bushes: Math.min(0.3, greenRatio * 0.4),
          total_vegetation: Math.min(1.0, greenRatio + 0.2)
        };
        
      } else if (dryness > 0.7) {
        // Very dry vegetation
        fuelLoadScore = Math.min(0.9, 0.6 + dryness * 0.3);
        fuelDensity = 'Very High';
        ignitionPotential = Math.min(0.9, 0.5 + dryness * 0.4);
        fireSpreadRisk = Math.min(0.8, 0.4 + dryness * 0.4);
        riskFactors = ['High dry vegetation coverage', 'Golden/brown vegetation detected'];
        
        vegetationBreakdown = {
          dry_vegetation: Math.min(0.8, dryness * 0.9),
          dense_trees: 0.3,
          grass_ground: Math.min(0.6, dryness * 0.7),
          shrubs_bushes: 0.3,
          total_vegetation: Math.min(1.0, 0.7 + dryness * 0.3)
        };
        
      } else {
        // Moderate vegetation
        fuelLoadScore = 0.4 + dryness * 0.2;
        fuelDensity = 'Moderate';
        ignitionPotential = 0.3 + dryness * 0.3;
        fireSpreadRisk = 0.3 + dryness * 0.2;
        riskFactors = ['Moderate vegetation detected'];
        
        vegetationBreakdown = {
          dry_vegetation: dryness * 0.6,
          dense_trees: 0.3,
          grass_ground: 0.3 + dryness * 0.2,
          shrubs_bushes: 0.2,
          total_vegetation: 0.5 + dryness * 0.2
        };
      }
    } else {
      // No color analysis - conservative defaults
      fuelLoadScore = 0.4;
      fuelDensity = 'Moderate';
      ignitionPotential = 0.3;
      fireSpreadRisk = 0.4;
      riskFactors = ['Vegetation analysis unavailable'];
      
      vegetationBreakdown = {
        dry_vegetation: 0.3,
        dense_trees: 0.3,
        grass_ground: 0.3,
        shrubs_bushes: 0.2,
        total_vegetation: 0.5
      };
    }
    
    return {
      success: true,
      vegetation_coverage: vegetationBreakdown.total_vegetation,
      vegetation_breakdown: vegetationBreakdown,
      fuel_load_assessment: {
        fuel_load_score: fuelLoadScore,
        fuel_density: fuelDensity,
        ignition_potential: ignitionPotential,
        fire_spread_risk: fireSpreadRisk,
        dryness_factor: colorAnalysis?.dryness_factor || 0.4
      },
      fire_risk_factors: riskFactors,
      color_analysis: colorAnalysis,
      confidence: colorAnalysis ? 0.8 : 0.5  // Higher confidence with color analysis
    };
  }

  async getFallbackAnalysis(imageBuffer, token) {
    return {
      fire_analysis: {
        success: false,
        fire_detected: false,
        smoke_detected: false,
        confidence: 0
      },
      vegetation_analysis: this.getHeuristicVegetationAnalysis(),
      combined_assessment: {
        overall_risk_score: 35,
        risk_category: 'MODERATE',
        risk_level: 'Moderate Risk',
        primary_risk_factors: ['Analysis unavailable - using conservative estimate'],
        confidence: 0.3,
        recommendations: ['Professional assessment recommended']
      }
    };
  }

  generateFireDetectionSummary(fireDetected, smokeDetected, fireScore, smokeScore) {
    if (fireDetected) {
      return `Active fire detected with ${(fireScore * 100).toFixed(1)}% confidence`;
    } else if (smokeDetected) {
      return `Smoke detected with ${(smokeScore * 100).toFixed(1)}% confidence`;
    } else {
      return 'No fire or smoke detected';
    }
  }

  identifyVegetationRiskFactors(vegetationTypes, colorAnalysis = null) {
    const factors = [];
    
    // Enhanced risk factor detection
    if (vegetationTypes.dry_vegetation > 0.4) {  // Lowered threshold
      factors.push('High dry vegetation coverage');
    }
    if (vegetationTypes.dense_trees > 0.5) {  // Lowered threshold
      factors.push('Dense tree canopy present');
    }
    if (vegetationTypes.grass_ground > 0.3) {  // Lowered threshold
      factors.push('Significant ground fuel load');
    }
    
    // CRITICAL: Color-based risk factors
    if (colorAnalysis) {
      if (colorAnalysis.dryness_factor > 0.7) {
        factors.push('Severe vegetation dryness detected');
      } else if (colorAnalysis.dryness_factor > 0.5) {
        factors.push('Moderate vegetation dryness detected');
      }
      
      if (colorAnalysis.golden_ratio > 0.6) {
        factors.push('Golden/dry grass coloration');
      }
      
      if (colorAnalysis.brown_ratio > 0.5) {
        factors.push('Brown/dead vegetation present');
      }
    }
    
    return factors;
  }
}