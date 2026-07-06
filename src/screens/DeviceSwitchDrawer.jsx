import React from 'react';
import { Button, CollectBadge, SearchBar } from '../design-system.js';

/* 统一的「切换设备」底部弹窗（单选）
   展示样式对齐多试验子项设备弹窗：工位筛选 + 搜索 + 设备卡片，单选即选即用。 */

const STATION_OPTIONS = [
  { value: 'zy', label: '电缆制样工位' },
  { value: 'sz', label: '水煮试验工位' },
  { value: 'ny', label: '耐压工位' },
  { value: 'ld', label: '雷电冲击工位' },
  { value: 'rs', label: '电缆燃烧工位' },
  { value: 'by', label: '变压器工位' },
  { value: 'none', label: '未绑定工位' },
];

/* 工位定位图标 */
function PinIcon({ on }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={on ? 'var(--brand-action)' : 'var(--text-tertiary,#9aa3b2)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
}

/* 单选圆形选中标记 */
function RadioMark({ on }) {
  return (
    <span style={{
      width: 20, height: 20, flex: 'none', borderRadius: '50%',
      border: '2px solid ' + (on ? 'var(--brand-action)' : 'var(--border-strong)'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {on && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--brand-action)' }} />}
    </span>
  );
}

/* 统一切换设备弹窗
   devices：候选设备列表；currentId：当前选中设备 id；
   isBlocked：可选，返回 true 表示该设备不可选（如未配置采集关系）；blockedHint：不可选提示。 */
function DeviceSwitchDrawer({ devices = [], currentId, onSelect, onClose, isBlocked, blockedHint }) {
  const [q, setQ] = React.useState('');
  const [station, setStation] = React.useState(null);
  const ql = q.trim().toLowerCase();
  const stationKey = (d) => (d.station ? d.station : 'none');

  const stationCounts = React.useMemo(() => devices.reduce((acc, d) => {
    const key = stationKey(d);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}), [devices]);

  const visibleDevices = React.useMemo(() => {
    const list = devices.filter((d) => {
      if (station && stationKey(d) !== station) return false;
      if (ql && !(d.name || '').toLowerCase().includes(ql)
        && !(d.code || '').toLowerCase().includes(ql)
        && !(d.model || '').toLowerCase().includes(ql)) return false;
      return true;
    });
    return list.slice().sort((a, b) => {
      if (a.visual && !b.visual) return -1;
      if (!a.visual && b.visual) return 1;
      return (a.name || '').localeCompare(b.name || '', 'zh-CN');
    });
  }, [devices, station, ql]);

  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(15,23,42,0.28)' }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 90, background: 'var(--white)',
        borderRadius: '18px 18px 0 0', boxShadow: '0 -14px 34px rgba(15,23,42,0.20)', overflow: 'hidden',
        maxHeight: '84%', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ width: 44, height: 4, borderRadius: 'var(--radius-pill)', background: 'var(--border-strong,#cfd6e2)', margin: '10px auto 6px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 16px 12px', borderBottom: '1px solid var(--divider)' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text-title)' }}>切换设备</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: 3 }}>按工位筛选实验室设备，选择本次采集使用的设备</div>
          </div>
        </div>
        <div style={{ padding: '0 16px 10px' }}>
          <SearchBar value={q} onChange={(event) => setQ(event.target.value)} placeholder="请输入设备名称、编号搜索" />
        </div>
        <div style={{ padding: '0 16px 10px', borderBottom: '1px solid var(--divider)' }}>
          <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-title)', marginBottom: 8 }}>选择工位</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setStation(null)} style={{
              minHeight: 32, padding: '5px 10px', borderRadius: 'var(--radius-pill)',
              border: '1px solid ' + (!station ? 'var(--brand-action)' : 'var(--border-default)'),
              background: !station ? 'var(--surface-selected)' : 'var(--white)', color: !station ? 'var(--brand-action)' : 'var(--text-title)',
              fontSize: 'var(--fs-sm)', fontWeight: !station ? 700 : 600, cursor: 'pointer',
            }}>全部</button>
            {STATION_OPTIONS.map((item) => {
              const on = station === item.value;
              const count = stationCounts[item.value] || 0;
              if (!count) return null;
              return (
                <button key={item.value} onClick={() => setStation(on ? null : item.value)} style={{
                  minHeight: 32, padding: '5px 10px', borderRadius: 'var(--radius-pill)',
                  border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
                  background: on ? 'var(--surface-selected)' : 'var(--white)', color: on ? 'var(--brand-action)' : 'var(--text-title)',
                  fontSize: 'var(--fs-sm)', fontWeight: on ? 700 : 600, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                  <PinIcon on={on} />
                  <span>{item.label}</span>
                  <span style={{ fontSize: 10, color: on ? 'var(--brand-action)' : 'var(--text-tertiary,#9aa3b2)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visibleDevices.length ? visibleDevices.map((device) => {
            const on = device.id === currentId;
            const blocked = isBlocked ? isBlocked(device) : false;
            return (
              <button key={device.id} onClick={() => { if (!blocked) onSelect(device); }} disabled={blocked} style={{
                width: '100%', minHeight: 58, padding: '10px 12px', borderRadius: 'var(--radius-md)',
                border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
                background: on ? 'var(--surface-selected)' : blocked ? 'var(--surface-sunken,#f5f6f8)' : 'var(--white)', cursor: blocked ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, textAlign: 'left', opacity: blocked ? 0.6 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {blocked
                    ? <span style={{ width: 20, height: 20, flex: 'none', borderRadius: '50%', border: '1.5px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-placeholder)' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18 M6 6l12 12"/></svg></span>
                    : <RadioMark on={on} />}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 'var(--fs-base)', fontWeight: 650, color: on ? 'var(--brand-action)' : 'var(--text-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.name}</span>
                      <CollectBadge method={device.method} size="sm" />
                    </div>
                    <div style={{ marginTop: 3, fontSize: 'var(--fs-xs)', color: blocked ? 'var(--status-pending-fg,#97640f)' : 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {blocked ? (blockedHint || '未配置采集关系 · 请先在数采「设备采集配置」维护') : device.visual ? '不连接设备 · 检测员现场目测判定' : `${device.code} · ${device.model}`}
                    </div>
                  </div>
                </div>
              </button>
            );
          }) : (
            <div style={{ minHeight: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
              当前筛选下暂无可选设备
            </div>
          )}
        </div>
        <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--divider)' }}>
          <Button variant="secondary" block onClick={onClose}>取消</Button>
        </div>
      </div>
    </React.Fragment>
  );
}

export { DeviceSwitchDrawer };
