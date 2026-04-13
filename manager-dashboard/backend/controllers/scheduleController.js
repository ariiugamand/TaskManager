// FILE: backend/controllers/scheduleController.js
const scheduleService = require('../services/scheduleService');

const scheduleController = {
  getSchedule(req, res) {
    try {
      const month = req.query.month || new Date().toISOString().slice(0, 7);
      const data = scheduleService.getMonthSchedule(req.user.id_department, month);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  upsertShift(req, res) {
    try {
      const result = scheduleService.upsertShift(req.user.id_department, req.body);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  deleteShift(req, res) {
    try {
      const result = scheduleService.deleteShift(req.params.id, req.user.id_department);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  getWishes(req, res) {
    try {
      const month = req.query.month || new Date().toISOString().slice(0, 7);
      const data = scheduleService.getWishes(req.user.id_department, month);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  addWish(req, res) {
    try {
      const result = scheduleService.addWish(req.user.id_department, req.body);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  changeRequest(req, res) {
    try {
      const result = scheduleService.createChangeRequest(
        req.user.id_department,
        req.user.employee_id,
        req.body
      );
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
};

module.exports = scheduleController;
