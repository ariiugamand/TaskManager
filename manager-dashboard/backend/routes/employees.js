// FILE: backend/routes/employees.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');

router.use(authenticateToken);

router.get('/', employeeController.getAll);
router.get('/:id', employeeController.getById);

module.exports = router;
