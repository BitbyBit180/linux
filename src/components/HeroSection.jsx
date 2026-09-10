import React, { useState, useEffect, useRef } from 'react';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Card, Chip, Button } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Tux3DCanvas from './Tux3DCanvas.jsx';

// Global Tokens
const THEME = {
  bg: '#161B22',
  bgCard: '#1C2229',
  accent: '#E05A38',
  accentSoft: '#E8A27C',
  silver: '#A2A8B0',
  textMain: '#F0F4F8',
  textMuted: '#8B949E',
};

// Distro Data
const DISTROS = [
  {
    name: 'Ubuntu',
    accent: '#E95420',
    tagline: "The world's most popular desktop Linux",
    basedOn: 'Debian',
    init: 'systemd',
    pkgMgr: 'apt',
    angle: -90,
  },
  {
    name: 'Debian',
    accent: '#D70751',
    tagline: 'The universal operating system',
    basedOn: 'Independent',
    init: 'systemd',
    pkgMgr: 'apt',
    angle: -45,
  },
  {
    name: 'Arch Linux',
    accent: '#1793D1',
    tagline: 'A lightweight and flexible rolling release',
    basedOn: 'Independent',
    init: 'systemd',
    pkgMgr: 'pacman',
    angle: 0,
  },
  {
    name: 'Fedora',
    accent: '#3C6EB4',
    tagline: 'Leading-edge, innovative platform from Red Hat',
    basedOn: 'Red Hat',
    init: 'systemd',
    pkgMgr: 'dnf',
    angle: 45,
  },
  {
    name: 'openSUSE',
    accent: '#73BA25',
    tagline: "The makers' choice for sysadmins & devs",
    basedOn: 'Independent',
    init: 'systemd',
    pkgMgr: 'zypper',
    angle: 90,
  },
  {
    name: 'Manjaro',
    accent: '#35BF5C',
    tagline: 'Fast, user-friendly, desktop-oriented Arch',
    basedOn: 'Arch',
    init: 'systemd',
    pkgMgr: 'pacman',
    angle: 135,
  },
  {
    name: 'Linux Mint',
    accent: '#87CF3E',
    tagline: 'Classic desktop feel with modern elegance',
    basedOn: 'Ubuntu',
    init: 'systemd',
    pkgMgr: 'apt',
    angle: 180,
  },
  {
    name: 'Pop!_OS',
    accent: '#48B9C7',
    tagline: 'Designed for STEM and creative professionals',
    basedOn: 'Ubuntu',
    init: 'systemd',
    pkgMgr: 'apt',
    angle: 225,
  },
];

// Coordinate Helper
function getNodePosition(angleDeg, rx = 320, ry = 200) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.cos(rad) * rx,
    y: Math.sin(rad) * ry,
  };
}

// 70 Static Dots for background texture
const STATIC_DOTS = [
  { top: '4%', left: '8%' },
  { top: '6%', left: '24%' },
  { top: '5%', left: '42%' },
  { top: '8%', left: '61%' },
  { top: '3%', left: '78%' },
  { top: '7%', left: '92%' },
  { top: '12%', left: '14%' },
  { top: '15%', left: '33%' },
  { top: '11%', left: '55%' },
  { top: '14%', left: '72%' },
  { top: '17%', left: '86%' },
  { top: '21%', left: '5%' },
  { top: '23%', left: '19%' },
  { top: '19%', left: '48%' },
  { top: '22%', left: '67%' },
  { top: '26%', left: '82%' },
  { top: '28%', left: '95%' },
  { top: '31%', left: '12%' },
  { top: '34%', left: '29%' },
  { top: '30%', left: '58%' },
  { top: '33%', left: '75%' },
  { top: '37%', left: '89%' },
  { top: '41%', left: '7%' },
  { top: '39%', left: '22%' },
  { top: '44%', left: '38%' },
  { top: '42%', left: '64%' },
  { top: '45%', left: '80%' },
  { top: '49%', left: '15%' },
  { top: '47%', left: '31%' },
  { top: '52%', left: '49%' },
  { top: '50%', left: '71%' },
  { top: '53%', left: '93%' },
  { top: '57%', left: '9%' },
  { top: '55%', left: '25%' },
  { top: '59%', left: '43%' },
  { top: '58%', left: '62%' },
  { top: '61%', left: '79%' },
  { top: '64%', left: '18%' },
  { top: '66%', left: '35%' },
  { top: '63%', left: '54%' },
  { top: '67%', left: '73%' },
  { top: '65%', left: '88%' },
  { top: '70%', left: '6%' },
  { top: '72%', left: '28%' },
  { top: '69%', left: '47%' },
  { top: '73%', left: '66%' },
  { top: '75%', left: '84%' },
  { top: '78%', left: '13%' },
  { top: '81%', left: '22%' },
  { top: '77%', left: '40%' },
  { top: '80%', left: '59%' },
  { top: '82%', left: '77%' },
  { top: '79%', left: '94%' },
  { top: '85%', left: '10%' },
  { top: '88%', left: '27%' },
  { top: '84%', left: '51%' },
  { top: '87%', left: '70%' },
  { top: '89%', left: '85%' },
  { top: '92%', left: '4%' },
  { top: '94%', left: '19%' },
  { top: '91%', left: '36%' },
  { top: '95%', left: '56%' },
  { top: '93%', left: '75%' },
  { top: '96%', left: '91%' },
  { top: '16%', left: '97%' },
  { top: '48%', left: '3%' },
  { top: '54%', left: '85%' },
  { top: '76%', left: '96%' },
  { top: '38%', left: '96%' },
  { top: '62%', left: '2%' },
];

