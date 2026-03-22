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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        <Link to="/" className="logo">
          <div className="logo-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L17 6V14L10 18L3 14V6L10 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 2V18M3 6L17 14M17 6L3 14" stroke="white" strokeWidth="1" opacity="0.5"/>
            </svg>
          </div>
          <span className="logo-text">FreeLanceHub</span>
        </Link>

        <ul className="nav-links">
          <li><Link to="/tasks" className={`nav-link${isActive('/tasks') ? ' active' : ''}`}>Задания</Link></li>
          <li><Link to="/services" className={`nav-link${isActive('/services') ? ' active' : ''}`}>Услуги</Link></li>
          <li><Link to="/freelancers" className={`nav-link${isActive('/freelancers') ? ' active' : ''}`}>Фрилансеры</Link></li>
          {user && <li><Link to="/dashboard" className={`nav-link${isActive('/dashboard') ? ' active' : ''}`}>Дашборд</Link></li>}
          {user && <li><Link to="/chat" className={`nav-link${isActive('/chat') ? ' active' : ''}`}>Сообщения</Link></li>}
        </ul>

        <div className="nav-actions">
          {user ? (
            <>
              {/* Уведомления */}
              <div className="notif-wrapper">
                <button className="notif-btn" onClick={openNotif}>
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
              <Link to="/chat" className="btn btn-ghost btn-sm" style={{ position: 'relative' }}>
                💬
                {chatUnread > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    background: 'var(--blue)', color: '#fff', borderRadius: 99,
                    fontSize: '.6rem', fontWeight: 700, minWidth: 16, height: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px'
                  }}>{chatUnread > 9 ? '9+' : chatUnread}</span>
                )}
              </Link>

              {user.role === 'admin' && (
                <Link to="/admin" className="btn btn-ghost btn-sm">⚙️</Link>
              )}

              <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="avatar" style={{ width: 28, height: 28, fontSize: '.8rem', background: 'linear-gradient(135deg,var(--blue),var(--purple))' }}>
                  {user.avatar
                    ? <img src={user.avatar} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                    : user.name.charAt(0)}
                </span>
                {user.name.split(' ')[0]}
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

        <button className={`burger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(v => !v)}>
          <span/><span/><span/>
        </button>
      </nav>

      {/* Мобильное меню */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <div className="mobile-menu-inner">
          <Link to="/tasks" onClick={() => setMenuOpen(false)}>Задания</Link>
          <Link to="/services" onClick={() => setMenuOpen(false)}>Услуги</Link>
          <Link to="/freelancers" onClick={() => setMenuOpen(false)}>Фрилансеры</Link>
          {user && <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Профиль</Link>}
          {user && <Link to="/chat" onClick={() => setMenuOpen(false)}>Сообщения</Link>}
          <div className="mobile-menu-btns">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-glass" onClick={() => setMenuOpen(false)}>
                  {user.name.split(' ')[0]}
                </Link>
                <button className="btn btn-danger" onClick={handleLogout}>Выйти</button>
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