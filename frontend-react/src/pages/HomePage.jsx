import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const CATEGORIES = [
  { id: 'development', icon: '💻', name: 'Разработка', hint: 'Сайты, приложения, боты' },
  { id: 'design', icon: '🎨', name: 'Дизайн', hint: 'UI/UX, логотипы, графика' },
  { id: 'writing', icon: '✍️', name: 'Копирайтинг', hint: 'Тексты, переводы, статьи' },
  { id: 'marketing', icon: '📣', name: 'Маркетинг', hint: 'SMM, реклама, SEO' },
  { id: 'video', icon: '🎬', name: 'Видео', hint: 'Монтаж, анимация, моушн' },
  { id: 'music', icon: '🎵', name: 'Музыка', hint: 'Джинглы, озвучка, сведение' },
  { id: 'other', icon: '🔧', name: 'Другое', hint: 'Любые задачи' },
];

const HOW_CLIENT = [
  { num: '01', title: 'Опиши задачу', text: 'Расскажи что нужно сделать, укажи бюджет и дедлайн — это займёт 2 минуты.' },
  { num: '02', title: 'Получи отклики', text: 'Фрилансеры откликнутся на твоё задание. Смотри профили, портфолио и отзывы.' },
  { num: '03', title: 'Плати за результат', text: 'Общайся напрямую, договаривайся об условиях и получи готовую работу.' },
];

const HOW_FREELANCER = [
  { num: '01', title: 'Заполни профиль', text: 'Добавь портфолио, навыки и услуги — это поможет заказчикам выбрать именно тебя.' },
  { num: '02', title: 'Откликайся', text: 'Находи подходящие задания и отправляй отклики с описанием своего опыта.' },
  { num: '03', title: 'Зарабатывай', text: 'Выполняй работу, получай оплату и отзывы — строй репутацию на платформе.' },
];

