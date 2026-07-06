import React from 'react';
import { AppBar, Button, Card, CollectBadge, FieldRow, SearchBar } from '../design-system.js';
import { MOCK } from '../mock.js';
import {
  PHASES,
  createCollectCells,
  getMethodCapabilities,
  getRepeatCount,
  getSubItems,
  isFlowLocked,
  isFlowReturned,
  markCellFilled,
  markCellUploaded,
  normalizeDevice,
  summarizeCells,
  toCellMap,
  updateCell,
} from './collect-model.js';

/* 采集详情（L4·复合试验项）
   一个试验项含多个试验子项，每个子项绑定自己的设备、采集方式与字段。
   页面以试验子项为工作单元：切子项才切设备/字段，避免读数串设备。 */

const FIXED = { jg: '紧压绞合圆形' };
const BASE = { gs: 8, zj: 8.00, tdhd: 10.00, tk1: 13, dg1: 14, tk2: 15, dg2: 14, tk3: 13, dg3: 14, tk4: 15, dg4: 14, tk5: 13, dg5: 14 };
const DEC = { gs: 0, zj: 2, tdhd: 2, tk1: 1, dg1: 1, tk2: 1, dg2: 1, tk3: 1, dg3: 1, tk4: 1, dg4: 1, tk5: 1, dg5: 1 };
const DEMO_FLOWS = {
  normal: { node: '试验检测' },
  returned: { node: '试验检测', returned: true, returnReason: '绝缘厚度测量第 2 个点位与标准限值偏差较大，请复核后重新上传', returnedFrom: '数据审核', by: '张伟', role: '数据审核', at: '07-04 10:20' },
  locked: { node: '组内审核' },
};

function genVal(field, cellIndex) {
  if (FIXED[field.key]) return FIXED[field.key];
  if (field.multi) return Array.from({ length: field.multi }, (_, k) => (12 + k + cellIndex * 0.2).toFixed(1));
  const b = BASE[field.key];
  if (b == null) return '';
  const jit = b * 0.01 * (((cellIndex * 3 + field.key.length) % 5) - 2) / 2;
  return (b + jit).toFixed(DEC[field.key] ?? 2);
}

