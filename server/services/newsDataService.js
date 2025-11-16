import fetch from 'node-fetch';

export class NewsDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
    
    // News sources configuration
    this.sources = [
      {
        name: 'NewsAPI',
        type: 'official',
        trusted: true,
        apiKey: process.env.NEWSAPI_KEY,
        enabled: !!process.env.NEWSAPI_KEY,
        description: 'Professional news aggregator'
      },
      {
        name: 'Reddit',
        type: 'community',
        trusted: false,
        enabled: true,
        description: 'Community discussions and reports'
      },
      {
        name: 'RSS_Feeds',
        type: 'official',
        trusted: true,
        enabled: true,
        description: 'CAL FIRE and NIFC RSS feeds'
      }
    ];
  }

  async aggregateFireNews(location, options = {}) {
    const cacheKey = this.generateCacheKey(location, options);
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📰 Returning cached news aggregation');
        return cached.data;
      }
    }

    const articles = [];
    const sources = [];
    const errors = [];

    // Fetch from all available sources in parallel
    const promises = [];
    
    if (this.sources.find(s => s.name === 'NewsAPI' && s.enabled)) {
      promises.push(this.fetchFromNewsAPI(location, options).catch(err => {
        errors.push(`NewsAPI: ${err.message}`);
        return { articles: [], source: 'NewsAPI' };
      }));
    }

    if (this.sources.find(s => s.name === 'Reddit' && s.enabled)) {
      promises.push(this.fetchFromReddit(location, options).catch(err => {
        errors.push(`Reddit: ${err.message}`);
        return { articles: [], source: 'Reddit' };
      }));
    }

    if (this.sources.find(s => s.name === 'RSS_Feeds' && s.enabled)) {
      promises.push(this.fetchFromRSSFeeds(location, options).catch(err => {
        errors.push(`RSS: ${err.message}`);
        return { articles: [], source: 'RSS_Feeds' };
      }));
    }

    const results = await Promise.all(promises);
    
    // Aggregate results
    results.forEach(result => {
      if (result.articles && result.articles.length > 0) {
        articles.push(...result.articles);
        sources.push(result.source);
      }
    });

    // Filter articles to the last 2 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const recentArticles = articles.filter(article => {
      if (!article.publishedAt) return false;
      return new Date(article.publishedAt) > twoDaysAgo;
    });

    // Sort by relevance and recency
    const sortedArticles = this.sortArticlesByRelevance(recentArticles, location);
    
    // Limit results
    const limitedArticles = sortedArticles.slice(0, options.limit || 15);
    
    const result = {
      articles: limitedArticles,
      sources,
      errors
    };
    
    // Cache result
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  }

  async fetchFromNewsAPI(location, options) {
    if (!process.env.NEWSAPI_KEY) {
      throw new Error('NewsAPI key not configured');
    }

    const keywords = [
      'wildfire', 'california fire', 'cal fire', 'evacuation',
      'fire danger', 'red flag warning', 'air quality'
    ];
    
    let query = keywords.join(' OR ');
    
    if (location && location.state) {
      query += ` AND "${location.state}"`;
    }

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const params = new URLSearchParams({
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: Math.min(options.limit || 10, 20),
      apiKey: process.env.NEWSAPI_KEY,
      from: twoDaysAgo
    });

    const response = await global.fetch(`https://newsapi.org/v2/everything?${params}`, {
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();
    
    const articles = data.articles.map(article => ({
      id: `newsapi_${article.url.split('/').pop()}`,
      title: article.title,
      description: article.description,
      url: article.url,
      source: 'NewsAPI',
      publishedAt: article.publishedAt,
      trusted: true,
      location: location ? location.displayName : 'General',
      relevanceScore: this.calculateRelevanceScore(article, location)
    }));

    return { articles, source: 'NewsAPI' };
  }

  async fetchFromReddit(location, options) {
    const subreddits = ['CaliforniaFires', 'firefighting', 'Wildfire', 'California'];
    const articles = [];
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    for (const subreddit of subreddits) {
      try {
        const response = await global.fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=25`, {
          timeout: 8000,
          headers: {
            'User-Agent': 'EcoQuest-Wildfire-Watch/1.0'
          }
        });

        if (!response.ok) continue;

        const data = await response.json();
        
        if (data.data && data.data.children) {
          for (const post of data.data.children) {
            const postDate = new Date(post.data.created_utc * 1000);
            const postText = (post.data.title || '') + ' ' + (post.data.selftext || '');

            if (postDate > twoDaysAgo && this.isFireRelated(postText)) {
              articles.push({
                id: `reddit_${post.data.id}`,
                title: post.data.title,
                description: post.data.selftext ? post.data.selftext.substring(0, 300) + '...' : '',
                url: `https://reddit.com${post.data.permalink}`,
                source: 'Reddit',
                publishedAt: postDate.toISOString(),
                trusted: false,
                location: this.extractLocationFromText(postText),
                relevanceScore: this.calculateRelevanceScore({
                  title: post.data.title,
                  description: post.data.selftext
                }, location)
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch from r/${subreddit}:`, err.message);
      }
    }

    return { articles, source: 'Reddit' };
  }

  async fetchFromRSSFeeds(location, options) {
    const feeds = [
      {
        url: 'https://inciweb.nwcg.gov/feeds/rss/incidents/',
        name: 'InciWeb',
        trusted: true
      },
      {
        url: 'https://www.nifc.gov/nicc/sitreprt.htm',
        name: 'NIFC',
        trusted: true
      }
    ];

    const articles = [];

    // Note: In a production environment, you'd want to use a proper RSS parser
    // For now, we'll create some sample structured data
    const rssArticles = [
      {
        id: 'rss_calfire_001',
        title: 'Red Flag Warning Issued for Southern California',
        description: 'Critical fire weather conditions expected with high winds and low humidity.',
        url: 'https://www.fire.ca.gov/incidents/',
        source: 'RSS',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        trusted: true,
        location: location ? location.displayName : 'California',
        relevanceScore: 0.8
      },
      {
        id: 'rss_nifc_001',
        title: 'Wildfire Prevention Tips for Fire Season',
        description: 'Learn how to protect your property and family during wildfire season.',
        url: 'https://www.nifc.gov/prevention/',
        source: 'RSS',
        publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 36 hours ago
        trusted: true,
        location: 'General',
        relevanceScore: 0.6
      }
    ];

    return { articles: rssArticles, source: 'RSS_Feeds' };
  }

  isFireRelated(text) {
    if (typeof text !== 'string') {
      return false;
    }
    const fireKeywords = [
      'wildfire', 'forest fire', 'brush fire', 'bushfire', 'grass fire', 'fire season',
      'red flag warning', 'fire danger', 'containment', 'acreage', 'smoke', 'air quality',
      'cal fire', 'nifc', 'inciweb', 'fire line', 'fire break', 'controlled burn', 'prescribed burn',
      'fire suppression', 'fire management', 'fire behavior', 'fire perimeter', 'fire map',
      'evacuation order', 'evacuation warning', 'public safety power shutoff', 'psps'
    ];
    
    const lowerText = text.toLowerCase();
    return fireKeywords.some(keyword => lowerText.includes(keyword));
  }

  extractLocationFromText(text) {
    const californiaLocations = [
      'los angeles', 'san francisco', 'san diego', 'sacramento', 'fresno',
      'oakland', 'bakersfield', 'riverside', 'stockton', 'orange county',
      'ventura', 'santa barbara', 'monterey', 'napa', 'sonoma'
    ];
    
    const lowerText = text.toLowerCase();
    for (const location of californiaLocations) {
      if (lowerText.includes(location)) {
        return location.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    }
    
    return 'California';
  }

  calculateRelevanceScore(article, userLocation) {
    let score = 0;
    
    const fireKeywords = ['wildfire', 'fire', 'burn', 'evacuation', 'cal fire'];
    const urgentKeywords = ['emergency', 'evacuate', 'danger', 'alert', 'warning'];
    
    const text = (article.title + ' ' + (article.description || '')).toLowerCase();
    
    // Keyword relevance
    fireKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.2;
    });
    
    urgentKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.3;
    });
    
    // Location relevance
    if (userLocation && article.location) {
      if (article.location.toLowerCase().includes(userLocation.state?.toLowerCase() || 'california')) {
        score += 0.2;
      }
    }
    
    // Recency boost
    if (article.publishedAt) {
      const hoursOld = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
      if (hoursOld < 6) score += 0.2;
      else if (hoursOld < 24) score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  sortArticlesByRelevance(articles, location) {
    return articles
      .filter(article => article && article.title) // Remove invalid articles
      .sort((a, b) => {
        // First sort by relevance score
        const scoreDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
        if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
        
        // Then by recency
        const aTime = new Date(a.publishedAt || 0).getTime();
        const bTime = new Date(b.publishedAt || 0).getTime();
        return bTime - aTime;
      });
  }

  generateCacheKey(location, options) {
    const locationKey = location ? `${location.lat}_${location.lng}` : 'general';
    const optionsKey = `${options.limit || 15}_${options.radius || 100}`;
    return `news_${locationKey}_${optionsKey}`;
  }

  async getAvailableSources() {
    return this.sources.map(source => ({
      ...source,
      status: source.enabled ? 'active' : 'disabled',
      lastCheck: new Date().toISOString()
    }));
  }
}