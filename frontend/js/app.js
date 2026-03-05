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

initTheme();

/* ── NOTIFICATIONS (MongoDB) ─────────────────────────── */

async function loadNotifCount() {
  try {
    const data = await apiAuth('/notifications/unread/count');
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    if (data.count > 0) {
      badge.textContent = data.count > 9 ? '9+' : data.count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  } catch(e) {}
}

async function renderNotifList() {
  const list = document.getElementById('notifList');
  if (!list) return;
  list.innerHTML = '<div class="notif-empty" style="padding:1rem;text-align:center;color:var(--text3);">Загрузка...</div>';
  try {
    const notifs = await apiAuth('/notifications');
    if (!notifs.length) {
      list.innerHTML = '<div class="notif-empty">🔔 Уведомлений нет</div>';
      return;
    }
    list.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}" onclick="openNotif('${n._id}','${n.link}')">
        <div class="notif-icon">${n.icon}</div>
        <div style="flex:1;min-width:0;">
          <div class="notif-text">${n.text}</div>
          <div class="notif-time">${formatRelativeTime(n.createdAt)}</div>
        </div>
      </div>`).join('');
  } catch(e) {
    list.innerHTML = '<div class="notif-empty">Ошибка загрузки</div>';
  }
}

async function openNotif(id, link) {
  try { await apiAuth('/notifications/read/all', { method: 'PATCH' }); } catch(e) {}
  if (link) window.location.href = link;
}

async function toggleNotifDropdown() {
  const dropdown = document.getElementById('notifDropdown');
  if (!dropdown) return;
  const isOpen = dropdown.classList.contains('open');
  dropdown.classList.toggle('open');
  if (!isOpen) {
    await renderNotifList();
    try {
      await apiAuth('/notifications/read/all', { method: 'PATCH' });
      const badge = document.getElementById('notifBadge');
      if (badge) badge.style.display = 'none';
    } catch(e) {}
  }
}

async function clearNotifications() {
  try {
    await apiAuth('/notifications/all', { method: 'DELETE' });
    const list = document.getElementById('notifList');
    if (list) list.innerHTML = '<div class="notif-empty">🔔 Уведомлений нет</div>';
    const badge = document.getElementById('notifBadge');
    if (badge) badge.style.display = 'none';
  } catch(e) {}
}

function updateNotifBadge() { loadNotifCount(); }

function formatRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.floor(hours / 24)} д назад`;
}

/* ── NAV ─────────────────────────────────────────────── */
function updateNavForAuth() {
  const user = getCurrentUser();
  const el = document.getElementById('navActions');
  if (!el) return;
  const themeIcon = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark' ? '☀️' : '🌙';

  if (user) {
    el.innerHTML = `
      <button class="theme-toggle" id="themeToggle" onclick="toggleTheme()">${themeIcon}</button>
      <div class="notif-wrapper">
        <button class="notif-btn" id="notifBtn" onclick="toggleNotifDropdown()">
          🔔<span class="notif-badge" id="notifBadge" style="display:none">0</span>
        </button>
        <div class="notif-dropdown" id="notifDropdown">
          <div class="notif-dropdown-header">
            <span>Уведомления</span>
            <span class="notif-clear" onclick="clearNotifications()">Очистить</span>
          </div>
          <div class="notif-list" id="notifList"><div class="notif-empty">🔔 Уведомлений нет</div></div>
        </div>
      </div>
      <a href="chat.html" class="btn btn-ghost btn-sm" style="position:relative;">
        💬<span id="chatNavBadge" style="
          display:none;position:absolute;top:-4px;right:-4px;
          background:var(--blue);color:#fff;border-radius:99px;
          font-size:.6rem;font-weight:700;min-width:16px;height:16px;
          align-items:center;justify-content:center;padding:0 4px;
        ">0</span>
      </a>
      ${user.role === 'admin' ? `<a href="admin.html" class="btn btn-ghost btn-sm">⚙️</a>` : ''}
      <a href="dashboard.html" class="btn btn-ghost btn-sm">
        <span class="avatar" style="width:28px;height:28px;font-size:0.8rem;background:linear-gradient(135deg,var(--blue),var(--purple));">
          ${user.avatar ? `<img src="${user.avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">` : user.name.charAt(0)}
        </span>
        ${user.name.split(' ')[0]}
      </a>`;

    document.addEventListener('click', e => {
      const wrapper = document.querySelector('.notif-wrapper');
      if (wrapper && !wrapper.contains(e.target)) document.getElementById('notifDropdown')?.classList.remove('open');
    });

    loadNotifCount();
    loadChatUnreadBadge();
    setInterval(loadNotifCount, 30000);
    setInterval(loadChatUnreadBadge, 30000);
  } else {
    el.innerHTML = `
      <button class="theme-toggle" id="themeToggle" onclick="toggleTheme()">${themeIcon}</button>
      <a href="#" class="btn btn-outline btn-sm" onclick="openAuthModal ? openAuthModal('login') : window.location.href='index.html'">Войти</a>
      <a href="#" class="btn btn-primary btn-sm" onclick="openAuthModal ? openAuthModal('register') : window.location.href='index.html'">Регистрация</a>`;
  }
}

async function loadChatUnreadBadge() {
  try {
    const counts = await apiAuth('/chat/unread/counts');
    if (counts && typeof counts === 'object') {
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const badge = document.getElementById('chatNavBadge');
      if (badge) {
        if (total > 0) { badge.textContent = total > 9 ? '9+' : total; badge.style.display = 'flex'; }
        else badge.style.display = 'none';
      }
    }
  } catch(e) {}
}

/* ── SKELETONS ───────────────────────────────────────── */
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
    </div>`).join('');
}

function skeletonFreelancerCards(count = 4) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-card" style="align-items:center;">
      <div class="skeleton skeleton-avatar" style="width:56px;height:56px;margin-bottom:0.5rem;"></div>
      <div class="skeleton skeleton-line w-3-4 h-lg" style="margin-bottom:0.4rem;"></div>
      <div class="skeleton skeleton-line w-1-2 h-sm"></div>
    </div>`).join('');
}

