async function loadProfile() {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'index.html'; return; }

  try {
    const profile = await api(`/users/${user.id}`);

    // Render header
    document.getElementById('profileHeader').innerHTML = `
      <div class="profile-avatar-wrap">
        <div class="avatar" style="width:96px;height:96px;font-size:2.2rem;">
          ${profile.avatar ? `<img src="${profile.avatar}" style="width:96px;height:96px;border-radius:50%;object-fit:cover;">` : profile.name.charAt(0)}
        </div>
      </div>
      <div class="profile-info">
        <h2>${profile.name}</h2>
        <div class="profile-role">${profile.role === 'client' ? '📋 Заказчик' : '💼 Фрилансер'}</div>
        ${profile.bio ? `<p class="text-muted" style="margin-top:0.5rem;">${profile.bio}</p>` : ''}
        ${profile.skills?.length ? `
          <div class="task-skills mt-2">
            ${profile.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
          </div>` : ''}
        <div class="profile-stats">
          <div class="profile-stat-item">
            <div class="profile-stat-num">★ ${profile.rating.toFixed(1)}</div>
            <div class="profile-stat-label">Рейтинг</div>
          </div>
          <div class="profile-stat-item">
            <div class="profile-stat-num">${profile.completedTasks}</div>
            <div class="profile-stat-label">Выполнено</div>
          </div>
        </div>
      </div>`;

    // Prefill form
    document.getElementById('editName').value = profile.name || '';
    document.getElementById('editBio').value = profile.bio || '';
    document.getElementById('editSkills').value = (profile.skills || []).join(', ');
    document.getElementById('editAvatar').value = profile.avatar || '';

  } catch(e) {
    showToast('Ошибка загрузки профиля', 'error');
  }
}

async function saveProfile() {
  const name = document.getElementById('editName').value.trim();
  const bio = document.getElementById('editBio').value.trim();
  const skillsRaw = document.getElementById('editSkills').value;
  const avatar = document.getElementById('editAvatar').value.trim();
  const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  if (!name) { showToast('Имя обязательно', 'error'); return; }

  try {
    const updated = await apiAuth('/users/profile/update', {
      method: 'PUT',
      body: JSON.stringify({ name, bio, skills, avatar })
    });

    const currentUser = getCurrentUser();
    setCurrentUser({ ...currentUser, name: updated.name, avatar: updated.avatar }, localStorage.getItem('token'));
    showToast('Профиль обновлён ✅', 'success');
    loadProfile();
    updateNavForAuth();
  } catch(e) {
    showToast(e.message || 'Ошибка сохранения', 'error');
  }
}