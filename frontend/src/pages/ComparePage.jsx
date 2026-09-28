import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Scale, Search } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import DistroIcon from '../components/DistroIcon.jsx';
import { CompareTableSkeleton } from '../components/Skeleton.jsx';
import { useDistros } from '../hooks/useDistros.js';
import { useCompare, MAX_COMPARE } from '../hooks/useCompare.js';
import { THEME, LINE, MONO } from '../theme/designTokens.js';

// Hostname for outbound link cells (e.g. "https://ubuntu.com" -> "ubuntu.com ↗")
const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const ExternalLinkCell = ({ url }) =>
  url ? (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-white/30 underline-offset-2 hover:decoration-white/80 transition-colors"
      style={{ color: THEME.accent }}
    >
      {hostOf(url)} ↗
    </a>
  ) : (
    '—'
  );

// Row definitions for the comparison table. Values come straight from the
// DB payload (`distros` collection) — rows either map a field or render it.
const COMPARE_ROWS = (onNavigate) => [
  {
    label: 'Desktop preview',
    render: (d) =>
      d.preview ? (
        <button
          type="button"
          onClick={() => onNavigate?.(`/distro/${d.id}`)}
          className="block w-full rounded-lg overflow-hidden border border-white/15 hover:border-white/40 transition-colors"
          title={`Open ${d.name} preview`}
        >
          <img
            src={d.preview}
            alt={`${d.name} desktop preview`}
            loading="lazy"
            className="w-full aspect-[16/10] object-cover object-top"
          />
        </button>
      ) : (
        '—'
      ),
  },
  { label: 'Latest version', field: 'latestVersion' },
  { label: 'Min RAM', field: 'minRam' },
  { label: 'Min disk', field: 'minDisk' },
  { label: 'Release model', field: 'releaseModel' },
  { label: 'License', field: 'license' },
  { label: 'Based on', field: 'basedOn' },
  { label: 'Init system', field: 'init' },
  { label: 'Package manager', field: 'pkgMgr' },
  { label: 'Desktop', field: 'desktop' },
  { label: 'Architectures', field: 'architectures' },
  { label: 'Category', field: 'category' },
  { label: 'Install command', field: 'installCmd' },
  { label: 'Website', render: (d) => <ExternalLinkCell url={d.website} /> },
  { label: 'Download', render: (d) => <ExternalLinkCell url={d.downloadUrl} /> },
];

function parseIdsFromQuery(query) {
  const params = new URLSearchParams(query || '');
  const raw = (params.get('ids') || '').split(',');
  const ids = raw.map((id) => id.trim().toLowerCase()).filter(Boolean);
  return [...new Set(ids)].slice(0, MAX_COMPARE);
}

