// FILE: frontend/js/pages/register.js
document.addEventListener('DOMContentLoaded', () => {
  requireGuest();

  const form = document.getElementById('register-form');
  const btn = document.getElementById('btn-register');

  // Password toggles
  document.getElementById('toggle-password').addEventListener('click', function() {
    const input = document.getElementById('password');
    input.type = input.type === 'password' ? 'text' : 'password';
    this.textContent = input.type === 'password' ? '👁' : '🙈';
  });
  document.getElementById('toggle-password2').addEventListener('click', function() {
    const input = document.getElementById('password2');
    input.type = input.type === 'password' ? 'text' : 'password';
    this.textContent = input.type === 'password' ? '👁' : '🙈';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('alert-msg');
    clearAllFieldErrors(form);

    const login = document.getElementById('login').value.trim();
    const email = document.getElementById('email').value.trim();
    const contacts = document.getElementById('contacts').value.trim();
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;

    let valid = true;

    if (!login || login.length < 3) {
      showFieldError(document.getElementById('login'), 'Логин минимум 3 символа');
      valid = false;
    }

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      showFieldError(document.getElementById('email'), 'Введите корректный email');
      valid = false;
    }

    if (!password || password.length < 6) {
      showFieldError(document.getElementById('password'), 'Пароль минимум 6 символов');
      valid = false;
    }

    if (password !== password2) {
      showFieldError(document.getElementById('password2'), 'Пароли не совпадают');
      valid = false;
    }

    if (!valid) return;

    btn.disabled = true;
    btn.textContent = 'Регистрация...';

    try {
      await authApi.register({ login, email, contacts, password });
      showAlert('alert-msg', 'Регистрация успешна! Перенаправление...', 'success');
      setTimeout(() => { window.location.href = '/pages/login.html'; }, 1500);
    } catch (err) {
      showAlert('alert-msg', err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Зарегистрироваться';
    }
  });

  // Clear errors on input
  ['login', 'email', 'password', 'password2'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', function() {
      clearFieldError(this);
    });
  });
});
