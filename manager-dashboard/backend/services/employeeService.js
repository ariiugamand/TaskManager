// FILE: backend/services/employeeService.js
const { db } = require('../db');

const employeeService = {
  getByDepartment(departmentId) {
    return db.prepare(`
      SELECT e.id, e.full_name, e.contacts, e.position, e.birth_date,
             e.id_department, e.id_role, e.is_manager,
             d.name as department_name, r.name as role_name
      FROM Employee e
      JOIN Department d ON e.id_department = d.id
      JOIN Role r ON e.id_role = r.id
      WHERE e.id_department = ?
      ORDER BY e.full_name
    `).all(departmentId);
  },

  getById(id, departmentId) {
    const emp = db.prepare(`
      SELECT e.id, e.full_name, e.contacts, e.position, e.birth_date,
             e.id_department, e.id_role, e.is_manager,
             d.name as department_name, r.name as role_name
      FROM Employee e
      JOIN Department d ON e.id_department = d.id
      JOIN Role r ON e.id_role = r.id
      WHERE e.id = ? AND e.id_department = ?
    `).get(id, departmentId);

    if (!emp) return null;
    return emp;
  }
};

module.exports = employeeService;
