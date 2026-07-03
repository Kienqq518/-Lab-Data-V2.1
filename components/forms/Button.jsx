import React from 'react';

/**
 * 按钮。variant: primary(实心蓝) | secondary(描边) | ghost(无底) | danger(红)
 * size: lg(48) | md(40) | sm(32)。block 占满整行。支持 icon。
 * 按压：scale(0.97) + 主色加深一档（无弹跳）。
 */
const VARIANT = {
  primary:   { bg: 'var(--brand-action)', fg: '#fff', bd: 'transparent', press: 'var(--brand-action-press)' },
  secondary: { bg: 'var(--white)', fg: 'var(--brand-action)', bd: 'var(--brand-action)', press: 'var(--blue-50)' },
  ghost:     { bg: 'transparent', fg: 'var(--text-body)', bd: 'transparent', press: 'var(--surface-hover)' },
  danger:    { bg: 'var(--danger)', fg: '#fff', bd: 'transparent', press: '#c22a2a' },
};
const SIZE = {
  lg: { h: 'var(--control-h)', fs: 'var(--fs-lg)', px: 24 },
  md: { h: 40, fs: 'var(--fs-base)', px: 18 },
  sm: { h: 'var(--control-h-sm)', fs: 'var(--fs-sm)', px: 14 },
};

export function Button({
  variant = 'primary', size = 'md', block = false, disabled = false,
  icon, children, style, onMouseDown, onMouseUp, onMouseLeave, ...rest
}) {
  const v = VARIANT[variant] || VARIANT.primary;
  const s = SIZE[size] || SIZE.md;
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      disabled={disabled}
      onMouseDown={(e) => { setPressed(true); onMouseDown?.(e); }}
      onMouseUp={(e) => { setPressed(false); onMouseUp?.(e); }}
      onMouseLeave={(e) => { setPressed(false); onMouseLeave?.(e); }}
      style={{
        display: block ? 'flex' : 'inline-flex', width: block ? '100%' : 'auto',
        alignItems: 'center', justifyContent: 'center', gap: 7,
        height: s.h, padding: `0 ${s.px}px`, minWidth: s.h,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${v.bd}`,
        background: pressed && !disabled ? v.press : v.bg,
        color: v.fg, font: 'var(--font-sans)', fontSize: s.fs, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transform: pressed && !disabled ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform var(--dur-fast) var(--ease-out), background var(--dur-fast)',
        whiteSpace: 'nowrap', userSelect: 'none', ...style,
      }}
      {...rest}
    >
      {icon}{children}
    </button>
  );
}
