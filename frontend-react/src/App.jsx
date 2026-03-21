import { useEffect, useState } from 'react';
import API from './api';

const categoryColors = {
  'Дизайн': '#f97316',
  'Разработка': '#6366f1',
  'Маркетинг': '#10b981',
  'Копирайтинг': '#ec4899',
  'default': '#64748b'
};

function TaskCard({ task, index }) {
  const cat = task.category || 'default';
  const color = categoryColors[cat] || categoryColors['default'];
  const delay = `${index * 80}ms`;

  return (
    <div className="task-card" style={{ '--accent': color, animationDelay: delay }}>
      <div className="card-glow" />
      <div className="card-top">
        <span className="category-badge" style={{ background: `${color}22`, color }}>
          {task.category || 'Задание'}
        </span>
        <span className="proposals-count">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {task.proposals?.length || 0}
        </span>
      </div>

      <h3 className="task-title">{task.title}</h3>
      <p className="task-desc">{task.description?.slice(0, 110)}{task.description?.length > 110 ? '…' : ''}</p>

      <div className="card-bottom">
        <div className="budget">
          <span className="budget-label">Бюджет</span>
          <span className="budget-value">₽{Number(task.budget || 0).toLocaleString('ru-RU')}</span>
        </div>
        <button className="respond-btn" style={{ '--accent': color }}>
          Откликнуться
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/tasks')
      .then(res => { setTasks(res.data); setLoading(false); })
      .catch(err => { setError('Не удалось загрузить задания'); setLoading(false); });
  }, []);

  const filtered = tasks.filter(t =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #080c14;
          color: #e2e8f0;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }

        .app {
          min-height: 100vh;
          background: #080c14;
          background-image:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 90% 80%, rgba(249,115,22,0.06) 0%, transparent 50%);
        }

        /* ─── HEADER ─── */
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 18px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(8,12,20,0.85);
          backdrop-filter: blur(20px);
        }

        .logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 22px;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #fff 40%, #6366f1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .logo span {
          background: linear-gradient(135deg, #f97316, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-nav {
          display: flex;
          gap: 8px;
        }

        .nav-btn {
          padding: 8px 18px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.7);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }

        .nav-btn.primary {
          background: #6366f1;
          border-color: #6366f1;
          color: #fff;
        }

        .nav-btn.primary:hover { background: #5254cc; }

        /* ─── HERO ─── */
        .hero {
          padding: 70px 40px 50px;
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 100px;
          border: 1px solid rgba(99,102,241,0.3);
          background: rgba(99,102,241,0.08);
          color: #a5b4fc;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 28px;
          animation: fadeUp 0.6s ease both;
        }

        .hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(36px, 5vw, 60px);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin-bottom: 18px;
          animation: fadeUp 0.6s 0.1s ease both;
        }

        .hero h1 em {
          font-style: normal;
          background: linear-gradient(135deg, #f97316 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero p {
          font-size: 17px;
          color: rgba(255,255,255,0.5);
          line-height: 1.7;
          max-width: 520px;
          margin: 0 auto 40px;
          animation: fadeUp 0.6s 0.2s ease both;
        }

        /* ─── SEARCH ─── */
        .search-wrap {
          max-width: 520px;
          margin: 0 auto;
          position: relative;
          animation: fadeUp 0.6s 0.3s ease both;
        }

        .search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.3);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 15px 20px 15px 48px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          outline: none;
          transition: all 0.2s;
        }

        .search-input::placeholder { color: rgba(255,255,255,0.3); }
        .search-input:focus {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.06);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        /* ─── STATS BAR ─── */
        .stats-bar {
          display: flex;
          gap: 30px;
          justify-content: center;
          padding: 0 40px 50px;
          max-width: 900px;
          margin: 0 auto;
          animation: fadeUp 0.6s 0.35s ease both;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.45);
          font-size: 14px;
        }

        .stat strong {
          color: rgba(255,255,255,0.85);
          font-size: 15px;
        }

        /* ─── GRID ─── */
        .content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px 80px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
        }

        .task-count {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.05);
          padding: 4px 12px;
          border-radius: 100px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 18px;
        }

        /* ─── TASK CARD ─── */
        .task-card {
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 24px;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
                      border-color 0.25s ease,
                      background 0.25s ease;
          animation: fadeUp 0.5s ease both;
        }

        .task-card:hover {
          transform: translateY(-4px);
          border-color: rgba(var(--accent-rgb, 99,102,241), 0.3);
          background: rgba(255,255,255,0.05);
        }

        .task-card:hover .card-glow {
          opacity: 1;
        }

        .card-glow {
          position: absolute;
          top: -60px;
          right: -60px;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: var(--accent, #6366f1);
          filter: blur(60px);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .category-badge {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 100px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .proposals-count {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
        }

        .task-title {
          font-family: 'Syne', sans-serif;
          font-size: 17px;
          font-weight: 700;
          line-height: 1.35;
          margin-bottom: 10px;
          color: rgba(255,255,255,0.92);
        }

        .task-desc {
          font-size: 14px;
          line-height: 1.65;
          color: rgba(255,255,255,0.42);
          margin-bottom: 22px;
        }

        .card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .budget-label {
          display: block;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 2px;
        }

        .budget-value {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #fff;
        }

        .respond-btn {
          padding: 10px 20px;
          border-radius: 12px;
          border: 1px solid var(--accent, #6366f1);
          background: transparent;
          color: var(--accent, #6366f1);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .respond-btn:hover {
          background: var(--accent, #6366f1);
          color: #fff;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        /* ─── STATES ─── */
        .state-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          color: rgba(255,255,255,0.35);
          gap: 16px;
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(99,102,241,0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 8px;
        }

        /* ─── ANIMATIONS ─── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .header { padding: 14px 20px; }
          .hero { padding: 50px 20px 36px; }
          .content { padding: 0 20px 60px; }
          .stats-bar { padding: 0 20px 36px; gap: 18px; flex-wrap: wrap; justify-content: center; }
          .header-nav { display: none; }
        }
      `}</style>

      <div className="app">
        {/* ─ HEADER ─ */}
        <header className="header">
          <div className="logo">Free<span>Lance</span></div>
          <nav className="header-nav">
            <button className="nav-btn">Войти</button>
            <button className="nav-btn primary">Регистрация</button>
          </nav>
        </header>

        {/* ─ HERO ─ */}
        <section className="hero">
          <div className="hero-eyebrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#a5b4fc"><circle cx="12" cy="12" r="4"/></svg>
            Биржа заданий · Онлайн
          </div>
          <h1>Найди <em>задание</em><br/>или исполнителя</h1>
          <p>Публикуй проекты, получай отклики от профессионалов и договаривайся напрямую — без лишних посредников.</p>

          <div className="search-wrap">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="search-input"
              placeholder="Поиск заданий..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </section>

        {/* ─ STATS ─ */}
        <div className="stats-bar">
          <div className="stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity=".6">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>Всего заданий: <strong>{tasks.length}</strong></span>
          </div>
          <div className="stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity=".6">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Обновлено сегодня</span>
          </div>
          <div className="stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity=".6">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Активных исполнителей: <strong>—</strong></span>
          </div>
        </div>

        {/* ─ CONTENT ─ */}
        <main className="content">
          <div className="section-header">
            <h2 className="section-title">Актуальные задания</h2>
            <span className="task-count">{filtered.length} найдено</span>
          </div>

          {loading && (
            <div className="state-center">
              <div className="spinner" />
              <span>Загрузка заданий…</span>
            </div>
          )}

          {error && (
            <div className="state-center">
              <div className="empty-icon">⚠️</div>
              <strong style={{ color: '#f87171' }}>{error}</strong>
              <span style={{ fontSize: 14 }}>Проверь, что backend запущен на localhost:8080</span>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="state-center">
              <div className="empty-icon">📭</div>
              <strong>Ничего не найдено</strong>
              <span>Попробуй изменить поисковый запрос</span>
            </div>
          )}

          {!loading && !error && (
            <div className="grid">
              {filtered.map((task, i) => (
                <TaskCard key={task._id} task={task} index={i} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}