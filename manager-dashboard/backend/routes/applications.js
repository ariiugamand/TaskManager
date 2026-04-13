// FILE: backend/routes/applications.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const applicationController = require('../controllers/applicationController');

router.use(authenticateToken);

router.get('/types', applicationController.getTypes);
router.get('/', applicationController.getAll);
router.get('/:id', applicationController.getById);
router.put('/:id/review', applicationController.review);

module.exports = router;
