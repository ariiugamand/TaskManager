// FILE: backend/routes/tasks.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

router.use(authenticateToken);

router.get('/types', taskController.getTypes);
router.get('/', taskController.getAll);
router.get('/:id', taskController.getById);
router.post('/', taskController.create);
router.put('/:id', taskController.update);
router.delete('/:id', taskController.delete);

module.exports = router;
