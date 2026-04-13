// FILE: backend/routes/events.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const eventController = require('../controllers/eventController');

router.use(authenticateToken);

router.get('/', eventController.getAll);
router.get('/:id', eventController.getById);
router.post('/', eventController.create);
router.put('/:id', eventController.update);
router.delete('/:id', eventController.delete);
router.post('/:id/notify', eventController.notify);

module.exports = router;
