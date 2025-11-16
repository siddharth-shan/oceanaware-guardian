export class WeatherService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    console.log('🌤️ Weather API Key loaded:', this.apiKey ? 'Present' : 'Missing', 
                this.apiKey ? `(${this.apiKey.substring(0, 8)}...)` : '');
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  async getCurrentWeather(latitude, longitude) {
    const cacheKey = `weather_${latitude}_${longitude}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=imperial`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data = await response.json();
      const processedData = this.processWeatherData(data);
      
      this.cache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      });

      return processedData;
    } catch (error) {
      console.error('Weather fetch error:', error);
      return this.getFallbackWeatherData();
    }
  }

  processWeatherData(data) {
    const fireWeatherIndex = this.calculateFireWeatherIndex(data);
    
    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind?.speed || 0),
      windDirection: data.wind?.deg || 0,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      pressure: data.main.pressure,
      visibility: data.visibility / 1000,
      fireWeatherIndex,
      location: data.name,
      timestamp: new Date().toISOString()
    };
  }

  calculateFireWeatherIndex(weatherData) {
    const temp = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const windSpeed = weatherData.wind?.speed || 0;
    
    let fwi = (temp - humidity) + (windSpeed * 2);
    
    if (humidity < 20) fwi += 20;
    if (temp > 85) fwi += 15;
    if (windSpeed > 15) fwi += 10;
    
    if (fwi > 70) return 'EXTREME';
    if (fwi > 50) return 'HIGH';
    if (fwi > 30) return 'MEDIUM';
    return 'LOW';
  }

  getFallbackWeatherData() {
    return {
      temperature: 78,
      humidity: 25,
      windSpeed: 15,
      windDirection: 270,
      description: 'Clear sky',
      icon: '01d',
      pressure: 1013,
      visibility: 10,
      fireWeatherIndex: 'HIGH',
      location: 'Los Angeles',
      timestamp: new Date().toISOString()
    };
  }

  async getForecast(latitude, longitude, days = 5) {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=imperial&cnt=${days * 8}`
      );
      
      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.processForecastData(data);
    } catch (error) {
      console.error('Forecast fetch error:', error);
      return [];
    }
  }

  processForecastData(data) {
    return data.list.map(item => ({
      date: new Date(item.dt * 1000).toISOString(),
      temperature: {
        max: Math.round(item.main.temp_max),
        min: Math.round(item.main.temp_min),
        current: Math.round(item.main.temp)
      },
      humidity: item.main.humidity,
      windSpeed: Math.round(item.wind?.speed || 0),
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      fireRisk: this.calculateFireWeatherIndex(item)
    }));
  }
}