export default function HomePage({ onAuthOpen }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ tasks: '—', freelancers: '—', completed: '—' });
  const [recentTasks, setRecentTasks] = useState([]);
  const [services, setServices] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [svcCat, setSvcCat] = useState('');
  const [howTab, setHowTab] = useState('client');
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    loadStats();
    loadRecentTasks();
    loadServices();
    loadFreelancers();
  }, []);

  async function loadStats() {
    try {
      const [tasksRes, usersRes] = await Promise.allSettled([
        API.get('/tasks'),
        API.get('/users'),
      ]);
      const tasks = tasksRes.status === 'fulfilled' ? tasksRes.value.data : [];
      const users = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
      setStats({
        tasks: tasks.length,
        freelancers: Array.isArray(users) ? users.filter(u => u.role === 'freelancer').length : '—',
        completed: Array.isArray(tasks) ? tasks.filter(t => t.status === 'completed').length : '—',
      });
    } catch {}
  }

  async function loadRecentTasks() {
    setLoadingTasks(true);
    try {
      const { data } = await API.get('/tasks');
      setRecentTasks(data.filter(t => t.status === 'open').slice(0, 6));
    } catch {}
    setLoadingTasks(false);
  }

  async function loadServices() {
    try {
      const { data } = await API.get('/services');
      setServices(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function loadFreelancers() {
    try {
      const { data } = await API.get('/users');
      const fls = Array.isArray(data) ? data.filter(u => u.role === 'freelancer').slice(0, 8) : [];
      setFreelancers(fls);
    } catch {}
  }

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) navigate(`/tasks?q=${encodeURIComponent(search.trim())}`);
    else navigate('/tasks');
  }

  const filteredServices = svcCat ? services.filter(s => s.category === svcCat) : services;

  return (
    <div>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">
            <span className="live-dot" />
            Платформа работает · Регистрация открыта
          </div>
          <h1 className="hero-title">
            Фриланс без<br />
            <span className="gradient-text">лишних сложностей</span>
          </h1>
          <p className="hero-sub">
            Находи крутые проекты или идеальных исполнителей.<br />
            Общайся напрямую, плати за результат.
          </p>

          {/* Search */}
          <div className="hero-search-wrap">
            <form className="hero-search" onSubmit={handleSearch}>
              <span className="search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </span>
              <input
                type="text" placeholder="Найди задание: React, дизайн логотипа, SEO..."
                value={search} onChange={e => setSearch(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="search-btn">Найти</button>
            </form>
            <div className="search-tags">
              {['💻 Разработка', '🎨 Дизайн', '✍️ Копирайтинг', '📣 Маркетинг', '🎬 Видео'].map(tag => (
                <span key={tag} className="stag" onClick={() => navigate('/tasks')}>{tag}</span>
              ))}
            </div>
          </div>

          <div className="hero-cta">
            <Link to="/tasks" className="btn btn-primary btn-xl">Найти задание</Link>
            {user
              ? <Link to="/tasks" className="btn btn-glass btn-xl">Разместить заказ</Link>
              : <button className="btn btn-glass btn-xl" onClick={() => onAuthOpen('register')}>Разместить заказ</button>
            }
          </div>

          {/* Stats */}
          <div className="stats-bar">
            <div className="stat-item">
              <div className="stat-num">{stats.tasks}</div>
              <div className="stat-lbl">Заданий</div>
            </div>
            <div className="stat-sep" />
            <div className="stat-item">
              <div className="stat-num">{stats.freelancers}</div>
              <div className="stat-lbl">Фрилансеров</div>
            </div>
            <div className="stat-sep" />
            <div className="stat-item">
              <div className="stat-num">{stats.completed}</div>
              <div className="stat-lbl">Выполнено</div>
            </div>
            <div className="stat-sep" />
            <div className="stat-item">
              <div className="stat-num">4.9 ★</div>
              <div className="stat-lbl">Рейтинг</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── КАТЕГОРИИ ── */}
      <section className="section" id="categories">
        <div className="container">
          <div className="section-eyebrow">Категории</div>
          <div className="section-row">
            <h2 className="section-title">Что тебе нужно?</h2>
            <Link to="/tasks" className="link-arrow">Все задания →</Link>
          </div>
          <div className="cats-grid">
            {CATEGORIES.map(cat => (
              <div key={cat.id} className="cat-card" onClick={() => navigate('/tasks')}>
                <div className="cat-icon">{cat.icon}</div>
                <div className="cat-name">{cat.name}</div>
                <div className="cat-hint">{cat.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── СВЕЖИЕ ЗАДАНИЯ ── */}
      <section className="section">
        <div className="container">
          <div className="section-eyebrow">Актуально</div>
          <div className="section-row">
            <h2 className="section-title">Свежие задания</h2>
            <Link to="/tasks" className="link-arrow">Смотреть все →</Link>
          </div>
          {loadingTasks ? (
            <div className="tasks-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-task-card">
                  <div className="skeleton skeleton-line w-3-4 h-lg" style={{ marginBottom: '.8rem' }} />
                  <div className="skeleton skeleton-line w-full" style={{ marginBottom: '.4rem' }} />
                  <div className="skeleton skeleton-line w-3-4" />
                </div>
              ))}
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div><p>Заданий пока нет</p></div>
          ) : (
            <div className="tasks-grid">
              {recentTasks.map(task => <MiniTaskCard key={task._id} task={task} />)}
            </div>
          )}
        </div>
      </section>

      <div className="divider-line" />

      {/* ── УСЛУГИ ── */}
      {services.length > 0 && (
        <section className="section" id="services">
          <div className="container">
            <div className="section-eyebrow">Услуги</div>
            <div className="section-row">
              <h2 className="section-title">Готовые услуги</h2>
            </div>
            <div className="services-filters">
              {[{ id: '', label: 'Все' }, ...CATEGORIES].map(c => (
                <button key={c.id} className={`service-filter-btn${svcCat === c.id ? ' active' : ''}`} onClick={() => setSvcCat(c.id)}>
                  {c.icon ? `${c.icon} ${c.name}` : c.label}
                </button>
              ))}
            </div>
            <div className="services-grid">
              {filteredServices.slice(0, 8).map(s => <MiniServiceCard key={s._id} service={s} />)}
            </div>
          </div>
        </section>
      )}

      <div className="divider-line" />

      {/* ── КАК РАБОТАЕТ ── */}
      <section className="section" id="how">
        <div className="container">
          <div className="section-eyebrow" style={{ justifyContent: 'center' }}>Процесс</div>
          <h2 className="section-title text-center">Три шага до результата</h2>
          <p className="section-sub text-center">Мы сделали процесс максимально простым — от размещения до оплаты</p>
          <div className="how-tabs">
            <button className={`how-tab${howTab === 'client' ? ' active' : ''}`} onClick={() => setHowTab('client')}>Я заказчик</button>
            <button className={`how-tab${howTab === 'freelancer' ? ' active' : ''}`} onClick={() => setHowTab('freelancer')}>Я фрилансер</button>
          </div>
          <div className="how-steps">
            {(howTab === 'client' ? HOW_CLIENT : HOW_FREELANCER).map(step => (
              <div key={step.num} className="how-step">
                <div className="how-step-num">{step.num}</div>
                <div className="how-step-body">
                  <div className="how-step-title">{step.title}</div>
                  <div className="how-step-text">{step.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-line" />

      {/* ── ТОП ФРИЛАНСЕРОВ ── */}
      {freelancers.length > 0 && (
        <section className="section" id="freelancers">
          <div className="container">
            <div className="section-eyebrow">Специалисты</div>
            <div className="section-row">
              <h2 className="section-title">Топ фрилансеров</h2>
            </div>
            <div className="freelancers-grid">
              {freelancers.map(fl => <FreelancerCard key={fl._id} user={fl} />)}
            </div>
          </div>
        </section>
      )}

      <div className="divider-line" />

      {/* ── CTA ── */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-box">
            <div className="cta-glow" />
            <div className="cta-inner">
              <div className="hero-badge" style={{ marginBottom: '1.5rem' }}>
                <span className="live-dot" /> Присоединяйся прямо сейчас
              </div>
              <h2 className="cta-title">Готов начать зарабатывать?</h2>
              <p className="cta-sub">
                Регистрация бесплатна и занимает одну минуту.<br />
                Тысячи заданий уже ждут тебя.
              </p>
              <div className="cta-btns">
                {user
                  ? <Link to="/tasks" className="btn btn-primary btn-xl">Найти задание →</Link>
                  : <button className="btn btn-primary btn-xl" onClick={() => onAuthOpen('register')}>Создать аккаунт →</button>
                }
                <Link to="/tasks" className="btn btn-glass btn-xl">Смотреть задания</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="toast-container" id="toastContainer" />
    </div>
  );
}

function MiniTaskCard({ task }) {
  const navigate = useNavigate();
  const CAT_EMOJIS = { development: '💻', design: '🎨', writing: '✍️', marketing: '📣', video: '🎬', music: '🎵', other: '🔧' };
  const deadline = new Date(task.deadline).toLocaleDateString('ru-RU');
  return (
    <div className="task-card" onClick={() => navigate(`/tasks/${task._id}`)}>
      <div className="task-card-header">
        <h3>{task.title}</h3>
        <div className="task-budget">₽{task.budget?.toLocaleString()}</div>
      </div>
      <p className="task-desc">{task.description?.slice(0, 100)}{task.description?.length > 100 ? '...' : ''}</p>
      {task.skills?.length > 0 && (
        <div className="task-skills">
          {task.skills.slice(0, 3).map(s => <span key={s} className="skill-tag">{s}</span>)}
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
        <div className="task-info">
          <span>{CAT_EMOJIS[task.category] || '🔧'}</span>
          <span>⏰ {deadline}</span>
          <span>💬 {task.proposals?.length || 0}</span>
        </div>
      </div>
    </div>
  );
}

function MiniServiceCard({ service }) {
  const navigate = useNavigate();
  const CAT_EMOJIS = { development: '💻', design: '🎨', writing: '✍️', marketing: '📣', video: '🎬', music: '🎵', other: '🔧' };
  return (
    <div className="service-card" style={{ cursor: 'pointer' }} onClick={() => service.freelancer?._id && navigate(`/profile/${service.freelancer._id}`)}>
      <div className="service-img">
        {service.imageUrl
          ? <img src={service.imageUrl} alt={service.title} onError={e => e.target.parentElement.innerHTML = `<span style="font-size:2rem">${CAT_EMOJIS[service.category] || '🔧'}</span>`} />
          : <span style={{ fontSize: '2rem' }}>{CAT_EMOJIS[service.category] || '🔧'}</span>}
      </div>
      <div className="service-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
          <div className="avatar" style={{ width: 24, height: 24, fontSize: '.7rem', background: 'linear-gradient(135deg,var(--blue),var(--purple))', flexShrink: 0 }}>
            {service.freelancer?.avatar
              ? <img src={service.freelancer.avatar} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
              : (service.freelancer?.name || '?').charAt(0)}
          </div>
          <span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{service.freelancer?.name || 'Фрилансер'}</span>
        </div>
        <div className="service-title">{service.title}</div>
        <div className="service-footer">
          <div className="service-price">от ₽{service.price?.toLocaleString()}</div>
          <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>⏱ {service.deliveryDays} дн.</div>
        </div>
      </div>
    </div>
  );
}

function FreelancerCard({ user }) {
  const navigate = useNavigate();
  return (
    <div className="freelancer-card" onClick={() => navigate(`/profile/${user._id}`)} style={{ cursor: 'pointer' }}>
      <div className="avatar" style={{ width: 56, height: 56, fontSize: '1.3rem', margin: '0 auto .75rem', background: 'linear-gradient(135deg,var(--blue),var(--purple))' }}>
        {user.avatar
          ? <img src={user.avatar} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
          : user.name?.charAt(0)}
      </div>
      <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.2rem', textAlign: 'center' }}>{user.name}</div>
      <div style={{ fontSize: '.78rem', color: 'var(--text3)', textAlign: 'center', marginBottom: '.5rem' }}>
        {user.skills?.slice(0, 2).join(', ') || 'Фрилансер'}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '.78rem', color: 'var(--text3)' }}>
        <span>★ {(user.rating || 0).toFixed(1)}</span>
        <span>✅ {user.completedTasks || 0}</span>
      </div>
    </div>
  );
}
