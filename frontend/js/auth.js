async function handleLogin() {
  const email = document.getElementById('loginEmail')?.value?.trim();
  const password = document.getElementById('loginPassword')?.value;

  if (!email || !password) { showToast('Заполните все поля', 'error'); return; }

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setCurrentUser(data.user, data.token);
    showToast(`Добро пожаловать, ${data.user.name}! 👋`, 'success');
    setTimeout(() => window.location.href = 'index.html', 800);
  } catch(e) {
    showToast(e.message || 'Ошибка входа', 'error');
  }
}

async function handleRegister() {
  const name = document.getElementById('regName')?.value?.trim();
  const email = document.getElementById('regEmail')?.value?.trim();
  const password = document.getElementById('regPassword')?.value;
  const role = typeof selectedRole !== 'undefined' ? selectedRole : 'freelancer';

  if (!name || !email || !password) { showToast('Заполните все поля', 'error'); return; }
  if (password.length < 6) { showToast('Пароль минимум 6 символов', 'error'); return; }

  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
    setCurrentUser(data.user, data.token);
    showToast(`Аккаунт создан! Добро пожаловать 🎉`, 'success');
    setTimeout(() => window.location.href = 'index.html', 800);
  } catch(e) {
    showToast(e.message || 'Ошибка регистрации', 'error');
  }
}