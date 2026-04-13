// FILE: backend/routes/schedule.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const scheduleController = require('../controllers/scheduleController');

router.use(authenticateToken);

// Static sub-routes MUST be before /:id to avoid conflicts
router.get('/wishes', scheduleController.getWishes);
router.post('/wishes', scheduleController.addWish);
router.post('/change-request', scheduleController.changeRequest);

router.get('/', scheduleController.getSchedule);
router.post('/', scheduleController.upsertShift);
router.delete('/:id', scheduleController.deleteShift);

module.exports = router;
