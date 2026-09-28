import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import DistroIcon from './DistroIcon.jsx';

export default function DistroCard({ distro, onExplore }) {
  const [isHovered, setIsHovered] = useState(false);
  // Hover background loads lazily: only when the card is near the viewport
  // (or on first hover). The default same-bg.webp stays eager — one small
  // cached file shared by every card.
  const [hoverReady, setHoverReady] = useState(false);
  const rootRef = useRef(null);
  const coloredLayerRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || hoverReady) return;
    if (typeof IntersectionObserver === 'undefined') {
      setHoverReady(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setHoverReady(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hoverReady]);

  // Warm the browser cache as soon as the card is near, so the first
  // hover wipe has the image ready without blocking initial page load.
  useEffect(() => {
    if (hoverReady && distro.cardBg) {
      const img = new Image();
      img.src = distro.cardBg;
    }
  }, [hoverReady, distro.cardBg]);

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setIsHovered(true);
    if (!hoverReady) setHoverReady(true);

    if (coloredLayerRef.current) {
      coloredLayerRef.current.animate(
        [
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(600px at ${x}px ${y}px)` }
        ],
        {
          duration: 1500,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'forwards'
        }
      );
    }
  };

  const handleMouseLeave = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setIsHovered(false);

    if (coloredLayerRef.current) {
      coloredLayerRef.current.animate(
        [
          { clipPath: `circle(600px at ${x}px ${y}px)` },
          { clipPath: `circle(0px at ${x}px ${y}px)` }
        ],
        {
          duration: 750,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          fill: 'forwards'
        }
      );
    }
  };

  return (
    <motion.div
      ref={rootRef}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.025 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onExplore?.(distro)}
      style={{
        position: 'relative',
        cursor: 'pointer',
        borderRadius: '26px',
        overflow: 'hidden',
        boxShadow: 'none',
        border: 'none',
        outline: 'none',
      }}
      className="group aspect-[3/4] sm:aspect-[4/5] flex flex-col items-center justify-between p-6 select-none"
    >
      {/* Default same-bg.webp card background (neutral state, eager) */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/same-bg.webp)',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.98,
        }}
      />

      {/* Hover colored card background — wipe transition expanding from mouse contact point.
          Inner image renders only once the card is near the viewport (lazy). */}
      <div
        ref={coloredLayerRef}
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          clipPath: 'circle(0px at 50% 50%)',
        }}
      >
        {hoverReady &&
          (distro.cardBg ? (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${distro.cardBg})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'url(/same-bg.webp)',
                backgroundColor: distro.accent,
                backgroundBlendMode: 'color',
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          ))}
      </div>

      {/* Card Content (z-index above background) */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center gap-4 p-4">
        {/* Distro Logo */}
        <div className="relative flex items-center justify-center">
          <DistroIcon
            name={distro.name}
            accent="#FFFFFF"
            size={68}
            className={`transition-transform duration-300 drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)] ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
          />
        </div>

        {/* Distro Name */}
        <div className="text-center">
          <h3
            className="text-white font-mono font-extrabold tracking-wide text-xl sm:text-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
            style={{ letterSpacing: '0.03em' }}
          >
            {distro.name}
          </h3>
        </div>
      </div>
    </motion.div>
  );
}
