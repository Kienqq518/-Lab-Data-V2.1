import React from 'react';

/**
 * 工位上下文条。检测模块顶部常驻，显示当前工位，可点击切换。
 * 体现"工位为持久上下文，而非每次必选第一步"的核心交互。
 */
export function StationBar({ station, onSwitch, onClear, style }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '10px 14px', background: 'var(--blue-50)',
      border: '1px solid var(--blue-100)', borderRadius: 'var(--radius-md)', ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-action)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', flex: 'none' }}>当前工位</span>
        <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{station}</span>
        {onClear && (
          <button onClick={onClear} aria-label="清除工位" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
            width: 22, height: 22, border: 'none', borderRadius: 'var(--radius-sm)',
            background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6 M9 9l6 6"/></svg>
          </button>
        )}
      </div>
      <button onClick={onSwitch} style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, flex: 'none',
        border: 'none', background: 'transparent', cursor: 'pointer',
        color: 'var(--brand-action)', fontSize: 'var(--fs-sm)', fontWeight: 600,
      }}>
        切换
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
    </div>
  );
}
