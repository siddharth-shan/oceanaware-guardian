export class NewsService {
  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace('/api', '');
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes cache
  }

  async getFireRelatedNews(location, options = {}) {
    const cacheKey = this.generateCacheKey(location, options);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📰 Returning cached news data');
        return cached.data;
      }
    }

    try {
      const params = new URLSearchParams({
        limit: options.limit || 15,
        radius: options.radius || 100
      });

      if (location) {
        params.append('lat', location.lat);
        params.append('lng', location.lng);
        params.append('location', location.displayName || '');
        params.append('state', location.state || 'California');
      }

      const response = await fetch(`${this.baseUrl}/api/news/enhanced/fire-related?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      if (!response.ok) {
        throw new Error(`News API responded with ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the successful response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      // Clean old cache entries
      this.cleanCache();
      
      return data;
    } catch (error) {
      console.error('News service error:', error);
      
      // Return cached data if available, even if expired
      if (this.cache.has(cacheKey)) {
        console.log('📰 Returning expired cached news data due to error');
        return this.cache.get(cacheKey).data;
      }
      
      throw new Error('Failed to fetch news data: ' + error.message);
    }
  }

  generateCacheKey(location, options) {
    const locationKey = location ? `${location.lat}_${location.lng}` : 'no_location';
    const optionsKey = `${options.limit || 15}_${options.radius || 100}`;
    return `news_${locationKey}_${optionsKey}`;
  }

  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout * 2) { // Clean entries older than 20 minutes
        this.cache.delete(key);
      }
    }
  }

  // Method to get news categories for filtering
  getNewsCategories() {
    return [
      { id: 'all', name: 'All News', icon: '📰' },
      { id: 'breaking', name: 'Breaking', icon: '🚨' },
      { id: 'official', name: 'Official', icon: '🏛️' },
      { id: 'community', name: 'Community', icon: '👥' },
      { id: 'prevention', name: 'Prevention', icon: '🛡️' },
      { id: 'weather', name: 'Weather', icon: '🌤️' }
    ];
  }

  // Method to calculate relevance score based on location and keywords
  static calculateRelevanceScore(article, userLocation) {
    let score = 0;
    
    // Base score for fire-related content
    const fireKeywords = ['wildfire', 'fire', 'burn', 'evacuation', 'cal fire', 'calfire'];
    const urgentKeywords = ['emergency', 'evacuate', 'danger', 'alert', 'warning'];
    
    const text = (article.title + ' ' + (article.description || '')).toLowerCase();
    
    fireKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.2;
    });
    
    urgentKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.3;
    });
    
    // Location relevance
    if (userLocation && article.location) {
      const distance = this.calculateDistance(
        userLocation.lat, userLocation.lng,
        article.location.lat, article.location.lng
      );
      
      if (distance < 25) score += 0.4; // Very close
      else if (distance < 50) score += 0.3; // Close
      else if (distance < 100) score += 0.2; // Nearby
      else if (distance < 200) score += 0.1; // Regional
    }
    
    // Recency boost
    if (article.publishedAt) {
      const hoursOld = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
      if (hoursOld < 6) score += 0.2; // Very recent
      else if (hoursOld < 24) score += 0.1; // Recent
    }
    
    // Trusted source boost
    if (article.trusted) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}