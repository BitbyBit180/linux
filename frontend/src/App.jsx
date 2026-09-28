import React, { useState, useEffect, lazy, Suspense } from 'react';
import { PageSkeleton } from './components/Skeleton.jsx';

// Chunk-load failures (stale deploy with hashed filenames, flaky network)
// reject the lazy() import and — with no boundary — leave a blank page that
// only a refresh fixes. lazyWithRetry reloads once to grab fresh chunks;
// RouteErrorBoundary below catches anything left and offers a manual reload.
const CHUNK_RETRY_KEY = 'dp_chunk_retried';

function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      return await importer();
    } catch (err) {
      if (!sessionStorage.getItem(CHUNK_RETRY_KEY)) {
        sessionStorage.setItem(CHUNK_RETRY_KEY, '1');
        window.location.reload();
        return new Promise(() => {}); // never resolves; reload takes over
      }
      throw err;
    }
  });
}

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#161B22',
            padding: 24,
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '1rem',
                fontWeight: 800,
                color: '#F0F4F8',
                margin: '0 0 8px',
              }}
            >
              This page failed to load
            </p>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.76rem',
                color: '#8B949E',
                margin: '0 0 20px',
                lineHeight: 1.6,
              }}
            >
              Usually a stale update or a broken connection. Reloading fixes it.
            </p>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem(CHUNK_RETRY_KEY);
                window.location.reload();
              }}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#fff',
                background: 'linear-gradient(135deg, #E05A38 0%, #b83d25 100%)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 9999,
                padding: '10px 24px',
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Route-split: each page loads on demand so the initial bundle stays small.
// (Vite emits one chunk per page; see the build output.)
// lazyWithRetry: a failed chunk load reloads once instead of blank-screening.
const HomePage = lazyWithRetry(() => import('./pages/HomePage.jsx'));
const FlavoursPage = lazyWithRetry(() => import('./pages/FlavoursPage.jsx'));
const DistroDetailPage = lazyWithRetry(() => import('./pages/DistroDetailPage.jsx'));
const ComparePage = lazyWithRetry(() => import('./pages/ComparePage.jsx'));
const AuthPage = lazyWithRetry(() => import('./pages/AuthPage.jsx'));
const ChatPage = lazyWithRetry(() => import('./pages/ChatPage.jsx'));
const CommunityPage = lazyWithRetry(() => import('./pages/CommunityPage.jsx'));
const PostDetailPage = lazyWithRetry(() => import('./pages/PostDetailPage.jsx'));
const QuizPage = lazyWithRetry(() => import('./pages/QuizPage.jsx'));

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

  // A route that rendered fine clears the chunk-retry flag, so the next
  // real chunk failure gets its one automatic reload again.
  useEffect(() => {
    sessionStorage.removeItem(CHUNK_RETRY_KEY);
  }, [currentRoute]);

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
      {/* key remounts the boundary per route: a failed page shows the
          reload card, and navigating away gives the next page a clean try. */}
      <RouteErrorBoundary key={currentRoute}>
      <Suspense fallback={<PageSkeleton />}>
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
      </RouteErrorBoundary>
    </div>
  );
}
