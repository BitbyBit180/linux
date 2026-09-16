import React from 'react';
import { Globe } from 'lucide-react';
import DistroIcon from '../DistroIcon.jsx';
import { THEME, MONO } from '../../theme/designTokens.js';

// Deterministic hue from a name so every user gets a stable avatar colour
const hueFromName = (name) => {
  let h = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

/** Reddit-style letter avatar for a user. */
export function UserAvatar({ name, size = 32 }) {
  const hue = hueFromName(name);
  return (
    <div
      className="flex items-center justify-center shrink-0 select-none"
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        background: `hsl(${hue}, 42%, 38%)`,
        border: '1px solid rgba(255,255,255,0.18)',
        fontFamily: MONO,
        fontSize: size * 0.42,
        fontWeight: 800,
        color: '#fff',
      }}
      title={name}
    >
      {String(name || '?')[0].toUpperCase()}
    </div>
  );
}

/** Circle avatar for a channel: distro logo, or a globe for General. */
export function ChannelAvatar({ channel, distro, size = 32 }) {
  const isGeneral = channel === 'general';
  const accent = isGeneral ? THEME.accent : distro?.accent || THEME.silver;
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        background: `${accent}22`,
        border: `1px solid ${accent}66`,
      }}
      title={isGeneral ? 'General' : distro?.name || channel}
    >
      {isGeneral ? (
        <Globe size={size * 0.52} style={{ color: accent }} />
      ) : (
        <DistroIcon name={distro?.name || channel} accent={accent} size={size * 0.58} />
      )}
    </div>
  );
}
