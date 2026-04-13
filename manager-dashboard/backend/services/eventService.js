// FILE: backend/services/eventService.js
const { db } = require('../db');

const eventService = {
  getEvents(departmentId, month) {
    let query = `
      SELECT e.*, emp.full_name as organizer_name
      FROM Events e
      JOIN Employee emp ON e.id_organizer = emp.id
      WHERE emp.id_department = ?
    `;
    const params = [departmentId];

    if (month) {
      query += ' AND e.event_date LIKE ?';
      params.push(`${month}%`);
    }

    query += ' ORDER BY e.event_date, e.event_time';
    return db.prepare(query).all(...params);
  },

  getById(id, departmentId) {
    const event = db.prepare(`
      SELECT e.*, emp.full_name as organizer_name
      FROM Events e
      JOIN Employee emp ON e.id_organizer = emp.id
      WHERE e.id = ? AND emp.id_department = ?
    `).get(id, departmentId);

    if (!event) return null;

    const participants = db.prepare(`
      SELECT ee.id_employee, ee.role_in_event, emp.full_name
      FROM Employee_Event ee
      JOIN Employee emp ON ee.id_employee = emp.id
      WHERE ee.id_event = ?
    `).all(id);

    return { ...event, participants };
  },

  create(departmentId, employeeId, data) {
    const { name, description, event_date, event_time, importance, event_type } = data;

    const r = db.prepare(`
      INSERT INTO Events (name, description, event_date, event_time, importance, event_type, id_organizer)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, description, event_date, event_time, importance || 'normal', event_type, employeeId);

    return { id: r.lastInsertRowid };
  },

  update(id, departmentId, data) {
    const event = db.prepare(`
      SELECT e.id FROM Events e
      JOIN Employee emp ON e.id_organizer = emp.id
      WHERE e.id = ? AND emp.id_department = ?
    `).get(id, departmentId);

    if (!event) throw { status: 404, message: 'Событие не найдено' };

    const { name, description, event_date, event_time, importance, event_type } = data;
    db.prepare(`
      UPDATE Events SET name=?, description=?, event_date=?, event_time=?, importance=?, event_type=?
      WHERE id=?
    `).run(name, description, event_date, event_time, importance, event_type, id);

    return { success: true };
  },

  delete(id, departmentId) {
    const event = db.prepare(`
      SELECT e.id FROM Events e
      JOIN Employee emp ON e.id_organizer = emp.id
      WHERE e.id = ? AND emp.id_department = ?
    `).get(id, departmentId);

    if (!event) throw { status: 404, message: 'Событие не найдено' };

    db.prepare('DELETE FROM Employee_Event WHERE id_event = ?').run(id);
    db.prepare('DELETE FROM Notifications WHERE id_event = ?').run(id);
    db.prepare('DELETE FROM Events WHERE id = ?').run(id);

    return { success: true };
  },

  notify(id, departmentId, employeeIds) {
    const event = db.prepare(`
      SELECT e.* FROM Events e
      JOIN Employee emp ON e.id_organizer = emp.id
      WHERE e.id = ? AND emp.id_department = ?
    `).get(id, departmentId);

    if (!event) throw { status: 404, message: 'Событие не найдено' };

    let targets = employeeIds;
    if (!targets || targets === 'all') {
      targets = db.prepare('SELECT id FROM Employee WHERE id_department = ?')
        .all(departmentId).map(e => e.id);
    }

    const notifStmt = db.prepare(`
      INSERT INTO Notifications (id_event, id_employee, sent_at, message)
      VALUES (?, ?, datetime('now'), ?)
    `);

    const message = `Уведомление о событии: ${event.name} (${event.event_date} ${event.event_time || ''})`;

    const insertMany = db.transaction((ids) => {
      for (const empId of ids) {
        notifStmt.run(id, empId, message);
        console.log(`📬 Notification sent to employee ${empId}: ${message}`);
      }
    });

    insertMany(targets);

    return { success: true, notified: targets.length };
  }
};

module.exports = eventService;