/* ── TOAST ───────────────────────────────────────────── */
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

/* ── MODALS ──────────────────────────────────────────── */
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.querySelectorAll(`#${id} input, #${id} textarea`).forEach(el => el.value = '');
}

/* ── RENDER TASK CARD ────────────────────────────────── */
function renderTaskCard(task) {
  const catEmojis = { development:'💻', design:'🎨', writing:'✍️', marketing:'📣', video:'🎬', music:'🎵', other:'🔧' };
  const deadline = new Date(task.deadline).toLocaleDateString('ru-RU');
  const isFav = typeof favTaskIds !== 'undefined' && favTaskIds.has(task._id);
  const user = getCurrentUser();
  const favBtn = user ? `
    <button onclick="typeof toggleFavorite==='function'?toggleFavorite('${task._id}',this,event):event.stopPropagation()"
      style="position:absolute;top:.85rem;right:.85rem;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.4);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.9rem;z-index:2;">
      ${isFav ? '❤️' : '🤍'}
    </button>` : '';
  return `
    <div class="task-card" style="position:relative;" onclick="window.location.href='task-detail.html?id=${task._id}'">
      ${favBtn}
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
            ${task.client?.avatar ? `<img src="${task.client.avatar}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">` : (task.client?.name||'?').charAt(0)}
          </div>
          ${task.client?.name || 'Заказчик'}
        </div>
        <div class="task-info">
          <span>${catEmojis[task.category]||'🔧'}</span>
          <span>⏰ ${deadline}</span>
          <span>💬 ${task.proposals?.length||0}</span>
        </div>
      </div>
    </div>`;
}

/* ── TIME ────────────────────────────────────────────── */
function formatTime(date) { return new Date(date).toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' }); }
function formatDate(date) {
  const d = new Date(date);
  if (d.toDateString() === new Date().toDateString()) return 'Сегодня';
  return d.toLocaleDateString('ru-RU', { day:'numeric', month:'short' });
}

/* ── CHAT SEARCH ─────────────────────────────────────── */
function filterConversations(val) {
  document.querySelectorAll('.conversation-item').forEach(item => {
    const name = item.querySelector('.conv-name')?.textContent?.toLowerCase() || '';
    item.style.display = name.includes(val.toLowerCase()) ? '' : 'none';
  });
}