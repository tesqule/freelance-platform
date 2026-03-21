import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const CAT_EMOJIS = { development: '💻', design: '🎨', writing: '✍️', marketing: '📣', video: '🎬', music: '🎵', other: '🔧' };
const CAT_LABELS = { development: 'Разработка', design: 'Дизайн', writing: 'Тексты', marketing: 'Маркетинг', video: 'Видео', other: 'Другое' };
const CLOUDINARY_CLOUD = 'dttvzxrvg';
const CLOUDINARY_PRESET = 'freelancehub_unsigned';

export default function DashboardPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [services, setServices] = useState([]);
  const [favTasks, setFavTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit form
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Portfolio modal
  const [portModal, setPortModal] = useState(false);
  const [portEdit, setPortEdit] = useState(null);
  const [portForm, setPortForm] = useState({ title: '', description: '', category: 'development', imageUrl: '', projectUrl: '', skills: '' });

  // Service modal
  const [svcModal, setSvcModal] = useState(false);
  const [svcEdit, setSvcEdit] = useState(null);
  const [svcForm, setSvcForm] = useState({ title: '', description: '', category: 'development', price: '', deliveryDays: '', imageUrl: '', skills: '' });

  if (!user) { navigate('/'); return null; }

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const { data } = await API.get(`/users/${user.id}`);
      setProfile(data);
    } catch {}
    setLoading(false);
  }

  async function loadMyTasks() {
    try {
      const { data } = await API.get('/tasks/my');
      setMyTasks(data);
    } catch {
      // fallback — фильтруем все задания
      try {
        const { data } = await API.get('/tasks');
        setMyTasks(data.filter(t => t.client?._id === user.id || t.client === user.id));
      } catch {}
    }
  }

  async function loadMyProposals() {
    try {
      const { data } = await API.get('/tasks');
      const proposals = [];
      data.forEach(task => {
        task.proposals?.forEach(p => {
          if (p.freelancer?._id === user.id || p.freelancer === user.id) {
            proposals.push({ ...p, task });
          }
        });
      });
      setMyProposals(proposals);
    } catch {}
  }

  async function loadPortfolio() {
    try {
      const { data } = await API.get(`/portfolio/${user.id}`);
      setPortfolio(data);
    } catch {}
  }

  async function loadServices() {
    try {
      const { data } = await API.get('/services/my');
      setServices(data);
    } catch {}
  }

  async function loadFavs() {
    try {
      const { data } = await API.get('/favorites');
      setFavTasks(data.map(f => f.task).filter(Boolean));
    } catch {}
  }

  function switchTab(t) {
    setTab(t);
    if (t === 'tasks') { loadMyTasks(); loadMyProposals(); }
    if (t === 'edit') {
      setEditName(user.name || '');
      setEditBio(user.bio || '');
      setEditSkills((user.skills || []).join(', '));
      setEditAvatar(user.avatar || '');
      loadPortfolio();
      loadServices();
    }
    if (t === 'favorites') loadFavs();
  }

  async function saveProfile() {
    if (!editName) return;
    setSaving(true);
    try {
      const skills = editSkills.split(',').map(s => s.trim()).filter(Boolean);
      const { data } = await API.put('/users/profile/update', { name: editName, avatar: editAvatar, bio: editBio, skills });
      updateUser({ ...user, name: data.name, avatar: data.avatar, bio: data.bio, skills: data.skills });
      showToast('Профиль обновлён ✅');
    } catch {}
    setSaving(false);
  }

  async function uploadAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Файл слишком большой', 'error'); return; }
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_PRESET);
      fd.append('folder', 'freelancehub');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      setEditAvatar(data.secure_url);
      showToast('Фото загружено ✅');
    } catch {
      // fallback base64
      const reader = new FileReader();
      reader.onload = ev => setEditAvatar(ev.target.result);
      reader.readAsDataURL(file);
    }
    setAvatarUploading(false);
  }

  // Portfolio
  async function savePortfolio() {
    const skills = portForm.skills.split(',').map(s => s.trim()).filter(Boolean);
    const body = { ...portForm, skills };
    try {
      if (portEdit) {
        await API.put(`/portfolio/${portEdit}`, body);
        showToast('Обновлено ✅');
      } else {
        await API.post('/portfolio', body);
        showToast('Работа добавлена 🎉');
      }
      setPortModal(false);
      setPortEdit(null);
      setPortForm({ title: '', description: '', category: 'development', imageUrl: '', projectUrl: '', skills: '' });
      loadPortfolio();
    } catch (err) { showToast(err.response?.data?.message || 'Ошибка', 'error'); }
  }

  async function deletePortfolio(id) {
    if (!confirm('Удалить эту работу?')) return;
    try { await API.delete(`/portfolio/${id}`); showToast('Удалено'); loadPortfolio(); } catch {}
  }

  // Services
  async function saveService() {
    const skills = svcForm.skills.split(',').map(s => s.trim()).filter(Boolean);
    const body = { ...svcForm, price: Number(svcForm.price), deliveryDays: Number(svcForm.deliveryDays), skills };
    try {
      if (svcEdit) {
        await API.put(`/services/${svcEdit}`, body);
        showToast('Обновлено ✅');
      } else {
        await API.post('/services', body);
        showToast('Услуга добавлена 🎉');
      }
      setSvcModal(false);
      setSvcEdit(null);
      setSvcForm({ title: '', description: '', category: 'development', price: '', deliveryDays: '', imageUrl: '', skills: '' });
      loadServices();
    } catch (err) { showToast(err.response?.data?.message || 'Ошибка', 'error'); }
  }

  async function deleteService(id) {
    if (!confirm('Удалить услугу?')) return;
    try { await API.delete(`/services/${id}`); showToast('Удалено'); loadServices(); } catch {}
  }

  async function removeFav(taskId) {
    try { await API.delete(`/favorites/${taskId}`); setFavTasks(prev => prev.filter(t => t._id !== taskId)); } catch {}
  }

  function showToast(msg, type = 'success') {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  const p = profile || user;
  const stats = [
    { icon: '⭐', label: 'Рейтинг', value: (p.rating || 0).toFixed(1) },
    { icon: '✅', label: 'Выполнено', value: p.completedTasks || 0 },
    { icon: '💰', label: 'Баланс', value: `₽${(p.balance || 0).toLocaleString()}` },
    { icon: '💬', label: 'Отзывов', value: p.reviewsCount || 0 },
  ];

  const TABS = [
    { id: 'overview', label: '🏠 Обзор' },
    { id: 'tasks', label: '📋 Задания' },
    { id: 'favorites', label: '❤️ Избранное' },
    { id: 'edit', label: '✏️ Редактировать' },
  ];

  return (
    <div className="page">
      <div className="container" style={{ paddingBottom: '4rem' }}>
        <div className="dashboard-grid mt-3">

          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="card mb-2" style={{ textAlign: 'center', padding: '1.75rem 1.25rem' }}>
              <div className="avatar" style={{ width: 76, height: 76, fontSize: '1.9rem', margin: '0 auto .9rem', boxShadow: '0 4px 20px rgba(79,110,247,.35)' }}>
                {p.avatar
                  ? <img src={p.avatar} style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover' }} />
                  : p.name?.charAt(0)}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>{p.name}</div>
              <div style={{ fontSize: '.82rem', color: 'var(--text3)', marginTop: '.25rem' }}>{p.email || user.email}</div>
              <div style={{ marginTop: '.6rem' }}>
                <span className={`badge badge-${p.role === 'client' ? 'design' : 'development'}`}>
                  {p.role === 'client' ? '📋 Заказчик' : '💼 Фрилансер'}
                </span>
              </div>
              <div style={{ marginTop: '.9rem', paddingTop: '.9rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.25rem' }}>Баланс</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--green)' }}>₽{(p.balance || 0).toLocaleString()}</div>
              </div>
            </div>

            <nav className="card" style={{ padding: '.5rem' }}>
              <ul className="sidebar-nav">
                {TABS.map(t => (
                  <li key={t.id}>
                    <a href="#" className={tab === t.id ? 'active' : ''} onClick={e => { e.preventDefault(); switchTab(t.id); }}>
                      {t.label}
                    </a>
                  </li>
                ))}
                <li><Link to="/chat"><span className="icon">💬</span>Сообщения</Link></li>
                <li><Link to="/tasks"><span className="icon">🔍</span>Найти задания</Link></li>
                <li style={{ borderTop: '1px solid var(--border)', paddingTop: '.5rem', marginTop: '.5rem' }}>
                  <a href="#" onClick={e => { e.preventDefault(); logout(); navigate('/'); }} style={{ color: 'var(--red)' }}>
                    <span className="icon">🚪</span>Выйти
                  </a>
                </li>
              </ul>
            </nav>
          </aside>

          {/* MAIN */}
          <main>
            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div>
                <div style={{ marginBottom: '2rem' }}>
                  <div className="section-eyebrow">Профиль</div>
                  <h2 style={{ fontSize: '1.6rem', letterSpacing: '-.035em' }}>Добро пожаловать, {p.name?.split(' ')[0]} 👋</h2>
                </div>

                <div className="grid-3 mb-3" style={{ gap: '.85rem' }}>
                  {stats.map(s => (
                    <div key={s.label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '.3rem' }}>{s.icon}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800 }}>{s.value}</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: '.2rem' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {p.bio && (
                  <div className="card mb-2" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '.75rem' }}>О себе</h3>
                    <p style={{ color: 'var(--text2)', lineHeight: 1.75, fontSize: '.9rem' }}>{p.bio}</p>
                  </div>
                )}

                {p.skills?.length > 0 && (
                  <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '.75rem' }}>Навыки</h3>
                    <div className="task-skills">{p.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}</div>
                  </div>
                )}
              </div>
            )}

            {/* ── MY TASKS / PROPOSALS ── */}
            {tab === 'tasks' && (
              <div>
                {user.role === 'client' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.3rem', letterSpacing: '-.03em' }}>Мои задания</h3>
                      <Link to="/tasks" className="btn btn-primary btn-sm">+ Разместить</Link>
                    </div>
                    {myTasks.length === 0
                      ? <div className="empty-state"><div className="empty-icon">📭</div><h3>Заданий пока нет</h3><p>Разместите первое задание</p><Link to="/tasks" className="btn btn-primary mt-2">Разместить задание</Link></div>
                      : myTasks.map(task => <TaskRow key={task._id} task={task} />)
                    }
                  </>
                ) : (
                  <>
                    <h3 style={{ fontSize: '1.3rem', letterSpacing: '-.03em', marginBottom: '1.5rem' }}>Мои отклики</h3>
                    {myProposals.length === 0
                      ? <div className="empty-state"><div className="empty-icon">📭</div><h3>Откликов пока нет</h3><p>Найдите задания и откликнитесь</p><Link to="/tasks" className="btn btn-primary mt-2">Найти задания</Link></div>
                      : myProposals.map((p, i) => <ProposalRow key={i} proposal={p} />)
                    }
                  </>
                )}
              </div>
            )}

            {/* ── FAVORITES ── */}
            {tab === 'favorites' && (
              <div>
                <h3 style={{ fontSize: '1.3rem', letterSpacing: '-.03em', marginBottom: '1.5rem' }}>Избранные задания</h3>
                {favTasks.length === 0
                  ? <div className="empty-state"><div className="empty-icon">❤️</div><h3>Избранного нет</h3><p>Добавляйте задания в избранное через сердечко</p></div>
                  : <div style={{ display: 'grid', gap: '1rem' }}>
                    {favTasks.map(task => (
                      <div key={task._id} className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <div>
                          <Link to={`/tasks/${task._id}`} style={{ fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>{task.title}</Link>
                          <div style={{ fontSize: '.82rem', color: 'var(--text3)', marginTop: '.25rem' }}>₽{task.budget?.toLocaleString()}</div>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={() => removeFav(task._id)}>🗑</button>
                      </div>
                    ))}
                  </div>
                }
              </div>
            )}

            {/* ── EDIT PROFILE ── */}
            {tab === 'edit' && (
              <div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="section-eyebrow">Аккаунт</div>
                  <h3 style={{ fontSize: '1.3rem', letterSpacing: '-.03em' }}>Редактировать профиль</h3>
                </div>

                <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
                  <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Имя</label>
                      <input className="form-control" value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Аватар</label>
                      <div style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: '1.5rem', flexShrink: 0 }}>
                          {editAvatar ? <img src={editAvatar} style={{ width: 64, height: 64, objectFit: 'cover' }} onError={e => e.target.parentElement.innerHTML = '👤'} /> : '👤'}
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                          <input className="form-control" style={{ fontSize: '.82rem' }} placeholder="https://..." value={editAvatar} onChange={e => setEditAvatar(e.target.value)} />
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.45rem .85rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer' }}>
                            {avatarUploading ? '⏳ Загрузка...' : '📁 Загрузить фото'}
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="form-group mt-2">
                    <label>О себе</label>
                    <textarea className="form-control" style={{ minHeight: 115 }} placeholder="Расскажите о себе..." value={editBio} onChange={e => setEditBio(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Навыки (через запятую)</label>
                    <input className="form-control" placeholder="React, Node.js, Figma..." value={editSkills} onChange={e => setEditSkills(e.target.value)} />
                    <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: '.4rem' }}>Укажи навыки чтобы заказчики могли тебя найти</div>
                  </div>
                  {editSkills && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '1.25rem' }}>
                      {editSkills.split(',').map(s => s.trim()).filter(Boolean).map(s => <span key={s} className="skill-tag">{s}</span>)}
                    </div>
                  )}
                  <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                    {saving ? 'Сохраняем...' : 'Сохранить изменения'}
                  </button>
                </div>

                {/* Portfolio — только для фрилансеров */}
                {user.role === 'freelancer' && (
                  <>
                    <div style={{ marginTop: '2rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.1rem', letterSpacing: '-.02em' }}>🖼 Портфолио</h3>
                      <button className="btn btn-primary btn-sm" onClick={() => { setPortEdit(null); setPortForm({ title: '', description: '', category: 'development', imageUrl: '', projectUrl: '', skills: '' }); setPortModal(true); }}>+ Добавить</button>
                    </div>
                    {portfolio.length === 0
                      ? <div className="empty-state" style={{ padding: '2rem 0' }}><div className="empty-icon">🖼</div><h3>Портфолио пусто</h3><p>Добавьте работы чтобы заказчики видели ваш опыт</p></div>
                      : <div className="portfolio-grid">
                        {portfolio.map(item => (
                          <div key={item._id} className="portfolio-card">
                            <div className="portfolio-img">
                              {item.imageUrl ? <img src={item.imageUrl} alt={item.title} onError={e => e.target.parentElement.innerHTML = CAT_EMOJIS[item.category] || '🔧'} /> : CAT_EMOJIS[item.category] || '🔧'}
                            </div>
                            <div className="portfolio-body">
                              <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.3rem' }}>{item.title}</div>
                              {item.description && <div style={{ fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.6 }}>{item.description}</div>}
                              <div style={{ display: 'flex', gap: '.4rem', marginTop: '.75rem' }}>
                                {item.projectUrl && <a href={item.projectUrl} target="_blank" className="btn btn-glass btn-sm">🔗</a>}
                                <button className="btn btn-glass btn-sm" onClick={() => { setPortEdit(item._id); setPortForm({ title: item.title, description: item.description || '', category: item.category, imageUrl: item.imageUrl || '', projectUrl: item.projectUrl || '', skills: (item.skills || []).join(', ') }); setPortModal(true); }}>✏️</button>
                                <button className="btn btn-danger btn-sm" onClick={() => deletePortfolio(item._id)}>🗑</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    }

                    <div style={{ marginTop: '2rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.1rem', letterSpacing: '-.02em' }}>🛠 Услуги</h3>
                      <button className="btn btn-primary btn-sm" onClick={() => { setSvcEdit(null); setSvcForm({ title: '', description: '', category: 'development', price: '', deliveryDays: '', imageUrl: '', skills: '' }); setSvcModal(true); }}>+ Добавить</button>
                    </div>
                    {services.length === 0
                      ? <div className="empty-state" style={{ padding: '2rem 0' }}><div className="empty-icon">🛠</div><h3>Услуг пока нет</h3><p>Добавьте услуги чтобы заказчики могли вас нанять напрямую</p></div>
                      : <div className="services-grid-profile">
                        {services.map(s => (
                          <div key={s._id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                            <div style={{ width: '100%', height: 130, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', overflow: 'hidden' }}>
                              {s.imageUrl ? <img src={s.imageUrl} style={{ width: '100%', height: 130, objectFit: 'cover' }} onError={e => e.target.parentElement.innerHTML = `<span style="font-size:2.5rem">${CAT_EMOJIS[s.category] || '🔧'}</span>`} /> : CAT_EMOJIS[s.category] || '🔧'}
                            </div>
                            <div style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{s.title}</div>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--green)', margin: '.35rem 0' }}>₽{s.price?.toLocaleString()}</div>
                              <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>⏱ {s.deliveryDays} дн.</div>
                              <div style={{ display: 'flex', gap: '.4rem', marginTop: '.75rem' }}>
                                <button className="btn btn-glass btn-sm" onClick={() => { setSvcEdit(s._id); setSvcForm({ title: s.title, description: s.description, category: s.category, price: s.price, deliveryDays: s.deliveryDays, imageUrl: s.imageUrl || '', skills: (s.skills || []).join(', ') }); setSvcModal(true); }}>✏️ Редактировать</button>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteService(s._id)}>🗑</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    }
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Toast */}
      <div className="toast-container" id="toastContainer" />

      {/* Portfolio modal */}
      {portModal && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setPortModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3>{portEdit ? 'Редактировать работу' : 'Добавить работу'}</h3>
              <button className="modal-close" onClick={() => setPortModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="form-group"><label>Название *</label><input className="form-control" placeholder="Лендинг для стартапа" value={portForm.title} onChange={e => setPortForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="form-group"><label>Описание</label><textarea className="form-control" style={{ minHeight: 85 }} value={portForm.description} onChange={e => setPortForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid-2">
              <div className="form-group"><label>Категория</label>
                <select className="form-control" value={portForm.category} onChange={e => setPortForm(f => ({ ...f, category: e.target.value }))}>
                  {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{CAT_EMOJIS[v]} {l}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Навыки</label><input className="form-control" placeholder="React, Figma..." value={portForm.skills} onChange={e => setPortForm(f => ({ ...f, skills: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label>Ссылка на картинку</label><input className="form-control" style={{ fontSize: '.82rem' }} placeholder="https://i.imgur.com/..." value={portForm.imageUrl} onChange={e => setPortForm(f => ({ ...f, imageUrl: e.target.value }))} /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Ссылка на проект</label><input className="form-control" placeholder="https://myproject.com" value={portForm.projectUrl} onChange={e => setPortForm(f => ({ ...f, projectUrl: e.target.value }))} /></div>
            <button className="btn btn-primary w-full mt-3" onClick={savePortfolio}>Сохранить</button>
          </div>
        </div>
      )}

      {/* Service modal */}
      {svcModal && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setSvcModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3>{svcEdit ? 'Редактировать услугу' : 'Добавить услугу'}</h3>
              <button className="modal-close" onClick={() => setSvcModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="form-group"><label>Название услуги *</label><input className="form-control" placeholder="Создам сайт под ключ на React" value={svcForm.title} onChange={e => setSvcForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="form-group"><label>Описание *</label><textarea className="form-control" style={{ minHeight: 100 }} value={svcForm.description} onChange={e => setSvcForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="form-group"><label>Категория</label>
              <select className="form-control" value={svcForm.category} onChange={e => setSvcForm(f => ({ ...f, category: e.target.value }))}>
                {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{CAT_EMOJIS[v]} {l}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group"><label>Цена (₽) *</label><input type="number" className="form-control" placeholder="3000" value={svcForm.price} onChange={e => setSvcForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div className="form-group"><label>Срок (дней) *</label><input type="number" className="form-control" placeholder="7" value={svcForm.deliveryDays} onChange={e => setSvcForm(f => ({ ...f, deliveryDays: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label>Картинка (ссылка)</label><input className="form-control" style={{ fontSize: '.82rem' }} placeholder="https://i.imgur.com/..." value={svcForm.imageUrl} onChange={e => setSvcForm(f => ({ ...f, imageUrl: e.target.value }))} /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Навыки</label><input className="form-control" placeholder="React, Node.js..." value={svcForm.skills} onChange={e => setSvcForm(f => ({ ...f, skills: e.target.value }))} /></div>
            <button className="btn btn-primary w-full mt-3" onClick={saveService}>Сохранить услугу</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }) {
  const STATUS = { open: '🟢 Открыто', in_progress: '🔵 В работе', completed: '✅ Выполнено', cancelled: '❌ Отменено' };
  return (
    <Link to={`/tasks/${task._id}`} style={{ textDecoration: 'none' }}>
      <div className="card mb-2" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', transition: 'border-color .15s' }}
        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--blue)'}
        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '.3rem' }}>{task.title}</div>
          <div style={{ fontSize: '.8rem', color: 'var(--text3)', display: 'flex', gap: '1rem' }}>
            <span>{STATUS[task.status]}</span>
            <span>💬 {task.proposals?.length || 0} откликов</span>
            <span>⏰ {new Date(task.deadline).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--green)', flexShrink: 0 }}>
          ₽{task.budget?.toLocaleString()}
        </div>
      </div>
    </Link>
  );
}

function ProposalRow({ proposal }) {
  const STATUS = { pending: '⏳ На рассмотрении', accepted: '✅ Принят', rejected: '❌ Отклонён' };
  return (
    <Link to={`/tasks/${proposal.task?._id}`} style={{ textDecoration: 'none' }}>
      <div className="card mb-2" style={{ padding: '1.25rem', transition: 'border-color .15s' }}
        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--blue)'}
        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
        <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '.4rem' }}>{proposal.task?.title}</div>
        <div style={{ fontSize: '.82rem', color: 'var(--text3)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span>{STATUS[proposal.status]}</span>
          <span>💰 ₽{proposal.price?.toLocaleString()}</span>
          <span>📅 {proposal.deliveryDays} дн.</span>
        </div>
        {proposal.coverLetter && (
          <p style={{ fontSize: '.82rem', color: 'var(--text2)', marginTop: '.5rem', lineHeight: 1.65 }}>
            {proposal.coverLetter.slice(0, 120)}{proposal.coverLetter.length > 120 ? '...' : ''}
          </p>
        )}
      </div>
    </Link>
  );
}