// Distro Vector Icons
function DistroIcon({ name, accent }) {
  switch (name) {
    case 'Ubuntu':
      return (
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
          <circle cx="19" cy="19" r="14" stroke={accent} strokeWidth="2.5" />
          <circle cx="19" cy="5.5" r="3.8" fill={accent} />
          <circle cx="30.7" cy="25.8" r="3.8" fill={accent} />
          <circle cx="7.3" cy="25.8" r="3.8" fill={accent} />
        </svg>
      );
    case 'Debian':
      return (
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
          <path
            d="M 19 28 C 12 28 8 22 8 16 C 8 9 14 6 21 6 C 28 6 32 11 32 18 C 32 24 27 27 22 27 C 17 27 15 23 16 19 C 17 16 20 16 20 18"
            stroke={accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case 'Arch Linux':
      return (
        <svg width="38" height="38" viewBox="0 0 38 38">
          <polygon points="19,4 34,34 19,28 4,34" fill={accent} />
        </svg>
      );
    case 'Fedora':
      return (
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
          <path
            d="M 11 19 H 23 M 16 29 V 17 C 16 13 19 10 23 10"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 23 10 C 28.5 10 32 14 32 19 C 32 24.5 28 28.5 22.5 28.5 C 17 28.5 13.5 24.5 13.5 19"
            stroke={accent}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'openSUSE':
      return (
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
          <ellipse
            cx="19"
            cy="19"
            rx="9.5"
            ry="6"
            fill={accent}
            transform="rotate(-15 19 19)"
          />
          <circle cx="10.5" cy="16" r="3.8" fill={accent} />
          <circle cx="9.5" cy="15" r="1.2" fill={THEME.bgCard} />
          <line x1="14" y1="13" x2="10" y2="8" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="23" y1="15" x2="27" y2="10" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="15" y1="25" x2="11" y2="30" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="24" y1="24" x2="28" y2="29" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 27 21 C 31 23 32 27 30 30" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'Manjaro':
      return (
        <svg width="38" height="38" viewBox="0 0 38 38">
          <rect x="7" y="6" width="6" height="26" rx="1.5" fill={accent} />
          <rect x="16" y="14" width="6" height="18" rx="1.5" fill={accent} />
          <rect x="25" y="8" width="6" height="24" rx="1.5" fill={accent} />
        </svg>
      );
    case 'Linux Mint':
      return (
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
          <path
            d="M 19 5 C 10 10 7 21 12 28 C 17 33 26 32 30 25 C 33 18 29 8 19 5 Z"
            fill={accent}
          />
          <path
            d="M 19 7 C 19 16 16 23 12 28"
            stroke={THEME.bgCard}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M 17 15 Q 22 13 25 17"
            stroke={THEME.bgCard}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'Pop!_OS':
      return (
        <svg width="38" height="38" viewBox="0 0 38 38">
          <circle cx="19" cy="19" r="14" stroke={accent} strokeWidth="2.5" fill="none" />
          <text
            x="19"
            y="25.5"
            textAnchor="middle"
            fill={accent}
            fontSize="20"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            !
          </text>
        </svg>
      );
    default:
      return null;
  }
}

export default function HeroSection() {
  const [hoveredDistro, setHoveredDistro] = useState(null);
  const [hoveredNav, setHoveredNav] = useState(null);
  const svgRef = useRef(null);
  const [svgCenter, setSvgCenter] = useState({ x: 0, y: 0 });

  // Compute actual pixel center for SVG line layer and active pulse dot
  useEffect(() => {
    const updateCenter = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setSvgCenter({
          x: rect.width / 2,
          y: rect.height / 2,
        });
      }
    };

    updateCenter();

    const resizeObserver = new ResizeObserver(() => {
      updateCenter();
    });

    if (svgRef.current) {
      resizeObserver.observe(svgRef.current);
    }

    window.addEventListener('resize', updateCenter);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateCenter);
    };
  }, []);

  const activeDistro = DISTROS.find((d) => d.name === hoveredDistro);
  const activePos = activeDistro ? getNodePosition(activeDistro.angle, 320, 200) : { x: 0, y: 0 };
  const cardX = activePos.x > 0 ? activePos.x + 110 : activePos.x - 110;
  const cardY = activePos.y;

  return (
    <div
      style={{
        background: THEME.bg,
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="flex flex-col select-none"
    >
      {/* Tux breath keyframes */}
      <style>{`
        @keyframes tuxBreath {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.035); }
        }
      `}</style>

      {/* Background Texture with 70 static dots */}
      <div
        className="inset-0 pointer-events-none absolute z-0"
        style={{
          background: `radial-gradient(ellipse 75% 65% at 50% 50%, ${THEME.bgCard} 0%, ${THEME.bg} 100%)`,
        }}
      >
        {STATIC_DOTS.map((dot, idx) => (
          <span
            key={idx}
            style={{
              width: '2px',
              height: '2px',
              borderRadius: '50%',
              background: THEME.textMuted,
              opacity: 0.15,
              position: 'absolute',
              top: dot.top,
              left: dot.left,
            }}
          />
        ))}
      </div>

      {/* Zone 1 — Navbar Strip */}
      <div className="flex-none">
        <Navbar
          isBlurred={false}
          className="bg-transparent border-none"
          style={{ zIndex: 10 }}
        >
          <NavbarBrand>
            <span style={{ color: THEME.textMain, fontFamily: 'monospace', fontSize: '1.2rem' }}>
              Distro
            </span>
            <span style={{ color: THEME.accent, fontFamily: 'monospace', fontSize: '1.2rem' }}>
              Pedia
            </span>
          </NavbarBrand>
          <NavbarContent justify="end">
            {['Distros', 'Docs', 'Community', 'AI Chat'].map((item) => (
              <NavbarItem key={item}>
                <a
                  href="#"
                  onMouseEnter={() => setHoveredNav(item)}
                  onMouseLeave={() => setHoveredNav(null)}
                  className="font-mono text-sm transition-colors duration-200"
                  style={{
                    color: hoveredNav === item ? THEME.textMain : THEME.textMuted,
                  }}
                >
                  {item}
                </a>
              </NavbarItem>
            ))}
          </NavbarContent>
        </Navbar>
      </div>

      {/* Zone 2 — Canvas Zone */}
      <div
        className="flex-1 relative"
        style={{ minHeight: '75vh', overflow: 'visible' }}
      >
        {/* Child A — SVG Line Layer (z-index: 1) */}
        <svg
          ref={svgRef}
          className="hidden md:block"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'visible',
            zIndex: 1,
          }}
        >
          {DISTROS.map((distro) => {
            const pos = getNodePosition(distro.angle, 320, 200);
            const isHovered = hoveredDistro === distro.name;
            const strokeColor = isHovered ? distro.accent : THEME.textMuted;
            const strokeWidth = isHovered ? 1.5 : 1;
            const opacity = isHovered ? 0.75 : 0.2;

            return (
              <React.Fragment key={distro.name}>
                <line
                  x1={svgCenter.x}
                  y1={svgCenter.y}
                  x2={svgCenter.x + pos.x}
                  y2={svgCenter.y + pos.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  strokeDasharray="5 7"
                  style={{ transition: 'all 0.25s ease' }}
                />
                {isHovered && (
                  <g transform={`translate(${svgCenter.x}, ${svgCenter.y})`}>
                    <circle r="3" fill={distro.accent}>
                      <animateMotion
                        dur="1.4s"
                        repeatCount="indefinite"
                        path={`M 0 0 L ${pos.x} ${pos.y}`}
                      />
                    </circle>
                  </g>
                )}
              </React.Fragment>
            );
          })}
        </svg>

        {/* Child B — Interactive 3D Tux Center (z-index: 3) — Desktop */}
        <div
          className="hidden md:flex items-center justify-center pointer-events-auto"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3,
          }}
        >
          <Tux3DCanvas
            activeDistro={hoveredDistro ? DISTROS.find((d) => d.name === hoveredDistro) : null}
            size={280}
          />
        </div>

        {/* Child C — Distro Nodes (z-index: 2) — Desktop */}
        {DISTROS.map((distro) => {
          const pos = getNodePosition(distro.angle, 320, 200);
          const isHovered = hoveredDistro === distro.name;

          return (
            <div
              key={distro.name}
              className="hidden md:flex flex-col items-center"
              style={{
                position: 'absolute',
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y}px)`,
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
              }}
              onMouseEnter={() => setHoveredDistro(distro.name)}
              onMouseLeave={() => setHoveredDistro(null)}
            >
              {/* 1. Node circle — HeroUI Card */}
              <Card
                isPressable={false}
                className="cursor-default"
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: THEME.bgCard,
                  border: `2px solid ${distro.accent}${isHovered ? 'ff' : '55'}`,
                  boxShadow: isHovered ? `0 0 20px ${distro.accent}44` : 'none',
                  transition: 'all 0.25s ease',
                  transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DistroIcon name={distro.name} accent={distro.accent} />
              </Card>

              {/* 2. Distro label */}
              <p
                style={{
                  color: THEME.textMuted,
                  fontFamily: 'monospace',
                  fontSize: '0.7rem',
                  textAlign: 'center',
                  marginTop: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                {distro.name}
              </p>
            </div>
          );
        })}

        {/* Child D — Preview Card (z-index: 10) — Desktop */}
        <AnimatePresence>
          {activeDistro && (
            <motion.div
              key={`desktop-preview-${activeDistro.name}`}
              className="hidden md:block"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                left: `calc(50% + ${cardX}px)`,
                top: `calc(50% + ${cardY}px)`,
                transform: 'translate(-50%, -50%)',
                width: '260px',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              <Card
                style={{
                  background: THEME.bgCard,
                  border: `1px solid ${activeDistro.accent}33`,
                  borderRadius: '12px',
                  padding: '18px',
                }}
              >
                <p
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: THEME.textMain,
                    marginBottom: '4px',
                  }}
                >
                  {activeDistro.name}
                </p>
                <p
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    color: THEME.textMuted,
                    marginBottom: '14px',
                  }}
                >
                  {activeDistro.tagline}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Chip
                    size="sm"
                    variant="flat"
                    style={{
                      background: THEME.bg,
                      fontFamily: 'monospace',
                      fontSize: '0.65rem',
                      color: THEME.textMain,
                    }}
                  >
                    Based on: {activeDistro.basedOn}
                  </Chip>
                  <Chip
                    size="sm"
                    variant="flat"
                    style={{
                      background: THEME.bg,
                      fontFamily: 'monospace',
                      fontSize: '0.65rem',
                      color: THEME.textMain,
                    }}
                  >
                    Init: {activeDistro.init}
                  </Chip>
                  <Chip
                    size="sm"
                    variant="flat"
                    style={{
                      background: THEME.bg,
                      fontFamily: 'monospace',
                      fontSize: '0.65rem',
                      color: THEME.textMain,
                    }}
                  >
                    pkg: {activeDistro.pkgMgr}
                  </Chip>
                </div>
                <hr style={{ borderColor: '#8B949E22', margin: '12px 0' }} />
                <p
                  style={{
                    textAlign: 'right',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: activeDistro.accent,
                  }}
                >
                  Explore →
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile View — Below md breakpoint */}
        <div className="md:hidden flex flex-col items-center justify-center w-full min-h-[55vh] py-8 z-10 relative">
          {/* Mobile Interactive 3D Tux centered above chips */}
          <div className="relative flex items-center justify-center mb-8 pointer-events-auto">
            <Tux3DCanvas
              activeDistro={hoveredDistro ? DISTROS.find((d) => d.name === hoveredDistro) : null}
              size={210}
              isMobile
            />
          </div>

          {/* Horizontally scrollable chip row */}
          <div className="flex gap-3 overflow-x-auto px-6 py-4 md:hidden w-full max-w-full justify-start sm:justify-center items-center">
            {DISTROS.map((distro) => {
              const isSelected = hoveredDistro === distro.name;
              return (
                <Chip
                  key={distro.name}
                  variant="bordered"
                  onClick={() => setHoveredDistro(distro.name)}
                  style={{
                    borderColor: distro.accent,
                    color: THEME.textMain,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    background: isSelected ? `${distro.accent}22` : 'transparent',
                  }}
                >
                  {distro.name}
                </Chip>
              );
            })}
          </div>
        </div>

        {/* Mobile Preview Card (Slide-up modal from bottom) */}
        <AnimatePresence>
          {activeDistro && (
            <motion.div
              key={`mobile-preview-sheet-${activeDistro.name}`}
              className="md:hidden"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                padding: '16px',
              }}
            >
              <Card
                style={{
                  background: THEME.bgCard,
                  border: `1px solid ${activeDistro.accent}44`,
                  borderRadius: '16px',
                  padding: '18px',
                  boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.7)',
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <p
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      color: THEME.textMain,
                    }}
                  >
                    {activeDistro.name}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setHoveredDistro(null);
                    }}
                    className="text-[#8B949E] hover:text-[#F0F4F8] p-1.5 -mr-1 -mt-1 rounded-full hover:bg-[#161B22] transition-colors"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: THEME.textMuted,
                    marginBottom: '14px',
                  }}
                >
                  {activeDistro.tagline}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Chip
                    size="sm"
                    variant="flat"
                    style={{
                      background: THEME.bg,
                      fontFamily: 'monospace',
                      fontSize: '0.65rem',
                      color: THEME.textMain,
                    }}
                  >
                    Based on: {activeDistro.basedOn}
                  </Chip>
                  <Chip
                    size="sm"
                    variant="flat"
                    style={{
                      background: THEME.bg,
                      fontFamily: 'monospace',
                      fontSize: '0.65rem',
                      color: THEME.textMain,
                    }}
                  >
                    Init: {activeDistro.init}
                  </Chip>
                  <Chip
                    size="sm"
                    variant="flat"
                    style={{
                      background: THEME.bg,
                      fontFamily: 'monospace',
                      fontSize: '0.65rem',
                      color: THEME.textMain,
                    }}
                  >
                    pkg: {activeDistro.pkgMgr}
                  </Chip>
                </div>
                <hr style={{ borderColor: '#8B949E22', margin: '12px 0' }} />
                <p
                  style={{
                    textAlign: 'right',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: activeDistro.accent,
                    fontWeight: 600,
                  }}
                >
                  Explore →
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Zone 3 — Bottom Strip */}
      <div className="flex-none flex flex-col items-center gap-6 pb-16 pt-4 relative z-10">
        <p
          style={{
            fontFamily: 'monospace',
            fontSize: '1.6rem',
            color: THEME.textMain,
            letterSpacing: '-0.4px',
            textAlign: 'center',
          }}
        >
          Every distro has a story. Find yours.
        </p>
        <Button
          size="lg"
          radius="full"
          style={{
            background: THEME.accent,
            color: THEME.textMain,
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            padding: '12px 32px',
          }}
          className="hover:bg-[#E8A27C] hover:shadow-[0_4px_20px_#E05A3855] transition-all font-semibold"
        >
          $ sudo find-your-distro
        </Button>
        <p className="text-[11px] text-white/30 font-mono text-center max-w-md px-4 mt-2">
          3D Tux model based on work by{' '}
          <a
            href="https://sketchfab.com/andycuccaro"
            target="_blank"
            rel="noreferrer"
            className="text-white/50 hover:text-[#E05A38] underline transition-colors"
          >
            Andy Cuccaro
          </a>{' '}
          (CC-BY-4.0). Interactive 3D via Three.js.
        </p>
      </div>
    </div>
  );
}
