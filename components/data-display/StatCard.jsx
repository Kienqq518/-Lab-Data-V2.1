import React from 'react';

/**
 * 统计卡。首页「任务状态统计」用：大数字 + 标签 + 状态点。
 * tone: pending/testing/done/overdue/brand → 决定数字与圆点颜色。
 */
const TONE = {
  pending: 'var(--status-pending)',
  testing: 'var(--status-testing-fg)',
  done: 'var(--status-done)',
  overdue: 'var(--status-overdue)',
  brand: 'var(--brand-action)',
};

export function StatCard({ label, value, tone = 'brand', onClick, style }) {
  const c = TONE[tone] || TONE.brand;
  return (
    <div onClick={onClick} style={{
      flex: 1, background: 'var(--surface-card)', border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)',
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6,
      cursor: onClick ? 'pointer' : 'default', ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <span style={{ font: 'var(--font-numeric)', fontSize: 32, fontWeight: 700, color: c, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{value}</span>
    </div>
  );
}
