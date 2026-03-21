import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['all', 'development', 'design', 'writing', 'marketing', 'video', 'music', 'other'];
const CAT_LABELS = { all: 'Все', development: '💻 Разработка', design: '🎨 Дизайн', writing: '✍️ Копирайтинг', marketing: '📣 Маркетинг', video: '🎬 Видео', music: '🎵 Музыка', other: '🔧 Другое' };
const CAT_EMOJIS = { development: '💻', design: '🎨', writing: '✍️', marketing: '📣', video: '🎬', music: '🎵', other: '🔧' };

export default function TasksPage({ onAuthOpen }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [favIds, setFavIds] = useState(new Set());
  const [showCreate, setShowCreate] = useState(false);

  // Create task form
  const [form, setForm] = useState({ title: '', description: '', budget: '', deadline: '', category: 'development', skills: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTasks();
    if (user) loadFavs();
  }, [user]);

  async function loadTasks() {
    setLoading(true);
    try {
      const { data } = await API.get('/tasks');
      setTasks(data);
    } catch {}
    setLoading(false);
  }

  async function loadFavs() {
    try {
      const { data } = await API.get('/favorites');
      setFavIds(new Set(data.map(f => f.task?._id || f.task)));
    } catch {}
  }

  async function toggleFav(e, taskId) {
    e.stopPropagation();
    if (!user) { onAuthOpen('login'); return; }
    try {
      if (favIds.has(taskId)) {
        await API.delete(`/favorites/${taskId}`);
        setFavIds(prev => { const s = new Set(prev); s.delete(taskId); return s; });
      } else {
        await API.post('/favorites', { taskId });
        setFavIds(prev => new Set([...prev, taskId]));
      }
    } catch {}
  }

  async function createTask(e) {
    e.preventDefault();
    if (!form.title || !form.budget || !form.deadline) return;
    setCreating(true);
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      await API.post('/tasks', { ...form, budget: Number(form.budget), skills });
      setShowCreate(false);
      setForm({ title: '', description: '', budget: '', deadline: '', category: 'development', skills: '' });
      loadTasks();
    } catch {}
    setCreating(false);
  }

  const filtered = tasks
    .filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      const matchCat = category === 'all' || t.category === category;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'budget_desc') return b.budget - a.budget;
      if (sort === 'budget_asc') return a.budget - b.budget;
      if (sort === 'proposals') return (a.proposals?.length || 0) - (b.proposals?.length || 0);
      return 0;
    });

  return (
    <div className="page">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(180deg, rgba(79,110,247,.06) 0%, transparent 100%)', borderBottom: '1px solid var(--border)', padding: '3rem 0 2rem' }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, letterSpacing: '-.04em', marginBottom: '.75rem' }}>
            Найди своё задание
          </h1>
          <p style={{ color: 'var(--text2)', marginBottom: '1.5rem', fontSize: '.95rem' }}>
            {tasks.length} активных заданий от заказчиков по всему миру
          </p>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: '1rem', pointerEvents: 'none' }}>⌕</span>
            <input
              style={{ width: '100%', padding: '14px 16px 14px 44px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '.95rem', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Поиск по названию или описанию..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Categories */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-glass'}`}>
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 1100, padding: '2rem 1rem 4rem' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ color: 'var(--text3)', fontSize: '.875rem' }}>
            Найдено: <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong>
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '.85rem', cursor: 'pointer', outline: 'none' }}>
              <option value="newest">Новые</option>
              <option value="budget_desc">Бюджет ↓</option>
              <option value="budget_asc">Бюджет ↑</option>
              <option value="proposals">Меньше откликов</option>
            </select>
            {user?.role === 'client' && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                + Разместить задание
              </button>
            )}
          </div>
        </div>

        {/* Tasks grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-task-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.8rem' }}>
                  <div className="skeleton skeleton-line w-3-4 h-lg"/>
                  <div className="skeleton skeleton-line w-1-3 h-lg" style={{ marginLeft: '1rem' }}/>
                </div>
                <div className="skeleton skeleton-line w-full" style={{ marginBottom: '.4rem' }}/>
                <div className="skeleton skeleton-line w-3-4" style={{ marginBottom: '1rem' }}/>
                <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1rem' }}>
                  <div className="skeleton skeleton-line w-1-3 h-sm" style={{ borderRadius: 4 }}/>
                  <div className="skeleton skeleton-line w-1-3 h-sm" style={{ borderRadius: 4 }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '.9rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <div className="skeleton skeleton-avatar" style={{ width: 24, height: 24 }}/>
                    <div className="skeleton skeleton-line w-1-2 h-sm"/>
                  </div>
                  <div className="skeleton skeleton-line w-1-3 h-sm"/>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Ничего не найдено</h3>
            <p>Попробуй изменить фильтры или поисковый запрос</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1rem' }}>
            {filtered.map((task, i) => (
              <TaskCard key={task._id} task={task} isFav={favIds.has(task._id)} onFav={toggleFav} onAuthOpen={onAuthOpen} user={user} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Create task modal */}
      {showCreate && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Разместить задание</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={createTask}>
              <div className="form-group">
                <label>Название *</label>
                <input className="form-control" placeholder="Разработка сайта на React" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea className="form-control" placeholder="Подробно опишите задание..." style={{ minHeight: 100 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Бюджет (₽) *</label>
                  <input className="form-control" type="number" placeholder="5000" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Дедлайн *</label>
                  <input className="form-control" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label>Категория</label>
                <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Навыки (через запятую)</label>
                <input className="form-control" placeholder="React, Node.js, MongoDB" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
              </div>
              <button className="btn btn-primary w-full" type="submit" disabled={creating}>
                {creating ? 'Размещаем...' : 'Разместить задание 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, isFav, onFav, user, onAuthOpen, index }) {
  const navigate = useNavigate();
  const deadline = new Date(task.deadline).toLocaleDateString('ru-RU');
  const CAT_EMOJIS = { development: '💻', design: '🎨', writing: '✍️', marketing: '📣', video: '🎬', music: '🎵', other: '🔧' };

  return (
    <div className="task-card" onClick={() => navigate(`/tasks/${task._id}`)}
      style={{ animationDelay: `${index * 40}ms`, animation: 'fadeUp .4s ease both' }}>
      <div className="task-card-header">
        <h3>{task.title}</h3>
        <div className="task-budget">₽{task.budget?.toLocaleString()}</div>
      </div>
      <p className="task-desc">{task.description}</p>
      {task.skills?.length > 0 && (
        <div className="task-skills">
          {task.skills.slice(0, 3).map(s => <span key={s} className="skill-tag">{s}</span>)}
          {task.skills.length > 3 && <span className="skill-tag">+{task.skills.length - 3}</span>}
        </div>
      )}
      <div className="task-meta">
        <div className="task-client">
          <div className="avatar" style={{ width: 24, height: 24, fontSize: '.7rem', background: 'linear-gradient(135deg,var(--blue),var(--purple))' }}>
            {task.client?.avatar
              ? <img src={task.client.avatar} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
              : (task.client?.name || '?').charAt(0)}
          </div>
          {task.client?.name || 'Заказчик'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <div className="task-info">
            <span>{CAT_EMOJIS[task.category] || '🔧'}</span>
            <span>⏰ {deadline}</span>
            <span>💬 {task.proposals?.length || 0}</span>
          </div>
          <button
            onClick={e => onFav(e, task._id)}
            style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '.75rem', flexShrink: 0, transition: 'background .15s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(79,110,247,.15)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--surface2)'}>
            {isFav ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
}