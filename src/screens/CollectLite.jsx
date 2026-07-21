import React from 'react';
import { AppBar, Button, Card, CollectBadge, FieldRow } from '../design-system.js';
import { MOCK as M } from '../mock.js';
import { EnvInfoSection, getOcrReferenceAttachments, mergeRecordEnvVals, RecordEnvFields, resolveEnvMock } from './collect-env.jsx';
import { DeviceSwitchDrawer } from './DeviceSwitchDrawer.jsx';
import { resolveInspectStampState } from './collect-model.js';
import { AnnotatedWrapper } from '../annotation/index.js';
import { SampleLabelQrLink } from './SampleLabelQr.jsx';
import { useTestItemTiming } from './useTestItemTiming.js';
import { TestItemTimingSection } from '../../components/data-display/TestItemTimingSection.jsx';
import { TimingToast } from '../../components/data-display/TimingToast.jsx';
import { OcrCaptureBar } from './OcrCaptureBar.jsx';
import { OcrImagePreview } from './OcrImagePreview.jsx';
import { OcrAttachmentThumb } from './OcrAttachmentThumb.jsx';
import {
  clearScenarioFields, getAttachmentForScenario, getDefaultScenario, getPassedScenarios,
  mergeOcrFields, removeScenarioAttachment, sortAttachmentsByScenario, upsertScenarioAttachment,
} from './ocr-scenario.js';
import { getCameraOrientationConfig } from '../camera-orientation-config.js';
import { runOcrCapturePipeline } from '../ocr-image-pipeline.js';

/* 轻量 LIMS 试验项 L4：参数平铺展示，数采仅采集实测值 */

const FLOW_LOCK_AFTER = ['组内审核', '数据审核', '报告编制', '报告审核', '报告签发', '报告处理', '收费审批', '报告发放', '任务归档', '任务完成'];
const DEMO_FLOWS = {
  normal: { node: '试验检测' },
  returned: { node: '试验检测', returned: true, returnReason: '交流耐压试验值与标称值偏差较大，请复测后重新上传', returnedFrom: '数据审核', by: '张伟', role: '数据审核', at: '06-25 14:30' },
  locked: { node: '组内审核' },
};

/** 轻量版：wd/sd 在试验参数区展示，有传感器时由环境信息回填，无传感器时手输 */
const ENV_FIELD_KEYS = new Set(['wd', 'sd']);

/** 原型演示：OCR / 直采回填用的轻量版字段基准值 */
const LITE_DEMO_VALS = {
  bzz: '45', syz: '45', sj: '1', ztms: '无异常',
  wg: '完好', yxjccd: '0.70',
  syc: '1.0',
  wd: '21.0', qy: '1013', sd: '30.7', beizhu: '',
};

