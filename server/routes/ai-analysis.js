import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { SegmentationService } from '../services/ai/segmentationService.js';
import { FeatureExtractor } from '../services/ai/featureExtractor.js';
import { RiskCalculator } from '../services/ai/riskCalculator.js';
import { WeatherIntegration } from '../services/ai/weatherIntegration.js';

const router = express.Router();

// Initialize AI services
const segmentationService = new SegmentationService();
const featureExtractor = new FeatureExtractor();
const riskCalculator = new RiskCalculator();
const weatherIntegration = new WeatherIntegration();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Enhanced image analysis endpoint
router.post('/analyze', 
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No image file provided',
          message: 'Please upload an image file for analysis'
        });
      }

      console.log('🚀 Starting enhanced AI analysis pipeline...');

      // Optimize image for AI processing
      const optimizedImage = await sharp(req.file.buffer)
        .resize(512, 512, { fit: 'cover' }) // Increased resolution for better segmentation
        .jpeg({ quality: 90 })
        .toBuffer();

      const huggingfaceToken = process.env.VITE_HUGGINGFACE_API_TOKEN || process.env.HUGGINGFACE_API_TOKEN;
      
      let analysis;
      
      if (huggingfaceToken) {
        try {
          console.log('🎯 Using enhanced AI pipeline with segmentation...');
          
          // Test HuggingFace connection first
          const connectionOk = await segmentationService.testHuggingFaceConnection(huggingfaceToken);
          if (!connectionOk) {
            console.log('⚠️ HuggingFace API connection test failed, using fallback');
            analysis = await getFallbackAnalysis(req.file.originalname, optimizedImage);
          } else {
            analysis = await processEnhancedAIAnalysis(optimizedImage, huggingfaceToken, req);
          }
        } catch (apiError) {
          console.error('Enhanced AI pipeline failed:', apiError);
          analysis = await getFallbackAnalysis(req.file.originalname, optimizedImage);
        }
      } else {
        console.log('Hugging Face token not configured, using enhanced fallback analysis');
        analysis = await getFallbackAnalysis(req.file.originalname, optimizedImage);
      }

      // Enhanced AI analysis processing function
      async function processEnhancedAIAnalysis(imageBuffer, token, req) {
        const startTime = Date.now();
        
        try {
          // Stage 1: Semantic Segmentation
          console.log('🎯 Stage 1: Performing semantic segmentation...');
          const segmentationResult = await segmentationService.performSegmentation(
            imageBuffer, 
            token, 
            { filename: req.file.originalname }
          );
          
          // Stage 2: Feature Extraction
          console.log('🔍 Stage 2: Extracting fire hazard features...');
          console.log('🔍 Segmentation result quality:', segmentationResult.final_masks?.segmentation_quality || 'unknown');
          console.log('🔍 Available masks:', Object.keys(segmentationResult.final_masks || {}));
          
          // CRITICAL DEBUG: Log actual segmentation data
          if (segmentationResult.final_masks) {
            console.log('🔍 SEGMENTATION DEBUG:');
            console.log('- Trees count:', segmentationResult.final_masks.trees?.length || 0);
            console.log('- Grass count:', segmentationResult.final_masks.grass?.length || 0);
            console.log('- Buildings count:', segmentationResult.final_masks.buildings?.length || 0);
            console.log('- Other vegetation count:', segmentationResult.final_masks.other_vegetation?.length || 0);
            
            if (segmentationResult.final_masks.trees?.length > 0) {
              console.log('- Tree samples:', segmentationResult.final_masks.trees.slice(0, 2));
            }
            if (segmentationResult.final_masks.grass?.length > 0) {
              console.log('- Grass samples:', segmentationResult.final_masks.grass.slice(0, 2));
            }
          }
          
          const features = await featureExtractor.extractFireHazardFeatures(
            segmentationResult, 
            imageBuffer, 
            { filename: req.file.originalname }
          );
          
          console.log('🔍 Feature extraction summary:');
          console.log('- Fuel Load Risk:', features.fuel_load?.risk_score || 'N/A');
          console.log('- Dryness Risk:', features.dryness_index?.risk_score || 'N/A');
          console.log('- Fire Indicators:', features.dryness_index?.fire_indicators || 'N/A');
          
          // Stage 3: Weather Integration
          console.log('🌤️ Stage 3: Integrating weather data...');
          const location = req.body.location ? JSON.parse(req.body.location) : null;
          let weatherData = null;
          
          if (location && location.lat && location.lng) {
            weatherData = await weatherIntegration.getFireWeatherData(location.lat, location.lng);
          }
          
          // Stage 4: Risk Calculation
          console.log('🔥 Stage 4: Calculating comprehensive risk...');
          const riskAssessment = await riskCalculator.calculateFireRisk(features, weatherData, location);
          
          // Stage 5: Format Results
          const processingTime = Date.now() - startTime;
          
          return {
            success: true,
            analysis: {
              riskScore: Math.round(riskAssessment.composite_risk_score),
              overallRisk: riskAssessment.risk_category,
              confidence: Math.round(riskAssessment.confidence_level * 100) / 100,
              
              hazards: formatEnhancedHazards(riskAssessment.risk_factors, segmentationResult, features),
              detectedObjects: formatDetectedObjects(segmentationResult, features),
              riskBreakdown: formatRiskBreakdown(riskAssessment, features),
              fireWeatherIndex: weatherData?.fire_weather_indices || null,
              
              recommendations: riskAssessment.recommendations,
              emergencyActions: riskAssessment.emergency_actions,
              
              analysisDetails: {
                segmentation: {
                  model: segmentationResult.final_masks?.segmentation_quality || 'enhanced_pipeline',
                  confidence: segmentationResult.primary?.confidence || segmentationResult.fallback?.confidence || 0.7,
                  vegetation_coverage: features.total_vegetation_coverage || 0
                },
                features: {
                  fuel_load: features.fuel_load,
                  vertical_continuity: features.vertical_continuity,
                  dryness_index: features.dryness_index,
                  proximity_to_structures: features.proximity_to_structures
                },
                risk_components: riskAssessment.risk_components,
                weather_conditions: weatherData?.current || null,
                fire_weather_indices: weatherData?.fire_weather_indices || null,
                
                processing_time: processingTime,
                pipeline_version: '2.0-enhanced',
                model_versions: {
                  segmentation: 'nvidia/segformer-b2-finetuned-ade20k',
                  fallback: 'facebook/sam-vit-large',
                  risk_calculator: '2.0'
                }
              }
            },
            metadata: {
              imageProcessed: true,
              processingTime: processingTime,
              enhancedPipeline: true,
              timestamp: new Date().toISOString()
            }
          };
          
        } catch (error) {
          console.error('Enhanced AI pipeline error:', error);
          throw error;
        }
      }
      
      // Fallback analysis for when AI services are unavailable
      async function getFallbackAnalysis(filename, imageBuffer) {
        console.log('🔧 Using enhanced fallback analysis...');
        
        try {
          // Use heuristic-based analysis with context
          const heuristicFeatures = await featureExtractor.extractFireHazardFeatures(
            { masks: segmentationService.generateHeuristicMasks(imageBuffer, { filename: filename }) },
            imageBuffer,
            { filename: filename }
          );
          
          const fallbackRisk = await riskCalculator.calculateFireRisk(heuristicFeatures);
          
          return {
            success: true,
            analysis: {
              riskScore: Math.round(fallbackRisk.composite_risk_score),
              overallRisk: fallbackRisk.risk_category,
              confidence: 0.6, // Lower confidence for fallback
              
              hazards: formatEnhancedHazards(fallbackRisk.risk_factors, { masks: segmentationService.generateHeuristicMasks(imageBuffer, { filename: filename }) }, heuristicFeatures),
              detectedObjects: formatDetectedObjects({ masks: segmentationService.generateHeuristicMasks(imageBuffer, { filename: filename }) }, heuristicFeatures),
              riskBreakdown: formatRiskBreakdown(fallbackRisk, heuristicFeatures),
              fireWeatherIndex: null, // No weather data in fallback
              
              recommendations: fallbackRisk.recommendations,
              
              analysisDetails: {
                segmentation: {
                  model: 'heuristic_fallback',
                  confidence: 0.5,
                  vegetation_coverage: heuristicFeatures.total_vegetation_coverage || 0.3
                },
                features: heuristicFeatures,
                risk_components: fallbackRisk.risk_components,
                
                pipeline_version: '2.0-fallback',
                fallback_reason: 'AI services unavailable'
              }
            },
            metadata: {
              imageProcessed: true,
              enhancedPipeline: false,
              fallbackUsed: true,
              timestamp: new Date().toISOString()
            }
          };
          
        } catch (error) {
          console.error('Fallback analysis failed:', error);
          return getBasicMockAnalysis(filename);
        }
      }
      
      // Enhanced hazard formatting with detected objects context
      function formatEnhancedHazards(riskFactors, segmentationResult, features) {
        console.log('🔍 Formatting enhanced hazards with object detection...');
        
        const hazards = formatHazardsFromRiskFactors(riskFactors);
        
        // Add object detection context to hazards
        const masks = segmentationResult.final_masks || segmentationResult.masks || {};
        const detectedObjects = {
          trees: masks.trees?.length || 0,
          grass: masks.grass?.length || 0,
          buildings: masks.buildings?.length || 0,
          other_vegetation: masks.other_vegetation?.length || 0
        };
        
        // Enhance hazards with specific object information
        return hazards.map(hazard => ({
          ...hazard,
          detectedObjects: detectedObjects,
          specificRisks: getSpecificRisks(hazard, features, detectedObjects)
        }));
      }
      
      // Format detected objects summary
      function formatDetectedObjects(segmentationResult, features) {
        const masks = segmentationResult.final_masks || segmentationResult.masks || {};
        
        const objects = [];
        
        if (masks.trees && masks.trees.length > 0) {
          objects.push({
            type: 'Trees',
            count: masks.trees.length,
            coverage: features.fuel_load?.composition?.heavy_fuels || 0,
            riskContribution: 'High fuel load, potential for crown fires',
            confidence: 0.8
          });
        }
        
        if (masks.grass && masks.grass.length > 0) {
          objects.push({
            type: 'Grass/Ground Vegetation',
            count: masks.grass.length,
            coverage: features.fuel_load?.composition?.fine_fuels || 0,
            riskContribution: 'Fast-spreading surface fires',
            confidence: 0.7
          });
        }
        
        if (masks.other_vegetation && masks.other_vegetation.length > 0) {
          objects.push({
            type: 'Shrubs/Bushes',
            count: masks.other_vegetation.length,
            coverage: features.fuel_load?.composition?.medium_fuels || 0,
            riskContribution: 'Intermediate fuel load, ladder fuel potential',
            confidence: 0.75
          });
        }
        
        if (masks.buildings && masks.buildings.length > 0) {
          objects.push({
            type: 'Structures',
            count: masks.buildings.length,
            coverage: features.proximity_to_structures?.structure_coverage || 0,
            riskContribution: 'Asset at risk, defensible space needed',
            confidence: 0.6
          });
        }
        
        // Add fire indicators if detected
        if (features.dryness_index?.fire_indicators?.active_fire) {
          objects.push({
            type: 'Fire/Flames',
            count: 1,
            coverage: features.dryness_index.fire_indicators.fire_probability,
            riskContribution: 'Active fire - immediate evacuation threat',
            confidence: 0.9
          });
        }
        
        if (features.dryness_index?.fire_indicators?.smoke_present) {
          objects.push({
            type: 'Smoke',
            count: 1,
            coverage: features.dryness_index.fire_indicators.smoke_probability,
            riskContribution: 'Indicates nearby fire activity',
            confidence: 0.8
          });
        }
        
        return {
          totalObjects: objects.length,
          objects: objects,
          vegetationCoverage: features.total_vegetation_coverage || 0,
          summary: generateObjectSummary(objects)
        };
      }
      
      // Format detailed risk breakdown
      function formatRiskBreakdown(riskAssessment, features) {
        const baseRisk = riskAssessment.base_risk_score || 0;
        const environmentalRisk = riskAssessment.environmental_risk || 0;
        const compositeRisk = riskAssessment.composite_risk_score || 0;
        
        return {
          finalRiskScore: Math.round(compositeRisk),
          riskCategory: riskAssessment.risk_category,
          contributingFactors: {
            baseRisk: {
              score: Math.round(baseRisk),
              weight: 0.7,
              description: 'Risk from vegetation and physical features'
            },
            environmentalRisk: {
              score: Math.round(environmentalRisk),
              weight: 0.3,
              description: 'Risk from weather and environmental conditions'
            }
          },
          componentBreakdown: {
            fuelLoad: {
              score: features.fuel_load?.risk_score || 0,
              weight: 0.25,
              description: 'Amount of combustible vegetation',
              details: features.fuel_load
            },
            verticalContinuity: {
              score: features.vertical_continuity?.risk_score || 0,
              weight: 0.20,
              description: 'Ladder fuels enabling crown fires',
              details: features.vertical_continuity
            },
            drynessIndex: {
              score: features.dryness_index?.risk_score || 0,
              weight: 0.20,
              description: 'Vegetation moisture and ignition probability',
              details: features.dryness_index
            },
            proximityToStructures: {
              score: features.proximity_to_structures?.risk_score || 0,
              weight: 0.15,
              description: 'Asset exposure and defensible space',
              details: features.proximity_to_structures
            },
            fragmentation: {
              score: features.fragmentation?.risk_score || 0,
              weight: 0.10,
              description: 'Fire spread potential based on vegetation patterns',
              details: features.fragmentation
            }
          },
          calculationMethod: 'Weighted composite score with environmental modifiers',
          confidenceLevel: riskAssessment.confidence_level || 0.7
        };
      }
      
      // Helper functions
      function getSpecificRisks(hazard, features, detectedObjects) {
        const risks = [];
        
        if (detectedObjects.trees > 0 && hazard.type.includes('Fire')) {
          risks.push('Crown fire potential with ' + detectedObjects.trees + ' tree segments');
        }
        
        if (detectedObjects.buildings > 0) {
          risks.push('Structure ignition risk with inadequate defensible space');
        }
        
        if (features.vertical_continuity?.ladder_fuel_factor > 0.6) {
          risks.push('Ladder fuel continuity between vegetation layers');
        }
        
        return risks;
      }
      
      function generateObjectSummary(objects) {
        if (objects.length === 0) return 'No specific objects detected';
        
        const summary = objects.map(obj => `${obj.count} ${obj.type.toLowerCase()}`).join(', ');
        return `Detected: ${summary}`;
      }
      
      // Format hazards from risk factors
      function formatHazardsFromRiskFactors(riskFactors) {
        console.log('🔍 Formatting hazards from risk factors:', riskFactors);
        
        // Handle various risk factor formats
        let factors = [];
        
        if (Array.isArray(riskFactors)) {
          factors = riskFactors;
        } else if (riskFactors && typeof riskFactors === 'object') {
          // Convert object format to array
          factors = Object.keys(riskFactors).map(key => ({
            factor: key,
            severity: 'medium',
            description: `${key} risk factor detected`,
            impact: `May affect fire behavior`
          }));
        }
        
        if (factors.length === 0) {
          return [{
            type: 'General Vegetation',
            severity: 'Low',
            confidence: 0.7,
            description: 'Standard vegetation fire risk assessment',
            location: 'Throughout image'
          }];
        }
        
        return factors.map(factor => ({
          type: factor.factor || factor.type || 'Unknown Risk Factor',
          severity: factor.severity ? factor.severity.charAt(0).toUpperCase() + factor.severity.slice(1) : 'Medium',
          confidence: factor.confidence || 0.75,
          description: factor.description || 'Risk factor detected in analysis',
          location: factor.location || 'Detected in image',
          impact: factor.impact || 'May affect fire risk'
        }));
      }
      
      // Basic mock analysis as last resort
      function getBasicMockAnalysis(filename) {
        console.log('🔧 Using basic mock analysis...');
        
        // Simplified risk assessment based on filename
        const riskKeywords = ['dry', 'dead', 'brown', 'brush', 'wildfire', 'drought'];
        let riskScore = 35; // Default moderate-low risk
        
        riskKeywords.forEach(keyword => {
          if (filename.toLowerCase().includes(keyword)) {
            riskScore += 15;
          }
        });
        
        riskScore = Math.min(100, Math.max(10, riskScore));
        
        return {
          success: true,
          analysis: {
            riskScore: riskScore,
            overallRisk: riskScore > 60 ? 'HIGH' : riskScore > 30 ? 'MODERATE' : 'LOW',
            confidence: 0.4, // Low confidence for basic analysis
            
            hazards: [{
              type: 'Vegetation Assessment',
              severity: riskScore > 60 ? 'High' : 'Medium',
              confidence: 0.4,
              description: 'Basic vegetation risk assessment (limited accuracy)',
              location: 'Image area',
              detectedObjects: { trees: 0, grass: 0, buildings: 0, other_vegetation: 0 },
              specificRisks: ['Limited analysis capability']
            }],
            
            detectedObjects: {
              totalObjects: 1,
              objects: [{
                type: 'General Vegetation',
                count: 1,
                coverage: 0.4,
                riskContribution: 'Basic vegetation risk assessment',
                confidence: 0.3
              }],
              vegetationCoverage: 0.4,
              summary: 'Basic analysis - limited object detection'
            },
            
            riskBreakdown: {
              finalRiskScore: riskScore,
              riskCategory: riskScore > 60 ? 'HIGH' : riskScore > 30 ? 'MODERATE' : 'LOW',
              contributingFactors: {
                baseRisk: {
                  score: riskScore,
                  weight: 1.0,
                  description: 'Basic filename-based risk assessment'
                },
                environmentalRisk: {
                  score: 0,
                  weight: 0,
                  description: 'No weather data available'
                }
              },
              componentBreakdown: {
                fuelLoad: { score: Math.round(riskScore * 0.4), weight: 0.4, description: 'Estimated fuel load' },
                verticalContinuity: { score: Math.round(riskScore * 0.2), weight: 0.2, description: 'Estimated ladder fuels' },
                drynessIndex: { score: Math.round(riskScore * 0.3), weight: 0.3, description: 'Estimated dryness' },
                proximityToStructures: { score: 0, weight: 0.1, description: 'Unknown structure proximity' },
                fragmentation: { score: 0, weight: 0, description: 'Unknown fragmentation' }
              },
              calculationMethod: 'Basic heuristic assessment - limited accuracy',
              confidenceLevel: 0.3
            },
            
            fireWeatherIndex: null,
            emergencyActions: [],
            
            recommendations: [
              'Upload to enhanced AI system for detailed analysis',
              'Consider professional fire risk assessment',
              'Maintain basic defensible space principles'
            ],
            
            analysisDetails: {
              segmentation: {
                model: 'basic_mock',
                confidence: 0.3,
                vegetation_coverage: 0.4
              },
              pipeline_version: '2.0-basic',
              limitation: 'Limited analysis - enhanced services unavailable'
            }
          },
          metadata: {
            imageProcessed: false,
            enhancedPipeline: false,
            basicFallback: true,
            timestamp: new Date().toISOString()
          }
        };
      }

      // Return the analysis result with consistent structure
      res.json({
        success: true,
        analysis: analysis.analysis,
        metadata: {
          ...analysis.metadata,
          filename: req.file.originalname,
          imageSize: req.file.size,
          processedSize: optimizedImage.length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('AI Analysis error:', error);
      next(error);
    }
  }
);

// Health check for AI service
router.get('/health', (req, res) => {
  res.json({
    service: 'Enhanced AI Analysis',
    status: 'operational',
    models: {
      primary_segmentation: 'nvidia/segformer-b2-finetuned-ade20k',
      fallback_segmentation: 'facebook/sam-vit-large',
      feature_extraction: 'physics-based-v2.0',
      risk_calculator: 'multi-modal-v2.0',
      weather_integration: 'openweather-api'
    },
    pipeline_version: '2.0-enhanced',
    timestamp: new Date().toISOString()
  });
});

export default router;
