import React from 'react';
import { THEME, LINE, MONO } from '../theme/designTokens.js';

/**
 * Shared skeleton placeholders — shimmer blocks shown while async data loads.
 * All variants use the same neutral shimmer (see `.dp-skeleton` in index.css)
 * and theme tokens; no hardcoded hexes. Decorative only (`aria-hidden`).
 */

export function Skeleton({ width = '100%', height = 12, radius = 8, style }) {
  return (
    <div
      aria-hidden="true"
      className="dp-skeleton"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

export function TextLines({ lines = 3, gap = 8, widths }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={10}
          width={widths?.[i] ?? (i === lines - 1 ? '62%' : '100%')}
        />
      ))}
    </div>
  );
}

/* ------------------------- route fallback (Suspense) ------------------------ */

export function PageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}
    >
      <div className="hero-bg fixed inset-0 z-0" aria-hidden="true">
        <div className="grain-fine" />
        <div className="grain-fiber" />
      </div>
      <div
        className="relative z-10 mx-auto w-full"
        style={{ maxWidth: 1120, padding: '110px 20px 64px' }}
      >
        <div className="flex items-center justify-center" style={{ marginBottom: 28 }}>
          <Skeleton width={220} height={36} radius={9999} />
        </div>
        <div className="flex flex-col items-center" style={{ gap: 12, marginBottom: 36 }}>
          <Skeleton width="min(420px, 80%)" height={22} />
          <Skeleton width="min(300px, 60%)" height={14} />
        </div>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <DistroCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ distro catalogue ---------------------------- */

export function DistroCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        borderRadius: 26,
        border: `1px solid ${LINE}`,
        background: 'rgba(255,255,255,0.02)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        aspectRatio: '3 / 4',
      }}
      className="sm:aspect-[4/5]"
    >
      <Skeleton width={68} height={68} radius={20} />
      <Skeleton width="70%" height={18} />
      <Skeleton width="45%" height={10} />
    </div>
  );
}

