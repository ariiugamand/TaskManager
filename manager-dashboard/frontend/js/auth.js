// FILE: frontend/js/auth.js

const TOKEN_KEY = 'mgr_token';
const USER_KEY = 'mgr_user';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getUser() {
  try {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function isAuthenticated() {
  return !!getToken();
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
}

function requireGuest() {
  if (isAuthenticated()) {
    window.location.href = '/pages/dashboard.html';
    return false;
  }
  return true;
}

function logout() {
  removeToken();
  window.location.href = '/pages/login.html';
}
