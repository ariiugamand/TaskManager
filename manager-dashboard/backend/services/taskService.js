// FILE: backend/services/taskService.js
const { db } = require('../db');

const taskService = {
  getTasks(departmentId, month) {
    let query = `
      SELECT t.*, tt.name as type_name, emp.full_name as author_name
      FROM Task t
      JOIN Employee emp ON t.id_author = emp.id
      LEFT JOIN TaskType tt ON t.id_type = tt.id
      WHERE emp.id_department = ?
    `;
    const params = [departmentId];

    if (month) {
      query += ' AND (t.deadline LIKE ? OR t.created_date LIKE ?)';
      params.push(`${month}%`, `${month}%`);
    }

    query += ' ORDER BY t.deadline ASC';
    const tasks = db.prepare(query).all(...params);

    // Get assignees for each task
    const assigneeStmt = db.prepare(`
      SELECT te.id_employee, e.full_name
      FROM Task_Employee te
      JOIN Employee e ON te.id_employee = e.id
      WHERE te.id_task = ?
    `);

    return tasks.map(task => ({
      ...task,
      assignees: assigneeStmt.all(task.id)
    }));
  },

  getById(id, departmentId) {
    const task = db.prepare(`
      SELECT t.*, tt.name as type_name, emp.full_name as author_name
      FROM Task t
      JOIN Employee emp ON t.id_author = emp.id
      LEFT JOIN TaskType tt ON t.id_type = tt.id
      WHERE t.id = ? AND emp.id_department = ?
    `).get(id, departmentId);

    if (!task) return null;

    const assignees = db.prepare(`
      SELECT te.id_employee, e.full_name
      FROM Task_Employee te
      JOIN Employee e ON te.id_employee = e.id
      WHERE te.id_task = ?
    `).all(id);

    return { ...task, assignees };
  },

  create(departmentId, employeeId, data) {
    const { name, description, deadline, status, percent_complete, id_type, assignee_ids } = data;

    const r = db.prepare(`
      INSERT INTO Task (name, description, deadline, status, percent_complete, created_date, id_author, id_type)
      VALUES (?, ?, ?, ?, ?, date('now'), ?, ?)
    `).run(name, description, deadline, status || 'new', percent_complete || 0, employeeId, id_type);

    const taskId = r.lastInsertRowid;

    // Assign employees
    if (assignee_ids && assignee_ids.length > 0) {
      const assignStmt = db.prepare('INSERT INTO Task_Employee (id_task, id_employee) VALUES (?, ?)');
      const insertAll = db.transaction((ids) => {
        for (const empId of ids) {
          // Verify employee belongs to department
          const emp = db.prepare('SELECT id FROM Employee WHERE id = ? AND id_department = ?').get(empId, departmentId);
          if (emp) assignStmt.run(taskId, empId);
        }
      });
      insertAll(assignee_ids);
    }

    return { id: taskId };
  },

  update(id, departmentId, data) {
    const task = db.prepare(`
      SELECT t.id FROM Task t
      JOIN Employee emp ON t.id_author = emp.id
      WHERE t.id = ? AND emp.id_department = ?
    `).get(id, departmentId);

    if (!task) throw { status: 404, message: 'Задача не найдена' };

    const { name, description, deadline, status, percent_complete, id_type, assignee_ids } = data;

    db.prepare(`
      UPDATE Task SET name=?, description=?, deadline=?, status=?, percent_complete=?, id_type=?
      WHERE id=?
    `).run(name, description, deadline, status, percent_complete || 0, id_type, id);

    if (assignee_ids !== undefined) {
      db.prepare('DELETE FROM Task_Employee WHERE id_task = ?').run(id);
      if (assignee_ids.length > 0) {
        const assignStmt = db.prepare('INSERT INTO Task_Employee (id_task, id_employee) VALUES (?, ?)');
        const insertAll = db.transaction((ids) => {
          for (const empId of ids) {
            const emp = db.prepare('SELECT id FROM Employee WHERE id = ? AND id_department = ?').get(empId, departmentId);
            if (emp) assignStmt.run(id, empId);
          }
        });
        insertAll(assignee_ids);
      }
    }

    return { success: true };
  },

  delete(id, departmentId) {
    const task = db.prepare(`
      SELECT t.id FROM Task t
      JOIN Employee emp ON t.id_author = emp.id
      WHERE t.id = ? AND emp.id_department = ?
    `).get(id, departmentId);

    if (!task) throw { status: 404, message: 'Задача не найдена' };

    db.prepare('DELETE FROM Task_Employee WHERE id_task = ?').run(id);
    db.prepare('DELETE FROM Task WHERE id = ?').run(id);

    return { success: true };
  },

  getTaskTypes() {
    return db.prepare('SELECT * FROM TaskType ORDER BY name').all();
  }
};

module.exports = taskService;
