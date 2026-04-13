// FILE: frontend/js/pages/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  let allEmployees = [];

  async function loadData() {
    try {
      const [employees, tasks, apps, events] = await Promise.allSettled([
        employeesApi.getAll(),
        tasksApi.getAll(),
        applicationsApi.getAll({ status: 'pending' }),
        eventsApi.getAll()
      ]);

      allEmployees = employees.value || [];
      renderStats(allEmployees, tasks.value || [], apps.value || [], events.value || []);
      renderEmployees(allEmployees);
    } catch (err) {
      console.error(err);
    }
  }

  function renderStats(employees, tasks, apps, events) {
    document.getElementById('stat-total').textContent = employees.length;

    const activeTasks = tasks.filter(t => t.status !== 'done').length;
    document.getElementById('stat-tasks').textContent = activeTasks;

    document.getElementById('stat-apps').textContent = apps.length;

    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEvents = events.filter(ev => {
      const d = new Date(ev.event_date);
      return d >= now && d <= weekEnd;
    }).length;
    document.getElementById('stat-events').textContent = weekEvents;
  }

  function renderEmployees(employees) {
    const grid = document.getElementById('employee-grid');
    if (!employees.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">👥</div>
        <h3>Нет сотрудников</h3>
        <p>В вашем отделе пока нет сотрудников</p>
      </div>`;
      return;
    }

    grid.innerHTML = employees.map(emp => `
      <div class="employee-card" onclick="showEmployeeModal(${emp.id})">
        <div class="employee-avatar" style="background:${getAvatarColor(emp.full_name)}">
          ${getInitials(emp.full_name)}
        </div>
        <div class="employee-name">${emp.full_name}</div>
        <div class="employee-position">${emp.position || '—'}</div>
        ${emp.is_manager ? '<span class="badge badge-high" style="font-size:10px">Руководитель</span>' : ''}
      </div>
    `).join('');
  }

  function getAvatarColor(name) {
    const colors = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#dc2626'];
    let hash = 0;
    for (let c of (name || '')) hash += c.charCodeAt(0);
    return colors[hash % colors.length];
  }

  // Employee modal
  window.showEmployeeModal = async function(id) {
    try {
      const emp = await employeesApi.getById(id);
      document.getElementById('modal-avatar').textContent = getInitials(emp.full_name);
      document.getElementById('modal-avatar').style.background = getAvatarColor(emp.full_name);
      document.getElementById('modal-name').textContent = emp.full_name;
      document.getElementById('modal-position').textContent = emp.position || '—';
      document.getElementById('modal-dept').textContent = emp.department_name || '—';
      document.getElementById('modal-role').textContent = emp.is_manager ? 'Руководитель' : emp.role_name || '—';
      document.getElementById('modal-contacts').textContent = emp.contacts || '—';
      document.getElementById('modal-birth').textContent = formatDate(emp.birth_date);
      openModal('employee-modal');
    } catch (err) {
      showToast('Ошибка загрузки данных сотрудника', 'error');
    }
  };

  // Search
  document.getElementById('search-input').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    const filtered = allEmployees.filter(e => e.full_name.toLowerCase().includes(q) || (e.position || '').toLowerCase().includes(q));
    renderEmployees(filtered);
  });

  await loadData();
});
