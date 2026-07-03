import React from 'react';

/**
 * 顶部导航栏。左返回（可选）+ 居中标题 + 右操作（可选，如扫码）。
 * 高度 var(--appbar-h)；白底 + 底部 1px 分隔。
 */
export function AppBar({ title, onBack, right, style }) {
  return (
    <div style={{
      height: 'var(--appbar-h)', display: 'flex', alignItems: 'center',
      padding: '0 12px', background: 'var(--white)',
      borderBottom: '1px solid var(--border-default)', ...style,
    }}>
      <div style={{ width: 44, flex: 'none' }}>
        {onBack && (
          <button onClick={onBack} aria-label="返回" style={{
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-title)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
      </div>
      <div style={{ flex: 1, textAlign: 'center', font: 'var(--font-sans)', fontSize: 'var(--fs-h3)', fontWeight: 600, color: 'var(--text-title)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {title}
      </div>
      <div style={{ width: 44, flex: 'none', display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}
