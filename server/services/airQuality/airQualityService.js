import fetch from 'node-fetch';

/**
 * Enhanced Air Quality Service
 * Integrates multiple data sources for accurate wildfire smoke and air quality monitoring
 * Sources: AirNow API, EPA AQS API, OpenWeatherMap, PurpleAir (future)
 */

class AirQualityService {
  constructor() {
    this.apiKeys = {
      airnow: process.env.AIRNOW_API_KEY,
      openweather: process.env.VITE_OPENWEATHER_API_KEY,
      epa: process.env.EPA_AQS_API_KEY
    };
    
    this.apiEmail = process.env.EPA_AQS_API_EMAIL;
    
    this.baseUrls = {
      airnow: 'https://www.airnowapi.org/aq',
      openweather: 'https://api.openweathermap.org/data/2.5/air_pollution',
      epa: 'https://aqs.epa.gov/data/api'
    };

    // EPA parameter codes for different pollutants
    this.epaParameters = {
      pm25: '88502',    // PM2.5 Local Conditions
      pm10: '81102',    // PM10 Total 0-10um STP
      ozone: '44201',   // Ozone
      no2: '42602',     // Nitrogen dioxide (NO2)
      so2: '42401',     // Sulfur dioxide (SO2)
      co: '42101'       // Carbon monoxide (CO)
    };

    // California state code for EPA AQS
    this.californiaStateCode = '06';
  }

  /**
   * Get comprehensive air quality data from multiple sources
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} zipCode - Optional ZIP code for enhanced accuracy
   * @returns {Object} Comprehensive air quality data
   */
  async getAirQualityData(lat, lng, zipCode = null) {
    const results = await Promise.allSettled([
      this.getAirNowData(lat, lng, zipCode),
      this.getOpenWeatherData(lat, lng),
      this.getEPAAQSData(lat, lng),
      this.getWildfireSmokeAnalysis(lat, lng)
    ]);

    const airNowData = results[0].status === 'fulfilled' ? results[0].value : null;
    const openWeatherData = results[1].status === 'fulfilled' ? results[1].value : null;
    const epaData = results[2].status === 'fulfilled' ? results[2].value : null;
    const smokeAnalysis = results[3].status === 'fulfilled' ? results[3].value : null;

    return this.combineAirQualityData(airNowData, openWeatherData, epaData, smokeAnalysis, lat, lng);
  }

  /**
   * Get current air quality data from AirNow API
   */
  async getAirNowData(lat, lng, zipCode = null) {
    if (!this.apiKeys.airnow) {
      console.log('AirNow API key not configured');
      return null;
    }

    try {
      let url;
      const baseParams = `format=application/json&distance=50&API_KEY=${this.apiKeys.airnow}`;
      
      if (zipCode) {
        url = `${this.baseUrls.airnow}/observation/zipCode/current/?${baseParams}&zipCode=${zipCode}`;
        console.log(`Fetching AirNow data for ZIP: ${zipCode}`);
      } else {
        url = `${this.baseUrls.airnow}/observation/latLong/current/?${baseParams}&latitude=${lat}&longitude=${lng}`;
        console.log(`Fetching AirNow data for coordinates: ${lat}, ${lng}`);
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AirNow API error ${response.status}:`, errorText);
        throw new Error(`AirNow API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        console.log('No AirNow data available for location - trying broader search');
        
        // Try with larger distance if no data found
        if (!zipCode) {
          const fallbackUrl = `${this.baseUrls.airnow}/observation/latLong/current/?${baseParams}&latitude=${lat}&longitude=${lng}&distance=100`;
          const fallbackResponse = await fetch(fallbackUrl);
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData && fallbackData.length > 0) {
              console.log('AirNow data found with broader search (100km radius)');
              return this.processAirNowData(fallbackData);
            }
          }
        }
        
        return null;
      }

