import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';

const HomePage       = lazy(() => import('./pages/HomePage'));
const TasksPage      = lazy(() => import('./pages/TasksPage'));
const TaskDetailPage = lazy(() => import('./pages/TaskDetailPage'));
const ChatPage       = lazy(() => import('./pages/ChatPage'));
const DashboardPage  = lazy(() => import('./pages/DashboardPage'));
const ProfilePage    = lazy(() => import('./pages/ProfilePage'));
const ServicesPage   = lazy(() => import('./pages/ServicesPage'));

// Защищённый роут — редиректит незалогиненных на главную
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
}

// Заглушка пока страница грузится
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', color: 'var(--text3)', fontSize: '.9rem'
    }}>
      Загрузка...
    </div>
  );
}

function AppInner() {
  const [authModal, setAuthModal] = useState(null);

  return (
    <BrowserRouter>
      <Navbar onAuthOpen={mode => setAuthModal(mode)} />
      {authModal && (
        <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />
      )}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"           element={<HomePage onAuthOpen={mode => setAuthModal(mode)} />} />
          <Route path="/tasks"      element={<TasksPage onAuthOpen={mode => setAuthModal(mode)} />} />
          <Route path="/tasks/:id"  element={<TaskDetailPage onAuthOpen={mode => setAuthModal(mode)} />} />
          <Route path="/services"   element={<ServicesPage onAuthOpen={mode => setAuthModal(mode)} />} />
          <Route path="/profile/:id" element={<ProfilePage />} />

          {/* Защищённые роуты */}
          <Route path="/chat" element={
            <PrivateRoute><ChatPage /></PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute><DashboardPage /></PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
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