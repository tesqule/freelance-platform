import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import TasksPage from './pages/TasksPage';
import TaskDetailPage from './pages/TaskDetailPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';

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
