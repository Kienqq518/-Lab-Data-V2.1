import React from 'react';

/**
 * 分段切换控件（segmented）。检测模块右上「按设备 / 按样品」模式切换即用它。
 * options: [{ value, label }]；受控 value + onChange。
 */
export function SegmentedSwitch({ options = [], value, onChange, size = 'md', style, ...rest }) {
  const h = size === 'sm' ? 32 : 38;
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div style={{
      position: 'relative', display: 'inline-flex', height: h, padding: 3,
      background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)',
      border: '1px solid var(--border-default)', ...style,
    }} {...rest}>
      <div style={{
        position: 'absolute', top: 3, bottom: 3, left: 3,
        width: `calc((100% - 6px) / ${options.length})`,
        transform: `translateX(${idx * 100}%)`,
        background: 'var(--white)', borderRadius: 'var(--radius-pill)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform var(--dur-base) var(--ease-out)',
      }} />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange?.(o.value)}
            style={{
              position: 'relative', zIndex: 1, flex: 1, border: 'none', background: 'transparent',
              padding: '0 18px', cursor: 'pointer', whiteSpace: 'nowrap',
              font: 'var(--font-sans)', fontSize: 'var(--fs-sm)',
              fontWeight: active ? 600 : 500,
              color: active ? 'var(--brand-action)' : 'var(--text-secondary)',
              transition: 'color var(--dur-fast)',
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
