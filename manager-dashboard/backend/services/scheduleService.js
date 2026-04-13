// FILE: backend/services/scheduleService.js
const { db } = require('../db');

const scheduleService = {
  getMonthSchedule(departmentId, month) {
    // month = 'YYYY-MM'
    const schedules = db.prepare(`
      SELECT ws.id, ws.id_employee, ws.work_date, ws.start_time, ws.end_time,
             e.full_name
      FROM WorkSchedule ws
      JOIN Employee e ON ws.id_employee = e.id
      WHERE e.id_department = ? AND ws.work_date LIKE ?
      ORDER BY ws.work_date, e.full_name
    `).all(departmentId, `${month}%`);

    return schedules;
  },

  getWishes(departmentId, month) {
    return db.prepare(`
      SELECT sw.id, sw.id_employee, sw.wish_date, sw.preferred_start, sw.preferred_end, sw.note,
             e.full_name
      FROM EmployeeScheduleWish sw
      JOIN Employee e ON sw.id_employee = e.id
      WHERE e.id_department = ? AND sw.wish_date LIKE ?
      ORDER BY sw.wish_date
    `).all(departmentId, `${month}%`);
  },

  upsertShift(departmentId, { id_employee, work_date, start_time, end_time }) {
    // Verify employee belongs to department
    const emp = db.prepare('SELECT id FROM Employee WHERE id = ? AND id_department = ?').get(id_employee, departmentId);
    if (!emp) throw { status: 403, message: 'Сотрудник не из вашего отдела' };

    const existing = db.prepare(`
      SELECT id FROM WorkSchedule WHERE id_employee = ? AND work_date = ?
    `).get(id_employee, work_date);

    if (existing) {
      db.prepare(`
        UPDATE WorkSchedule SET start_time = ?, end_time = ? WHERE id = ?
      `).run(start_time, end_time, existing.id);
      return { id: existing.id, updated: true };
    } else {
      const r = db.prepare(`
        INSERT INTO WorkSchedule (id_employee, work_date, start_time, end_time) VALUES (?, ?, ?, ?)
      `).run(id_employee, work_date, start_time, end_time);
      return { id: r.lastInsertRowid, created: true };
    }
  },

  deleteShift(id, departmentId) {
    const shift = db.prepare(`
      SELECT ws.id FROM WorkSchedule ws
      JOIN Employee e ON ws.id_employee = e.id
      WHERE ws.id = ? AND e.id_department = ?
    `).get(id, departmentId);

    if (!shift) throw { status: 404, message: 'Смена не найдена' };
    db.prepare('DELETE FROM WorkSchedule WHERE id = ?').run(id);
    return { success: true };
  },

  addWish(departmentId, { id_employee, wish_date, preferred_start, preferred_end, note }) {
    const emp = db.prepare('SELECT id FROM Employee WHERE id = ? AND id_department = ?').get(id_employee, departmentId);
    if (!emp) throw { status: 403, message: 'Сотрудник не из вашего отдела' };

    const r = db.prepare(`
      INSERT INTO EmployeeScheduleWish (id_employee, wish_date, preferred_start, preferred_end, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(id_employee, wish_date, preferred_start, preferred_end, note);

    return { id: r.lastInsertRowid };
  },

  createChangeRequest(departmentId, managerEmployeeId, { id_schedule, request_type, reason, replacement_employee_id }) {
    // Verify the schedule entry belongs to department
    const shift = db.prepare(`
      SELECT ws.*, e.id_department FROM WorkSchedule ws
      JOIN Employee e ON ws.id_employee = e.id
      WHERE ws.id = ? AND e.id_department = ?
    `).get(id_schedule, departmentId);

    if (!shift) throw { status: 404, message: 'Смена не найдена' };

    // Store as an application
    let appType = db.prepare("SELECT id FROM ApplicationType WHERE name = 'Перенос смены'").get();
    if (!appType) {
      const r = db.prepare("INSERT INTO ApplicationType (name) VALUES ('Перенос смены')").run();
      appType = { id: r.lastInsertRowid };
    }

    const desc = `Тип: ${request_type}. Смена ID: ${id_schedule}. ${replacement_employee_id ? 'Замещающий сотрудник ID: ' + replacement_employee_id : ''}`;
    const r = db.prepare(`
      INSERT INTO Application (name, description, id_type, id_employee, created_date, comment, status)
      VALUES ('Заявка на изменение смены', ?, ?, ?, datetime('now'), ?, 'pending')
    `).run(desc, appType.id, shift.id_employee, reason);

    return { id: r.lastInsertRowid };
  }
};

module.exports = scheduleService;
