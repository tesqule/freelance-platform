/* AUTH */
async function handleLogin() {
  const email = document.getElementById('loginEmail')?.value?.trim();
  const password = document.getElementById('loginPassword')?.value;
  if (!email || !password) { showToast('Заполните все поля', 'error'); return; }
  try {
    const data = await api('/auth/login', { method:'POST', body:JSON.stringify({ email, password }) });
    setCurrentUser(data.user, data.token);
    showToast(`Добро пожаловать, ${data.user.name}! 👋`, 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 800);
  } catch(e) { showToast(e.message || 'Ошибка входа', 'error'); }
}

async function handleRegister() {
  const name = document.getElementById('regName')?.value?.trim();
  const email = document.getElementById('regEmail')?.value?.trim();
  const password = document.getElementById('regPassword')?.value;
  const role = typeof selectedRole !== 'undefined' ? selectedRole : 'freelancer';
  if (!name || !email || !password) { showToast('Заполните все поля', 'error'); return; }
  if (password.length < 6) { showToast('Пароль минимум 6 символов', 'error'); return; }
  try {
    const data = await api('/auth/register', { method:'POST', body:JSON.stringify({ name, email, password, role }) });
    setCurrentUser(data.user, data.token);
    showToast('Аккаунт создан! 🎉', 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 800);
  } catch(e) { showToast(e.message || 'Ошибка регистрации', 'error'); }
}

