import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const TABS = [
  { id: 'stats',    label: '📊 Статистика' },
  { id: 'users',    label: '👥 Пользователи' },
  { id: 'tasks',    label: '📋 Задания' },
  { id: 'services', label: '🛠 Услуги' },
];

const ROLE_COLORS = { client: 'var(--blue)', freelancer: 'var(--purple)', admin: '#ef4444' };
const STATUS_LABELS = { open: '🟢 Открыто', in_progress: '🔵 В работе', completed: '✅ Выполнено', cancelled: '❌ Отменено' };

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRole, setUsersRole] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [tasksPage, setTasksPage] = useState(1);
  const [tasksStatus, setTasksStatus] = useState('');
  const [tasksLoading, setTasksLoading] = useState(false);

  const [services, setServices] = useState([]);
  const [servicesTotal, setServicesTotal] = useState(0);
  const [servicesPage, setServicesPage] = useState(1);
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
  }, [user]);

  useEffect(() => {
    if (tab === 'stats')    loadStats();
    if (tab === 'users')    loadUsers();
    if (tab === 'tasks')    loadTasks();
    if (tab === 'services') loadServices();
  }, [tab]);

  useEffect(() => { if (tab === 'users') loadUsers(); }, [usersPage, usersSearch, usersRole]);
  useEffect(() => { if (tab === 'tasks') loadTasks(); }, [tasksPage, tasksStatus]);
  useEffect(() => { if (tab === 'services') loadServices(); }, [servicesPage]);

  async function loadStats() {
    setStatsLoading(true);
    try { const { data } = await API.get('/admin/stats'); setStats(data); } catch {}
    setStatsLoading(false);
  }

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ page: usersPage, limit: 20 });
      if (usersSearch) params.set('search', usersSearch);
      if (usersRole)   params.set('role', usersRole);
      const { data } = await API.get(`/admin/users?${params}`);
      setUsers(data.users); setUsersTotal(data.total);
    } catch {}
    setUsersLoading(false);
  }

  async function loadTasks() {
    setTasksLoading(true);
    try {
      const params = new URLSearchParams({ page: tasksPage, limit: 20 });
      if (tasksStatus) params.set('status', tasksStatus);
      const { data } = await API.get(`/admin/tasks?${params}`);
      setTasks(data.tasks); setTasksTotal(data.total);
    } catch {}
    setTasksLoading(false);
  }

  async function loadServices() {
    setServicesLoading(true);
    try {
      const { data } = await API.get(`/admin/services?page=${servicesPage}&limit=20`);
      setServices(data.services); setServicesTotal(data.total);
    } catch {}
    setServicesLoading(false);
  }

  async function deleteUser(id) {
    if (!confirm('Удалить пользователя?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      setUsersTotal(prev => prev - 1);
    } catch (err) { alert(err.response?.data?.message || 'Ошибка'); }
  }

  async function deleteTask(id) {
    if (!confirm('Удалить задание?')) return;
    try {
      await API.delete(`/admin/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
      setTasksTotal(prev => prev - 1);
    } catch (err) { alert(err.response?.data?.message || 'Ошибка'); }
  }

  async function deleteService(id) {
    if (!confirm('Удалить услугу?')) return;
    try {
      await API.delete(`/admin/services/${id}`);
      setServices(prev => prev.filter(s => s._id !== id));
      setServicesTotal(prev => prev - 1);
    } catch (err) { alert(err.response?.data?.message || 'Ошибка'); }
  }

  async function changeRole(userId, role) {
    try {
      await API.patch(`/admin/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
    } catch (err) { alert(err.response?.data?.message || 'Ошибка'); }
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1100, padding: '2rem 1rem 4rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '.75rem', color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '.4rem' }}>Панель управления</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-.03em' }}>Администрирование</h1>
        </div>

        <div className="profile-tabs" style={{ marginBottom: '1.5rem' }}>
          {TABS.map(t => (
            <button key={t.id} className={`profile-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* STATS */}
        {tab === 'stats' && (
          statsLoading ? <Spinner /> : stats && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Всего пользователей', value: stats.users.total, sub: `+${stats.users.newThisWeek} за неделю`, color: 'var(--blue)' },
                  { label: 'Заказчики', value: stats.users.clients, color: 'var(--purple)' },
                  { label: 'Фрилансеры', value: stats.users.freelancers, color: 'var(--green)' },
                  { label: 'Всего заданий', value: stats.tasks.total, sub: `+${stats.tasks.newThisWeek} за неделю`, color: '#f59e0b' },
                  { label: 'Открытые', value: stats.tasks.open, color: 'var(--green)' },
                  { label: 'В работе', value: stats.tasks.inProgress, color: 'var(--blue)' },
                  { label: 'Выполнено', value: stats.tasks.completed, color: 'var(--purple)' },
                  { label: 'Услуги', value: stats.services.total, color: '#14b8a6' },
                  { label: 'Отзывы', value: stats.reviews.total, color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--text2)', marginTop: '.35rem' }}>{s.label}</div>
                    {s.sub && <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: '.2rem' }}>{s.sub}</div>}
                  </div>
                ))}
              </div>
              {stats.topFreelancers?.length > 0 && (
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>🏆 Топ фрилансеров</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {stats.topFreelancers.map((fl, i) => (
                      <div key={fl._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: 24, fontWeight: 700, color: 'var(--text3)', fontSize: '.85rem' }}>#{i + 1}</div>
                        <div className="avatar" style={{ width: 36, height: 36, fontSize: '.9rem', flexShrink: 0 }}>
                          {fl.avatar ? <img src={fl.avatar} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : fl.name?.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{fl.name}</div>
                          <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>✅ {fl.completedTasks} выполнено · ★ {fl.rating?.toFixed(1) || '—'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <input className="form-control" style={{ maxWidth: 280 }} placeholder="Поиск по имени или email..."
                value={usersSearch} onChange={e => { setUsersSearch(e.target.value); setUsersPage(1); }} />
              <select className="form-control" style={{ maxWidth: 160 }} value={usersRole}
                onChange={e => { setUsersRole(e.target.value); setUsersPage(1); }}>
                <option value="">Все роли</option>
                <option value="client">Заказчики</option>
                <option value="freelancer">Фрилансеры</option>
                <option value="admin">Админы</option>
              </select>
              <span style={{ color: 'var(--text3)', fontSize: '.85rem', alignSelf: 'center' }}>
                Всего: <strong style={{ color: 'var(--text)' }}>{usersTotal}</strong>
              </span>
            </div>
            {usersLoading ? <Spinner /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                {users.map(u => (
                  <div key={u._id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="avatar" style={{ width: 38, height: 38, fontSize: '.9rem', flexShrink: 0 }}>
                      {u.avatar ? <img src={u.avatar} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} /> : u.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{u.name}</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{u.email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                      <select value={u.role} onChange={e => changeRole(u._id, e.target.value)}
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: '.78rem', color: ROLE_COLORS[u.role] || 'var(--text)', cursor: 'pointer', outline: 'none' }}>
                        <option value="client">Заказчик</option>
                        <option value="freelancer">Фрилансер</option>
                        <option value="admin">Админ</option>
                      </select>
                      <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{new Date(u.createdAt).toLocaleDateString('ru-RU')}</div>
                      {u._id !== user.id && (
                        <button onClick={() => deleteUser(u._id)}
                          style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, padding: '4px 10px', fontSize: '.78rem', color: '#ef4444', cursor: 'pointer' }}>
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination page={usersPage} total={usersTotal} limit={20} onChange={setUsersPage} />
          </div>
        )}

        {/* TASKS */}
        {tab === 'tasks' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <select className="form-control" style={{ maxWidth: 200 }} value={tasksStatus}
                onChange={e => { setTasksStatus(e.target.value); setTasksPage(1); }}>
                <option value="">Все статусы</option>
                <option value="open">Открытые</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Выполненные</option>
                <option value="cancelled">Отменённые</option>
              </select>
              <span style={{ color: 'var(--text3)', fontSize: '.85rem', alignSelf: 'center' }}>
                Всего: <strong style={{ color: 'var(--text)' }}>{tasksTotal}</strong>
              </span>
            </div>
            {tasksLoading ? <Spinner /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                {tasks.map(t => (
                  <div key={t._id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '.25rem' }}>{t.title}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text3)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span>{STATUS_LABELS[t.status]}</span>
                        <span>👤 {t.client?.name || '—'}</span>
                        <span>💬 {t.proposals?.length || 0} откликов</span>
                        <span>{new Date(t.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--green)' }}>₽{t.budget?.toLocaleString()}</div>
                      <button onClick={() => deleteTask(t._id)}
                        style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, padding: '4px 10px', fontSize: '.78rem', color: '#ef4444', cursor: 'pointer' }}>
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination page={tasksPage} total={tasksTotal} limit={20} onChange={setTasksPage} />
          </div>
        )}

        {/* SERVICES */}
        {tab === 'services' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ color: 'var(--text3)', fontSize: '.85rem' }}>
                Всего: <strong style={{ color: 'var(--text)' }}>{servicesTotal}</strong>
              </span>
            </div>
            {servicesLoading ? <Spinner /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                {services.map(s => (
                  <div key={s._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ height: 140, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', overflow: 'hidden' }}>
                      {s.imageUrl ? <img src={s.imageUrl} style={{ width: '100%', height: 140, objectFit: 'cover' }} /> : '🔧'}
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '.3rem' }}>{s.title}</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginBottom: '.5rem' }}>👤 {s.freelancer?.name || '—'} · {s.freelancer?.email}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--green)' }}>₽{s.price?.toLocaleString()}</div>
                        <button onClick={() => deleteService(s._id)}
                          style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, padding: '4px 10px', fontSize: '.78rem', color: '#ef4444', cursor: 'pointer' }}>
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination page={servicesPage} total={servicesTotal} limit={20} onChange={setServicesPage} />
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
      <div className="spinner" />
    </div>
  );
}

function Pagination({ page, total, limit, onChange }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
      <button className="btn btn-glass btn-sm" disabled={page === 1} onClick={() => onChange(page - 1)}>← Назад</button>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
        <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-glass'}`} onClick={() => onChange(p)}>{p}</button>
      ))}
      <button className="btn btn-glass btn-sm" disabled={page === pages} onClick={() => onChange(page + 1)}>Вперёд →</button>
    </div>
  );
}
