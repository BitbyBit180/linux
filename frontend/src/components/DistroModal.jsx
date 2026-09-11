import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Terminal, Cpu, Layers, HardDrive } from 'lucide-react';
import DistroIcon from './DistroIcon.jsx';

export default function DistroModal({ distro, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!distro) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl z-10 text-[#F0F4F8]"
          style={{
            background: 'linear-gradient(170deg, #1C2229 0%, #12161C 100%)',
            border: `1px solid ${distro.accent}66`,
            boxShadow: `0 24px 60px -15px rgba(0,0,0,0.8), 0 0 35px ${distro.accent}33, inset 0 1px 0 rgba(255,255,255,0.15)`,
          }}
        >
          {/* Top banner / screenshot preview */}
          <div className="relative w-full h-48 sm:h-56 bg-black/50 overflow-hidden border-b border-white/10">
            {distro.preview ? (
              <img
                src={distro.preview}
                alt={`${distro.name} Desktop`}
                className="w-full h-full object-cover object-center brightness-[0.85] contrast-[1.05]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black/40">
                <DistroIcon name={distro.name} accent={distro.accent} size={72} />
              </div>
            )}

            {/* Gradient fade to card content */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C2229] via-transparent to-black/30" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white border border-white/20 transition-all"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 relative">
            {/* Header info with Distro Logo */}
            <div className="flex items-start gap-4 -mt-14 mb-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-2xl"
                style={{
                  background: 'rgba(15, 18, 24, 0.92)',
                  boxShadow: `0 8px 24px ${distro.accent}44, inset 0 0 12px ${distro.accent}33`,
                }}
              >
                <DistroIcon name={distro.name} accent={distro.accent} size={44} />
              </div>

              <div className="pt-8 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white">
                    {distro.name}
                  </h2>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold"
                    style={{
                      background: `${distro.accent}22`,
                      color: distro.accent,
                      border: `1px solid ${distro.accent}55`,
                    }}
                  >
                    {distro.category || 'Linux'}
                  </span>
                </div>
                <p className="text-sm font-mono text-white/70 mt-1">
                  {distro.tagline}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed text-white/80 font-sans mb-6">
              {distro.description}
            </p>

            {/* System Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-mono text-xs">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-1.5 text-white/50 mb-1">
                  <Layers size={13} />
                  <span>Based On</span>
                </div>
                <div className="font-semibold text-white">{distro.basedOn || 'Independent'}</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-1.5 text-white/50 mb-1">
                  <Terminal size={13} />
                  <span>Package Mgr</span>
                </div>
                <div className="font-semibold text-white font-mono">{distro.pkgMgr || 'Custom'}</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-1.5 text-white/50 mb-1">
                  <Cpu size={13} />
                  <span>Init System</span>
                </div>
                <div className="font-semibold text-white">{distro.init || 'systemd'}</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-1.5 text-white/50 mb-1">
                  <HardDrive size={13} />
                  <span>Desktop</span>
                </div>
                <div className="font-semibold text-white truncate" title={distro.desktop}>
                  {distro.desktop || 'Configurable'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-mono font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                Close
              </button>

              {distro.website && (
                <a
                  href={distro.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-white transition-all duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${distro.accent} 0%, #1c2229 140%)`,
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: `0 4px 20px ${distro.accent}66`,
                  }}
                >
                  <span>Official Website</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
