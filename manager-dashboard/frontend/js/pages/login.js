// FILE: frontend/js/pages/login.js
document.addEventListener('DOMContentLoaded', () => {
  requireGuest();

  const form = document.getElementById('login-form');
  const btn = document.getElementById('btn-login');

  // Toggle password visibility
  document.getElementById('toggle-password').addEventListener('click', function() {
    const input = document.getElementById('password');
    input.type = input.type === 'password' ? 'text' : 'password';
    this.textContent = input.type === 'password' ? '👁' : '🙈';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('alert-error');

    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;

    let valid = true;

    if (!identifier) {
      showFieldError(document.getElementById('identifier'), 'Введите логин или email');
      valid = false;
    } else {
      clearFieldError(document.getElementById('identifier'));
    }

    if (!password) {
      showFieldError(document.getElementById('password'), 'Введите пароль');
      valid = false;
    } else {
      clearFieldError(document.getElementById('password'));
    }

    if (!valid) return;

    btn.disabled = true;
    btn.textContent = 'Вход...';

    try {
      const result = await authApi.login({ identifier, password });
      setToken(result.token);
      setUser(result.user);
      window.location.href = '/pages/dashboard.html';
    } catch (err) {
      showAlert('alert-error', err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Войти';
    }
  });

  // Clear errors on input
  ['identifier', 'password'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', function() {
      clearFieldError(this);
    });
  });
});