function CollectStructured({ ctx, onBack, onDone }) {
  const baseSubs = React.useMemo(() => getSubItems(ctx), [ctx]);
  const subs = baseSubs;

  // 复合试验项在 LIMS 层级绑定的设备池（多设备，来自各子项配置设备去重）
  const [devicePool, setDevicePool] = React.useState(() => dedupeDevices(baseSubs.map((sub) => enrichDevice(sub.device))));
  // 各子项当前指派使用的设备（检测员可手动指派/切换，null = 未指派）
  const [selectedDevices, setSelectedDevices] = React.useState(() => {
    const initial = {};
    baseSubs.forEach((sub) => { initial[sub.id] = enrichDevice(sub.device); });
    return initial;
  });
  const [deviceDrawerOpen, setDeviceDrawerOpen] = React.useState(false);

  const [activeSubId, setActiveSubId] = React.useState(subs[0]?.id || '');
  const [cells, setCells] = React.useState(() => toCellMap(createCollectCells(ctx, selectedDevices)));
  const [activeCellKey, setActiveCellKey] = React.useState('');
  const [busy, setBusy] = React.useState(null);
  const [demoFlow, setDemoFlow] = React.useState(null);
  const [deviceNotice, setDeviceNotice] = React.useState('');

  const flow = demoFlow ? DEMO_FLOWS[demoFlow] : (ctx.flow || ctx.item?.flow || DEMO_FLOWS.normal);
  const flowLocked = isFlowLocked(flow);
  const flowReturned = isFlowReturned(flow);
  const summary = summarizeCells(cells);

  const activeSub = subs.find((sub) => sub.id === activeSubId) || subs[0];
  const activeCells = React.useMemo(() => sortCells(Object.values(cells).filter((cell) => cell.subItemId === activeSub?.id)), [cells, activeSub?.id]);
  const activeCell = cells[activeCellKey] || activeCells[0];
  const activeAssigned = selectedDevices[activeSub?.id] || null;
  const hasAssignment = !!activeAssigned;
  const activeDevice = activeAssigned || normalizeDevice(null);
  const method = hasAssignment ? (activeDevice.method || 'manual') : null;
  const caps = getMethodCapabilities(method, ctx.ocrVerified !== false);
  const mainTimes = Math.max(1, ...subs.map((sub) => Object.values(cells).filter((cell) => cell.subItemId === sub.id).length));

  function deviceHasData(deviceId) {
    return Object.values(cells).some((cell) => cell.deviceId === deviceId && cell.status !== 'idle');
  }

  React.useEffect(() => {
    if (!activeSub && subs[0]) setActiveSubId(subs[0].id);
  }, [activeSub, subs]);

  React.useEffect(() => {
    if (!activeCells.length) {
      setActiveCellKey('');
      return;
    }
    if (!activeCellKey || !activeCells.some((cell) => cell.key === activeCellKey)) {
      setActiveCellKey(activeCells[0].key);
    }
  }, [activeCells, activeCellKey]);

  function fillValues(sub, cell) {
    const index = cellIndexFor(cell);
    const vals = {};
    sub.fields.forEach((field) => { vals[field.key] = genVal(field, index); });
    return vals;
  }

  function captureSub(sub) {
    if (!sub || flowLocked || !selectedDevices[sub.id]) return;
    setBusy('all-' + sub.id);
    setTimeout(() => {
      setCells((prev) => {
        let next = prev;
        const device = selectedDevices[sub.id] || sub.device;
        sortCells(Object.values(prev).filter((cell) => cell.subItemId === sub.id)).forEach((cell) => {
          if (cell.status !== 'uploaded' || flowReturned) {
            next = markCellFilled(next, cell.key, fillValues(sub, cell), { deviceId: device.id, source: device.method || sub.method });
          }
        });
        return next;
      });
      setBusy(null);
    }, method === 'external' ? 850 : 1050);
  }

  function collectOne(sub, cell) {
    if (!sub || !cell || flowLocked || !selectedDevices[sub.id]) return;
    setBusy('c-' + cell.key);
    setTimeout(() => {
      const device = selectedDevices[sub.id] || sub.device;
      setCells((prev) => {
        let next = markCellFilled(prev, cell.key, fillValues(sub, cell), { deviceId: device.id, source: device.method || sub.method });
        if (method === 'ocr') {
          next = updateCell(next, cell.key, (cur) => ({
            ...cur,
            attachments: [{ id: Date.now() + '_ocr', kind: 'photo' }],
          }));
        }
        return next;
      });
      setBusy(null);
    }, method === 'ble' ? 1100 : 900);
  }

  function setField(cellKey, field, value, idx) {
    if (flowLocked) return;
    const cell = cells[cellKey];
    if (!cell || (cell.status === 'uploaded' && !flowReturned)) return;
    setCells((prev) => updateCell(prev, cellKey, (cur) => {
      const old = cur.vals[field.key];
      const vals = { ...cur.vals };
      if (idx != null) {
        const arr = Array.isArray(old) ? old.slice() : [];
        arr[idx] = value;
        vals[field.key] = arr;
      } else {
        vals[field.key] = value;
      }
      return {
        ...cur,
        vals,
        status: 'filled',
        uploadedAt: null,
        collectedAt: cur.collectedAt || '2026-07-04 12:00:00',
      };
    }));
  }

  function uploadCell(cellKey) {
    if (flowLocked) return;
    setBusy('up-' + cellKey);
    setTimeout(() => {
      setCells((prev) => markCellUploaded(prev, cellKey));
      setBusy(null);
    }, 700);
  }

  function uploadAll() {
    if (flowLocked) return;
    setBusy('upload-all');
    setTimeout(() => {
      setCells((prev) => {
        let next = prev;
        Object.values(prev).forEach((cell) => {
          if (cell.status === 'filled' || cell.status === 'failed') next = markCellUploaded(next, cell.key);
        });
        return next;
      });
      setBusy(null);
    }, 900);
  }

  function reset() {
    if (flowLocked) return;
    setCells((prev) => Object.fromEntries(Object.values(prev).map((cell) => [
      cell.key,
      cell.status === 'uploaded' ? cell : { ...cell, status: 'idle', vals: {}, attachments: [], uploadedAt: null, collectedAt: null },
    ])));
  }

  function addAttach(cellKey, kind = 'upload') {
    if (flowLocked) return;
    setCells((prev) => updateCell(prev, cellKey, (cell) => ({
      ...cell,
      attachments: [...cell.attachments, { id: Date.now() + '_' + Math.random().toString(36).slice(2, 6), kind }],
    })));
  }

  function removeAttach(cellKey, id) {
    if (flowLocked) return;
    setCells((prev) => updateCell(prev, cellKey, (cell) => ({
      ...cell,
      attachments: cell.attachments.filter((item) => item.id !== id),
    })));
  }

  // 为当前子项指派设备池里的某台设备（B2：检测员手动指派）
  function assignDevice(device) {
    if (!activeSub || flowLocked) return;
    if (activeAssigned && activeAssigned.id === device.id) return;
    const collected = activeCells.some((cell) => cell.status !== 'idle');
    setSelectedDevices((prev) => ({ ...prev, [activeSub.id]: device }));
    setCells((prev) => Object.fromEntries(Object.values(prev).map((cell) => {
      if (cell.subItemId !== activeSub.id || cell.status !== 'idle') return [cell.key, cell];
      return [cell.key, { ...cell, deviceId: device.id, source: device.method }];
    })));
    setDeviceNotice(collected ? '该子项已采集的数据保留原采集设备，新采集的数据将使用当前指派设备' : '');
  }

  // 从设备池移除设备（E：有数据禁止直接删，需先清空/退回）
  function removeDevice(device) {
    if (flowLocked) return;
    if (deviceHasData(device.id)) {
      setDeviceNotice(`「${device.name}」已有采集数据，请先清空或退回该设备数据后再删除`);
      return;
    }
    setDevicePool((prev) => prev.filter((item) => item.id !== device.id));
    setSelectedDevices((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((subId) => { if (next[subId] && next[subId].id === device.id) next[subId] = null; });
      return next;
    });
    setDeviceNotice('');
  }

  // 抽屉多选确认：更新设备池；被移除的设备若已指派给某子项则清空其指派
  function confirmDeviceDrawer(nextDevices) {
    const ids = new Set(nextDevices.map((d) => d.id));
    setDevicePool(nextDevices);
    setSelectedDevices((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((subId) => { if (next[subId] && !ids.has(next[subId].id)) next[subId] = null; });
      return next;
    });
    setDeviceDrawerOpen(false);
    setDeviceNotice('');
  }

  if (!subs.length) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="检测任务" onBack={onBack} />
        <div style={{ padding: 'var(--gap-page)' }}>
          <ConfigError title="试验子项配置异常" body="当前试验项缺少试验子项配置，请在 Web 后台维护后再采集。" />
        </div>
      </div>
    );
  }

  const deviceMissing = !hasAssignment;
  const methodMissing = hasAssignment && !method;
  const fieldMissing = !activeSub.fields.length;
  const methodHint = !hasAssignment
    ? '请先为当前子项指派设备后再采集'
    : ({
        auto: '设备直连 · 上位机算毕整批写库，点下方「一键采集」整批回填，不可手输',
        ocr: caps.ocrReady ? '拍照识别 · 逐条拍摄仪器读数屏自动识别，识别结果可校正' : '识别规则未通过验证，已回退手工录入',
        ble: '蓝牙数显卡尺 · 逐相连接同步读数，也可手动输入；可附参照图',
        manual: '单机设备 · 读数由检测员手工录入',
        external: '外部程序采集 · 数据由工业平板代采写库，可查看已采数据或补录',
      }[method] || '缺少采集方式，请先维护设备采集配置');
  const allCurrentSubFilled = activeCells.length > 0 && activeCells.every((cell) => cell.status !== 'idle');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', position: 'relative' }}>
      <AppBar title="检测任务" onBack={onBack} />
      <Stamp state={summary.inspectState} />

      <div style={{ padding: 'var(--gap-page)', paddingBottom: 0 }}>
        <FlowBanner flow={flow} locked={flowLocked} returned={flowReturned} />
        <Section title="基础信息" icon="info">
          <Grid items={[
            ['样品编号', ctx.sample.code],
            ['样品名称', ctx.sample.name],
            ['试验名称', ctx.item.name],
            ['试验次数', `${mainTimes} 次`],
          ]} />
          <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary,#9aa3b2)' }}>
            含 {subs.length} 个试验子项 · 采集单元 {summary.total} 个 · 试验次数随任务下发，不可修改
          </div>
        </Section>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Section title="设备信息" icon="cpu" extra={<CollectBadge method={method || 'manual'} size="sm" />}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {devicePool.map((device) => {
              const on = hasAssignment && device.id === activeDevice.id;
              const locked = deviceHasData(device.id);
              return (
                <span key={device.id} style={{
                  display: 'inline-flex', alignItems: 'center', borderRadius: 'var(--radius-pill)',
                  border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
                  background: on ? 'var(--surface-selected)' : 'var(--white)',
                }}>
                  <button onClick={() => assignDevice(device)} disabled={flowLocked} title="指派给当前子项" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32, maxWidth: 190,
                    padding: '6px 4px 6px 12px', border: 'none', background: 'transparent',
                    color: on ? 'var(--brand-action)' : 'var(--text-body)', fontSize: 'var(--fs-sm)', fontWeight: on ? 600 : 400,
                    cursor: flowLocked ? 'not-allowed' : 'pointer',
                  }}>
                    <CollectDot method={device.method} on={on} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.name}</span>
                  </button>
                  {!flowLocked && (
                    <button onClick={() => removeDevice(device)} title={locked ? '已有采集数据，需先清空或退回后再删除' : '移除设备'} style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, marginRight: 5,
                      border: 'none', borderRadius: '50%', background: 'transparent',
                      color: locked ? 'var(--text-placeholder)' : 'var(--text-tertiary,#9aa3b2)', cursor: 'pointer', fontSize: 15, lineHeight: 1,
                    }}>×</button>
                  )}
                </span>
              );
            })}
            {!flowLocked && (
              <Button variant="secondary" size="sm" icon={<SwapIcon />} onClick={() => setDeviceDrawerOpen(true)}>切换设备</Button>
            )}
          </div>
          <Grid items={[
            ['当前子项', activeSub.name],
            ['检测设备', hasAssignment ? activeDevice.name : '未指派'],
            ['设备编号', hasAssignment ? activeDevice.code : '—'],
            ['设备型号', hasAssignment ? activeDevice.model : '—'],
          ]} />
          <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 5, lineHeight: 1.5 }}>
            <InfoIcon />
            <span>该试验项绑定 {devicePool.length} 台设备；点设备胶囊为当前子项指派，「切换设备」按工位增删设备，删除已采数据的设备需先清空或退回</span>
          </div>
          {deviceNotice && (
            <div style={{ marginTop: 8, fontSize: 'var(--fs-xs)', color: 'var(--status-pending-fg,#97640f)', lineHeight: 1.5 }}>{deviceNotice}</div>
          )}
        </Section>

        {(deviceMissing || methodMissing || fieldMissing) && (
          <ConfigError
            title={deviceMissing ? '当前子项未指派设备' : '当前子项配置异常'}
            body={deviceMissing ? '当前子项尚未指派设备，请点上方设备胶囊指派，或点「切换设备」按工位添加设备。' : methodMissing ? '缺少设备采集方式，请先维护采集方式。' : '缺少试验字段模板，请先维护字段配置。'}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GridIcon />
              <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>试验子项</span>
            </div>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>已上传 {summary.uploaded}/{summary.total}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, subs.length)}, minmax(0, 1fr))`, gap: 8 }}>
            {subs.map((sub) => {
              const on = sub.id === activeSub.id;
              const subSummary = summary.bySub[sub.id] || { label: '待采集', uploaded: 0, total: 0, state: 'pending' };
              return (
                <button key={sub.id} onClick={() => { setActiveSubId(sub.id); setDeviceNotice(''); }} style={{
                  minHeight: 62, padding: '9px 10px', borderRadius: 'var(--radius-md)', border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
                  background: on ? 'var(--surface-selected)' : 'var(--white)', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 5,
                }}>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: on ? 'var(--brand-action)' : 'var(--text-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 'var(--fs-xs)', color: statusColor(subSummary.state) }}>
                    <span>{subSummary.label}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{subSummary.uploaded}/{subSummary.total}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', margin: '0 2px', lineHeight: 1.5 }}>{methodHint}</div>

        {caps.canBatch && !allCurrentSubFilled && !flowLocked && !fieldMissing && (
          <Card padding="18px">
            <div style={{ textAlign: 'center' }}>
              {busy === 'all-' + activeSub.id
                ? <div style={{ color: 'var(--brand-action)' }}><Spinner /><div style={{ fontSize: 'var(--fs-sm)', marginTop: 10 }}>{method === 'external' ? '正在拉取平板程序已采数据…' : '正在从数据库整批取值…'}</div></div>
                : <Button size="lg" onClick={() => captureSub(activeSub)}>{method === 'external' ? '查看已采数据' : `一键采集（${activeCells.length} 个单元）`}</Button>}
            </div>
          </Card>
        )}

        <Card padding="0">
          <div style={{ display: 'flex', minHeight: 292 }}>
            <div style={{ width: 144, flex: 'none', borderRight: '1px solid var(--divider)', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', overflow: 'auto', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}>
              {activeCells.map((cell) => {
                const on = activeCell?.key === cell.key;
                return (
                  <button key={cell.key} onClick={() => setActiveCellKey(cell.key)} style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '13px 11px', cursor: 'pointer', textAlign: 'left',
                    border: 'none', borderBottom: '1px solid var(--divider)',
                    borderLeft: `3px solid ${on ? 'var(--brand-action)' : 'transparent'}`,
                    background: on ? 'var(--white)' : 'transparent',
                  }}>
                    <TimeStatusIcon state={cell.status} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-base)', fontWeight: on ? 700 : 600, color: on ? 'var(--brand-action)' : 'var(--text-title)' }}>
                        {cell.phase && <span style={{ width: 9, height: 9, borderRadius: '50%', background: phaseColor(cell.phase), flex: 'none' }} />}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cellLabel(activeSub, cell)}</span>
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: cell.status === 'uploaded' ? 'var(--status-done-fg,#1b8a5a)' : cell.status === 'failed' ? 'var(--danger,#e23b3b)' : 'var(--text-tertiary,#9aa3b2)', whiteSpace: 'nowrap' }}>
                        {statusText(cell.status)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1, minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activeCell && (
                <CellEditor
                  sub={activeSub}
                  cell={activeCell}
                  method={method}
                  caps={caps}
                  busy={busy}
                  flowLocked={flowLocked}
                  flowReturned={flowReturned}
                  onCollect={() => collectOne(activeSub, activeCell)}
                  onManualFill={() => setCells((prev) => markCellFilled(prev, activeCell.key, fillValues(activeSub, activeCell), { deviceId: activeDevice.id, source: method }))}
                  onChange={setField}
                  onUpload={uploadCell}
                  onAddAttach={addAttach}
                  onRemoveAttach={removeAttach}
                />
              )}
            </div>
          </div>
        </Card>

        <ConclusionCard sub={activeSub} cells={activeCells} />

        <div style={{ height: 8 }} />
      </div>

      <div style={{ position: 'absolute', left: 12, bottom: 88, zIndex: 60, display: 'flex', alignItems: 'center', gap: 4, padding: '5px 7px', borderRadius: 'var(--radius-pill)', background: 'rgba(20,30,55,0.86)', boxShadow: 'var(--shadow-lg)' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, padding: '0 4px' }}>演示·流程</span>
        {[['normal', '正常'], ['returned', '退回'], ['locked', '锁定']].map(([key, label]) => {
          const cur = demoFlow || (flowLocked ? 'locked' : flowReturned ? 'returned' : 'normal');
          const on = cur === key;
          return <button key={key} onClick={() => setDemoFlow(key)} style={{ border: 'none', cursor: 'pointer', padding: '4px 11px', borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 600, background: on ? 'var(--white)' : 'transparent', color: on ? 'var(--text-title)' : 'rgba(255,255,255,0.85)' }}>{label}</button>;
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, padding: 'var(--gap-page)', borderTop: '1px solid var(--border-default)', background: 'var(--white)' }}>
        {!flowLocked && <Button variant="secondary" block onClick={reset}>重置全部</Button>}
        <Button block disabled={flowLocked ? false : (!summary.allUploaded && (summary.pendingUpload === 0 || busy === 'upload-all'))}
          onClick={flowLocked ? onBack : (summary.allUploaded ? onDone : uploadAll)}>
          {flowLocked ? '返回（数据已锁定）'
            : busy === 'upload-all' ? '上传中…'
            : summary.allUploaded ? '完成并退出'
            : `上传全部（${summary.pendingUpload}/${summary.total}）`}
        </Button>
      </div>

      {deviceDrawerOpen && (
        <DeviceDrawer
          pool={devicePool}
          defaultStation={ctx.stationId}
          deviceHasData={deviceHasData}
          onConfirm={confirmDeviceDrawer}
          onClose={() => setDeviceDrawerOpen(false)}
        />
      )}
    </div>
  );
}

/* 切换设备抽屉：底部弹出 · 按工位筛选（默认当前工位）· 多选设备 · 已采数据设备不可取消 */
function DeviceDrawer({ pool, defaultStation, deviceHasData, onConfirm, onClose }) {
  const stationTabs = [
    { id: '__all', name: '全部' },
    ...MOCK.stations.map((s) => ({ id: s.id, name: s.name })),
    { id: '__off', name: '非工位设备' },
  ];
  const hasStation = MOCK.stations.some((s) => s.id === defaultStation);
  const [station, setStation] = React.useState(hasStation ? defaultStation : '__all');
  const [checked, setChecked] = React.useState(() => new Set(pool.map((d) => d.id)));
  const [q, setQ] = React.useState('');
  const poolById = React.useMemo(() => new Map(pool.map((d) => [d.id, d])), [pool]);

  const ql = q.trim().toLowerCase();
  const list = MOCK.devices.filter((d) => {
    if (station === '__off') { if (d.station) return false; }
    else if (station !== '__all') { if (d.station !== station) return false; }
    if (ql && !((d.name || '').toLowerCase().includes(ql) || (d.code || '').toLowerCase().includes(ql))) return false;
    return true;
  });

  function toggle(device) {
    if (deviceHasData(device.id)) return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(device.id)) next.delete(device.id); else next.add(device.id);
      return next;
    });
  }

  function confirm() {
    const result = [];
    // 先保留原设备池里仍被选中的（维持顺序与已配置的显示名称），再追加新增设备
    pool.forEach((d) => { if (checked.has(d.id)) result.push(d); });
    checked.forEach((id) => {
      if (poolById.has(id)) return;
      const md = MOCK.devices.find((d) => d.id === id);
      if (md) result.push(enrichDevice(md, md.method));
    });
    onConfirm(result);
  }

  return (
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet" onClick={(event) => event.stopPropagation()} style={{ maxHeight: '84%', display: 'flex', flexDirection: 'column' }}>
        <div className="sheet-handle" />
        <div className="sheet-title-row">
          <span className="sheet-title">切换设备</span>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>已选 {checked.size} 台</span>
        </div>
        <div style={{ padding: '0 20px 10px' }}>
          <SearchBar value={q} onChange={(event) => setQ(event.target.value)} placeholder="请输入设备名称、编号搜索" />
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 12px' }}>
          {stationTabs.map((tab) => {
            const on = tab.id === station;
            return (
              <button key={tab.id} onClick={() => setStation(tab.id)} style={{
                flex: 'none', padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
                background: on ? 'var(--surface-selected)' : 'var(--white)',
                color: on ? 'var(--brand-action)' : 'var(--text-body)',
                fontSize: 'var(--fs-sm)', fontWeight: on ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{tab.name}</button>
            );
          })}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.length ? list.map((device) => {
            const on = checked.has(device.id);
            const locked = deviceHasData(device.id);
            const name = poolById.get(device.id)?.name || device.name;
            return (
              <button key={device.id} onClick={() => toggle(device)} disabled={locked} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--radius-md)',
                border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
                background: on ? 'var(--surface-selected)' : 'var(--white)',
                cursor: locked ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: locked ? 0.75 : 1,
              }}>
                <CheckBox on={on} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <CollectBadge method={device.method} size="sm" />
                  </div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                    编号 {device.code} · 型号 {device.model} · {stationLabel(device.station)}{locked ? ' · 已采数据' : ''}
                  </div>
                </div>
              </button>
            );
          }) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>该筛选下暂无可选设备</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '12px 20px 0' }}>
          <Button variant="secondary" block onClick={onClose}>取消</Button>
          <Button block onClick={confirm}>确定（{checked.size}）</Button>
        </div>
      </div>
    </div>
  );
}

function CheckBox({ on }) {
  return (
    <span style={{
      width: 20, height: 20, flex: 'none', borderRadius: 6,
      border: '1.5px solid ' + (on ? 'var(--brand-action)' : 'var(--border-strong)'),
      background: on ? 'var(--brand-action)' : 'var(--white)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {on && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-9" /></svg>}
    </span>
  );
}

function CellEditor({ sub, cell, method, caps, busy, flowLocked, flowReturned, onCollect, onManualFill, onChange, onUpload, onAddAttach, onRemoveAttach }) {
  const busyCell = busy === 'c-' + cell.key;
  const uploading = busy === 'up-' + cell.key;
  const filled = cell.status === 'filled' || cell.status === 'uploaded' || cell.status === 'failed';
  const readOnly = flowLocked || caps.isReadOnlySource || (cell.status === 'uploaded' && !flowReturned);
  const canEdit = !readOnly && caps.canEdit;
  const canUpload = !flowLocked && (cell.status === 'filled' || cell.status === 'failed');

  return (
    <React.Fragment>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>测量值{cell.phase ? ` · ${cell.phase}相` : ''}</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {method === 'ble' && !flowLocked && cell.status !== 'uploaded' && <Button onClick={onCollect} disabled={busyCell}>{busyCell ? '连接中…' : '连接采集'}</Button>}
          {method === 'ocr' && !flowLocked && cell.status !== 'uploaded' && <Button onClick={onCollect} disabled={busyCell}>{busyCell ? '识别中…' : '拍照识别'}</Button>}
          {method === 'manual' && !filled && !flowLocked && <Button variant="secondary" onClick={onManualFill}>录入本相读数</Button>}
        </div>
      </div>

      {busyCell
        ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--brand-action)' }}><Spinner /><div style={{ fontSize: 'var(--fs-sm)', marginTop: 10 }}>{method === 'ocr' ? '正在识别读数…' : '正在连接设备…'}</div></div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sub.fields.map((field) => field.multi
              ? <MultiField key={field.key} field={field} values={cell.vals[field.key]} readOnly={!canEdit}
                  onChange={(idx, val) => onChange(cell.key, field, val, idx)} />
              : <FieldRow key={field.key} label={field.label} unit={field.unit} required={field.required !== false}
                  value={cell.vals[field.key] || ''} placeholder={filled ? '' : '待采集'} readOnly={!canEdit}
                  onChange={(event) => onChange(cell.key, field, event.target.value)} />)}

            <MethodNote method={method} readOnly={readOnly} />

            {caps.canAttach && filled && (
              <AttachmentList
                cell={cell}
                method={method}
                flowLocked={flowLocked}
                onAdd={() => onAddAttach(cell.key, method === 'ocr' ? 'photo' : 'upload')}
                onRemove={(id) => onRemoveAttach(cell.key, id)}
              />
            )}

            {filled && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 2, paddingTop: 12, borderTop: '1px dashed var(--divider)' }}>
                {cell.status === 'uploaded'
                  ? <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-done-fg,#1b8a5a)', display: 'flex', alignItems: 'center', gap: 5 }}><CheckIcon />本单元已上传</span>
                  : flowLocked
                  ? <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}><LockIcon />数据已锁定</span>
                  : <Button variant="secondary" onClick={() => onUpload(cell.key)} disabled={uploading}>{uploading ? '上传中…' : cell.status === 'failed' ? '重试上传' : '确认并上传本单元'}</Button>}
              </div>
            )}
          </div>}
    </React.Fragment>
  );
}

function ConclusionCard({ sub, cells }) {
  const rows = sub.phased
    ? PHASES.map((phase) => ({ key: phase.value, label: `结论（${phase.value}相）`, cells: cells.filter((cell) => cell.phase === phase.value), color: phase.color }))
    : [{ key: 'single', label: '结论', cells, color: null }];

  return (
    <Card padding="0">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--divider)' }}>
        <TrendIcon />
        <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>结论</span>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((row) => {
          const show = row.cells.some((cell) => cell.status === 'uploaded');
          const ok = sub.id !== 'struct-insulation-thickness';
          return (
            <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <label style={{ width: 110, flex: 'none', fontSize: 'var(--fs-base)', color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {row.color && <span style={{ width: 9, height: 9, borderRadius: '50%', background: row.color, flex: 'none' }} />}
                <span>{row.label}</span>
              </label>
              <div style={{ flex: 1, height: 44, padding: '0 12px', display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--surface-sunken,#f5f6f8)', fontSize: 'var(--fs-base)', color: show ? (ok ? 'var(--status-done-fg,#1b8a5a)' : 'var(--danger,#e23b3b)') : 'var(--text-placeholder)', fontWeight: show ? 600 : 400 }}>
                {show ? (ok ? '合格' : '不合格') : (sub.phased ? '本相上传后回显' : '上传后回显')}
              </div>
            </div>
          );
        })}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <InfoIcon />
          <span>{sub.phased ? '相同相别的测量数据合并判定为一个结论；' : ''}结论不在本端录入，由 LIMS 按计算与结果判定配置自动回显</span>
        </div>
      </div>
    </Card>
  );
}

function MultiField({ field, values, readOnly, onChange }) {
  const arr = Array.isArray(values) ? values : [];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <label style={{ width: 110, flex: 'none', fontSize: 'var(--fs-base)', color: 'var(--text-body)', display: 'flex', gap: 2, paddingTop: 11 }}>
        {field.required !== false && <span style={{ color: 'var(--danger)' }}>*</span>}<span>{field.label}{field.unit ? `（${field.unit}）` : ''}</span>
      </label>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {Array.from({ length: field.multi }, (_, k) => (
          <div key={k} style={{ position: 'relative', minWidth: 0 }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--text-placeholder)', pointerEvents: 'none' }}>{k + 1}</span>
            <input value={arr[k] || ''} readOnly={readOnly} onChange={(event) => onChange(k, event.target.value)} placeholder="—"
              style={{ width: '100%', height: 40, padding: '0 8px 0 22px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: readOnly ? 'var(--surface-sunken,#f5f6f8)' : 'var(--white)', fontSize: 'var(--fs-sm)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-title)', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AttachmentList({ cell, method, flowLocked, onAdd, onRemove }) {
  const title = method === 'ocr' ? '识别参照图' : '参照图';
  return (
    <div style={{ paddingTop: 10, borderTop: '1px dashed var(--divider)' }}>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 8 }}>{title} <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-placeholder)' }}>· 随数据一起上传归档</span></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {cell.attachments.map((item) => (
          <div key={item.id} style={{ position: 'relative', width: 76, height: 76, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-default)', background: 'repeating-linear-gradient(135deg,#eef1f5 0 8px,#e6eaef 8px 16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <CameraIcon />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono,monospace)' }}>{item.kind === 'photo' ? '拍照' : '上传'}</span>
            {!flowLocked && <button onClick={() => onRemove(item.id)} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>}
          </div>
        ))}
        {!flowLocked && !(method === 'ocr' && cell.attachments.length >= 1) && (
          <button onClick={onAdd} style={{ width: 76, height: 76, borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)', background: 'var(--bg-app)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <PlusIcon />
            <span style={{ fontSize: 10 }}>{method === 'ocr' ? '拍照识别' : '拍照/上传'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

function MethodNote({ method, readOnly }) {
  const text = {
    auto: '设备直采数据，不可修改',
    ble: '蓝牙同步后可人工校正；已上传数据需退回后修改',
    manual: '单机设备无通讯接口，读数手工录入',
    ocr: '识别结果可校正，参照图随数据归档',
    external: '外部程序已采数据可在本端补录或矫正',
  }[method];
  if (!text) return null;
  return (
    <div style={{ fontSize: 'var(--fs-xs)', color: readOnly ? 'var(--text-secondary)' : methodColor(method), display: 'flex', alignItems: 'center', gap: 5, lineHeight: 1.5 }}>
      <InfoIcon />
      <span>{text}</span>
    </div>
  );
}

function ConfigError({ title, body }) {
  return (
    <Card padding="14px 16px">
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--danger,#e23b3b)' }}>
        <AlertIcon />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{body}</div>
        </div>
      </div>
    </Card>
  );
}

function FlowBanner({ flow, locked, returned }) {
  if (!locked && !returned) return null;
  if (locked) {
    return (
      <div style={{ display: 'flex', gap: 10, padding: '12px 14px', marginBottom: 14, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border-strong)' }}>
        <LockIcon />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-title)' }}>
            数据已锁定
            <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, padding: '1px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--gray-200,#e5e8ee)', color: 'var(--text-secondary)' }}>当前流程：{flow.node}</span>
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.55 }}>流程已流转至「{flow.node}」节点，检测员不可修改数据。如需修改，请联系审核人将流程退回至「试验检测」节点。</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 10, padding: '12px 14px', marginBottom: 14, borderRadius: 'var(--radius-md)', background: 'rgba(232,169,58,0.10)', border: '1px solid var(--status-pending,#e8a93a)' }}>
      <ReturnIcon />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--status-pending-fg,#97640f)' }}>已退回至「试验检测」· 可修改后重新上传</div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-body)', marginTop: 4, lineHeight: 1.55 }}><span style={{ fontWeight: 600 }}>退回原因：</span>{flow.returnReason || '—'}</div>
        {(flow.by || flow.at || flow.returnedFrom) && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: 3 }}>退回人：{flow.by}{flow.role ? '（' + flow.role + '）' : ''}{flow.at ? ' · ' + flow.at : ''}{flow.returnedFrom ? ' · 来自「' + flow.returnedFrom + '」' : ''}</div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, extra, children }) {
  const paths = {
    info: 'M12 16v-4 M12 8h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    cpu: 'M4 4h16v16H4z M9 9h6v6H9z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 14h3 M1 9h3 M1 14h3',
  };
  return (
    <Card padding="0">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--divider)', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-action)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d={paths[icon]} /></svg>
          <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        </div>
        {extra}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </Card>
  );
}

function Grid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
      {items.map(([k, v], i) => (
        <div key={i} style={{ display: 'flex', gap: 8, fontSize: 'var(--fs-base)', minWidth: 0 }}>
          <span style={{ color: 'var(--text-secondary)', flex: 'none' }}>{k}</span>
          <span title={v} style={{ color: 'var(--text-title)', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function Stamp({ state }) {
  const C = { todo: { label: '未检测', color: '#E8A93A', fill: 'rgba(245,196,99,0.14)' }, doing: { label: '检测中', color: '#5B95E8', fill: 'rgba(127,176,242,0.16)' }, done: { label: '已检测', color: '#4FB97E', fill: 'rgba(134,214,166,0.16)' } }[state];
  const cx = 110, cy = 110, R = 100;
  const stars = Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2 - Math.PI / 2;
    const r = R - 9;
    return <circle key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={i % 2 ? 2.2 : 3.4} fill={C.color} />;
  });
  return (
    <div aria-label={C.label} style={{ position: 'absolute', top: 46, right: 8, width: 120, height: 120, zIndex: 6, pointerEvents: 'none', opacity: 0.9, transform: 'rotate(-15deg)' }}>
      <svg viewBox="0 0 220 220" width="120" height="120">
        <circle cx={cx} cy={cy} r={R} fill={C.fill} stroke={C.color} strokeWidth="6" />
        <circle cx={cx} cy={cy} r={R - 13} fill="none" stroke={C.color} strokeWidth="2.5" />
        {stars}
        <text x={cx} y={cy + 6} textAnchor="middle" dominantBaseline="middle" transform={`rotate(-8 ${cx} ${cy})`} fill={C.color} fontSize="60" fontWeight="900" letterSpacing="1" style={{ fontFamily: 'var(--font-sans, sans-serif)' }}>{C.label}</text>
      </svg>
    </div>
  );
}

function sortCells(list) {
  const phaseRank = { '红': 0, '黄': 1, '绿': 2 };
  return list.slice().sort((a, b) => (phaseRank[a.phase] ?? 9) - (phaseRank[b.phase] ?? 9) || a.repeatIndex - b.repeatIndex);
}

function cellIndexFor(cell) {
  const phaseRank = { '红': 0, '黄': 1, '绿': 2 };
  return (phaseRank[cell.phase] ?? 0) * 10 + cell.repeatIndex;
}

function cellLabel(sub, cell) {
  if (cell.phase) {
    const repeats = getRepeatCount(sub);
    return repeats > 1 ? `${cell.phase}相 · 第${cell.repeatIndex + 1}次` : `${cell.phase}相`;
  }
  return `第 ${cell.repeatIndex + 1} 次`;
}

// 规范化设备并补齐所在工位（工位来自 Web 设备管理，按设备 id 回查）
function enrichDevice(device, method) {
  const base = normalizeDevice(device, method);
  const ref = MOCK.devices.find((d) => d.id === base.id);
  return { ...base, station: device?.station ?? ref?.station ?? null };
}

function dedupeDevices(devices) {
  const seen = new Set();
  return devices.filter((device) => {
    if (seen.has(device.id)) return false;
    seen.add(device.id);
    return true;
  });
}

function stationLabel(id) {
  if (!id) return '非工位设备';
  return MOCK.stations.find((s) => s.id === id)?.name || '未知工位';
}

function statusText(status) {
  return { idle: '待采集', filled: '待上传', uploaded: '已上传', failed: '上传失败' }[status] || '待采集';
}

function statusColor(state) {
  return { uploaded: 'var(--status-done-fg,#1b8a5a)', doing: 'var(--brand-action)', pending: 'var(--text-secondary)' }[state] || 'var(--text-secondary)';
}

function phaseColor(phase) {
  return PHASES.find((item) => item.value === phase)?.color || 'var(--brand-action)';
}

function methodColor(method) {
  return { auto: 'var(--collect-auto,#1d54c4)', ble: 'var(--collect-ble,#0a8a96)', manual: 'var(--collect-manual,#828c9c)', ocr: 'var(--collect-ocr,#b06a00)', external: 'var(--collect-ble,#0a8a96)' }[method] || 'var(--text-secondary)';
}

function CollectDot({ method, on }) {
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: methodColor(method), flex: 'none', opacity: on ? 1 : 0.7 }} />;
}

function TimeStatusIcon({ state }) {
  if (state === 'uploaded') return <CheckCircleIcon />;
  if (state === 'failed') return <AlertCircleIcon />;
  return <PendingIcon />;
}

function Spinner() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'lk-spin 0.9s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

function InfoIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4 M12 8h.01"/></svg>;
}
function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-action)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z"/></svg>;
}
function TrendIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-action)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
}
function CheckCircleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-done-fg,#1b8a5a)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
}
function PendingIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-pending,#e8a93a)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4 M12 16h.01"/></svg>;
}
function AlertCircleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger,#e23b3b)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4 M12 16h.01"/></svg>;
}
function AlertIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4 M12 16h.01"/></svg>;
}
function LockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function ReturnIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-pending,#e8a93a)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><path d="M9 14 4 9l5-5"/><path d="M4 9h11a4 4 0 0 1 0 8h-1"/></svg>;
}
function CameraIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></svg>;
}
function PlusIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
}
function SwapIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>;
}

export { CollectStructured };
