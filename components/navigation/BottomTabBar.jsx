import React from 'react';

/**
 * 底部 Tab 栏。检测员：首页 / 我的。
 * items: [{ key, label, icon:'home'|'user' }]；active + onChange。
 */
function TabIcon({ name, active }) {
  const color = active ? 'var(--brand-action)' : 'var(--text-secondary)';
  const c = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'user') return <svg {...c}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  if (name === 'clipboard') return <svg {...c}><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>;
  return <svg {...c}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}

export function BottomTabBar({ items = [], active, onChange, style }) {
  return (
    <div style={{
      height: 'var(--tabbar-h)', display: 'flex', background: 'var(--white)',
      borderTop: '1px solid var(--border-default)', boxShadow: 'var(--shadow-tabbar)', ...style,
    }}>
      {items.map((it) => {
        const on = it.key === active;
        return (
          <button key={it.key} onClick={() => onChange?.(it.key)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            border: 'none', background: 'transparent', cursor: 'pointer',
          }}>
            <TabIcon name={it.icon} active={on} />
            <span style={{ fontSize: 'var(--fs-xs)', fontWeight: on ? 600 : 400, color: on ? 'var(--brand-action)' : 'var(--text-secondary)' }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
