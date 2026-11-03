/**
 * Small shared building blocks for the admin pages, so the four pages look
 * and behave the same (header, cards, loading / error states).
 */
import React from 'react';
import { Link } from 'react-router-dom';

export const S = {
  page: { padding: '24px 32px', maxWidth: 1200, margin: '0 auto' },
  card: { background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: '1px solid #f1f5f9', padding: '20px 24px' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', borderBottom: '1.5px solid #e2e8f0', whiteSpace: 'nowrap' },
  td: { padding: '11px 12px', fontSize: 14, color: '#1e293b', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  input: { padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14, minWidth: 240, fontFamily: 'inherit' },
  secondaryBtn: { padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#334155', textDecoration: 'none', display: 'inline-block' },
  muted: { color: '#64748b', fontSize: 13 },
};

export const ROLE_STYLE = {
  student: { label: 'Student', color: '#1d4ed8', bg: '#eff6ff' },
  teacher: { label: 'Teacher', color: '#7c3aed', bg: '#f5f3ff' },
  admin: { label: 'Admin', color: '#b45309', bg: '#fffbeb' },
};

export function PageHeader({ icon, title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#1e293b' }}>{icon} {title}</h1>
        {subtitle && <p style={{ color: '#64748b', marginTop: 4, fontSize: 15 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

export function StatCard({ icon, label, value, hint, color = '#6366f1', to }) {
  const body = (
    <div style={{ ...S.card, textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 26, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
      {hint && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{hint}</div>}
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{body}</Link> : body;
}

export function StatGrid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>{children}</div>;
}

export function Section({ title, children, actions }) {
  return (
    <section style={{ ...S.card, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function RoleBadge({ role }) {
  const style = ROLE_STYLE[role] || { label: role, color: '#334155', bg: '#f1f5f9' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: style.color, background: style.bg, whiteSpace: 'nowrap' }}>
      {style.label}
    </span>
  );
}

export function LoadState({ loading, error, onRetry, children }) {
  if (loading) return <p style={{ ...S.card, textAlign: 'center', color: '#64748b' }}>Loading…</p>;
  if (error) {
    return (
      <div role="alert" style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b', fontWeight: 600 }}>
        <span>⚠️ {error}</span>
        {onRetry && <button type="button" onClick={onRetry} style={S.secondaryBtn}>Retry</button>}
      </div>
    );
  }
  return children;
}

export const apiError = (e, fallback) => e?.response?.data?.error || fallback;

export function timeAgo(iso) {
  if (!iso) return '—';
  const hasZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso);
  const then = new Date(hasZone ? iso : `${iso}Z`);
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return then.toLocaleDateString();
}
