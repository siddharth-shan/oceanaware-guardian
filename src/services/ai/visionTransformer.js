export class VegetationAnalyzer {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.huggingFaceUrl = 'https://api-inference.huggingface.co/models';
    this.models = {
      vegetation: 'google/vit-base-patch16-224',
      hazard: 'microsoft/resnet-50'
    };
  }

  async analyzeImage(imageFile) {
    try {
      const vegetationResults = await this.classifyVegetation(imageFile);
      const hazardResults = await this.detectHazards(imageFile);
      
      return this.processResults(vegetationResults, hazardResults);
    } catch (error) {
      console.error('AI Analysis error:', error);
      throw new Error('Failed to analyze image');
    }
  }

  async classifyVegetation(imageFile) {
    const response = await fetch(`${this.huggingFaceUrl}/${this.models.vegetation}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageFile
    });

    if (!response.ok) {
      throw new Error(`Vegetation classification failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async detectHazards(imageFile) {
    const response = await fetch(`${this.huggingFaceUrl}/${this.models.hazard}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageFile
    });

    return await response.json();
  }

  processResults(vegetationResults, hazardResults) {
    const hazards = this.identifyFireHazards(vegetationResults, hazardResults);
    const riskScore = this.calculateRiskScore(hazards);
    const recommendations = this.generateRecommendations(hazards);
    
    return {
      hazards,
      riskScore,
      overallRisk: this.categorizeRisk(riskScore),
      recommendations,
      confidence: this.calculateConfidence(vegetationResults, hazardResults),
      analysisDetails: {
        vegetationTypes: this.extractVegetationTypes(vegetationResults),
        structures: this.identifyStructures(hazardResults),
        weatherFactors: this.assessWeatherVulnerability(hazards)
      }
    };
  }

  identifyFireHazards(vegetationResults, hazardResults) {
    const hazards = [];
    
    vegetationResults.forEach(result => {
      const hazard = this.mapVegetationToHazard(result);
      if (hazard) hazards.push(hazard);
    });
    
    hazardResults.forEach(result => {
      const hazard = this.mapObjectToHazard(result);
      if (hazard) hazards.push(hazard);
    });
    
    return hazards;
  }

  mapVegetationToHazard(classification) {
    const hazardMap = {
      'acorn': { type: 'Oak Trees', severity: 'Medium', description: 'Oak trees with potential fire risk' },
      'cliff': { type: 'Rocky Terrain', severity: 'Low', description: 'Natural fire break area' },
      'valley': { type: 'Valley Vegetation', severity: 'Medium', description: 'Valley areas with vegetation' },
      'lakeside': { type: 'Dry Vegetation', severity: 'High', description: 'Potential dry lakeside vegetation' },
      'forest': { type: 'Dense Forest', severity: 'High', description: 'Dense forest with high fire risk' },
      'tree': { type: 'Tree Coverage', severity: 'Medium', description: 'Tree coverage requiring assessment' }
    };

    const label = classification.label.toLowerCase();
    for (const [key, hazard] of Object.entries(hazardMap)) {
      if (label.includes(key)) {
        return {
          ...hazard,
          confidence: classification.score,
          location: 'Detected in image analysis',
          detectedAs: classification.label
        };
      }
    }
    return null;
  }

  mapObjectToHazard(detection) {
    const structureHazards = {
      'fence': { type: 'Flammable Fencing', severity: 'Low', description: 'Wooden fencing that could spread fire' },
      'building': { type: 'Structure Risk', severity: 'Medium', description: 'Building with potential fire exposure' },
      'deck': { type: 'Wooden Deck', severity: 'Medium', description: 'Elevated wooden structure fire risk' }
    };

    const label = detection.label.toLowerCase();
    for (const [key, hazard] of Object.entries(structureHazards)) {
      if (label.includes(key)) {
        return {
          ...hazard,
          confidence: detection.score,
          location: `Detected in analysis`
        };
      }
    }
    return null;
  }

  calculateRiskScore(hazards) {
    return hazards.reduce((total, hazard) => {
      const severityWeight = { 'High': 30, 'Medium': 20, 'Low': 10 };
      const confidenceMultiplier = hazard.confidence || 0.8;
      return total + (severityWeight[hazard.severity] * confidenceMultiplier);
    }, 0);
  }

  categorizeRisk(score) {
    if (score >= 80) return 'Extreme';
    if (score >= 60) return 'High';
    if (score >= 30) return 'Medium';
    return 'Low';
  }

  generateRecommendations(hazards) {
    const recommendations = new Set();
    
    hazards.forEach(hazard => {
      switch (hazard.type) {
        case 'Dense Forest':
          recommendations.add('Create fuel breaks through dense forest areas');
          recommendations.add('Remove lower tree branches to prevent fire laddering');
          break;
        case 'Oak Trees':
          recommendations.add('Clear oak leaves and debris regularly');
          recommendations.add('Maintain adequate spacing between oak trees');
          break;
        case 'Dry Vegetation':
          recommendations.add('Install irrigation systems for vegetation management');
          recommendations.add('Replace highly flammable plants with fire-resistant species');
          break;
        case 'Tree Coverage':
          recommendations.add('Prune trees to create vertical spacing');
          recommendations.add('Remove dead branches and limbs promptly');
          break;
      }
    });
    
    recommendations.add('Maintain defensible space of 30+ feet around structures');
    recommendations.add('Remove dead and dying vegetation regularly');
    recommendations.add('Install fire-resistant landscaping plants');
    
    return Array.from(recommendations);
  }

  calculateConfidence(vegetationResults, hazardResults) {
    const allScores = [
      ...vegetationResults.map(r => r.score),
      ...hazardResults.map(r => r.score)
    ];
    
    if (allScores.length === 0) return 0.5;
    
    return allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
  }

  extractVegetationTypes(results) {
    return results.slice(0, 3).map(r => ({
      type: r.label,
      confidence: Math.round(r.score * 100)
    }));
  }

  identifyStructures(results) {
    return results.filter(r => 
      ['building', 'house', 'fence', 'deck'].some(structure => 
        r.label.toLowerCase().includes(structure)
      )
    ).map(r => ({
      type: r.label,
      confidence: Math.round(r.score * 100)
    }));
  }

  assessWeatherVulnerability(hazards) {
    const vulnerabilityFactors = [];
    
    if (hazards.some(h => h.type.includes('Dry'))) {
      vulnerabilityFactors.push('High sensitivity to wind conditions');
    }
    
    if (hazards.some(h => h.type.includes('Forest'))) {
      vulnerabilityFactors.push('Susceptible to crown fires in dry conditions');
    }
    
    if (hazards.some(h => h.type.includes('Tree'))) {
      vulnerabilityFactors.push('Fire ladder potential during drought');
    }
    
    return vulnerabilityFactors;
  }
}