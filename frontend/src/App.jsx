import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage.jsx';
import FlavoursPage from './pages/FlavoursPage.jsx';
import DistroDetailPage from './pages/DistroDetailPage.jsx';
import ComparePage from './pages/ComparePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ChatPage from './pages/ChatPage.jsx';

function normalizeRoute(pathname, hash) {
  const path = (pathname || '').toLowerCase();
  const h = (hash || '').toLowerCase();

  if (path === '/flavours' || path === '/flavors' || h === '#/flavours' || h === '#/flavors') {
    return '/flavours';
  }
  if (path.startsWith('/distro/')) {
    return pathname;
  }
  if (h.startsWith('#/distro/')) {
    return h.replace('#', '');
  }
  if (path === '/compare' || path.startsWith('/compare?') || h === '#/compare' || h.startsWith('#/compare?')) {
    return path === '/compare' || path.startsWith('/compare?') ? pathname + window.location.search : h.replace('#', '');
  }
  if (path === '/login' || h === '#/login') {
    return '/login';
  }
  if (path === '/chat' || h === '#/chat') {
    return '/chat';
  }
  return '/';
}

function getInitialRoute() {
  if (typeof window === 'undefined') return '/';
  return normalizeRoute(window.location.pathname, window.location.hash);
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(getInitialRoute);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(normalizeRoute(window.location.pathname, window.location.hash));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isFlavours = currentRoute === '/flavours' || currentRoute === '/flavors';
  const isCompare = currentRoute === '/compare' || currentRoute.startsWith('/compare?');
  const compareQuery = isCompare ? currentRoute.slice('/compare'.length) : '';
  const isDistroDetail = currentRoute.startsWith('/distro/');
  const distroId = isDistroDetail ? currentRoute.replace('/distro/', '').split('/')[0] : null;
  const isLogin = currentRoute === '/login';
  const isChat = currentRoute === '/chat';

  return (
    <div className="min-h-screen bg-transparent text-[#F0F4F8]">
      {isDistroDetail ? (
        <DistroDetailPage distroId={distroId} onNavigate={navigate} />
      ) : isFlavours ? (
        <FlavoursPage onNavigate={navigate} />
      ) : isCompare ? (
        <ComparePage query={compareQuery} onNavigate={navigate} />
      ) : isLogin ? (
        <AuthPage onAuthSuccess={() => navigate('/chat')} onNavigate={navigate} />
      ) : isChat ? (
        <ChatPage onNavigate={navigate} />
      ) : (
        <HomePage onNavigate={navigate} />
      )}
    </div>
  );
}
