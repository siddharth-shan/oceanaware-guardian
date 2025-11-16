import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

/**
 * Enhanced News Service with Reliable California Fire Sources
 * 
 * Sources:
 * 1. CAL FIRE RSS Feeds (Official)
 * 2. CAL FIRE Incident Information (API/Scraping)
 * 3. KTLA Fire News (RSS)
 * 4. LA Times Fire Coverage (RSS)
 * 5. ABC7 Fire News (RSS)
 * 6. InciWeb National (RSS)
 * 7. NewsAPI (Professional aggregator)
 * 8. Reddit (Community)
 */
export class EnhancedNewsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes for news
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    
    // Comprehensive California fire news sources
    this.sources = [
      {
        name: 'CAL_FIRE_INCIDENTS_API',
        type: 'api',
        trusted: true,
        priority: 1,
        url: 'https://incidents.fire.ca.gov/umbraco/api/IncidentApi/GeoJsonList?year=2025&inactive=false',
        description: 'CAL FIRE Official Incidents GeoJSON API'
      },
      {
        name: 'CAL_FIRE_RSS',
        type: 'rss',
        trusted: true,
        priority: 1,
        enabled: false,
        description: 'CAL FIRE Official Incidents RSS Feed'
      },
      {
        name: 'CAL_FIRE_NEWS',
        type: 'rss',
        trusted: true,
        priority: 1,
        enabled: false,
        description: 'CAL FIRE Official News RSS Feed'
      },
      {
        name: 'KTLA_FIRE',
        type: 'rss',
        trusted: true,
        priority: 2,
        enabled: false,
        description: 'KTLA Fire News Coverage'
      },
      {
        name: 'LATIMES_FIRE',
        type: 'rss',
        trusted: true,
        priority: 2,
        enabled: false,
        description: 'LA Times Fire Coverage'
      },
      {
        name: 'ABC7_FIRE',
        type: 'rss',
        trusted: true,
        priority: 2,
        enabled: false,
        description: 'ABC7 Fire News'
      },
      {
        name: 'INCIWEB',
        type: 'rss',
        trusted: true,
        priority: 3,
        enabled: false,
        description: 'InciWeb National Fire Information'
      },
      {
        name: 'NIFC_REPORTS',
        type: 'rss',
        trusted: true,
        priority: 3,
        enabled: false,
        description: 'National Interagency Fire Center Reports'
      },
      {
        name: 'NewsAPI',
        type: 'api',
        trusted: true,
        priority: 4,
        enabled: !!process.env.NEWSAPI_KEY,
        description: 'Professional news aggregator'
      },
      {
        name: 'Reddit',
        type: 'community',
        trusted: false,
        priority: 5,
        enabled: true,
        description: 'Community discussions and reports'
      }
    ];
  }

  async aggregateFireNews(location, options = {}) {
    const cacheKey = this.generateCacheKey(location, options);
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📰 Returning cached enhanced news aggregation');
        return cached.data;
      }
    }

    const articles = [];
    const sources = [];
    const errors = [];

    // Fetch from all sources in parallel, prioritized by reliability
    const promises = this.sources
      .filter(source => source.enabled !== false)
      .map(async (source) => {
        try {
          console.log(`📰 Fetching from ${source.name}...`);
          
          let result;
          switch (source.type) {
            case 'rss':
              result = await this.fetchFromRSS(source, location, options);
              break;
            case 'api':
              if (source.name === 'NewsAPI') {
                result = await this.fetchFromNewsAPI(location, options);
              } else if (source.name === 'CAL_FIRE_INCIDENTS_API') {
                result = await this.fetchFromCalFireGeoJSON(source, location, options);
              }
              break;
            case 'community':
              if (source.name === 'Reddit') {
                result = await this.fetchFromReddit(location, options);
              }
              break;
            default:
              throw new Error(`Unknown source type: ${source.type}`);
          }
          
          return { ...result, priority: source.priority };
        } catch (err) {
          console.warn(`📰 Failed to fetch from ${source.name}:`, err.message);
          errors.push(`${source.name}: ${err.message}`);
          return { articles: [], source: source.name, priority: source.priority };
        }
      });

    const results = await Promise.all(promises);
    
    // Aggregate and prioritize results
    results.forEach(result => {
      if (result.articles && result.articles.length > 0) {
        // Add priority weight to articles
        const prioritizedArticles = result.articles.map(article => ({
          ...article,
          priorityWeight: result.priority,
          sourcePriority: result.priority
        }));
        
        articles.push(...prioritizedArticles);
        sources.push(result.source);
      }
    });

    // Enhanced sorting with priority, relevance, and recency
    const sortedArticles = this.sortArticlesByPriorityAndRelevance(articles, location);
    
    // Deduplicate similar articles
    const deduplicatedArticles = this.deduplicateArticles(sortedArticles);
    
    // Filter articles to the last 2 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const recentArticles = deduplicatedArticles.filter(article => {
      if (!article.publishedAt) return false;
      const articleDate = new Date(article.publishedAt);
      return articleDate.getTime() > twoDaysAgo.getTime();
    });

    const limitedArticles = sortedArticles.slice(0, options.limit || 20);
            
    // Limit results
    const result = {
      articles: recentArticles,
      sources,
      errors,
      totalFetched: articles.length,
      afterDeduplication: deduplicatedArticles.length
    };
    
    // Cache result
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    console.log(`📰 Enhanced news aggregation complete: ${recentArticles.length} articles from ${sources.length} sources`);
    return result;
  }

  async fetchFromRSS(source, location, options) {
    const response = await fetch(source.url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'EcoQuest-Wildfire-Watch/1.0 (+https://example.com/contact)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    const xmlDoc = this.xmlParser.parse(xmlText);
    
    // Handle different RSS structures
    let items = [];
    if (xmlDoc.rss?.channel?.item) {
      items = Array.isArray(xmlDoc.rss.channel.item) 
        ? xmlDoc.rss.channel.item 
        : [xmlDoc.rss.channel.item];
    } else if (xmlDoc.feed?.entry) {
      // Atom feed format
      items = Array.isArray(xmlDoc.feed.entry) 
        ? xmlDoc.feed.entry 
        : [xmlDoc.feed.entry];
    }

    const articles = items
      .filter(item => this.isFireRelated(
        (item.title || item.summary || '') + ' ' + (item.description || item.content || '')
      ))
      .map((item, index) => {
        const title = item.title || item.summary || 'No title';
        const description = item.description || item.content || item.summary || '';
        const link = item.link?.["@_href"] || item.link || item.guid || '';
        const pubDate = item.pubDate || item.published || item['dc:date'] || new Date().toISOString();
        
        return {
          id: `${source.name.toLowerCase()}_${Date.parse(pubDate)}_${index}`,
          title: this.cleanText(title),
          description: this.cleanText(description),
          url: link,
          source: source.name,
          publishedAt: this.parseDate(pubDate),
          trusted: source.trusted,
          location: this.extractLocationFromText(title + ' ' + description) || 
                   (location ? location.displayName : 'California'),
          relevanceScore: this.calculateRelevanceScore({ title, description }, location),
          category: this.categorizeFireNews(title + ' ' + description)
        };
      })
      .filter(article => article.relevanceScore > 0.1); // Filter out very low relevance

    return { articles, source: source.name };
  }

  async fetchFromNewsAPI(location, options) {
    if (!process.env.NEWSAPI_KEY) {
      throw new Error('NewsAPI key not configured');
    }

    // Enhanced keywords for California fire news
    const keywords = [
      'California wildfire'
    ];
    
    let query = keywords.join(' OR ');
    
    if (location && location.state) {
      query += ` AND ("${location.state}" OR California)`;
    }

    const params = new URLSearchParams({
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: Math.min(options.limit || 15, 50),
      apiKey: process.env.NEWSAPI_KEY
    });

    const response = await fetch(`https://newsapi.org/v2/everything?${params}`, {
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();
    const articles = data.articles
      .filter(article => this.isFireRelated(article.title + ' ' + (article.description || '')))
      .map(article => ({
        id: `newsapi_${this.generateArticleId(article.url)}`,
        title: article.title,
        description: article.description,
        url: article.url,
        source: 'NewsAPI',
        publishedAt: article.publishedAt,
        trusted: true,
        location: this.extractLocationFromText(article.title + ' ' + (article.description || '')) ||
                 (location ? location.displayName : 'California'),
        relevanceScore: this.calculateRelevanceScore(article, location),
        category: this.categorizeFireNews(article.title + ' ' + (article.description || ''))
      }));

    return { articles, source: 'NewsAPI' };
  }

  async fetchFromReddit(location, options) {
    const subreddits = [
      'CaliforniaFires', 
      'Wildfire', 
      'California', 
      'LosAngeles',
      'SanFrancisco',
      'Sacramento',
      'sandiego',
      'firefighting',
      'CaliforniaDisasters'
    ];
    
    const articles = [];

    for (const subreddit of subreddits) {
      try {
        const response = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=25`, {
          timeout: 8000,
          headers: {
            'User-Agent': 'EcoQuest-Wildfire-Watch/1.0'
          }
        });

        if (!response.ok) continue;

        const data = await response.json();
        
        if (data.data && data.data.children) {
          const posts = data.data.children
            .filter(post => this.isFireRelated(post.data.title + ' ' + (post.data.selftext || '')))
            .map(post => ({
              id: `reddit_${post.data.id}`,
              title: post.data.title,
              description: post.data.selftext ? 
                this.truncateText(post.data.selftext, 300) : 
                `Discussion in r/${subreddit}`,
              url: `https://reddit.com${post.data.permalink}`,
              source: 'Reddit',
              publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
              trusted: false,
              location: this.extractLocationFromText(post.data.title + ' ' + (post.data.selftext || '')) ||
                       subreddit.replace('California', 'California').replace(/([A-Z])/g, ' $1').trim(),
              relevanceScore: this.calculateRelevanceScore({
                title: post.data.title,
                description: post.data.selftext
              }, location),
              category: this.categorizeFireNews(post.data.title + ' ' + (post.data.selftext || ''))
            }));
          
          articles.push(...posts);
        }
      } catch (err) {
        console.warn(`Failed to fetch from r/${subreddit}:`, err.message);
      }
    }

    return { articles, source: 'Reddit' };
  }

  async fetchFromCalFireGeoJSON(source, location, options) {
    try {
      const response = await fetch(source.url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'EcoQuest-Wildfire-Watch/1.0 (+https://example.com/contact)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`CAL FIRE GeoJSON fetch failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const articles = [];

      if (data.features) {
        data.features.forEach(feature => {
          const properties = feature.properties;
          if (properties && this.isFireRelated(properties.IncidentName || '')) {
            articles.push({
              id: `calfire_${properties.UniqueId}`,
              title: properties.IncidentName || 'Unknown Fire Incident',
              description: properties.IncidentType || properties.SearchDescription || '',
              url: properties.CanonicalUrl || '',
              source: source.name,
              publishedAt: properties.Started || new Date().toISOString(),
              trusted: true,
              location: properties.Location || properties.County || 'California',
              relevanceScore: this.calculateRelevanceScore({
                title: properties.IncidentName,
                description: properties.IncidentType
              }, location),
              category: this.categorizeFireNews(properties.IncidentName || '')
            });
          }
        });
      }
      return { articles, source: source.name };
    } catch (err) {
      console.warn(`Failed to fetch from ${source.name}:`, err.message);
      throw err; // Re-throw to be caught by aggregateFireNews
    }
  }

  categorizeFireNews(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('evacuation') || lowerText.includes('evacuate') || lowerText.includes('mandatory')) {
      return 'evacuation';
    }
    if (lowerText.includes('contained') || lowerText.includes('containment')) {
      return 'containment';
    }
    if (lowerText.includes('red flag') || lowerText.includes('warning') || lowerText.includes('watch')) {
      return 'warning';
    }
    if (lowerText.includes('air quality') || lowerText.includes('smoke')) {
      return 'air_quality';
    }
    if (lowerText.includes('started') || lowerText.includes('broke out') || lowerText.includes('ignited')) {
      return 'new_fire';
    }
    
    return 'general';
  }

  isFireRelated(text) {
    const fireKeywords = [
      'wildfire', 'forest fire', 'brush fire', 'bushfire', 'grass fire', 'fire season',
      'red flag warning', 'fire danger', 'containment', 'acreage', 'smoke', 'air quality',
      'cal fire', 'nifc', 'inciweb', 'fire line', 'fire break', 'controlled burn', 'prescribed burn',
      'fire suppression', 'fire management', 'fire behavior', 'fire perimeter', 'fire map',
      'evacuation order', 'evacuation warning', 'public safety power shutoff', 'psps',
      'fire', 'burn', 'blaze', 'flame', 'firefighter', 'hotshot', 'fire department', 'fire service'
    ];
    
    const lowerText = text.toLowerCase();
    return fireKeywords.some(keyword => lowerText.includes(keyword));
  }

  extractLocationFromText(text) {
    const californiaLocations = [
      // Major cities
      'los angeles', 'san francisco', 'san diego', 'sacramento', 'fresno',
      'oakland', 'bakersfield', 'riverside', 'stockton', 'anaheim',
      'santa ana', 'irvine', 'chula vista', 'fremont', 'san bernardino',
      
      // Counties
      'orange county', 'ventura county', 'riverside county', 'san bernardino county',
      'kern county', 'tulare county', 'imperial county', 'inyo county',
      'mono county', 'madera county', 'fresno county', 'kings county',
      
      // Fire-prone areas
      'ventura', 'santa barbara', 'monterey', 'napa', 'sonoma',
      'marin', 'santa cruz', 'san mateo', 'alameda', 'contra costa',
      'solano', 'yolo', 'placer', 'el dorado', 'amador', 'calaveras',
      'tuolumne', 'mariposa', 'merced', 'stanislaus', 'san joaquin',
      
      // Specific fire-prone regions
      'santa monica mountains', 'angeles national forest', 'cleveland national forest',
      'los padres national forest', 'mendocino national forest', 'shasta trinity',
      'tahoe', 'big sur', 'malibu', 'santa clarita', 'thousand oaks',
      'simi valley', 'redlands', 'yucaipa', 'banning', 'cabazon'
    ];
    
    const lowerText = text.toLowerCase();
    for (const location of californiaLocations) {
      if (lowerText.includes(location)) {
        return location.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }
    
    return null;
  }

  calculateRelevanceScore(article, userLocation) {
    let score = 0;
    
    const emergencyKeywords = ['evacuation', 'emergency', 'mandatory', 'immediate', 'critical'];
    const fireKeywords = ['wildfire', 'fire', 'burn', 'burning', 'containment'];
    const urgentKeywords = ['alert', 'warning', 'danger', 'threat', 'evacuate'];
    const localKeywords = ['cal fire', 'calfire', 'california'];
    
    const text = (article.title + ' ' + (article.description || '')).toLowerCase();
    
    // Emergency content gets highest priority
    emergencyKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.4;
    });
    
    // Fire-specific content
    fireKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.3;
    });
    
    // Urgent information
    urgentKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.2;
    });
    
    // Local relevance
    localKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.2;
    });
    
    // Geographic relevance
    if (userLocation && article.location) {
      const userState = userLocation.state?.toLowerCase() || '';
      const articleLoc = article.location.toLowerCase();
      
      if (articleLoc.includes(userState) || userState.includes('california')) {
        score += 0.3;
      }
      
      // Check for city/county match
      if (userLocation.displayName) {
        const userCity = userLocation.displayName.toLowerCase();
        if (articleLoc.includes(userCity.split(',')[0])) {
          score += 0.4;
        }
      }
    }
    
    // Recency boost
    if (article.publishedAt) {
      const hoursOld = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
      if (hoursOld < 2) score += 0.3;
      else if (hoursOld < 6) score += 0.2;
      else if (hoursOld < 24) score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  sortArticlesByPriorityAndRelevance(articles, location) {
    return articles
      .filter(article => article && article.title)
      .sort((a, b) => {
        // First priority: source priority (lower number = higher priority)
        const priorityDiff = (a.sourcePriority || 5) - (b.sourcePriority || 5);
        if (priorityDiff !== 0) return priorityDiff;
        
        // Second priority: relevance score
        const scoreDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
        if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
        
        // Third priority: recency
        const aTime = new Date(a.publishedAt || 0).getTime();
        const bTime = new Date(b.publishedAt || 0).getTime();
        return bTime - aTime;
      });
  }

  deduplicateArticles(articles) {
    const seen = new Map();
    const deduplicated = [];
    
    articles.forEach(article => {
      // Create multiple fingerprints for robust deduplication
      const titleWords = article.title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => word.length > 2)
        .sort();
      
      // Primary fingerprint: core meaningful words from title
      const primaryFingerprint = titleWords
        .filter(word => !['the', 'and', 'for', 'with', 'from', 'near', 'fire', 'wildfire', 'california'].includes(word))
        .slice(0, 4)
        .join(' ');
      
      // Secondary fingerprint: URL-based deduplication
      const urlFingerprint = article.url ? 
        article.url.split('/').pop()?.replace(/[^\w]/g, '').substring(0, 20) : 
        null;
      
      // Tertiary fingerprint: exact title match
      const exactTitleFingerprint = article.title.toLowerCase().trim();
      
      // Quaternary fingerprint: similar title pattern (for cases like "Teen Suspected..." variations)
      const patternFingerprint = article.title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Check if we've seen this article before using any fingerprint
      const isDuplicate = seen.has(primaryFingerprint) || 
                         (urlFingerprint && seen.has(urlFingerprint)) ||
                         seen.has(exactTitleFingerprint) ||
                         seen.has(patternFingerprint);
      
      if (!isDuplicate) {
        // Mark all fingerprints as seen
        seen.set(primaryFingerprint, true);
        if (urlFingerprint) seen.set(urlFingerprint, true);
        seen.set(exactTitleFingerprint, true);
        seen.set(patternFingerprint, true);
        
        deduplicated.push(article);
      }
    });
    
    console.log(`📰 Deduplication: ${articles.length} articles -> ${deduplicated.length} unique articles`);
    return deduplicated;
  }

  // Utility methods
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  parseDate(dateString) {
    try {
      return new Date(dateString).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  generateArticleId(url) {
    return url.split('/').pop()?.replace(/[^\w]/g, '').substring(0, 10) || 
           Math.random().toString(36).substring(2, 12);
  }

  generateCacheKey(location, options) {
    const locationKey = location ? `${location.lat}_${location.lng}` : 'general';
    const optionsKey = `${options.limit || 20}_${options.category || 'all'}`;
    return `enhanced_news_${locationKey}_${optionsKey}`;
  }

  async getAvailableSources() {
    return this.sources.map(source => ({
      ...source,
      status: source.enabled !== false ? 'active' : 'disabled',
      lastCheck: new Date().toISOString()
    }));
  }
}