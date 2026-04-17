const express = require('express');
const router = express.Namespace ? express.Namespace() : express.Router();
const newsService = require('../services/newsService');

/**
 * GET /api/news
 * Returns the current list of transit news.
 */
router.get('/', (req, res) => {
  try {
    const news = newsService.getNews();
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

module.exports = router;
