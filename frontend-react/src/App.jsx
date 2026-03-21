import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import TasksPage from './pages/TasksPage';
import TaskDetailPage from './pages/TaskDetailPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';

function HomePage({ onAuthOpen }) {
  const { user } = useAuth();
  return (
    <div className="page">
      <div style={{
        minHeight: '80vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '2rem', gap: '1.5rem'
      }}>
        <div style={{ fontSize: '.85rem', color: 'var(--blue)', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase' }}>
          ✦ Платформа фриланса
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem,6vw,4.5rem)',
          fontWeight: 800, letterSpacing: '-.05em', lineHeight: 1.1, maxWidth: 700
        }}>
          Фриланс без<br /><span style={{ color: 'var(--blue)' }}>лишних</span> сложностей
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '1.05rem', maxWidth: 480, lineHeight: 1.75 }}>
          Находи крутые проекты или идеальных исполнителей. Общайся напрямую, плати за результат.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/tasks" className="btn btn-primary" style={{ padding: '.9rem 2rem', fontSize: '1rem' }}>
            Найти задание
          </a>
          {!user && (
            <button className="btn btn-glass" style={{ padding: '.9rem 2rem', fontSize: '1rem' }} onClick={() => onAuthOpen('register')}>
              Разместить заказ
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '2.5rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['🚀', 'Быстро', 'Отклик за минуты'], ['🔒', 'Безопасно', 'Проверенные пользователи'], ['💬', 'Напрямую', 'Без посредников']].map(([icon, title, sub]) => (
            <div key={title} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '.3rem' }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{title}</div>
              <div style={{ fontSize: '.8rem', color: 'var(--text3)' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppInner() {
  const [authModal, setAuthModal] = useState(null);

  return (
    <BrowserRouter>
      <Navbar onAuthOpen={mode => setAuthModal(mode)} />
      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />}

      <Routes>
        <Route path="/" element={<HomePage onAuthOpen={mode => setAuthModal(mode)} />} />
        <Route path="/tasks" element={<TasksPage onAuthOpen={mode => setAuthModal(mode)} />} />
        <Route path="/tasks/:id" element={<TaskDetailPage onAuthOpen={mode => setAuthModal(mode)} />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
