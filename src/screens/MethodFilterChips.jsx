import React from 'react';

/** 设备采集类型筛选项（与 CollectBadge 文案一致） */
export const DEVICE_METHOD_FILTERS = [
  { value: '', label: '全部', color: 'var(--text-secondary)', bg: 'var(--surface-sunken)' },
  { value: 'auto', label: '设备直连', color: 'var(--collect-auto)', bg: 'var(--collect-auto-bg)' },
  { value: 'ocr', label: '拍照识别', color: 'var(--collect-ocr)', bg: 'var(--collect-ocr-bg)' },
  { value: 'ble', label: '蓝牙', color: 'var(--collect-ble)', bg: 'var(--collect-ble-bg)' },
  { value: 'serial', label: '串口', color: 'var(--collect-serial,#6d4bd1)', bg: 'var(--collect-serial-bg,rgba(109,75,209,0.12))' },
  { value: 'manual', label: '手工录入', color: 'var(--collect-manual)', bg: 'var(--collect-manual-bg)' },
];

/**
 * 按设备 L1：横向滑动的采集类型筛选（移动端触控友好）
 */
export function MethodFilterChips({ value, onChange, counts = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>采集类型</span>
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingBottom: 2,
      }}>
        {DEVICE_METHOD_FILTERS.map((opt) => {
          const on = value === opt.value;
          const count = counts[opt.value] ?? counts.all;
          return (
            <button
              key={opt.value || 'all'}
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                flex: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                minHeight: 36,
                padding: '0 14px',
                borderRadius: 'var(--radius-pill)',
                border: on ? `1.5px solid ${opt.color}` : '1px solid var(--border-default)',
                background: on ? opt.bg : 'var(--white)',
                color: on ? opt.color : 'var(--text-body)',
                fontSize: 'var(--fs-sm)',
                fontWeight: on ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: on ? '0 0 0 2px rgba(37,99,235,0.08)' : 'none',
              }}
            >
              {opt.label}
              {typeof count === 'number' && (
                <span style={{
                  minWidth: 18,
                  height: 18,
                  padding: '0 5px',
                  borderRadius: 9,
                  background: on ? 'rgba(255,255,255,0.72)' : 'var(--surface-sunken)',
                  fontSize: 11,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: '18px',
                  textAlign: 'center',
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 统计各采集类型设备数量（含非工位设备） */
export function countDevicesByMethod(deviceList) {
  const counts = { '': deviceList.length, all: deviceList.length };
  deviceList.forEach((d) => {
    const m = d.method || 'auto';
    counts[m] = (counts[m] || 0) + 1;
  });
  return counts;
}
