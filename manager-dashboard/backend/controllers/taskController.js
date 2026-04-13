// FILE: backend/controllers/taskController.js
const taskService = require('../services/taskService');

const taskController = {
  getAll(req, res) {
    try {
      const tasks = taskService.getTasks(req.user.id_department, req.query.month);
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getById(req, res) {
    try {
      const task = taskService.getById(req.params.id, req.user.id_department);
      if (!task) return res.status(404).json({ error: 'Задача не найдена' });
      res.json(task);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  create(req, res) {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Название задачи обязательно' });
      const result = taskService.create(req.user.id_department, req.user.employee_id, req.body);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  update(req, res) {
    try {
      const result = taskService.update(req.params.id, req.user.id_department, req.body);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  delete(req, res) {
    try {
      const result = taskService.delete(req.params.id, req.user.id_department);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  getTypes(req, res) {
    try {
      res.json(taskService.getTaskTypes());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = taskController;
