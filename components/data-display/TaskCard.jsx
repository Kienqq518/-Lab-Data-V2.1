import React from 'react';
import { Card } from '../data-display/Card.jsx';
import { StatusTag } from '../feedback/StatusTag.jsx';

/**
 * 任务卡。任务列表（待检/检测中/已完成/已逾期）的列表项。
 * 沿用旧 app：任务编号 / 样品名称 / 委托单位 / 下发时间 + 右上状态标签。
 */
export function TaskCard({
  code, sampleName, client, time, status = 'pending', detectDeadline, thirdParty, onClick, style,
}) {
  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', gap: 8, fontSize: 'var(--fs-sm)', lineHeight: 1.7 }}>
      <span style={{ color: 'var(--text-secondary)', flex: 'none' }}>{label}</span>
      <span style={{ color: 'var(--text-body)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
  return (
    <Card onClick={onClick} style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ font: 'var(--font-sans)', fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--text-title)', fontVariantNumeric: 'tabular-nums' }}>
            任务编号 {code}
          </span>
          {thirdParty && (
            <span style={{
              flex: 'none', fontSize: 'var(--fs-xs)', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-pill)',
              background: 'var(--status-pending-bg,#fff7e6)', color: 'var(--status-pending-fg,#a85d00)',
            }}>第三方 LIMS</span>
          )}
        </div>
        <StatusTag status={status} />
      </div>
      <Row label="样品名称" value={sampleName} />
      <Row label="委托单位" value={client} />
      <Row label="下发时间" value={time} />
      {detectDeadline && <Row label="检测时效" value={detectDeadline} />}
    </Card>
  );
}
