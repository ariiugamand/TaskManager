# Manager Dashboard

Система управления отделом для руководителей. Node.js + Express + SQLite + Vanilla JS.

---

## Архитектура

### Backend
- **Express** REST API с разделением на слои: routes → controllers → services → db
- **SQLite** (better-sqlite3) — синхронные запросы, WAL режим
- **JWT** авторизация через middleware (authenticateToken)
- **bcryptjs** — хэширование паролей
- Все данные фильтруются по `id_department` руководителя — сотрудники других отделов недоступны

### Frontend
- Чистые HTML + CSS + Vanilla JS, без фреймворков
- `auth.js` — работа с токеном в localStorage
- `api.js` — единая функция `apiFetch()` с автоматическим добавлением Authorization header и обработкой 401
- `ui.js` — тосты, модалки, sidebar, вспомогательные функции
- Каждая страница при загрузке вызывает `requireAuth()` → редирект на `/pages/login.html`

### Дополнительные таблицы (сверх схемы из ТЗ)
- `Notifications` — хранение истории уведомлений об событиях
- `EmployeeScheduleWish` — пожелания сотрудников по графику (отображаются красным в редакторе)
- `PasswordResetCodes` — коды сброса пароля с счётчиком попыток и блокировкой
- Поле `Employee.is_manager` — признак руководителя (проверяется при регистрации)
- Поле `Users.email` — для сброса пароля
- Поля `Events.event_time`, `Events.event_type` — добавлены для полноты функционала
- Поле `Task.percent_complete` — процент выполнения задачи

---

## Быстрый старт

```bash
cd manager-dashboard
npm install
node backend/init-db.js   # Создать таблицы
node backend/seed.js      # Загрузить тестовые данные
npm run dev               # Запустить (nodemon) или npm start
```

Открыть: **http://localhost:3000**

### Тестовые данные
| Поле | Значение |
|------|----------|
| Логин | `admin` |
| Пароль | `admin123` |
| Email | `admin@example.com` |

---

## Структура проекта

```
manager-dashboard/
├── backend/
│   ├── server.js              # Express сервер
│   ├── db.js                  # БД инициализация, CREATE TABLE
│   ├── init-db.js             # Скрипт создания таблиц
│   ├── seed.js                # Тестовые данные
│   ├── middleware/
│   │   └── auth.js            # JWT проверка
│   ├── routes/                # Express роутеры
│   │   ├── auth.js
│   │   ├── employees.js
│   │   ├── schedule.js
│   │   ├── events.js
│   │   ├── tasks.js
│   │   └── applications.js
│   ├── controllers/           # Обработка запросов
│   ├── services/              # Бизнес-логика + запросы к БД
│   └── data/
│       └── database.db        # SQLite файл (создаётся автоматически)
├── frontend/
│   ├── index.html             # Редирект на login/dashboard
│   ├── pages/
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── reset-password.html
│   │   ├── dashboard.html
│   │   ├── schedule.html
│   │   ├── events.html
│   │   ├── tasks.html
│   │   └── applications.html
│   ├── css/
│   │   ├── main.css           # Основные стили, layout, компоненты
│   │   └── components.css     # Дополнительные компоненты
│   └── js/
│       ├── auth.js            # getToken/setToken/removeToken/requireAuth
│       ├── api.js             # apiFetch + объекты API по сущностям
│       ├── ui.js              # Toast, Modal, Sidebar, badges, utils
│       └── pages/             # Логика каждой страницы
├── .env                       # Переменные окружения
├── package.json
└── README.md
```

---

## API Reference

### Аутентификация

| Method | URL | Body | Описание |
|--------|-----|------|----------|
| POST | `/api/auth/register` | `{login, email, contacts, password}` | Регистрация |
| POST | `/api/auth/login` | `{identifier, password}` | Вход (login или email) |
| POST | `/api/auth/forgot-password` | `{email}` | Запрос кода сброса |
| POST | `/api/auth/verify-reset-code` | `{email, code}` | Проверка кода |
| POST | `/api/auth/reset-password` | `{email, code, new_password}` | Сброс пароля |

### Сотрудники (требуют токен)

| Method | URL | Описание |
|--------|-----|----------|
| GET | `/api/employees` | Сотрудники отдела руководителя |
| GET | `/api/employees/:id` | Конкретный сотрудник |

### График

| Method | URL | Описание |
|--------|-----|----------|
| GET | `/api/schedule?month=YYYY-MM` | Смены на месяц |
| POST | `/api/schedule` | Создать/обновить смену `{id_employee, work_date, start_time, end_time}` |
| DELETE | `/api/schedule/:id` | Удалить смену |
| GET | `/api/schedule/wishes?month=YYYY-MM` | Пожелания |
| POST | `/api/schedule/wishes` | Добавить пожелание |
| POST | `/api/schedule/change-request` | Заявка на изменение смены |

### События

| Method | URL | Описание |
|--------|-----|----------|
| GET | `/api/events?month=YYYY-MM` | Все события |
| GET | `/api/events/:id` | Событие с участниками |
| POST | `/api/events` | Создать событие |
| PUT | `/api/events/:id` | Обновить событие |
| DELETE | `/api/events/:id` | Удалить событие |
| POST | `/api/events/:id/notify` | Отправить уведомления `{employee_ids: 'all'|[1,2,3]}` |

### Задачи

| Method | URL | Описание |
|--------|-----|----------|
| GET | `/api/tasks?month=YYYY-MM` | Все задачи |
| GET | `/api/tasks/:id` | Задача с исполнителями |
| POST | `/api/tasks` | Создать задачу `{name, id_type, status, deadline, percent_complete, assignee_ids}` |
| PUT | `/api/tasks/:id` | Обновить задачу |
| DELETE | `/api/tasks/:id` | Удалить задачу |
| GET | `/api/tasks/types` | Типы задач |

### Заявления

| Method | URL | Описание |
|--------|-----|----------|
| GET | `/api/applications?status=&type_id=&date_from=&date_to=` | Список с фильтрами |
| GET | `/api/applications/:id` | Детали заявления |
| PUT | `/api/applications/:id/review` | Обработать `{status: 'approved'|'rejected', reviewed_result}` |
| GET | `/api/application-types` | Типы заявлений |

---

## Сброс пароля

1. Вводится email → на сервере генерируется 6-значный код
2. Код выводится в консоль сервера (эмуляция email)
3. Пользователь вводит код → при 3 неверных попытках блокировка на 10 минут
4. После верного кода — вводится новый пароль дважды
5. Слой отправки: в `authService.js` метод `forgotPassword()` — замените `console.log` на `nodemailer.sendMail()` для реальной отправки
