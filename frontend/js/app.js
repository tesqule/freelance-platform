const API_BASE = 'http://localhost:5000/api';

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function apiAuth(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function getCurrentUser() {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}

function setCurrentUser(user, token) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
}

function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

function updateNavForAuth() {
  const user = getCurrentUser();
  const el = document.getElementById('navActions');
  if (!el) return;

  if (user) {
    el.innerHTML = `
      <a href="chat.html" class="btn btn-ghost btn-sm">💬</a>
      <a href="dashboard.html" class="btn btn-ghost btn-sm">
        <span class="avatar" style="width:28px;height:28px;font-size:0.8rem;background:linear-gradient(135deg,var(--accent),var(--accent2));">
          ${user.avatar ? `<img src="${user.avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">` : user.name.charAt(0)}
        </span>
        ${user.name.split(' ')[0]}
      </a>`;
  } else {
    el.innerHTML = `
      <a href="#" class="btn btn-outline btn-sm" onclick="openAuthModal ? openAuthModal('login') : window.location.href='index.html'">Войти</a>
      <a href="#" class="btn btn-primary btn-sm" onclick="openAuthModal ? openAuthModal('register') : window.location.href='index.html'">Регистрация</a>`;
  }
}

function showToast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.querySelectorAll(`#${id} input, #${id} textarea`).forEach(el => el.value = '');
}

function renderTaskCard(task) {
  const catEmojis = { development:'💻', design:'🎨', writing:'✍️', marketing:'📣', video:'🎬', music:'🎵', other:'🔧' };
  const deadline = new Date(task.deadline).toLocaleDateString('ru-RU');
  return `
    <div class="task-card" onclick="window.location.href='task-detail.html?id=${task._id}'">
      <div class="task-card-header">
        <h3>${task.title}</h3>
        <div class="task-budget">₽${task.budget.toLocaleString()}</div>
      </div>
      <p class="task-desc">${task.description}</p>
      ${task.skills?.length ? `
        <div class="task-skills">
          ${task.skills.slice(0,3).map(s => `<span class="skill-tag">${s}</span>`).join('')}
          ${task.skills.length > 3 ? `<span class="skill-tag">+${task.skills.length-3}</span>` : ''}
        </div>` : ''}
      <div class="task-meta">
        <div class="task-client">
          <div class="avatar" style="width:24px;height:24px;font-size:0.7rem;background:linear-gradient(135deg,var(--accent),var(--accent2));">
            ${task.client?.avatar ? `<img src="${task.client.avatar}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">` : (task.client?.name || '?').charAt(0)}
          </div>
          ${task.client?.name || 'Заказчик'}
        </div>
        <div class="task-info">
          <span>${catEmojis[task.category] || '🔧'}</span>
          <span>⏰ ${deadline}</span>
          <span>💬 ${task.proposals?.length || 0}</span>
        </div>
      </div>
    </div>`;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });
}

function formatDate(date) {
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Сегодня';
  return d.toLocaleDateString('ru-RU', { day:'numeric', month:'short' });
}