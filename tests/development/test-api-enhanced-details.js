#!/usr/bin/env node

/**
 * Test Enhanced API Details Integration
 * Verifies that detailed analysis is properly returned by the API
 */

import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

async function testAPIEnhancedDetails() {
  console.log('🧪 Testing Enhanced API Details Integration\n');

  try {
    // Start server check
    console.log('🌐 Testing API endpoint...');
    
    const healthResponse = await fetch('http://localhost:3000/api/ai-analysis/health');
    if (!healthResponse.ok) {
      console.log('⚠️  Server not running. Start with: npm run dev');
      return;
    }
    
    console.log('✅ Server is running');
    
    // Test with a sample image
    const imagePath = 'images/img22.jpeg'; // Golden dry grassland
    console.log(`📸 Testing with: ${imagePath}`);
    
    const imageBuffer = await fs.readFile(imagePath);
    
    const formData = new FormData();
    formData.append('image', imageBuffer, { filename: 'test.jpeg' });
    
    const response = await fetch('http://localhost:3000/api/ai-analysis/analyze', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      return;
    }
    
    const result = await response.json();
    
    console.log('\n📊 API Response Analysis:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📈 Risk Score: ${result.analysis?.riskScore}/100`);
    console.log(`🎯 Confidence: ${Math.round((result.analysis?.confidence || 0) * 100)}%`);
    
    // Check for detailed analysis
    if (result.analysis?.detailedAnalysis) {
      console.log('\n🔍 DETAILED ANALYSIS FOUND:');
      
      const detailed = result.analysis.detailedAnalysis;
      
      // Fire/Smoke Detection
      if (detailed.fire_smoke_detection) {
        console.log(`🔥 Fire Detection: ${detailed.fire_smoke_detection.fire_detected ? 'YES' : 'No'}`);
        console.log(`💨 Smoke Detection: ${detailed.fire_smoke_detection.smoke_detected ? 'YES' : 'No'}`);
        console.log(`🎯 Detection Confidence: ${detailed.fire_smoke_detection.detection_confidence}`);
      }
      
      // Vegetation Analysis
      if (detailed.vegetation_analysis) {
        console.log(`🌿 Vegetation Analysis: ${detailed.vegetation_analysis.analysis_success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`📊 Vegetation Coverage: ${detailed.vegetation_analysis.vegetation_coverage}`);
        
        if (detailed.vegetation_analysis.fuel_assessment) {
          console.log(`⛽ Fuel Load: ${detailed.vegetation_analysis.fuel_assessment.fuel_load_score}`);
          console.log(`🔥 Dryness Factor: ${detailed.vegetation_analysis.fuel_assessment.dryness_factor}`);
        }
      }
      
      // Color Analysis
      if (detailed.color_analysis) {
        console.log(`🟢 Green Vegetation: ${detailed.color_analysis.green_vegetation}`);
        console.log(`🟡 Golden Vegetation: ${detailed.color_analysis.golden_vegetation}`);
        console.log(`🟤 Overall Dryness: ${detailed.color_analysis.overall_dryness}`);
      }
      
      // Objects Detected
      if (detailed.objects_detected && detailed.objects_detected.length > 0) {
        console.log(`🔍 Objects Detected: ${detailed.objects_detected.length} items`);
        detailed.objects_detected.forEach((obj, i) => {
          console.log(`  ${i+1}. ${obj.object} [${obj.risk_level} RISK] - ${obj.description}`);
        });
      }
      
      // Scoring Breakdown
      if (detailed.scoring_breakdown) {
        console.log(`📈 Fire Risk Score: ${detailed.scoring_breakdown.fire_risk_score}/100`);
        console.log(`🌿 Vegetation Risk Score: ${detailed.scoring_breakdown.vegetation_risk_score}/100`);
        console.log(`🌍 Environmental Risk Score: ${detailed.scoring_breakdown.environmental_risk_score}/100`);
        console.log(`🎯 Final Composite Score: ${detailed.scoring_breakdown.final_composite_score}/100`);
      }
      
      // Technical Metadata
      if (detailed.technical_metadata) {
        console.log(`⚙️  Processing Time: ${detailed.technical_metadata.processing_time_ms}ms`);
        if (detailed.technical_metadata.ai_models_used) {
          console.log(`🤖 AI Models Used:`);
          Object.entries(detailed.technical_metadata.ai_models_used).forEach(([key, value]) => {
            console.log(`    ${key}: ${value}`);
          });
        }
      }
      
      console.log('\n🎉 SUCCESS: Enhanced detailed analysis is working correctly!');
      console.log('✅ The frontend will now display comprehensive analysis details.');
      
    } else {
      console.log('\n❌ ISSUE: No detailed analysis found in API response');
      console.log('🔍 Available analysis keys:', Object.keys(result.analysis || {}));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPIEnhancedDetails().catch(console.error);
}

export { testAPIEnhancedDetails };