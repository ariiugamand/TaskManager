// FILE: frontend/js/ui.js

// ===== TOAST NOTIFICATIONS =====
function initToastContainer() {
  if (!document.getElementById('toast-container')) {
    const el = document.createElement('div');
    el.id = 'toast-container';
    document.body.appendChild(el);
  }
}

function showToast(message, type = 'default', duration = 3000) {
  initToastContainer();
  const container = document.getElementById('toast-container');

  const icons = { success: '✅', error: '❌', warning: '⚠️', default: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== CONFIRM DIALOG =====
function showConfirm(title, text, onConfirm) {
  let overlay = document.getElementById('confirm-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'confirm-overlay';
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box">
        <div class="confirm-icon">⚠️</div>
        <div class="confirm-title" id="confirm-title"></div>
        <div class="confirm-text" id="confirm-text"></div>
        <div class="confirm-actions">
          <button class="btn btn-secondary" id="confirm-cancel">Отмена</button>
          <button class="btn btn-danger" id="confirm-ok">Удалить</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-text').textContent = text;
  overlay.classList.add('open');

  const close = () => overlay.classList.remove('open');

  document.getElementById('confirm-cancel').onclick = close;
  document.getElementById('confirm-ok').onclick = () => {
    close();
    onConfirm();
  };
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
}

// ===== MODAL =====
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
  document.body.style.overflow = '';
}

function initModalCloseButtons() {
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });
}

// ===== SIDEBAR =====
function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.querySelector('.sidebar-toggle');
  const backdrop = document.querySelector('.sidebar-backdrop');

  if (!sidebar) return;

  // Set active nav link
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href.split('/').pop().split('.')[0])) {
      link.classList.add('active');
    }
  });

  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (backdrop) backdrop.classList.toggle('open');
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('open');
    });
  }

  // Set user info
  const user = getUser();
  if (user) {
    const nameEl = document.querySelector('.sidebar-user-name');
    const roleEl = document.querySelector('.sidebar-user-role');
    if (nameEl) nameEl.textContent = user.full_name || user.login;
    if (roleEl) roleEl.textContent = user.is_manager ? 'Руководитель' : 'Сотрудник';
  }

  // Logout
  const logoutBtn = document.querySelector('.btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
    });
  }
}

// ===== TABS =====
function initTabs(containerId) {
  const container = document.getElementById(containerId) || document;
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const content = container.querySelector(`#${target}`);
      if (content) content.classList.add('active');
    });
  });
}

// ===== FORM VALIDATION =====
function showFieldError(inputEl, message) {
  inputEl.classList.add('error');
  let errEl = inputEl.parentElement.querySelector('.form-error');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.className = 'form-error';
    inputEl.parentElement.appendChild(errEl);
  }
  errEl.textContent = message;
  errEl.classList.add('show');
}

function clearFieldError(inputEl) {
  inputEl.classList.remove('error');
  const errEl = inputEl.parentElement.querySelector('.form-error');
  if (errEl) errEl.classList.remove('show');
}

function clearAllFieldErrors(formEl) {
  formEl.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
  formEl.querySelectorAll('.form-error.show').forEach(el => el.classList.remove('show'));
}

function showAlert(alertId, message, type = 'error') {
  const el = document.getElementById(alertId);
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} show`;
}

function hideAlert(alertId) {
  const el = document.getElementById(alertId);
  if (el) el.className = 'alert';
}

// ===== BADGES =====
function statusBadge(status) {
  const labels = {
    pending: 'На рассмотрении', approved: 'Одобрено', rejected: 'Отклонено',
    new: 'Новая', in_progress: 'В работе', done: 'Готово',
    high: 'Высокая', normal: 'Обычная', low: 'Низкая'
  };
  return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
}

// ===== DATE UTILS =====
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return dateStr; }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}

function getDaysLeft(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const d = new Date(deadline);
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function daysLeftText(deadline) {
  const days = getDaysLeft(deadline);
  if (days === null) return '';
  if (days < 0) return `Просрочено на ${Math.abs(days)} дн.`;
  if (days === 0) return 'Сегодня';
  return `Осталось ${days} дн.`;
}

function getMonthName(monthStr) {
  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const [, m] = (monthStr || '').split('-');
  return months[parseInt(m) - 1] || '';
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

// ===== AVATAR =====
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name[0].toUpperCase();
}

// ===== LOADING STATE =====
function setLoading(containerId, loading) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (loading) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div><span>Загрузка...</span></div>';
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initModalCloseButtons();
  initSidebar();
});
