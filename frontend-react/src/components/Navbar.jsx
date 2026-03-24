import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const IcoBell = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IcoMsg  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IcoSun  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const IcoMoon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const IcoSet  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IcoOut  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

export default function Navbar({ onAuthOpen }) {
  const { user, logout } = useAuth();
  const loc  = useLocation();
  const nav  = useNavigate();
  const [scrolled, setScrolled]   = useState(false);
  const [menu,     setMenu]       = useState(false);
  const [notifOpen,setNotifOpen]  = useState(false);
  const [notifs,   setNotifs]     = useState([]);
  const [unread,   setUnread]     = useState(0);
  const [chatU,    setChatU]      = useState(0);
  const [theme,    setTheme]      = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('theme', theme); }, [theme]);
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', fn); return () => window.removeEventListener('scroll', fn); }, []);
  useEffect(() => { setMenu(false); setNotifOpen(false); }, [loc.pathname]);
  useEffect(() => {
    if (!user) return;
    pUnread(); pChat();
    const t = setInterval(() => { pUnread(); pChat(); }, 30000);
    return () => clearInterval(t);
  }, [user]);

  async function pUnread() { try { const { data } = await API.get('/notifications/unread/count'); setUnread(data.count || 0); } catch {} }
  async function pChat()   { try { const { data } = await API.get('/chat/unread/counts'); if (data && typeof data === 'object') setChatU(Object.values(data).reduce((a,b) => a+b, 0)); } catch {} }

  async function openNotif() {
    setNotifOpen(v => !v);
    if (!notifOpen) { try { const { data } = await API.get('/notifications'); setNotifs(data); await API.patch('/notifications/read/all'); setUnread(0); } catch {} }
  }
  async function clearAll() { try { await API.delete('/notifications/all'); setNotifs([]); setUnread(0); } catch {} }

  const on = p => loc.pathname === p;

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <Link to="/" className="logo">
          <div className="logo-mark">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L17 6V14L10 18L3 14V6L10 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          </div>
          FreeLanceHub
        </Link>

        <ul className="nav-links">
          <li><Link to="/tasks"       className={`nav-link${on('/tasks')       ? ' active' : ''}`}>Задания</Link></li>
          <li><Link to="/services"    className={`nav-link${on('/services')    ? ' active' : ''}`}>Услуги</Link></li>
          <li><Link to="/freelancers" className={`nav-link${on('/freelancers') ? ' active' : ''}`}>Фрилансеры</Link></li>
          {user && <li><Link to="/dashboard" className={`nav-link${on('/dashboard') ? ' active' : ''}`}>Дашборд</Link></li>}
        </ul>

        <div className="nav-actions">
          <button className="icon-btn" onClick={() => setTheme(t => t==='dark'?'light':'dark')} title="Тема">
            {theme === 'dark' ? <IcoSun/> : <IcoMoon/>}
          </button>

          {user ? (
            <>
              <div className="notif-wrapper">
                <button className="icon-btn" onClick={openNotif} title="Уведомления">
                  <IcoBell/>
                  {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
                </button>
                {notifOpen && (
                  <div className="notif-dropdown open">
                    <div className="notif-dh">
                      <span>Уведомления</span>
                      <span className="notif-clear" onClick={clearAll}>Очистить</span>
                    </div>
                    <div className="notif-list">
                      {notifs.length === 0
                        ? <div className="notif-empty">Нет уведомлений</div>
                        : notifs.map(n => (
                          <div key={n._id} className={`notif-item${n.read ? '' : ' unread'}`}
                            onClick={() => { if (n.link) nav(n.link); setNotifOpen(false); }}>
                            <div className="notif-icon-wrap">·</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div className="notif-text">{n.text}</div>
                              <div className="notif-time">{relTime(n.createdAt)}</div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>

              <Link to="/chat" className="icon-btn" title="Сообщения">
                <IcoMsg/>
                {chatU > 0 && <span className="notif-badge">{chatU > 9 ? '9+' : chatU}</span>}
              </Link>

              {user.role === 'admin' && <Link to="/admin" className="icon-btn" title="Администрирование"><IcoSet/></Link>}

              <Link to="/dashboard" className="nav-user-pill">
                <div className="avatar" style={{ width:22, height:22, fontSize:'.65rem' }}>
                  {user.avatar ? <img src={user.avatar} style={{ width:22, height:22 }} alt=""/> : user.name.charAt(0).toUpperCase()}
                </div>
                <span className="nav-username">{user.name.split(' ')[0]}</span>
              </Link>

              <button className="icon-btn" onClick={() => { logout(); nav('/'); }} title="Выйти"><IcoOut/></button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => onAuthOpen('login')}>Войти</button>
              <button className="btn btn-primary btn-sm" onClick={() => onAuthOpen('register')}>Регистрация</button>
            </>
          )}
        </div>

        <button className={`burger${menu ? ' open' : ''}`} onClick={() => setMenu(v => !v)} aria-label="Меню">
          <span/><span/><span/>
        </button>
      </nav>

      <div className={`mobile-menu${menu ? ' open' : ''}`}>
        <div className="mobile-menu-inner">
          <Link to="/tasks"       onClick={() => setMenu(false)}>Задания</Link>
          <Link to="/services"    onClick={() => setMenu(false)}>Услуги</Link>
          <Link to="/freelancers" onClick={() => setMenu(false)}>Фрилансеры</Link>
          {user && <Link to="/dashboard" onClick={() => setMenu(false)}>Дашборд</Link>}
          {user && <Link to="/chat" onClick={() => setMenu(false)}>Сообщения{chatU > 0 ? ` (${chatU})` : ''}</Link>}
          {user?.role === 'admin' && <Link to="/admin" onClick={() => setMenu(false)}>Администрирование</Link>}
          <button onClick={() => setTheme(t => t==='dark'?'light':'dark')}
            style={{ background:'var(--s1)', border:'1px solid var(--b1)', borderRadius:'var(--r)', color:'var(--t3)', fontSize:'.82rem', padding:'.65rem', fontFamily:'var(--font)', cursor:'pointer', fontWeight:500, width:'100%' }}>
            {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </button>
          <div className="mobile-menu-btns">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-ghost" onClick={() => setMenu(false)}>{user.name.split(' ')[0]}</Link>
                <button className="btn btn-danger" onClick={() => { logout(); nav('/'); setMenu(false); }}>Выйти</button>
              </>
            ) : (
              <>
                <button className="btn btn-outline" onClick={() => { onAuthOpen('login'); setMenu(false); }}>Войти</button>
                <button className="btn btn-primary" onClick={() => { onAuthOpen('register'); setMenu(false); }}>Регистрация</button>
              </>
            )}
          </div>
        </div>
      </div>

      {notifOpen && <div style={{ position:'fixed', inset:0, zIndex:99 }} onClick={() => setNotifOpen(false)}/>}
    </>
  );
}

function relTime(iso) {
  const d = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (d < 1) return 'только что';
  if (d < 60) return `${d} мин назад`;
  const h = Math.floor(d / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} дн назад`;
}
