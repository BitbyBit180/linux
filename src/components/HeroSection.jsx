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
    // Ubuntu 24.04 LTS default desktop — verified ✓
    preview: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Ubuntu_24.04_LTS_default_desktop_-_English.png',
  },
  {
    name: 'Debian',
    accent: '#D70751',
    tagline: 'The universal operating system',
    basedOn: 'Independent',
    init: 'systemd',
    pkgMgr: 'apt',
    angle: -45,
    // Debian 12 Bookworm GNOME — verified ✓
    preview: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Debian_12_Bookworm_GNOME_Desktop_English.png',
  },
  {
    name: 'Arch Linux',
    accent: '#1793D1',
    tagline: 'A lightweight and flexible rolling release',
    basedOn: 'Independent',
    init: 'systemd',
    pkgMgr: 'pacman',
    angle: 0,
    // Arch Linux with KDE — verified ✓
    preview: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Arch_Linux_with_KDE.png',
  },
  {
    name: 'Fedora',
    accent: '#3C6EB4',
    tagline: 'Leading-edge, innovative platform from Red Hat',
    basedOn: 'Red Hat',
    init: 'systemd',
    pkgMgr: 'dnf',
    angle: 45,
    // Fedora Workstation 40 GNOME — verified ✓
    preview: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Fedora_Workstation_40.png',
  },
  {
    name: 'openSUSE',
    accent: '#73BA25',
    tagline: "The makers' choice for sysadmins & devs",
    basedOn: 'Independent',
    init: 'systemd',
    pkgMgr: 'zypper',
    angle: 90,
    // KDE Plasma 6 on openSUSE dark mode — verified ✓
    preview: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/KDE_Plasma_6_screenshot_%28openSUSE_dark_mode%29.png',
  },
  {
    name: 'Manjaro',
    accent: '#35BF5C',
    tagline: 'Fast, user-friendly, desktop-oriented Arch',
    basedOn: 'Arch',
    init: 'systemd',
    pkgMgr: 'pacman',
    angle: 135,
    // Manjaro Linux 24.0 KDE Plasma 6 — verified ✓
    preview: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Manjaro_Linux_24.0_KDE_Plasma_Desktop_English.png',
  },
  {
    name: 'Linux Mint',
    accent: '#87CF3E',
    tagline: 'Classic desktop feel with modern elegance',
    basedOn: 'Ubuntu',
    init: 'systemd',
    pkgMgr: 'apt',
    angle: 180,
    // Linux Mint 21 Cinnamon — verified ✓
    preview: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Linux_Mint_21_Cinnamon_eng.png',
  },
  {
    name: 'Pop!_OS',
    accent: '#48B9C7',
    tagline: 'Designed for STEM and creative professionals',
    basedOn: 'Ubuntu',
    init: 'systemd',
    pkgMgr: 'apt',
    angle: 225,
    // Pop!_OS 22.04 LTS COSMIC — verified ✓
    preview: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Pop%21_OS_22.04_LTS_alternate_COSMIC_wallpaper_-_English.png',
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
  // Center the preview card directly on top of the hovered logo node.
  const cardX = activePos.x;
  const cardY = activePos.y;

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

      {/* Zone 1 — Light Glassmorphism Navbar */}
      <div style={{ height: '80px', flexShrink: 0 }} />
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
          padding: '6px 8px 6px 6px',
          /* Light milky glass — matches reference */
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(32px) saturate(180%) brightness(1.15)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%) brightness(1.15)',
          /* Subtle white border + top sheen */
          border: '1px solid rgba(255, 255, 255, 0.28)',
          boxShadow:
            '0 2px 24px rgba(0, 0, 0, 0.18), 0 1px 0 rgba(255,255,255,0.55) inset',
          whiteSpace: 'nowrap',
          gap: '2px',
        }}
      >
        {/* Brand pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1px',
            padding: '7px 16px 7px 12px',
            borderRadius: '9999px',
            marginRight: '2px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
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

        {/* Nav links */}
        {['Distros', 'Docs', 'Community', 'AI Chat'].map((item) => (
          <a
            key={item}
            href="#"
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
            }}
          >
            {item}
          </a>
        ))}

        {/* CTA — glass pill button */}
        <button
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
                {/* Node: crossfades between logo circle and preview screenshot */}
                <div
                  style={{
                    position: 'relative',
                    width: isHovered ? '220px' : '72px',
                    height: isHovered ? '138px' : '72px',
                    borderRadius: isHovered ? '12px' : '50%',
                    overflow: 'hidden',
                    border: `2px solid ${distro.accent}${isHovered ? 'cc' : '55'}`,
                    boxShadow: 'none',
                    transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1), height 0.3s cubic-bezier(0.16,1,0.3,1), border-radius 0.3s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                    background: THEME.bgCard,
                    flexShrink: 0,
                  }}
                >
                  {/* Logo — hidden when hovered */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isHovered ? 0 : 1,
                      transition: 'opacity 0.2s ease',
                      pointerEvents: 'none',
                    }}
                  >
                    <DistroIcon name={distro.name} accent={distro.accent} />
                  </div>

                  {/* Preview screenshot — shown when hovered */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: isHovered ? 1 : 0,
                      transition: 'opacity 0.25s ease',
                      pointerEvents: 'none',
                    }}
                  >
                    <img
                      src={distro.preview}
                      alt={`${distro.name} desktop`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.style.background =
                          `linear-gradient(135deg, ${distro.accent}33, ${distro.accent}0a)`;
                      }}
                    />
                  </div>
                </div>

                {/* Distro label — fades out when hovered */}
                <p
                  style={{
                    color: THEME.textMuted,
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    textAlign: 'center',
                    marginTop: '8px',
                    whiteSpace: 'nowrap',
                    opacity: isHovered ? 0 : 1,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {distro.name}
                </p>
              </motion.div>
            </div>
          );
        })}


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