export default function ComparePage({ query, onNavigate }) {
  const [selectedIds, setSelectedIds] = useState(() => parseIdsFromQuery(query));
  const [pickerQuery, setPickerQuery] = useState('');

  // Catalogue for the picker (API-first, static fallback)
  const { distros: catalogue } = useDistros();
  // Comparison data from the `distros` collection
  const { distros, loading } = useCompare(selectedIds);

  // Re-sync when arriving from another page with fresh ?ids=…
  useEffect(() => {
    const next = parseIdsFromQuery(query);
    setSelectedIds((prev) => {
      const prevKey = prev.join(',');
      return prevKey === next.join(',') ? prev : next;
    });
  }, [query]);

  // Keep the URL shareable without polluting browser history
  useEffect(() => {
    const url = selectedIds.length ? `/compare?ids=${selectedIds.join(',')}` : '/compare';
    window.history.replaceState({}, '', url);
  }, [selectedIds]);

  const toggleId = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };

  const pickerResults = useMemo(() => {
    const q = pickerQuery.toLowerCase().trim();
    if (!q) return catalogue;
    return catalogue.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.tagline.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );
  }, [pickerQuery, catalogue]);

  const isFull = selectedIds.length >= MAX_COMPARE;
  const hasSelection = distros.length > 0;

  return (
    <div
      style={{
        backgroundColor: THEME.bg,
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
      }}
      className="flex flex-col text-[#F0F4F8]"
    >
      {/* Shared hero background texture */}
      <div className="hero-bg fixed inset-0 z-0" aria-hidden="true">
        <div className="grain-fine" />
        <div className="grain-fiber" />
      </div>

      <Navbar currentRoute="/compare" onNavigate={onNavigate} />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold tracking-wider text-white flex items-center justify-center gap-3">
            <Scale size={28} style={{ color: THEME.accent }} />
            Compare distros
          </h1>
        </div>

        {/* Picker panel */}
        <div
          className="mb-10 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-5 sm:p-6"
          style={{ borderColor: LINE }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40"
              style={{ fontFamily: MONO }}
            >
              Select distros
            </span>
            <span
              className="font-mono text-[10px] tracking-[0.14em]"
              style={{
                fontFamily: MONO,
                color: isFull ? THEME.accent : 'rgba(240,244,248,0.55)',
              }}
            >
              {selectedIds.length} / {MAX_COMPARE} selected
              {isFull ? ' — remove one to add another' : ''}
            </span>
          </div>

          {/* Selected chips */}
          <div className="flex flex-wrap items-center gap-2 mb-4 min-h-[34px]">
            {selectedIds.length === 0 && (
              <span className="font-mono text-xs text-white/35">
                Nothing selected yet — search below and add distros
              </span>
            )}
            {selectedIds.map((id) => {
              const cat = catalogue.find((d) => d.id === id);
              return (
                <motion.button
                  layout
                  key={id}
                  type="button"
                  onClick={() => toggleId(id)}
                  className="group flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-full font-mono text-xs text-white transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: `1px solid ${cat?.accent ?? THEME.accent}66`,
                  }}
                  title="Remove from comparison"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: cat?.accent ?? THEME.accent }}
                  />
                  {cat?.name ?? id}
                  <X size={13} className="text-white/50 group-hover:text-white" />
                </motion.button>
              );
            })}
          </div>

          {/* Picker search + results */}
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2 mb-3"
            style={{
              background: 'rgba(20,24,32,0.45)',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
          >
            <Search size={15} className="text-white/50 shrink-0" />
            <input
              type="text"
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              placeholder="Search distros to compare..."
              className="w-full bg-transparent border-none outline-none text-white/90 text-xs placeholder:text-white/35"
              style={{ fontFamily: MONO }}
            />
          </div>
          <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto scrollbar-none">
            {pickerResults.map((d) => {
              const selected = selectedIds.includes(d.id);
              const disabled = !selected && isFull;
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleId(d.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs transition-all duration-150"
                  style={{
                    background: selected ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)',
                    color: disabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)',
                    border: `1px solid ${selected ? `${d.accent}88` : 'rgba(255,255,255,0.1)'}`,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {!selected && !disabled && <Plus size={12} className="text-white/50" />}
                  {d.name}
                </button>
              );
            })}
            {pickerResults.length === 0 && (
              <span className="font-mono text-xs text-white/35 py-2">
                No distros matched &ldquo;{pickerQuery}&rdquo;
              </span>
            )}
          </div>
        </div>

        {/* Comparison table */}
        {loading ? (
          <CompareTableSkeleton cols={Math.max(selectedIds.length, 1)} />
        ) : !hasSelection ? (
          <div className="text-center py-16 bg-white/[0.02] rounded-3xl border border-white/10 backdrop-blur-sm">
            <Scale size={36} className="mx-auto mb-4 text-white/25" />
            <p className="text-white/60 font-mono text-sm mb-1">
              Select at least one distro to start comparing
            </p>
            <p className="text-white/35 font-mono text-xs">
              Try Ubuntu vs Arch vs Alpine — or pick from the list above
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: '640px' }}>
              <thead>
                <tr>
                  <th
                    className="sticky left-0 z-[1] text-left px-4 py-3"
                    style={{ background: THEME.bg, minWidth: '140px' }}
                  >
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40"
                      style={{ fontFamily: MONO }}
                    >
                      Spec
                    </span>
                  </th>
                  {distros.map((d) => (
                    <th
                      key={d.id}
                      className="relative px-3 py-4 text-center align-middle"
                      style={{ borderTop: `3px solid ${d.accent}`, minWidth: '170px' }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleId(d.id)}
                        className="absolute top-2 right-2 text-white/40 hover:text-white transition-colors"
                        title={`Remove ${d.name}`}
                        aria-label={`Remove ${d.name}`}
                      >
                        <X size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate?.(`/distro/${d.id}`)}
                        className="mx-auto flex flex-col items-center gap-2 transition-transform duration-200 hover:scale-105"
                        title={`Open ${d.name} details`}
                        aria-label={`Open ${d.name} details`}
                      >
                        <DistroIcon name={d.name} accent="#FFFFFF" size={76} />
                        <span
                          className="font-mono font-bold text-sm text-white tracking-wide"
                          style={{ fontFamily: MONO }}
                        >
                          {d.name}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS(onNavigate).map((row, idx) => (
                  <tr
                    key={row.label}
                    style={{ borderTop: `1px solid ${idx === 0 ? LINE : 'rgba(255,255,255,0.05)'}` }}
                  >
                    <td
                      className="sticky left-0 z-[1] px-4 py-3 align-top"
                      style={{ background: THEME.bg }}
                    >
                      <span
                        className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45"
                        style={{ fontFamily: MONO }}
                      >
                        {row.label}
                      </span>
                    </td>
                    {distros.map((d) => (
                      <td
                        key={`${d.id}-${row.label}`}
                        className={`px-4 py-3 align-top text-xs sm:text-[13px] text-white/85 ${row.field === 'installCmd' ? 'break-words' : ''}`}
                        style={{ fontFamily: MONO }}
                      >
                        {row.render ? row.render(d) : d[row.field] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
