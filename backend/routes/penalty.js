const express = require('express');
const router = express.Router();
const { calculateDynamicPenalty } = require('../controllers/penaltyController');

router.post('/calculate', calculateDynamicPenalty);

module.exports = router;
