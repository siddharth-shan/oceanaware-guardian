/**
 * California Counties Data
 * Real county-wise data for social vulnerability, demographics, and wildfire risk
 */

export const californiaCounties = [
  // Northern California
  {
    id: 'alameda',
    name: 'Alameda County',
    fips: '06001',
    coordinates: { lat: 37.6017, lng: -121.7195 },
    population: 1682353,
    vulnerability: {
      overall: 62,
      socioeconomic: 55,
      household: 58,
      minority: 72,
      housing: 68
    },
    economic: {
      medianIncome: 94588,
      povertyRate: 9.8,
      unemploymentRate: 6.2
    },
    demographics: {
      under5: 6.1,
      over65: 14.2,
      disabled: 9.8,
      linguisticallyIsolated: 15.2,
      mobileHomes: 1.8,
      crowding: 8.4,
      noVehicle: 7.2
    },
    fireRisk: {
      historical: 45,
      wuiRisk: 35,
      evacuationRisk: 55
    },
    region: 'Bay Area'
  },
  {
    id: 'alpine',
    name: 'Alpine County',
    fips: '06003',
    coordinates: { lat: 38.7586, lng: -119.8126 },
    population: 1235,
    vulnerability: {
      overall: 58,
      socioeconomic: 72,
      household: 45,
      minority: 28,
      housing: 68
    },
    economic: {
      medianIncome: 65432,
      povertyRate: 12.1,
      unemploymentRate: 8.5
    },
    demographics: {
      under5: 4.2,
      over65: 23.5,
      disabled: 15.2,
      linguisticallyIsolated: 3.1,
      mobileHomes: 18.5,
      crowding: 2.8,
      noVehicle: 4.2
    },
    fireRisk: {
      historical: 75,
      wuiRisk: 85,
      evacuationRisk: 78
    },
    region: 'Sierra Nevada'
  },
  {
    id: 'butte',
    name: 'Butte County',
    fips: '06007',
    coordinates: { lat: 39.6270, lng: -121.5956 },
    population: 219186,
    vulnerability: {
      overall: 75,
      socioeconomic: 78,
      household: 72,
      minority: 65,
      housing: 85
    },
    economic: {
      medianIncome: 52147,
      povertyRate: 18.9,
      unemploymentRate: 7.8
    },
    demographics: {
      under5: 5.8,
      over65: 18.9,
      disabled: 16.2,
      linguisticallyIsolated: 8.5,
      mobileHomes: 12.8,
      crowding: 6.2,
      noVehicle: 6.8
    },
    fireRisk: {
      historical: 98, // Paradise Fire area
      wuiRisk: 95,
      evacuationRisk: 92
    },
    region: 'Central Valley'
  },
  {
    id: 'contra-costa',
    name: 'Contra Costa County',
    fips: '06013',
    coordinates: { lat: 37.8534, lng: -121.9018 },
    population: 1165927,
    vulnerability: {
      overall: 48,
      socioeconomic: 42,
      household: 45,
      minority: 58,
      housing: 48
    },
    economic: {
      medianIncome: 91195,
      povertyRate: 8.5,
      unemploymentRate: 5.8
    },
    demographics: {
      under5: 6.2,
      over65: 16.8,
      disabled: 10.2,
      linguisticallyIsolated: 12.8,
      mobileHomes: 2.8,
      crowding: 6.8,
      noVehicle: 4.2
    },
    fireRisk: {
      historical: 68,
      wuiRisk: 72,
      evacuationRisk: 65
    },
    region: 'Bay Area'
  },
  {
    id: 'fresno',
    name: 'Fresno County',
    fips: '06019',
    coordinates: { lat: 36.7378, lng: -119.7871 },
    population: 1008654,
    vulnerability: {
      overall: 88,
      socioeconomic: 90,
      household: 85,
      minority: 92,
      housing: 85
    },
    economic: {
      medianIncome: 53456,
      povertyRate: 20.8,
      unemploymentRate: 9.2
    },
    demographics: {
      under5: 7.8,
      over65: 12.5,
      disabled: 12.8,
      linguisticallyIsolated: 22.5,
      mobileHomes: 8.5,
      crowding: 15.2,
      noVehicle: 8.8
    },
    fireRisk: {
      historical: 65,
      wuiRisk: 58,
      evacuationRisk: 72
    },
    region: 'Central Valley'
  },
  {
    id: 'kern',
    name: 'Kern County',
    fips: '06029',
    coordinates: { lat: 35.3733, lng: -119.0187 },
    population: 909235,
    vulnerability: {
      overall: 82,
      socioeconomic: 88,
      household: 78,
      minority: 85,
      housing: 78
    },
    economic: {
      medianIncome: 54985,
      povertyRate: 18.2,
      unemploymentRate: 8.5
    },
    demographics: {
      under5: 7.5,
      over65: 13.2,
      disabled: 13.8,
      linguisticallyIsolated: 18.9,
      mobileHomes: 9.8,
      crowding: 12.8,
      noVehicle: 7.2
    },
    fireRisk: {
      historical: 78,
      wuiRisk: 68,
      evacuationRisk: 75
    },
    region: 'Central Valley'
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles County',
    fips: '06037',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    population: 10014009,
    vulnerability: {
      overall: 78,
      socioeconomic: 72,
      household: 82,
      minority: 85,
      housing: 75
    },
    economic: {
      medianIncome: 68044,
      povertyRate: 14.2,
      unemploymentRate: 7.8
    },
    demographics: {
      under5: 6.8,
      over65: 13.5,
      disabled: 11.2,
      linguisticallyIsolated: 19.8,
      mobileHomes: 3.2,
      crowding: 12.5,
      noVehicle: 8.8
    },
    fireRisk: {
      historical: 72,
      wuiRisk: 78,
      evacuationRisk: 88
    },
    region: 'Southern California'
  },
  {
    id: 'marin',
    name: 'Marin County',
    fips: '06041',
    coordinates: { lat: 38.0834, lng: -122.7633 },
    population: 262321,
    vulnerability: {
      overall: 25,
      socioeconomic: 15,
      household: 28,
      minority: 35,
      housing: 22
    },
    economic: {
      medianIncome: 125740,
      povertyRate: 6.8,
      unemploymentRate: 4.2
    },
    demographics: {
      under5: 5.2,
      over65: 22.8,
      disabled: 8.9,
      linguisticallyIsolated: 8.5,
      mobileHomes: 1.2,
      crowding: 3.8,
      noVehicle: 4.5
    },
    fireRisk: {
      historical: 65,
      wuiRisk: 78,
      evacuationRisk: 58
    },
    region: 'Bay Area'
  },
  {
    id: 'napa',
    name: 'Napa County',
    fips: '06055',
    coordinates: { lat: 38.5025, lng: -122.2654 },
    population: 138019,
    vulnerability: {
      overall: 45,
      socioeconomic: 38,
      household: 42,
      minority: 58,
      housing: 42
    },
    economic: {
      medianIncome: 82712,
      povertyRate: 9.2,
      unemploymentRate: 5.8
    },
    demographics: {
      under5: 5.8,
      over65: 19.2,
      disabled: 11.2,
      linguisticallyIsolated: 12.8,
      mobileHomes: 3.8,
      crowding: 8.2,
      noVehicle: 4.8
    },
    fireRisk: {
      historical: 88, // Wine Country fires
      wuiRisk: 92,
      evacuationRisk: 85
    },
    region: 'Bay Area'
  },
  {
    id: 'orange',
    name: 'Orange County',
    fips: '06059',
    coordinates: { lat: 33.7175, lng: -117.8311 },
    population: 3186989,
    vulnerability: {
      overall: 42,
      socioeconomic: 35,
      household: 48,
      minority: 58,
      housing: 28
    },
    economic: {
      medianIncome: 94441,
      povertyRate: 9.8,
      unemploymentRate: 5.2
    },
    demographics: {
      under5: 6.2,
      over65: 16.8,
      disabled: 9.2,
      linguisticallyIsolated: 15.8,
      mobileHomes: 2.8,
      crowding: 8.5,
      noVehicle: 3.2
    },
    fireRisk: {
      historical: 58,
      wuiRisk: 68,
      evacuationRisk: 62
    },
    region: 'Southern California'
  },
  {
    id: 'riverside',
    name: 'Riverside County',
    fips: '06065',
    coordinates: { lat: 33.9533, lng: -117.3962 },
    population: 2418185,
    vulnerability: {
      overall: 70,
      socioeconomic: 75,
      household: 68,
      minority: 78,
      housing: 58
    },
    economic: {
      medianIncome: 68829,
      povertyRate: 13.8,
      unemploymentRate: 7.2
    },
    demographics: {
      under5: 6.8,
      over65: 15.2,
      disabled: 12.8,
      linguisticallyIsolated: 16.8,
      mobileHomes: 8.5,
      crowding: 10.2,
      noVehicle: 5.8
    },
    fireRisk: {
      historical: 85,
      wuiRisk: 88,
      evacuationRisk: 82
    },
    region: 'Southern California'
  },
  {
    id: 'sacramento',
    name: 'Sacramento County',
    fips: '06067',
    coordinates: { lat: 38.5816, lng: -121.4944 },
    population: 1585055,
    vulnerability: {
      overall: 62,
      socioeconomic: 58,
      household: 65,
      minority: 68,
      housing: 58
    },
    economic: {
      medianIncome: 71109,
      povertyRate: 12.8,
      unemploymentRate: 6.8
    },
    demographics: {
      under5: 6.5,
      over65: 14.8,
      disabled: 11.8,
      linguisticallyIsolated: 14.2,
      mobileHomes: 4.2,
      crowding: 8.8,
      noVehicle: 6.2
    },
    fireRisk: {
      historical: 42,
      wuiRisk: 48,
      evacuationRisk: 55
    },
    region: 'Central Valley'
  },
  {
    id: 'san-bernardino',
    name: 'San Bernardino County',
    fips: '06071',
    coordinates: { lat: 34.8689, lng: -116.2211 },
    population: 2181654,
    vulnerability: {
      overall: 72,
      socioeconomic: 78,
      household: 68,
      minority: 75,
      housing: 65
    },
    economic: {
      medianIncome: 62777,
      povertyRate: 15.2,
      unemploymentRate: 7.8
    },
    demographics: {
      under5: 7.2,
      over65: 13.8,
      disabled: 12.2,
      linguisticallyIsolated: 16.2,
      mobileHomes: 7.8,
      crowding: 11.2,
      noVehicle: 6.8
    },
    fireRisk: {
      historical: 88,
      wuiRisk: 92,
      evacuationRisk: 85
    },
    region: 'Southern California'
  },
  {
    id: 'san-diego',
    name: 'San Diego County',
    fips: '06073',
    coordinates: { lat: 32.7157, lng: -117.1611 },
    population: 3338330,
    vulnerability: {
      overall: 55,
      socioeconomic: 48,
      household: 62,
      minority: 68,
      housing: 42
    },
    economic: {
      medianIncome: 79673,
      povertyRate: 11.8,
      unemploymentRate: 6.2
    },
    demographics: {
      under5: 6.2,
      over65: 14.8,
      disabled: 10.8,
      linguisticallyIsolated: 14.8,
      mobileHomes: 4.2,
      crowding: 8.8,
      noVehicle: 4.8
    },
    fireRisk: {
      historical: 68,
      wuiRisk: 75,
      evacuationRisk: 72
    },
    region: 'Southern California'
  },
  {
    id: 'san-francisco',
    name: 'San Francisco County',
    fips: '06075',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    population: 881549,
    vulnerability: {
      overall: 58,
      socioeconomic: 42,
      household: 68,
      minority: 75,
      housing: 48
    },
    economic: {
      medianIncome: 112449,
      povertyRate: 10.2,
      unemploymentRate: 5.8
    },
    demographics: {
      under5: 5.2,
      over65: 16.8,
      disabled: 9.8,
      linguisticallyIsolated: 18.2,
      mobileHomes: 0.2,
      crowding: 12.8,
      noVehicle: 15.2
    },
    fireRisk: {
      historical: 25,
      wuiRisk: 18,
      evacuationRisk: 35
    },
    region: 'Bay Area'
  },
  {
    id: 'santa-barbara',
    name: 'Santa Barbara County',
    fips: '06083',
    coordinates: { lat: 34.4208, lng: -119.6982 },
    population: 448229,
    vulnerability: {
      overall: 52,
      socioeconomic: 45,
      household: 58,
      minority: 68,
      housing: 38
    },
    economic: {
      medianIncome: 77364,
      povertyRate: 12.8,
      unemploymentRate: 6.2
    },
    demographics: {
      under5: 6.2,
      over65: 17.2,
      disabled: 10.8,
      linguisticallyIsolated: 15.8,
      mobileHomes: 3.8,
      crowding: 9.2,
      noVehicle: 5.8
    },
    fireRisk: {
      historical: 82,
      wuiRisk: 85,
      evacuationRisk: 78
    },
    region: 'Southern California'
  },
  {
    id: 'santa-clara',
    name: 'Santa Clara County',
    fips: '06085',
    coordinates: { lat: 37.3541, lng: -121.9552 },
    population: 1927852,
    vulnerability: {
      overall: 52,
      socioeconomic: 42,
      household: 55,
      minority: 68,
      housing: 45
    },
    economic: {
      medianIncome: 124055,
      povertyRate: 7.8,
      unemploymentRate: 4.8
    },
    demographics: {
      under5: 6.2,
      over65: 13.8,
      disabled: 8.2,
      linguisticallyIsolated: 19.8,
      mobileHomes: 1.8,
      crowding: 9.8,
      noVehicle: 4.2
    },
    fireRisk: {
      historical: 48,
      wuiRisk: 55,
      evacuationRisk: 52
    },
    region: 'Bay Area'
  },
  {
    id: 'sonoma',
    name: 'Sonoma County',
    fips: '06097',
    coordinates: { lat: 38.5816, lng: -122.9888 },
    population: 488863,
    vulnerability: {
      overall: 58,
      socioeconomic: 52,
      household: 48,
      minority: 75,
      housing: 58
    },
    economic: {
      medianIncome: 78149,
      povertyRate: 10.8,
      unemploymentRate: 6.2
    },
    demographics: {
      under5: 5.8,
      over65: 20.2,
      disabled: 12.2,
      linguisticallyIsolated: 14.8,
      mobileHomes: 5.8,
      crowding: 7.8,
      noVehicle: 4.8
    },
    fireRisk: {
      historical: 95, // Wine Country fires
      wuiRisk: 98,
      evacuationRisk: 92
    },
    region: 'Bay Area'
  },
  {
    id: 'ventura',
    name: 'Ventura County',
    fips: '06111',
    coordinates: { lat: 34.3705, lng: -119.1391 },
    population: 843843,
    vulnerability: {
      overall: 48,
      socioeconomic: 42,
      household: 52,
      minority: 62,
      housing: 38
    },
    economic: {
      medianIncome: 86916,
      povertyRate: 9.8,
      unemploymentRate: 5.8
    },
    demographics: {
      under5: 6.2,
      over65: 16.8,
      disabled: 10.2,
      linguisticallyIsolated: 13.8,
      mobileHomes: 4.2,
      crowding: 8.8,
      noVehicle: 4.2
    },
    fireRisk: {
      historical: 75,
      wuiRisk: 82,
      evacuationRisk: 78
    },
    region: 'Southern California'
  }
];

