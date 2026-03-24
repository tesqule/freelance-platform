import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const CATS = ['all','development','design','writing','marketing','video','music','other'];
const CAT_LABELS = { all:'Все', development:'Разработка', design:'Дизайн', writing:'Тексты', marketing:'Маркетинг', video:'Видео', music:'Аудио', other:'Другое' };
const PAGE_SIZE  = 9;
const EMPTY_FORM = { title:'', description:'', budget:'', deadline:'', category:'development', skills:'' };

const IcoSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;
const IcoFilter  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>;
const IcoHeart   = ({ filled }) => filled
  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;

export default function TasksPage({ onAuthOpen }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState(searchParams.get('q') || '');
  const [category,    setCategory]    = useState(searchParams.get('cat') || 'all');
  const [sort,        setSort]        = useState('newest');
  const [budgetMin,   setBudgetMin]   = useState('');
  const [budgetMax,   setBudgetMax]   = useState('');
  const [page,        setPage]        = useState(1);
  const [favIds,      setFavIds]      = useState(new Set());
  const [showCreate,  setShowCreate]  = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [creating,    setCreating]    = useState(false);
  const [formError,   setFormError]   = useState('');

  useEffect(() => { loadTasks(); }, []);
  useEffect(() => { if (user) loadFavs(); }, [user]);
  useEffect(() => { setPage(1); }, [search, category, sort, budgetMin, budgetMax]);

  async function loadTasks() {
    setLoading(true);
    try { const { data } = await API.get('/tasks'); setTasks(Array.isArray(data) ? data : []); } catch {}
    setLoading(false);
  }
  async function loadFavs() {
    try { const { data } = await API.get('/favorites'); setFavIds(new Set(data.map(f => f.task?._id || f.task))); } catch {}
  }
  async function toggleFav(e, taskId) {
    e.stopPropagation();
    if (!user) { onAuthOpen('login'); return; }
    try {
      if (favIds.has(taskId)) { await API.delete(`/favorites/${taskId}`); setFavIds(prev => { const s = new Set(prev); s.delete(taskId); return s; }); }
      else { await API.post('/favorites', { taskId }); setFavIds(prev => new Set([...prev, taskId])); }
    } catch {}
  }
  async function createTask(e) {
    e.preventDefault(); setFormError('');
    if (!form.title || !form.budget || !form.deadline) { setFormError('Заполните все обязательные поля'); return; }
    setCreating(true);
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      await API.post('/tasks', { ...form, budget: Number(form.budget), skills });
      setShowCreate(false); setForm(EMPTY_FORM); loadTasks();
    } catch (err) { setFormError(err.response?.data?.message || 'Ошибка при создании'); }
    setCreating(false);
  }

  const filtered = tasks
    .filter(t => t.status === 'open')
    .filter(t => {
      const q = search.toLowerCase();
      return (!q || t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
        && (category === 'all' || t.category === category)
        && (!budgetMin || t.budget >= Number(budgetMin))
        && (!budgetMax || t.budget <= Number(budgetMax));
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

  function goPage(p) { setPage(p); window.scrollTo({ top:0, behavior:'smooth' }); }

  return (
    <div className="page">
      {/* Page header */}
      <div style={{ borderBottom:'1px solid var(--b1)', background:'var(--card)' }}>
        <div className="container" style={{ padding:'2rem 1.25rem 1.25rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'1.25rem' }}>
            <div>
              <div style={{ fontSize:'.65rem', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--t3)', marginBottom:'.35rem' }}>Биржа</div>
              <h1 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:800, letterSpacing:'-.035em' }}>Задания</h1>
              <p style={{ color:'var(--t3)', fontSize:'.82rem', marginTop:'.3rem' }}>{tasks.filter(t => t.status==='open').length} активных заданий</p>
            </div>
            <div style={{ display:'flex', gap:'.5rem' }}>
              {user?.role === 'client' && (
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Разместить задание</button>
              )}
              {user?.role === 'freelancer' && (
                <Link to="/services" className="btn btn-outline">Разместить услугу</Link>
              )}
              {!user && (
                <button className="btn btn-primary" onClick={() => onAuthOpen('register')}>Зарегистрироваться</button>
              )}
            </div>
          </div>

          {/* Search + filter */}
          <div style={{ display:'flex', gap:'.5rem', marginBottom:'1rem' }}>
            <div className="search-wrap" style={{ flex:1 }}>
              <span className="si"><IcoSearch/></span>
              <input placeholder="Разработка сайта, дизайн логотипа..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <button className={`btn btn-sm ${showFilters ? 'btn-outline' : 'btn-ghost'}`}
              onClick={() => setShowFilters(v => !v)}
              style={{ position:'relative', gap:'.4rem' }}>
              <IcoFilter/>Фильтры
              {hasActive && <span style={{ position:'absolute', top:-3, right:-3, width:7, height:7, borderRadius:'50%', background:'var(--t1)' }}/>}
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div style={{ background:'var(--s1)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:'.9rem', marginBottom:'.9rem', display:'flex', gap:'.75rem', flexWrap:'wrap', alignItems:'flex-end' }}>
              <div>
                <div style={{ fontSize:'.65rem', color:'var(--t3)', marginBottom:'.28rem', fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase' }}>Бюджет от</div>
                <input type="number" placeholder="0" value={budgetMin} onChange={e => setBudgetMin(e.target.value)}
                  style={{ width:120, padding:'.46rem .7rem', background:'var(--card)', border:'1px solid var(--b2)', borderRadius:'var(--r)', color:'var(--t1)', fontFamily:'var(--font)', fontSize:'.82rem', outline:'none' }}/>
              </div>
              <div>
                <div style={{ fontSize:'.65rem', color:'var(--t3)', marginBottom:'.28rem', fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase' }}>Бюджет до</div>
                <input type="number" placeholder="∞" value={budgetMax} onChange={e => setBudgetMax(e.target.value)}
                  style={{ width:120, padding:'.46rem .7rem', background:'var(--card)', border:'1px solid var(--b2)', borderRadius:'var(--r)', color:'var(--t1)', fontFamily:'var(--font)', fontSize:'.82rem', outline:'none' }}/>
              </div>
              {hasActive && <button className="btn btn-ghost btn-sm" onClick={() => { setBudgetMin(''); setBudgetMax(''); setCategory('all'); }}>Сбросить</button>}
            </div>
          )}

          {/* Category tabs */}
          <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--b1)', marginBottom:'-1px', overflowX:'auto' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                style={{
                  padding:'.5rem .9rem', background:'none', border:'none',
                  borderBottom:`2px solid ${category===c ? 'var(--t1)' : 'transparent'}`,
                  color: category===c ? 'var(--t1)' : 'var(--t3)',
                  fontFamily:'var(--font)', fontSize:'.78rem', fontWeight: category===c ? 600 : 400,
                  cursor:'pointer', transition:'color .12s', whiteSpace:'nowrap', marginBottom:'-1px',
                }}>
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding:'1.5rem 1.25rem 4rem' }}>
        {/* Toolbar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'.75rem' }}>
          <span style={{ fontSize:'.78rem', color:'var(--t3)' }}>
            {filtered.length > 0 ? <>{filtered.length} {filtered.length===1?'задание':'заданий'} · стр. {page} из {totalPages||1}</> : 'Ничего не найдено'}
          </span>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ background:'var(--s1)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:'.38rem .75rem', color:'var(--t2)', fontFamily:'var(--font)', fontSize:'.78rem', cursor:'pointer', outline:'none' }}>
            <option value="newest">Сначала новые</option>
            <option value="budget_desc">Бюджет по убыванию</option>
            <option value="budget_asc">Бюджет по возрастанию</option>
            <option value="proposals">Меньше откликов</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="tasks-grid">
            {Array.from({length:6}).map((_,i) => (
              <div key={i} style={{ background:'var(--card)', padding:'1.1rem', display:'flex', flexDirection:'column', gap:'.5rem' }}>
                <div className="skeleton" style={{ height:15, width:'62%' }}/>
                <div className="skeleton" style={{ height:11 }}/>
                <div className="skeleton" style={{ height:11, width:'78%' }}/>
                <div style={{ display:'flex', gap:'.25rem', marginTop:'.2rem' }}>
                  <div className="skeleton" style={{ height:18, width:48, borderRadius:3 }}/>
                  <div className="skeleton" style={{ height:18, width:58, borderRadius:3 }}/>
                </div>
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="empty-state" style={{ padding:'4rem 2rem' }}>
            <div className="empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            <h3>Заданий не найдено</h3>
            <p>Попробуйте изменить поисковый запрос или фильтры</p>
            {(search || hasActive) && (
              <button className="btn btn-outline" style={{ marginTop:'1rem' }}
                onClick={() => { setSearch(''); setBudgetMin(''); setBudgetMax(''); setCategory('all'); }}>
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <div className="tasks-grid">
            {paginated.map((t,i) => (
              <TaskCard key={t._id} task={t} index={i} isFav={favIds.has(t._id)} onFav={toggleFav} user={user} onAuthOpen={onAuthOpen}/>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:'flex', gap:'.3rem', justifyContent:'center', marginTop:'2rem', flexWrap:'wrap' }}>
            <button className="btn btn-ghost btn-sm" disabled={page===1} onClick={() => goPage(page-1)}>← Назад</button>
            {Array.from({length:totalPages},(_,i) => i+1)
              .filter(p => p===1 || p===totalPages || Math.abs(p-page)<=1)
              .reduce((acc,p,idx,arr) => { if (idx>0 && p-arr[idx-1]>1) acc.push('...'); acc.push(p); return acc; }, [])
              .map((p,i) => p==='...'
                ? <span key={`d${i}`} style={{ alignSelf:'center', color:'var(--t3)', padding:'0 4px' }}>…</span>
                : <button key={p} className={`btn btn-sm ${p===page ? 'btn-primary' : 'btn-ghost'}`} onClick={() => goPage(p)}>{p}</button>
              )}
            <button className="btn btn-ghost btn-sm" disabled={page===totalPages} onClick={() => goPage(page+1)}>Вперёд →</button>
          </div>
        )}
      </div>

      {/* Create task modal */}
      {showCreate && (
        <div className="modal-overlay open" onClick={e => e.target===e.currentTarget && setShowCreate(false)}>
          <div className="modal" style={{ maxWidth:520 }}>
            <div className="modal-header">
              <h3>Разместить задание</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>
                <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 5 5 15M5 5l10 10"/></svg>
              </button>
            </div>
            <form onSubmit={createTask}>
              {formError && (
                <div style={{ background:'var(--red-dim)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'var(--r)', padding:'9px 12px', marginBottom:'.9rem', color:'#f87171', fontSize:'.78rem' }}>{formError}</div>
              )}
              <div className="form-group">
                <label>Название *</label>
                <input className="form-control" placeholder="Разработка сайта на React" value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} required/>
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea className="form-control" placeholder="Подробно опишите задание, требования, ожидаемый результат..." style={{ minHeight:100 }} value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))}/>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Бюджет (₽) *</label>
                  <input className="form-control" type="number" placeholder="5000" value={form.budget} onChange={e => setForm(f => ({...f, budget:e.target.value}))} required/>
                </div>
                <div className="form-group">
                  <label>Дедлайн *</label>
                  <input className="form-control" type="date" value={form.deadline} onChange={e => setForm(f => ({...f, deadline:e.target.value}))} required/>
                </div>
              </div>
              <div className="form-group">
                <label>Категория</label>
                <select className="form-control" value={form.category} onChange={e => setForm(f => ({...f, category:e.target.value}))}>
                  {CATS.filter(c => c!=='all').map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Требуемые навыки</label>
                <input className="form-control" placeholder="React, Node.js, MongoDB" value={form.skills} onChange={e => setForm(f => ({...f, skills:e.target.value}))}/>
              </div>
              <button className="btn btn-primary w-full" type="submit" disabled={creating}>
                {creating ? 'Размещаем...' : 'Разместить задание'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, isFav, onFav, user, onAuthOpen, index }) {
  const nav = useNavigate();
  const deadline = new Date(task.deadline).toLocaleDateString('ru-RU', { day:'numeric', month:'short' });
  const isNew = (Date.now() - new Date(task.createdAt)) < 86400000;

  return (
    <div className="task-card" style={{ animationDelay:`${index*30}ms` }} onClick={() => nav(`/tasks/${task._id}`)}>
      <div className="task-card-head">
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', gap:'.3rem', marginBottom:'.4rem', flexWrap:'wrap' }}>
            {isNew && <span className="badge" style={{ background:'var(--s2)', color:'var(--t2)', fontSize:'.6rem' }}>Новое</span>}
            <span className="badge badge-open">Открыто</span>
          </div>
          <h3>{task.title}</h3>
        </div>
        <span className="task-budget">₽{task.budget?.toLocaleString()}</span>
      </div>

      {task.description && <p className="task-desc">{task.description}</p>}

      {task.skills?.length > 0 && (
        <div className="task-tags">
          {task.skills.slice(0,4).map(s => <span key={s} className="skill-tag">{s}</span>)}
          {task.skills.length > 4 && <span className="skill-tag">+{task.skills.length-4}</span>}
        </div>
      )}

      <div className="task-meta">
        <div className="task-author">
          <div className="avatar" style={{ width:22, height:22, fontSize:'.65rem' }}>
            {task.client?.avatar ? <img src={task.client.avatar} style={{ width:22, height:22, borderRadius:'50%', objectFit:'cover' }} alt=""/> : (task.client?.name||'?').charAt(0).toUpperCase()}
          </div>
          <span style={{ maxWidth:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.client?.name || 'Заказчик'}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
          <span className="task-info">{deadline}</span>
          <span className="task-info">{task.proposals?.length||0} откл.</span>
          <button onClick={e => onFav(e, task._id)}
            style={{ width:26, height:26, borderRadius:'50%', background:'transparent', border:'1px solid var(--b2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: isFav ? 'var(--red)' : 'var(--t3)', flexShrink:0, transition:'all .12s' }}>
            <IcoHeart filled={isFav}/>
          </button>
        </div>
      </div>
    </div>
  );
}
