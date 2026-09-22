import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, Menu } from 'lucide-react';
import { THEME } from '../theme/designTokens.js';
import useMedia from '../hooks/useMedia.js';

const linkStyle = (hovered) => ({
  fontFamily: 'monospace',
  fontSize: '0.82rem',
  fontWeight: 500,
  color: hovered ? '#ffffff' : 'rgba(255,255,255,0.72)',
  textDecoration: 'none',
  padding: '7px 14px',
  borderRadius: '9999px',
  transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
  background: hovered ? 'rgba(255,255,255,0.2)' : 'transparent',
  boxShadow: hovered
    ? '0 1px 0 rgba(255,255,255,0.45) inset, 0 1px 6px rgba(0,0,0,0.12)'
    : 'none',
  letterSpacing: '0.02em',
});

export default function Navbar({
  currentRoute = '/',
  onNavigate,
  searchQuery = '',
  onSearchChange,
}) {
  const [hoveredNav, setHoveredNav] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Below this width the pill's links collapse into a hamburger dropdown
  // so the bar never overflows a 360px viewport.
  const isMobile = useMedia('(max-width: 899px)');
  const isFlavours = currentRoute === '/flavours' || currentRoute === '/flavors';

  const go = (path) => {
    setMenuOpen(false);
    onNavigate?.(path);
  };

  const flavourLinks = [
    { label: 'Compare', path: '/compare' },
    { label: 'Find Your Distro', path: '/quiz' },
    { label: 'Community', path: '/community' },
    { label: 'AI Chat', path: '/chat' },
  ];

  const heroLinks = [
    { label: 'Distros', path: '/flavours' },
    { label: 'Compare', path: '/compare' },
    { label: 'Find Your Distro', path: '/quiz' },
    { label: 'Community', path: '/community' },
    { label: 'AI Chat', path: '/chat' },
  ];

  const links = isFlavours ? flavourLinks : heroLinks;

  const menuBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: '9999px',
    background: menuOpen ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.22)',
    color: '#fff',
    cursor: 'pointer',
    flexShrink: 0,
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '9999px',
        padding: isFlavours && !isMobile ? '5px 8px 5px 6px' : '5px 6px 5px 5px',
        /* Light milky glass matching hero reference */
        background: 'rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(32px) saturate(180%) brightness(1.15)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%) brightness(1.15)',
        border: '1px solid rgba(255, 255, 255, 0.28)',
        boxShadow:
          '0 4px 28px rgba(0, 0, 0, 0.22), 0 1px 0 rgba(255,255,255,0.55) inset',
        whiteSpace: 'nowrap',
        gap: '4px',
        maxWidth: '96vw',
      }}
      className="select-none transition-all duration-300"
    >
      {/* Brand Pill (Always on the left, clickable to go home) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => go('/')}
        onKeyDown={(e) => e.key === 'Enter' && go('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1px',
          padding: '7px 14px 7px 12px',
          borderRadius: '9999px',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.22)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
          cursor: 'pointer',
          transition: 'background 0.2s ease, transform 0.15s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.24)';
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <span
          style={{
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '0.95rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textShadow: '0 1px 8px rgba(0,0,0,0.35)',
          }}
        >
          Distro
        </span>
        <span
          style={{
            color: THEME.accent,
            fontFamily: 'monospace',
            fontSize: '0.95rem',
            fontWeight: 800,
            textShadow: `0 1px 8px ${THEME.accent}88`,
          }}
        >
          Pedia
        </span>
      </div>

      {/* Flavours Mode: Middle Search Box (stays visible on mobile) */}
      {isFlavours && (
        <div
          className="relative flex items-center mx-1"
          style={{
            width: isMobile ? undefined : 'clamp(180px, 26vw, 320px)',
            flex: isMobile ? 1 : undefined,
            minWidth: 0,
            background: 'rgba(20, 24, 32, 0.45)',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255,255,255,0.1)',
            padding: '3px 10px 3px 12px',
            transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.45)';
            e.currentTarget.style.background = 'rgba(20, 24, 32, 0.7)';
            e.currentTarget.style.boxShadow = `0 0 12px ${THEME.accent}44, inset 0 1px 2px rgba(0,0,0,0.5)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
            e.currentTarget.style.background = 'rgba(20, 24, 32, 0.45)';
            e.currentTarget.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255,255,255,0.1)';
          }}
        >
          <Search
            size={15}
            className="text-white/60 mr-2 shrink-0 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search distros..."
            className="w-full bg-transparent border-none outline-none text-white text-xs font-mono placeholder:text-white/40 py-1"
            style={{
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              minWidth: 0,
            }}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Clear search"
            >
              <X size={13} />
            </button>
          ) : (
            <SlidersHorizontal
              size={13}
              className="text-white/40 ml-1 shrink-0 hidden sm:block pointer-events-none"
            />
          )}
        </div>
      )}

      {/* Desktop: inline links */}
      {!isMobile &&
        links.map((item) => (
          <a
            key={item.label}
            href={item.path}
            onClick={(e) => {
              e.preventDefault();
              go(item.path);
            }}
            onMouseEnter={() => setHoveredNav(item.label)}
            onMouseLeave={() => setHoveredNav(null)}
            style={linkStyle(hoveredNav === item.label)}
          >
            {item.label}
          </a>
        ))}

      {/* Desktop Hero Mode: Get Started CTA */}
      {!isMobile && !isFlavours && (
        <button
          onClick={() => go('/flavours')}
          style={{
            marginLeft: '4px',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#fff',
            background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '9999px',
            padding: '8px 20px',
            cursor: 'pointer',
            boxShadow: `0 2px 16px ${THEME.accent}55, 0 1px 0 rgba(255,255,255,0.35) inset`,
            transition: 'transform 0.16s ease, box-shadow 0.16s ease',
            letterSpacing: '0.03em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = `0 4px 22px ${THEME.accent}88, 0 1px 0 rgba(255,255,255,0.35) inset`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = `0 2px 16px ${THEME.accent}55, 0 1px 0 rgba(255,255,255,0.35) inset`;
          }}
        >
          Get Started
        </button>
      )}

      {/* Mobile: hamburger + dropdown */}
      {isMobile && (
        <button
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={menuBtnStyle}
        >
          {menuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      )}
      {isMobile && menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            minWidth: 220,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: 8,
            borderRadius: 18,
            background: 'rgba(22, 27, 34, 0.92)',
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            whiteSpace: 'normal',
          }}
        >
          {links.map((item) => (
            <a
              key={item.label}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                go(item.path);
              }}
              style={{
                ...linkStyle(hoveredNav === item.label),
                display: 'block',
                padding: '10px 14px',
              }}
              onMouseEnter={() => setHoveredNav(item.label)}
              onMouseLeave={() => setHoveredNav(null)}
            >
              {item.label}
            </a>
          ))}
          {!isFlavours && (
            <button
              onClick={() => go('/flavours')}
              style={{
                marginTop: 4,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#fff',
                background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '9999px',
                padding: '10px 20px',
                cursor: 'pointer',
                letterSpacing: '0.03em',
              }}
            >
              Get Started
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
