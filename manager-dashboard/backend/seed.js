// FILE: backend/seed.js
const bcrypt = require('bcryptjs');
const { db, initializeDatabase } = require('./db');

initializeDatabase();

function seed() {
  // Clear existing data
  db.exec(`
    DELETE FROM PasswordResetCodes;
    DELETE FROM Notifications;
    DELETE FROM EmployeeScheduleWish;
    DELETE FROM Application;
    DELETE FROM ApplicationType;
    DELETE FROM Task_Employee;
    DELETE FROM Task;
    DELETE FROM TaskType;
    DELETE FROM Employee_Event;
    DELETE FROM Events;
    DELETE FROM WorkSchedule;
    DELETE FROM Users;
    DELETE FROM Employee;
    DELETE FROM Role;
    DELETE FROM Department;
  `);

  // 1. Departments
  const deptStmt = db.prepare('INSERT INTO Department (name) VALUES (?)');
  const dept1 = deptStmt.run('Разработка');
  const dept2 = deptStmt.run('HR');

  // 2. Roles
  const roleStmt = db.prepare('INSERT INTO Role (name) VALUES (?)');
  const roleManager = roleStmt.run('Manager');
  const roleEmployee = roleStmt.run('Employee');

  // 3. Employees
  const empStmt = db.prepare(`
    INSERT INTO Employee (full_name, contacts, position, birth_date, id_department, id_role, is_manager)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Manager
  const manager = empStmt.run(
    'Иванов Алексей Сергеевич',
    'admin@example.com | +7-900-000-0001',
    'Руководитель отдела разработки',
    '1985-03-15',
    dept1.lastInsertRowid,
    roleManager.lastInsertRowid,
    1
  );

  // Employees in dept1
  const emp1 = empStmt.run(
    'Петров Дмитрий Александрович',
    'petrov@example.com | +7-900-000-0002',
    'Senior Frontend Developer',
    '1990-07-22',
    dept1.lastInsertRowid,
    roleEmployee.lastInsertRowid,
    0
  );
  const emp2 = empStmt.run(
    'Сидорова Мария Ивановна',
    'sidorova@example.com | +7-900-000-0003',
    'Backend Developer',
    '1993-11-05',
    dept1.lastInsertRowid,
    roleEmployee.lastInsertRowid,
    0
  );
  const emp3 = empStmt.run(
    'Козлов Николай Петрович',
    'kozlov@example.com | +7-900-000-0004',
    'QA Engineer',
    '1995-02-18',
    dept1.lastInsertRowid,
    roleEmployee.lastInsertRowid,
    0
  );

  // 4. Users (only manager has login)
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO Users (id_employee, login, password, email) VALUES (?, ?, ?, ?)
  `).run(manager.lastInsertRowid, 'admin', hashedPassword, 'admin@example.com');

  // 5. Work Schedule — current month
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate();

  const schedStmt = db.prepare(`
    INSERT INTO WorkSchedule (id_employee, work_date, start_time, end_time) VALUES (?, ?, ?, ?)
  `);

  const employees = [manager.lastInsertRowid, emp1.lastInsertRowid, emp2.lastInsertRowid, emp3.lastInsertRowid];

  for (const empId of employees) {
    for (let day = 1; day <= Math.min(daysInMonth, 20); day++) {
      const dayStr = String(day).padStart(2, '0');
      const date = new Date(year, today.getMonth(), day);
      const dow = date.getDay();
      // Skip weekends
      if (dow === 0 || dow === 6) continue;
      // Alternate shifts for variety
      if (empId === emp2.lastInsertRowid && day % 3 === 0) {
        schedStmt.run(empId, `${year}-${month}-${dayStr}`, '14:00', '22:00');
      } else {
        schedStmt.run(empId, `${year}-${month}-${dayStr}`, '09:00', '18:00');
      }
    }
  }

  // 6. Schedule Wishes
  const wishStmt = db.prepare(`
    INSERT INTO EmployeeScheduleWish (id_employee, wish_date, preferred_start, preferred_end, note) VALUES (?, ?, ?, ?, ?)
  `);
  const nextDay = String(Math.min(daysInMonth, today.getDate() + 3)).padStart(2, '0');
  wishStmt.run(emp1.lastInsertRowid, `${year}-${month}-${nextDay}`, '10:00', '19:00', 'Врач утром');
  wishStmt.run(emp3.lastInsertRowid, `${year}-${month}-${nextDay}`, '08:00', '17:00', 'Хотел бы пораньше');

  // 7. Task Types
  const ttStmt = db.prepare('INSERT INTO TaskType (name, description) VALUES (?, ?)');
  const tt1 = ttStmt.run('Разработка', 'Задачи по разработке ПО');
  const tt2 = ttStmt.run('Тестирование', 'Задачи по тестированию');
  const tt3 = ttStmt.run('Документация', 'Написание документации');

  // 8. Tasks
  const taskStmt = db.prepare(`
    INSERT INTO Task (name, description, deadline, status, percent_complete, created_date, id_author, id_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const nextMonth = new Date(today);
  nextMonth.setDate(nextMonth.getDate() + 14);
  const deadlineStr = nextMonth.toISOString().split('T')[0];

  const task1 = taskStmt.run(
    'Разработать API модуля авторизации',
    'Необходимо реализовать JWT авторизацию с refresh токенами',
    deadlineStr, 'in_progress', 60,
    today.toISOString().split('T')[0],
    manager.lastInsertRowid, tt1.lastInsertRowid
  );
  const task2 = taskStmt.run(
    'Написать unit тесты',
    'Покрыть тестами основные модули бэкенда',
    deadlineStr, 'new', 0,
    today.toISOString().split('T')[0],
    manager.lastInsertRowid, tt2.lastInsertRowid
  );
  const task3 = taskStmt.run(
    'Обновить техническую документацию',
    'Обновить README и документацию API',
    deadlineStr, 'done', 100,
    today.toISOString().split('T')[0],
    manager.lastInsertRowid, tt3.lastInsertRowid
  );

  // Task assignments
  const teStmt = db.prepare('INSERT INTO Task_Employee (id_task, id_employee) VALUES (?, ?)');
  teStmt.run(task1.lastInsertRowid, emp1.lastInsertRowid);
  teStmt.run(task1.lastInsertRowid, emp2.lastInsertRowid);
  teStmt.run(task2.lastInsertRowid, emp3.lastInsertRowid);
  teStmt.run(task3.lastInsertRowid, emp1.lastInsertRowid);

  // 9. Events
  const eventStmt = db.prepare(`
    INSERT INTO Events (name, description, event_date, event_time, importance, event_type, id_organizer)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const event1 = eventStmt.run(
    'Командный стендап',
    'Еженедельное собрание команды для обсуждения прогресса',
    tomorrowStr, '10:00', 'high', 'meeting',
    manager.lastInsertRowid
  );
  const event2 = eventStmt.run(
    'Код-ревью спринта',
    'Разбор pull request-ов за неделю',
    nextWeekStr, '14:00', 'normal', 'review',
    manager.lastInsertRowid
  );

  // Employee_Event
  const eeStmt = db.prepare('INSERT INTO Employee_Event (id_employee, id_event, role_in_event) VALUES (?, ?, ?)');
  [emp1.lastInsertRowid, emp2.lastInsertRowid, emp3.lastInsertRowid].forEach(eid => {
    eeStmt.run(eid, event1.lastInsertRowid, 'participant');
    eeStmt.run(eid, event2.lastInsertRowid, 'participant');
  });

  // 10. Application Types
  const atStmt = db.prepare('INSERT INTO ApplicationType (name) VALUES (?)');
  const at1 = atStmt.run('Отпуск');
  const at2 = atStmt.run('Больничный');
  const at3 = atStmt.run('Перенос смены');
  const at4 = atStmt.run('Пожелание по графику');

  // 11. Applications
  const appStmt = db.prepare(`
    INSERT INTO Application (name, description, id_type, id_employee, created_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  appStmt.run(
    'Заявление на отпуск',
    'Прошу предоставить ежегодный оплачиваемый отпуск с 1 по 14 мая',
    at1.lastInsertRowid, emp1.lastInsertRowid,
    today.toISOString(), 'pending'
  );
  appStmt.run(
    'Больничный лист',
    'Предоставляю больничный лист за 2 дня',
    at2.lastInsertRowid, emp2.lastInsertRowid,
    today.toISOString(), 'approved'
  );
  appStmt.run(
    'Перенос смены',
    'Прошу перенести смену с 10 на 11 число',
    at3.lastInsertRowid, emp3.lastInsertRowid,
    today.toISOString(), 'pending'
  );

  console.log('✅ Seed data inserted successfully');
  console.log('');
  console.log('📋 Test credentials:');
  console.log('   Login: admin');
  console.log('   Password: admin123');
  console.log('   Email: admin@example.com');
}

try {
  seed();
  process.exit(0);
} catch (err) {
  console.error('❌ Seed error:', err);
  process.exit(1);
}
