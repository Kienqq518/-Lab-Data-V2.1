import React from 'react';

/**
 * 区块标题。左侧 4px 品牌蓝竖条 + 标题（沿用旧 app 风格）。
 * 右侧可放操作（more 链接等）。
 */
export function SectionTitle({ children, extra, style, ...rest }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...style }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 4, height: 16, borderRadius: 2, background: 'var(--brand)', flex: 'none' }} />
        <span style={{ font: 'var(--font-sans)', fontSize: 'var(--fs-h3)', fontWeight: 600, color: 'var(--text-title)' }}>
          {children}
        </span>
      </div>
      {extra && <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-link)' }}>{extra}</div>}
    </div>
  );
}
