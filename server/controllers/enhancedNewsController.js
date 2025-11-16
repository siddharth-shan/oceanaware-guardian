import { EnhancedNewsService } from '../services/enhancedNewsService.js';

export class EnhancedNewsController {
  constructor() {
    this.newsService = new EnhancedNewsService();
  }

  /**
   * Get fire-related news with enhanced California sources
   * GET /api/news/enhanced/fire-related
   */
  async getFireRelatedNews(req, res) {
    try {
      const { lat, lng, location, state, limit = 20, category = 'all' } = req.query;
      
      // Validate required parameters
      if (!lat || !lng) {
        return res.status(400).json({
          error: 'Missing required parameters',
          message: 'Latitude and longitude are required',
          required: ['lat', 'lng']
        });
      }

      // Parse location
      const userLocation = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        displayName: location || 'Unknown Location',
        state: state || 'California'
      };

      // Options for news aggregation
      const options = {
        limit: Math.min(parseInt(limit), 50), // Cap at 50 articles
        category: category !== 'all' ? category : undefined
      };

      console.log(`📰 Enhanced news request for location: ${JSON.stringify(userLocation, null, 2)}`);
      console.log(`📰 Options: ${JSON.stringify(options, null, 2)}`);

      // Fetch news from enhanced service
      const result = await this.newsService.aggregateFireNews(userLocation, options);
      
      // Add metadata
      const response = {
        ...result,
        metadata: {
          location: userLocation,
          timestamp: new Date().toISOString(),
          sources_queried: result.sources.length,
          total_fetched: result.totalFetched,
          after_deduplication: result.afterDeduplication,
          returned: result.articles.length,
          has_errors: result.errors.length > 0
        }
      };

      console.log(`📰 Enhanced news response: ${result.articles.length} articles from ${result.sources.length} sources`);
      
      res.json(response);
    } catch (error) {
      console.error('Enhanced news service error:', error);
      
      res.status(500).json({
        error: 'Enhanced news service error',
        message: error.message,
        articles: [],
        sources: [],
        errors: [error.message]
      });
    }
  }

  

  /**
   * Get available news sources status
   * GET /api/news/enhanced/sources
   */
  async getSourcesStatus(req, res) {
    try {
      const sources = await this.newsService.getAvailableSources();
      
      res.json({
        sources,
        metadata: {
          total_sources: sources.length,
          active_sources: sources.filter(s => s.status === 'active').length,
          trusted_sources: sources.filter(s => s.trusted).length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Sources status error:', error);
      res.status(500).json({
        error: 'Sources status error',
        message: error.message,
        sources: []
      });
    }
  }

  /**
   * Get news by category
   * GET /api/news/enhanced/category/:category
   */
  async getNewsByCategory(req, res) {
    try {
      const { category } = req.params;
      const { lat, lng, location, state, limit = 15 } = req.query;
      
      const validCategories = ['evacuation', 'containment', 'warning', 'air_quality', 'new_fire', 'general'];
      
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          error: 'Invalid category',
          message: `Category must be one of: ${validCategories.join(', ')}`,
          valid_categories: validCategories
        });
      }

      const userLocation = lat && lng ? {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        displayName: location || 'Unknown Location',
        state: state || 'California'
      } : null;

      const options = {
        limit: parseInt(limit),
        category
      };

      const result = await this.newsService.aggregateFireNews(userLocation, options);
      
      // Filter by category
      const categoryNews = result.articles.filter(article => 
        article.category === category
      );

      res.json({
        articles: categoryNews,
        category,
        metadata: {
          location: userLocation,
          timestamp: new Date().toISOString(),
          category_count: categoryNews.length,
          total_available: result.articles.length
        }
      });
    } catch (error) {
      console.error('Category news error:', error);
      res.status(500).json({
        error: 'Category news service error',
        message: error.message,
        articles: []
      });
    }
  }

  /**
   * Search news articles
   * GET /api/news/enhanced/search
   */
  async searchNews(req, res) {
    try {
      const { q: query, lat, lng, location, state, limit = 20 } = req.query;
      
      if (!query || query.trim().length < 3) {
        return res.status(400).json({
          error: 'Invalid search query',
          message: 'Query must be at least 3 characters long'
        });
      }

      const userLocation = lat && lng ? {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        displayName: location || 'Unknown Location',
        state: state || 'California'
      } : null;

      const options = { limit: parseInt(limit) };
      const result = await this.newsService.aggregateFireNews(userLocation, options);
      
      // Filter articles by search query
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      const searchResults = result.articles.filter(article => {
        const searchText = (article.title + ' ' + (article.description || '')).toLowerCase();
        return searchTerms.some(term => searchText.includes(term));
      });

      res.json({
        articles: searchResults,
        query,
        metadata: {
          location: userLocation,
          timestamp: new Date().toISOString(),
          search_terms: searchTerms,
          results_count: searchResults.length,
          total_searched: result.articles.length
        }
      });
    } catch (error) {
      console.error('Search news error:', error);
      res.status(500).json({
        error: 'Search news service error',
        message: error.message,
        articles: []
      });
    }
  }
}