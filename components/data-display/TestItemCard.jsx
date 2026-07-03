import React from 'react';
import { Card } from '../data-display/Card.jsx';
import { StatusDot } from '../feedback/StatusDot.jsx';
import { CollectBadge } from '../feedback/CollectBadge.jsx';
import { UploadStatus } from '../feedback/UploadStatus.jsx';

/**
 * 试验项卡。样品详情 / 检测列表里的一条试验项。
 * 展示：试验项名 + 试验状态圆点 + 检测设备 + 采集方式 + 上传状态。
 * status: pending/testing/done；upload?: pending/done。
 */
export function TestItemCard({
  name, device, status = 'pending', method = 'auto', upload, onClick, style,
}) {
  return (
    <Card onClick={onClick} padding="14px var(--gap-card)" style={style}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <StatusDot status={status} label={false} size={10} />
          <span style={{ font: 'var(--font-sans)', fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--text-title)' }}>{name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
          {upload && <UploadStatus status={upload} showLabel={false} />}
          <CollectBadge method={method} size="sm" showLabel={false} />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-placeholder)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>
      {device && (
        <div style={{ marginTop: 8, paddingLeft: 18, fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
          检测设备：{device}
        </div>
      )}
    </Card>
  );
}
