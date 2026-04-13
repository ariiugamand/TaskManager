// FILE: backend/controllers/authController.js
const authService = require('../services/authService');

const authController = {
  async register(req, res) {
    try {
      const { login, email, contacts, password } = req.body;

      if (!login || !email || !password) {
        return res.status(400).json({ error: 'Поля login, email и password обязательны' });
      }
      if (login.length < 3) return res.status(400).json({ error: 'Логин минимум 3 символа' });
      if (password.length < 6) return res.status(400).json({ error: 'Пароль минимум 6 символов' });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return res.status(400).json({ error: 'Некорректный email' });
      }

      const result = await authService.register({ login, email, contacts, password });
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Ошибка сервера' });
    }
  },

  async login(req, res) {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Логин/email и пароль обязательны' });
      }

      const result = await authService.login({ identifier, password });
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Ошибка сервера' });
    }
  },

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email обязателен' });

      const result = await authService.forgotPassword(email);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Ошибка сервера' });
    }
  },

  async verifyResetCode(req, res) {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ error: 'Email и код обязательны' });

      const result = await authService.verifyResetCode(email, code);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Ошибка сервера' });
    }
  },

  async resetPassword(req, res) {
    try {
      const { email, code, new_password } = req.body;
      if (!email || !code || !new_password) {
        return res.status(400).json({ error: 'Email, код и новый пароль обязательны' });
      }
      if (new_password.length < 6) return res.status(400).json({ error: 'Пароль минимум 6 символов' });

      const result = await authService.resetPassword(email, code, new_password);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Ошибка сервера' });
    }
  }
};

module.exports = authController;
