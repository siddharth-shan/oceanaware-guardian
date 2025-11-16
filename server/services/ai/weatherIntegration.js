/**
 * Weather Integration Service
 * Provides real-time weather data for enhanced fire risk assessment
 */

export class WeatherIntegration {
  constructor() {
    this.openWeatherApiKey = process.env.VITE_OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY;
    this.weatherApiUrl = 'https://api.openweathermap.org/data/2.5';
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  /**
   * Get comprehensive weather data for fire risk assessment
   */
  async getFireWeatherData(latitude, longitude) {
    const cacheKey = `weather_${latitude}_${longitude}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      console.log('🌤️ Fetching fire weather data...');
      
      const [currentWeather, forecast] = await Promise.allSettled([
        this.getCurrentWeather(latitude, longitude),
        this.getWeatherForecast(latitude, longitude)
      ]);

      const weatherData = {
        current: currentWeather.status === 'fulfilled' ? currentWeather.value : null,
        forecast: forecast.status === 'fulfilled' ? forecast.value : null,
        fire_weather_indices: null,
        risk_factors: null,
        timestamp: new Date().toISOString()
      };

      // Calculate fire weather indices
      if (weatherData.current) {
        weatherData.fire_weather_indices = this.calculateFireWeatherIndices(weatherData.current);
        weatherData.risk_factors = this.assessWeatherRiskFactors(weatherData.current, weatherData.forecast);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      console.log('✅ Fire weather data retrieved successfully');
      return weatherData;

    } catch (error) {
      console.error('Error fetching fire weather data:', error);
      return this.getDefaultWeatherData();
    }
  }

  /**
   * Get current weather conditions
   */
  async getCurrentWeather(latitude, longitude) {
    if (!this.openWeatherApiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    const url = `${this.weatherApiUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.openWeatherApiKey}&units=metric`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind?.speed || 0,
      windDirection: data.wind?.deg || 0,
      windGust: data.wind?.gust || null,
      cloudCover: data.clouds?.all || 0,
      visibility: data.visibility || 10000,
      weatherMain: data.weather[0]?.main || 'Clear',
      weatherDescription: data.weather[0]?.description || 'clear sky',
      precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
      uvIndex: null, // Would need separate UV API call
      dewPoint: this.calculateDewPoint(data.main.temp, data.main.humidity),
      feelsLike: data.main.feels_like,
      timestamp: new Date().toISOString(),
      location: {
        name: data.name,
        country: data.sys.country,
        coordinates: { lat: data.coord.lat, lon: data.coord.lon }
      }
    };
  }

  /**
   * Get weather forecast for fire risk planning
   */
  async getWeatherForecast(latitude, longitude) {
    if (!this.openWeatherApiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    const url = `${this.weatherApiUrl}/forecast?lat=${latitude}&lon=${longitude}&appid=${this.openWeatherApiKey}&units=metric`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      forecasts: data.list.slice(0, 8).map(item => ({ // Next 24 hours (8 x 3-hour periods)
        datetime: new Date(item.dt * 1000).toISOString(),
        temperature: item.main.temp,
        humidity: item.main.humidity,
        windSpeed: item.wind?.speed || 0,
        windDirection: item.wind?.deg || 0,
        precipitation: item.rain?.['3h'] || item.snow?.['3h'] || 0,
        weatherMain: item.weather[0]?.main || 'Clear',
        cloudCover: item.clouds?.all || 0
      })),
      location: data.city,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate Fire Weather Indices
   */
  calculateFireWeatherIndices(currentWeather) {
    const temp = currentWeather.temperature;
    const humidity = currentWeather.humidity;
    const windSpeed = currentWeather.windSpeed * 3.6; // Convert m/s to km/h
    const precipitation = currentWeather.precipitation || 0;

    // Fine Fuel Moisture Code (FFMC) - simplified calculation
    const ffmc = this.calculateFFMC(temp, humidity, windSpeed, precipitation);
    
    // Duff Moisture Code (DMC) - simplified calculation
    const dmc = this.calculateDMC(temp, humidity, precipitation);
    
    // Drought Code (DC) - simplified calculation
    const dc = this.calculateDC(temp, precipitation);
    
    // Initial Spread Index (ISI)
    const isi = this.calculateISI(ffmc, windSpeed);
    
    // Buildup Index (BUI)
    const bui = this.calculateBUI(dmc, dc);
    
    // Fire Weather Index (FWI)
    const fwi = this.calculateFWI(isi, bui);
    
    // Haines Index (atmospheric stability)
    const haines = this.calculateHainesIndex(temp, humidity, currentWeather.pressure);

    return {
      ffmc: Math.round(ffmc * 10) / 10,
      dmc: Math.round(dmc * 10) / 10,
      dc: Math.round(dc * 10) / 10,
      isi: Math.round(isi * 10) / 10,
      bui: Math.round(bui * 10) / 10,
      fwi: Math.round(fwi * 10) / 10,
      haines: Math.round(haines * 10) / 10,
      fire_danger_rating: this.getFireDangerRating(fwi),
      red_flag_warning: this.assessRedFlagConditions(currentWeather)
    };
  }

  /**
   * Assess weather-based risk factors
   */
  assessWeatherRiskFactors(currentWeather, forecast) {
    const riskFactors = {
      high_temperature: currentWeather.temperature > 30, // 86°F
      low_humidity: currentWeather.humidity < 30,
      high_wind: currentWeather.windSpeed > 8, // ~18 mph
      no_precipitation: currentWeather.precipitation === 0,
      dry_period: this.assessDryPeriod(forecast),
      atmospheric_instability: this.assessAtmosphericInstability(currentWeather),
      
      // Risk scores (0-100)
      temperature_risk: this.temperatureToRisk(currentWeather.temperature),
      humidity_risk: this.humidityToRisk(currentWeather.humidity),
      wind_risk: this.windToRisk(currentWeather.windSpeed),
      precipitation_risk: this.precipitationToRisk(currentWeather.precipitation),
      
      // Combined weather risk
      overall_weather_risk: 0
    };

    // Calculate overall weather risk
    riskFactors.overall_weather_risk = (
      riskFactors.temperature_risk * 0.25 +
      riskFactors.humidity_risk * 0.30 +
      riskFactors.wind_risk * 0.25 +
      riskFactors.precipitation_risk * 0.20
    );

    // Red flag warning assessment
    riskFactors.red_flag_conditions = (
      riskFactors.low_humidity && 
      riskFactors.high_wind && 
      riskFactors.no_precipitation
    );

    return riskFactors;
  }

  // Fire Weather Index calculations (simplified versions)
  calculateFFMC(temp, humidity, wind, precip) {
    // Simplified FFMC calculation
    let moisture = 101 - humidity;
    if (precip > 0.5) moisture = Math.max(0, moisture - precip * 10);
    moisture = Math.max(0, Math.min(101, moisture + (temp - 20) * 0.5 + wind * 0.1));
    return moisture;
  }

  calculateDMC(temp, humidity, precip) {
    // Simplified DMC calculation
    let dmc = 50; // Default starting value
    if (temp > 0) {
      dmc += Math.max(0, temp - 10) * 0.5;
    }
    if (precip > 1.5) {
      dmc = Math.max(0, dmc - precip * 5);
    }
    return Math.max(0, dmc);
  }

  calculateDC(temp, precip) {
    // Simplified DC calculation
    let dc = 300; // Default starting value
    if (temp > 0) {
      dc += Math.max(0, temp - 5) * 0.8;
    }
    if (precip > 2.8) {
      dc = Math.max(0, dc - precip * 10);
    }
    return Math.max(0, dc);
  }

  calculateISI(ffmc, wind) {
    // Initial Spread Index
    const fw = Math.exp(0.05039 * wind);
    const fm = 147.2 * (101 - ffmc) / (59.5 + ffmc);
    return 0.208 * fw * Math.pow(fm, -1.45);
  }

  calculateBUI(dmc, dc) {
    // Buildup Index
    if (dmc === 0 && dc === 0) return 0;
    return Math.max(0, 0.8 * dc * dmc / (dmc + 0.4 * dc));
  }

  calculateFWI(isi, bui) {
    // Fire Weather Index
    if (bui <= 80) {
      const bb = 0.1 * isi * (0.626 * Math.pow(bui, 0.809) + 2);
      return bb <= 1 ? bb : Math.exp(2.72 * Math.pow(0.434 * Math.log(bb), 0.647));
    } else {
      const bb = 0.1 * isi * (1000 / (25 + 108.64 / Math.exp(0.023 * bui)));
      return bb <= 1 ? bb : Math.exp(2.72 * Math.pow(0.434 * Math.log(bb), 0.647));
    }
  }

  calculateHainesIndex(temp, humidity, pressure) {
    // Simplified Haines Index for atmospheric stability
    const stabilityComponent = temp > 25 ? 3 : temp > 20 ? 2 : 1;
    const moistureComponent = humidity < 30 ? 3 : humidity < 50 ? 2 : 1;
    return stabilityComponent + moistureComponent;
  }

  // Risk assessment helpers
  temperatureToRisk(temp) {
    if (temp < 15) return 10;
    if (temp < 25) return 30;
    if (temp < 35) return 60;
    return 90;
  }

  humidityToRisk(humidity) {
    if (humidity > 70) return 10;
    if (humidity > 50) return 30;
    if (humidity > 30) return 60;
    return 90;
  }

  windToRisk(windSpeed) {
    const windKph = windSpeed * 3.6;
    if (windKph < 10) return 20;
    if (windKph < 25) return 40;
    if (windKph < 40) return 70;
    return 95;
  }

  precipitationToRisk(precip) {
    if (precip > 5) return 5;
    if (precip > 1) return 20;
    if (precip > 0.1) return 40;
    return 80;
  }

  getFireDangerRating(fwi) {
    if (fwi < 5) return { level: 'Low', color: 'green' };
    if (fwi < 11) return { level: 'Moderate', color: 'blue' };
    if (fwi < 21) return { level: 'High', color: 'yellow' };
    if (fwi < 38) return { level: 'Very High', color: 'orange' };
    return { level: 'Extreme', color: 'red' };
  }

  assessRedFlagConditions(weather) {
    return {
      active: weather.humidity < 20 && weather.windSpeed > 8,
      criteria: {
        low_humidity: weather.humidity < 20,
        high_wind: weather.windSpeed > 8,
        dry_conditions: weather.precipitation === 0
      },
      warning_level: weather.humidity < 15 && weather.windSpeed > 12 ? 'CRITICAL' : 
                    weather.humidity < 20 && weather.windSpeed > 8 ? 'WARNING' : 'NONE'
    };
  }

  assessDryPeriod(forecast) {
    if (!forecast || !forecast.forecasts) return false;
    
    const totalPrecip = forecast.forecasts.reduce((sum, f) => sum + (f.precipitation || 0), 0);
    return totalPrecip < 1; // Less than 1mm in next 24 hours
  }

  assessAtmosphericInstability(weather) {
    // Simplified atmospheric instability assessment
    const tempHumidityIndex = weather.temperature - weather.humidity;
    return {
      unstable: tempHumidityIndex > 20,
      index: tempHumidityIndex
    };
  }

  calculateDewPoint(temp, humidity) {
    // Magnus formula for dew point
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100.0);
    return (b * alpha) / (a - alpha);
  }

  getDefaultWeatherData() {
    console.log('🌤️ Using default weather data (API unavailable)');
    return {
      current: {
        temperature: 25,
        humidity: 50,
        windSpeed: 5,
        windDirection: 180,
        precipitation: 0,
        weatherMain: 'Clear',
        timestamp: new Date().toISOString()
      },
      forecast: null,
      fire_weather_indices: {
        ffmc: 70,
        dmc: 40,
        dc: 300,
        isi: 5,
        bui: 50,
        fwi: 10,
        haines: 4,
        fire_danger_rating: { level: 'Moderate', color: 'blue' },
        red_flag_warning: { active: false, warning_level: 'NONE' }
      },
      risk_factors: {
        overall_weather_risk: 50,
        red_flag_conditions: false
      },
      timestamp: new Date().toISOString()
    };
  }
}