      console.log(`AirNow data retrieved: ${data.length} measurements`);
      return this.processAirNowData(data);
    } catch (error) {
      console.error('AirNow API fetch error:', error);
      return null;
    }
  }

  /**
   * Process AirNow API response data
   */
  processAirNowData(data) {
    const pm25Data = data.find(item => item.ParameterName === 'PM2.5');
    const ozoneData = data.find(item => item.ParameterName === 'O3');
    const pm10Data = data.find(item => item.ParameterName === 'PM10');
    
    const pm25AQI = pm25Data ? pm25Data.AQI : null;
    const ozoneAQI = ozoneData ? ozoneData.AQI : null;
    const pm10AQI = pm10Data ? pm10Data.AQI : null;
    
    // Use the highest AQI value as the overall AQI
    const allAQIs = [pm25AQI, ozoneAQI, pm10AQI].filter(aqi => aqi !== null);
    const overallAQI = allAQIs.length > 0 ? Math.max(...allAQIs) : null;
    
    // Primary data source for location info
    const primaryData = pm25Data || ozoneData || pm10Data || data[0];
    
    return {
      source: 'AirNow (EPA Real-time)',
      aqi: overallAQI,
      category: overallAQI ? this.getAQICategory(overallAQI) : 'Unknown',
      pm25: pm25Data ? {
        aqi: pm25AQI,
        concentration: pm25Data.Value,
        category: pm25Data.Category?.Name,
        units: 'μg/m³'
      } : null,
      pm10: pm10Data ? {
        aqi: pm10AQI,
        concentration: pm10Data.Value,
        category: pm10Data.Category?.Name,
        units: 'μg/m³'
      } : null,
      ozone: ozoneData ? {
        aqi: ozoneAQI,
        concentration: ozoneData.Value,
        category: ozoneData.Category?.Name,
        units: 'ppm'
      } : null,
      reportingArea: primaryData?.ReportingArea,
      stateCode: primaryData?.StateCode,
      location: {
        latitude: primaryData?.Latitude,
        longitude: primaryData?.Longitude
      },
      observationTime: {
        date: primaryData?.DateObserved,
        hour: primaryData?.HourObserved,
        timezone: primaryData?.LocalTimeZone || 'Local'
      },
      timestamp: new Date().toISOString(),
      isRealTime: true,
      dataQuality: 'official',
      measurementCount: data.length
    };
  }

  /**
   * Get air quality data from OpenWeatherMap API (fallback/additional data)
   */
  async getOpenWeatherData(lat, lng) {
    if (!this.apiKeys.openweather) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrls.openweather}?lat=${lat}&lon=${lng}&appid=${this.apiKeys.openweather}`
      );

      if (!response.ok) {
        throw new Error(`OpenWeather API error: ${response.status}`);
      }

      const data = await response.json();
      const pollution = data.list[0];
      
      return {
        source: 'OpenWeatherMap',
        aqi: pollution.main.aqi * 50, // Convert European scale to US scale
        category: this.getAQICategory(pollution.main.aqi * 50),
        components: {
          pm25: pollution.components.pm2_5,
          pm10: pollution.components.pm10,
          o3: pollution.components.o3,
          no2: pollution.components.no2,
          so2: pollution.components.so2,
          co: pollution.components.co
        },
        timestamp: new Date(pollution.dt * 1000).toISOString(),
        isRealTime: false
      };
    } catch (error) {
      console.error('OpenWeather API fetch error:', error);
      return null;
    }
  }

  /**
   * Get comprehensive air quality data from EPA AQS API
   * @param {number} lat - Latitude 
   * @param {number} lng - Longitude
   * @returns {Object} EPA AQS air quality data
   */
  async getEPAAQSData(lat, lng) {
    if (!this.apiKeys.epa || !this.apiEmail) {
      console.log('EPA AQS API credentials not configured');
      return null;
    }

    try {
      // First, find the nearest monitoring site to the coordinates
      const site = await this.findNearestEPASite(lat, lng);
      if (!site) {
        console.log('No EPA monitoring sites found near location');
        return null;
      }

      // Get recent air quality data for multiple pollutants
      // EPA data has significant processing delays - use historical data from several months ago
      const currentDate = new Date();
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, currentDate.getDate()); // 3 months ago
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days before that
      
      console.log(`Fetching EPA data for site ${site.state_code}-${site.county_code}-${site.site_number} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      
      const pollutantData = await Promise.allSettled([
        this.getEPAPollutantData('pm25', site.state_code, site.county_code, site.site_number, startDate, endDate),
        this.getEPAPollutantData('pm10', site.state_code, site.county_code, site.site_number, startDate, endDate),
        this.getEPAPollutantData('ozone', site.state_code, site.county_code, site.site_number, startDate, endDate)
      ]);

      const pm25Data = pollutantData[0].status === 'fulfilled' ? pollutantData[0].value : null;
      const pm10Data = pollutantData[1].status === 'fulfilled' ? pollutantData[1].value : null;
      const ozoneData = pollutantData[2].status === 'fulfilled' ? pollutantData[2].value : null;

      // Log any errors for debugging
      pollutantData.forEach((result, index) => {
        if (result.status === 'rejected') {
          const pollutants = ['pm25', 'pm10', 'ozone'];
          console.warn(`EPA ${pollutants[index]} data error:`, result.reason?.message || result.reason);
        }
      });

      return this.processEPAAQSData(pm25Data, pm10Data, ozoneData, site);
    } catch (error) {
      console.error('EPA AQS API fetch error:', error);
      return null;
    }
  }

  /**
   * Find the nearest EPA monitoring site to given coordinates
   */
  async findNearestEPASite(lat, lng) {
    try {
      // Get PM2.5 monitors in LA County (037) with coordinates and site details
      // Using monitors API which provides complete site information
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const lastYear = year - 1; // Get monitors from last year to ensure we find active ones
      
      const response = await fetch(
        `${this.baseUrls.epa}/monitors/byCounty?email=${this.apiEmail}&key=${this.apiKeys.epa}&param=88502&bdate=${lastYear}0101&edate=${year}1231&state=${this.californiaStateCode}&county=037`
      );

      if (!response.ok) {
        throw new Error(`EPA monitors API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.Data || data.Data.length === 0) {
        console.log('No EPA PM2.5 monitors found in LA County');
        return null;
      }

      // Find the nearest site based on distance calculation
      let nearestSite = null;
      let minDistance = Infinity;

      for (const monitor of data.Data) {
        if (monitor.latitude && monitor.longitude) {
          const distance = this.calculateDistance(lat, lng, monitor.latitude, monitor.longitude);
          if (distance < minDistance) {
            minDistance = distance;
            nearestSite = monitor;
          }
        }
      }

      if (!nearestSite) {
        console.log('No EPA monitors found with valid coordinates');
        return null;
      }

      console.log(`Found nearest EPA site: ${nearestSite.local_site_name} (${nearestSite.state_code}-${nearestSite.county_code}-${nearestSite.site_number}) at ${minDistance.toFixed(2)} km`);

      return {
        state_code: nearestSite.state_code,
        county_code: nearestSite.county_code,
        site_number: nearestSite.site_number,
        site_name: nearestSite.local_site_name,
        latitude: nearestSite.latitude,
        longitude: nearestSite.longitude,
        city: nearestSite.city_name,
        county: nearestSite.county_name,
        address: nearestSite.address,
        monitoring_agency: nearestSite.monitoring_agency,
        distance_km: minDistance
      };
    } catch (error) {
      console.error('Error finding EPA sites:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get pollutant data from EPA AQS for specific parameters
   */
  async getEPAPollutantData(pollutant, stateCode, countyCode, siteNumber, startDate, endDate) {
    try {
      const parameter = this.epaParameters[pollutant];
      if (!parameter) {
        throw new Error(`Unknown pollutant: ${pollutant}`);
      }

      const bdate = startDate.toISOString().split('T')[0].replace(/-/g, '');
      const edate = endDate.toISOString().split('T')[0].replace(/-/g, '');

      const response = await fetch(
        `${this.baseUrls.epa}/dailyData/bySite?email=${this.apiEmail}&key=${this.apiKeys.epa}&param=${parameter}&bdate=${bdate}&edate=${edate}&state=${stateCode}&county=${countyCode}&site=${siteNumber}`
      );

      if (!response.ok) {
        throw new Error(`EPA ${pollutant} data error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.Data || data.Data.length === 0) {
        return null;
      }

      // Get the most recent measurement
      const sortedData = data.Data.sort((a, b) => new Date(b.date_local) - new Date(a.date_local));
      const latestData = sortedData[0];

      return {
        pollutant,
        parameter_code: parameter,
        value: latestData.arithmetic_mean,
        max_value: latestData.first_max_value,
        aqi: latestData.aqi,
        date: latestData.date_local,
        units: latestData.units_of_measure,
        site_name: latestData.local_site_name,
        method: latestData.method,
        validity: latestData.validity_indicator
      };
    } catch (error) {
      console.error(`Error getting EPA ${pollutant} data:`, error);
      return null;
    }
  }

  /**
   * Process EPA AQS data into standardized format
   */
  processEPAAQSData(pm25Data, pm10Data, ozoneData, site) {
    if (!pm25Data && !pm10Data && !ozoneData) {
      return null;
    }

    // Calculate overall AQI from available pollutants
    const aqiValues = [pm25Data?.aqi, pm10Data?.aqi, ozoneData?.aqi].filter(Boolean);
    const overallAQI = aqiValues.length > 0 ? Math.max(...aqiValues) : null;

    return {
      source: 'EPA AQS',
      aqi: overallAQI,
      category: overallAQI ? this.getAQICategory(overallAQI) : 'Unknown',
      pm25: pm25Data ? {
        concentration: pm25Data.value,
        aqi: pm25Data.aqi,
        max_value: pm25Data.max_value,
        units: pm25Data.units,
        date: pm25Data.date,
        method: pm25Data.method
      } : null,
      pm10: pm10Data ? {
        concentration: pm10Data.value,
        aqi: pm10Data.aqi,
        max_value: pm10Data.max_value,
        units: pm10Data.units,
        date: pm10Data.date,
        method: pm10Data.method
      } : null,
      ozone: ozoneData ? {
        concentration: ozoneData.value,
        aqi: ozoneData.aqi,
        max_value: ozoneData.max_value,
        units: ozoneData.units,
        date: ozoneData.date,
        method: ozoneData.method
      } : null,
      monitoring_site: {
        name: site.site_name,
        city: site.city,
        county: site.county,
        latitude: site.latitude,
        longitude: site.longitude,
        state_code: site.state_code,
        county_code: site.county_code,
        site_number: site.site_number
      },
      timestamp: new Date().toISOString(),
      isRealTime: false,
      dataQuality: 'official' // EPA data is official government data
    };
  }

  /**
   * Perform wildfire smoke analysis based on PM2.5 levels and regional fire activity
   */
  async getWildfireSmokeAnalysis(lat, lng) {
    try {
      // This could be enhanced to check fire incident data and correlate with PM2.5 spikes
      // For now, we'll use a simplified analysis based on PM2.5 thresholds
      
      return {
        smokeDetected: false,
        smokeSeverity: 'none',
        sourceDirection: null,
        estimatedDistance: null,
        confidence: 'low',
        analysis: 'Smoke analysis requires PM2.5 data from primary sources'
      };
    } catch (error) {
      console.error('Smoke analysis error:', error);
      return null;
    }
  }

  /**
   * Combine data from multiple sources into unified response
   */
  combineAirQualityData(airNowData, openWeatherData, epaData, smokeAnalysis, lat, lng) {
    // Prioritize EPA AQS data (most authoritative), then AirNow, then OpenWeather
    const primarySource = epaData || airNowData || openWeatherData;
    
    if (!primarySource) {
      return this.getMockAirQuality(lat, lng);
    }

    // Enhanced smoke detection based on PM2.5 levels from best available source
    const pm25Value = epaData?.pm25?.concentration || 
                     airNowData?.pm25?.concentration || 
                     openWeatherData?.components?.pm25;
    const smokeDetected = pm25Value && pm25Value > 35; // WHO guideline for unhealthy
    const smokeSeverity = this.getSmokeRiskLevel(pm25Value);

    // Calculate AQI if not available from primary source
    let finalAQI = primarySource.aqi;
    let finalCategory = primarySource.category;
    
    // If primary source doesn't have AQI, calculate from PM2.5 or use alternative sources
    if (!finalAQI && pm25Value) {
      finalAQI = this.calculateAQIFromPM25(pm25Value);
      finalCategory = this.getAQICategory(finalAQI);
    } else if (!finalAQI) {
      // Try other sources for AQI
      finalAQI = airNowData?.aqi || openWeatherData?.aqi || 50; // Default to moderate if no data
      finalCategory = this.getAQICategory(finalAQI);
    }

    // Determine data source priority and quality
    const dataSourcePriority = epaData ? 'EPA AQS (Official)' : 
                              airNowData ? 'AirNow (Real-time)' : 
                              'OpenWeatherMap (Global)';
    const dataQuality = epaData?.dataQuality || airNowData?.dataQuality || 'estimated';

    return {
      // Primary data
      aqi: finalAQI,
      category: finalCategory,
      
      // PM2.5 specific (critical for wildfire smoke)
      pm25: {
        value: pm25Value,
        aqi: primarySource.pm25?.aqi,
        category: primarySource.pm25?.category,
        unit: 'μg/m³'
      },
      
      // Additional pollutants (enhanced with EPA data)
      pollutants: {
        pm10: epaData?.pm10?.concentration || openWeatherData?.components?.pm10,
        ozone: epaData?.ozone?.concentration || primarySource.ozone?.concentration || openWeatherData?.components?.o3,
        no2: openWeatherData?.components?.no2,
        so2: openWeatherData?.components?.so2,
        co: openWeatherData?.components?.co
      },
      
      // Wildfire smoke analysis
      smoke: {
        detected: smokeDetected,
        severity: smokeSeverity,
        riskLevel: this.getWildfireSmokeRiskLevel(pm25Value),
        healthMessage: this.getSmokeHealthMessage(pm25Value),
        ...smokeAnalysis
      },
      
      // Source information (enhanced with EPA AQS and AirNow)
      dataSources: [
        epaData ? 'EPA AQS (Official)' : null,
        airNowData ? airNowData.source : null,
        openWeatherData ? 'OpenWeatherMap' : null
      ].filter(Boolean),
      
      // Data quality and reliability
      dataQuality: dataQuality,
      primarySource: dataSourcePriority,
      
      // Location and timing (enhanced with EPA monitoring site info)
      location: {
        latitude: lat,
        longitude: lng,
        reportingArea: airNowData?.reportingArea || epaData?.monitoring_site?.city
      },
      
      // EPA AQS detailed information (if available)
      epaDetails: epaData ? {
        monitoringSite: epaData.monitoring_site,
        dataQuality: epaData.dataQuality,
        measurements: {
          pm25: epaData.pm25,
          pm10: epaData.pm10,
          ozone: epaData.ozone
        }
      } : null,
      
      // AirNow detailed information (if available)
      airnowDetails: airNowData ? {
        reportingArea: airNowData.reportingArea,
        stateCode: airNowData.stateCode,
        location: airNowData.location,
        observationTime: airNowData.observationTime,
        measurementCount: airNowData.measurementCount,
        dataQuality: airNowData.dataQuality,
        isRealTime: airNowData.isRealTime
      } : null,
      
      // Metadata
      timestamp: new Date().toISOString(),
      isRealTime: airNowData?.isRealTime || false,
      lastUpdated: primarySource.timestamp,
      
      // Health recommendations
      healthRecommendations: this.getHealthRecommendations(primarySource.aqi, smokeDetected)
    };
  }

  /**
   * Determine smoke risk level based on PM2.5 concentration
   */
  getSmokeRiskLevel(pm25Value) {
    if (!pm25Value) return 'unknown';
    if (pm25Value <= 12) return 'good';
    if (pm25Value <= 35) return 'moderate';
    if (pm25Value <= 55) return 'unhealthy-sensitive';
    if (pm25Value <= 150) return 'unhealthy';
    if (pm25Value <= 250) return 'very-unhealthy';
    return 'hazardous';
  }

  /**
   * Get wildfire smoke specific risk level
   */
  getWildfireSmokeRiskLevel(pm25Value) {
    if (!pm25Value) return 'unknown';
    if (pm25Value <= 35) return 'low';
    if (pm25Value <= 75) return 'moderate';
    if (pm25Value <= 115) return 'high';
    return 'extreme';
  }

  /**
   * Get health message specific to wildfire smoke
   */
  getSmokeHealthMessage(pm25Value) {
    if (!pm25Value) return 'Air quality data unavailable';
    
    if (pm25Value <= 12) {
      return 'Air quality is good. No wildfire smoke detected.';
    } else if (pm25Value <= 35) {
      return 'Moderate air quality. Sensitive individuals should consider reducing outdoor activities.';
    } else if (pm25Value <= 55) {
      return 'Unhealthy for sensitive groups. Wildfire smoke may be present. Children, elderly, and people with respiratory conditions should limit outdoor activities.';
    } else if (pm25Value <= 150) {
      return 'Unhealthy air quality due to wildfire smoke. Everyone should reduce outdoor activities. Sensitive individuals should stay indoors.';
    } else if (pm25Value <= 250) {
      return 'Very unhealthy air quality. Heavy wildfire smoke present. Everyone should avoid outdoor activities and stay indoors.';
    } else {
      return 'Hazardous air quality due to extreme wildfire smoke. Emergency conditions - all outdoor activities should be avoided.';
    }
  }

  /**
   * Get comprehensive health recommendations
   */
  getHealthRecommendations(aqi, smokeDetected) {
    const recommendations = [];
    
    if (smokeDetected) {
      recommendations.push('Close windows and doors to prevent smoke from entering your home');
      recommendations.push('Use air purifiers with HEPA filters if available');
      recommendations.push('Avoid outdoor exercise and activities');
      
      if (aqi > 150) {
        recommendations.push('Consider evacuation if smoke is extremely heavy');
        recommendations.push('Seek medical attention if experiencing breathing difficulties');
      }
    }
    
    if (aqi > 100) {
      recommendations.push('Sensitive individuals should wear N95 masks when outdoors');
      recommendations.push('Keep rescue medications readily available');
    }
    
    if (aqi <= 50) {
      recommendations.push('Air quality is good for outdoor activities');
    }
    
    return recommendations;
  }

  /**
   * Convert AQI number to category
   */
  getAQICategory(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  /**
   * Calculate AQI from PM2.5 concentration using EPA formula
   * @param {number} pm25 - PM2.5 concentration in μg/m³
   * @returns {number} AQI value
   */
  calculateAQIFromPM25(pm25) {
    if (!pm25 || pm25 < 0) return 0;
    
    // EPA AQI breakpoints for PM2.5 (24-hour average)
    const breakpoints = [
      { cLow: 0.0, cHigh: 12.0, aqiLow: 0, aqiHigh: 50 },
      { cLow: 12.1, cHigh: 35.4, aqiLow: 51, aqiHigh: 100 },
      { cLow: 35.5, cHigh: 55.4, aqiLow: 101, aqiHigh: 150 },
      { cLow: 55.5, cHigh: 150.4, aqiLow: 151, aqiHigh: 200 },
      { cLow: 150.5, cHigh: 250.4, aqiLow: 201, aqiHigh: 300 },
      { cLow: 250.5, cHigh: 350.4, aqiLow: 301, aqiHigh: 400 },
      { cLow: 350.5, cHigh: 500.4, aqiLow: 401, aqiHigh: 500 }
    ];
    
    // Find the appropriate breakpoint
    for (const bp of breakpoints) {
      if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
        // Linear interpolation formula: AQI = ((AQI_Hi - AQI_Lo) / (C_Hi - C_Lo)) * (C - C_Lo) + AQI_Lo
        const aqi = ((bp.aqiHigh - bp.aqiLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.aqiLow;
        return Math.round(aqi);
      }
    }
    
    // If concentration is beyond highest breakpoint, return max AQI
    return 500;
  }

  /**
   * Get mock air quality data when APIs are unavailable
   */
  getMockAirQuality(lat, lng) {
    return {
      aqi: 85,
      category: 'Moderate',
      pm25: {
        value: 25,
        aqi: 85,
        category: 'Moderate',
        unit: 'μg/m³'
      },
      pollutants: {
        pm10: 45,
        ozone: 0.08,
        no2: 30,
        so2: 5,
        co: 1000
      },
      smoke: {
        detected: false,
        severity: 'low',
        riskLevel: 'low',
        healthMessage: 'Air quality is moderate. No significant wildfire smoke detected.',
        smokeDetected: false,
        smokeSeverity: 'none'
      },
      dataSources: ['Mock Data'],
      location: {
        latitude: lat,
        longitude: lng,
        reportingArea: 'Demo Area'
      },
      timestamp: new Date().toISOString(),
      isRealTime: false,
      isMock: true,
      healthRecommendations: [
        'Air quality is acceptable for most people',
        'Sensitive individuals may experience minor symptoms'
      ]
    };
  }
}

export default new AirQualityService();