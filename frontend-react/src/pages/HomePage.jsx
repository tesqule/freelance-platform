import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const CATS = [
  { id:'development', label:'Разработка',   hint:'Сайты, приложения, API, боты' },
  { id:'design',      label:'Дизайн',        hint:'UI/UX, логотипы, брендинг' },
  { id:'writing',     label:'Копирайтинг',   hint:'Тексты, переводы, статьи' },
  { id:'marketing',   label:'Маркетинг',     hint:'SMM, реклама, SEO, email' },
  { id:'video',       label:'Видео',         hint:'Монтаж, анимация, моушн' },
  { id:'music',       label:'Аудио',         hint:'Джинглы, озвучка, сведение' },
  { id:'other',       label:'Другое',        hint:'Любые задачи и проекты' },
];

const CAT_ICONS = {
  development: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  design:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
  writing:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  marketing:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  video:       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  music:       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  other:       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
};

const HOW = {
  client: [
    { n:'01', title:'Опишите задачу',         text:'Создайте задание с описанием, бюджетом и дедлайном за 2 минуты.' },
    { n:'02', title:'Выберите исполнителя',    text:'Получайте отклики и сравнивайте профили, портфолио, отзывы.' },
    { n:'03', title:'Получите результат',      text:'Общайтесь напрямую, согласуйте условия и примите готовую работу.' },
  ],
  fl: [
    { n:'01', title:'Создайте профиль',        text:'Добавьте портфолио, навыки и услуги — заказчики найдут вас сами.' },
    { n:'02', title:'Откликайтесь на заказы',  text:'Находите подходящие задания и отправляйте предложения.' },
    { n:'03', title:'Получайте оплату',        text:'Выполняйте заказы, собирайте отзывы, стройте репутацию.' },
  ],
};

const CAT_LABELS = { development:'Разработка', design:'Дизайн', writing:'Тексты', marketing:'Маркетинг', video:'Видео', music:'Аудио', other:'Другое' };

