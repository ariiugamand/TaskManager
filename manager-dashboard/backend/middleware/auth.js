// FILE: backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_manager_2024';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch fresh user+employee data
    const user = db.prepare(`
      SELECT u.id as user_id, u.login, u.email, u.id_employee,
             e.id as employee_id, e.full_name, e.id_department, e.id_role, e.is_manager, e.position,
             d.name as department_name, r.name as role_name
      FROM Users u
      JOIN Employee e ON u.id_employee = e.id
      JOIN Department d ON e.id_department = d.id
      JOIN Role r ON e.id_role = r.id
      WHERE u.id = ?
    `).get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
}

module.exports = { authenticateToken };
