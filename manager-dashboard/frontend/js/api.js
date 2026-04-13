// FILE: frontend/js/api.js

const API_BASE = '/api';

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(API_BASE + url, {
      ...options,
      headers
    });

    // Auto-logout on 401
    if (response.status === 401) {
      removeToken();
      window.location.href = '/pages/login.html';
      return;
    }

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new ApiError(data?.error || 'Ошибка сервера', response.status, data);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Ошибка сети. Проверьте подключение.', 0);
  }
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Auth API
const authApi = {
  register: (data) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyCode: (email, code) => apiFetch('/auth/verify-reset-code', { method: 'POST', body: JSON.stringify({ email, code }) }),
  resetPassword: (email, code, new_password) => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code, new_password }) }),
};

// Employees API
const employeesApi = {
  getAll: () => apiFetch('/employees'),
  getById: (id) => apiFetch(`/employees/${id}`),
};

// Schedule API
const scheduleApi = {
  getSchedule: (month) => apiFetch(`/schedule?month=${month}`),
  upsertShift: (data) => apiFetch('/schedule', { method: 'POST', body: JSON.stringify(data) }),
  deleteShift: (id) => apiFetch(`/schedule/${id}`, { method: 'DELETE' }),
  getWishes: (month) => apiFetch(`/schedule/wishes?month=${month}`),
  addWish: (data) => apiFetch('/schedule/wishes', { method: 'POST', body: JSON.stringify(data) }),
  changeRequest: (data) => apiFetch('/schedule/change-request', { method: 'POST', body: JSON.stringify(data) }),
};

// Events API
const eventsApi = {
  getAll: (month) => apiFetch('/events' + (month ? `?month=${month}` : '')),
  getById: (id) => apiFetch(`/events/${id}`),
  create: (data) => apiFetch('/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/events/${id}`, { method: 'DELETE' }),
  notify: (id, employee_ids) => apiFetch(`/events/${id}/notify`, { method: 'POST', body: JSON.stringify({ employee_ids }) }),
};

// Tasks API
const tasksApi = {
  getAll: (month) => apiFetch('/tasks' + (month ? `?month=${month}` : '')),
  getById: (id) => apiFetch(`/tasks/${id}`),
  create: (data) => apiFetch('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
  getTypes: () => apiFetch('/tasks/types'),
};

// Applications API
const applicationsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch('/applications' + (q ? `?${q}` : ''));
  },
  getById: (id) => apiFetch(`/applications/${id}`),
  review: (id, data) => apiFetch(`/applications/${id}/review`, { method: 'PUT', body: JSON.stringify(data) }),
  getTypes: () => apiFetch('/application-types'),
};