export function DistroGridSkeleton({ count = 10 }) {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6"
    >
      {Array.from({ length: count }).map((_, i) => (
        <DistroCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ------------------------------- distro detail ------------------------------ */

export function DistroDetailSkeleton() {
  return (
    <div aria-hidden="true" style={{ width: '100%' }}>
      {/* Hero */}
      <div
        className="w-full flex flex-col items-center text-center justify-center"
        style={{ gap: 18, minHeight: 'calc(100vh - 6.5rem)', paddingBottom: 48 }}
      >
        <Skeleton width={112} height={112} radius={24} />
        <Skeleton width="min(320px, 70%)" height={44} radius={10} />
        <Skeleton width="min(480px, 85%)" height={16} />
        <div className="flex items-center justify-center flex-wrap" style={{ gap: 12 }}>
          <Skeleton width={150} height={44} radius={9999} />
          <Skeleton width={150} height={44} radius={9999} />
        </div>
      </div>
      {/* Specs */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
        style={{ gap: 12, marginBottom: 40 }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: 16,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${LINE}`,
            }}
          >
            <Skeleton width="55%" height={10} style={{ marginBottom: 10 }} />
            <Skeleton width="85%" height={14} />
          </div>
        ))}
      </div>
      {/* Install steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 20 }}>
            <Skeleton width={28} height={20} radius={6} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton width="40%" height={16} />
              <TextLines lines={2} />
              <Skeleton width="100%" height={64} radius={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- compare ---------------------------------- */

export function CompareTableSkeleton({ cols = 3, rows = 8 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        borderRadius: 16,
        border: `1px solid ${LINE}`,
        background: 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${LINE}` }}>
        <div style={{ width: 140, flexShrink: 0, padding: '20px 16px' }}>
          <Skeleton width="60%" height={10} />
        </div>
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              minWidth: 150,
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              borderLeft: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Skeleton width={56} height={56} radius={16} />
            <Skeleton width="60%" height={14} />
          </div>
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: 'flex',
            borderTop: r === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div style={{ width: 140, flexShrink: 0, padding: '14px 16px' }}>
            <Skeleton width="70%" height={10} />
          </div>
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              style={{
                flex: 1,
                minWidth: 150,
                padding: '14px 16px',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <Skeleton width={c === cols - 1 && r % 3 === 0 ? '55%' : '85%'} height={12} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- community -------------------------------- */

export function PostRowSkeleton() {
  return (
    <div aria-hidden="true" style={{ padding: '14px 4px' }}>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}>
        <Skeleton width={26} height={26} radius={9999} />
        <Skeleton width={110} height={11} />
        <Skeleton width={80} height={10} />
      </div>
      <Skeleton width="82%" height={18} style={{ marginBottom: 8 }} />
      <TextLines lines={2} widths={['96%', '55%']} />
      <div className="flex items-center" style={{ gap: 8, marginTop: 12 }}>
        <Skeleton width={64} height={28} radius={9999} />
        <Skeleton width={90} height={24} radius={9999} />
        <Skeleton width={70} height={24} radius={9999} />
      </div>
    </div>
  );
}

export function CommunityFeedSkeleton({ count = 4 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ borderBottom: i === count - 1 ? 'none' : `1px solid ${LINE}` }}>
          <PostRowSkeleton />
        </div>
      ))}
    </div>
  );
}

export function RailListSkeleton({ count = 4 }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton width={`${88 - i * 7}%`} height={12} />
          <Skeleton width="45%" height={9} />
        </div>
      ))}
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex items-center" style={{ gap: 10, marginBottom: 14 }}>
        <Skeleton width={36} height={36} radius={9999} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton width={140} height={13} />
          <Skeleton width={190} height={10} />
        </div>
      </div>
      <Skeleton width="90%" height={26} style={{ marginBottom: 12 }} />
      <TextLines lines={4} />
      <div className="flex items-center" style={{ gap: 8, marginTop: 16 }}>
        <Skeleton width={64} height={28} radius={9999} />
        <Skeleton width={100} height={24} radius={9999} />
        <Skeleton width={70} height={24} radius={9999} />
      </div>
      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 10 }}>
            <Skeleton width={30} height={30} radius={9999} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <Skeleton width="30%" height={11} style={{ marginBottom: 8 }} />
              <TextLines lines={2} widths={['92%', '60%']} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------- chat ----------------------------------- */

export function ChatListSkeleton({ count = 5 }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center"
          style={{ gap: 9, padding: '8px 10px' }}
        >
          <Skeleton width={14} height={14} radius={4} />
          <Skeleton width={`${72 - i * 6}%`} height={12} />
        </div>
      ))}
    </div>
  );
}

export function ChatMessagesSkeleton({ count = 3 }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {Array.from({ length: count }).map((_, i) =>
        i % 2 === 0 ? (
          <div key={i} className="flex justify-end">
            <div style={{ width: '62%', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <Skeleton width="100%" height={44} radius={16} />
              <Skeleton width="55%" height={12} />
            </div>
          </div>
        ) : (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton width="92%" height={14} />
            <Skeleton width="88%" height={14} />
            <Skeleton width="60%" height={14} />
            <Skeleton width={120} height={64} radius={10} />
          </div>
        )
      )}
    </div>
  );
}

/* ----------------------------------- quiz ----------------------------------- */

export function QuizResultSkeleton() {
  return (
    <div aria-hidden="true">
      <div
        className="flex items-center"
        style={{
          gap: 16,
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          border: `1px solid ${LINE}`,
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        <Skeleton width={72} height={72} radius={9999} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton width="35%" height={10} />
          <Skeleton width="55%" height={22} />
          <Skeleton width="80%" height={12} />
          <Skeleton width={140} height={34} radius={9999} />
        </div>
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center"
          style={{
            gap: 14,
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 10,
            border: `1px solid ${LINE}`,
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <Skeleton width={44} height={44} radius={9999} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton width="40%" height={13} />
            <Skeleton width="65%" height={10} />
          </div>
        </div>
      ))}
      <p
        style={{
          fontFamily: MONO,
          fontSize: '0.72rem',
          color: THEME.textMuted,
          textAlign: 'center',
          margin: '14px 0 0',
        }}
      >
        Comparing all 14 distros against your answers…
      </p>
    </div>
  );
}
