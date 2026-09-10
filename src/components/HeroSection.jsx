import React, { useState, useEffect, useRef } from 'react';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Card, Chip, Button } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Tux3DCanvas from './Tux3DCanvas.jsx';
import DistroIcon from './DistroIcon.jsx';

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
    preview: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Ubuntu_24.04_LTS_Desktop.png/1280px-Ubuntu_24.04_LTS_Desktop.png',
  },
  {
    name: 'Debian',
    accent: '#D70751',
    tagline: 'The universal operating system',
    basedOn: 'Independent',
    init: 'systemd',
    pkgMgr: 'apt',
    angle: -45,
    preview: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Debian_12_%22Bookworm%22_-_GNOME_Desktop.png/1280px-Debian_12_%22Bookworm%22_-_GNOME_Desktop.png',
  },
  {
    name: 'Arch Linux',
    accent: '#1793D1',
    tagline: 'A lightweight and flexible rolling release',
    basedOn: 'Independent',
    init: 'systemd',
    pkgMgr: 'pacman',
    angle: 0,
    preview: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Arch_linux_2022_screenshot.png/1280px-Arch_linux_2022_screenshot.png',
  },
  {
    name: 'Fedora',
    accent: '#3C6EB4',
    tagline: 'Leading-edge, innovative platform from Red Hat',
    basedOn: 'Red Hat',
    init: 'systemd',
    pkgMgr: 'dnf',
    angle: 45,
    preview: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Fedora_40_Desktop.png/1280px-Fedora_40_Desktop.png',
  },
  {
    name: 'openSUSE',
    accent: '#73BA25',
    tagline: "The makers' choice for sysadmins & devs",
    basedOn: 'Independent',
    init: 'systemd',
    pkgMgr: 'zypper',
    angle: 90,
    preview: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/OpenSUSE_Leap_15.6_-_GNOME.png/1280px-OpenSUSE_Leap_15.6_-_GNOME.png',
  },
  {
    name: 'Manjaro',
    accent: '#35BF5C',
    tagline: 'Fast, user-friendly, desktop-oriented Arch',
    basedOn: 'Arch',
    init: 'systemd',
    pkgMgr: 'pacman',
    angle: 135,
    preview: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Manjaro-Linux-22.1.3-GNOME.png/1280px-Manjaro-Linux-22.1.3-GNOME.png',
  },
  {
    name: 'Linux Mint',
    accent: '#87CF3E',
    tagline: 'Classic desktop feel with modern elegance',
    basedOn: 'Ubuntu',
    init: 'systemd',
    pkgMgr: 'apt',
    angle: 180,
    preview: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Linux_Mint_21.3_Cinnamon.png/1280px-Linux_Mint_21.3_Cinnamon.png',
  },
  {
    name: 'Pop!_OS',
    accent: '#48B9C7',
    tagline: 'Designed for STEM and creative professionals',
    basedOn: 'Ubuntu',
    init: 'systemd',
    pkgMgr: 'apt',
    angle: 225,
    preview: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Pop_os-22.04-Desktop.png/1280px-Pop_os-22.04-Desktop.png',
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
  // Push preview card outward along the distro's own radial direction so it
  // never overlaps the orbital ring or adjacent nodes.
  const activeAngleRad = activeDistro ? (activeDistro.angle * Math.PI) / 180 : 0;
  const CARD_PUSH = 195; // px beyond the node position
  const cardX = activePos.x + Math.cos(activeAngleRad) * CARD_PUSH;
  const cardY = activePos.y + Math.sin(activeAngleRad) * CARD_PUSH;

  return (
    <div
      style={{
        backgroundColor: 'transparent',
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

      {/* Subtle vignette overlay on top of the texture */}
      <div
        className="inset-0 pointer-events-none absolute z-0"
        style={{
          background: 'radial-gradient(ellipse 85% 75% at 50% 50%, rgba(28, 34, 41, 0.15) 0%, rgba(16, 20, 26, 0.6) 100%)',
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

      {/* Zone 1 — Pill Frosted Glass Navbar (fixed so backdrop-filter works) */}
      <div style={{ height: '80px', flexShrink: 0 }} />{/* spacer so content isn't hidden under fixed bar */}
      <nav
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '9999px',
          padding: '7px 8px 7px 18px',
          /* frosted glass core */
          background: 'rgba(15, 18, 24, 0.45)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          /* borders & glow */
          border: '1px solid rgba(255, 255, 255, 0.13)',
          boxShadow:
            '0 8px 32px rgba(0,0,0,0.45), 0 1.5px 0 0 rgba(255,255,255,0.14) inset, 0 0 0 1px rgba(255,255,255,0.04) inset',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingRight: '18px',
            marginRight: '4px',
            borderRight: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span
            style={{
              color: THEME.textMain,
              fontFamily: 'monospace',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.03em',
            }}
          >
            Distro
          </span>
          <span
            style={{
              color: THEME.accent,
              fontFamily: 'monospace',
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            Pedia
          </span>
        </div>

        {/* Nav links */}
        {['Distros', 'Docs', 'Community', 'AI Chat'].map((item) => (
          <a
            key={item}
            href="#"
            onMouseEnter={() => setHoveredNav(item)}
            onMouseLeave={() => setHoveredNav(null)}
            style={{
              fontFamily: 'monospace',
              fontSize: '0.83rem',
              color: hoveredNav === item ? THEME.textMain : THEME.textMuted,
              textDecoration: 'none',
              padding: '7px 15px',
              borderRadius: '9999px',
              transition: 'background 0.18s ease, color 0.18s ease',
              background: hoveredNav === item
                ? 'rgba(255,255,255,0.09)'
                : 'transparent',
            }}
          >
            {item}
          </a>
        ))}

        {/* CTA */}
        <button
          style={{
            marginLeft: '8px',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#fff',
            background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
            border: 'none',
            borderRadius: '9999px',
            padding: '8px 20px',
            cursor: 'pointer',
            boxShadow: `0 2px 14px ${THEME.accent}66`,
            transition: 'transform 0.16s ease, box-shadow 0.16s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = `0 4px 20px ${THEME.accent}88`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = `0 2px 14px ${THEME.accent}66`;
          }}
        >
          Get Started
        </button>
      </nav>

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
          {DISTROS.map((distro, idx) => {
            const pos = getNodePosition(distro.angle, 320, 200);
            const isHovered = hoveredDistro === distro.name;
            const strokeColor = isHovered ? distro.accent : THEME.textMuted;
            const strokeWidth = isHovered ? 1.5 : 1;
            const opacity = isHovered ? 0.75 : 0.2;

            return (
              <React.Fragment key={distro.name}>
                <motion.line
                  x1={svgCenter.x}
                  y1={svgCenter.y}
                  initial={{
                    x2: svgCenter.x,
                    y2: svgCenter.y,
                    opacity: 0,
                  }}
                  animate={{
                    x2: svgCenter.x + pos.x,
                    y2: svgCenter.y + pos.y,
                    opacity: opacity,
                  }}
                  transition={{
                    duration: 1.15,
                    delay: 0.3 + idx * 0.07,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray="5 7"
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
        {DISTROS.map((distro, idx) => {
          const pos = getNodePosition(distro.angle, 320, 200);
          const isHovered = hoveredDistro === distro.name;

          return (
            <div
              key={distro.name}
              className="hidden md:block pointer-events-none"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: isHovered ? 10 : 2,
              }}
            >
              <motion.div
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0.15,
                  opacity: 0,
                }}
                animate={{
                  x: pos.x,
                  y: pos.y,
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 1.15,
                  delay: 0.3 + idx * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-col items-center pointer-events-auto"
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
              </motion.div>
            </div>
          );
        })}

        {/* Child D — Preview Card (z-index: 10) — Desktop */}
        <AnimatePresence>
          {activeDistro && (
            <motion.div
              key={`desktop-preview-${activeDistro.name}`}
              className="hidden md:block"
              initial={{ opacity: 0, scale: 0.88, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                left: `calc(50% + ${cardX}px)`,
                top: `calc(50% + ${cardY}px)`,
                transform: 'translate(-50%, -50%)',
                width: '300px',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              {/* Distro name label */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  paddingLeft: '2px',
                }}
              >
                <DistroIcon name={activeDistro.name} accent={activeDistro.accent} size={18} />
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: THEME.textMain,
                    letterSpacing: '0.03em',
                  }}
                >
                  {activeDistro.name}
                </span>
              </div>

              {/* Screenshot preview */}
              <div
                style={{
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: `2px solid ${activeDistro.accent}66`,
                  boxShadow: `0 8px 32px ${activeDistro.accent}33, 0 0 0 1px ${activeDistro.accent}22`,
                  aspectRatio: '16/10',
                  background: THEME.bgCard,
                }}
              >
                <img
                  src={activeDistro.preview}
                  alt={`${activeDistro.name} desktop preview`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onError={(e) => {
                    // Fallback: show a gradient placeholder if image fails
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement.style.background =
                      `linear-gradient(135deg, ${activeDistro.accent}22, ${activeDistro.accent}08)`;
                  }}
                />
              </div>
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
            {DISTROS.map((distro, idx) => {
              const isSelected = hoveredDistro === distro.name;
              return (
                <motion.div
                  key={distro.name}
                  initial={{ y: -25, opacity: 0, scale: 0.6 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.35 + idx * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex-shrink-0"
                >
                  <Chip
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
                </motion.div>
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
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2.5">
                    <DistroIcon name={activeDistro.name} accent={activeDistro.accent} size={24} />
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
                  </div>
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
