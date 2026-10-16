import React from 'react';

const METHOD_COLOR = {
  auto: 'var(--collect-auto,#1d54c4)',
  ble: 'var(--collect-ble,#0a8a96)',
  manual: 'var(--collect-manual,#828c9c)',
  ocr: 'var(--collect-ocr,#b06a00)',
  serial: 'var(--collect-serial,#6d4bd1)',
  external: 'var(--collect-ble,#0a8a96)',
};

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 5 5 9-9" />
    </svg>
  );
}

/** 提交瞬间的设备快照（只保留溯源字段） */
export function snapshotDevices(devices, selectedIds) {
  const picked = new Set(selectedIds || []);
  return (devices || []).filter((device) => picked.has(device.id)).map((device) => ({
    id: device.id,
    name: device.name,
    code: device.code || '—',
    model: device.model || '—',
    method: device.method,
    station: device.station ?? null,
  }));
}

/** 已有历史上传时，用试验项原绑定设备作为已记录选中；否则取配置列表第一台 */
export function defaultRecordedIds(devices, item) {
  if (!devices?.length) return [];
  const bound = item?.device;
  const boundId = typeof bound === 'string' ? bound : bound?.id;
  if (boundId && devices.some((device) => device.id === boundId)) return [boundId];
  return [devices[0].id];
}

export function ConfiguredDeviceSelect({ devices = [], selectedIds = [], locked = false, lockReason = null, onToggle }) {
  const selected = new Set(selectedIds);
  const hint = lockReason === 'uploaded'
    ? '本样品已有一次或多次试验数据上传，不能更改设备选中。将全部已上传数据重置清除后，才可重新选择。'
    : lockReason === 'flow'
      ? '流程已锁定，不能更改设备选中。'
      : selectedIds.length
        ? `已选 ${selectedIds.length} 台。提交前可调整；任一次试验数据上传后，须重置清除全部已上传数据才能再改。`
        : '请至少选择一台设备。未选设备时不能记录开始时间。';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        以下设备来自数采 Web「设备采集配置」中为本采集表关联的设备，可多选。提交本条试验数据时，按当时选中的设备记入该条记录。
      </div>
      {devices.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {devices.map((device) => {
            const on = selected.has(device.id);
            return (
              <button
                key={device.id}
                type="button"
                aria-pressed={on}
                onClick={() => onToggle?.(device.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  maxWidth: '100%',
                  minHeight: 36,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
                  background: on ? 'var(--surface-selected)' : 'var(--white)',
                  color: on ? 'var(--brand-action)' : 'var(--text-body)',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked && !on ? 0.55 : 1,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: METHOD_COLOR[device.method] || 'var(--text-secondary)', flex: 'none' }} />
                {on && <CheckIcon />}
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: on ? 650 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.name}</span>
                {device.code && device.code !== '—' && (
                  <span style={{ fontSize: 'var(--fs-xs)', color: on ? 'var(--brand-action)' : 'var(--text-tertiary,#9aa3b2)', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{device.code}</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          尚未在数采 Web「设备采集配置」中为该采集表关联设备
        </div>
      )}
      <div style={{ fontSize: 'var(--fs-xs)', color: lockReason ? 'var(--status-pending-fg,#97640f)' : 'var(--text-tertiary,#9aa3b2)', lineHeight: 1.5 }}>
        {hint}
      </div>
    </div>
  );
}

/** 试验数据行上的设备溯源：未提交展示当前选中，已提交展示提交瞬间快照 */
export function SubmittedDeviceTrace({ devices = [], uploaded = false }) {
  const list = devices || [];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minHeight: 34, padding: '7px 10px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken,#f5f6f8)', color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)' }}>
      <span style={{ flex: 'none', marginTop: 1 }}>{uploaded ? '本次提交设备' : '当前选中设备'}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minWidth: 0 }}>
        {list.length ? list.map((device) => (
          <span key={device.id || device.name} style={{ color: 'var(--text-title)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {device.name}{device.code && device.code !== '—' ? ` ${device.code}` : ''}
          </span>
        )) : (
          <span>尚未选择</span>
        )}
      </div>
    </div>
  );
}
