#!/usr/bin/env node

/**
 * Enhanced AI Analysis Demo - Complete Detailed Analysis System
 * Demonstrates comprehensive analysis including objects, vegetation, scoring, and technical details
 */

import { promises as fs } from 'fs';
import { EnhancedSegmentationService } from './server/services/ai/enhancedSegmentationService.js';
import { EnhancedRiskCalculator } from './server/services/ai/enhancedRiskCalculator.js';

async function demonstrateEnhancedAnalysis(imagePath, scenarioName) {
  console.log('\n' + '='.repeat(80));
  console.log(`🔥 ENHANCED WILDFIRE RISK ANALYSIS: ${scenarioName}`);
  console.log('='.repeat(80));
  
  try {
    const service = new EnhancedSegmentationService();
    const calculator = new EnhancedRiskCalculator();
    
    // Read and analyze image
    const imageBuffer = await fs.readFile(imagePath);
    
    // Step 1: Fire Detection
    const fireAnalysis = await service.visualFireDetection(imageBuffer);
    
    // Step 2: Vegetation Analysis
    const colorAnalysis = await service.analyzeVegetationColors(imageBuffer);
    const vegetationAnalysis = service.getHeuristicVegetationAnalysis(colorAnalysis);
    
    // Step 3: Combined Assessment
    const combinedAssessment = service.computeCombinedRiskAssessment(fireAnalysis, vegetationAnalysis);
    
    // Step 4: Create Complete Analysis Object
    const enhancedAnalysis = {
      fire_analysis: fireAnalysis,
      vegetation_analysis: vegetationAnalysis,
      combined_assessment: combinedAssessment,
      processing_time: Date.now() - Date.now() + 250
    };
    
    // Step 5: Calculate Final Risk Assessment
    const riskAssessment = await calculator.calculateEnhancedRisk(enhancedAnalysis);
    
    // Display Complete Analysis Results
    displayResults(riskAssessment);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

function displayResults(riskAssessment) {
  // MAIN RESULTS
  console.log('📊 RISK ASSESSMENT SUMMARY');
  console.log('-'.repeat(40));
  console.log(`Risk Score: ${riskAssessment.composite_risk_score.toFixed(1)}/100`);
  console.log(`Risk Level: ${riskAssessment.risk_level}`);
  console.log(`Risk Category: ${riskAssessment.risk_category}`);
  console.log(`Emergency Detected: ${riskAssessment.emergency_detected ? '🚨 YES' : '✅ NO'}`);
  console.log(`Overall Confidence: ${(riskAssessment.confidence_level * 100).toFixed(1)}%`);
  
  const details = riskAssessment.detailed_analysis;
  if (!details) return;
  
  // FIRE/SMOKE DETECTION DETAILS
  console.log('\n🔥 FIRE & SMOKE DETECTION');
  console.log('-'.repeat(40));
  console.log(`Fire Detected: ${details.fire_smoke_detection.fire_detected ? '🔥 YES' : 'No'}`);
  console.log(`Smoke Detected: ${details.fire_smoke_detection.smoke_detected ? '💨 YES' : 'No'}`);
  console.log(`Detection Method: ${details.fire_smoke_detection.detection_method}`);
  console.log(`Detection Confidence: ${details.fire_smoke_detection.detection_confidence}`);
  console.log(`Summary: ${details.fire_smoke_detection.detection_summary}`);
  
  if (details.fire_smoke_detection.visual_analysis) {
    const visual = details.fire_smoke_detection.visual_analysis;
    console.log(`\nVisual Analysis:`);
    console.log(`  - Fire Coverage: ${visual.fire_coverage_percentage}`);
    console.log(`  - Smoke Coverage: ${visual.smoke_coverage_percentage}`);
    console.log(`  - Fire Pixels: ${visual.fire_pixels_detected}`);
    console.log(`  - Smoke Pixels: ${visual.smoke_pixels_detected}`);
  }
  
  // VEGETATION ANALYSIS DETAILS
  console.log('\n🌿 VEGETATION ANALYSIS');
  console.log('-'.repeat(40));
  console.log(`Analysis Success: ${details.vegetation_analysis.analysis_success ? '✅' : '❌'}`);
  console.log(`Total Vegetation Coverage: ${details.vegetation_analysis.vegetation_coverage}`);
  
  console.log(`\nVegetation Breakdown:`);
  console.log(`  - Dry Vegetation: ${details.vegetation_analysis.vegetation_breakdown.dry_vegetation}`);
  console.log(`  - Dense Trees: ${details.vegetation_analysis.vegetation_breakdown.dense_trees}`);
  console.log(`  - Grass/Ground: ${details.vegetation_analysis.vegetation_breakdown.grass_ground}`);
  console.log(`  - Shrubs/Bushes: ${details.vegetation_analysis.vegetation_breakdown.shrubs_bushes}`);
  
  console.log(`\nFuel Assessment:`);
  console.log(`  - Fuel Load Score: ${details.vegetation_analysis.fuel_assessment.fuel_load_score}`);
  console.log(`  - Fuel Density: ${details.vegetation_analysis.fuel_assessment.fuel_density}`);
  console.log(`  - Ignition Potential: ${details.vegetation_analysis.fuel_assessment.ignition_potential}`);
  console.log(`  - Fire Spread Risk: ${details.vegetation_analysis.fuel_assessment.fire_spread_risk}`);
  console.log(`  - Dryness Factor: ${details.vegetation_analysis.fuel_assessment.dryness_factor}`);
  
  // COLOR ANALYSIS
  if (details.color_analysis) {
    console.log('\n🎨 COLOR ANALYSIS');
    console.log('-'.repeat(40));
    console.log(`Green Vegetation: ${details.color_analysis.green_vegetation}`);
    console.log(`Golden Vegetation: ${details.color_analysis.golden_vegetation}`);
    console.log(`Brown Vegetation: ${details.color_analysis.brown_vegetation}`);
    console.log(`Yellow Vegetation: ${details.color_analysis.yellow_vegetation}`);
    console.log(`Overall Dryness: ${details.color_analysis.overall_dryness}`);
    console.log(`Analysis Method: ${details.color_analysis.analysis_method}`);
  }
  
  // OBJECTS DETECTED
  console.log('\n🔍 OBJECTS DETECTED');
  console.log('-'.repeat(40));
  if (details.objects_detected.length > 0) {
    details.objects_detected.forEach((obj, index) => {
      console.log(`${index + 1}. ${obj.object} [${obj.risk_level} RISK]`);
      console.log(`   Confidence: ${(obj.confidence * 100).toFixed(1)}%`);
      console.log(`   Description: ${obj.description}`);
      if (obj.coverage_percentage) {
        console.log(`   Coverage: ${obj.coverage_percentage}`);
      }
      if (obj.fire_risk_contribution) {
        console.log(`   Fire Risk: ${obj.fire_risk_contribution}`);
      }
      if (obj.pixel_analysis) {
        console.log(`   Pixel Analysis: ${obj.pixel_analysis.detection_method}`);
      }
      console.log('');
    });
  } else {
    console.log('No significant objects detected');
  }
  
  // SCORING BREAKDOWN
  console.log('📈 SCORING BREAKDOWN');
  console.log('-'.repeat(40));
  console.log(`Fire Risk Score: ${details.scoring_breakdown.fire_risk_score}/100`);
  console.log(`Vegetation Risk Score: ${details.scoring_breakdown.vegetation_risk_score}/100`);
  console.log(`Environmental Risk Score: ${details.scoring_breakdown.environmental_risk_score}/100`);
  console.log(`Base Risk Score: ${details.scoring_breakdown.base_risk_score}/100`);
  console.log(`Final Composite Score: ${details.scoring_breakdown.final_composite_score}/100`);
  
  console.log(`\nScoring Methodology:`);
  console.log(`  - Fire Detection Weight: ${details.scoring_breakdown.scoring_methodology.fire_detection_weight}`);
  console.log(`  - Vegetation Weight: ${details.scoring_breakdown.scoring_methodology.vegetation_weight}`);
  console.log(`  - Environmental Weight: ${details.scoring_breakdown.scoring_methodology.environmental_weight}`);
  console.log(`  - Proximity Weight: ${details.scoring_breakdown.scoring_methodology.proximity_weight}`);
  
  // CONFIDENCE ANALYSIS
  console.log('\n🎯 CONFIDENCE ANALYSIS');
  console.log('-'.repeat(40));
  console.log(`Overall Confidence: ${details.confidence_analysis.overall_confidence}`);
  console.log(`Fire Detection Confidence: ${details.confidence_analysis.fire_detection_confidence}`);
  console.log(`Vegetation Analysis Confidence: ${details.confidence_analysis.vegetation_analysis_confidence}`);
  
  console.log(`\nConfidence Factors:`);
  details.confidence_analysis.confidence_factors.forEach((factor, index) => {
    console.log(`  ${index + 1}. ${factor}`);
  });
  
  // TECHNICAL METADATA
  console.log('\n⚙️  TECHNICAL METADATA');
  console.log('-'.repeat(40));
  console.log(`Analysis Timestamp: ${details.technical_metadata.analysis_timestamp}`);
  console.log(`Processing Time: ${details.technical_metadata.processing_time_ms}ms`);
  
  console.log(`\nAI Models Used:`);
  Object.entries(details.technical_metadata.ai_models_used).forEach(([key, value]) => {
    console.log(`  - ${key}: ${value}`);
  });
  
  console.log(`\nEmergency Thresholds:`);
  Object.entries(details.technical_metadata.emergency_thresholds).forEach(([key, value]) => {
    console.log(`  - ${key}: ${value}`);
  });
  
  // RECOMMENDATIONS & ACTIONS
  console.log('\n💡 RECOMMENDATIONS');
  console.log('-'.repeat(40));
  if (riskAssessment.recommendations?.length > 0) {
    riskAssessment.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority?.toUpperCase() || 'STANDARD'}] ${rec.action}`);
      console.log(`   Category: ${rec.category}`);
      console.log(`   Timeline: ${rec.timeline}`);
      console.log('');
    });
  }
  
  if (riskAssessment.immediate_actions?.length > 0) {
    console.log('🚨 IMMEDIATE ACTIONS REQUIRED:');
    riskAssessment.immediate_actions.forEach((action, index) => {
      console.log(`${index + 1}. [${action.urgency?.toUpperCase()}] ${action.action}`);
      console.log(`   ${action.description}`);
      console.log('');
    });
  }
}

// Run demonstrations
async function runDemo() {
  console.log('🔥 ENHANCED AI WILDFIRE ANALYSIS DEMONSTRATION');
  console.log('Showing comprehensive analysis details for different scenarios\n');
  
  // Test different scenarios
  await demonstrateEnhancedAnalysis('images/img20.jpeg', 'Healthy Green Landscape');
  await demonstrateEnhancedAnalysis('images/img22.jpeg', 'Dry Golden Grassland');
  await demonstrateEnhancedAnalysis('images/img17.jpeg', 'Active Wildfire Scene');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export { demonstrateEnhancedAnalysis };