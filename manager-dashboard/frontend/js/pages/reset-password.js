// FILE: frontend/js/pages/reset-password.js
document.addEventListener('DOMContentLoaded', () => {
  requireGuest();

  let currentEmail = '';
  let currentCode = '';
  let currentStep = 1;

  function goToStep(n) {
    currentStep = n;
    [1,2,3].forEach(i => {
      const s = document.getElementById(`step-${i}`);
      const ind = document.getElementById(`step-${i}-ind`);
      if (s) s.style.display = i === n ? 'block' : 'none';
      if (ind) {
        ind.classList.remove('active', 'done');
        if (i < n) ind.classList.add('done');
        if (i === n) ind.classList.add('active');
      }
    });
    hideAlert('alert-msg');
  }

  // Step 1: Email
  document.getElementById('form-email').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('alert-msg');
    const email = document.getElementById('reset-email').value.trim();
    if (!email) {
      showFieldError(document.getElementById('reset-email'), 'Введите email');
      return;
    }
    clearFieldError(document.getElementById('reset-email'));

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Отправка...';

    try {
      await authApi.forgotPassword(email);
      currentEmail = email;
      document.getElementById('code-email-display').textContent = email;
      showAlert('alert-msg', 'Код отправлен! Проверьте консоль сервера.', 'success');
      setTimeout(() => goToStep(2), 800);
    } catch (err) {
      showAlert('alert-msg', err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Получить код';
    }
  });

  // Step 2: Code
  document.getElementById('form-code').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('alert-msg');
    const code = document.getElementById('reset-code').value.trim();
    if (!code || code.length !== 6) {
      showFieldError(document.getElementById('reset-code'), 'Введите 6-значный код');
      return;
    }
    clearFieldError(document.getElementById('reset-code'));

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Проверка...';

    try {
      await authApi.verifyCode(currentEmail, code);
      currentCode = code;
      showAlert('alert-msg', 'Код верный!', 'success');
      setTimeout(() => goToStep(3), 600);
    } catch (err) {
      showAlert('alert-msg', err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Подтвердить';
    }
  });

  // Step 3: New password
  document.getElementById('toggle-np').addEventListener('click', function() {
    const i = document.getElementById('new-password');
    i.type = i.type === 'password' ? 'text' : 'password';
    this.textContent = i.type === 'password' ? '👁' : '🙈';
  });
  document.getElementById('toggle-np2').addEventListener('click', function() {
    const i = document.getElementById('new-password2');
    i.type = i.type === 'password' ? 'text' : 'password';
    this.textContent = i.type === 'password' ? '👁' : '🙈';
  });

  document.getElementById('form-newpass').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('alert-msg');
    const np = document.getElementById('new-password').value;
    const np2 = document.getElementById('new-password2').value;

    let valid = true;
    if (!np || np.length < 6) {
      showFieldError(document.getElementById('new-password'), 'Пароль минимум 6 символов');
      valid = false;
    }
    if (np !== np2) {
      showFieldError(document.getElementById('new-password2'), 'Пароли не совпадают');
      valid = false;
    }
    if (!valid) return;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Сохранение...';

    try {
      await authApi.resetPassword(currentEmail, currentCode, np);
      showAlert('alert-msg', 'Пароль успешно изменён! Перенаправление...', 'success');
      setTimeout(() => { window.location.href = '/pages/login.html'; }, 1500);
    } catch (err) {
      showAlert('alert-msg', err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Сохранить пароль';
    }
  });

  // Auto-format code input
  document.getElementById('reset-code').addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '').slice(0, 6);
  });
});
