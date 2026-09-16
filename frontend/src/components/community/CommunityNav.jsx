import React from 'react';
import { Home, Plus, MessagesSquare, GitCompareArrows, Bot } from 'lucide-react';
import DistroIcon from '../DistroIcon.jsx';
import { THEME, LINE, MONO } from '../../theme/designTokens.js';
import { ChannelAvatar } from './Avatar.jsx';

const GLASS = {
  background: 'rgba(28, 34, 41, 0.55)',
  backdropFilter: 'blur(28px) saturate(170%)',
  WebkitBackdropFilter: 'blur(28px) saturate(170%)',
  border: '1px solid rgba(255, 255, 255, 0.14)',
};

const navBtn = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  fontFamily: MONO,
  fontSize: '0.78rem',
  fontWeight: active ? 700 : 500,
  color: active ? THEME.textMain : 'rgba(240,244,248,0.65)',
  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
  border: 'none',
  borderRadius: 9999,
  padding: '8px 14px',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.15s ease, color 0.15s ease',
});

const sectionLabel = {
  fontFamily: MONO,
  fontSize: '0.6rem',
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: THEME.textMuted,
  padding: '14px 14px 6px',
};

/**
 * Reddit-style left navigation: site links + channel list + create button.
 * `channel` ('all' | 'general' | distroId) marks the active feed filter.
 */
export default function CommunityNav({ distros, channel, onNavigate, onChannel, onCreatePost }) {
  const navLink = (label, icon, to) => (
    <button
      key={label}
      type="button"
      style={navBtn(false)}
      onClick={() => onNavigate?.(to)}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.color = THEME.textMain;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'rgba(240,244,248,0.65)';
      }}
    >
      {icon}
      {label}
    </button>
  );

  const channelRow = (key, label, distro) => {
    const active = channel === key;
    return (
      <button
        key={key}
        type="button"
        style={navBtn(active)}
        onClick={() => onChannel?.(key)}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = 'transparent';
        }}
      >
        <ChannelAvatar channel={key} distro={distro} size={24} />
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <aside
      className="flex flex-col"
      style={{
        width: 236,
        flexShrink: 0,
        position: 'sticky',
        top: 16,
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
        borderRadius: 18,
        padding: '12px 10px',
        ...GLASS,
      }}
    >
      {/* Brand */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigate?.('/')}
        className="flex items-center select-none"
        style={{ gap: 8, padding: '4px 12px 12px', cursor: 'pointer' }}
      >
        <Bot size={20} color={THEME.accent} />
        <span style={{ fontFamily: MONO, fontSize: '0.9rem', fontWeight: 800 }}>
          <span style={{ color: THEME.textMain }}>Distro</span>
          <span style={{ color: THEME.accent }}>Pedia</span>
        </span>
      </div>

      <button
        type="button"
        onClick={onCreatePost}
        className="flex items-center justify-center transition-all"
        style={{
          gap: 6,
          fontFamily: MONO,
          fontSize: '0.76rem',
          fontWeight: 700,
          color: '#fff',
          background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 9999,
          padding: '9px 14px',
          cursor: 'pointer',
          boxShadow: `0 2px 16px ${THEME.accent}55, 0 1px 0 rgba(255,255,255,0.35) inset`,
          marginBottom: 8,
        }}
      >
        <Plus size={15} />
        Create post
      </button>

      {navLink('Home', <Home size={17} />, '/community')}
      {navLink('Flavours', <MessagesSquare size={17} />, '/flavours')}
      {navLink('Compare', <GitCompareArrows size={17} />, '/compare')}
      {navLink('AI Chat', <Bot size={17} />, '/chat')}

      <div style={sectionLabel}>Channels</div>
      {channelRow('general', 'General', null)}
      {distros.map((d) => channelRow(d.id, d.name, d))}

      <div
        style={{
          marginTop: 'auto',
          paddingTop: 12,
          fontFamily: MONO,
          fontSize: '0.6rem',
          color: THEME.textMuted,
          textAlign: 'center',
        }}
      >
        DistroPedia Community
      </div>
    </aside>
  );
}
