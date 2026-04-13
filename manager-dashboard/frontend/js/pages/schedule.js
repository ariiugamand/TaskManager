// FILE: frontend/js/pages/schedule.js
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  let currentMonth = getCurrentMonth();
  let scheduleData = [];
  let wishesData = [];
  let employees = [];
  let pendingChanges = {};

  const monthPicker = document.getElementById('month-picker');
  monthPicker.value = currentMonth;

  monthPicker.addEventListener('change', () => {
    currentMonth = monthPicker.value;
    loadAll();
  });

  initTabs();

  async function loadAll() {
    await Promise.all([loadSchedule(), loadWishes(), loadEmployees()]);
  }

  async function loadEmployees() {
    try {
      employees = await employeesApi.getAll();
      populateWishEmployeeSelect();
    } catch(err) { console.error(err); }
  }

  async function loadSchedule() {
    try {
      scheduleData = await scheduleApi.getSchedule(currentMonth);
      renderScheduleView();
      renderScheduleEdit();
    } catch(err) {
      document.getElementById('schedule-view-container').innerHTML = '<div class="empty-state"><p>Ошибка загрузки</p></div>';
    }
  }

  async function loadWishes() {
    try {
      wishesData = await scheduleApi.getWishes(currentMonth);
      renderWishes();
    } catch(err) { console.error(err); }
  }

  function getDaysInMonth(month) {
    const [y, m] = month.split('-').map(Number);
    const days = [];
    const daysCount = new Date(y, m, 0).getDate();
    for (let d = 1; d <= daysCount; d++) {
      const date = new Date(y, m - 1, d);
      days.push({
        day: d,
        dateStr: `${month}-${String(d).padStart(2, '0')}`,
        dow: date.getDay()
      });
    }
    return days;
  }

  function getShiftForCell(empId, dateStr) {
    return scheduleData.find(s => s.id_employee === empId && s.work_date === dateStr);
  }

  function getWishForCell(empId, dateStr) {
    return wishesData.find(w => w.id_employee === empId && w.wish_date === dateStr);
  }

  function renderScheduleTable(containerId, isEdit) {
    const container = document.getElementById(containerId);
    if (!employees.length) {
      container.innerHTML = '<div class="empty-state"><p>Нет сотрудников</p></div>';
      return;
    }

    const days = getDaysInMonth(currentMonth);
    const dowNames = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
    const monthName = getMonthName(currentMonth);

    let html = `<div class="schedule-table-wrap"><table class="schedule-table">
      <thead>
        <tr>
          <th class="emp-name">Сотрудник</th>
          ${days.map(d => `<th style="text-align:center">${d.day}<br><span style="font-weight:400">${dowNames[d.dow]}</span></th>`).join('')}
        </tr>
      </thead>
      <tbody>`;

    for (const emp of employees) {
      html += `<tr><td class="emp-name" title="${emp.full_name}">${emp.full_name.split(' ')[0]} ${emp.full_name.split(' ')[1] || ''}</td>`;
      for (const { dateStr, dow } of days) {
        const shift = getShiftForCell(emp.id, dateStr);
        const wish = getWishForCell(emp.id, dateStr);
        const isWeekend = dow === 0 || dow === 6;
        const classes = ['schedule-cell', isWeekend ? 'weekend' : '', shift ? 'has-shift' : '', wish ? 'has-wish' : ''].filter(Boolean).join(' ');

        let cellContent = '';
        if (wish) {
          cellContent = `<div class="shift-time" style="color:var(--danger)">${wish.preferred_start || '?'}–${wish.preferred_end || '?'}</div>`;
        } else if (shift) {
          cellContent = `<div class="shift-time">${shift.start_time || ''}–${shift.end_time || ''}</div>`;
        }

        if (isEdit) {
          const shiftId = shift ? shift.id : '';
          html += `<td class="${classes}" onclick="openShiftEditor(${emp.id}, '${dateStr}', '${shift ? shift.start_time : ''}', '${shift ? shift.end_time : ''}', ${shiftId || 'null'})" title="${shift ? `ID: ${shift.id}` : ''}">
            ${cellContent}
          </td>`;
        } else {
          html += `<td class="${classes}" title="${shift ? `Смена ID:${shift.id} | ${shift.start_time}–${shift.end_time}` : wish ? 'Пожелание' : ''}">
            ${cellContent}
          </td>`;
        }
      }
      html += '</tr>';
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  function renderScheduleView() {
    renderScheduleTable('schedule-view-container', false);
  }

  function renderScheduleEdit() {
    renderScheduleTable('schedule-edit-container', true);
  }

  function renderWishes() {
    const container = document.getElementById('wishes-container');
    if (!wishesData.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">💭</div><h3>Нет пожеланий</h3><p>Сотрудники не добавили пожеланий на этот период</p></div>';
      return;
    }

    const html = wishesData.map(w => `
      <div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;gap:12px;align-items:flex-start">
        <div style="color:var(--danger);font-size:20px">💭</div>
        <div>
          <div style="font-weight:600;font-size:14px">${w.full_name}</div>
          <div style="font-size:13px;color:var(--text-muted)">${formatDate(w.wish_date)} | ${w.preferred_start || '?'} – ${w.preferred_end || '?'}</div>
          ${w.note ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px">${w.note}</div>` : ''}
        </div>
      </div>
    `).join('');
    container.innerHTML = html;
  }

  function populateWishEmployeeSelect() {
    const sel = document.getElementById('wish-emp');
    sel.innerHTML = employees.map(e => `<option value="${e.id}">${e.full_name}</option>`).join('');
  }

  // Shift editor modal
  window.openShiftEditor = function(empId, dateStr, startTime, endTime, shiftId) {
    const emp = employees.find(e => e.id === empId);
    document.getElementById('shift-info').textContent = `${emp?.full_name || ''} — ${formatDate(dateStr)}`;
    document.getElementById('shift-emp-id').value = empId;
    document.getElementById('shift-date').value = dateStr;
    document.getElementById('shift-id').value = shiftId || '';
    document.getElementById('shift-start').value = startTime || '09:00';
    document.getElementById('shift-end').value = endTime || '18:00';
    document.getElementById('btn-delete-shift').style.display = shiftId ? 'inline-flex' : 'none';
    hideAlert('shift-alert');
    openModal('shift-modal');
  };

  document.getElementById('btn-save-shift').addEventListener('click', async () => {
    const empId = parseInt(document.getElementById('shift-emp-id').value);
    const date = document.getElementById('shift-date').value;
    const start = document.getElementById('shift-start').value;
    const end = document.getElementById('shift-end').value;

    if (!start || !end) {
      showAlert('shift-alert', 'Укажите время начала и конца', 'error');
      return;
    }

    try {
      await scheduleApi.upsertShift({ id_employee: empId, work_date: date, start_time: start, end_time: end });
      closeModal('shift-modal');
      await loadSchedule();
      showToast('Смена сохранена', 'success');
    } catch (err) {
      showAlert('shift-alert', err.message, 'error');
    }
  });

  document.getElementById('btn-delete-shift').addEventListener('click', async () => {
    const shiftId = document.getElementById('shift-id').value;
    if (!shiftId) return;

    showConfirm('Удалить смену?', 'Смена будет удалена безвозвратно', async () => {
      try {
        await scheduleApi.deleteShift(shiftId);
        closeModal('shift-modal');
        await loadSchedule();
        showToast('Смена удалена', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // Save all button (no-op for now, shifts saved individually)
  document.getElementById('btn-save-all').addEventListener('click', () => {
    showToast('Все изменения сохраняются автоматически при клике на ячейку', 'default');
  });

  // Change request
  document.getElementById('btn-change-request').addEventListener('click', () => {
    hideAlert('cr-alert');
    openModal('change-request-modal');
  });

  document.getElementById('btn-submit-cr').addEventListener('click', async () => {
    const schedId = parseInt(document.getElementById('cr-schedule-id').value);
    const type = document.getElementById('cr-type').value;
    const reason = document.getElementById('cr-reason').value.trim();
    const replId = document.getElementById('cr-replacement').value;

    if (!schedId || !reason) {
      showAlert('cr-alert', 'Заполните ID смены и причину', 'error');
      return;
    }

    try {
      await scheduleApi.changeRequest({
        id_schedule: schedId,
        request_type: type,
        reason,
        replacement_employee_id: replId ? parseInt(replId) : null
      });
      closeModal('change-request-modal');
      showToast('Заявка отправлена', 'success');
    } catch (err) {
      showAlert('cr-alert', err.message, 'error');
    }
  });

  // Wish modal
  document.getElementById('btn-add-wish').addEventListener('click', () => {
    hideAlert('wish-alert');
    openModal('wish-modal');
  });

  document.getElementById('btn-save-wish').addEventListener('click', async () => {
    const empId = parseInt(document.getElementById('wish-emp').value);
    const date = document.getElementById('wish-date').value;
    const start = document.getElementById('wish-start').value;
    const end = document.getElementById('wish-end').value;
    const note = document.getElementById('wish-note').value.trim();

    if (!empId || !date) {
      showAlert('wish-alert', 'Выберите сотрудника и дату', 'error');
      return;
    }

    try {
      await scheduleApi.addWish({ id_employee: empId, wish_date: date, preferred_start: start, preferred_end: end, note });
      closeModal('wish-modal');
      await loadWishes();
      showToast('Пожелание сохранено', 'success');
    } catch (err) {
      showAlert('wish-alert', err.message, 'error');
    }
  });

  await loadAll();
});
