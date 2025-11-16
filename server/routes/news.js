import express from 'express';
import { getFireRelatedNews, getNewsSources } from '../controllers/newsController.js';

const router = express.Router();

/**
 * @route GET /api/news/fire-related
 * @desc Get fire-related news and social content
 * @access Public
 */
router.get('/fire-related', async (req, res) => {
  try {
    const { lat, lng, location, state, limit = 15, radius = 100 } = req.query;
    
    const locationData = lat && lng ? {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      displayName: location || 'Unknown Location',
      state: state || 'California'
    } : null;

    const options = {
      limit: parseInt(limit),
      radius: parseInt(radius)
    };

    const newsData = await getFireRelatedNews(locationData, options);
    
    res.json({
      success: true,
      articles: newsData.articles,
      metadata: {
        location: locationData,
        sources: newsData.sources,
        timestamp: new Date().toISOString(),
        totalFound: newsData.articles.length,
        filters: options
      }
    });
  } catch (error) {
    console.error('News route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news data',
      message: error.message
    });
  }
});

/**
 * @route GET /api/news/sources
 * @desc Get available news sources and their status
 * @access Public
 */
router.get('/sources', async (req, res) => {
  try {
    const sources = await getNewsSources();
    res.json({
      success: true,
      sources
    });
  } catch (error) {
    console.error('News sources route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news sources',
      message: error.message
    });
  }
});

export default router;