export default function HomePage({ onAuthOpen }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [search, setSearch] = useState('');
  const [stats,  setStats]  = useState({ tasks:0, freelancers:0, completed:0 });
  const [tasks,  setTasks]  = useState([]);
  const [svcs,   setSvcs]   = useState([]);
  const [fls,    setFls]    = useState([]);
  const [how,    setHow]    = useState('client');
  const [loading,setLoading]= useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [tRes, uRes, sRes] = await Promise.allSettled([API.get('/tasks'), API.get('/users'), API.get('/services')]);
      if (tRes.status === 'fulfilled') {
        const arr = Array.isArray(tRes.value.data) ? tRes.value.data : [];
        setTasks(arr.filter(t => t.status === 'open').slice(0, 6));
        setStats(s => ({ ...s, tasks: arr.filter(t => t.status === 'open').length, completed: arr.filter(t => t.status === 'completed').length }));
      }
      if (uRes.status === 'fulfilled') {
        const frees = uRes.value.data.filter(u => u.role === 'freelancer');
        setFls(frees.slice(0, 4));
        setStats(s => ({ ...s, freelancers: frees.length }));
      }
      if (sRes.status === 'fulfilled') setSvcs(Array.isArray(sRes.value.data) ? sRes.value.data.slice(0, 6) : []);
    } catch {}
    setLoading(false);
  }

  function doSearch(e) {
    e.preventDefault();
    nav(search.trim() ? `/tasks?q=${encodeURIComponent(search.trim())}` : '/tasks');
  }

  return (
    <>
      <div className="bg-canvas"><div className="bg-grid"/></div>
      <div className="noise-overlay"/>
      <div className="page">

        {/* ── HERO ── */}
        <section className="hero">
          <div className="container" style={{ maxWidth:720 }}>
            <div className="hero-eyebrow">
              <span className="live-dot"/>
              Фриланс-платформа
            </div>
            <h1 className="hero-title">
              Найдите специалиста<br/>
              <span className="hero-title-dim">для любой задачи</span>
            </h1>
            <p className="hero-sub">
              Тысячи проверенных фрилансеров. Разработка, дизайн, маркетинг и ещё 50+ категорий.
            </p>

            <div className="hero-search-wrap">
              <form className="hero-search" onSubmit={doSearch}>
                <span className="search-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                </span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Разработка сайта, дизайн логотипа, SEO..."/>
                <button className="search-btn" type="submit">Найти</button>
              </form>
            </div>

            <div className="hero-actions">
              {!user ? (
                <>
                  <button className="btn btn-primary btn-xl" onClick={() => onAuthOpen('register')}>Начать бесплатно</button>
                  <button className="btn btn-outline btn-xl" onClick={() => onAuthOpen('login')}>Войти</button>
                </>
              ) : (
                <>
                  <Link to="/tasks"    className="btn btn-primary btn-xl">Смотреть задания</Link>
                  <Link to="/services" className="btn btn-outline btn-xl">Каталог услуг</Link>
                </>
              )}
            </div>

            <div className="stats-row">
              {[
                { n: stats.tasks,       l: 'Активных заданий' },
                { n: stats.freelancers, l: 'Фрилансеров'       },
                { n: stats.completed,   l: 'Выполнено'          },
              ].map((s, i) => (
                <div key={i} className="stat-item" style={i > 0 ? { borderLeft:'1px solid var(--b1)' } : {}}>
                  <div className="stat-num">{s.n || '—'}</div>
                  <div className="stat-lbl">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CATEGORIES ── */}
        <section className="section">
          <div className="container">
            <div className="sec-row">
              <div><div className="sec-label">Направления</div><h2 className="sec-title">Категории услуг</h2></div>
              <Link to="/tasks" className="btn btn-ghost btn-sm">Все задания →</Link>
            </div>
            <div className="cats-grid">
              {CATS.map((c, i) => (
                <div key={c.id} className="cat-card" style={{ animationDelay:`${i*35}ms` }} onClick={() => nav(`/tasks?cat=${c.id}`)}>
                  <div className="cat-icon">{CAT_ICONS[c.id]}</div>
                  <div className="cat-name">{c.label}</div>
                  <div className="cat-hint">{c.hint}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TASKS ── */}
        <section className="section" style={{ paddingTop:0 }}>
          <div className="container">
            <div className="sec-row">
              <div><div className="sec-label">Задания</div><h2 className="sec-title">Свежие заказы</h2></div>
              <Link to="/tasks" className="btn btn-ghost btn-sm">Смотреть все →</Link>
            </div>
            {loading ? (
              <div className="tasks-grid">
                {Array.from({length:6}).map((_,i) => (
                  <div key={i} style={{ background:'var(--card)', padding:'1.1rem', display:'flex', flexDirection:'column', gap:'.5rem' }}>
                    <div className="skeleton" style={{ height:15, width:'62%' }}/>
                    <div className="skeleton" style={{ height:11 }}/>
                    <div className="skeleton" style={{ height:11, width:'78%' }}/>
                    <div style={{ display:'flex', gap:'.3rem', marginTop:'.2rem' }}>
                      <div className="skeleton" style={{ height:18, width:50, borderRadius:4 }}/>
                      <div className="skeleton" style={{ height:18, width:60, borderRadius:4 }}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="empty-state"><h3>Заданий пока нет</h3></div>
            ) : (
              <div className="tasks-grid">
                {tasks.map((t,i) => <TaskCard key={t._id} task={t} index={i} nav={nav}/>)}
              </div>
            )}
          </div>
        </section>

        {/* ── FREELANCERS ── */}
        {fls.length > 0 && (
          <section className="section" style={{ paddingTop:0 }}>
            <div className="container">
              <div className="sec-row">
                <div><div className="sec-label">Специалисты</div><h2 className="sec-title">Лучшие фрилансеры</h2></div>
                <Link to="/freelancers" className="btn btn-ghost btn-sm">Все специалисты →</Link>
              </div>
              <div className="freelancers-grid">
                {fls.map((fl,i) => <FlCard key={fl._id} fl={fl} index={i} nav={nav} user={user}/>)}
              </div>
            </div>
          </section>
        )}

        {/* ── SERVICES ── */}
        {svcs.length > 0 && (
          <section className="section" style={{ paddingTop:0 }}>
            <div className="container">
              <div className="sec-row">
                <div><div className="sec-label">Услуги</div><h2 className="sec-title">Готовые предложения</h2></div>
                <Link to="/services" className="btn btn-ghost btn-sm">Каталог услуг →</Link>
              </div>
              <div className="services-grid">
                {svcs.map((s,i) => <SvcCard key={s._id} svc={s} index={i} nav={nav}/>)}
              </div>
            </div>
          </section>
        )}

        {/* ── HOW ── */}
        <section className="section" style={{ paddingTop:0 }}>
          <div className="container" style={{ maxWidth:820 }}>
            <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
              <div className="sec-label">Как это работает</div>
              <h2 className="sec-title">Три шага до результата</h2>
            </div>
            <div className="how-tabs">
              <button className={`how-tab${how==='client'?' active':''}`} onClick={() => setHow('client')}>Я заказчик</button>
              <button className={`how-tab${how==='fl'?' active':''}`}     onClick={() => setHow('fl')}>Я фрилансер</button>
            </div>
            <div className="how-steps">
              {HOW[how].map((s,i) => (
                <div key={i} className="how-step" style={{ animationDelay:`${i*50}ms` }}>
                  <div className="how-num">{s.n}</div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="section" style={{ paddingTop:0 }}>
          <div className="container" style={{ maxWidth:680 }}>
            <div className="cta-box">
              <h2 className="cta-title">Готовы начать?</h2>
              <p className="cta-sub">Зарегистрируйтесь бесплатно и разместите первое задание или создайте профиль.</p>
              <div style={{ display:'flex', gap:'.55rem', justifyContent:'center', flexWrap:'wrap' }}>
                {user ? (
                  <>
                    <Link to="/tasks" className="btn btn-primary btn-lg">Найти задание</Link>
                    <Link to="/dashboard" className="btn btn-outline btn-lg">Личный кабинет</Link>
                  </>
                ) : (
                  <>
                    <button className="btn btn-primary btn-lg" onClick={() => onAuthOpen('register')}>Регистрация</button>
                    <button className="btn btn-outline btn-lg" onClick={() => onAuthOpen('login')}>Войти</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop:'1px solid var(--b1)', padding:'1.5rem 0' }}>
          <div className="container">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'.75rem' }}>
              <span style={{ fontSize:'.75rem', color:'var(--t3)' }}>© 2025 FreeLanceHub</span>
              <div style={{ display:'flex', gap:'1.25rem' }}>
                {[['Задания','/tasks'],['Услуги','/services'],['Фрилансеры','/freelancers']].map(([l,t]) => (
                  <Link key={t} to={t} style={{ fontSize:'.75rem', color:'var(--t3)' }}>{l}</Link>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function TaskCard({ task, index, nav }) {
  return (
    <div className="task-card" style={{ animationDelay:`${index*35}ms` }} onClick={() => nav(`/tasks/${task._id}`)}>
      <div className="task-card-head">
        <h3>{task.title}</h3>
        <span className="task-budget">₽{task.budget?.toLocaleString()}</span>
      </div>
      {task.description && <p className="task-desc">{task.description}</p>}
      <div className="task-tags">
        {task.category && <span className="tag">{CAT_LABELS[task.category] || task.category}</span>}
        {task.skills?.slice(0,3).map(s => <span key={s} className="tag">{s}</span>)}
      </div>
      <div className="task-meta">
        <span className="task-info">
          <span>{task.proposals?.length || 0} откликов</span>
          <span>{new Date(task.deadline).toLocaleDateString('ru-RU', { day:'numeric', month:'short' })}</span>
        </span>
        <span className="badge badge-open">Открыто</span>
      </div>
    </div>
  );
}

function FlCard({ fl, index, nav, user }) {
  return (
    <div className="fl-card" style={{ animationDelay:`${index*45}ms` }} onClick={() => nav(`/profile/${fl._id}`)}>
      <div className="fl-avatar">
        {fl.avatar ? <img src={fl.avatar} alt={fl.name}/> : fl.name?.charAt(0).toUpperCase()}
      </div>
      <div className="fl-name">{fl.name}</div>
      {fl.rating > 0 && <div className="fl-rating">{'★'.repeat(Math.round(fl.rating))}{'☆'.repeat(5-Math.round(fl.rating))} {fl.rating.toFixed(1)}</div>}
      {fl.bio && <p className="fl-bio">{fl.bio}</p>}
      {fl.skills?.length > 0 && (
        <div className="fl-skills">
          {fl.skills.slice(0,4).map(s => <span key={s} className="skill-tag">{s}</span>)}
        </div>
      )}
      <div className="fl-stat">{fl.completedTasks || 0} выполненных заказов</div>
      <div className="fl-actions" onClick={e => e.stopPropagation()}>
        <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => nav(`/profile/${fl._id}`)}>Профиль</button>
        {user && user.id !== fl._id && (
          <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={() => nav(`/chat?user=${fl._id}`)}>Написать</button>
        )}
      </div>
    </div>
  );
}

function SvcCard({ svc, index, nav }) {
  return (
    <div className="service-card" style={{ animationDelay:`${index*35}ms` }}
      onClick={() => nav(`/chat?user=${svc.freelancer?._id || svc.freelancer}&service=${svc._id}`)}>
      <div className="service-thumb">
        {svc.imageUrl ? <img src={svc.imageUrl} alt={svc.title} onError={e => { e.target.style.display='none'; }}/> : <span className="service-thumb-empty">—</span>}
        <span className="service-cat-badge">{CAT_LABELS[svc.category] || svc.category}</span>
      </div>
      <div className="service-body">
        <div className="service-title">{svc.title}</div>
        {svc.description && <p style={{ fontSize:'.76rem', color:'var(--t2)', lineHeight:1.55, marginBottom:'.5rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{svc.description}</p>}
        {svc.skills?.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'.2rem', marginBottom:'.5rem' }}>
            {svc.skills.slice(0,3).map(s => <span key={s} className="skill-tag">{s}</span>)}
          </div>
        )}
        <div className="service-footer">
          <div>
            <div className="service-price">₽{svc.price?.toLocaleString()}</div>
            <div className="service-delivery">Срок {svc.deliveryDays} дн.</div>
          </div>
          {svc.freelancer && (
            <div className="service-author">
              <div className="avatar" style={{ width:20, height:20, fontSize:'.6rem' }}>
                {svc.freelancer.avatar ? <img src={svc.freelancer.avatar} alt=""/> : svc.freelancer.name?.charAt(0)}
              </div>
              <span>{svc.freelancer.name?.split(' ')[0]}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