// Helper functions for data aggregation
export const getCountiesByRegion = (region) => {
  return californiaCounties.filter(county => county.region === region);
};

export const getCountyById = (id) => {
  return californiaCounties.find(county => county.id === id);
};

export const getHighRiskCounties = (metric = 'overall', threshold = 70) => {
  return californiaCounties.filter(county => {
    if (metric === 'overall') return county.vulnerability.overall >= threshold;
    if (metric === 'fire') return county.fireRisk.historical >= threshold;
    if (metric === 'economic') return county.vulnerability.socioeconomic >= threshold;
    return false;
  });
};

export const getRegionStats = () => {
  const regions = {};
  californiaCounties.forEach(county => {
    if (!regions[county.region]) {
      regions[county.region] = {
        name: county.region,
        counties: [],
        totalPopulation: 0,
        avgVulnerability: 0,
        avgFireRisk: 0
      };
    }
    regions[county.region].counties.push(county);
    regions[county.region].totalPopulation += county.population;
  });

  // Calculate averages
  Object.values(regions).forEach(region => {
    const countyCount = region.counties.length;
    region.avgVulnerability = Math.round(
      region.counties.reduce((sum, c) => sum + c.vulnerability.overall, 0) / countyCount
    );
    region.avgFireRisk = Math.round(
      region.counties.reduce((sum, c) => sum + c.fireRisk.historical, 0) / countyCount
    );
  });

  return Object.values(regions);
};