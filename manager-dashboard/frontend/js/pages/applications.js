// FILE: frontend/js/pages/applications.js
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  let appTypes = [];

  async function loadAll() {
    await Promise.all([loadTypes(), loadApplications()]);
  }

  async function loadTypes() {
    try {
      appTypes = await applicationsApi.getTypes();
      const sel = document.getElementById('filter-type');
      sel.innerHTML = `<option value="">Все типы</option>` +
        appTypes.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    } catch(e) {}
  }

  async function loadApplications() {
    const status = document.getElementById('filter-status').value;
    const type_id = document.getElementById('filter-type').value;
    const date_from = document.getElementById('filter-date-from').value;
    const date_to = document.getElementById('filter-date-to').value;

    const params = {};
    if (status) params.status = status;
    if (type_id) params.type_id = type_id;
    if (date_from) params.date_from = date_from;
    if (date_to) params.date_to = date_to;

    try {
      const apps = await applicationsApi.getAll(params);
      renderTable(apps);
    } catch(err) {
      document.getElementById('apps-tbody').innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--danger)">${err.message}</td></tr>`;
    }
  }

  function renderTable(apps) {
    const tbody = document.getElementById('apps-tbody');
    if (!apps.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📋</div><h3>Нет заявлений</h3></div></td></tr>`;
      return;
    }

    tbody.innerHTML = apps.map((app, i) => `
      <tr>
        <td>${app.id}</td>
        <td>
          <span style="cursor:pointer;color:var(--primary);font-weight:500" onclick="showAppDetail(${app.id})">${app.name}</span>
        </td>
        <td>${app.type_name}</td>
        <td>${app.employee_name}</td>
        <td>${formatDateTime(app.created_date)}</td>
        <td>${statusBadge(app.status)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="showAppDetail(${app.id})">Просмотр</button>
          ${app.status === 'pending' ? `<button class="btn btn-primary btn-sm" onclick="quickReview(${app.id})">Обработать</button>` : ''}
        </td>
      </tr>
    `).join('');
  }

  window.showAppDetail = async function(id) {
    try {
      const app = await applicationsApi.getById(id);
      document.getElementById('ad-name').textContent = app.name;
      document.getElementById('ad-type').textContent = app.type_name;
      document.getElementById('ad-status').innerHTML = statusBadge(app.status);
      document.getElementById('ad-employee').textContent = app.employee_name;
      document.getElementById('ad-date').textContent = formatDateTime(app.created_date);
      document.getElementById('ad-desc').textContent = app.description || '—';

      const reviewerRow = document.getElementById('ad-reviewer-row');
      const resultRow = document.getElementById('ad-result-row');

      if (app.reviewer_name) {
        reviewerRow.style.display = 'flex';
        document.getElementById('ad-reviewer').textContent = app.reviewer_name;
      } else {
        reviewerRow.style.display = 'none';
      }

      if (app.reviewed_result) {
        resultRow.style.display = 'flex';
        document.getElementById('ad-result').textContent = app.reviewed_result;
      } else {
        resultRow.style.display = 'none';
      }

      // Show review form only for pending
      const reviewForm = document.getElementById('review-form');
      reviewForm.style.display = app.status === 'pending' ? 'block' : 'none';
      document.getElementById('review-app-id').value = app.id;
      document.getElementById('review-status').value = 'approved';
      document.getElementById('review-result').value = '';
      hideAlert('review-alert');

      openModal('app-detail-modal');
    } catch (err) {
      showToast('Ошибка загрузки заявления', 'error');
    }
  };

  window.quickReview = function(id) {
    showAppDetail(id);
  };

  document.getElementById('btn-submit-review').addEventListener('click', async () => {
    const id = document.getElementById('review-app-id').value;
    const status = document.getElementById('review-status').value;
    const reviewed_result = document.getElementById('review-result').value.trim();

    if (!reviewed_result) {
      showAlert('review-alert', 'Укажите результат рассмотрения', 'error');
      return;
    }

    try {
      await applicationsApi.review(id, { status, reviewed_result });
      closeModal('app-detail-modal');
      await loadApplications();
      showToast(status === 'approved' ? 'Заявление одобрено' : 'Заявление отклонено', status === 'approved' ? 'success' : 'warning');
    } catch (err) {
      showAlert('review-alert', err.message, 'error');
    }
  });

  // Filters
  ['filter-status', 'filter-type', 'filter-date-from', 'filter-date-to'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', loadApplications);
  });

  document.getElementById('btn-clear-filters').addEventListener('click', () => {
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    loadApplications();
  });

  await loadAll();
});
