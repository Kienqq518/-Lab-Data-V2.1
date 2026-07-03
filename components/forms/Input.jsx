import React from 'react';

/**
 * 输入框 / 带前置图标。聚焦：蓝边 + 蓝色外发光。
 * 用于编号搜索、试验字段录入等。
 */
export function Input({
  value, onChange, placeholder, disabled = false, readOnly = false,
  prefix, suffix, unit, size = 'md', style, ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = size === 'lg' ? 'var(--control-h)' : size === 'sm' ? 'var(--control-h-sm)' : 44;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, height: h,
      padding: '0 12px', borderRadius: 'var(--radius-md)',
      background: readOnly ? 'var(--surface-sunken)' : 'var(--white)',
      border: `1px solid ${focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
      boxShadow: focus ? 'var(--shadow-focus)' : 'none',
      transition: 'border var(--dur-fast), box-shadow var(--dur-fast)',
      opacity: disabled ? 0.5 : 1, ...style,
    }}>
      {prefix && <span style={{ display: 'flex', color: 'var(--text-secondary)', flex: 'none' }}>{prefix}</span>}
      <input
        value={value} onChange={onChange} placeholder={placeholder}
        disabled={disabled} readOnly={readOnly}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
          font: 'var(--font-sans)', fontSize: 'var(--fs-base)', color: 'var(--text-title)',
          fontVariantNumeric: 'tabular-nums',
        }}
        {...rest}
      />
      {unit && <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', flex: 'none' }}>{unit}</span>}
      {suffix && <span style={{ display: 'flex', color: 'var(--text-secondary)', flex: 'none' }}>{suffix}</span>}
    </div>
  );
}
