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
  resolveInspectStampState,
  summarizeCells,
  toCellMap,
  updateCell,
} from './collect-model.js';
import { EnvInfoSection, getOcrReferenceAttachments, mergeRecordEnvVals, RecordEnvFields, resolveEnvMock } from './collect-env.jsx';
import { AnnotatedWrapper } from '../annotation/index.js';
import { SampleLabelQrLink } from './SampleLabelQr.jsx';
import { useTestItemTiming } from './useTestItemTiming.js';
import { TestItemTimingSection } from '../../components/data-display/TestItemTimingSection.jsx';
import { TimingToast } from '../../components/data-display/TimingToast.jsx';
import { OcrCaptureBar } from './OcrCaptureBar.jsx';
import { OcrImagePreview } from './OcrImagePreview.jsx';
import {
  clearScenarioFields, getAttachmentForScenario, getDefaultScenario, getPassedScenarios,
  mergeOcrFields, removeScenarioAttachment, sortAttachmentsByScenario, upsertScenarioAttachment,
} from './ocr-scenario.js';

/* 采集详情（L4·复合试验项 · 物资版 LIMS+数采）
   试验子项只决定采集字段与次数，设备作为当前采集资源独立切换。
   每条采集记录保存采集时使用的设备，避免后续换设备影响历史读数。
   轻量版 LIMS+数采无多试验子项，不进入本页。 */

const FIXED = { jg: '紧压绞合圆形', jsdbffs: '两层金属带间隙绕包' };
const BASE = { gs: 8, zj: 8.00, tdhd: 10.00, tk1: 13, dg1: 14, tk2: 15, dg2: 14, tk3: 13, dg3: 14, tk4: 15, dg4: 14, tk5: 13, dg5: 14, kzkd: 3.0, jdbs: 2, gdjx1: 1.2, gdjx2: 1.3, gdjx3: 1.1, gdjx4: 1.4, gdjx5: 1.2 };
const DEC = { gs: 0, zj: 2, tdhd: 2, tk1: 1, dg1: 1, tk2: 1, dg2: 1, tk3: 1, dg3: 1, tk4: 1, dg4: 1, tk5: 1, dg5: 1, kzkd: 1, jdbs: 0, gdjx1: 1, gdjx2: 1, gdjx3: 1, gdjx4: 1, gdjx5: 1 };
const DEMO_FLOWS = {
  normal: { node: '试验检测' },
  returned: { node: '试验检测', returned: true, returnReason: '绝缘厚度测量第 2 个点位与标准限值偏差较大，请复核后重新上传', returnedFrom: '数据审核', by: '张伟', role: '数据审核', at: '07-04 10:20' },
  locked: { node: '组内审核' },
};
const DEVICE_ORDER = ['cal', 'mech', 'tmk'];
const CONDUCTOR_STRUCTURE_OPTIONS = ['实心导体', '非紧压绞合圆形', '紧压绞合圆形', '绞合成型'];
const STATION_OPTIONS = [
  { value: 'zy', label: '电缆制样工位' },
  { value: 'sz', label: '水煮试验工位' },
  { value: 'ny', label: '耐压工位' },
  { value: 'ld', label: '雷电冲击工位' },
  { value: 'rs', label: '电缆燃烧工位' },
  { value: 'by', label: '变压器工位' },
  { value: 'none', label: '未绑定工位' },
];
const DRAWER_MOCK_DEVICES = MOCK.drawerDevices;

