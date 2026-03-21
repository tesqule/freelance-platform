import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

export default function AuthModal({ mode, onClose }) {
  const { login } = useAuth();
  const [tab, setTab] = useState(mode || 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('freelancer');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    if (!loginEmail || !loginPass) { setError('Заполните все поля'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await API.post('/auth/login', { email: loginEmail, password: loginPass });
      login(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!regName || !regEmail || !regPass) { setError('Заполните все поля'); return; }
    if (regPass.length < 6) { setError('Пароль минимум 6 символов'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await API.post('/auth/register', { name: regName, email: regEmail, password: regPass, role });
      login(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>{tab === 'login' ? 'Войти в аккаунт' : 'Создать аккаунт'}</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Табы */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 4 }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '8px', borderRadius: 'calc(var(--radius) - 2px)',
                background: tab === t ? 'var(--blue)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text2)',
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                fontSize: '.875rem', fontWeight: 600, transition: 'all .2s'
              }}>
              {t === 'login' ? 'Войти' : 'Регистрация'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171', borderRadius: 8, padding: '10px 14px', fontSize: '.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" placeholder="you@example.com"
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input className="form-control" type="password" placeholder="••••••••"
                value={loginPass} onChange={e => setLoginPass(e.target.value)} />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Входим...' : 'Войти 👋'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.875rem', color: 'var(--text3)' }}>
              Нет аккаунта?{' '}
              <span style={{ color: 'var(--blue)', cursor: 'pointer' }} onClick={() => { setTab('register'); setError(''); }}>
                Зарегистрироваться
              </span>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Имя</label>
              <input className="form-control" placeholder="Иван Иванов"
                value={regName} onChange={e => setRegName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" placeholder="you@example.com"
                value={regEmail} onChange={e => setRegEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input className="form-control" type="password" placeholder="Минимум 6 символов"
                value={regPass} onChange={e => setRegPass(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Я хочу...</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { value: 'freelancer', label: '💼 Выполнять заказы', sub: 'Фрилансер' },
                  { value: 'client', label: '📋 Размещать задания', sub: 'Заказчик' }
                ].map(r => (
                  <div key={r.value} onClick={() => setRole(r.value)}
                    style={{
                      padding: '12px', borderRadius: 10, cursor: 'pointer', transition: 'all .2s',
                      border: `2px solid ${role === r.value ? 'var(--blue)' : 'var(--border)'}`,
                      background: role === r.value ? 'rgba(79,110,247,.08)' : 'transparent',
                      textAlign: 'center'
                    }}>
                    <div style={{ fontSize: '1.25rem', marginBottom: 4 }}>{r.label.split(' ')[0]}</div>
                    <div style={{ fontSize: '.8rem', fontWeight: 600, color: role === r.value ? 'var(--blue)' : 'var(--text2)' }}>{r.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Создаём...' : 'Создать аккаунт 🎉'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.875rem', color: 'var(--text3)' }}>
              Уже есть аккаунт?{' '}
              <span style={{ color: 'var(--blue)', cursor: 'pointer' }} onClick={() => { setTab('login'); setError(''); }}>
                Войти
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}