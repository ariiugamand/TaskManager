// FILE: frontend/js/pages/events.js
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  let currentMonth = getCurrentMonth();
  let allEvents = [];
  let employees = [];
  let currentEventId = null;

  const monthPicker = document.getElementById('month-picker');
  monthPicker.value = currentMonth;

  monthPicker.addEventListener('change', () => {
    currentMonth = monthPicker.value;
    loadEvents();
  });

  initTabs();

  async function loadEvents() {
    try {
      allEvents = await eventsApi.getAll(currentMonth);
      renderEventsList();
      renderCalendar();
    } catch (err) {
      document.getElementById('events-list').innerHTML = '<div class="empty-state"><p>Ошибка загрузки</p></div>';
    }
  }

  async function loadEmployees() {
    try {
      employees = await employeesApi.getAll();
    } catch(e) {}
  }

  function typeLabel(t) {
    const m = { meeting: 'Совещание', review: 'Ревью', training: 'Обучение', other: 'Другое' };
    return m[t] || t;
  }

  function renderEventsList() {
    const container = document.getElementById('events-list');
    if (!allEvents.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📌</div><h3>Нет событий</h3><p>Создайте первое событие</p></div>`;
      return;
    }

    container.innerHTML = `<div style="padding:8px 0">` + allEvents.map(ev => {
      const d = new Date(ev.event_date);
      const day = d.getDate();
      const mon = d.toLocaleString('ru-RU', { month: 'short' });
      return `
        <div class="event-item" style="padding:14px 20px">
          <div class="event-date-badge">
            <div class="event-date-day">${day}</div>
            <div class="event-date-mon">${mon}</div>
          </div>
          <div class="event-info">
            <div class="event-name" onclick="showEventDetail(${ev.id})">${ev.name}</div>
            <div class="event-meta">
              <span>🕐 ${ev.event_time || 'Весь день'}</span>
              <span>📂 ${typeLabel(ev.event_type)}</span>
              <span>${statusBadge(ev.importance)}</span>
            </div>
          </div>
          <div class="event-actions">
            <button class="btn btn-ghost btn-sm" onclick="openEditEvent(${ev.id})">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteEvent(${ev.id})">🗑</button>
          </div>
        </div>
      `;
    }).join('') + '</div>';
  }

  function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const [y, m] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const firstDow = new Date(y, m - 1, 1).getDay(); // 0=Sun
    const adjustedFirst = (firstDow + 6) % 7; // Mon=0

    const eventDates = new Set(allEvents.map(e => e.event_date));

    const monthName = getMonthName(currentMonth);
    let html = `
      <div class="mini-calendar">
        <div class="cal-header">
          <span class="cal-title">${monthName} ${y}</span>
        </div>
        <div class="cal-grid">
          ${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => `<div class="cal-day-name">${d}</div>`).join('')}
    `;

    // Empty cells before month start
    for (let i = 0; i < adjustedFirst; i++) {
      html += `<div class="cal-day other-month"></div>`;
    }

    const today = new Date().toISOString().split('T')[0];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === today;
      const hasEv = eventDates.has(dateStr);
      html += `<div class="cal-day ${isToday ? 'today' : ''} ${hasEv ? 'has-event' : ''}"
        onclick="calDayClick('${dateStr}')">${d}</div>`;
    }

    html += '</div></div>';
    container.innerHTML = html;
  }

  window.calDayClick = function(dateStr) {
    const dayEvents = allEvents.filter(e => e.event_date === dateStr);
    document.getElementById('cal-selected-date').textContent = formatDate(dateStr);
    const container = document.getElementById('calendar-day-events');
    if (!dayEvents.length) {
      container.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted)">Событий нет</div>';
      return;
    }
    container.innerHTML = `<div style="padding:8px 0">` + dayEvents.map(ev => `
      <div style="padding:10px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-weight:600;cursor:pointer" onclick="showEventDetail(${ev.id})">${ev.name}</div>
          <div style="font-size:12px;color:var(--text-muted)">${ev.event_time || 'Весь день'} • ${typeLabel(ev.event_type)}</div>
        </div>
        ${statusBadge(ev.importance)}
      </div>
    `).join('') + '</div>';
  };

  window.showEventDetail = async function(id) {
    try {
      const ev = await eventsApi.getById(id);
      currentEventId = id;
      document.getElementById('detail-event-name').textContent = ev.name;
      document.getElementById('detail-event-date').textContent = formatDate(ev.event_date);
      document.getElementById('detail-event-time').textContent = ev.event_time || 'Весь день';
      document.getElementById('detail-event-type').textContent = typeLabel(ev.event_type);
      document.getElementById('detail-event-importance').innerHTML = statusBadge(ev.importance);
      document.getElementById('detail-event-desc').textContent = ev.description || '—';

      // Populate employees for notification
      const notifyEmpDiv = document.getElementById('notify-employees');
      notifyEmpDiv.innerHTML = employees.map(emp => `
        <label class="checkbox-item">
          <input type="checkbox" value="${emp.id}"> ${emp.full_name}
        </label>
      `).join('');

      openModal('event-detail-modal');
    } catch (err) {
      showToast('Ошибка загрузки события', 'error');
    }
  };

  // Notify mode toggle
  document.getElementById('notify-mode').addEventListener('change', function() {
    document.getElementById('notify-select-wrap').style.display =
      this.value === 'select' ? 'block' : 'none';
  });

  document.getElementById('btn-notify').addEventListener('click', async () => {
    if (!currentEventId) return;
    const mode = document.getElementById('notify-mode').value;
    let empIds = 'all';
    if (mode === 'select') {
      const checked = document.querySelectorAll('#notify-employees input:checked');
      empIds = [...checked].map(c => parseInt(c.value));
      if (!empIds.length) { showToast('Выберите хотя бы одного сотрудника', 'warning'); return; }
    }

    try {
      const res = await eventsApi.notify(currentEventId, empIds);
      showToast(`Уведомления отправлены: ${res.notified} сотрудников`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Edit event button in detail modal
  document.getElementById('btn-edit-event').addEventListener('click', () => {
    closeModal('event-detail-modal');
    openEditEvent(currentEventId);
  });

  // Delete event button in detail modal
  document.getElementById('btn-delete-event').addEventListener('click', () => {
    closeModal('event-detail-modal');
    deleteEvent(currentEventId);
  });

  window.openEditEvent = async function(id) {
    try {
      const ev = await eventsApi.getById(id);
      document.getElementById('event-modal-title').textContent = 'Редактировать событие';
      document.getElementById('event-id').value = id;
      document.getElementById('event-name').value = ev.name;
      document.getElementById('event-date').value = ev.event_date;
      document.getElementById('event-time').value = ev.event_time || '';
      document.getElementById('event-type').value = ev.event_type || 'other';
      document.getElementById('event-importance').value = ev.importance || 'normal';
      document.getElementById('event-description').value = ev.description || '';
      hideAlert('event-alert');
      openModal('event-modal');
    } catch (err) {
      showToast('Ошибка загрузки события', 'error');
    }
  };

  window.deleteEvent = function(id) {
    showConfirm('Удалить событие?', 'Событие будет удалено безвозвратно', async () => {
      try {
        await eventsApi.delete(id);
        await loadEvents();
        showToast('Событие удалено', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };

  // New event button
  document.getElementById('btn-new-event').addEventListener('click', () => {
    document.getElementById('event-modal-title').textContent = 'Новое событие';
    document.getElementById('event-id').value = '';
    document.getElementById('event-name').value = '';
    document.getElementById('event-date').value = '';
    document.getElementById('event-time').value = '';
    document.getElementById('event-type').value = 'meeting';
    document.getElementById('event-importance').value = 'normal';
    document.getElementById('event-description').value = '';
    hideAlert('event-alert');
    openModal('event-modal');
  });

  document.getElementById('btn-save-event').addEventListener('click', async () => {
    const id = document.getElementById('event-id').value;
    const name = document.getElementById('event-name').value.trim();
    const event_date = document.getElementById('event-date').value;

    if (!name || !event_date) {
      showAlert('event-alert', 'Название и дата обязательны', 'error');
      return;
    }

    const data = {
      name,
      event_date,
      event_time: document.getElementById('event-time').value,
      event_type: document.getElementById('event-type').value,
      importance: document.getElementById('event-importance').value,
      description: document.getElementById('event-description').value.trim()
    };

    try {
      if (id) {
        await eventsApi.update(id, data);
        showToast('Событие обновлено', 'success');
      } else {
        await eventsApi.create(data);
        showToast('Событие создано', 'success');
      }
      closeModal('event-modal');
      await loadEvents();
    } catch (err) {
      showAlert('event-alert', err.message, 'error');
    }
  });

  await Promise.all([loadEmployees(), loadEvents()]);
});
