import React from 'react';
import { StatusTag } from '../feedback/StatusTag.jsx';

/**
 * 样品列表项（左侧栏）。沿用旧 L3/L4 左侧序号栏样式：
 * 序号 + 样品编号 + 检测状态标签，选中态高亮。
 */
export function SampleListItem({ index, code, status = 'pending', selected = false, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', gap: 6, width: '100%', textAlign: 'left',
      padding: '12px 14px', cursor: 'pointer',
      background: selected ? 'var(--surface-selected)' : 'var(--white)',
      border: 'none', borderLeft: `3px solid ${selected ? 'var(--brand-action)' : 'transparent'}`,
      borderBottom: '1px solid var(--divider)',
      transition: 'background var(--dur-fast)', ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 'var(--fs-xs)', fontWeight: 600,
          color: selected ? 'var(--brand-action)' : 'var(--text-secondary)',
          background: selected ? 'var(--blue-100)' : 'var(--surface-sunken)',
          borderRadius: 'var(--radius-sm)', padding: '1px 7px', fontVariantNumeric: 'tabular-nums',
        }}>序号 {index}</span>
        <StatusTag status={status} size="sm" />
      </div>
      <span style={{
        fontSize: 'var(--fs-sm)', color: 'var(--text-body)', fontWeight: selected ? 600 : 400,
        fontVariantNumeric: 'tabular-nums', wordBreak: 'break-all',
      }}>{code}</span>
    </button>
  );
}
