import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

/** Image URL for a user's picture: uploaded photo, chosen avatar, or null. */
export function avatarSrc(user) {
  if (user?.profile_picture) return `${API_ORIGIN}/api/uploads/profile-pictures/${user.profile_picture}`;
  if (user?.avatar_url && /^https?:\/\//.test(user.avatar_url)) return user.avatar_url;
  return null; // e.g. the old default 'default_avatar.png', which does not exist
}

const COLORS = ['#f97316', '#ec4899', '#8b5cf6', '#0ea5e9', '#10b981', '#eab308'];

/** User picture with a coloured-initial fallback (never a broken image). */
export default function Avatar({ user, size = 44, className }) {
  const [failed, setFailed] = useState(false);
  const src = avatarSrc(user);
  const name = user?.username || '?';
  const style = { width: size, height: size, borderRadius: '50%', flexShrink: 0 };

  if (src && !failed) {
    return <img src={src} alt={`${name}'s avatar`} className={className} style={{ ...style, objectFit: 'cover' }} onError={() => setFailed(true)} />;
  }
  const color = COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length];
  return (
    <div
      aria-label={`${name}'s avatar`}
      className={className}
      style={{ ...style, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.42 }}
    >
      {name[0].toUpperCase()}
    </div>
  );
}
