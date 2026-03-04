const API_BASE = 'https://freelance-platform-production-2360.up.railway.app/api';

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

/* ============================================================
   THEME TOGGLE
   ============================================================ */
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
}

// Применяем тему сразу чтобы не было мигания
initTheme();

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');

function getUnreadCount() {
  return notifications.filter(n => !n.read).length;
}

function addNotification(text, icon = '💬', link = 'chat.html') {
  const notif = {
    id: Date.now(),
    text,
    icon,
    link,
    read: false,
    time: new Date().toISOString()
  };
  notifications.unshift(notif);
  if (notifications.length > 20) notifications = notifications.slice(0, 20);
  localStorage.setItem('notifications', JSON.stringify(notifications));
  updateNotifBadge();
  return notif;
}

function markAllRead() {
  notifications = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem('notifications', JSON.stringify(notifications));
  updateNotifBadge();
  renderNotifList();
}

function clearNotifications() {
  notifications = [];
  localStorage.setItem('notifications', JSON.stringify(notifications));
  updateNotifBadge();
  renderNotifList();
}

function updateNotifBadge() {
  const badge = document.getElementById('notifBadge');
  const count = getUnreadCount();
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function renderNotifList() {
  const list = document.getElementById('notifList');
  if (!list) return;
  if (!notifications.length) {
    list.innerHTML = '<div class="notif-empty">🔔 Уведомлений нет</div>';
    return;
  }
  list.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="openNotif('${n.id}', '${n.link}')">
      <div class="notif-icon">${n.icon}</div>
      <div>
        <div class="notif-text">${n.text}</div>
        <div class="notif-time">${formatRelativeTime(n.time)}</div>
      </div>
    </div>
  `).join('');
}

function openNotif(id, link) {
  const notif = notifications.find(n => n.id == id);
  if (notif) notif.read = true;
  localStorage.setItem('notifications', JSON.stringify(notifications));
  updateNotifBadge();
  if (link) window.location.href = link;
}

function toggleNotifDropdown() {
  const dropdown = document.getElementById('notifDropdown');
  if (!dropdown) return;
  const isOpen = dropdown.classList.contains('open');
  if (!isOpen) {
    renderNotifList();
    markAllRead();
  }
  dropdown.classList.toggle('open');
}

function formatRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.floor(hours / 24)} д назад`;
}

/* ============================================================
   NAV UPDATE
   ============================================================ */
function updateNavForAuth() {
  const user = getCurrentUser();
  const el = document.getElementById('navActions');
  if (!el) return;

  const themeIcon = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark' ? '☀️' : '🌙';

  if (user) {
    el.innerHTML = `
      <button class="theme-toggle" id="themeToggle" onclick="toggleTheme()" title="Сменить тему">${themeIcon}</button>
      <div class="notif-wrapper">
        <button class="notif-btn" id="notifBtn" onclick="toggleNotifDropdown()" title="Уведомления">
          🔔
          <span class="notif-badge" id="notifBadge" style="display:none">0</span>
        </button>
        <div class="notif-dropdown" id="notifDropdown">
          <div class="notif-dropdown-header">
            <span>Уведомления</span>
            <span class="notif-clear" onclick="clearNotifications()">Очистить</span>
          </div>
          <div class="notif-list" id="notifList">
            <div class="notif-empty">🔔 Уведомлений нет</div>
          </div>
        </div>
      </div>
      <a href="chat.html" class="btn btn-ghost btn-sm">💬</a>
      <a href="dashboard.html" class="btn btn-ghost btn-sm">
        <span class="avatar" style="width:28px;height:28px;font-size:0.8rem;background:linear-gradient(135deg,var(--blue),var(--purple));">
          ${user.avatar ? `<img src="${user.avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">` : user.name.charAt(0)}
        </span>
        ${user.name.split(' ')[0]}
      </a>`;

    // Закрывать dropdown при клике вне
    document.addEventListener('click', e => {
      const wrapper = document.querySelector('.notif-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        document.getElementById('notifDropdown')?.classList.remove('open');
      }
    });

    updateNotifBadge();
  } else {
    el.innerHTML = `
      <button class="theme-toggle" id="themeToggle" onclick="toggleTheme()" title="Сменить тему">${themeIcon}</button>
      <a href="#" class="btn btn-outline btn-sm" onclick="openAuthModal ? openAuthModal('login') : window.location.href='index.html'">Войти</a>
      <a href="#" class="btn btn-primary btn-sm" onclick="openAuthModal ? openAuthModal('register') : window.location.href='index.html'">Регистрация</a>`;
  }
}

/* ============================================================
   SKELETON HELPERS
   ============================================================ */
function skeletonTaskCards(count = 6) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-task-card">
      <div style="display:flex;justify-content:space-between;margin-bottom:0.8rem;">
        <div class="skeleton skeleton-line w-3-4 h-lg"></div>
        <div class="skeleton skeleton-line w-1-3 h-lg" style="margin-left:1rem;"></div>
      </div>
      <div class="skeleton skeleton-line w-full" style="margin-bottom:0.4rem;"></div>
      <div class="skeleton skeleton-line w-3-4" style="margin-bottom:1rem;"></div>
      <div style="display:flex;gap:0.4rem;margin-bottom:1rem;">
        <div class="skeleton skeleton-line w-1-3 h-sm" style="border-radius:4px;"></div>
        <div class="skeleton skeleton-line w-1-3 h-sm" style="border-radius:4px;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;padding-top:0.9rem;border-top:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:0.4rem;">
          <div class="skeleton skeleton-avatar" style="width:24px;height:24px;"></div>
          <div class="skeleton skeleton-line w-1-2 h-sm"></div>
        </div>
        <div class="skeleton skeleton-line w-1-3 h-sm"></div>
      </div>
    </div>
  `).join('');
}

function skeletonFreelancerCards(count = 4) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-card" style="align-items:center;">
      <div class="skeleton skeleton-avatar" style="width:56px;height:56px;margin-bottom:0.5rem;"></div>
      <div class="skeleton skeleton-line w-3-4 h-lg" style="margin-bottom:0.4rem;"></div>
      <div class="skeleton skeleton-line w-1-2 h-sm"></div>
    </div>
  `).join('');
}

/* ============================================================
   TOAST
   ============================================================ */
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

/* ============================================================
   MODALS
   ============================================================ */
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.querySelectorAll(`#${id} input, #${id} textarea`).forEach(el => el.value = '');
}

/* ============================================================
   RENDER TASK CARD
   ============================================================ */
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
          <div class="avatar" style="width:24px;height:24px;font-size:0.7rem;background:linear-gradient(135deg,var(--blue),var(--purple));">
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

/* ============================================================
   TIME HELPERS
   ============================================================ */
function formatTime(date) {
  return new Date(date).toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });
}

function formatDate(date) {
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Сегодня';
  return d.toLocaleDateString('ru-RU', { day:'numeric', month:'short' });
}