/**
 * Shared design tokens — single source of truth for hero + bento.
 * Taken directly from src/components/HeroSection.jsx (THEME) + hero-bg texture.
 * Change values here; both sections update. Do not hardcode hexes in components.
 */
export const THEME = {
  // Surfaces — hero background system
  bg: '#161B22', // page / terminal inset background
  bgCard: '#1C2229', // ONE card surface for every bento card
  // Single accent — burnt orange. Use sparingly: ONE focal element per card max
  // (an icon stroke, a small tag, or a CTA). Never as a card background.
  accent: '#E05A38',
  // Muted companions — not accents, never for emphasis
  accentSoft: '#E8A27C', // legacy hero brand text only; avoid in bento
  silver: '#A2A8B0', // default icon stroke
  textMain: '#F0F4F8', // headlines, values
  textMuted: '#8B949E', // descriptions, secondary lines
};

export const LINE = 'rgba(255,255,255,0.08)'; // 1px card + panel borders
export const LINE_SOFT = 'rgba(255,255,255,0.12)'; // circular badge ring
export const CONNECTOR = 'rgba(139,148,158,0.35)'; // thin connector lines (hero uses 0.2 opacity dashed)

export const MONO = "'JetBrains Mono', monospace, ui-monospace, SFMono-Regular, Menlo, monospace";

export const RADIUS = {
  card: 14,
  panel: 8,
  badge: 999,
};

export const BADGE = {
  size: 40,
  border: `1px solid ${LINE_SOFT}`,
  background: THEME.bg, // flat, no gradient, no drop shadow
};
