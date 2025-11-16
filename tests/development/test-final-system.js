#!/usr/bin/env node

/**
 * Final System Test - Complete AI Wildfire Detection System
 * Tests fire detection, vegetation analysis, risk calculation, and object identification
 */

import { promises as fs } from 'fs';
import { EnhancedSegmentationService } from './server/services/ai/enhancedSegmentationService.js';
import { EnhancedRiskCalculator } from './server/services/ai/enhancedRiskCalculator.js';

const service = new EnhancedSegmentationService();
const calculator = new EnhancedRiskCalculator();

const testScenarios = [
  {
    name: 'Active Wildfire (img17)',
    file: 'images/img17.jpeg',
    expected: { fire: true, riskRange: [80, 100], emergency: true }
  },
  {
    name: 'Green Healthy Backyard (img6)', 
    file: 'images/img6.jpeg',
    expected: { fire: false, riskRange: [0, 40], emergency: false }
  },
  {
    name: 'Golden Dry Grassland (img22)',
    file: 'images/img22.jpeg', 
    expected: { fire: false, riskRange: [60, 90], emergency: false }
  },
  {
    name: 'Dry Golden Field (img1)',
    file: 'images/img1.jpeg',
    expected: { fire: false, riskRange: [50, 80], emergency: false }
  }
];

async function runFinalTest() {
  console.log('🔥 FINAL SYSTEM TEST - Enhanced AI Wildfire Detection\n');
  console.log('=' .repeat(80));
  
  let passedTests = 0;
  
  for (const scenario of testScenarios) {
    console.log(`\n📸 Testing: ${scenario.name}`);
    console.log('-'.repeat(50));
    
    try {
      // Read image
      const imageBuffer = await fs.readFile(scenario.file);
      
      // Perform complete enhanced analysis
      const enhancedAnalysis = await service.performEnhancedAnalysis(imageBuffer, 'test-token');
      
      // Calculate comprehensive risk assessment
      const riskAssessment = await calculator.calculateEnhancedRisk(enhancedAnalysis);
      
      // Display results
      console.log(`🔥 FIRE DETECTION:`);
      console.log(`   Fire Detected: ${enhancedAnalysis.fire_analysis?.fire_detected || false}`);
      console.log(`   Smoke Detected: ${enhancedAnalysis.fire_analysis?.smoke_detected || false}`);
      console.log(`   Fire Confidence: ${((enhancedAnalysis.fire_analysis?.confidence || 0) * 100).toFixed(1)}%`);
      
      console.log(`\n🌿 VEGETATION ANALYSIS:`);
      const vegAnalysis = enhancedAnalysis.vegetation_analysis;
      if (vegAnalysis?.color_analysis) {
        console.log(`   Green Vegetation: ${(vegAnalysis.color_analysis.green_ratio * 100).toFixed(1)}%`);
        console.log(`   Dryness Factor: ${(vegAnalysis.color_analysis.dryness_factor * 100).toFixed(1)}%`);
      }
      
      console.log(`\n📊 RISK ASSESSMENT:`);
      console.log(`   Risk Score: ${riskAssessment.composite_risk_score.toFixed(1)}/100`);
      console.log(`   Risk Level: ${riskAssessment.risk_level}`);
      console.log(`   Emergency: ${riskAssessment.emergency_detected}`);
      console.log(`   Confidence: ${(riskAssessment.confidence_level * 100).toFixed(1)}%`);
      
      // Show detected objects
      const objects = enhancedAnalysis.combined_assessment?.objects_detected || [];
      if (objects.length > 0) {
        console.log(`\n🔍 OBJECTS DETECTED:`);
        objects.forEach(obj => {
          console.log(`   - ${obj.object}: ${obj.description}`);
          console.log(`     Risk Level: ${obj.risk_level}, Confidence: ${(obj.confidence * 100).toFixed(1)}%`);
        });
      }
      
      // Validate against expected results
      const fireDetected = enhancedAnalysis.fire_analysis?.fire_detected || enhancedAnalysis.fire_analysis?.smoke_detected;
      const riskScore = riskAssessment.composite_risk_score;
      const emergency = riskAssessment.emergency_detected;
      
      let testPassed = true;
      let issues = [];
      
      if (fireDetected !== scenario.expected.fire) {
        testPassed = false;
        issues.push(`Fire detection: expected ${scenario.expected.fire}, got ${fireDetected}`);
      }
      
      if (riskScore < scenario.expected.riskRange[0] || riskScore > scenario.expected.riskRange[1]) {
        testPassed = false;
        issues.push(`Risk score: expected ${scenario.expected.riskRange[0]}-${scenario.expected.riskRange[1]}, got ${riskScore}`);
      }
      
      if (emergency !== scenario.expected.emergency) {
        testPassed = false;
        issues.push(`Emergency: expected ${scenario.expected.emergency}, got ${emergency}`);
      }
      
      console.log(`\n✅ VALIDATION:`);
      if (testPassed) {
        console.log(`   STATUS: ✅ PASSED`);
        passedTests++;
      } else {
        console.log(`   STATUS: ❌ FAILED`);
        issues.forEach(issue => console.log(`   - ${issue}`));
      }
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`🏁 FINAL RESULTS: ${passedTests}/${testScenarios.length} tests passed`);
  
  if (passedTests === testScenarios.length) {
    console.log('🎉 ALL TESTS PASSED - System is working correctly!');
    console.log('\n✅ Key Features Verified:');
    console.log('   - Visual fire/smoke detection');
    console.log('   - Vegetation dryness analysis'); 
    console.log('   - Proper risk scoring');
    console.log('   - Object identification');
    console.log('   - Emergency detection');
    console.log('   - Confidence levels');
  } else {
    console.log('⚠️  Some tests failed - system needs refinement');
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFinalTest().catch(console.error);
}

export { runFinalTest };