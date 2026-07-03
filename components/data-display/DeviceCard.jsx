import React from 'react';
import { Card } from '../data-display/Card.jsx';
import { CollectBadge } from '../feedback/CollectBadge.jsx';

/**
 * 设备卡。检测模块「按设备」列表项。
 * 展示设备名/编号/型号/所在区域/采集方式/可做试验项数；可选中。
 */
export function DeviceCard({
  name, code, model, area, method = 'auto', itemCount, enabled = true,
  selected = false, onClick, style,
}) {
  return (
    <Card selected={selected} onClick={onClick} style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ font: 'var(--font-sans)', fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--text-title)' }}>{name}</span>
            {!enabled && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', background: 'var(--surface-sunken)', padding: '1px 7px', borderRadius: 'var(--radius-pill)' }}>停用</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            <span>编号 {code}</span>
            {model && <span>型号 {model}</span>}
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-sm)', color: 'var(--text-body)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              {area}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flex: 'none' }}>
          <CollectBadge method={method} size="sm" />
          {itemCount != null && (
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              可做 <b style={{ color: 'var(--brand-action)', fontVariantNumeric: 'tabular-nums' }}>{itemCount}</b> 项
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
