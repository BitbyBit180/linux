import React, { useState, useEffect } from 'react';
import HeroSection from './components/HeroSection.jsx';
import FlavoursPage from './components/FlavoursPage.jsx';
import DistroDetailPage from './components/DistroDetailPage.jsx';

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
  const isDistroDetail = currentRoute.startsWith('/distro/');
  const distroId = isDistroDetail ? currentRoute.replace('/distro/', '').split('/')[0] : null;

  return (
    <div className="min-h-screen bg-transparent text-[#F0F4F8]">
      {isDistroDetail ? (
        <DistroDetailPage distroId={distroId} onNavigate={navigate} />
      ) : isFlavours ? (
        <FlavoursPage onNavigate={navigate} />
      ) : (
        <HeroSection onNavigate={navigate} />
      )}
    </div>
  );
}
