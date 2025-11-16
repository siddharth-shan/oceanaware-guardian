import express from 'express';
import { EnhancedNewsController } from '../controllers/enhancedNewsController.js';

const router = express.Router();
const newsController = new EnhancedNewsController();

/**
 * Enhanced News Routes
 * 
 * These routes provide access to the enhanced news service with reliable
 * California fire news sources including CAL FIRE, KTLA, LA Times, and more.
 */

/**
 * @route GET /api/news/enhanced/fire-related
 * @desc Get fire-related news from enhanced California sources
 * @query {number} lat - Latitude
 * @query {number} lng - Longitude  
 * @query {string} [location] - Location display name
 * @query {string} [state] - State (defaults to California)
 * @query {number} [limit=20] - Maximum articles to return
 * @query {string} [category=all] - News category filter
 */
router.get('/fire-related', (req, res) => {
  newsController.getFireRelatedNews(req, res);
});



/**
 * @route GET /api/news/enhanced/sources
 * @desc Get status of available news sources
 */
router.get('/sources', (req, res) => {
  newsController.getSourcesStatus(req, res);
});

/**
 * @route GET /api/news/enhanced/category/:category
 * @desc Get news by specific category
 * @param {string} category - News category (evacuation, containment, warning, air_quality, new_fire, general)
 * @query {number} [lat] - Latitude
 * @query {number} [lng] - Longitude
 * @query {string} [location] - Location display name
 * @query {string} [state] - State
 * @query {number} [limit=15] - Maximum articles to return
 */
router.get('/category/:category', (req, res) => {
  newsController.getNewsByCategory(req, res);
});

/**
 * @route GET /api/news/enhanced/search
 * @desc Search news articles
 * @query {string} q - Search query (minimum 3 characters)
 * @query {number} [lat] - Latitude
 * @query {number} [lng] - Longitude
 * @query {string} [location] - Location display name
 * @query {string} [state] - State
 * @query {number} [limit=20] - Maximum articles to return
 */
router.get('/search', (req, res) => {
  newsController.searchNews(req, res);
});

export default router;