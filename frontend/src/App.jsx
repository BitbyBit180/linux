import React, { useState, useEffect, lazy, Suspense } from 'react';
import { THEME, MONO } from './theme/designTokens.js';

// Route-split: each page loads on demand so the initial bundle stays small.
// (Vite emits one chunk per page; see the build output.)
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const FlavoursPage = lazy(() => import('./pages/FlavoursPage.jsx'));
const DistroDetailPage = lazy(() => import('./pages/DistroDetailPage.jsx'));
const ComparePage = lazy(() => import('./pages/ComparePage.jsx'));
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));
const ChatPage = lazy(() => import('./pages/ChatPage.jsx'));
const CommunityPage = lazy(() => import('./pages/CommunityPage.jsx'));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage.jsx'));
const QuizPage = lazy(() => import('./pages/QuizPage.jsx'));

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
  if (path === '/community' || h === '#/community' || path.startsWith('/community?') || h.startsWith('#/community?')) {
    return path.startsWith('/community') || path === '/community'
      ? pathname + window.location.search
      : h.replace('#', '');
  }
  if (path.startsWith('/community/')) {
    return pathname;
  }
  if (h.startsWith('#/community/')) {
    return h.replace('#', '');
  }
  if (path === '/login' || h === '#/login') {
    return '/login';
  }
  if (path === '/chat' || h === '#/chat') {
    return '/chat';
  }
  if (path === '/quiz' || h === '#/quiz') {
    return '/quiz';
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
  const isQuiz = currentRoute === '/quiz';
  const isCommunity = currentRoute === '/community' || currentRoute.startsWith('/community?');
  const communityQuery = isCommunity ? currentRoute.slice('/community'.length) : '';
  const isPostDetail = currentRoute.startsWith('/community/');
  const postId = isPostDetail ? currentRoute.replace('/community/', '').split('/')[0] : null;

  return (
    <div className="min-h-screen bg-transparent text-[#F0F4F8]">
      <Suspense
        fallback={
          <div
            className="flex items-center justify-center"
            style={{
              minHeight: '100vh',
              fontFamily: MONO,
              fontSize: '0.8rem',
              color: THEME.textMuted,
            }}
          >
            Loading…
          </div>
        }
      >
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
      ) : isQuiz ? (
        <QuizPage onNavigate={navigate} />
      ) : isCommunity ? (
        <CommunityPage query={communityQuery} onNavigate={navigate} />
      ) : isPostDetail ? (
        <PostDetailPage postId={postId} onNavigate={navigate} />
      ) : (
        <HomePage onNavigate={navigate} />
      )}
      </Suspense>
    </div>
  );
}
