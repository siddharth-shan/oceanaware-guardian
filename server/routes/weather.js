import express from 'express';

const router = express.Router();

// Get current weather
router.get('/current', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Missing coordinates',
        message: 'Latitude and longitude are required'
      });
    }

    const apiKey = process.env.VITE_OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error('OpenWeather API key not found');
      return res.status(500).json({
        error: 'API configuration error',
        message: 'Weather service temporarily unavailable'
      });
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`
      );

      if (!response.ok) {
        throw new Error(`OpenWeather API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Calculate fire weather index
      const temp = data.main.temp;
      const humidity = data.main.humidity;
      const windSpeed = data.wind?.speed || 0;
      
      let fwi = (temp - humidity) + (windSpeed * 2);
      if (humidity < 20) fwi += 20;
      if (temp > 85) fwi += 15;
      if (windSpeed > 15) fwi += 10;
      
      let fireWeatherIndex = 'LOW';
      if (fwi > 70) fireWeatherIndex = 'EXTREME';
      else if (fwi > 50) fireWeatherIndex = 'HIGH';
      else if (fwi > 30) fireWeatherIndex = 'MEDIUM';

      const weatherData = {
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: Math.round(windSpeed),
        windDirection: data.wind?.deg || 0,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        pressure: data.main.pressure,
        visibility: data.visibility ? data.visibility / 1000 : 10,
        fireWeatherIndex,
        location: data.name,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        weather: weatherData,
        metadata: {
          userLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
          timestamp: new Date().toISOString()
        }
      });

    } catch (apiError) {
      console.error('OpenWeather API error:', apiError);
      
      // Fallback to mock data if API fails
      const fallbackWeather = {
        temperature: 78,
        humidity: 25,
        windSpeed: 15,
        windDirection: 270,
        description: 'Clear sky (fallback data)',
        icon: '01d',
        pressure: 1013,
        visibility: 10,
        fireWeatherIndex: 'HIGH',
        location: 'Location unavailable',
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        weather: fallbackWeather,
        metadata: {
          userLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
          timestamp: new Date().toISOString(),
          fallback: true
        }
      });
    }

  } catch (error) {
    console.error('Weather error:', error);
    res.status(500).json({
      error: 'Failed to fetch weather data',
      message: error.message
    });
  }
});

// Get weather forecast
router.get('/forecast', async (req, res) => {
  try {
    const { lat, lng, days = 5 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Missing coordinates',
        message: 'Latitude and longitude are required'
      });
    }

    // Mock forecast data for demo
    const mockForecast = [];
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      mockForecast.push({
        date: date.toISOString(),
        temperature: {
          max: 82 + Math.floor(Math.random() * 10),
          min: 65 + Math.floor(Math.random() * 8),
          current: 75 + Math.floor(Math.random() * 12)
        },
        humidity: 20 + Math.floor(Math.random() * 30),
        windSpeed: 8 + Math.floor(Math.random() * 15),
        description: 'Clear sky',
        icon: '01d',
        fireRisk: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)]
      });
    }

    res.json({
      success: true,
      forecast: mockForecast,
      metadata: {
        userLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
        days: parseInt(days),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({
      error: 'Failed to fetch forecast data',
      message: error.message
    });
  }
});

export default router;