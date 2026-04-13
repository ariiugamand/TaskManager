// FILE: frontend/js/pages/tasks.js
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  let allTasks = [];
  let employees = [];
  let taskTypes = [];
  let currentTaskId = null;
  let filterStatus = '';

  const monthPicker = document.getElementById('month-picker');
  monthPicker.value = getCurrentMonth();

  monthPicker.addEventListener('change', loadTasks);

  document.getElementById('filter-status').addEventListener('change', function() {
    filterStatus = this.value;
    renderTasks();
  });

  async function loadAll() {
    await Promise.all([loadTasks(), loadEmployees(), loadTaskTypes()]);
  }

  async function loadTasks() {
    const month = monthPicker.value;
    try {
      allTasks = await tasksApi.getAll(month);
      renderTasks();
      updateStats();
    } catch(err) {
      document.getElementById('tasks-container').innerHTML = '<div class="empty-state"><p>Ошибка загрузки</p></div>';
    }
  }

  async function loadEmployees() {
    try { employees = await employeesApi.getAll(); } catch(e) {}
  }

  async function loadTaskTypes() {
    try {
      taskTypes = await tasksApi.getTypes();
      populateTypeSelect();
    } catch(e) {}
  }

  function populateTypeSelect() {
    const sel = document.getElementById('task-type');
    sel.innerHTML = `<option value="">— Без типа —</option>` +
      taskTypes.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  }

  function updateStats() {
    const total = allTasks.length;
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
    const done = allTasks.filter(t => t.status === 'done').length;
    const now = new Date();
    const overdue = allTasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'done').length;
    document.getElementById('ts-total').textContent = total;
    document.getElementById('ts-inprogress').textContent = inProgress;
    document.getElementById('ts-done').textContent = done;
    document.getElementById('ts-overdue').textContent = overdue;
  }

  function renderTasks() {
    const container = document.getElementById('tasks-container');
    let tasks = allTasks;
    if (filterStatus) tasks = tasks.filter(t => t.status === filterStatus);

    if (!tasks.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><h3>Нет задач</h3><p>Создайте первую задачу</p></div>`;
      return;
    }

    const now = new Date();
    container.innerHTML = tasks.map(task => {
      const days = getDaysLeft(task.deadline);
      const isOverdue = days !== null && days < 0 && task.status !== 'done';
      const isSoon = days !== null && days >= 0 && days <= 3 && task.status !== 'done';
      const deadlineClass = isOverdue ? 'overdue' : isSoon ? 'soon' : '';
      const progressClass = task.percent_complete >= 100 ? 'done' : task.percent_complete >= 50 ? '' : 'warning';

      return `
        <div class="task-card" style="margin-bottom:12px">
          <div class="task-card-header">
            <div class="task-card-title" onclick="showTaskDetail(${task.id})">${task.name}</div>
            <div style="display:flex;gap:6px">
              ${statusBadge(task.status)}
              <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditTask(${task.id})">✏️</button>
              <button class="btn btn-danger btn-sm btn-icon" onclick="deleteTask(${task.id})">🗑</button>
            </div>
          </div>
          <div class="task-card-meta">
            ${task.type_name ? `<span>📂 ${task.type_name}</span>` : ''}
            ${task.deadline ? `<span class="task-deadline ${deadlineClass}">📅 ${formatDate(task.deadline)}</span>` : ''}
            ${task.deadline ? `<span class="task-deadline ${deadlineClass}">⏱ ${daysLeftText(task.deadline)}</span>` : ''}
          </div>
          <div class="task-progress-row">
            <span class="task-progress-label">${task.percent_complete}%</span>
            <div class="progress-bar" style="flex:1">
              <div class="progress-fill ${progressClass}" style="width:${task.percent_complete}%"></div>
            </div>
          </div>
          ${task.assignees && task.assignees.length ? `
            <div class="task-assignees">
              ${task.assignees.map(a => `<span class="assignee-chip">${a.full_name.split(' ')[0]}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  window.showTaskDetail = async function(id) {
    try {
      const task = await tasksApi.getById(id);
      currentTaskId = id;
      document.getElementById('td-name').textContent = task.name;
      document.getElementById('td-status').innerHTML = statusBadge(task.status);
      document.getElementById('td-type').textContent = task.type_name || '—';
      document.getElementById('td-deadline').textContent = formatDate(task.deadline);
      document.getElementById('td-remaining').textContent = task.deadline ? daysLeftText(task.deadline) : '—';
      document.getElementById('td-desc').textContent = task.description || '—';
      document.getElementById('td-progress').style.width = task.percent_complete + '%';
      document.getElementById('td-percent').textContent = task.percent_complete + '%';
      document.getElementById('td-assignees').innerHTML = task.assignees?.length
        ? task.assignees.map(a => `<span class="assignee-chip">${a.full_name}</span>`).join(' ')
        : '—';
      openModal('task-detail-modal');
    } catch (err) {
      showToast('Ошибка загрузки задачи', 'error');
    }
  };

  document.getElementById('btn-edit-task').addEventListener('click', () => {
    closeModal('task-detail-modal');
    openEditTask(currentTaskId);
  });

  document.getElementById('btn-delete-task').addEventListener('click', () => {
    closeModal('task-detail-modal');
    deleteTask(currentTaskId);
  });

  window.openEditTask = async function(id) {
    try {
      const task = await tasksApi.getById(id);
      document.getElementById('task-modal-title').textContent = 'Редактировать задачу';
      document.getElementById('task-id').value = id;
      document.getElementById('task-name').value = task.name;
      document.getElementById('task-type').value = task.id_type || '';
      document.getElementById('task-status').value = task.status;
      document.getElementById('task-deadline').value = task.deadline || '';
      document.getElementById('task-percent').value = task.percent_complete || 0;
      document.getElementById('task-description').value = task.description || '';
      populateAssignees(task.assignees?.map(a => a.id_employee) || []);
      hideAlert('task-alert');
      openModal('task-modal');
    } catch (err) {
      showToast('Ошибка загрузки задачи', 'error');
    }
  };

  function populateAssignees(selectedIds = []) {
    const container = document.getElementById('task-assignees');
    container.innerHTML = employees.map(emp => `
      <label class="checkbox-item">
        <input type="checkbox" value="${emp.id}" ${selectedIds.includes(emp.id) ? 'checked' : ''}> ${emp.full_name}
      </label>
    `).join('');
  }

  document.getElementById('btn-new-task').addEventListener('click', () => {
    document.getElementById('task-modal-title').textContent = 'Новая задача';
    document.getElementById('task-id').value = '';
    document.getElementById('task-name').value = '';
    document.getElementById('task-type').value = '';
    document.getElementById('task-status').value = 'new';
    document.getElementById('task-deadline').value = '';
    document.getElementById('task-percent').value = 0;
    document.getElementById('task-description').value = '';
    populateAssignees([]);
    hideAlert('task-alert');
    openModal('task-modal');
  });

  document.getElementById('btn-save-task').addEventListener('click', async () => {
    const id = document.getElementById('task-id').value;
    const name = document.getElementById('task-name').value.trim();
    if (!name) {
      showAlert('task-alert', 'Название задачи обязательно', 'error');
      return;
    }

    const checked = document.querySelectorAll('#task-assignees input:checked');
    const assignee_ids = [...checked].map(c => parseInt(c.value));

    const data = {
      name,
      id_type: document.getElementById('task-type').value || null,
      status: document.getElementById('task-status').value,
      deadline: document.getElementById('task-deadline').value || null,
      percent_complete: parseInt(document.getElementById('task-percent').value) || 0,
      description: document.getElementById('task-description').value.trim(),
      assignee_ids
    };

    try {
      if (id) {
        await tasksApi.update(id, data);
        showToast('Задача обновлена', 'success');
      } else {
        await tasksApi.create(data);
        showToast('Задача создана', 'success');
      }
      closeModal('task-modal');
      await loadTasks();
    } catch (err) {
      showAlert('task-alert', err.message, 'error');
    }
  });

  window.deleteTask = function(id) {
    showConfirm('Удалить задачу?', 'Задача будет удалена безвозвратно', async () => {
      try {
        await tasksApi.delete(id);
        await loadTasks();
        showToast('Задача удалена', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };

  await loadAll();
});
