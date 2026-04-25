const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/chat', authMiddleware, aiController.getAiAdvice);

module.exports = router;
