#!/usr/bin/env node

/**
 * AI Vegetation Analysis Validation Framework
 * Tests the enhanced wildfire risk assessment system
 */

import { promises as fs } from 'fs';
import { EnhancedSegmentationService } from './server/services/ai/enhancedSegmentationService.js';
import { EnhancedRiskCalculator } from './server/services/ai/enhancedRiskCalculator.js';

const testCases = [
  {
    name: 'img22 - Golden Dry Grassland',
    file: 'images/img22.jpeg',
    expected: {
      minRiskScore: 70,  // Should be high risk
      maxRiskScore: 100,
      expectedFactors: ['golden', 'dry', 'grass'],
      confidenceMin: 0.7
    }
  },
  {
    name: 'img6 - Green Healthy Backyard',
    file: 'images/img6.jpeg',  // Actually green vegetation
    expected: {
      minRiskScore: 0,
      maxRiskScore: 40,   // Should be lower risk
      expectedFactors: ['vegetation'],
      confidenceMin: 0.5
    }
  },
  {
    name: 'img1 - Dry Golden Field',
    file: 'images/img1.jpeg',  // Actually dry grassland
    expected: {
      minRiskScore: 60,  // Should be high risk
      maxRiskScore: 100,
      expectedFactors: ['dry'],
      confidenceMin: 0.6
    }
  }
];

async function runValidationTests() {
  console.log('🧪 AI Vegetation Analysis Validation Framework\n');
  
  const service = new EnhancedSegmentationService();
  const calculator = new EnhancedRiskCalculator();
  
  let passedTests = 0;
  let totalTests = 0;
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log(`📁 File: ${testCase.file}`);
    
    try {
      // Read test image
      const imageBuffer = await fs.readFile(testCase.file);
      
      // Perform enhanced analysis
      const enhancedAnalysis = await service.performEnhancedAnalysis(imageBuffer, process.env.HUGGINGFACE_API_TOKEN || 'dummy');
      
      // Calculate risk assessment
      const riskAssessment = await calculator.calculateEnhancedRisk(enhancedAnalysis);
      
      // Validate results
      totalTests++;
      const results = validateTestCase(testCase, riskAssessment, enhancedAnalysis);
      
      if (results.passed) {
        passedTests++;
        console.log('✅ TEST PASSED');
      } else {
        console.log('❌ TEST FAILED');
      }
      
      console.log(`📊 Results: ${JSON.stringify(results.summary, null, 2)}`);
      
    } catch (error) {
      console.error(`❌ Test failed with error: ${error.message}`);
    }
  }
  
  console.log(`\n🏁 Validation Complete: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED - AI system is working correctly!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed - system needs improvement');
    process.exit(1);
  }
}

function validateTestCase(testCase, riskAssessment, enhancedAnalysis) {
  const results = {
    passed: true,
    summary: {},
    issues: []
  };
  
  // Test risk score range
  const actualScore = riskAssessment.composite_risk_score;
  results.summary.risk_score = actualScore;
  
  if (actualScore < testCase.expected.minRiskScore || actualScore > testCase.expected.maxRiskScore) {
    results.passed = false;
    results.issues.push(`Risk score ${actualScore} not in expected range [${testCase.expected.minRiskScore}, ${testCase.expected.maxRiskScore}]`);
  }
  
  // Test confidence level
  const actualConfidence = riskAssessment.confidence_level;
  results.summary.confidence = actualConfidence;
  
  if (actualConfidence < testCase.expected.confidenceMin) {
    results.passed = false;
    results.issues.push(`Confidence ${actualConfidence} below minimum ${testCase.expected.confidenceMin}`);
  }
  
  // Test expected risk factors
  const riskFactors = riskAssessment.risk_factors?.map(f => f.factor.toLowerCase()).join(' ') || '';
  results.summary.risk_factors = riskAssessment.risk_factors?.length || 0;
  
  for (const expectedFactor of testCase.expected.expectedFactors) {
    if (!riskFactors.includes(expectedFactor.toLowerCase())) {
      results.passed = false;
      results.issues.push(`Expected risk factor '${expectedFactor}' not found`);
    }
  }
  
  // Test color analysis (for img22)
  if (testCase.name.includes('Golden') && enhancedAnalysis.vegetation_analysis?.color_analysis) {
    const colorAnalysis = enhancedAnalysis.vegetation_analysis.color_analysis;
    results.summary.golden_ratio = colorAnalysis.golden_ratio;
    results.summary.dryness_factor = colorAnalysis.dryness_factor;
    
    if (colorAnalysis.dryness_factor < 0.6) {
      results.passed = false;
      results.issues.push(`Dryness factor ${colorAnalysis.dryness_factor} too low for golden grass`);
    }
  }
  
  results.summary.issues = results.issues;
  return results;
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidationTests().catch(console.error);
}

export { runValidationTests, validateTestCase };