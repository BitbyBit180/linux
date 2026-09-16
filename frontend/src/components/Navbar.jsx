import React, { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { THEME } from '../theme/designTokens.js';

export default function Navbar({
  currentRoute = '/',
  onNavigate,
  searchQuery = '',
  onSearchChange,
}) {
  const [hoveredNav, setHoveredNav] = useState(null);
  const isFlavours = currentRoute === '/flavours' || currentRoute === '/flavors';

  return (
    <nav
      style={{
        position: 'fixed',
        top: '18px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '9999px',
        padding: isFlavours ? '5px 8px 5px 6px' : '6px 8px 6px 6px',
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
        onClick={() => onNavigate?.('/')}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate?.('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1px',
          padding: '7px 16px 7px 14px',
          borderRadius: '9999px',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.22)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
          cursor: 'pointer',
          transition: 'background 0.2s ease, transform 0.15s ease',
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

      {/* Flavours Mode: Middle Search Box */}
      {isFlavours ? (
        <>
          {/* Centered Search Box */}
          <div
            className="relative flex items-center mx-1"
            style={{
              width: 'clamp(180px, 26vw, 320px)',
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

          {/* Links to the right of the search box: Compare, Community & AI Chat */}
          {['Compare', 'Community', 'AI Chat'].map((item) => (
            <a
              key={item}
              href={item === 'Compare' ? '/compare' : item === 'Community' ? '/community' : item === 'AI Chat' ? '/chat' : '#'}
              onClick={(e) => {
                e.preventDefault();
                if (item === 'Compare') onNavigate?.('/compare');
                else if (item === 'Community') onNavigate?.('/community');
                else if (item === 'AI Chat') onNavigate?.('/chat');
              }}
              onMouseEnter={() => setHoveredNav(item)}
              onMouseLeave={() => setHoveredNav(null)}
              style={{
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                fontWeight: 500,
                color: hoveredNav === item ? '#ffffff' : 'rgba(255,255,255,0.72)',
                textDecoration: 'none',
                padding: '7px 14px',
                borderRadius: '9999px',
                transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
                background: hoveredNav === item
                  ? 'rgba(255,255,255,0.2)'
                  : 'transparent',
                boxShadow: hoveredNav === item
                  ? '0 1px 0 rgba(255,255,255,0.45) inset, 0 1px 6px rgba(0,0,0,0.12)'
                  : 'none',
                letterSpacing: '0.02em',
              }}
            >
              {item}
            </a>
          ))}
        </>
      ) : (
        /* Hero Mode: Distros, Compare, Docs, Community, AI Chat, and Get Started button */
        <>
          {['Distros', 'Compare', 'Docs', 'Community', 'AI Chat'].map((item) => {
            const isDistros = item === 'Distros';
            const isCompare = item === 'Compare';
            const isCommunity = item === 'Community';
            const isAIChat = item === 'AI Chat';
            return (
              <a
                key={item}
                href={isDistros ? '/flavours' : isCompare ? '/compare' : isCommunity ? '/community' : isAIChat ? '/chat' : '#'}
                onClick={(e) => {
                  e.preventDefault();
                  if (isDistros) {
                    onNavigate?.('/flavours');
                  } else if (isCompare) {
                    onNavigate?.('/compare');
                  } else if (isCommunity) {
                    onNavigate?.('/community');
                  } else if (isAIChat) {
                    onNavigate?.('/chat');
                  }
                }}
                onMouseEnter={() => setHoveredNav(item)}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  color: hoveredNav === item ? '#ffffff' : 'rgba(255,255,255,0.65)',
                  textDecoration: 'none',
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
                  background: hoveredNav === item
                    ? 'rgba(255,255,255,0.18)'
                    : 'transparent',
                  boxShadow: hoveredNav === item
                    ? '0 1px 0 rgba(255,255,255,0.45) inset, 0 1px 6px rgba(0,0,0,0.12)'
                    : 'none',
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                }}
              >
                {item}
              </a>
            );
          })}

          {/* CTA: Get Started button (Only in Hero mode) */}
          <button
            onClick={() => onNavigate?.('/flavours')}
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
        </>
      )}
    </nav>
  );
}
