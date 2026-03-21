import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['all', 'development', 'design', 'writing', 'marketing', 'video', 'music', 'other'];
const CAT_LABELS = {
  all: 'Все', development: '💻 Разработка', design: '🎨 Дизайн',
  writing: '✍️ Копирайтинг', marketing: '📣 Маркетинг',
  video: '🎬 Видео', music: '🎵 Музыка', other: '🔧 Другое'
};
const CAT_EMOJIS = {
  development: '💻', design: '🎨', writing: '✍️',
  marketing: '📣', video: '🎬', music: '🎵', other: '🔧'
};
const STATUS_COLORS = {
  open:        { bg: 'rgba(16,217,138,.1)',  border: 'rgba(16,217,138,.25)', color: '#10d98a' },
  in_progress: { bg: 'rgba(79,110,247,.1)',  border: 'rgba(79,110,247,.25)', color: 'var(--blue)' },
  completed:   { bg: 'rgba(100,100,100,.1)', border: 'rgba(100,100,100,.2)', color: 'var(--text3)' },
};
const PAGE_SIZE  = 9;
const EMPTY_FORM = { title: '', description: '', budget: '', deadline: '', category: 'development', skills: '' };

export default function TasksPage({ onAuthOpen }) {
  const { user } = useAuth();
  const [tasks, setTasks]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('all');
  const [sort, setSort]               = useState('newest');
  const [budgetMin, setBudgetMin]     = useState('');
  const [budgetMax, setBudgetMax]     = useState('');
  const [page, setPage]               = useState(1);
  const [favIds, setFavIds]           = useState(new Set());
  const [showCreate, setShowCreate]   = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [creating, setCreating]       = useState(false);
  const [formError, setFormError]     = useState('');

  useEffect(() => { loadTasks(); }, []);
  useEffect(() => { if (user) loadFavs(); }, [user]);
  useEffect(() => { setPage(1); }, [search, category, sort, budgetMin, budgetMax]);

  async function loadTasks() {
    setLoading(true);
    try { const { data } = await API.get('/tasks'); setTasks(data); } catch {}
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
    setFormError('');
    if (!form.title || !form.budget || !form.deadline) {
      setFormError('Заполните все обязательные поля');
      return;
    }
    setCreating(true);
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      await API.post('/tasks', { ...form, budget: Number(form.budget), skills });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      loadTasks();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Ошибка при создании');
    }
    setCreating(false);
  }

  const filtered = tasks
    .filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      const matchCat    = category === 'all' || t.category === category;
      const matchMin    = !budgetMin || t.budget >= Number(budgetMin);
      const matchMax    = !budgetMax || t.budget <= Number(budgetMax);
      return matchSearch && matchCat && matchMin && matchMax;
    })
    .sort((a, b) => {
      if (sort === 'newest')      return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'budget_desc') return b.budget - a.budget;
      if (sort === 'budget_asc')  return a.budget - b.budget;
      if (sort === 'proposals')   return (a.proposals?.length || 0) - (b.proposals?.length || 0);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActive  = budgetMin || budgetMax || category !== 'all';

  function resetFilters() {
    setBudgetMin(''); setBudgetMax(''); setCategory('all'); setSearch(''); setPage(1);
  }

  function goPage(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="page">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(180deg,rgba(79,110,247,.06) 0%,transparent 100%)',
        borderBottom: '1px solid var(--border)', padding: '3rem 0 2rem'
      }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, letterSpacing: '-.04em', marginBottom: '.5rem' }}>
            Найди своё задание
          </h1>
          <p style={{ color: 'var(--text2)', marginBottom: '1.5rem', fontSize: '.95rem' }}>
            {tasks.length} активных заданий от заказчиков
          </p>

          {/* Search + filter toggle */}
          <div style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: '1rem', pointerEvents: 'none' }}>⌕</span>
              <input
                style={{ width: '100%', padding: '13px 14px 13px 42px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '.95rem', outline: 'none', boxSizing: 'border-box' }}
                placeholder="React разработчик, дизайн логотипа..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-glass'}`}
              onClick={() => setShowFilters(v => !v)}
              style={{ flexShrink: 0, position: 'relative' }}
            >
              ⚙ Фильтры
              {hasActive && <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#4f6ef7' }} />}
            </button>
          </div>

          {/* Budget filter panel */}
          {showFilters && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: 4 }}>Бюджет от (₽)</div>
                <input type="number" placeholder="0" value={budgetMin} onChange={e => setBudgetMin(e.target.value)}
                  style={{ width: 130, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '.875rem', outline: 'none' }} />
              </div>
              <div>
                <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: 4 }}>Бюджет до (₽)</div>
                <input type="number" placeholder="∞" value={budgetMax} onChange={e => setBudgetMax(e.target.value)}
                  style={{ width: 130, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '.875rem', outline: 'none' }} />
              </div>
              {hasActive && <button className="btn btn-glass btn-sm" onClick={resetFilters}>Сбросить</button>}
            </div>
          )}

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
            {filtered.length > 0
              ? <>Найдено: <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> · стр. {page} из {totalPages || 1}</>
              : 'Ничего не найдено'
            }
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
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Разместить задание</button>
            )}
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-task-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.8rem' }}>
                  <div className="skeleton skeleton-line w-3-4 h-lg" />
                  <div className="skeleton skeleton-line w-1-3 h-lg" style={{ marginLeft: '1rem' }} />
                </div>
                <div className="skeleton skeleton-line w-full" style={{ marginBottom: '.4rem' }} />
                <div className="skeleton skeleton-line w-3-4" style={{ marginBottom: '1rem' }} />
                <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1rem' }}>
                  <div className="skeleton skeleton-line w-1-3 h-sm" style={{ borderRadius: 4 }} />
                  <div className="skeleton skeleton-line w-1-3 h-sm" style={{ borderRadius: 4 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '.9rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <div className="skeleton skeleton-avatar" style={{ width: 24, height: 24 }} />
                    <div className="skeleton skeleton-line w-1-2 h-sm" />
                  </div>
                  <div className="skeleton skeleton-line w-1-3 h-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Ничего не найдено</h3>
            <p>Попробуй изменить фильтры или поисковый запрос</p>
            {hasActive && (
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={resetFilters}>
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1rem' }}>
            {paginated.map((task, i) => (
              <TaskCard key={task._id} task={task} isFav={favIds.has(task._id)} onFav={toggleFav} onAuthOpen={onAuthOpen} user={user} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
            <button className="btn btn-glass btn-sm" disabled={page === 1} onClick={() => goPage(page - 1)}>← Назад</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === '...'
                ? <span key={`d${i}`} style={{ alignSelf: 'center', color: 'var(--text3)', padding: '0 4px' }}>…</span>
                : <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-glass'}`} onClick={() => goPage(p)}>{p}</button>
              )
            }
            <button className="btn btn-glass btn-sm" disabled={page === totalPages} onClick={() => goPage(page + 1)}>Вперёд →</button>
          </div>
        )}
      </div>

      {/* Create modal */}
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
              {formError && (
                <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem', color: '#ef4444', fontSize: '.875rem' }}>
                  {formError}
                </div>
              )}
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
  const navigate    = useNavigate();
  const deadline    = new Date(task.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const isNew       = (Date.now() - new Date(task.createdAt)) < 24 * 60 * 60 * 1000;
  const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.open;
  const statusText  = { open: 'Открыто', in_progress: 'В работе', completed: 'Выполнено' }[task.status] || 'Открыто';

  return (
    <div className="task-card" onClick={() => navigate(`/tasks/${task._id}`)}
      style={{ animationDelay: `${index * 40}ms`, animation: 'fadeUp .4s ease both', cursor: 'pointer' }}>

      <div className="task-card-header" style={{ marginBottom: '.6rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '.35rem', flexWrap: 'wrap' }}>
            {isNew && (
              <span style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '.04em', background: 'rgba(79,110,247,.15)', color: 'var(--blue)', border: '1px solid rgba(79,110,247,.25)', borderRadius: 4, padding: '2px 6px' }}>НОВОЕ</span>
            )}
            <span style={{ fontSize: '.65rem', fontWeight: 600, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, borderRadius: 4, padding: '2px 6px' }}>
              {statusText}
            </span>
          </div>
          <h3 style={{ fontSize: '.95rem', fontWeight: 700, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {task.title}
          </h3>
        </div>
        <div className="task-budget" style={{ flexShrink: 0, marginLeft: '.75rem' }}>
          ₽{task.budget?.toLocaleString()}
        </div>
      </div>

      {task.description && (
        <p className="task-desc" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </p>
      )}

      {task.skills?.length > 0 && (
        <div className="task-skills">
          {task.skills.slice(0, 3).map(s => <span key={s} className="skill-tag">{s}</span>)}
          {task.skills.length > 3 && <span className="skill-tag">+{task.skills.length - 3}</span>}
        </div>
      )}

      <div className="task-meta">
        <div className="task-client">
          <div className="avatar" style={{ width: 26, height: 26, fontSize: '.72rem', flexShrink: 0, background: 'linear-gradient(135deg,var(--blue),var(--purple))' }}>
            {task.client?.avatar
              ? <img src={task.client.avatar} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
              : (task.client?.name || '?').charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>
            {task.client?.name || 'Заказчик'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{CAT_EMOJIS[task.category] || '🔧'}</span>
          <span style={{ fontSize: '.75rem', color: 'var(--text3)' }}>⏰ {deadline}</span>
          <span style={{ fontSize: '.75rem', color: 'var(--text3)' }}>💬 {task.proposals?.length || 0}</span>
          <button
            onClick={e => onFav(e, task._id)}
            style={{ width: 28, height: 28, borderRadius: '50%', background: isFav ? 'rgba(239,68,68,.12)' : 'var(--surface2)', border: `1px solid ${isFav ? 'rgba(239,68,68,.3)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '.75rem', flexShrink: 0, transition: 'all .15s' }}>
            {isFav ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
}
