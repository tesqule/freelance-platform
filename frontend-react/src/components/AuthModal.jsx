import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

export default function AuthModal({ mode, onClose }) {
  const { login } = useAuth();
  const [tab,  setTab]  = useState(mode || 'login');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [role,    setRole]    = useState('freelancer');
  const [lEmail, setLEmail] = useState('');
  const [lPass,  setLPass]  = useState('');
  const [rName,  setRName]  = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPass,  setRPass]  = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    if (!lEmail || !lPass) { setError('Заполните все поля'); return; }
    setLoading(true); setError('');
    try { const { data } = await API.post('/auth/login', { email:lEmail, password:lPass }); login(data.user, data.token); onClose(); }
    catch (err) { setError(err.response?.data?.message || 'Неверный email или пароль'); }
    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!rName || !rEmail || !rPass) { setError('Заполните все поля'); return; }
    if (rPass.length < 6) { setError('Пароль минимум 6 символов'); return; }
    setLoading(true); setError('');
    try { const { data } = await API.post('/auth/register', { name:rName, email:rEmail, password:rPass, role }); login(data.user, data.token); onClose(); }
    catch (err) { setError(err.response?.data?.message || 'Ошибка при регистрации'); }
    setLoading(false);
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '.97rem' }}>{tab === 'login' ? 'Вход' : 'Регистрация'}</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 5 5 15M5 5l10 10"/>
            </svg>
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display:'flex', gap:0, marginBottom:'1.35rem', borderBottom:'1px solid var(--b1)' }}>
          {[['login','Войти'],['register','Регистрация']].map(([t,l]) => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              style={{
                flex:1, padding:'.45rem .75rem',
                background:'none', border:'none', borderBottom:`2px solid ${tab===t ? 'var(--t1)' : 'transparent'}`,
                color: tab===t ? 'var(--t1)' : 'var(--t3)',
                cursor:'pointer', fontFamily:'var(--font)', fontSize:'.8rem',
                fontWeight: tab===t ? 600 : 400,
                transition:'all .12s', marginBottom:'-1px',
              }}>{l}</button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:'var(--red-dim)', border:'1px solid rgba(239,68,68,.2)', color:'#f87171', borderRadius:'var(--r)', padding:'9px 12px', fontSize:'.78rem', marginBottom:'.9rem', lineHeight:1.4 }}>
            {error}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" placeholder="you@example.com" value={lEmail} onChange={e => setLEmail(e.target.value)} autoFocus/>
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input className="form-control" type="password" placeholder="••••••••" value={lPass} onChange={e => setLPass(e.target.value)}/>
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ marginTop:'.3rem' }}>
              {loading ? 'Входим...' : 'Войти'}
            </button>
            <p style={{ textAlign:'center', marginTop:'.9rem', fontSize:'.77rem', color:'var(--t3)' }}>
              Нет аккаунта?{' '}
              <span style={{ color:'var(--t2)', cursor:'pointer', fontWeight:600, textDecoration:'underline' }}
                onClick={() => { setTab('register'); setError(''); }}>Зарегистрироваться</span>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Имя</label>
              <input className="form-control" placeholder="Иван Иванов" value={rName} onChange={e => setRName(e.target.value)} autoFocus/>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" placeholder="you@example.com" value={rEmail} onChange={e => setREmail(e.target.value)}/>
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input className="form-control" type="password" placeholder="Минимум 6 символов" value={rPass} onChange={e => setRPass(e.target.value)}/>
            </div>
            <div className="form-group">
              <label>Роль</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { v:'freelancer', title:'Фрилансер', sub:'Выполняю заказы' },
                  { v:'client',     title:'Заказчик',  sub:'Размещаю задания' },
                ].map(r => (
                  <div key={r.v} onClick={() => setRole(r.v)}
                    style={{
                      padding:'11px 12px', borderRadius:'var(--r)', cursor:'pointer',
                      border:`1px solid ${role===r.v ? 'var(--b4)' : 'var(--b1)'}`,
                      background: role===r.v ? 'var(--s2)' : 'transparent',
                      transition:'all .12s',
                    }}>
                    <div style={{ fontWeight:600, fontSize:'.8rem', color:'var(--t1)', marginBottom:'.18rem' }}>{r.title}</div>
                    <div style={{ fontSize:'.68rem', color:'var(--t3)' }}>{r.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Создаём...' : 'Создать аккаунт'}
            </button>
            <p style={{ textAlign:'center', marginTop:'.9rem', fontSize:'.77rem', color:'var(--t3)' }}>
              Уже есть аккаунт?{' '}
              <span style={{ color:'var(--t2)', cursor:'pointer', fontWeight:600, textDecoration:'underline' }}
                onClick={() => { setTab('login'); setError(''); }}>Войти</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
