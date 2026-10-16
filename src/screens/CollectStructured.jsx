import React from 'react';
import { AppBar, Button, Card, FieldRow } from '../design-system.js';
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
import { OcrAttachmentThumb } from './OcrAttachmentThumb.jsx';
import { ConfiguredDeviceSelect, defaultRecordedIds, snapshotDevices, SubmittedDeviceTrace } from './ConfiguredDeviceSelect.jsx';
import { getCameraOrientationConfig } from '../camera-orientation-config.js';
import { runOcrCapturePipeline } from '../ocr-image-pipeline.js';
import {
  clearScenarioFields, getAttachmentForScenario, getDefaultScenario, getPassedScenarios,
  mergeOcrFields, removeScenarioAttachment, sortAttachmentsByScenario, upsertScenarioAttachment,
} from './ocr-scenario.js';

/* 采集详情（L4·复合试验项 · 物资版 LIMS+数采）
   试验子项决定采集字段、次数与采集方式。设备区展示数采 Web「设备采集配置」关联设备，可多选。
   提交某条试验数据时记录当时选中的设备；任一条已上传后，选中锁定，直到全部已上传数据被重置清除。
   轻量版 LIMS+数采无多试验子项，不进入本页。 */

const FIXED = { jg: '紧压绞合圆形', jsdbffs: '两层金属带间隙绕包' };
const BASE = { gs: 8, zj: 8.00, tdhd: 10.00, tk1: 13, dg1: 14, tk2: 15, dg2: 14, tk3: 13, dg3: 14, tk4: 15, dg4: 14, tk5: 13, dg5: 14, kzkd: 3.0, jdbs: 2, gdjx1: 1.2, gdjx2: 1.3, gdjx3: 1.1, gdjx4: 1.4, gdjx5: 1.2 };
const DEC = { gs: 0, zj: 2, tdhd: 2, tk1: 1, dg1: 1, tk2: 1, dg2: 1, tk3: 1, dg3: 1, tk4: 1, dg4: 1, tk5: 1, dg5: 1, kzkd: 1, jdbs: 0, gdjx1: 1, gdjx2: 1, gdjx3: 1, gdjx4: 1, gdjx5: 1 };
const DEMO_FLOWS = {
  normal: { node: '试验检测' },
  returned: { node: '试验检测', returned: true, returnReason: '绝缘厚度测量第 2 个点位与标准限值偏差较大，请复核后重新上传', returnedFrom: '数据审核', by: '张伟', role: '数据审核', at: '07-04 10:20' },
  locked: { node: '组内审核' },
};
const CONDUCTOR_STRUCTURE_OPTIONS = ['实心导体', '非紧压绞合圆形', '紧压绞合圆形', '绞合成型'];

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
  const configuredDevices = React.useMemo(() => MOCK.getConfiguredDevices(ctx.item), [ctx.item]);
  const presetUploaded = ctx.status === 'done' || isFlowReturned(ctx.flow || ctx.item?.flow);
  const initialSelectedIds = presetUploaded ? defaultRecordedIds(configuredDevices, ctx.item) : [];
  const [selectedIds, setSelectedIds] = React.useState(initialSelectedIds);

  const [returnTouched, setReturnTouched] = React.useState(false);
  const [activeSubId, setActiveSubId] = React.useState(subs[0]?.id || '');
  const [cells, setCells] = React.useState(() => {
    const map = toCellMap(createCollectCells(ctx));
    if (!presetUploaded) return map;
    const snap = snapshotDevices(configuredDevices, initialSelectedIds);
    return Object.fromEntries(Object.entries(map).map(([key, cell]) => [
      key,
      cell.status === 'uploaded' ? { ...cell, submittedDevices: snap } : cell,
    ]));
  });
  const [activeCellKey, setActiveCellKey] = React.useState('');
  const [busy, setBusy] = React.useState(null);
  const [demoFlow, setDemoFlow] = React.useState(null);
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
  const isAutoDirect = subs.length > 0 && subs.every((sub) => (sub.method || sub.device?.method || 'manual') === 'auto');
  const hasSelectedDevice = selectedIds.length > 0;
  const selectionLockReason = flowLocked ? 'flow' : summary.uploaded > 0 ? 'uploaded' : null;
  const timingCtl = useTestItemTiming(ctx, {
    uploadedCount: summary.uploaded,
    allUploaded: summary.allUploaded,
    flowLocked,
    isAutoDirect,
    hasSelectedDevice,
  });
  const { guardStartForUpload, guardStartForOcr, guardStartForManual, clearEndedOnReset, requireStartBeforeCollect, notify } = timingCtl;

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
  const activeDevice = activeSub?.device || null;
  const method = activeSub?.method || activeDevice?.method || 'manual';
  const handInputBlocked = requireStartBeforeCollect && (method === 'manual' || method === 'ble');
  const ocrScenarios = React.useMemo(
    () => MOCK.resolveOcrScenarios(ctx.item, activeDevice),
    [ctx.item, activeDevice],
  );
  const passedScenarios = getPassedScenarios(ocrScenarios);
  const hasPassedRule = passedScenarios.length > 0;
  const caps = getMethodCapabilities(method, hasPassedRule, ocrScenarios);
  const mainTimes = Math.max(1, ...subs.map((sub) => Object.values(cells).filter((cell) => cell.subItemId === sub.id).length));

  function currentDeviceSnap() {
    return snapshotDevices(configuredDevices, selectedIds);
  }

  function guardSubmit() {
    if (!guardStartForUpload()) return false;
    if (!hasSelectedDevice) {
      notify('请先选择至少一台设备');
      return false;
    }
    return true;
  }

  function toggleDevice(id) {
    if (selectionLockReason) {
      notify(selectionLockReason === 'uploaded'
        ? '已有试验数据上传，不能更改设备。请先重置清除全部已上传数据'
        : '流程已锁定，不能更改设备');
      return;
    }
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
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
        next[cell.key] = { ...cell, status: 'uploaded', vals, submittedDevices: cell.submittedDevices || currentDeviceSnap() };
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
    if (!sub || flowLocked) return;
    const source = sub.method || sub.device?.method || 'manual';
    if (source === 'auto' && !guardSubmit()) return;
    const snap = currentDeviceSnap();
    touchReturn();
    setBusy('all-' + sub.id);
    setTimeout(() => {
      setCells((prev) => {
        let next = prev;
        sortCells(Object.values(prev).filter((cell) => cell.subItemId === sub.id)).forEach((cell) => {
          if (cell.status !== 'uploaded' || flowReturned) {
            next = markCellFilled(next, cell.key, fillValues(sub, cell), { source });
            if (source === 'auto') next = markCellUploaded(next, cell.key, { submittedDevices: snap });
          }
        });
        return next;
      });
      setBusy(null);
    }, source === 'external' ? 850 : 1050);
  }

  function collectOne(sub, cell) {
    if (!sub || !cell || flowLocked) return;
    const source = sub.method || sub.device?.method || 'manual';
    if (source === 'ocr' && !guardStartForOcr()) return;
    if (source === 'ble' && !guardStartForManual()) return;
    const scenario = selectedScenarioFor(cell.key);
    const meta = scenarioMeta(scenario);
    if (source === 'ocr' && (!hasPassedRule || !meta)) return;
    touchReturn();
    setBusy('c-' + cell.key);
    const existingAttach = source === 'ocr' ? getAttachmentForScenario(cell.attachments, scenario) : null;
    runOcrCapturePipeline({
      file: null,
      attachment: existingAttach,
      mockDelayMs: source === 'ble' ? 1100 : 900,
    }).then(() => {
      setCells((prev) => {
        const cur = prev[cell.key];
        const partial = source === 'ocr' ? fillScenarioValues(sub, cell, meta.fieldKeys) : fillValues(sub, cell);
        const merged = source === 'ocr' ? mergeOcrFields(cur?.vals, partial, meta.fieldKeys) : partial;
        let next = markCellFilled(prev, cell.key, merged, { source });
        if (source === 'ocr') {
          next = updateCell(next, cell.key, (c) => ({
            ...c,
            attachments: upsertScenarioAttachment(c.attachments, scenario, {
              id: Date.now() + '_ocr',
              kind: 'photo',
              orientationApplied: getCameraOrientationConfig().enabled,
            }),
          }));
        }
        return next;
      });
      if (source === 'ocr') setEditCells((prev) => ({ ...prev, [cell.key]: false }));
      setBusy(null);
    });
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
        source: cur.source || method,
      };
    }));
  }

  function uploadCell(cellKey) {
    if (flowLocked) return;
    if (!guardSubmit()) return;
    const snap = currentDeviceSnap();
    touchReturn();
    setBusy('up-' + cellKey);
    setTimeout(() => {
      setCells((prev) => markCellUploaded(prev, cellKey, { submittedDevices: snap }));
      setBusy(null);
    }, 700);
  }

  function uploadAll() {
    if (flowLocked) return;
    if (!guardSubmit()) return;
    const snap = currentDeviceSnap();
    touchReturn();
    setBusy('upload-all');
    setTimeout(() => {
      setCells((prev) => {
        let next = prev;
        Object.values(prev).forEach((cell) => {
          if (cell.status === 'filled' || cell.status === 'failed') next = markCellUploaded(next, cell.key, { submittedDevices: snap });
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
        submittedDevices: null,
        source: null,
      },
    ])));
  }

  function reRecognizeCell(sub, cell) {
    const scenario = selectedScenarioFor(cell.key);
    const meta = scenarioMeta(scenario);
    const existingAttach = getAttachmentForScenario(cell.attachments, scenario);
    if (!sub || !cell || flowLocked || !meta || !existingAttach) return;
    touchReturn();
    const source = sub.method || 'manual';
    setBusy('c-' + cell.key);
    runOcrCapturePipeline({ file: null, attachment: existingAttach, mockDelayMs: 950 }).then(() => {
      setCells((prev) => {
        const cur = prev[cell.key];
        const partial = fillScenarioValues(sub, cell, meta.fieldKeys);
        return markCellFilled(prev, cell.key, mergeOcrFields(cur?.vals, partial, meta.fieldKeys), { source });
      });
      setEditCells((prev) => ({ ...prev, [cell.key]: false }));
      setBusy(null);
    });
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
      submittedDevices: null,
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

  const methodMissing = !method;
  const fieldMissing = !activeSub.fields.length;
  const methodHint = ({
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
          <Section title="设备信息" icon="cpu" compact extra={
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>已选 {selectedIds.length} 台</span>
          }>
            <ConfiguredDeviceSelect
              devices={configuredDevices}
              selectedIds={selectedIds}
              locked={!!selectionLockReason}
              lockReason={selectionLockReason}
              onToggle={toggleDevice}
            />
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
          hasSelectedDevice={hasSelectedDevice}
          onRecordStartClick={timingCtl.handleRecordStartClick}
          onConfirmOverwrite={timingCtl.recordStart}
          onCancelOverwrite={timingCtl.cancelOverwrite}
        />
        </AnnotatedWrapper>

        {(methodMissing || fieldMissing) && (
          <ConfigError
            title="当前配置异常"
            body={methodMissing ? '缺少设备采集方式，请先维护采集方式。' : '缺少试验字段模板，请先维护字段配置。'}
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
            <SubItemSwitches subs={subs} activeSub={activeSub} summary={summary} onSelect={setActiveSubId} />
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
                      traceDevices={activeCell.status === 'uploaded' ? (activeCell.submittedDevices || []) : currentDeviceSnap()}
                      traceUploaded={activeCell.status === 'uploaded'}
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

      <OcrImagePreview
        open={!!previewAttach}
        scenario={previewAttach?.scenario}
        onClose={() => setPreviewAttach(null)}
      />
      <TimingToast message={timingCtl.toast} />
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


function CellEditor({ sub, cell, method, caps, busy, flowLocked, flowReturned, traceDevices, traceUploaded, env, envMock, handInputBlocked = false, onHandInputBlocked, ocrScenarios, selectedScenario, onScenarioChange, ocrUnlocked, onCollect, onReRecognize, onSetOcrUnlocked, onChange, onUpload, onReset, onAddAttach, onRemoveAttach, onPreviewAttach }) {
  const busyCell = busy === 'c-' + cell.key;
  const uploading = busy === 'up-' + cell.key;
  const filled = cell.status === 'filled' || cell.status === 'uploaded' || cell.status === 'failed';
  const ocrField = method === 'ocr' && caps.ocrReady;
  const ocrLocked = ocrField && filled && !ocrUnlocked && !flowLocked && (cell.status !== 'uploaded' || flowReturned);
  const readOnly = flowLocked || caps.isReadOnlySource || (cell.status === 'uploaded' && !flowReturned);
  const canEdit = !readOnly && caps.canEdit && !ocrLocked && !handInputBlocked;
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
              <SubmittedDeviceTrace uploaded={traceUploaded} devices={traceDevices} />
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
                ocrScenarios={ocrScenarios}
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

function AttachmentList({ cell, method, flowLocked, ocrScenarios, selectedScenario, onAdd, onRemove, onPreview }) {
  const title = method === 'ocr' ? '识别参照图' : '参照图';
  const hint = method === 'ocr' ? '· 按场景 · 同场景新拍覆盖旧图' : '· 随数据一起上传归档';
  const filled = cell.status === 'filled' || cell.status === 'uploaded' || cell.status === 'failed';
  const displayAttachments = method === 'ocr'
    ? sortAttachmentsByScenario(getOcrReferenceAttachments(cell.attachments, { filled, isOcr: true, ocrScenarios }))
    : cell.attachments;
  return (
    <div style={{ paddingTop: 10, borderTop: '1px dashed var(--divider)' }}>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 8 }}>{title} <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-placeholder)' }}>{hint}</span></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {displayAttachments.map((item) => (
          method === 'ocr'
            ? (
              <OcrAttachmentThumb
                key={item.id}
                attachment={item}
                flowLocked={flowLocked}
                onPreview={onPreview && !item.mock ? onPreview : undefined}
                onRemove={onRemove && !item.mock ? onRemove : undefined}
              />
            )
            : (
              <div key={item.id} style={{ position: 'relative', width: 76, height: 76, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-default)', background: 'repeating-linear-gradient(135deg,#eef1f5 0 8px,#e6eaef 8px 16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <CameraIcon />
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono,monospace)' }}>{item.kind === 'photo' ? '拍照' : '上传'}</span>
                {!flowLocked && !item.mock && <button onClick={() => onRemove(item.id)} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>}
              </div>
            )
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
