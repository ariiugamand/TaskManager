// FILE: backend/controllers/eventController.js
const eventService = require('../services/eventService');

const eventController = {
  getAll(req, res) {
    try {
      const events = eventService.getEvents(req.user.id_department, req.query.month);
      res.json(events);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getById(req, res) {
    try {
      const event = eventService.getById(req.params.id, req.user.id_department);
      if (!event) return res.status(404).json({ error: 'Событие не найдено' });
      res.json(event);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  create(req, res) {
    try {
      const { name, event_date } = req.body;
      if (!name || !event_date) return res.status(400).json({ error: 'Название и дата обязательны' });
      const result = eventService.create(req.user.id_department, req.user.employee_id, req.body);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  update(req, res) {
    try {
      const result = eventService.update(req.params.id, req.user.id_department, req.body);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  delete(req, res) {
    try {
      const result = eventService.delete(req.params.id, req.user.id_department);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  notify(req, res) {
    try {
      const { employee_ids } = req.body; // null/'all' or array of ids
      const result = eventService.notify(req.params.id, req.user.id_department, employee_ids || 'all');
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
};

module.exports = eventController;
