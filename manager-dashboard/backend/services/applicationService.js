// FILE: backend/services/applicationService.js
const { db } = require('../db');

const applicationService = {
  getApplications(departmentId, filters = {}) {
    let query = `
      SELECT a.*, at.name as type_name,
             emp.full_name as employee_name,
             rev.full_name as reviewer_name
      FROM Application a
      JOIN ApplicationType at ON a.id_type = at.id
      JOIN Employee emp ON a.id_employee = emp.id
      LEFT JOIN Employee rev ON a.id_reviewed = rev.id
      WHERE emp.id_department = ?
    `;
    const params = [departmentId];

    if (filters.status) {
      query += ' AND a.status = ?';
      params.push(filters.status);
    }
    if (filters.type_id) {
      query += ' AND a.id_type = ?';
      params.push(filters.type_id);
    }
    if (filters.date_from) {
      query += ' AND a.created_date >= ?';
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      query += ' AND a.created_date <= ?';
      params.push(filters.date_to + 'T23:59:59');
    }

    query += ' ORDER BY a.created_date DESC';
    return db.prepare(query).all(...params);
  },

  getById(id, departmentId) {
    return db.prepare(`
      SELECT a.*, at.name as type_name,
             emp.full_name as employee_name,
             rev.full_name as reviewer_name
      FROM Application a
      JOIN ApplicationType at ON a.id_type = at.id
      JOIN Employee emp ON a.id_employee = emp.id
      LEFT JOIN Employee rev ON a.id_reviewed = rev.id
      WHERE a.id = ? AND emp.id_department = ?
    `).get(id, departmentId);
  },

  review(id, departmentId, reviewerEmployeeId, { status, reviewed_result, comment }) {
    const app = db.prepare(`
      SELECT a.id FROM Application a
      JOIN Employee emp ON a.id_employee = emp.id
      WHERE a.id = ? AND emp.id_department = ?
    `).get(id, departmentId);

    if (!app) throw { status: 404, message: 'Заявление не найдено' };

    if (!['approved', 'rejected'].includes(status)) {
      throw { status: 400, message: 'Статус должен быть approved или rejected' };
    }

    db.prepare(`
      UPDATE Application
      SET status = ?, id_reviewed = ?, reviewed_result = ?, comment = COALESCE(?, comment)
      WHERE id = ?
    `).run(status, reviewerEmployeeId, reviewed_result, comment, id);

    return { success: true };
  },

  getTypes() {
    return db.prepare('SELECT * FROM ApplicationType ORDER BY name').all();
  }
};

module.exports = applicationService;
