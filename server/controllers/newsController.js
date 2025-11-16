import { NewsDataService } from '../services/newsDataService.js';

const newsService = new NewsDataService();

/**
 * Get fire-related news and social content
 */
export const getFireRelatedNews = async (location, options = {}) => {
  try {
    console.log('📰 Fetching fire-related news for location:', location);
    
    const result = await newsService.aggregateFireNews(location, options);
    
    console.log(`📰 Found ${result.articles.length} news articles from ${result.sources.length} sources`);
    
    return result;
  } catch (error) {
    console.error('❌ News controller error:', error);
    throw new Error('Failed to fetch fire-related news: ' + error.message);
  }
};

/**
 * Get available news sources and their status
 */
export const getNewsSources = async () => {
  try {
    const sources = await newsService.getAvailableSources();
    
    return sources.map(source => ({
      name: source.name,
      type: source.type,
      trusted: source.trusted,
      status: source.status,
      lastCheck: source.lastCheck,
      description: source.description
    }));
  } catch (error) {
    console.error('❌ News sources controller error:', error);
    throw new Error('Failed to fetch news sources: ' + error.message);
  }
};