function fillScenarioValues(sub, cell, fieldKeys) {
  const index = cellIndexFor(cell);
  const vals = {};
  (fieldKeys || []).forEach((key) => {
    const field = sub.fields.find((f) => f.key === key);
    if (field) vals[key] = genVal(field, index);
  });
  return vals;
}

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
  const configuredDevices = React.useMemo(() => sortDevicePool(uniqueDevices(
    baseSubs.flatMap((sub) => [sub.device, ...(sub.candidateDevices || [])])
  )), [baseSubs]);
  const deviceCatalog = React.useMemo(() => sortDevicePool(uniqueDevices([
    ...MOCK.devices.map((device) => enrichDevice(device, device.method)),
    ...DRAWER_MOCK_DEVICES.map((device) => enrichDevice(device, device.method)),
  ])), []);
  const [pooledDeviceIds, setPooledDeviceIds] = React.useState(() => configuredDevices.map((device) => device.id));
  const availableDevices = React.useMemo(
    () => deviceCatalog.filter((device) => pooledDeviceIds.includes(device.id)),
    [deviceCatalog, pooledDeviceIds]
  );
  const [selectedDevices, setSelectedDevices] = React.useState(() => {
    const initial = {};
    baseSubs.forEach((sub) => {
      const ref = configuredDevices.find((device) => device.id === sub.device?.id) || sub.device;
      initial[sub.id] = normalizeDevice(ref, sub.method);
    });
    return initial;
  });
  const [deviceDrawerOpen, setDeviceDrawerOpen] = React.useState(false);

  const [returnTouched, setReturnTouched] = React.useState(false);
  const [activeSubId, setActiveSubId] = React.useState(subs[0]?.id || '');
  const [cells, setCells] = React.useState(() => toCellMap(createCollectCells(ctx)));
  const [activeCellKey, setActiveCellKey] = React.useState('');
  const [busy, setBusy] = React.useState(null);
  const [demoFlow, setDemoFlow] = React.useState(null);
  const [deviceError, setDeviceError] = React.useState('');
  const [editCells, setEditCells] = React.useState({}); // 拍照识别：{ [cellKey]: true } 表示已解锁可编辑
  const [cellScenarios, setCellScenarios] = React.useState({}); // { [cellKey]: scenarioName }
  const [previewAttach, setPreviewAttach] = React.useState(null);
  const [env, setEnv] = React.useState({ wd: '21.0', sd: '30.7' });
  const itemMethod = ctx.method || ctx.item?.method;
  const envMock = React.useMemo(
    () => resolveEnvMock(`${ctx.sample?.code || ''}|${ctx.item?.name || ''}`, { forceGuard: itemMethod === 'auto' }),
    [ctx.sample?.code, ctx.item?.name, itemMethod],
  );

  const flow = demoFlow ? DEMO_FLOWS[demoFlow] : (ctx.flow || ctx.item?.flow || DEMO_FLOWS.normal);
  const flowLocked = isFlowLocked(flow);
  const flowReturned = isFlowReturned(flow);
  const summary = summarizeCells(cells);
  const isAutoDirect = subs.length > 0 && subs.every((sub) => {
    const assigned = selectedDevices[sub.id];
    const m = assigned?.method || sub.method || sub.device?.method || 'manual';
    return m === 'auto';
  });
  const timingCtl = useTestItemTiming(ctx, {
    uploadedCount: summary.uploaded,
    allUploaded: summary.allUploaded,
    flowLocked,
    isAutoDirect,
  });
  const { guardStartForUpload, guardStartForOcr, guardStartForManual, clearEndedOnReset, requireStartBeforeCollect } = timingCtl;

  function guardHandInputRequired(cellMethod) {
    const m = cellMethod || method;
    if (m !== 'manual' && m !== 'ble') return true;
    return guardStartForManual();
  }

  /** 退回复测：用户修改或重置后标记，用于展示右上角状态水印 */
  function touchReturn() {
    if (flowReturned) setReturnTouched(true);
  }

  const inspectState = resolveInspectStampState({
    flowReturned,
    returnTouched,
    filledCount: summary.filled,
    uploadedCount: summary.uploaded,
    total: summary.total,
  });

  const activeSub = subs.find((sub) => sub.id === activeSubId) || subs[0];
  const activeCells = React.useMemo(() => sortCells(Object.values(cells).filter((cell) => cell.subItemId === activeSub?.id)), [cells, activeSub?.id]);
  const activeCell = cells[activeCellKey] || activeCells[0];
  const activeAssigned = selectedDevices[activeSub?.id] || null;
  const hasAssignment = !!activeAssigned;
  const activeDevice = activeAssigned || normalizeDevice(null);
  const method = hasAssignment ? (activeDevice.method || 'manual') : null;
  const handInputBlocked = requireStartBeforeCollect && (method === 'manual' || method === 'ble');
  const ocrScenarios = React.useMemo(
    () => MOCK.resolveOcrScenarios(ctx.item, activeAssigned),
    [ctx.item, activeAssigned],
  );
  const passedScenarios = getPassedScenarios(ocrScenarios);
  const hasPassedRule = passedScenarios.length > 0;
  const caps = getMethodCapabilities(method, hasPassedRule, ocrScenarios);
  const mainTimes = Math.max(1, ...subs.map((sub) => Object.values(cells).filter((cell) => cell.subItemId === sub.id).length));

  function deviceHasData(deviceId) {
    return Object.values(cells).some((cell) => cell.deviceId === deviceId && cell.status !== 'idle');
  }

  function deviceForSub(sub) {
    return selectedDevices[sub?.id] || null;
  }

  /** 退回复测：回填上次提交的试验数据 */
  React.useEffect(() => {
    const itemFlow = ctx.flow || ctx.item?.flow;
    if (!isFlowReturned(itemFlow)) return;
    setCells((prev) => {
      const next = { ...prev };
      Object.values(prev).forEach((cell) => {
        const sub = subs.find((s) => s.id === cell.subItemId);
        if (!sub) return;
        const index = cell.repeatIndex ?? 0;
        const vals = {};
        sub.fields.forEach((field) => { vals[field.key] = genVal(field, index); });
        next[cell.key] = { ...cell, status: 'uploaded', vals };
      });
      return next;
    });
  }, []);

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

  function scenarioMeta(name) {
    return (ocrScenarios || []).find((s) => s.name === name) || null;
  }

  function selectedScenarioFor(cellKey) {
    if (cellScenarios[cellKey]) return cellScenarios[cellKey];
    const def = getDefaultScenario(ocrScenarios);
    return def?.name || '';
  }

  function setScenarioFor(cellKey, name) {
    setCellScenarios((prev) => ({ ...prev, [cellKey]: name }));
  }

  React.useEffect(() => {
    if (method !== 'ocr' || !hasPassedRule) return;
    const def = getDefaultScenario(ocrScenarios);
    if (!def) return;
    setCellScenarios((prev) => {
      const next = { ...prev };
      Object.keys(cells).forEach((key) => {
        if (!next[key]) next[key] = def.name;
      });
      return next;
    });
  }, [method, hasPassedRule, ocrScenarios, cells]);

  function fillValues(sub, cell) {
    const index = cellIndexFor(cell);
    const vals = {};
    sub.fields.forEach((field) => { vals[field.key] = genVal(field, index); });
    return mergeRecordEnvVals(vals, env, envMock);
  }

  /** 环境信息刷新时，有传感器则同步回填各条已采数据的室温/湿度 */
  React.useEffect(() => {
    setCells((prev) => {
      let next = prev;
      Object.values(prev).forEach((cell) => {
        if (cell.status === 'idle') return;
        next = updateCell(next, cell.key, (cur) => ({
          ...cur,
          vals: mergeRecordEnvVals(cur.vals, env, envMock),
        }));
      });
      return next;
    });
  }, [env.wd, env.sd, envMock]);

  function captureSub(sub) {
    const device = deviceForSub(sub);
    if (!sub || flowLocked || !device) return;
    touchReturn();
    const source = device.method || 'manual';
    setBusy('all-' + sub.id);
    setTimeout(() => {
      setCells((prev) => {
        let next = prev;
        sortCells(Object.values(prev).filter((cell) => cell.subItemId === sub.id)).forEach((cell) => {
          if (cell.status !== 'uploaded' || flowReturned) {
            next = markCellFilled(next, cell.key, fillValues(sub, cell), { deviceId: device.id, source });
            if (source === 'auto') next = markCellUploaded(next, cell.key);
          }
        });
        return next;
      });
      setBusy(null);
    }, source === 'external' ? 850 : 1050);
  }

  function collectOne(sub, cell) {
    const device = deviceForSub(sub);
    if (!sub || !cell || flowLocked || !device) return;
    const source = device.method || 'manual';
    if (source === 'ocr' && !guardStartForOcr()) return;
    if (source === 'ble' && !guardStartForManual()) return;
    const scenario = selectedScenarioFor(cell.key);
    const meta = scenarioMeta(scenario);
    if (source === 'ocr' && (!hasPassedRule || !meta)) return;
    touchReturn();
    setBusy('c-' + cell.key);
    setTimeout(() => {
      setCells((prev) => {
        const cur = prev[cell.key];
        const partial = source === 'ocr' ? fillScenarioValues(sub, cell, meta.fieldKeys) : fillValues(sub, cell);
        const merged = source === 'ocr' ? mergeOcrFields(cur?.vals, partial, meta.fieldKeys) : partial;
        let next = markCellFilled(prev, cell.key, merged, { deviceId: device.id, source });
        if (source === 'ocr') {
          next = updateCell(next, cell.key, (c) => ({
            ...c,
            attachments: upsertScenarioAttachment(c.attachments, scenario, {
              id: Date.now() + '_ocr',
              kind: 'photo',
            }),
          }));
        }
        return next;
      });
      if (source === 'ocr') setEditCells((prev) => ({ ...prev, [cell.key]: false }));
      setBusy(null);
    }, source === 'ble' ? 1100 : 900);
  }

  function setField(cellKey, field, value, idx) {
    if (flowLocked) return;
    if (!guardHandInputRequired()) return;
    touchReturn();
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
        deviceId: cur.deviceId || deviceForSub(activeSub)?.id,
        source: cur.source || method,
      };
    }));
  }

  function uploadCell(cellKey) {
    if (flowLocked) return;
    if (!guardStartForUpload()) return;
    touchReturn();
    setBusy('up-' + cellKey);
    setTimeout(() => {
      setCells((prev) => markCellUploaded(prev, cellKey));
      setBusy(null);
    }, 700);
  }

  function uploadAll() {
    if (flowLocked) return;
    if (!guardStartForUpload()) return;
    touchReturn();
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
    touchReturn();
    clearEndedOnReset();
    setCells((prev) => Object.fromEntries(Object.values(prev).map((cell) => [
      cell.key,
      {
        ...cell,
        status: 'idle',
        vals: {},
        attachments: [],
        uploadedAt: null,
        collectedAt: null,
        deviceId: null,
        source: null,
      },
    ])));
  }

  function reRecognizeCell(sub, cell) {
    const scenario = selectedScenarioFor(cell.key);
    const meta = scenarioMeta(scenario);
    if (!sub || !cell || flowLocked || !meta || !getAttachmentForScenario(cell.attachments, scenario)) return;
    touchReturn();
    const device = deviceForSub(sub);
    if (!device) return;
    const source = device.method || 'manual';
    setBusy('c-' + cell.key);
    setTimeout(() => {
      setCells((prev) => {
        const cur = prev[cell.key];
        const partial = fillScenarioValues(sub, cell, meta.fieldKeys);
        return markCellFilled(prev, cell.key, mergeOcrFields(cur?.vals, partial, meta.fieldKeys), { deviceId: device.id, source });
      });
      setEditCells((prev) => ({ ...prev, [cell.key]: false }));
      setBusy(null);
    }, 950);
  }

  function resetCell(cellKey) {
    if (flowLocked) return;
    touchReturn();
    setCells((prev) => updateCell(prev, cellKey, (cell) => ({
      ...cell,
      status: 'idle',
      vals: {},
      attachments: [],
      uploadedAt: null,
      collectedAt: null,
      deviceId: null,
      source: null,
    })));
    setEditCells((prev) => {
      const next = { ...prev };
      delete next[cellKey];
      return next;
    });
  }

  function addAttach(cellKey, kind = 'upload') {
    if (flowLocked) return;
    if (kind === 'photo' && method === 'ocr' && !guardStartForOcr()) return;
    setCells((prev) => updateCell(prev, cellKey, (cell) => ({
      ...cell,
      attachments: [...cell.attachments, { id: Date.now() + '_' + Math.random().toString(36).slice(2, 6), kind }],
    })));
  }

  function removeAttach(cellKey, id) {
    if (flowLocked) return;
    const cell = cells[cellKey];
    const item = cell?.attachments?.find((a) => a.id === id);
    setCells((prev) => updateCell(prev, cellKey, (c) => ({
      ...c,
      attachments: removeScenarioAttachment(c.attachments, id),
    })));
    if (item?.scenario) {
      const meta = scenarioMeta(item.scenario);
      if (meta?.fieldKeys?.length) {
        setCells((prev) => updateCell(prev, cellKey, (c) => {
          const vals = clearScenarioFields(c.vals, meta.fieldKeys);
          const hasVals = Object.keys(vals).length > 0;
          return { ...c, vals, status: hasVals ? c.status : 'idle', uploadedAt: null };
        }));
      }
    }
  }

  function assignDevice(device) {
    if (!activeSub || flowLocked) return;
    const normalized = normalizeDevice(device, device.method);
    if (activeAssigned && activeAssigned.id === normalized.id) return;
    const collected = activeCells.some((cell) => cell.status !== 'idle');
    setSelectedDevices((prev) => ({ ...prev, [activeSub.id]: normalized }));
    setCells((prev) => Object.fromEntries(Object.values(prev).map((cell) => {
      if (cell.subItemId !== activeSub.id || cell.status !== 'idle') return [cell.key, cell];
      return [cell.key, { ...cell, deviceId: normalized.id, source: normalized.method }];
    })));
    setDeviceError(collected ? '该子项已采集的数据保留原采集设备，新采集的数据将使用当前指派设备' : '');
  }

  function removePoolDevice(device) {
    if (deviceHasData(device.id)) {
      setDeviceError(`「${device.name}」已有采集数据，请先清空或退回该设备数据后再删除`);
      return;
    }
    setDeviceError('');
    setPooledDeviceIds((prev) => prev.filter((id) => id !== device.id));
    setSelectedDevices((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((subId) => { if (next[subId] && next[subId].id === device.id) next[subId] = null; });
      return next;
    });
  }

  function confirmDeviceDrawer(nextIds) {
    const idSet = new Set(nextIds);
    setPooledDeviceIds(nextIds);
    setSelectedDevices((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((subId) => { if (next[subId] && !idSet.has(next[subId].id)) next[subId] = null; });
      return next;
    });
    setDeviceDrawerOpen(false);
    setDeviceError('');
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
        auto: '设备直连 · 上位机算毕整批写库后 App 自动回填，不可手输',
        ocr: caps.ocrReady ? '拍照识别 · 选择场景后拍摄，多场景图片合并识别字段' : '该设备与试验项下不存在验证通过的识别规则，已回退手工录入',
        ble: '蓝牙数显卡尺 · 逐相连接同步读数，也可手动输入',
        manual: '读数由检测员手工录入',
        external: '外部程序代采写库（含串口通路）· App 生产无采集按钮，可查看已采或手输补录',
        serial: '外部程序·串口通路 · 工业平板程序代采写库',
      }[method] || '缺少采集方式，请先维护设备采集配置');
  const allCurrentSubFilled = activeCells.length > 0 && activeCells.every((cell) => cell.status !== 'idle');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', position: 'relative' }}>
      <AppBar title="检测任务" onBack={onBack} />
      {inspectState && <Stamp state={inspectState} />}

      <div style={{ padding: 'var(--gap-page)', paddingBottom: 0 }}>
        <AnnotatedWrapper id="flowBanner" layout="block">
          <FlowBanner flow={flow} locked={flowLocked} returned={flowReturned} />
        </AnnotatedWrapper>
        <AnnotatedWrapper id="structuredMode" layout="block">
          <AnnotatedWrapper id="basicInfo" layout="block">
            <Section title="基础信息" icon="info">
              <Grid items={[
                ['任务编号', ctx.task?.code || MOCK.taskCodeFromSample(ctx.sample)],
                ['样品编号', MOCK.formatSampleCodeDisplay(ctx.sample)],
                ['样品名称', ctx.sample.name],
                ['型号规格', MOCK.sampleSpec(ctx.sample)],
                ['试验名称', ctx.item.name],
                ['试验次数', `${mainTimes} 次`],
              ]} />
              <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary,#9aa3b2)' }}>
                含 {subs.length} 个试验子项 · 采集单元 {summary.total} 个 · 物资版多子项
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <SampleLabelQrLink sample={ctx.sample} placement="footerEnd" />
              </div>
            </Section>
          </AnnotatedWrapper>
        </AnnotatedWrapper>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AnnotatedWrapper id="structuredDeviceInfo" layout="block">
          <Section title="设备信息" icon="cpu" compact extra={<CollectBadge method={method || 'manual'} size="sm" />}>
            <DevicePool
              devices={availableDevices}
              activeDevice={activeDevice}
              hasAssignment={hasAssignment}
              deviceHasData={deviceHasData}
              flowLocked={flowLocked}
              onAssign={assignDevice}
              onRemove={removePoolDevice}
              onOpenDrawer={() => setDeviceDrawerOpen(true)}
            />
            {deviceError && (
              <div style={{ margin: '0 0 6px', fontSize: 'var(--fs-xs)', color: deviceError.includes('保留') || deviceError.includes('请先') ? 'var(--status-pending-fg,#97640f)' : 'var(--danger,#e23b3b)', display: 'flex', alignItems: 'center', gap: 5 }}>
                {deviceError.includes('保留') || deviceError.includes('请先') ? <InfoIcon /> : <AlertCircleIcon />}
                <span>{deviceError}</span>
              </div>
            )}
            <DeviceMeta subName={activeSub.name} device={hasAssignment ? activeDevice : null} />
          </Section>
        </AnnotatedWrapper>

        <AnnotatedWrapper id="envInfo" layout="block">
          <EnvInfoSection
            envMock={envMock}
            env={env}
            onRefresh={() => setEnv({ wd: (20 + Math.random() * 3).toFixed(1), sd: (28 + Math.random() * 8).toFixed(1) })}
            Section={Section}
            Grid={Grid}
          />
        </AnnotatedWrapper>

        <AnnotatedWrapper id="testItemTiming" layout="block">
        <TestItemTimingSection
          timing={timingCtl.timing}
          canRecordStart={timingCtl.canRecordStart}
          recording={timingCtl.recording}
          confirmOverwrite={timingCtl.confirmOverwrite}
          requireStartBeforeCollect={timingCtl.requireStartBeforeCollect}
          isAutoDirect={timingCtl.isAutoDirect}
          onRecordStartClick={timingCtl.handleRecordStartClick}
          onConfirmOverwrite={timingCtl.recordStart}
          onCancelOverwrite={timingCtl.cancelOverwrite}
        />
        </AnnotatedWrapper>

        {(deviceMissing || methodMissing || fieldMissing) && (
          <ConfigError
            title={deviceMissing ? '当前子项未指派设备' : '当前配置异常'}
            body={deviceMissing ? '当前子项尚未指派设备，请点上方设备指派，或点「切换设备」按工位添加设备。' : methodMissing ? '缺少设备采集方式，请先维护采集方式。' : '缺少试验字段模板，请先维护字段配置。'}
          />
        )}

        <AnnotatedWrapper id="structuredSubItems" layout="block">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GridIcon />
                <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>试验数据</span>
              </div>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>已上传 {summary.uploaded}/{summary.total}</span>
            </div>
            <SubItemSwitches subs={subs} activeSub={activeSub} summary={summary} onSelect={(id) => { setActiveSubId(id); setDeviceError(''); }} />
          </div>
        </AnnotatedWrapper>

        <AnnotatedWrapper id="structuredTestData" layout="block">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{methodHint}</div>
            {caps.canBatch && !allCurrentSubFilled && !flowLocked && !fieldMissing && (
              <AnnotatedWrapper id="demoOneClickCapture" layout="block">
                <Card padding="18px">
                  <div style={{ textAlign: 'center' }}>
                    {busy === 'all-' + activeSub.id
                      ? <div style={{ color: 'var(--brand-action)' }}><Spinner /><div style={{ fontSize: 'var(--fs-sm)', marginTop: 10 }}>{method === 'external' || method === 'serial' ? '正在拉取平板程序已采数据…' : '正在从数据库整批取值…'}</div></div>
                      : <Button size="lg" onClick={() => captureSub(activeSub)}>{method === 'external' ? '查看已采数据' : '一键采集'}</Button>}
                  </div>
                </Card>
              </AnnotatedWrapper>
            )}

            <div style={{ flex: '1 1 720px', minHeight: 720, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: 'var(--white)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flex: '1 1 auto', minHeight: 0 }}>
                <div style={{ width: 168, flex: 'none', borderRight: '1px solid var(--divider)', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                  {activeCells.map((cell, index) => {
                    const on = activeCell?.key === cell.key;
                    return (
                      <button key={cell.key} onClick={() => setActiveCellKey(cell.key)} style={{
                        display: 'flex', alignItems: 'center', gap: 9, padding: '12px 11px', cursor: 'pointer', textAlign: 'left',
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
                          <div style={{ marginTop: 2, fontSize: 'var(--fs-xs)', color: cell.status === 'uploaded' ? 'var(--status-done-fg,#1b8a5a)' : cell.status === 'failed' ? 'var(--danger,#e23b3b)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {statusText(cell.status)}
                          </div>
                          <div style={{ marginTop: 2, fontSize: 10, color: 'var(--text-tertiary,#9aa3b2)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                            {MOCK.sampleCodeForCell(ctx.sample, index)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div style={{ flex: 1, minWidth: 0, minHeight: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
                  {activeCell && (
                    <AnnotatedWrapper id="testParams" layout="block">
                    <CellEditor
                      sub={activeSub}
                      cell={activeCell}
                      method={method}
                      caps={caps}
                      busy={busy}
                      flowLocked={flowLocked}
                      flowReturned={flowReturned}
                      currentDevice={activeDevice}
                      deviceCatalog={deviceCatalog}
                      env={env}
                      envMock={envMock}
                      handInputBlocked={handInputBlocked}
                      onHandInputBlocked={guardStartForManual}
                      ocrScenarios={ocrScenarios}
                      selectedScenario={selectedScenarioFor(activeCell.key)}
                      onScenarioChange={(name) => setScenarioFor(activeCell.key, name)}
                      onCollect={() => collectOne(activeSub, activeCell)}
                      onReRecognize={() => reRecognizeCell(activeSub, activeCell)}
                      ocrUnlocked={!!editCells[activeCell.key]}
                      onSetOcrUnlocked={(unlocked) => setEditCells((prev) => ({ ...prev, [activeCell.key]: unlocked }))}
                      onChange={setField}
                      onUpload={uploadCell}
                      onReset={resetCell}
                      onAddAttach={addAttach}
                      onRemoveAttach={removeAttach}
                      onPreviewAttach={setPreviewAttach}
                    />
                    </AnnotatedWrapper>
                  )}
                </div>
              </div>

            </div>
          </div>
        </AnnotatedWrapper>

        <div style={{ height: 8, flex: 'none' }} />
      </div>

      <div style={{ position: 'absolute', left: 12, bottom: 88, zIndex: 60, display: 'flex', alignItems: 'center', gap: 4, padding: '5px 7px', borderRadius: 'var(--radius-pill)', background: 'rgba(20,30,55,0.86)', boxShadow: 'var(--shadow-lg)' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, padding: '0 4px' }}>演示·流程</span>
        {[['normal', '正常'], ['returned', '退回'], ['locked', '锁定']].map(([key, label]) => {
          const cur = demoFlow || (flowLocked ? 'locked' : flowReturned ? 'returned' : 'normal');
          const on = cur === key;
          return <button key={key} onClick={() => setDemoFlow(key)} style={{ border: 'none', cursor: 'pointer', padding: '4px 11px', borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 600, background: on ? 'var(--white)' : 'transparent', color: on ? 'var(--text-title)' : 'rgba(255,255,255,0.85)' }}>{label}</button>;
        })}
      </div>

      <AnnotatedWrapper id="uploadActions" layout="block">
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
      </AnnotatedWrapper>

      {deviceDrawerOpen && (
        <DeviceDrawer
          devices={deviceCatalog}
          pooledDeviceIds={pooledDeviceIds}
          defaultStation={ctx.stationId}
          deviceHasData={deviceHasData}
          configuredAutoIds={MOCK.deviceCollectConfig[ctx.item?.name] || []}
          onClose={() => setDeviceDrawerOpen(false)}
          onConfirm={confirmDeviceDrawer}
        />
      )}

      <OcrImagePreview
        open={!!previewAttach}
        scenario={previewAttach?.scenario}
        onClose={() => setPreviewAttach(null)}
      />
      <TimingToast message={timingCtl.toast} />
    </div>
  );
}

function DevicePool({ devices, activeDevice, hasAssignment, deviceHasData, flowLocked, onAssign, onRemove, onOpenDrawer }) {
  return (
    <div style={{ marginBottom: 6, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 300px', minWidth: 0 }}>
        {devices.length ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {devices.map((device) => {
              const on = hasAssignment && device.id === activeDevice.id;
              const locked = deviceHasData(device.id);
              return (
                <div key={device.id} style={{
                  display: 'inline-flex', alignItems: 'center', minHeight: 28, borderRadius: 'var(--radius-pill)',
                  border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
                  background: on ? 'var(--surface-selected)' : 'var(--white)',
                  overflow: 'hidden',
                }}>
                  <button onClick={() => onAssign(device)} disabled={flowLocked} title="指派给当前子项" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 26, padding: '3px 8px 3px 10px',
                    border: 'none', background: 'transparent', color: on ? 'var(--brand-action)' : 'var(--text-body)',
                    fontSize: 'var(--fs-sm)', fontWeight: on ? 600 : 400, cursor: flowLocked ? 'not-allowed' : 'pointer', minWidth: 0,
                  }}>
                    <CollectDot method={device.method} on={on} />
                    <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.name}</span>
                  </button>
                  {!flowLocked && (
                    <button aria-label={`移除${device.name}`} onClick={() => onRemove(device)} title={locked ? '已有采集数据，需先清空或退回后再删除' : '移除设备'} style={{
                      width: 25, height: 26, border: 'none', borderLeft: '1px solid var(--border-default)',
                      background: 'transparent', color: locked ? 'var(--text-placeholder)' : 'var(--text-tertiary,#9aa3b2)', cursor: 'pointer',
                      fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>×</button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ minHeight: 28, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>暂无可用设备，请切换设备添加</div>
        )}
      </div>
      <div style={{ flex: 'none' }}>
        {!flowLocked && <Button size="sm" variant="secondary" onClick={onOpenDrawer} style={{ height: 30, padding: '0 12px' }}>切换设备</Button>}
      </div>
    </div>
  );
}

function DeviceMeta({ subName, device }) {
  const itemStyle = { display: 'flex', gap: 8, fontSize: 'var(--fs-sm)', minWidth: 0 };
  const labelStyle = { color: 'var(--text-secondary)', flex: 'none' };
  const valueStyle = { color: 'var(--text-title)', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' };
  const stationText = device ? MOCK.stationLabel(device.station) : '—';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px' }}>
        <div style={itemStyle}>
          <span style={labelStyle}>当前子项</span>
          <span title={subName} style={valueStyle}>{subName}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>检测设备</span>
          <span title={device ? device.name : '未指派'} style={valueStyle}>{device ? device.name : '未指派'}</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px' }}>
        <div style={itemStyle}>
          <span style={labelStyle}>设备编号</span>
          <span title={device ? device.code : '—'} style={valueStyle}>{device ? device.code : '—'}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>设备型号</span>
          <span title={device ? device.model : '—'} style={valueStyle}>{device ? device.model : '—'}</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px' }}>
        <div style={itemStyle}>
          <span style={labelStyle}>所属工位</span>
          <span title={stationText} style={valueStyle}>{stationText}</span>
        </div>
      </div>
    </div>
  );
}

function SubItemSwitches({ subs, activeSub, summary, onSelect }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, padding: 4, borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken,#f5f6f8)', maxWidth: '100%', flexWrap: 'wrap' }}>
        {subs.map((sub) => {
          const on = sub.id === activeSub.id;
          const subSummary = summary.bySub[sub.id] || { label: '待采集', uploaded: 0, total: 0, state: 'pending' };
          const color = statusColor(subSummary.state);
          return (
            <button key={sub.id} onClick={() => onSelect(sub.id)} style={{
              minHeight: 34, maxWidth: 220, padding: '6px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid ' + (on ? 'var(--brand-action)' : 'transparent'),
              background: on ? 'var(--white)' : 'transparent', color: on ? 'var(--brand-action)' : 'var(--text-body)',
              boxShadow: on ? '0 1px 4px rgba(37,99,235,0.16)' : 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
              fontSize: 'var(--fs-sm)', fontWeight: on ? 700 : 600,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flex: 'none' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.name}</span>
              <span style={{ color: 'var(--text-title)', fontSize: 'var(--fs-xs)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{subSummary.uploaded}/{subSummary.total}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DeviceDrawer({ devices, pooledDeviceIds, defaultStation, deviceHasData, configuredAutoIds = [], onClose, onConfirm }) {
  const hasStation = STATION_OPTIONS.some((item) => item.value === defaultStation);
  const [station, setStation] = React.useState(hasStation ? defaultStation : null);
  const [checked, setChecked] = React.useState(() => new Set(pooledDeviceIds));
  const [q, setQ] = React.useState('');
  const ql = q.trim().toLowerCase();
  // 采集关系过滤：仅对「设备直连(auto)」生效，未在数采「设备采集配置」为本试验项配置采集关系的 auto 设备不可选
  const notConfigured = (device) => device.method === 'auto' && !configuredAutoIds.includes(device.id);
  const visibleDevices = devices.filter((device) => {
    if (station && (device.station || 'none') !== station) return false;
    if (ql && !((device.name || '').toLowerCase().includes(ql) || (device.code || '').toLowerCase().includes(ql))) return false;
    return true;
  });
  const stationCounts = React.useMemo(() => STATION_OPTIONS.reduce((acc, item) => {
    acc[item.value] = devices.filter((device) => (device.station || 'none') === item.value).length;
    return acc;
  }, {}), [devices]);

  function toggle(device) {
    if (deviceHasData(device.id) || notConfigured(device)) return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(device.id)) next.delete(device.id); else next.add(device.id);
      return next;
    });
  }

  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(15,23,42,0.28)' }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 90, background: 'var(--white)',
        borderRadius: '18px 18px 0 0', boxShadow: '0 -14px 34px rgba(15,23,42,0.20)', overflow: 'hidden',
        maxHeight: '84%', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ width: 44, height: 4, borderRadius: 'var(--radius-pill)', background: 'var(--border-strong,#cfd6e2)', margin: '10px auto 6px' }} />
        <AnnotatedWrapper id="structuredDeviceDrawer" layout="block">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 16px 12px', borderBottom: '1px solid var(--divider)' }}>
            <div>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text-title)' }}>切换设备</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: 3 }}>按工位筛选实验室设备，可多选加入设备池（物资版多子项）</div>
            </div>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>已选 {checked.size} 台</span>
          </div>
        </AnnotatedWrapper>
        <AnnotatedWrapper id="structuredDeviceFilter" layout="block">
          <div>
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
                      <span style={{ fontSize: 10, color: on ? 'var(--brand-action)' : 'var(--text-tertiary,#9aa3b2)', fontVariantNumeric: 'tabular-nums' }}>{stationCounts[item.value] || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </AnnotatedWrapper>
        <AnnotatedWrapper id="structuredDeviceList" layout="flex">
          <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
            {visibleDevices.length ? visibleDevices.map((device) => {
              const on = checked.has(device.id);
              const locked = deviceHasData(device.id);
              const blocked = notConfigured(device);
              const disabled = locked || blocked;
              const stationText = MOCK.stationLabel(device.station);
              return (
                <button key={device.id} onClick={() => toggle(device)} disabled={disabled} style={{
                  width: '100%', minHeight: 58, padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
                  background: on ? 'var(--surface-selected)' : blocked ? 'var(--surface-sunken,#f5f6f8)' : 'var(--white)', cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, textAlign: 'left', opacity: disabled ? 0.6 : 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    {blocked
                      ? <span style={{ width: 20, height: 20, flex: 'none', borderRadius: 6, border: '1.5px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-placeholder)' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18 M6 6l12 12"/></svg></span>
                      : <CheckBox on={on} />}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 'var(--fs-base)', fontWeight: 650, color: on ? 'var(--brand-action)' : 'var(--text-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.name}</span>
                        <CollectBadge method={device.method} size="sm" />
                      </div>
                      <div style={{ marginTop: 3, fontSize: 'var(--fs-xs)', color: blocked ? 'var(--status-pending-fg,#97640f)' : locked ? 'var(--status-pending-fg,#97640f)' : 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {blocked ? '未配置采集关系 · 请先在数采「设备采集配置」维护'
                          : locked ? '已有采集数据 · 不可移出设备池'
                          : `${device.code} · ${device.model}`}
                      </div>
                      {!blocked && (
                        <div style={{ marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary,#9aa3b2)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                          {stationText}
                        </div>
                      )}
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
        </AnnotatedWrapper>
        <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--divider)', display: 'flex', gap: 10 }}>
          <Button variant="secondary" block onClick={onClose}>取消</Button>
          <Button block onClick={() => onConfirm(Array.from(checked))}>确定（{checked.size}）</Button>
        </div>
      </div>
    </React.Fragment>
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

function CellEditor({ sub, cell, method, caps, busy, flowLocked, flowReturned, currentDevice, deviceCatalog, env, envMock, handInputBlocked = false, onHandInputBlocked, ocrScenarios, selectedScenario, onScenarioChange, ocrUnlocked, onCollect, onReRecognize, onSetOcrUnlocked, onChange, onUpload, onReset, onAddAttach, onRemoveAttach, onPreviewAttach }) {
  const busyCell = busy === 'c-' + cell.key;
  const uploading = busy === 'up-' + cell.key;
  const filled = cell.status === 'filled' || cell.status === 'uploaded' || cell.status === 'failed';
  const ocrField = method === 'ocr' && caps.ocrReady;
  const ocrLocked = ocrField && filled && !ocrUnlocked && !flowLocked && (cell.status !== 'uploaded' || flowReturned);
  const readOnly = flowLocked || caps.isReadOnlySource || (cell.status === 'uploaded' && !flowReturned);
  const canEdit = !readOnly && caps.canEdit && !ocrLocked && !handInputBlocked;
  const recordDevice = deviceCatalog.find((device) => device.id === cell.deviceId);
  const traceDevice = recordDevice || (filled && cell.deviceId ? { name: cell.deviceId, code: '—', method: cell.source || method } : currentDevice);
  const traceMethod = filled ? (traceDevice.method || cell.source || method) : method;
  const showCollectActions = !flowLocked && cell.status !== 'uploaded' && (method === 'ble' || method === 'ocr');

  return (
    <React.Fragment>
      {method === 'ocr' && !flowLocked && showCollectActions && (
        <OcrCaptureBar
          ocrScenarios={ocrScenarios}
          value={selectedScenario}
          onChange={onScenarioChange}
          onShoot={onCollect}
          busy={busyCell}
        />
      )}
      {showCollectActions && method === 'ble' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          <Button onClick={onCollect} disabled={busyCell}>{busyCell ? '连接中…' : '连接采集'}</Button>
        </div>
      )}

      {busyCell
        ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--brand-action)' }}><Spinner /><div style={{ fontSize: 'var(--fs-sm)', marginTop: 10 }}>{method === 'ocr' ? '正在识别读数…' : '正在连接设备…'}</div></div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AnnotatedWrapper id="cellDeviceTrace" layout="block">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minHeight: 34, padding: '7px 10px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken,#f5f6f8)', color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', minWidth: 0 }}>
                <CollectDot method={traceMethod} on />
                <span style={{ flex: 'none' }}>{filled ? '采集于' : '待采设备'}</span>
                {filled && <span style={{ flex: 'none', color: methodColor(traceMethod), fontWeight: 600 }}>{methodLabel(traceMethod)}</span>}
                <span style={{ color: 'var(--text-title)', fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{traceDevice.name}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{traceDevice.code}</span>
              </div>
            </AnnotatedWrapper>
            {sub.fields.map((field) => {
              if (field.multi) {
                return <MultiField key={field.key} field={field} values={cell.vals[field.key]} readOnly={!canEdit}
                  onChange={(idx, val) => onChange(cell.key, field, val, idx)} />;
              }
              if (field.options || field.key === 'jg') {
                return <SelectField key={field.key} field={field} value={cell.vals[field.key] || ''} readOnly={!canEdit}
                  onReadOnlyInteract={handInputBlocked ? onHandInputBlocked : undefined}
                  onChange={(value) => onChange(cell.key, field, value)} />;
              }
              return <FieldRow key={field.key} label={field.label} unit={field.unit} required={field.required !== false}
                value={cell.vals[field.key] || ''} placeholder={filled ? '' : '待采集'} readOnly={!canEdit}
                onReadOnlyInteract={handInputBlocked ? onHandInputBlocked : undefined}
                onChange={(event) => onChange(cell.key, field, event.target.value)} />;
            })}

            <AnnotatedWrapper id="recordEnvFields" layout="block">
              <RecordEnvFields
                env={env}
                envMock={envMock}
                vals={cell.vals}
                readOnly={readOnly || ocrLocked}
                handInputBlocked={handInputBlocked}
                onReadOnlyInteract={onHandInputBlocked}
                onChange={(key, value) => onChange(cell.key, { key, label: key }, value)}
                FieldRow={FieldRow}
              />
            </AnnotatedWrapper>

            {ocrField && filled && !flowLocked && (
              <OcrEditBar
                locked={ocrLocked}
                hasPhoto={!!getAttachmentForScenario(cell.attachments, selectedScenario)}
                busy={busyCell}
                onReRecognize={onReRecognize}
                onEdit={() => onSetOcrUnlocked(true)}
                onDone={() => onSetOcrUnlocked(false)}
              />
            )}

            {!filled && <MethodNote method={method} readOnly={readOnly} />}

            {caps.canAttach && filled && method === 'ocr' && (
              <AttachmentList
                cell={cell}
                method={method}
                flowLocked={flowLocked}
                selectedScenario={selectedScenario}
                onRemove={(id) => onRemoveAttach(cell.key, id)}
                onPreview={onPreviewAttach}
              />
            )}
            {caps.canAttach && filled && method !== 'ocr' && (
              <AttachmentList
                cell={cell}
                method={method}
                flowLocked={flowLocked}
                onAdd={() => onAddAttach(cell.key, 'upload')}
                onRemove={(id) => onRemoveAttach(cell.key, id)}
              />
            )}

            {filled && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 2, paddingTop: 12, borderTop: '1px dashed var(--divider)' }}>
                {cell.status === 'uploaded'
                  ? <React.Fragment>
                      {!flowLocked && method !== 'auto' && <Button variant="secondary" onClick={() => onReset(cell.key)}>重置</Button>}
                      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-done-fg,#1b8a5a)', display: 'flex', alignItems: 'center', gap: 5 }}><CheckIcon />本单元已上传</span>
                    </React.Fragment>
                  : flowLocked
                  ? <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}><LockIcon />数据已锁定</span>
                  : method === 'auto'
                  ? <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-done-fg,#1b8a5a)', display: 'flex', alignItems: 'center', gap: 5 }}><CheckIcon />本单元已上传</span>
                  : <Button variant="secondary" onClick={() => onUpload(cell.key)} disabled={uploading}>{uploading ? '上传中…' : cell.status === 'failed' ? '重试上传' : '确认并上传'}</Button>}
              </div>
            )}
          </div>}
    </React.Fragment>
  );
}

function SelectField({ field, value, readOnly, onReadOnlyInteract, onChange }) {
  const options = field.options || CONDUCTOR_STRUCTURE_OPTIONS;
  const blocked = readOnly && !!onReadOnlyInteract;
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 14 }}
      onClick={blocked ? (e) => { e.preventDefault(); onReadOnlyInteract(); } : undefined}
    >
      <label style={{ width: 110, flex: 'none', fontSize: 'var(--fs-base)', color: 'var(--text-body)', display: 'flex', gap: 2 }}>
        {field.required !== false && <span style={{ color: 'var(--danger)' }}>*</span>}<span>{field.label}{field.unit ? `（${field.unit}）` : ''}</span>
      </label>
      <select value={value} disabled={readOnly} tabIndex={blocked ? -1 : undefined}
        onMouseDown={blocked ? (e) => { e.preventDefault(); onReadOnlyInteract(); } : undefined}
        onChange={(event) => onChange(event.target.value)}
        style={{
          flex: 1, height: 44, padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)',
          background: readOnly ? 'var(--surface-sunken,#f5f6f8)' : 'var(--white)', fontSize: 'var(--fs-base)', color: value ? 'var(--text-title)' : 'var(--text-placeholder)',
          outline: 'none', boxSizing: 'border-box', appearance: 'auto',
        }}>
        <option value="">待采集</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
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

function OcrEditBar({ locked, hasPhoto, busy, onReRecognize, onEdit, onDone }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: '8px 10px', borderRadius: 'var(--radius-md)', background: locked ? 'var(--surface-sunken)' : 'rgba(176,106,0,0.08)', border: '1px solid ' + (locked ? 'var(--border-default)' : 'var(--collect-ocr,#b06a00)') }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', lineHeight: 1.5, color: locked ? 'var(--text-secondary)' : 'var(--collect-ocr,#b06a00)', minWidth: 0 }}>
        {locked
          ? <React.Fragment><LockIcon />识别结果已锁定，防止误触改动 · 如需矫正请点「编辑」</React.Fragment>
          : <React.Fragment><EditIcon />编辑中 · 若改乱了可「重新识别」用原照片还原</React.Fragment>}
      </span>
      <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
        <button onClick={onReRecognize} disabled={!hasPhoto || busy}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-strong)', background: 'var(--white)', color: hasPhoto && !busy ? 'var(--text-body)' : 'var(--text-placeholder)', cursor: hasPhoto && !busy ? 'pointer' : 'not-allowed', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
          <RefreshIcon />
          重新识别
        </button>
        {locked
          ? <button onClick={onEdit}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--collect-ocr,#b06a00)', background: 'var(--collect-ocr-bg,#fff4e6)', color: 'var(--collect-ocr,#b06a00)', cursor: 'pointer', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
              <EditIcon />
              编辑
            </button>
          : <button onClick={onDone}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--brand-action)', background: 'var(--brand-action)', color: '#fff', cursor: 'pointer', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
              <CheckIcon />
              完成
            </button>}
      </div>
    </div>
  );
}

function AttachmentList({ cell, method, flowLocked, selectedScenario, onAdd, onRemove, onPreview }) {
  const title = method === 'ocr' ? '识别参照图' : '参照图';
  const hint = method === 'ocr' ? '· 按场景 · 同场景新拍覆盖旧图' : '· 随数据一起上传归档';
  const filled = cell.status === 'filled' || cell.status === 'uploaded' || cell.status === 'failed';
  const displayAttachments = method === 'ocr'
    ? sortAttachmentsByScenario(getOcrReferenceAttachments(cell.attachments, { filled, flowLocked, isOcr: true }))
    : cell.attachments;
  return (
    <div style={{ paddingTop: 10, borderTop: '1px dashed var(--divider)' }}>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 8 }}>{title} <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-placeholder)' }}>{hint}</span></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {displayAttachments.map((item) => (
          <div key={item.id} role={onPreview && !item.mock ? 'button' : undefined} tabIndex={onPreview && !item.mock ? 0 : undefined} onClick={() => onPreview && !item.mock && onPreview(item)} onKeyDown={(e) => { if (e.key === 'Enter' && onPreview && !item.mock) onPreview(item); }} style={{ position: 'relative', width: 76, height: 76, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-default)', background: 'repeating-linear-gradient(135deg,#eef1f5 0 8px,#e6eaef 8px 16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: onPreview && !item.mock ? 'pointer' : 'default' }}>
            <CameraIcon />
            <span style={{ fontSize: 10, color: method === 'ocr' ? 'var(--collect-ocr,#b06a00)' : 'var(--text-secondary)', fontWeight: method === 'ocr' ? 600 : 400, maxWidth: 68, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.scenario || (item.kind === 'photo' ? '拍照' : '上传')}</span>
            {!flowLocked && !item.mock && <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>}
          </div>
        ))}
        {!flowLocked && method !== 'ocr' && onAdd && (
          <button onClick={onAdd} style={{ width: 76, height: 76, borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)', background: 'var(--bg-app)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <PlusIcon />
            <span style={{ fontSize: 10 }}>拍照/上传</span>
          </button>
        )}
      </div>
    </div>
  );
}

function MethodNote({ method, readOnly }) {
  const text = {
    auto: '设备直采数据，不可修改',
    ble: '',
    manual: '单机设备无通讯接口，读数手工录入',
    ocr: '识别结果可校正，参照图按场景随数据归档',
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
        <LockIconLarge />
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

function Section({ title, icon, extra, compact = false, children }) {
  const paths = {
    info: 'M12 16v-4 M12 8h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    cpu: 'M4 4h16v16H4z M9 9h6v6H9z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 14h3 M1 9h3 M1 14h3',
    thermometer: 'M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z',
  };
  return (
    <Card padding="0">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: compact ? '7px 16px' : '12px 16px', borderBottom: '1px solid var(--divider)', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-action)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d={paths[icon] || paths.info} /></svg>
          <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600, minWidth: 0, overflow: 'hidden' }}>{title}</div>
        </div>
        {extra}
      </div>
      <div style={{ padding: compact ? '8px 16px 10px' : 16 }}>{children}</div>
    </Card>
  );
}

function Grid({ items, compact = false }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(3, minmax(0, 1fr))' : '1fr 1fr', gap: compact ? '4px 14px' : '12px 16px' }}>
      {items.map(([k, v], i) => (
        <div key={i} style={{ display: 'flex', gap: 8, fontSize: compact ? 'var(--fs-sm)' : 'var(--fs-base)', minWidth: 0 }}>
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

function enrichDevice(device, method) {
  const base = normalizeDevice(device, method);
  const ref = MOCK.devices.find((d) => d.id === base.id);
  return { ...base, station: device?.station ?? ref?.station ?? null };
}

function uniqueDevices(devices) {
  const seen = new Set();
  return devices.filter(Boolean).map((d, i) => normalizeDevice(d, d.method, i)).filter((device) => {
    if (seen.has(device.id)) return false;
    seen.add(device.id);
    return true;
  });
}

function sortDevicePool(devices) {
  return devices.slice().sort((a, b) => {
    const ai = DEVICE_ORDER.includes(a.id) ? DEVICE_ORDER.indexOf(a.id) : 99;
    const bi = DEVICE_ORDER.includes(b.id) ? DEVICE_ORDER.indexOf(b.id) : 99;
    return ai - bi || a.name.localeCompare(b.name, 'zh-CN');
  });
}

function uniqueStations(devices) {
  const seen = new Set();
  return devices.reduce((acc, device) => {
    const value = device.station || 'none';
    if (seen.has(value)) return acc;
    seen.add(value);
    acc.push({ value, label: stationLabel(value) });
    return acc;
  }, []);
}

function stationLabel(station) {
  return {
    zy: '电缆制样工位',
    sz: '水煮试验工位',
    ny: '耐压工位',
    ld: '雷电冲击工位',
    rs: '电缆燃烧工位',
    by: '变压器工位',
    none: '未绑定工位',
  }[station] || station;
}

function statusText(status) {
  return { idle: '待采集', filled: '待上传', uploaded: '已上传', failed: '上传失败' }[status] || '待采集';
}

function statusColor(state) {
  return { uploaded: 'var(--status-done-fg,#1b8a5a)', doing: 'var(--brand-action)', pending: 'var(--status-pending,#e8a93a)', failed: 'var(--danger,#e23b3b)' }[state] || 'var(--text-secondary)';
}

function phaseColor(phase) {
  return PHASES.find((item) => item.value === phase)?.color || 'var(--brand-action)';
}

function methodColor(method) {
  return { auto: 'var(--collect-auto,#1d54c4)', ble: 'var(--collect-ble,#0a8a96)', manual: 'var(--collect-manual,#828c9c)', ocr: 'var(--collect-ocr,#b06a00)', external: 'var(--collect-ble,#0a8a96)' }[method] || 'var(--text-secondary)';
}

function methodLabel(method) {
  return { auto: '设备直采', ble: '蓝牙采集', manual: '手工录入', ocr: '拍照识别', external: '外部程序' }[method] || '采集';
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
function PinIcon({ on }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={on ? 'var(--brand-action)' : 'var(--text-tertiary,#9aa3b2)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-action)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z"/></svg>;
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
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function EditIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>;
}
function RefreshIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>;
}
function LockIconLarge() {
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

export { CollectStructured };
