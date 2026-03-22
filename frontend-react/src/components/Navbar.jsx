import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

export default function Navbar({ onAuthOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Применяем тему
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Закрываем меню при смене страницы
  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    loadNotifCount();
    loadChatUnread();
    const t = setInterval(() => { loadNotifCount(); loadChatUnread(); }, 30000);
    return () => clearInterval(t);
  }, [user]);

  async function loadNotifCount() {
    try {
      const { data } = await API.get('/notifications/unread/count');
      setUnreadCount(data.count || 0);
    } catch {}
  }

  async function loadChatUnread() {
    try {
      const { data } = await API.get('/chat/unread/counts');
      if (data && typeof data === 'object') {
        const total = Object.values(data).reduce((a, b) => a + b, 0);
        setChatUnread(total);
      }
    } catch {}
  }

  async function openNotif() {
    setNotifOpen(v => !v);
    if (!notifOpen) {
      try {
        const { data } = await API.get('/notifications');
        setNotifs(data);
        await API.patch('/notifications/read/all');
        setUnreadCount(0);
      } catch {}
    }
  }

  async function clearNotifs() {
    try {
      await API.delete('/notifications/all');
      setNotifs([]);
      setUnreadCount(0);
    } catch {}
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="navbar">
        {/* Лого */}
        <Link to="/" className="logo">
          <div className="logo-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L17 6V14L10 18L3 14V6L10 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 2V18M3 6L17 14M17 6L3 14" stroke="white" strokeWidth="1" opacity="0.5"/>
            </svg>
          </div>
          <span className="logo-text">FreeLanceHub</span>
        </Link>

        {/* Центральные ссылки */}
        <ul className="nav-links">
          <li><Link to="/tasks"       className={`nav-link${isActive('/tasks')       ? ' active' : ''}`}>Задания</Link></li>
          <li><Link to="/services"    className={`nav-link${isActive('/services')    ? ' active' : ''}`}>Услуги</Link></li>
          <li><Link to="/freelancers" className={`nav-link${isActive('/freelancers') ? ' active' : ''}`}>Фрилансеры</Link></li>
          {user && <li><Link to="/dashboard" className={`nav-link${isActive('/dashboard') ? ' active' : ''}`}>Дашборд</Link></li>}
        </ul>

        {/* Правая часть */}
        <div className="nav-actions">
          {/* Переключатель темы */}
          <button className="theme-toggle" onClick={toggleTheme} title="Переключить тему">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {user ? (
            <>
              {/* Уведомления */}
              <div className="notif-wrapper">
                <button className="notif-btn" onClick={openNotif} title="Уведомления">
                  🔔
                  {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                {notifOpen && (
                  <div className="notif-dropdown open">
                    <div className="notif-dropdown-header">
                      <span>Уведомления</span>
                      <span className="notif-clear" onClick={clearNotifs}>Очистить</span>
                    </div>
                    <div className="notif-list">
                      {notifs.length === 0
                        ? <div className="notif-empty">🔔 Уведомлений нет</div>
                        : notifs.map(n => (
                          <div key={n._id} className={`notif-item${n.read ? '' : ' unread'}`}
                            onClick={() => { if (n.link) navigate(n.link); setNotifOpen(false); }}>
                            <div className="notif-icon">{n.icon}</div>
                            <div style={{ flex: 1 }}>
                              <div className="notif-text">{n.text}</div>
                              <div className="notif-time">{formatRelTime(n.createdAt)}</div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Чат */}
              <Link to="/chat" className="notif-btn" style={{ position: 'relative', textDecoration: 'none' }} title="Сообщения">
                💬
                {chatUnread > 0 && (
                  <span className="notif-badge">{chatUnread > 9 ? '9+' : chatUnread}</span>
                )}
              </Link>

              {/* Админ */}
              {user.role === 'admin' && (
                <Link to="/admin" className="notif-btn" title="Админка">⚙️</Link>
              )}

              {/* Аватар + имя */}
              <Link to="/dashboard" className="nav-user-btn">
                <span className="avatar" style={{ width: 28, height: 28, fontSize: '.8rem', background: 'linear-gradient(135deg,var(--blue),var(--purple))' }}>
                  {user.avatar
                    ? <img src={user.avatar} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                    : user.name.charAt(0)}
                </span>
                <span className="nav-username">{user.name.split(' ')[0]}</span>
              </Link>

              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Выйти</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => onAuthOpen('login')}>Войти</button>
              <button className="btn btn-primary btn-sm" onClick={() => onAuthOpen('register')}>Регистрация</button>
            </>
          )}
        </div>

        {/* Бургер */}
        <button className={`burger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(v => !v)} aria-label="Меню">
          <span/><span/><span/>
        </button>
      </nav>

      {/* Мобильное меню */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <div className="mobile-menu-inner">
          <Link to="/tasks"       onClick={() => setMenuOpen(false)}>Задания</Link>
          <Link to="/services"    onClick={() => setMenuOpen(false)}>Услуги</Link>
          <Link to="/freelancers" onClick={() => setMenuOpen(false)}>Фрилансеры</Link>
          {user && <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Дашборд</Link>}
          {user && <Link to="/chat"      onClick={() => setMenuOpen(false)}>
            Сообщения {chatUnread > 0 && `(${chatUnread})`}
          </Link>}
          {user?.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)}>Админка</Link>}

          {/* Тема в мобильном меню */}
          <button
            onClick={() => { toggleTheme(); }}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)',
              color: 'var(--text2)', fontSize: '1rem', padding: '.7rem 1.25rem',
              fontFamily: 'var(--font-body)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '.5rem', justifyContent: 'center'
            }}>
            {theme === 'dark' ? '☀️ Светлая тема' : '🌙 Тёмная тема'}
          </button>

          <div className="mobile-menu-btns">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-glass" onClick={() => setMenuOpen(false)}>
                  👤 {user.name.split(' ')[0]}
                </Link>
                <button className="btn btn-danger" onClick={() => { handleLogout(); setMenuOpen(false); }}>Выйти</button>
              </>
            ) : (
              <>
                <button className="btn btn-outline" onClick={() => { onAuthOpen('login'); setMenuOpen(false); }}>Войти</button>
                <button className="btn btn-primary" onClick={() => { onAuthOpen('register'); setMenuOpen(false); }}>Регистрация</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Клик вне уведомлений — закрыть */}
      {notifOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setNotifOpen(false)} />}
    </>
  );
}

function formatRelTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.floor(hours / 24)} д назад`;
}
