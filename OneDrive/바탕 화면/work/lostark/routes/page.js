const express = require('express');
const pageController = require('../controllers/pageController');

const router = express.Router();

router.get('/', pageController.renderHome);
router.get('/c/:name', pageController.renderDashboard);

module.exports = router;
