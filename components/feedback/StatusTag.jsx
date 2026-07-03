import React from 'react';

/**
 * 状态标签（胶囊）。用于"样品检测状态 / 任务状态"。
 * status: pending(未检测·印章黄) | testing(检测中·浅蓝) | done(已完成·绿) | overdue(已逾期·红)
 */
const MAP = {
  pending:  { bg: 'var(--status-pending-bg)',  fg: 'var(--status-pending-fg)',  label: '未检测' },
  testing:  { bg: 'var(--status-testing-bg)',  fg: 'var(--status-testing-fg)',  label: '检测中' },
  done:     { bg: 'var(--status-done-bg)',     fg: 'var(--status-done-fg)',     label: '已完成' },
  overdue:  { bg: 'var(--status-overdue-bg)',  fg: 'var(--status-overdue-fg)',  label: '已逾期' },
};

export function StatusTag({ status = 'pending', children, size = 'md', style, ...rest }) {
  const s = MAP[status] || MAP.pending;
  const pad = size === 'sm' ? '1px 8px' : '3px 11px';
  const fs = size === 'sm' ? 'var(--fs-xs)' : 'var(--fs-sm)';
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: pad, borderRadius: 'var(--radius-pill)',
        background: s.bg, color: s.fg,
        font: 'var(--font-sans)', fontSize: fs, fontWeight: 600,
        lineHeight: 1.4, whiteSpace: 'nowrap', ...style,
      }}
      {...rest}
    >
      {children ?? s.label}
    </span>
  );
}
