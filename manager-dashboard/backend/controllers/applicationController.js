// FILE: backend/controllers/applicationController.js
const applicationService = require('../services/applicationService');

const applicationController = {
  getAll(req, res) {
    try {
      const { status, type_id, date_from, date_to } = req.query;
      const apps = applicationService.getApplications(req.user.id_department, {
        status, type_id, date_from, date_to
      });
      res.json(apps);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getById(req, res) {
    try {
      const app = applicationService.getById(req.params.id, req.user.id_department);
      if (!app) return res.status(404).json({ error: 'Заявление не найдено' });
      res.json(app);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  review(req, res) {
    try {
      const { status, reviewed_result, comment } = req.body;
      if (!status) return res.status(400).json({ error: 'Статус обязателен' });

      const result = applicationService.review(
        req.params.id,
        req.user.id_department,
        req.user.employee_id,
        { status, reviewed_result, comment }
      );
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  getTypes(req, res) {
    try {
      res.json(applicationService.getTypes());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = applicationController;