function CollectLite({ ctx, onBack, onDone }) {
  const fields = ctx.item?.fields || [];
  const hasEnvFields = fields.some((f) => ENV_FIELD_KEYS.has(f.key));
  const measureFields = fields.filter((f) => f.key !== 'jl' && f.key !== 'bhgyy' && !ENV_FIELD_KEYS.has(f.key));
  const isReview = !!(ctx.reviewMode || ctx.status === 'done');
  const demoVals = ctx.item?.doneVals || {};
  const N = ctx.item?.count ?? 1;

  const itemDevices = React.useMemo(() => M.getDeviceDrawerPool(ctx.item), [ctx.item]);

  const initialDev = M.resolveLiteDevice(ctx.item) || ctx.device || itemDevices[0] || { name: '手工录入', code: '—', model: '—', method: 'manual' };

  const [dev, setDev] = React.useState(initialDev);
  const [devSwitchOpen, setDevSwitchOpen] = React.useState(false);
  const method = dev.method || ctx.method || ctx.item?.method || 'manual';

  const ocrScenarios = React.useMemo(() => M.resolveOcrScenarios(ctx.item, dev), [ctx.item, dev]);
  const passedScenarios = getPassedScenarios(ocrScenarios);
  const hasPassedRule = passedScenarios.length > 0;
  const ocrReady = method === 'ocr' && hasPassedRule;
  const isExternal = method === 'external';
  const isSerial = method === 'serial';
  const editable = method === 'ble' || method === 'manual' || method === 'ocr' || isExternal || isSerial;

  const [scene, setScene] = React.useState('');
  const [shootOpen, setShootOpen] = React.useState(false);
  const [shootScenario, setShootScenario] = React.useState(null);
  const [shotPhase, setShotPhase] = React.useState('idle');
  const [attachments, setAttachments] = React.useState([]);
  const [previewAttach, setPreviewAttach] = React.useState(null);
  const [editUnlocked, setEditUnlocked] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const galleryInputRef = React.useRef(null);
  const prevDevIdRef = React.useRef(dev.id);

  const [demoFlow, setDemoFlow] = React.useState(null);
  const flow = demoFlow ? DEMO_FLOWS[demoFlow] : (ctx.flow || ctx.item?.flow || { node: '试验检测' });
  const flowLocked = FLOW_LOCK_AFTER.includes(flow.node);
  const flowReturned = !flowLocked && !!flow.returned;

  const [returnTouched, setReturnTouched] = React.useState(false);
  const [env, setEnv] = React.useState({ wd: '21.0', sd: '30.7' });
  const envMock = React.useMemo(
    () => resolveEnvMock(`${ctx.sample?.code || ''}|${ctx.item?.name || ''}`, { forceGuard: method === 'auto' }),
    [ctx.sample?.code, ctx.item?.name, method],
  );
  const [vals, setVals] = React.useState(() => {
    const init = {};
    fields.forEach((f) => { init[f.key] = demoVals[f.key] ?? ''; });
    // 有 wd/sd 且有传感器时优先用环境信息初值回填（复核态保留 doneVals）
    if (!isReview && hasEnvFields) {
      const initEnv = mergeRecordEnvVals({}, { wd: '21.0', sd: '30.7' }, resolveEnvMock(`${ctx.sample?.code || ''}|${ctx.item?.name || ''}`, { forceGuard: method === 'auto' }));
      if (fields.some((f) => f.key === 'wd') && initEnv.wd) init.wd = initEnv.wd;
      if (fields.some((f) => f.key === 'sd') && initEnv.sd) init.sd = initEnv.sd;
    }
    return init;
  });
  const [uploaded, setUploaded] = React.useState(isReview);
  const [uploading, setUploading] = React.useState(false);
  const filledCount = fields.some((f) => String(vals[f.key] || '').trim() !== '') ? 1 : 0;
  const uploadedCount = uploaded ? 1 : 0;
  const allUploaded = uploaded;
  const isAutoDirect = method === 'auto';
  const timingCtl = useTestItemTiming(ctx, { uploadedCount, allUploaded, flowLocked, isAutoDirect });
  const { guardStartForUpload, guardStartForOcr, guardStartForManual, requireStartBeforeCollect } = timingCtl;
  const handInputBlocked = requireStartBeforeCollect && (method === 'manual' || method === 'ble');
  const filled = measureFields.some((f) => String(vals[f.key] || '').trim() !== '');
  const ocrField = method === 'ocr' && ocrReady;
  const ocrLocked = ocrField && filled && !editUnlocked && !flowLocked && !(uploaded && !flowReturned);
  /** 已检任务 L4：流程未锁定（仍在试验检测或未进组内审核）时可编辑；进入组内审核及以后只读 */
  function isFieldReadOnly({ serialUploaded = false } = {}) {
    if (flowLocked || handInputBlocked) return true;
    if (serialUploaded) return true;
    if (ocrField) return ocrLocked;
    if (uploaded && !flowReturned && !(isReview && !flowLocked)) return true;
    return !editable;
  }
  const fieldsReadOnly = isFieldReadOnly();

  /** 环境信息刷新时，有传感器则同步回填 wd/sd */
  React.useEffect(() => {
    if (!hasEnvFields || fieldsReadOnly) return;
    setVals((prev) => {
      const merged = mergeRecordEnvVals(prev, env, envMock);
      if (merged.wd === prev.wd && merged.sd === prev.sd) return prev;
      return merged;
    });
  }, [env.wd, env.sd, hasEnvFields, fieldsReadOnly, envMock]);

  function guardHandInputRequired() {
    if (method !== 'manual' && method !== 'ble') return true;
    return guardStartForManual();
  }

  function scenarioMeta(name) {
    return (ocrScenarios || []).find((s) => s.name === name) || null;
  }

  function selectedScenario() {
    if (scene) return scene;
    return getDefaultScenario(ocrScenarios)?.name || '';
  }

  function fillScenarioFields(fieldKeys) {
    const v = {};
    (fieldKeys || []).forEach((key) => { v[key] = LITE_DEMO_VALS[key] ?? '—'; });
    return v;
  }

  function fillDemoVals() {
    const v = {};
    fields.forEach((f) => { v[f.key] = demoVals[f.key] ?? LITE_DEMO_VALS[f.key] ?? '—'; });
    return mergeRecordEnvVals(v, env, envMock);
  }

  React.useEffect(() => {
    if (method !== 'ocr' || !hasPassedRule) return;
    const def = getDefaultScenario(ocrScenarios);
    if (!def) return;
    setScene((prev) => (prev && passedScenarios.some((s) => s.name === prev) ? prev : def.name));
  }, [method, hasPassedRule, ocrScenarios, passedScenarios]);

  React.useEffect(() => {
    if (prevDevIdRef.current === dev.id) return;
    prevDevIdRef.current = dev.id;
    setScene('');
    setAttachments([]);
    setEditUnlocked(false);
    setShootOpen(false);
    setShootScenario(null);
    setShotPhase('idle');
    setBusy(false);
  }, [dev.id]);

  function openOcrShoot() {
    if (!guardStartForOcr()) return;
    const scenario = selectedScenario();
    if (!scenario) return;
    setShootScenario(scenario);
    setShootOpen(true);
    setShotPhase('idle');
  }

  async function doShoot(file) {
    const scenario = shootScenario || selectedScenario();
    const meta = scenarioMeta(scenario);
    if (!meta) return;
    touchReturn();
    setShotPhase('recognizing');
    try {
      const { prepared } = await runOcrCapturePipeline({ file: file || null, mockDelayMs: 1100 });
      const partial = fillScenarioFields(meta.fieldKeys);
      setVals((prev) => mergeOcrFields(prev, partial, meta.fieldKeys));
      setShootOpen(false);
      setShootScenario(null);
      setAttachments((prev) => upsertScenarioAttachment(prev, scenario, {
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        kind: 'photo',
        orientationApplied: prepared?.orientationApplied ?? getCameraOrientationConfig().enabled,
        previewUrl: prepared?.objectUrl,
      }));
      setEditUnlocked(false);
    } finally {
      setShotPhase('idle');
    }
  }

  function onGalleryPick(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) doShoot(file);
  }

  function reRecognize() {
    const scenario = selectedScenario();
    const meta = scenarioMeta(scenario);
    if (!meta || !getAttachmentForScenario(attachments, scenario)) return;
    touchReturn();
    setBusy(true);
    setTimeout(() => {
      setVals((prev) => mergeOcrFields(prev, fillScenarioFields(meta.fieldKeys), meta.fieldKeys));
      setEditUnlocked(false);
      setBusy(false);
    }, 950);
  }

  function removeAttach(id) {
    const item = attachments.find((a) => a.id === id);
    setAttachments((prev) => removeScenarioAttachment(prev, id));
    if (item?.scenario) {
      const meta = scenarioMeta(item.scenario);
      if (meta?.fieldKeys?.length) {
        setVals((prev) => clearScenarioFields(prev, meta.fieldKeys));
      }
    }
  }

  function captureBle() {
    if (!guardHandInputRequired()) return;
    touchReturn();
    setBusy(true);
    setTimeout(() => {
      setVals(fillDemoVals());
      setBusy(false);
    }, 1200);
  }

  function captureAuto() {
    touchReturn();
    setBusy(true);
    setTimeout(() => {
      setVals(fillDemoVals());
      setBusy(false);
    }, 1100);
  }

  const methodHint = {
    auto: '设备直连 · 上位机算毕整批写库后 App 自动回填，不可手输',
    ocr: ocrReady ? '逐条拍摄仪器读数屏自动识别，按场景匹配识别规则' : '该设备与试验项下不存在验证通过的识别规则，已回退手工录入',
    ble: '蓝牙采集 · 可连接设备读数，异常时可手输兜底',
    manual: '手工录入数据',
    external: '外部程序代采写库（工业平板）· App 无采集按钮，可查看已采或手输补录',
    serial: '外部程序·串口通路 · 工业平板程序代采写库，本端仅展示，异常时可手输兜底',
  }[method];

  const inspectState = resolveInspectStampState({
    flowReturned,
    returnTouched,
    filledCount,
    uploadedCount: uploaded ? 1 : 0,
    total: 1,
  });

  /** 退回复测：用户修改后标记，用于展示右上角状态水印 */
  function touchReturn() {
    if (flowReturned) setReturnTouched(true);
  }

  function setField(key, value) {
    if (isFieldReadOnly() || uploading) return;
    if (!guardHandInputRequired()) return;
    touchReturn();
    setVals((prev) => ({ ...prev, [key]: value }));
  }

  function upload() {
    if (!guardStartForUpload()) return;
    touchReturn();
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploaded(true);
    }, 600);
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', position: 'relative' }}>
      <AppBar title={ctx.item?.name || '试验检测'} onBack={onBack} />
      {inspectState && <Stamp state={inspectState} />}
      <div style={{ padding: 'var(--gap-page)', paddingBottom: 0 }}>
        <FlowBanner flow={flow} locked={flowLocked} returned={flowReturned} />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-page)', paddingTop: flowLocked || flowReturned ? 0 : 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Section title="基础信息" icon="info">
          <Grid items={[
            ['任务编号', ctx.task?.code || M.taskCodeFromSample(ctx.sample)],
            ['样品编号', M.formatSampleCodeDisplay(ctx.sample)],
            ['样品名称', ctx.sample?.name || '—'],
            ['型号规格', M.sampleSpec(ctx.sample)],
            ['试验名称', ctx.item?.name || '—'],
            ['试验次数', `${N} 次`],
            ...(ctx.task?.detectDeadline ? [['检测时效', ctx.task.detectDeadline]] : []),
          ]} />
          {ctx.item?.overdueTag && M.overdueTagLabel?.[ctx.item.overdueTag] && (
            <div style={{ marginTop: 8, fontSize: 'var(--fs-xs)', color: 'var(--status-overdue-fg,#c53030)' }}>
              {M.overdueTagLabel[ctx.item.overdueTag]}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <SampleLabelQrLink sample={ctx.sample} placement="footerEnd" />
          </div>
        </Section>

        <Section title="设备信息" icon="cpu" extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CollectBadge method={method} size="sm" />
            {!flowLocked && !isReview && itemDevices.length > 1 && (
              <Button size="sm" variant="secondary" onClick={() => setDevSwitchOpen(true)} style={{ height: 28, padding: '0 12px' }}>切换设备</Button>
            )}
          </div>
        }>
          <Grid items={[
            ['检测设备', dev.name || '—'],
            ['设备编号', dev.code || '—'],
            ['设备型号', dev.model || '—'],
            ['所属工位', M.stationLabel(dev.station)],
          ]} />
          {dev.visual && (
            <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              目测 · 不连接设备，参数与结论由检测员手工录入（采集方式同手工录入）
            </div>
          )}
          {method === 'auto' && !dev.visual && (
            <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--collect-auto,#1d54c4)', lineHeight: 1.5 }}>
              设备直连 · 数据由上位机采集写库，本端展示
            </div>
          )}
          {method === 'ble' && !dev.visual && (
            <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--collect-ble,#0a8a96)', lineHeight: 1.5 }}>
              蓝牙采集 · 可连接设备读数，异常时可手输兜底
            </div>
          )}
          {method === 'ocr' && !dev.visual && (
            <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--collect-ocr,#7c5cff)', lineHeight: 1.5 }}>
              {ocrReady ? '拍照识别 · 选择场景后拍摄，多场景图片合并识别字段' : '该设备与试验项下不存在验证通过的识别规则，已回退手工录入'}
            </div>
          )}
          {isSerial && (
            <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--collect-serial,#6d4bd1)', lineHeight: 1.5 }}>
              外部程序·串口通路 · 工业平板程序代采写库，本端仅展示，异常时可手输兜底
            </div>
          )}
          {isExternal && (
            <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--collect-ble,#0a8a96)', lineHeight: 1.5 }}>
              外部程序采集 · 数据由工业平板代采写库
            </div>
          )}
        </Section>

        <EnvInfoSection
          envMock={envMock}
          env={env}
          onRefresh={() => setEnv({ wd: (20 + Math.random() * 3).toFixed(1), sd: (28 + Math.random() * 8).toFixed(1) })}
          Section={Section}
          Grid={Grid}
        />

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

        <AnnotatedWrapper id="testParams" layout="block">
        <Card padding="0">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>试验参数</span>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>共 {N} 次</span>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {methodHint && (
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{methodHint}</div>
            )}

            {(method === 'auto' || isSerial) && !filled && !flowLocked && !isReview && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {busy
                  ? <div style={{ textAlign: 'center', color: 'var(--brand-action)' }}><Spinner /><div style={{ fontSize: 'var(--fs-sm)', marginTop: 10 }}>正在从数据库整批取值…</div></div>
                  : <Button size="lg" onClick={captureAuto}>⚡ 一键采集</Button>}
              </div>
            )}

            {method === 'ocr' && !flowLocked && (
              <OcrCaptureBar
                ocrScenarios={ocrScenarios}
                value={selectedScenario()}
                onChange={setScene}
                onShoot={openOcrShoot}
                busy={busy || shotPhase === 'recognizing'}
              />
            )}

            {method === 'ble' && !filled && !flowLocked && !isReview && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={captureBle} disabled={busy}>{busy ? '连接中…' : '🔵 连接采集'}</Button>
              </div>
            )}

            {busy && method !== 'auto' && method !== 'serial'
              ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--brand-action)' }}><Spinner /><div style={{ fontSize: 'var(--fs-sm)', marginTop: 10 }}>{method === 'ble' ? '正在连接设备…' : '正在识别读数…'}</div></div>
              : <>
            {measureFields.map((f) => (
              f.options
                ? <SelectField key={f.key} field={f} value={vals[f.key] || ''} readOnly={isFieldReadOnly() || uploading}
                    onReadOnlyInteract={handInputBlocked ? guardStartForManual : undefined}
                    onChange={(v) => setField(f.key, v)} />
                : <FieldRow key={f.key} label={f.label} unit={f.unit} required={false}
                    value={vals[f.key] || ''} readOnly={isFieldReadOnly() || uploading}
                    onReadOnlyInteract={handInputBlocked ? guardStartForManual : undefined}
                    placeholder={filled ? '' : '请输入'}
                    onChange={(e) => setField(f.key, e.target.value)} />
            ))}
            {hasEnvFields && (
              <AnnotatedWrapper id="recordEnvFields" layout="block">
                <RecordEnvFields
                  env={env}
                  envMock={envMock}
                  vals={vals}
                  readOnly={isFieldReadOnly() || uploading}
                  handInputBlocked={handInputBlocked}
                  onReadOnlyInteract={guardStartForManual}
                  onChange={(key, value) => setField(key, value)}
                  FieldRow={FieldRow}
                />
              </AnnotatedWrapper>
            )}

            {method === 'auto' && filled && (
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--collect-auto,#1d54c4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                自动采集数据，不可修改
              </div>
            )}

            {ocrField && !flowLocked && filled && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: '8px 10px', borderRadius: 'var(--radius-md)', background: ocrLocked ? 'var(--surface-sunken)' : 'rgba(176,106,0,0.08)', border: '1px solid ' + (ocrLocked ? 'var(--border-default)' : 'var(--collect-ocr,#b06a00)') }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', lineHeight: 1.5, color: ocrLocked ? 'var(--text-secondary)' : 'var(--collect-ocr,#b06a00)', minWidth: 0 }}>
                  {ocrLocked
                    ? <React.Fragment><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>识别结果已锁定，防止误触改动 · 如需矫正请点「编辑」</React.Fragment>
                    : <React.Fragment><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>编辑中 · 若改乱了可「重新识别」用原照片还原</React.Fragment>}
                </span>
                <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
                  <button type="button" onClick={reRecognize} disabled={!getAttachmentForScenario(attachments, selectedScenario())}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-strong)', background: 'var(--white)', color: getAttachmentForScenario(attachments, selectedScenario()) ? 'var(--text-body)' : 'var(--text-placeholder)', cursor: getAttachmentForScenario(attachments, selectedScenario()) ? 'pointer' : 'not-allowed', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                    重新识别
                  </button>
                  {ocrLocked
                    ? <button type="button" onClick={() => setEditUnlocked(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--collect-ocr,#b06a00)', background: 'var(--collect-ocr-bg,#fff4e6)', color: 'var(--collect-ocr,#b06a00)', cursor: 'pointer', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                        编辑
                      </button>
                    : <button type="button" onClick={() => setEditUnlocked(false)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--brand-action)', background: 'var(--brand-action)', color: '#fff', cursor: 'pointer', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                        完成
                      </button>}
                </div>
              </div>
            )}

            {ocrField && filled && (
              <div style={{ paddingTop: 10, marginTop: 2, borderTop: '1px dashed var(--divider)' }}>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  识别参照图 <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-placeholder)' }}>· 按场景 · 同场景新拍覆盖旧图</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {sortAttachmentsByScenario(getOcrReferenceAttachments(attachments, { filled, isOcr: true, ocrScenarios })).map((a) => (
                    <OcrAttachmentThumb
                      key={a.id}
                      attachment={a}
                      flowLocked={flowLocked}
                      onPreview={!a.mock ? setPreviewAttach : undefined}
                      onRemove={!a.mock ? removeAttach : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {!filled && !busy && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4 M12 8h.01"/></svg>
                <span>{method === 'ocr' ? (ocrReady ? '字段待采集 · 选择场景后点击「拍照识别」，多场景图片合并识别字段' : '该设备与试验项下不存在验证通过的识别规则 · 请在上方字段手动输入') : method === 'ble' ? '字段待采集 · 点击「连接采集」同步，或直接在上方手动输入' : method === 'auto' ? '字段待采集 · 等待上位机写库回填（原型可用上方「一键采集」）' : isExternal ? '字段待采集 · 等待平板外部程序写库，或在上方手输补录' : isSerial ? '字段待采集 · 等待外部程序·串口写库（原型可用上方「一键采集」），或手输兜底' : '字段待采集 · 请在上方手动输入'}</span>
              </div>
            )}

            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              暂未配置是否必填，暂不做必填约束
            </div>
            </>}
          </div>
        </Card>
        </AnnotatedWrapper>
      </div>

      {!isReview && (
        <div style={{ position: 'absolute', left: 12, bottom: 88, zIndex: 60, display: 'flex', alignItems: 'center', gap: 4, padding: '5px 7px', borderRadius: 'var(--radius-pill)', background: 'rgba(20,30,55,0.86)', boxShadow: 'var(--shadow-lg)' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, padding: '0 4px' }}>演示·流程</span>
          {[['normal', '正常'], ['returned', '退回'], ['locked', '锁定']].map(([k, label]) => {
            const cur = demoFlow || (flowLocked ? 'locked' : flowReturned ? 'returned' : 'normal');
            const on = cur === k;
            return (
              <button key={k} onClick={() => setDemoFlow(k)} style={{ border: 'none', cursor: 'pointer', padding: '4px 11px', borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 600, background: on ? 'var(--white)' : 'transparent', color: on ? 'var(--text-title)' : 'rgba(255,255,255,0.85)' }}>{label}</button>
            );
          })}
        </div>
      )}

      <AnnotatedWrapper id="uploadActions" layout="block">
      <div style={{ display: 'flex', gap: 12, padding: 'var(--gap-page)', borderTop: '1px solid var(--border-default)', background: 'var(--white)' }}>
        {flowLocked
          ? <Button block onClick={onBack}>返回（数据已锁定）</Button>
          : isReview && !flowLocked
          ? <Button block disabled={uploading} onClick={upload}>{uploading ? '上传中…' : (uploaded ? '重新上传' : '上传结果')}</Button>
          : uploaded
          ? <Button block onClick={onDone}>完成并退出</Button>
          : <Button block disabled={uploading} onClick={upload}>{uploading ? '上传中…' : '上传结果'}</Button>}
      </div>
      </AnnotatedWrapper>

      {devSwitchOpen && (
        <DeviceSwitchDrawer
          devices={itemDevices}
          currentId={dev.id}
          onSelect={(d) => { setDev(d); setDevSwitchOpen(false); }}
          onClose={() => setDevSwitchOpen(false)}
          isBlocked={(d) => M.isDeviceBlockedForTest(ctx.item?.name, d)}
        />
      )}

      {shootOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 200, background: '#0b0d10', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', color: '#fff' }}>
            <button type="button" onClick={() => { setShootOpen(false); setShotPhase('idle'); }} style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 'var(--fs-base)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              取消
            </button>
            <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>拍照识别{shootScenario ? ` · ${shootScenario}` : ''}</span>
            <span style={{ width: 56 }} />
          </div>
          <div style={{ flex: 1, position: 'relative', margin: '0 16px', borderRadius: 'var(--radius-lg,16px)', overflow: 'hidden', background: 'repeating-linear-gradient(135deg,#1a1d22 0 14px,#16191e 14px 28px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {shotPhase === 'recognizing' ? (
              <div style={{ textAlign: 'center', color: '#8fd0ff' }}>
                <Spinner />
                <div style={{ fontSize: 'var(--fs-base)', marginTop: 12 }}>正在识别仪器读数…</div>
              </div>
            ) : (
              <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 'var(--fs-sm)' }}>将「{dev.name || '仪器'}」{shootScenario ? `· ${shootScenario}` : ''} 对准取景框</div>
            )}
          </div>
          <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onGalleryPick} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '22px 24px 30px' }}>
            <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={shotPhase === 'recognizing'} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', opacity: shotPhase === 'recognizing' ? 0.4 : 1 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              <span style={{ fontSize: 'var(--fs-sm)' }}>从相册选择</span>
            </button>
            <button type="button" onClick={() => doShoot(null)} disabled={shotPhase === 'recognizing'} style={{ width: 72, height: 72, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.9)', background: 'var(--brand-action)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: shotPhase === 'recognizing' ? 0.4 : 1 }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></svg>
            </button>
            <div style={{ width: 56 }} />
          </div>
        </div>
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

