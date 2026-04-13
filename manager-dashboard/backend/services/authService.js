// FILE: backend/services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_manager_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 10 * 60 * 1000;  // 10 minutes
const MAX_ATTEMPTS = 3;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const authService = {
  async register({ login, email, contacts, password }) {
    // Check duplicates
    const existingLogin = db.prepare('SELECT id FROM Users WHERE login = ?').get(login);
    if (existingLogin) throw { status: 400, message: 'Логин уже занят' };

    const existingEmail = db.prepare('SELECT id FROM Users WHERE email = ?').get(email);
    if (existingEmail) throw { status: 400, message: 'Email уже используется' };

    // Find or create a default department for new managers
    let dept = db.prepare('SELECT id FROM Department WHERE name = ?').get('Разработка');
    if (!dept) {
      const r = db.prepare('INSERT INTO Department (name) VALUES (?)').run('Новый отдел');
      dept = { id: r.lastInsertRowid };
    }

    // Find manager role
    let role = db.prepare("SELECT id FROM Role WHERE name = 'Manager'").get();
    if (!role) {
      const r = db.prepare("INSERT INTO Role (name) VALUES ('Manager')").run();
      role = { id: r.lastInsertRowid };
    }

    // Create employee record
    const emp = db.prepare(`
      INSERT INTO Employee (full_name, contacts, position, id_department, id_role, is_manager)
      VALUES (?, ?, 'Руководитель отдела', ?, ?, 1)
    `).run(login, contacts || email, dept.id, role.id);

    // Hash password
    const hashed = bcrypt.hashSync(password, 10);

    // Create user
    db.prepare(`
      INSERT INTO Users (id_employee, login, password, email) VALUES (?, ?, ?, ?)
    `).run(emp.lastInsertRowid, login, hashed, email);

    return { success: true };
  },

  async login({ identifier, password }) {
    // Find by login or email
    const user = db.prepare(`
      SELECT u.id, u.login, u.email, u.password, u.id_employee,
             e.full_name, e.id_department, e.is_manager
      FROM Users u
      JOIN Employee e ON u.id_employee = e.id
      WHERE u.login = ? OR u.email = ?
    `).get(identifier, identifier);

    if (!user) throw { status: 401, message: 'Неверный логин или пароль' };

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) throw { status: 401, message: 'Неверный логин или пароль' };

    const token = jwt.sign(
      { userId: user.id, employeeId: user.id_employee, departmentId: user.id_department },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        login: user.login,
        email: user.email,
        full_name: user.full_name,
        id_employee: user.id_employee,
        id_department: user.id_department,
        is_manager: user.is_manager
      }
    };
  },

  async forgotPassword(email) {
    const user = db.prepare('SELECT id FROM Users WHERE email = ?').get(email);
    if (!user) throw { status: 404, message: 'Email не найден' };

    // Invalidate previous codes
    db.prepare('UPDATE PasswordResetCodes SET used = 1 WHERE email = ? AND used = 0').run(email);

    const code = generateCode();
    const now = Date.now();

    db.prepare(`
      INSERT INTO PasswordResetCodes (email, code, attempts, created_at, blocked_until, used)
      VALUES (?, ?, 0, ?, 0, 0)
    `).run(email, code, now);

    // Emulate email sending
    console.log('');
    console.log('📧 ===== RESET PASSWORD EMAIL (EMULATED) =====');
    console.log(`   To: ${email}`);
    console.log(`   Code: ${code}`);
    console.log(`   Valid for: 15 minutes`);
    console.log('=============================================');
    console.log('');

    return { success: true, message: 'Код отправлен на email (проверьте консоль сервера)' };
  },

  async verifyResetCode(email, code) {
    const record = db.prepare(`
      SELECT * FROM PasswordResetCodes
      WHERE email = ? AND used = 0
      ORDER BY created_at DESC LIMIT 1
    `).get(email);

    if (!record) throw { status: 400, message: 'Код сброса не найден. Запросите новый.' };

    const now = Date.now();

    // Check if blocked
    if (record.blocked_until && now < record.blocked_until) {
      const remainMin = Math.ceil((record.blocked_until - now) / 60000);
      throw { status: 429, message: `Слишком много попыток. Попробуйте через ${remainMin} мин.` };
    }

    // Check TTL
    if (now - record.created_at > RESET_CODE_TTL_MS) {
      throw { status: 400, message: 'Код истёк. Запросите новый.' };
    }

    if (record.code !== code) {
      const newAttempts = record.attempts + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        db.prepare(`
          UPDATE PasswordResetCodes SET attempts = ?, blocked_until = ? WHERE id = ?
        `).run(newAttempts, now + BLOCK_DURATION_MS, record.id);
        throw { status: 429, message: 'Слишком много неверных попыток. Попробуйте через 10 минут.' };
      } else {
        db.prepare('UPDATE PasswordResetCodes SET attempts = ? WHERE id = ?').run(newAttempts, record.id);
        throw { status: 400, message: `Неверный код. Осталось попыток: ${MAX_ATTEMPTS - newAttempts}` };
      }
    }

    return { success: true, message: 'Код верный' };
  },

  async resetPassword(email, code, newPassword) {
    await authService.verifyResetCode(email, code);

    const hashed = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE Users SET password = ? WHERE email = ?').run(hashed, email);

    // Mark code as used
    db.prepare(`
      UPDATE PasswordResetCodes SET used = 1 WHERE email = ? AND used = 0
    `).run(email);

    return { success: true, message: 'Пароль успешно изменён' };
  }
};

module.exports = authService;