/* PROFILE */
async function loadProfile() {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'index.html'; return; }
  try {
    const profile = await api(`/users/${user.id}`);
    const headerEl = document.getElementById('profileHeader');
    if (headerEl) {
      headerEl.innerHTML = `
        <div class="card" style="padding:1.5rem;border-radius:var(--radius-lg);display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;">
          <div class="avatar" style="width:76px;height:76px;font-size:1.8rem;flex-shrink:0;">
            ${profile.avatar ? `<img src="${profile.avatar}" style="width:76px;height:76px;border-radius:50%;object-fit:cover;">` : profile.name.charAt(0)}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-family:var(--font-display);font-size:1.3rem;font-weight:700;">${profile.name}</div>
            <div style="margin:.3rem 0;font-size:.85rem;color:var(--text2);">${profile.role === 'client' ? '📋 Заказчик' : '💼 Фрилансер'}</div>
            ${profile.bio ? `<p style="font-size:.85rem;color:var(--text2);margin:.4rem 0 0;line-height:1.6;">${profile.bio}</p>` : ''}
            ${profile.skills?.length ? `<div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.6rem;">${profile.skills.map(s=>`<span class="skill-tag">${s}</span>`).join('')}</div>` : ''}
          </div>
          <div style="display:flex;gap:1.25rem;">
            <div style="text-align:center;">
              <div style="font-size:1.4rem;font-weight:800;color:var(--amber);">★ ${(profile.rating||0).toFixed(1)}</div>
              <div style="font-size:.7rem;color:var(--text3);text-transform:uppercase;">Рейтинг</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:1.4rem;font-weight:800;color:var(--green);">${profile.completedTasks||0}</div>
              <div style="font-size:.7rem;color:var(--text3);text-transform:uppercase;">Выполнено</div>
            </div>
          </div>
        </div>`;
    }
    if (document.getElementById('editName'))   document.getElementById('editName').value   = profile.name || '';
    if (document.getElementById('editBio'))    document.getElementById('editBio').value    = profile.bio || '';
    if (document.getElementById('editSkills')) document.getElementById('editSkills').value = (profile.skills||[]).join(', ');
    if (document.getElementById('editAvatar')) document.getElementById('editAvatar').value = profile.avatar || '';
    if (typeof updateSkillsPreview === 'function') updateSkillsPreview();
  } catch(e) { showToast('Ошибка загрузки профиля', 'error'); }
}

async function saveProfile() {
  const name = document.getElementById('editName')?.value?.trim();
  const bio = document.getElementById('editBio')?.value?.trim();
  const skillsRaw = document.getElementById('editSkills')?.value || '';
  const avatar = document.getElementById('editAvatar')?.value?.trim();
  const skills = skillsRaw ? skillsRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];
  if (!name) { showToast('Имя обязательно', 'error'); return; }
  try {
    const updated = await apiAuth('/users/profile/update', { method:'PUT', body:JSON.stringify({ name, bio, skills, avatar }) });
    const cur = getCurrentUser();
    setCurrentUser({ ...cur, name: updated.name, avatar: updated.avatar }, localStorage.getItem('token'));
    showToast('Профиль обновлён ✅', 'success');
    loadProfile();
    updateNavForAuth();
  } catch(e) { showToast(e.message || 'Ошибка сохранения', 'error'); }
}

/* CREATE TASK */
async function createTask() {
  const title = document.getElementById('taskTitle')?.value?.trim();
  const description = document.getElementById('taskDesc')?.value?.trim();
  const category = document.getElementById('taskCategory')?.value;
  const budget = Number(document.getElementById('taskBudget')?.value);
  const deadline = document.getElementById('taskDeadline')?.value;
  const skills = (document.getElementById('taskSkills')?.value||'').split(',').map(s=>s.trim()).filter(Boolean);
  if (!title || !description || !category || !budget || !deadline) { showToast('Заполните все обязательные поля', 'error'); return; }
  try {
    const task = await apiAuth('/tasks', { method:'POST', body:JSON.stringify({ title, description, category, budget, deadline, skills }) });
    showToast('Задание опубликовано! 🚀', 'success');
    closeModal('createTaskModal');
    window.location.href = `task-detail.html?id=${task._id}`;
  } catch(e) { showToast(e.message || 'Ошибка при создании', 'error'); }
}

/* PORTFOLIO */
async function loadPortfolio() {
  const grid = document.getElementById('portfolioGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="spinner"></div>';
  try {
    const user = getCurrentUser();
    const items = await apiAuth(`/portfolio/${user.id}`);
    const catEmojis = { development:'💻', design:'🎨', writing:'✍️', marketing:'📣', video:'🎬', music:'🎵', other:'🔧' };
    if (!items.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🖼</div><h3>Портфолио пусто</h3>
        <p>Добавьте свои лучшие работы чтобы привлечь заказчиков</p>
        <button class="btn btn-primary mt-2" onclick="openModal('portfolioModal')">+ Добавить первую работу</button>
      </div>`;
      return;
    }
    grid.innerHTML = items.map(item => `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;transition:all .22s;"
           onmouseover="this.style.borderColor='var(--border2)';this.style.transform='translateY(-2px)'"
           onmouseout="this.style.borderColor='';this.style.transform=''">
        <div style="width:100%;height:155px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:2.5rem;overflow:hidden;">
          ${item.imageUrl ? `<img src="${item.imageUrl}" style="width:100%;height:155px;object-fit:cover;" onerror="this.parentElement.innerHTML='${catEmojis[item.category]||'🔧'}';">` : catEmojis[item.category]||'🔧'}
        </div>
        <div style="padding:1rem;">
          <div style="font-weight:700;font-size:.95rem;margin-bottom:.3rem;">${item.title}</div>
          ${item.description ? `<div style="font-size:.8rem;color:var(--text2);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${item.description}</div>` : ''}
          ${item.skills?.length ? `<div style="display:flex;flex-wrap:wrap;gap:.3rem;margin:.5rem 0;">${item.skills.slice(0,3).map(s=>`<span class="skill-tag">${s}</span>`).join('')}</div>` : ''}
          <div style="display:flex;gap:.4rem;margin-top:.5rem;">
            ${item.projectUrl ? `<a href="${item.projectUrl}" target="_blank" class="btn btn-glass btn-sm" onclick="event.stopPropagation()">🔗 Открыть</a>` : ''}
            <button class="btn btn-glass btn-sm" onclick="editPortfolioItem('${item._id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deletePortfolioItem('${item._id}')">🗑</button>
          </div>
        </div>
      </div>`).join('');
  } catch(e) {
    const g = document.getElementById('portfolioGrid');
    if (g) g.innerHTML = '<p style="color:var(--text2);padding:1rem;">Ошибка загрузки</p>';
  }
}

function closePortfolioModal() {
  closeModal('portfolioModal');
  document.getElementById('portfolioEditId').value = '';
  const t = document.getElementById('portfolioModalTitle');
  if (t) t.textContent = 'Добавить работу';
  ['pTitle','pDesc','pImageUrl','pProjectUrl','pSkills'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
}

async function savePortfolioItem() {
  const editId = document.getElementById('portfolioEditId')?.value;
  const data = {
    title:       document.getElementById('pTitle')?.value?.trim(),
    description: document.getElementById('pDesc')?.value?.trim(),
    category:    document.getElementById('pCategory')?.value || 'other',
    imageUrl:    document.getElementById('pImageUrl')?.value?.trim(),
    projectUrl:  document.getElementById('pProjectUrl')?.value?.trim(),
    skills:      (document.getElementById('pSkills')?.value||'').split(',').map(s=>s.trim()).filter(Boolean)
  };
  if (!data.title) { showToast('Введите название', 'error'); return; }
  try {
    if (editId) {
      await apiAuth(`/portfolio/${editId}`, { method:'PUT', body:JSON.stringify(data) });
      showToast('Работа обновлена ✅', 'success');
    } else {
      await apiAuth('/portfolio', { method:'POST', body:JSON.stringify(data) });
      showToast('Работа добавлена! 🎉', 'success');
    }
    closePortfolioModal();
    loadPortfolio();
  } catch(e) { showToast(e.message||'Ошибка', 'error'); }
}

async function editPortfolioItem(id) {
  try {
    const user = getCurrentUser();
    const items = await apiAuth(`/portfolio/${user.id}`);
    const item = items.find(i => i._id === id);
    if (!item) return;
    document.getElementById('portfolioEditId').value = id;
    const t = document.getElementById('portfolioModalTitle');
    if (t) t.textContent = 'Редактировать работу';
    document.getElementById('pTitle').value      = item.title || '';
    document.getElementById('pDesc').value       = item.description || '';
    document.getElementById('pCategory').value   = item.category || 'other';
    document.getElementById('pImageUrl').value   = item.imageUrl || '';
    document.getElementById('pProjectUrl').value = item.projectUrl || '';
    document.getElementById('pSkills').value     = (item.skills||[]).join(', ');
    openModal('portfolioModal');
  } catch(e) { showToast('Ошибка загрузки', 'error'); }
}

async function deletePortfolioItem(id) {
  if (!confirm('Удалить эту работу?')) return;
  try {
    await apiAuth(`/portfolio/${id}`, { method:'DELETE' });
    showToast('Удалено', 'success');
    loadPortfolio();
  } catch(e) { showToast(e.message||'Ошибка', 'error'); }
}

/* REVIEWS */
async function loadReviews() {
  const listEl = document.getElementById('reviewsList');
  if (!listEl) return;
  listEl.innerHTML = '<div class="spinner"></div>';
  try {
    const user = getCurrentUser();
    const reviews = await api(`/reviews/user/${user.id}`);
    const avgEl = document.getElementById('reviewAvgRating');
    const starsEl = document.getElementById('reviewStars');
    const countEl = document.getElementById('reviewCount');
    if (!reviews.length) {
      if (avgEl) avgEl.textContent = '—';
      if (starsEl) starsEl.innerHTML = '<span style="color:var(--text3)">☆☆☆☆☆</span>';
      if (countEl) countEl.textContent = 'нет отзывов';
      listEl.innerHTML = `<div class="empty-state" style="padding:2rem 0;"><div class="empty-icon">⭐</div><p>Выполняйте задания чтобы получать отзывы</p></div>`;
      return;
    }
    const avg = reviews.reduce((s,r) => s+r.rating, 0) / reviews.length;
    if (avgEl) avgEl.textContent = avg.toFixed(1);
    if (starsEl) starsEl.innerHTML = `<span style="color:var(--amber)">${'★'.repeat(Math.round(avg))}</span><span style="color:var(--text3)">${'★'.repeat(5-Math.round(avg))}</span>`;
    if (countEl) countEl.textContent = `${reviews.length} отзыв${reviews.length===1?'':reviews.length<5?'а':'ов'}`;
    listEl.innerHTML = reviews.map(r => `
      <div style="padding:1.1rem 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;gap:.75rem;">
          <div class="avatar" style="width:38px;height:38px;font-size:.9rem;flex-shrink:0;">
            ${r.reviewer.avatar ? `<img src="${r.reviewer.avatar}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;">` : r.reviewer.name.charAt(0)}
          </div>
          <div style="flex:1;">
            <div style="display:flex;justify-content:space-between;margin-bottom:.25rem;">
              <div style="font-weight:700;font-size:.9rem;">${r.reviewer.name}</div>
              <div style="color:var(--amber);">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
            </div>
            ${r.task?.title ? `<div style="font-size:.74rem;color:var(--text3);margin-bottom:.35rem;">📋 ${r.task.title}</div>` : ''}
            ${r.comment ? `<p style="font-size:.875rem;color:var(--text2);line-height:1.65;margin:0;">${r.comment}</p>` : ''}
            <div style="font-size:.72rem;color:var(--text3);margin-top:.35rem;">${_fmtDate(r.createdAt)}</div>
          </div>
        </div>
      </div>`).join('');
  } catch(e) { if (listEl) listEl.innerHTML = '<p style="color:var(--text2);">Ошибка загрузки</p>'; }
}

/* NOTIFICATIONS SETTINGS */
async function loadNotifSettings() {
  try {
    const res = await apiAuth('/auth/me');
    const emailToggle = document.getElementById('emailNotifToggle');
    const tgToggle = document.getElementById('telegramToggle');
    const tgInput = document.getElementById('telegramChatId');
    const tgWrap = document.getElementById('telegramInputWrap');
    if (emailToggle) emailToggle.checked = res.emailNotifications !== false;
    if (res.telegramChatId) {
      if (tgToggle) tgToggle.checked = true;
      if (tgInput) tgInput.value = res.telegramChatId;
      if (tgWrap) tgWrap.style.display = 'block';
    }
  } catch(e) {}
}

async function saveEmailNotif() {
  try {
    const on = document.getElementById('emailNotifToggle')?.checked;
    await apiAuth('/users/profile/update', { method:'PUT', body:JSON.stringify({ emailNotifications: on }) });
    showToast(on ? 'Email уведомления включены 📧' : 'Отключены', 'success');
  } catch(e) { showToast('Ошибка', 'error'); }
}

function toggleTelegramInput() {
  const on = document.getElementById('telegramToggle')?.checked;
  const wrap = document.getElementById('telegramInputWrap');
  if (wrap) wrap.style.display = on ? 'block' : 'none';
  if (!on) {
    apiAuth('/users/profile/update', { method:'PUT', body:JSON.stringify({ telegramChatId:'' }) }).catch(()=>{});
    showToast('Telegram отключён', 'info');
  }
}

async function saveTelegram() {
  const chatId = document.getElementById('telegramChatId')?.value?.trim();
  if (!chatId) { showToast('Введите Chat ID', 'error'); return; }
  if (!/^\d+$/.test(chatId)) { showToast('Chat ID — только цифры', 'error'); return; }
  try {
    await apiAuth('/users/profile/update', { method:'PUT', body:JSON.stringify({ telegramChatId: chatId }) });
    showToast('Telegram подключён! 📱', 'success');
  } catch(e) { showToast(e.message||'Ошибка', 'error'); }
}

/* HELPERS */
function _fmtDate(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Вчера';
  if (days < 7) return `${days} дн. назад`;
  return new Date(iso).toLocaleDateString('ru-RU');
}

function updateSkillsPreview() {
  const input = document.getElementById('editSkills');
  const preview = document.getElementById('skillsPreview');
  if (!input || !preview) return;
  preview.innerHTML = input.value.split(',').map(s=>s.trim()).filter(Boolean).map(s=>`<span class="skill-tag">${s}</span>`).join('');
}