function Stamp({ state }) {
  const C = { todo: { label: '未检测', color: '#E8A93A', fill: 'rgba(245,196,99,0.14)' }, doing: { label: '检测中', color: '#5B95E8', fill: 'rgba(127,176,242,0.16)' }, done: { label: '已检测', color: '#4FB97E', fill: 'rgba(134,214,166,0.16)' } }[state];
  const cx = 110, cy = 110, R = 100;
  const stars = Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2 - Math.PI / 2;
    const r = R - 9;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    return <circle key={i} cx={x} cy={y} r={i % 2 ? 2.2 : 3.4} fill={C.color} />;
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

function Section({ title, icon, extra, children }) {
  const paths = {
    info: 'M12 16v-4 M12 8h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    cpu: 'M4 4h16v16H4z M9 9h6v6H9z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 14h3 M1 9h3 M1 14h3',
    thermometer: 'M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z',
  };
  return (
    <Card padding="0">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--divider)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-action)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={paths[icon]} /></svg>
          <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>{title}</span>
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
        <div key={i} style={{ display: 'flex', gap: 8, fontSize: 'var(--fs-base)' }}>
          <span style={{ color: 'var(--text-secondary)', flex: 'none' }}>{k}</span>
          <span style={{ color: 'var(--text-title)', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function FlowBanner({ flow, locked, returned }) {
  if (!locked && !returned) return null;
  if (locked) {
    return (
      <div style={{ display: 'flex', gap: 10, padding: '12px 14px', marginBottom: 14, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border-strong)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-pending,#e8a93a)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><path d="M9 14 4 9l5-5"/><path d="M4 9h11a4 4 0 0 1 0 8h-1"/></svg>
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

function Spinner() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'lk-spin 0.9s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function SelectField({ field, value, readOnly, onReadOnlyInteract, onChange }) {
  const blocked = readOnly && !!onReadOnlyInteract;
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 14 }}
      onClick={blocked ? (e) => { e.preventDefault(); onReadOnlyInteract(); } : undefined}
    >
      <label style={{ width: 110, flex: 'none', fontSize: 'var(--fs-base)', color: 'var(--text-body)', display: 'flex', gap: 2 }}>
        {field.required !== false && <span style={{ color: 'var(--danger)' }}>*</span>}
        <span>{field.label}{field.unit ? `（${field.unit}）` : ''}</span>
      </label>
      <select value={value} disabled={readOnly} tabIndex={blocked ? -1 : undefined}
        onMouseDown={blocked ? (e) => { e.preventDefault(); onReadOnlyInteract(); } : undefined}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, height: 44, padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)',
          background: readOnly ? 'var(--surface-sunken,#f5f6f8)' : 'var(--white)', fontSize: 'var(--fs-base)',
          color: value ? 'var(--text-title)' : 'var(--text-placeholder)', outline: 'none', boxSizing: 'border-box',
        }}>
        <option value="">请选择</option>
        {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

export { CollectLite };
