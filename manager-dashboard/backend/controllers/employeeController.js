// FILE: backend/controllers/employeeController.js
const employeeService = require('../services/employeeService');

const employeeController = {
  getAll(req, res) {
    try {
      const employees = employeeService.getByDepartment(req.user.id_department);
      res.json(employees);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getById(req, res) {
    try {
      const emp = employeeService.getById(req.params.id, req.user.id_department);
      if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });
      res.json(emp);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = employeeController;
