import React from 'react';

/**
 * 试验状态圆点。pending(未检测·印章黄) | testing(检测中·浅蓝) | done(已检测·绿)
 * 可带文案；用于试验项行内状态。
 */
const COLOR = {
  pending: { c: 'var(--status-pending-dot)', label: '未检测' },
  testing: { c: 'var(--status-testing)', label: '检测中' },
  done:    { c: 'var(--status-done)',    label: '已检测' },
};

export function StatusDot({ status = 'pending', label, size = 11, style, ...rest }) {
  const s = COLOR[status] || COLOR.pending;
  const dot = (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      background: s.c, flex: 'none', display: 'inline-block',
    }} />
  );
  if (label === false) return React.cloneElement(dot, { style: { ...dot.props.style, ...style }, ...rest });
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      font: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-body)', ...style,
    }} {...rest}>
      {dot}{label ?? s.label}
    </span>
  );
}
