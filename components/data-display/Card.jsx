import React from 'react';

/**
 * 基础卡片。白底 + 12px 圆角 + 1px 淡描边 + 轻阴影。
 * selectable + selected: 选中态加蓝边 + 浅蓝底。onClick 时带触控按压反馈。
 */
export function Card({
  selected = false, selectable = false, onClick, padding = 'var(--gap-card)',
  children, style, ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  const interactive = selectable || !!onClick;
  return (
    <div
      onClick={onClick}
      onPointerDown={() => interactive && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: selected ? 'var(--surface-selected)' : 'var(--surface-card)',
        border: `${selected ? '1.5px' : '1px'} solid ${selected ? 'var(--brand-action)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)',
        padding, cursor: interactive ? 'pointer' : 'default',
        transform: pressed ? 'scale(0.99)' : 'scale(1)',
        transition: 'transform var(--dur-fast) var(--ease-out), border-color var(--dur-fast), background var(--dur-fast)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
