import express from 'express';
import AirQualityService from '../services/airQuality/airQualityService.js';

const router = express.Router();

/**
 * Enhanced Air Quality Routes with EPA AQS Integration
 * Provides comprehensive air quality data from multiple sources
 */

/**
 * GET /api/air-quality
 * Get comprehensive air quality data for location
 * Query params: lat, lng, zipCode (optional)
 */
router.get('/', async (req, res) => {
  try {
    const { lat, lng, zipCode } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
        usage: 'GET /api/air-quality?lat=34.0522&lng=-118.2437&zipCode=90210'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude or longitude values'
      });
    }

    console.log(`Fetching air quality data for: ${latitude}, ${longitude}${zipCode ? ` (ZIP: ${zipCode})` : ''}`);

    const airQualityData = await AirQualityService.getAirQualityData(latitude, longitude, zipCode);

    if (!airQualityData) {
      return res.status(503).json({
        success: false,
        error: 'Air quality data unavailable',
        message: 'All air quality services are currently unavailable'
      });
    }

    res.json({
      success: true,
      data: airQualityData,
      metadata: {
        location: { latitude, longitude, zipCode },
        timestamp: new Date().toISOString(),
        sources: airQualityData.dataSources,
        epaDataAvailable: !!airQualityData.epaDetails
      }
    });

  } catch (error) {
    console.error('Air quality API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
    });
  }
});

/**
 * GET /api/air-quality/epa/sites
 * Get EPA AQS monitoring sites for a county
 * Query params: state, county
 */
router.get('/epa/sites', async (req, res) => {
  try {
    const { state = '06', county = '037' } = req.query; // Default to CA, LA County

    // Create a temporary service instance to access EPA methods
    const airQualityService = new AirQualityService.constructor();
    
    if (!airQualityService.apiKeys.epa || !airQualityService.apiEmail) {
      return res.status(503).json({
        success: false,
        error: 'EPA AQS API not configured',
        message: 'EPA_AQS_API_KEY and EPA_AQS_API_EMAIL environment variables required'
      });
    }

    console.log(`Fetching EPA sites for state ${state}, county ${county}`);

    // Fetch sites from EPA API
    const response = await fetch(
      `${airQualityService.baseUrls.epa}/list/sitesByCounty?email=${airQualityService.apiEmail}&key=${airQualityService.apiKeys.epa}&state=${state}&county=${county}`
    );

    if (!response.ok) {
      throw new Error(`EPA API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.Data || data.Data.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No EPA monitoring sites found for this county'
      });
    }

    // Process and format site data
    const sites = data.Data.map(site => ({
      id: `${site.state_code}-${site.county_code}-${site.site_number}`,
      name: site.local_site_name,
      city: site.city_name,
      county: site.county_name,
      state_code: site.state_code,
      county_code: site.county_code,
      site_number: site.site_number,
      latitude: parseFloat(site.latitude),
      longitude: parseFloat(site.longitude),
      address: site.address || 'Address not available',
      cbsa: site.cbsa_name,
      last_change: site.date_of_last_change
    }));

    res.json({
      success: true,
      data: sites,
      metadata: {
        count: sites.length,
        state,
        county,
        source: 'EPA AQS',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('EPA sites API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch EPA monitoring sites',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
    });
  }
});

/**
 * GET /api/air-quality/epa/data/:siteId
 * Get recent pollutant data for specific EPA monitoring site
 * Params: siteId (format: state-county-site)
 * Query params: pollutant, days (default: 7)
 */
router.get('/epa/data/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { pollutant = 'pm25', days = 7 } = req.query;

    // Parse site ID
    const [stateCode, countyCode, siteNumber] = siteId.split('-');
    
    if (!stateCode || !countyCode || !siteNumber) {
      return res.status(400).json({
        success: false,
        error: 'Invalid site ID format',
        usage: 'Site ID should be in format: state-county-site (e.g., 06-037-0016)'
      });
    }

    const airQualityService = new AirQualityService.constructor();
    
    if (!airQualityService.apiKeys.epa || !airQualityService.apiEmail) {
      return res.status(503).json({
        success: false,
        error: 'EPA AQS API not configured'
      });
    }

    console.log(`Fetching EPA ${pollutant} data for site ${siteId}`);

    const currentDate = new Date();
    const startDate = new Date(currentDate.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);

    const pollutantData = await airQualityService.getEPAPollutantData(
      pollutant, 
      stateCode, 
      countyCode, 
      siteNumber, 
      startDate, 
      currentDate
    );

    if (!pollutantData) {
      return res.json({
        success: true,
        data: null,
        message: `No recent ${pollutant} data available for this site`
      });
    }

    res.json({
      success: true,
      data: pollutantData,
      metadata: {
        siteId,
        pollutant,
        dayRange: parseInt(days),
        source: 'EPA AQS',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('EPA site data API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch EPA site data',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
    });
  }
});

/**
 * GET /api/air-quality/status
 * Get status of all air quality data sources
 */
router.get('/status', async (req, res) => {
  try {
    const airQualityService = new AirQualityService.constructor();
    
    const status = {
      sources: {
        epa_aqs: {
          available: !!(airQualityService.apiKeys.epa && airQualityService.apiEmail),
          api_key: !!airQualityService.apiKeys.epa,
          email: !!airQualityService.apiEmail,
          description: 'EPA Air Quality System - Official government data'
        },
        airnow: {
          available: !!airQualityService.apiKeys.airnow,
          api_key: !!airQualityService.apiKeys.airnow,
          description: 'AirNow - Real-time air quality index'
        },
        openweather: {
          available: !!airQualityService.apiKeys.openweather,
          api_key: !!airQualityService.apiKeys.openweather,
          description: 'OpenWeatherMap - Global air pollution data'
        }
      },
      timestamp: new Date().toISOString()
    };

    const availableCount = Object.values(status.sources).filter(s => s.available).length;
    
    res.json({
      success: true,
      data: status,
      summary: {
        total_sources: Object.keys(status.sources).length,
        available_sources: availableCount,
        coverage: `${availableCount}/3 sources configured`
      }
    });

  } catch (error) {
    console.error('Air quality status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get status'
    });
  }
});

export default router;