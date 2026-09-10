import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  Download,
  Terminal,
  Cpu,
  Layers,
  HardDrive,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  Sparkles,
  Monitor
} from 'lucide-react';
import DistroIcon from './DistroIcon.jsx';
import { DISTROS } from '../data/distros.js';
import { THEME } from '../designTokens.js';

// Static Dots texture identical to hero and flavours pages
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
];

export default function DistroDetailPage({ distroId, onNavigate }) {
  const [copied, setCopied] = useState(false);

  // Scroll hooks: parallax and fade into normal background as user scrolls down
  const { scrollY } = useScroll();
  const bannerY = useTransform(scrollY, [0, 900], [0, 200]);
  const bannerOpacity = useTransform(scrollY, [150, 850], [1, 0]);
  const bannerScale = useTransform(scrollY, [0, 900], [1, 1.06]);

  // Find distro by ID or name
  const distro =
    DISTROS.find(
      (d) =>
        d.id.toLowerCase() === (distroId || '').toLowerCase() ||
        d.name.toLowerCase() === (distroId || '').toLowerCase()
    ) || DISTROS[0];

  const otherDistros = DISTROS.filter((d) => d.id !== distro.id).slice(0, 4);

  const copyInstallCmd = () => {
    if (distro.installCmd) {
      navigator.clipboard.writeText(distro.installCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#161B22',
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
      }}
      className="flex flex-col text-[#F0F4F8]"
    >
      {/* Exact Hero CSS Background with Grain Layers */}
      <div className="hero-bg fixed inset-0 z-0" aria-hidden="true">
        <div className="grain-fine" />
        <div className="grain-fiber" />
      </div>

      {/* Static Dot Texture */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
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

      {/* TOP BACKGROUND BANNER: Smoked dark preview banner that fades into the background on scroll */}
      {distro.preview && (
        <motion.div
          style={{
            y: bannerY,
            opacity: bannerOpacity,
            scale: bannerScale,
          }}
          className="absolute top-0 left-0 right-0 h-[105vh] min-h-[780px] overflow-hidden pointer-events-none z-0"
        >
          {/* Full Desktop Preview Screenshot — Dimmed for Smoked Aesthetic */}
          <img
            src={distro.preview}
            alt={`${distro.name} Desktop Preview Banner`}
            className="w-full h-full object-cover object-top sm:object-center brightness-[0.42] contrast-[1.12] saturate-[0.88]"
          />

          {/* Full Smoked Dark Veil Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(10, 13, 18, 0.52)',
            }}
          />

          {/* Smoky Radial Vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 35%, rgba(10, 13, 18, 0.25) 0%, rgba(15, 18, 24, 0.72) 65%, #161B22 100%)',
            }}
          />

          {/* Subtle Distro Accent Ambient Color Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 30% 20%, ${distro.accent}22 0%, transparent 60%)`,
              mixBlendMode: 'screen',
            }}
          />

          {/* Top Bar Shadow (protects navigation contrast) */}
          <div
            className="absolute top-0 left-0 right-0 h-32"
            style={{
              background: 'linear-gradient(to bottom, rgba(10, 13, 18, 0.9) 0%, rgba(15, 18, 24, 0.4) 60%, transparent 100%)',
            }}
          />

          {/* Bottom Gradient Fade: Seamlessly dissolves preview into normal dark hero background */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[450px]"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, rgba(15, 18, 24, 0.4) 25%, rgba(22, 27, 34, 0.85) 65%, #161B22 100%)',
            }}
          />
        </motion.div>
      )}

      {/* Ambient Accent Glow behind header */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none z-[1] w-[800px] h-[500px]"
        style={{
          background: `radial-gradient(ellipse at 50% 10%, ${distro.accent}20 0%, ${distro.accent}05 50%, transparent 75%)`,
          filter: 'blur(50px)',
        }}
      />

      {/* Top Floating Glassmorphism Navigation Bar */}
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
          padding: '6px 12px 6px 8px',
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(32px) saturate(180%) brightness(1.15)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%) brightness(1.15)',
          border: '1px solid rgba(255, 255, 255, 0.28)',
          boxShadow: '0 4px 28px rgba(0, 0, 0, 0.22), 0 1px 0 rgba(255,255,255,0.55) inset',
          whiteSpace: 'nowrap',
          gap: '8px',
        }}
        className="select-none"
      >
        {/* Brand Pill */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate?.('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
            cursor: 'pointer',
          }}
        >
          <span className="text-white font-mono font-extrabold text-sm tracking-wide">Distro</span>
          <span style={{ color: THEME.accent }} className="font-mono font-extrabold text-sm">Pedia</span>
        </div>

        {/* Back to Flavours Link */}
        <button
          onClick={() => onNavigate?.('/flavours')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs font-semibold text-white/80 hover:text-white hover:bg-white/15 transition-all"
        >
          <ArrowLeft size={14} />
          <span>All Flavours</span>
        </button>

        {/* Right Links */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/20">
          {['Community', 'AI Chat'].map((item) => (
            <a
              key={item}
              href="#"
              onClick={(e) => e.preventDefault()}
              className="px-3 py-1 rounded-full font-mono text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
      </nav>

      {/* Top Left Corner Breadcrumb Tag */}
      <div className="absolute top-20 sm:top-6 left-4 sm:left-8 z-30">
        <div className="inline-flex items-center gap-2 font-mono text-xs text-white/85 bg-black/55 px-3.5 py-1.5 rounded-full border border-white/20 backdrop-blur-xl shadow-xl">
          <button onClick={() => onNavigate?.('/')} className="hover:text-white transition-colors">
            Home
          </button>
          <span className="text-white/40">/</span>
          <button onClick={() => onNavigate?.('/flavours')} className="hover:text-white transition-colors">
            Flavours
          </button>
          <span className="text-white/40">/</span>
          <span style={{ color: distro.accent }} className="font-bold">
            {distro.name}
          </span>
        </div>
      </div>

      {/* Main Content — Specifications remain below the fold until scroll */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-24">
        {/* Distro Hero Header — Full Viewport First Screen */}
        <div className="w-full min-h-[calc(100vh-6.5rem)] flex flex-col items-center text-center justify-center gap-6 pb-12 mx-auto">
          {/* Logo — Centered in the middle of the page */}
          <div className="w-full flex justify-center items-center">
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center shrink-0 border border-white/20 transition-transform hover:scale-105 backdrop-blur-md"
              style={{
                background: 'rgba(15, 18, 24, 0.85)',
                boxShadow: 'none',
              }}
            >
              <DistroIcon name={distro.name} accent={distro.accent} size={64} />
            </div>
          </div>

          {/* Info */}
          <div className="w-full flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-mono font-extrabold text-white tracking-wide drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
                {distro.name}
              </h1>
              <span
                className="px-3.5 py-1 rounded-full text-xs font-mono font-semibold backdrop-blur-md"
                style={{
                  background: `${distro.accent}33`,
                  color: distro.accent,
                  border: `1px solid ${distro.accent}88`,
                  boxShadow: `0 2px 12px ${distro.accent}33`,
                }}
              >
                {distro.category}
              </span>
            </div>

            <p className="text-base sm:text-lg font-mono text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
              {distro.tagline}
            </p>
          </div>

          {/* Primary CTAs */}
          <div className="w-full flex items-center justify-center gap-4 flex-wrap pt-1">
            {distro.downloadUrl && (
              <a
                href={distro.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-mono text-xs font-bold text-white transition-transform hover:scale-105 backdrop-blur-sm shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${distro.accent} 0%, #b83d25 120%)`,
                  border: '1px solid rgba(255,255,255,0.35)',
                  boxShadow: `0 6px 28px ${distro.accent}66`,
                }}
              >
                <Download size={16} />
                <span>Download ISO</span>
              </a>
            )}

            {distro.website && (
              <a
                href={distro.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full font-mono text-xs font-semibold text-white/95 hover:text-white bg-black/45 hover:bg-black/65 border border-white/25 backdrop-blur-md transition-all shadow-xl"
              >
                <span>Official Website</span>
                <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>

        {/* Technical Specification Matrix */}
        <section className="mb-12">
          <h2 className="text-lg font-mono font-bold text-white/90 mb-4 flex items-center gap-2">
            <Sparkles size={16} style={{ color: distro.accent }} />
            <span>Technical Specifications</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 font-mono">
            {[
              { label: 'Based On', value: distro.basedOn || 'Independent', icon: Layers },
              { label: 'Package Mgr', value: distro.pkgMgr || 'Custom', icon: Terminal },
              { label: 'Init System', value: distro.init || 'systemd', icon: Cpu },
              { label: 'Desktop Env', value: distro.desktop || 'Configurable', icon: HardDrive },
              { label: 'Release Model', value: distro.releaseModel || 'Rolling', icon: Calendar },
              { label: 'Architecture', value: distro.architectures || 'x86_64', icon: Cpu },
            ].map((spec, i) => {
              const Icon = spec.icon;
              return (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-[#161B22]/80 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors shadow-lg"
                >
                  <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1.5">
                    <Icon size={13} />
                    <span>{spec.label}</span>
                  </div>
                  <div className="font-bold text-white text-sm truncate" title={spec.value}>
                    {spec.value}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Overview & Key Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* About Description */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10">
            <h2 className="text-xl font-mono font-bold text-white mb-4">
              About {distro.name}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-white/80 font-sans mb-6">
              {distro.description}
            </p>

            {/* Quick Terminal Command */}
            {distro.installCmd && (
              <div className="rounded-2xl p-4 bg-black/60 border border-white/10 font-mono text-xs">
                <div className="flex items-center justify-between text-white/50 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Terminal size={13} />
                    <span>Package Management Command</span>
                  </span>
                  <button
                    onClick={copyInstallCmd}
                    className="flex items-center gap-1 text-white/60 hover:text-white transition-colors"
                  >
                    {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <code className="text-[#38BDF8] block overflow-x-auto select-all">
                  $ {distro.installCmd}
                </code>
              </div>
            )}
          </div>

          {/* Key Highlights */}
          {distro.keyFeatures && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-mono font-bold text-white mb-4">
                  Key Highlights
                </h2>
                <ul className="space-y-3 font-sans text-xs sm:text-sm text-white/80">
                  {distro.keyFeatures.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={16}
                        className="shrink-0 mt-0.5"
                        style={{ color: distro.accent }}
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10 font-mono text-xs text-white/50">
                <span>Verified distribution profile</span>
              </div>
            </div>
          )}
        </div>

        {/* Explore Other Flavours */}
        <section className="pt-8 border-t border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-mono font-bold text-white">
              Explore Other Distributions
            </h2>
            <button
              onClick={() => onNavigate?.('/flavours')}
              className="font-mono text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowLeft size={13} className="rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            {otherDistros.map((od) => (
              <div
                key={od.id}
                onClick={() => onNavigate?.(`/distro/${od.id}`)}
                className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-all cursor-pointer group flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
                  style={{ background: 'rgba(20, 24, 32, 0.7)' }}
                >
                  <DistroIcon name={od.name} accent={od.accent} size={24} />
                </div>
                <div>
                  <div className="font-bold text-white group-hover:text-[#38BDF8] transition-colors">
                    {od.name}
                  </div>
                  <div className="text-white/50 text-[11px] truncate max-w-[120px]">
                    {od.basedOn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
