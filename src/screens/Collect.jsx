import React from 'react';
import { AppBar, Button, Card, CollectBadge, FieldRow, UploadStatus } from '../design-system.js';
import { MOCK as M } from '../mock.js';
import { CollectStructured } from './CollectStructured.jsx';
import { CollectLite } from './CollectLite.jsx';
import { isCompositeItem, isFlowReturned, resolveInspectStampState } from './collect-model.js';
import { useTestItemTiming } from './useTestItemTiming.js';
import { TestItemTimingSection } from '../../components/data-display/TestItemTimingSection.jsx';
import { TimingToast } from '../../components/data-display/TimingToast.jsx';
import { EnvInfoSection, getOcrReferenceAttachments, resolveEnvMock } from './collect-env.jsx';
import { DeviceSwitchDrawer } from './DeviceSwitchDrawer.jsx';
import { AnnotatedWrapper } from '../annotation/index.js';
import { SampleLabelQrLink } from './SampleLabelQr.jsx';

/* 采集详情（L4）— 基础/设备/环境 + 按「采集方式」自适应的 N 次字段录入 + 汇总 + 上传
   试验次数 N = 样段数量 × 试样数量 × 测试芯数（随 LIMS 任务下发，检测员不可改）。
   · 设备直采(auto)：上位机算完整批写库，页面一键从库取值整批回填，只读。
   · 蓝牙/串口(ble)：逐条采集（一次一条读数），可手输。
   · 图像采集(ocr)：逐条拍照识别；拍照入口仅当「采集方式=图采 且 识别规则验证状态=已通过」时出现，否则回退手输。
   · 外部程序(external)：电子天平类，平板程序代采写库，App 不出现采集按钮，仅手输补录 + 查看已采数据。
   · 汇总字段（结论 jl / 平均值 pjz）：N 次全部完成后整体计算一次（auto 由上位机随数据回传）。 */

  const SUMMARY_KEYS = new Set(['jl', 'pjz']); // 汇总字段：整组算一次

  // 各字段每次的基准读数（按次轻微抖动，模拟真实多芯/多试样差异）
  const BASE = {
    zx: 159.88, fx: 143.10, cd: 1.000,
    jggd: 12.5, sywd: 20.0, scdz: 0.0186, dz20: 0.124,
    bcz: 4.50, csz: 4.52, jsz: 4.50, hctk: 2.48, gdkd: 40.0, dckd: 20.0,
    kzqd: 18.6, dlcl: 480, fhcl: 85, lqbx: 12, sssl: 3.2,
    jysd: 23, msa: 12.42, msil: 5.18, mchui: 6.24, msich: 11.38,
    syzjz: '试样密度大于浸渍液密度', jzylx: '水',
    sykd: 10.0, syhd: 1.00, fmax: 250, lu: 75, l0: 25, spkd: 10.0, sphd: 1.00, l1: 100, l2: 26,
  };
  const DEC = { zx: 2, fx: 2, pj: 2, wb: 2, jg: 4, cd: 3, scdz: 4, dz20: 3, bcz: 2, csz: 2, jsz: 2, hctk: 2, gdkd: 1, dckd: 1, kzqd: 1, sssl: 1, jggd: 1, sywd: 1, dlcl: 0, fhcl: 0, lqbx: 0, jysd: 0, msa: 2, msil: 2, mchui: 2, msich: 2,
    sykd: 2, syhd: 3, fmax: 1, lu: 1, l0: 1, spkd: 2, sphd: 3, l1: 1, l2: 1 };
  function valAt(key, i) {
    if (key === 'syzjz') return BASE.syzjz;
    if (key === 'jzylx') return BASE.jzylx;
    if (key === 'sywd') return BASE.sywd.toFixed(1);
    if (key === 'jysd') return BASE.jysd.toFixed(0);            // 浸渍液温度恒定
    if (key === 'cd') return BASE.cd.toFixed(3);                // 长度恒定
    if (key === 'pj' || key === 'wb' || key === 'jg') {        // 平均/温补/结果由正反向推算
      const zx = +valAt('zx', i), fx = +valAt('fx', i);
      const pj = (zx + fx) / 2;
      if (key === 'pj') return pj.toFixed(2);
      const wb = pj * 1.086;                                   // 温度补偿
      if (key === 'wb') return wb.toFixed(2);
      return (wb / BASE.cd / 1000).toFixed(4);                 // 结果 Ω/km
    }
    const base = BASE[key]; if (base == null) return '';
    const jitter = base * 0.012 * (((i * 37 + key.length * 13) % 7) - 3) / 3; // ±~1.2%
    return (base + jitter).toFixed(DEC[key] ?? 2);
  }

  // 试验次数：样段 × 试样 × 芯数（芯数从样品名解析，样段/试样取自任务，demo=1）
  function deriveCount(ctx) {
    const explicit = ctx.count ?? ctx.item?.count;
    if (explicit != null) return { duan: 1, shi: explicit, xin: 1, total: explicit };
    const m = (ctx.sample?.name || '').match(/(\d+)\s*芯/);
    const xin = m ? +m[1] : 1;
    const duan = ctx.seg || 1, shi = ctx.specimen || 1;
    return { duan, shi, xin, total: duan * shi * xin };
  }

  function Collect({ ctx, onBack, onDone }) {
    if (ctx.item?.limsLite) {
      return <CollectLite ctx={ctx} onBack={onBack} onDone={onDone} />;
    }
    // 含「试验子项」的试验项（如 结构尺寸检查—导体&绝缘厚度&金属屏蔽）走专用的子项/设备切换体验
    if (isCompositeItem(ctx.item)) {
      return <CollectStructured ctx={ctx} onBack={onBack} onDone={onDone} />;
    }
    const [dev, setDev] = React.useState(ctx.device || {});
    const [devSwitchOpen, setDevSwitchOpen] = React.useState(false);
    const method = dev.method || ctx.method || (ctx.device && ctx.device.method) || 'auto';
    const itemDevices = React.useMemo(() => M.getDeviceDrawerPool(ctx.item), [ctx.item]);
    const tpl = ctx.item?.tpl ? M.fieldTpl[ctx.item.tpl] : M.fieldTpl.size;
    const rule = (M.testRules && M.testRules[ctx.item?.name]) || {};
    const isDensityTpl = ctx.item?.tpl === 'density';

    function fieldsForSyzjz(syzjzVal) {
      const all = tpl.filter((f) => !SUMMARY_KEYS.has(f.key));
      if (!isDensityTpl) return all;
      const mode = syzjzVal === '试样密度小于浸渍液密度' ? 'less' : 'greater';
      return all.filter((f) => !f.densityMode || f.densityMode === mode);
    }

    const measureFields = tpl.filter((f) => !SUMMARY_KEYS.has(f.key));

    // 图采是否就绪：采集方式=图采 且 识别规则验证状态=已通过
    const ocrReady = method === 'ocr' && ctx.ocrVerified !== false;
    const isExternal = method === 'external';
    const isSerial = method === 'serial';
    const editable = method === 'ble' || method === 'manual' || method === 'ocr' || isExternal || isSerial;
    const phasedCfg = (ctx.item && ctx.item.phased != null) ? ctx.item.phased : (rule.phased != null ? rule.phased : null);
    const isCable = phasedCfg != null ? !!phasedCfg : !!ctx.sample?.cable; // 是否含相别
    // 试验次数模型：含相别 → 红/黄/绿 三相，每相 perPhase 次；无相别 → 共 count 次
    const phaseList = isCable ? ['红', '黄', '绿'] : null;
    const perPhase = isCable
      ? (ctx.item?.perPhase ?? rule.perPhase ?? ctx.item?.count ?? 1)
      : (ctx.item?.count ?? rule.count ?? deriveCount(ctx).total);
    const N = isCable ? phaseList.length * perPhase : perPhase;
    const phaseOf = (i) => (isCable ? phaseList[Math.floor(i / perPhase)] : null);
    const phaseWithin = (i) => (isCable ? (i % perPhase) : i);
    const PHASE_C = { '红': 'var(--danger,#e23b3b)', '黄': 'var(--status-pending,#e8a93a)', '绿': 'var(--status-done,#1faa54)' };
    // LIMS 流程门控：进入「组内审核」及以后 → 数据锁定不可改；退回到「试验检测」→ 可改并需重新上传
    const FLOW_LOCK_AFTER = ['组内审核', '数据审核', '报告编制', '报告审核', '报告签发', '报告处理', '收费审批', '报告发放', '任务归档', '任务完成'];
    const DEMO_FLOWS = {
      normal: { node: '试验检测' },
      returned: { node: '试验检测', returned: true, returnReason: '第 2 次正向电阻读数与历史数据偏差较大，疑似拍照识别误差，请复测后重新上传', returnedFrom: '数据审核', by: '张伟', role: '数据审核', at: '06-25 14:30' },
      locked: { node: '组内审核' },
    };
    const [demoFlow, setDemoFlow] = React.useState(null);
    const flow = demoFlow ? DEMO_FLOWS[demoFlow] : (ctx.flow || ctx.item?.flow || { node: '试验检测' });
    const flowLocked = FLOW_LOCK_AFTER.includes(flow.node);
    const flowReturned = !flowLocked && !!flow.returned;
    const initialReturned = isFlowReturned(ctx.flow || ctx.item?.flow);

    const initTimes = () => Array.from({ length: N }, () => ({ status: 'idle', vals: {}, uploaded: false }));
    const [times, setTimes] = React.useState(initTimes);
    const [returnTouched, setReturnTouched] = React.useState(false);
    const [busy, setBusy] = React.useState(null);   // 'all' | time index | null
    const [phase, setPhase] = React.useState(ctx.status === 'done' ? 'done' : 'idle'); // idle|filled|uploading|done
    const [env, setEnv] = React.useState({ wd: '21.0', sd: '30.7' });
    const envMock = React.useMemo(
      () => resolveEnvMock(`${ctx.sample?.code || ''}|${ctx.item?.name || ''}`, { forceGuard: method === 'auto' }),
      [ctx.sample?.code, ctx.item?.name, method],
    );
    const [activeTime, setActiveTime] = React.useState(0);
    const [scenes, setScenes] = React.useState({});
    const [shootIdx, setShootIdx] = React.useState(null);   // 拍照识别取景页目标次序
    const [shotPhase, setShotPhase] = React.useState('idle'); // idle|recognizing
    const [attachments, setAttachments] = React.useState({}); // { [次序]: [{id, kind}] }
    const [editTimes, setEditTimes] = React.useState({}); // 拍照识别：{ [次序]: true } 表示该次已解锁可编辑（默认锁定置灰防误触）
    const [phases, setPhases] = React.useState({}); // 电缆相别：{ [次序]: '红'|'黄'|'绿' }

    function addAttach(i, kind) {
      setAttachments((p) => ({ ...p, [i]: [...(p[i] || []), { id: Date.now() + '_' + Math.random().toString(36).slice(2, 6), kind }] }));
    }
    function removeAttach(i, id) {
      setAttachments((p) => ({ ...p, [i]: (p[i] || []).filter((a) => a.id !== id) }));
    }

    function fillTime(i, syzjzVal) {
      const fields = fieldsForSyzjz(syzjzVal || BASE.syzjz);
      const v = {};
      fields.forEach((f) => { v[f.key] = valAt(f.key, i, syzjzVal || BASE.syzjz); });
      return v;
    }

    /** 退回复测：用户修改或重置后标记，用于展示右上角状态水印 */
    function touchReturn() {
      if (flowReturned) setReturnTouched(true);
    }

    React.useEffect(() => {
      if (initialReturned) {
        const ts = Array.from({ length: N }, (_, i) => ({ status: 'filled', vals: fillTime(i), uploaded: true }));
        setTimes(ts);
        return;
      }
      if (ctx.status === 'done') {
        const ts = Array.from({ length: N }, (_, i) => ({ status: 'filled', vals: fillTime(i), uploaded: true }));
        setTimes(ts);
        return;
      }
      const uploadedPhases = ctx.item?.uploadedPhases;
      if (ctx.status === 'testing' && uploadedPhases?.length) {
        const uploadedSet = new Set(uploadedPhases);
        const ts = Array.from({ length: N }, (_, i) => {
          const ph = phaseOf(i);
          if (ph && uploadedSet.has(ph)) {
            return { status: 'filled', vals: fillTime(i), uploaded: true };
          }
          return { status: 'idle', vals: {}, uploaded: false };
        });
        setTimes(ts);
      }
    }, []);

    const allFilled = times.every((t) => t.status === 'filled');
    const filledCount = times.filter((t) => t.status === 'filled').length;
    const pendingUpload = times.filter((t) => t.status === 'filled' && !t.uploaded).length;
    const uploadedCount = times.filter((t) => t.uploaded).length;
    const allUploaded = N > 0 && uploadedCount === N;
    const isAutoDirect = method === 'auto';

    const timingCtl = useTestItemTiming(ctx, { uploadedCount, allUploaded, flowLocked, isAutoDirect });
    const { guardStartForUpload, guardStartForOcr, guardStartForManual, clearEndedOnReset, requireStartBeforeCollect } = timingCtl;

    function openOcrShoot(i) {
      if (!guardStartForOcr()) return;
      setShootIdx(i);
      setShotPhase('idle');
    }

    function guardHandInputRequired() {
      if (method !== 'manual' && method !== 'ble') return true;
      return guardStartForManual();
    }

    const handInputBlocked = requireStartBeforeCollect && (method === 'manual' || method === 'ble');

    function isFieldReadOnly({ ocrField, locked, serialUploaded = false }) {
      if (flowLocked || handInputBlocked) return true;
      if (serialUploaded) return true;
      if (ocrField) return locked;
      return !editable;
    }

    // L4 检测状态印章：退回复测未修改前不展示；修改后按未检测/检测中/已检测规则展示
    const inspectState = resolveInspectStampState({
      flowReturned,
      returnTouched,
      filledCount,
      uploadedCount,
      total: N,
    });

    // 设备直采：上位机整批写库，一键取值，全部时次 + 汇总一次性回填（只读）
    function captureAll() {
      touchReturn();
      setBusy('all');
      setTimeout(() => {
        const ts = Array.from({ length: N }, (_, i) => ({ status: 'filled', vals: fillTime(i), uploaded: false }));
        setTimes(ts);
        setBusy(null); setPhase('filled');
      }, 1100);
    }
    // 蓝牙：逐条连接采集第 i 次
    function captureTime(i) {
      if (method === 'ble' && !guardHandInputRequired()) return;
      touchReturn();
      setBusy(i);
      setTimeout(() => {
        setTimes((prev) => {
          const next = prev.slice(); next[i] = { status: 'filled', vals: fillTime(i), uploaded: false };
          return next;
        });
        setBusy(null);
      }, method === 'ble' ? 1200 : 950);
    }
    // 外部程序：从平板程序已推数据中拉取（只读查看）
    function pullExternal() {
      setBusy('all');
      setTimeout(() => {
        const ts = Array.from({ length: N }, (_, i) => ({ status: 'filled', vals: fillTime(i), uploaded: false }));
        setTimes(ts); setBusy(null);
      }, 900);
    }
    // 串口（电子天平）：工业平板串口程序已采写库，本端一键读取整批展示，直接为已上传状态（不在本端采集/上传）
    function collectSerial() {
      setBusy('all');
      setTimeout(() => {
        const ts = Array.from({ length: N }, (_, i) => ({ status: 'filled', vals: fillTime(i), uploaded: true }));
        setTimes(ts);
        setBusy(null); setPhase('filled');
      }, 1000);
    }
    function manualTime(i) {
      if (!guardHandInputRequired()) return;
      touchReturn();
      setTimes((prev) => { const next = prev.slice(); const v = {}; measureFields.forEach((f) => { v[f.key] = ''; }); next[i] = { status: 'filled', vals: v, uploaded: false }; return next; });
    }
    function setField(i, key, value) {
      if (flowLocked) return; // 流程已锁定，禁止修改
      if (!guardHandInputRequired()) return;
      touchReturn();
      setTimes((prev) => {
        const next = prev.slice();
        const vals = { ...next[i].vals, [key]: value };
        if (isDensityTpl && key === 'syzjz') {
          if (value === '试样密度小于浸渍液密度') delete vals.msil;
          else { delete vals.mchui; delete vals.msich; }
        }
        next[i] = { ...next[i], vals, status: 'filled', uploaded: flowReturned ? false : next[i].uploaded };
        return next;
      });
    }
    // 拍照识别/相册：取景页内识别，完成后回填该次并关闭
    function doShoot() {
      const i = shootIdx;
      touchReturn();
      setShotPhase('recognizing');
      setTimeout(() => {
        setTimes((prev) => {
          const next = prev.slice(); next[i] = { status: 'filled', vals: fillTime(i), uploaded: false };
          return next;
        });
        setShotPhase('idle'); setShootIdx(null); setActiveTime(i);
        // 拍照识别只保留一张参照图：每次识别替换上一张，避免核查时无法对应数据来源
        setAttachments((p) => ({ ...p, [i]: [{ id: Date.now() + '_' + Math.random().toString(36).slice(2, 6), kind: 'photo' }] }));
      }, 1100);
    }
    // 拍照识别·重新识别：用「上一次拍的同一张照片」重新做识别提取数据（区别于清除图片重新拍照上传）
    function reRecognize(i) {
      if (!(attachments[i] || []).length) return;
      touchReturn();
      setBusy(i);
      setTimeout(() => {
        setTimes((prev) => {
          const next = prev.slice();
          next[i] = { ...next[i], status: 'filled', vals: fillTime(i), uploaded: false };
          return next;
        });
        setEditTimes((p) => ({ ...p, [i]: false })); // 重新识别后回到锁定态
        setBusy(null);
      }, 950);
    }
    function upload() {
      if (!guardStartForUpload()) return;
      touchReturn();
      setPhase('uploading');
      setTimeout(() => {
        setTimes((prev) => prev.map((t) => (t.status === 'filled' ? { ...t, uploaded: true } : t)));
        setPhase('idle');
      }, 1100);
    }
    // 拍照识别/蓝牙：逐条采集完一次即可单独上传该次
    function uploadTime(i) {
      if (!guardStartForUpload()) return;
      touchReturn();
      setBusy('up' + i);
      setTimeout(() => {
        setTimes((prev) => prev.map((t, idx) => (idx === i ? { ...t, uploaded: true } : t)));
        setBusy(null);
      }, 800);
    }
    function reset() {
      touchReturn();
      clearEndedOnReset();
      setTimes(initTimes()); setPhase('idle');
    }
    function resetTime(i) {
      if (flowLocked) return;
      touchReturn();
      setTimes((prev) => {
        const next = prev.slice();
        next[i] = { status: 'idle', vals: {}, uploaded: false };
        return next;
      });
      setAttachments((p) => {
        const next = { ...p };
        delete next[i];
        return next;
      });
      setEditTimes((p) => {
        const next = { ...p };
        delete next[i];
        return next;
      });
      setPhase('idle');
    }

    const methodHint = {
      auto: '设备直连 · 上位机算毕整批写库后 App 自动回填，不可手输',
      ocr: ocrReady ? '逐条拍摄仪器读数屏自动识别，完成一次即可上传，无需等全部完成' : '该试验项识别规则未通过验证，已回退手工录入',
      ble: '蓝牙数显卡尺 · 逐条连接同步读数，也可手动输入',
      manual: '手工逐条录入数据',
      external: '外部程序代采写库（工业平板）· App 无采集按钮，可查看已采或手输补录',
      serial: '外部程序·串口通路：工业平板串口程序代采写库 · App 生产无采集按钮，异常可手输兜底',
    }[method];

    const verifiedField = measureFields[measureFields.length - 1];

    function Stamp({ state }) {
      const C = { todo: { label: '未检测', color: '#E8A93A', fill: 'rgba(245,196,99,0.14)' }, doing: { label: '检测中', color: '#5B95E8', fill: 'rgba(127,176,242,0.16)' }, done: { label: '已检测', color: '#4FB97E', fill: 'rgba(134,214,166,0.16)' } }[state];
      const cx = 110, cy = 110, R = 100;
      const stars = Array.from({ length: 30 }, (_, i) => {
        const a = (i / 30) * Math.PI * 2 - Math.PI / 2;
        const r = R - 9;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
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

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', position: 'relative' }}>
        <AppBar title="检测任务" onBack={onBack} />
        {inspectState && <Stamp state={inspectState} />}
        <div style={{ padding: 'var(--gap-page)', paddingBottom: 0 }}>
          <AnnotatedWrapper id="flowBanner" layout="block">
          <FlowBanner flow={flow} locked={flowLocked} returned={flowReturned} />
          </AnnotatedWrapper>
          {/* 基础信息（滚动时固定） */}
          <AnnotatedWrapper id="basicInfo" layout="block">
          <Section title="基础信息" icon="info">
            <Grid items={[
              ['任务编号', ctx.task?.code || M.taskCodeFromSample(ctx.sample)],
              ['样品编号', ctx.sample.code], ['样品名称', ctx.sample.name],
              ['型号规格', M.sampleSpec(ctx.sample)],
              ['试验名称', ctx.item.name], ['试验次数', `${N} 次`],
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
          </AnnotatedWrapper>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 设备信息 */}
          <AnnotatedWrapper id="deviceInfo" layout="block">
          <Section title="设备信息" icon="cpu" extra={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CollectBadge method={method} size="sm" />
              {!flowLocked && itemDevices.length > 1 && (
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
            {isExternal && (
              <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--collect-ble,#0a8a96)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4 M12 18v4 M2 12h4 M18 12h4"/><circle cx="12" cy="12" r="3"/></svg>
                外部程序采集（电子天平）· 数据由工业平板代采写库
              </div>
            )}
            {isSerial && (
              <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--collect-serial,#6d4bd1)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2v6"/><path d="M15 2v6"/><path d="M6 8h12v4a6 6 0 0 1-12 0Z"/><path d="M12 18v4"/></svg>
                外部程序·串口通路（电子天平）· 工业平板程序代采写库，本端仅展示，异常时可手输兜底
              </div>
            )}
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

          {/* 试验数据 —— N 组并列字段卡 */}
          <AnnotatedWrapper id="testDataEntry" layout="block">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2px 2px -2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-action)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>试验数据</span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>共 {N} 次</span>
            </div>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{`已完成 ${times.filter((t) => t.status === 'filled').length}/${N}`}</span>
          </div>

          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', margin: '0 2px', lineHeight: 1.5 }}>{methodHint}</div>

          {/* 原型演示：设备直采 / 外部程序(含串口) 整批回填入口；生产环境无「一键采集」按钮 */}
          {(method === 'auto' || isSerial || isExternal) && !allFilled && !flowLocked && (
            <AnnotatedWrapper id="demoOneClickCapture" layout="block">
            <Card padding="18px">
              <div style={{ textAlign: 'center' }}>
                {busy === 'all'
                  ? <div style={{ color: 'var(--brand-action)' }}><Spinner /><div style={{ fontSize: 'var(--fs-sm)', marginTop: 10 }}>{isExternal || isSerial ? '正在拉取平板程序已采数据…' : '正在从数据库整批取值…'}</div></div>
                  : <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {(method === 'auto' || isSerial) && <Button size="lg" onClick={method === 'auto' ? captureAll : collectSerial}>⚡ 一键采集（{N} 次）</Button>}
                      {isExternal && <Button size="lg" variant="secondary" onClick={pullExternal}>查看已采数据</Button>}
                    </div>}
              </div>
            </Card>
            </AnnotatedWrapper>
          )}
          </div>
          </AnnotatedWrapper>

          {/* 试验数据主从：左=第几次+状态，右=该次数据 */}
          <Card padding="0">
            <div style={{ display: 'flex', minHeight: 300 }}>
              {/* 左：次数列表 */}
              <div style={{ width: 168, flex: 'none', borderRight: '1px solid var(--divider)', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', overflow: 'auto', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}>
                {times.map((t, i) => {
                  const on = i === activeTime;
                  const filled = t.status === 'filled';
                  const state = t.uploaded ? 'uploaded' : filled ? 'done' : 'pending';
                  return (
                    <button key={i} onClick={() => setActiveTime(i)} style={{
                      display: 'flex', alignItems: 'center', gap: 9, padding: '12px 11px', cursor: 'pointer', textAlign: 'left',
                      border: 'none', borderBottom: '1px solid var(--divider)',
                      borderLeft: `3px solid ${on ? 'var(--brand-action)' : 'transparent'}`,
                      background: on ? 'var(--white)' : 'transparent',
                    }}>
                      <TimeStatusIcon state={state} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-base)', fontWeight: on ? 700 : 600, color: on ? 'var(--brand-action)' : 'var(--text-title)', fontVariantNumeric: 'tabular-nums' }}>
                          {isCable && <span style={{ width: 9, height: 9, borderRadius: '50%', background: PHASE_C[phaseOf(i)], flex: 'none' }} />}
                          {isCable ? (perPhase > 1 ? `${phaseOf(i)}相 · 第${phaseWithin(i) + 1}次` : `${phaseOf(i)}相`) : `第 ${i + 1} 次`}
                        </div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: state === 'uploaded' ? 'var(--status-done-fg,#1b8a5a)' : 'var(--text-tertiary,#9aa3b2)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {(ctx.sample.code || '').replace(/-\d+$/, '') + '-' + String(i + 1).padStart(2, '0')}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 右：当前次数据 */}
              <div style={{ flex: 1, minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <AnnotatedWrapper id="testParams" layout="block">
                {(() => {
                  const i = activeTime;
                  const t = times[i] || { status: 'idle', vals: {} };
                  const filled = t.status === 'filled';
                  const ocrField = method === 'ocr' && ocrReady;
                  const locked = ocrField && !editTimes[i]; // 识别结果默认锁定置灰，点「编辑」解锁
                  return (
                    <React.Fragment>
                      {/* 顶部：拍照识别 / 连接采集 */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                        {method === 'ocr' && ocrReady && !flowLocked && (
                          <button onClick={() => openOcrShoot(i)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--collect-ocr,#b06a00)', background: 'var(--collect-ocr-bg,#fff4e6)', color: 'var(--collect-ocr,#b06a00)', cursor: 'pointer', fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></svg>
                            拍照识别
                          </button>
                        )}
                        {method === 'ble' && !filled && !flowLocked && (
                          <Button onClick={() => captureTime(i)} disabled={busy === i}>🔵 连接采集</Button>
                        )}
                      </div>

                      {/* 数据主体 */}
                      {busy === i
                        ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--brand-action)' }}><Spinner /><div style={{ fontSize: 'var(--fs-sm)', marginTop: 10 }}>{method === 'ble' ? '正在连接设备…' : '正在识别读数…'}</div></div>
                        : filled
                        ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {isCable && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <label style={{ width: 110, flex: 'none', fontSize: 'var(--fs-base)', color: 'var(--text-body)' }}>相别</label>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text-title)' }}>
                                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: PHASE_C[phaseOf(i)], flex: 'none' }} />{phaseOf(i)}相{perPhase > 1 ? ` · 第${phaseWithin(i) + 1}次` : ''}
                                </span>
                              </div>
                            )}
                            {fieldsForSyzjz(t.vals.syzjz).map((f) => (
                              f.options
                                ? <SelectField key={f.key} field={f} value={t.vals[f.key] || ''}
                                    readOnly={isFieldReadOnly({ ocrField, locked, serialUploaded: isSerial && t.uploaded })}
                                    onReadOnlyInteract={handInputBlocked ? guardStartForManual : undefined}
                                    onChange={(v) => setField(i, f.key, v)} />
                                : <FieldRow key={f.key} label={f.label} unit={f.unit} required
                                    value={t.vals[f.key] || ''} readOnly={isFieldReadOnly({ ocrField, locked, serialUploaded: isSerial && t.uploaded })}
                                    onReadOnlyInteract={handInputBlocked ? guardStartForManual : undefined}
                                    onChange={(e) => setField(i, f.key, e.target.value)} />
                            ))}
                            {method === 'auto' && (
                              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--collect-auto,#1d54c4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                                自动采集数据，不可修改
                              </div>
                            )}
                            {ocrField && !flowLocked && (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: '8px 10px', borderRadius: 'var(--radius-md)', background: locked ? 'var(--surface-sunken)' : 'rgba(176,106,0,0.08)', border: '1px solid ' + (locked ? 'var(--border-default)' : 'var(--collect-ocr,#b06a00)') }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', lineHeight: 1.5, color: locked ? 'var(--text-secondary)' : 'var(--collect-ocr,#b06a00)', minWidth: 0 }}>
                                  {locked
                                    ? <React.Fragment><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>识别结果已锁定，防止误触改动 · 如需矫正请点「编辑」</React.Fragment>
                                    : <React.Fragment><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>编辑中 · 若改乱了可「重新识别」用原照片还原</React.Fragment>}
                                </span>
                                <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
                                  <button onClick={() => reRecognize(i)} disabled={!(attachments[i] || []).length}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-strong)', background: 'var(--white)', color: (attachments[i] || []).length ? 'var(--text-body)' : 'var(--text-placeholder)', cursor: (attachments[i] || []).length ? 'pointer' : 'not-allowed', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                                    重新识别
                                  </button>
                                  {locked
                                    ? <button onClick={() => setEditTimes((p) => ({ ...p, [i]: true }))}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--collect-ocr,#b06a00)', background: 'var(--collect-ocr-bg,#fff4e6)', color: 'var(--collect-ocr,#b06a00)', cursor: 'pointer', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                        编辑
                                      </button>
                                    : <button onClick={() => setEditTimes((p) => ({ ...p, [i]: false }))}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--brand-action)', background: 'var(--brand-action)', color: '#fff', cursor: 'pointer', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                        完成
                                      </button>}
                                </div>
                              </div>
                            )}
                            {isExternal && (
                              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>可在此手输补录或矫正</div>
                            )}

                            {/* 识别参照图：仅拍照识别需要随本次数据归档 */}
                            {ocrField && (
                            <div style={{ paddingTop: 10, marginTop: 2, borderTop: '1px dashed var(--divider)' }}>
                              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 8 }}>
                                识别参照图 <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-placeholder)' }}>· 仅一张 · 对应本次识别数据来源</span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                {getOcrReferenceAttachments(attachments[i], { filled, flowLocked, isOcr: true }).map((a) => (
                                  <div key={a.id} style={{ position: 'relative', width: 76, height: 76, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-default)', background: 'repeating-linear-gradient(135deg,#eef1f5 0 8px,#e6eaef 8px 16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></svg>
                                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono,monospace)' }}>{a.kind === 'photo' ? '拍照' : '上传'}</span>
                                    {!flowLocked && !a.mock && <button onClick={() => removeAttach(i, a.id)} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>}
                                  </div>
                                ))}
                                {!flowLocked && (attachments[i] || []).length < 1 && (
                                <button onClick={() => { if (method === 'ocr' && ocrReady) openOcrShoot(i); else addAttach(i, 'upload'); }} style={{ width: 76, height: 76, borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)', background: 'var(--bg-app)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                                  <span style={{ fontSize: 10 }}>拍照识别</span>
                                </button>
                                )}
                              </div>
                            </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 2, paddingTop: 12, borderTop: '1px dashed var(--divider)' }}>
                              {t.uploaded
                                ? <React.Fragment>
                                    {!flowLocked && <Button variant="secondary" onClick={() => resetTime(i)}>重置</Button>}
                                    <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-done-fg,#1b8a5a)', display: 'flex', alignItems: 'center', gap: 5 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>本次已上传</span>
                                  </React.Fragment>
                                : flowLocked
                                ? <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>数据已锁定</span>
                                : <Button variant="secondary" onClick={() => uploadTime(i)} disabled={busy === 'up' + i}>{busy === 'up' + i ? '上传中…' : '确认并上传本次'}</Button>}
                            </div>
                          </div>
                        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {isCable && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <label style={{ width: 110, flex: 'none', fontSize: 'var(--fs-base)', color: 'var(--text-body)' }}>相别</label>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text-title)' }}>
                                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: PHASE_C[phaseOf(i)], flex: 'none' }} />{phaseOf(i)}相{perPhase > 1 ? ` · 第${phaseWithin(i) + 1}次` : ''}
                                </span>
                              </div>
                            )}
                            {fieldsForSyzjz(t.vals.syzjz).map((f) => (
                              f.options
                                ? <SelectField key={f.key} field={f} value={t.vals[f.key] || ''}
                                    readOnly={isFieldReadOnly({ ocrField, locked, serialUploaded: isSerial && t.uploaded })}
                                    onReadOnlyInteract={handInputBlocked ? guardStartForManual : undefined}
                                    onChange={(v) => setField(i, f.key, v)} />
                                : <FieldRow key={f.key} label={f.label} unit={f.unit} required
                                    value={t.vals[f.key] || ''} placeholder="待采集"
                                    readOnly={isFieldReadOnly({ ocrField, locked, serialUploaded: isSerial && t.uploaded })}
                                    onReadOnlyInteract={handInputBlocked ? guardStartForManual : undefined}
                                    onChange={(e) => setField(i, f.key, e.target.value)} />
                            ))}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4 M12 8h.01"/></svg>
                              <span>{method === 'ocr' ? (ocrReady ? '字段待采集 · 点击右上「拍照识别」拍摄读数屏自动填入' : '该试验项识别规则未通过验证 · 请在上方字段手动输入') : method === 'ble' ? '字段待采集 · 点击右上「连接采集」同步，或直接在上方手动输入' : method === 'auto' ? '字段待采集 · 等待上位机写库回填（原型可用上方演示「一键采集」）' : isExternal ? '字段待采集 · 等待平板外部程序写库，或在上方手输补录' : isSerial ? '字段待采集 · 等待外部程序·串口写库（原型可用上方演示「一键采集」），或手输兜底' : '字段待采集 · 请在上方手动输入'}</span>
                            </div>
                          </div>}
                    </React.Fragment>
                  );
                })()}
                </AnnotatedWrapper>
              </div>
            </div>
          </Card>
        </div>

        {/* 演示：一键切换 LIMS 流程节点状态（仅用于 demo 对比） */}
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

        {/* 底部操作 */}
        <AnnotatedWrapper id="uploadActions" layout="block">
        <div style={{ display: 'flex', gap: 12, padding: 'var(--gap-page)', borderTop: '1px solid var(--border-default)', background: 'var(--white)' }}>
          {!flowLocked && <Button variant="secondary" block onClick={reset}>重置全部</Button>}
          <Button block
            disabled={flowLocked ? false : ((allUploaded ? false : pendingUpload === 0) || phase === 'uploading')}
            onClick={flowLocked ? onBack : (allUploaded ? onDone : upload)}>
            {flowLocked ? '返回（数据已锁定）'
              : phase === 'uploading' ? '上传中…'
              : allUploaded ? '完成并退出'
              : N > 1 ? `上传已完成（${pendingUpload}/${N}）` : '上传'}
          </Button>
        </div>
        </AnnotatedWrapper>

        {/* 切换设备底部抽屉（统一单选样式） */}
        {devSwitchOpen && (
          <DeviceSwitchDrawer
            devices={itemDevices}
            currentId={dev.id}
            onSelect={(d) => { setDev(d); setDevSwitchOpen(false); }}
            onClose={() => setDevSwitchOpen(false)}
            isBlocked={(d) => M.isDeviceBlockedForTest(ctx.item?.name, d)}
          />
        )}

        {/* 拍照识别取景页（可拍照 / 选择图片） */}
        {shootIdx !== null && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 200, background: '#0b0d10', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', color: '#fff' }}>
              <button onClick={() => { setShootIdx(null); setShotPhase('idle'); }} style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 'var(--fs-base)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                取消
              </button>
              <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>拍照识别 · 第 {shootIdx + 1} 次</span>
              <span style={{ width: 56 }} />
            </div>

            {/* 取景区 */}
            <div style={{ flex: 1, position: 'relative', margin: '0 16px', borderRadius: 'var(--radius-lg,16px)', overflow: 'hidden', background: 'repeating-linear-gradient(135deg,#1a1d22 0 14px,#16191e 14px 28px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {shotPhase === 'recognizing' ? (
                <div style={{ textAlign: 'center', color: '#8fd0ff' }}>
                  <Spinner />
                  <div style={{ fontSize: 'var(--fs-base)', marginTop: 12 }}>正在识别仪器读数…</div>
                </div>
              ) : (
                <React.Fragment>
                  {/* 取景框 */}
                  <div style={{ position: 'absolute', inset: '18% 12%', border: '2px solid rgba(255,255,255,0.85)', borderRadius: 10, boxShadow: '0 0 0 100vmax rgba(0,0,0,0.28)' }}>
                    {['-1px -1px', '-1px auto auto -1px', 'auto -1px -1px auto', 'auto auto -1px -1px'].map((p, k) => (
                      <span key={k} style={{ position: 'absolute', width: 22, height: 22, border: '3px solid var(--brand-action)', ...(k === 0 ? { top: -1, left: -1, borderRight: 'none', borderBottom: 'none' } : k === 1 ? { top: -1, right: -1, borderLeft: 'none', borderBottom: 'none' } : k === 2 ? { bottom: -1, left: -1, borderRight: 'none', borderTop: 'none' } : { bottom: -1, right: -1, borderLeft: 'none', borderTop: 'none' }) }} />
                    ))}
                  </div>
                  <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-mono,monospace)' }}>将「{dev.name || '仪器'}」读数屏对准取景框</div>
                </React.Fragment>
              )}
            </div>

            {/* 控制区 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '22px 24px 30px' }}>
              <button onClick={doShoot} disabled={shotPhase === 'recognizing'} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', opacity: shotPhase === 'recognizing' ? 0.4 : 1 }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <span style={{ fontSize: 'var(--fs-sm)' }}>从相册选择</span>
              </button>

              <button onClick={doShoot} disabled={shotPhase === 'recognizing'} style={{ width: 72, height: 72, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.9)', background: 'var(--brand-action)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: shotPhase === 'recognizing' ? 0.4 : 1 }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></svg>
              </button>

              <div style={{ width: 56 }} />
            </div>
          </div>
        )}
        <TimingToast message={timingCtl.toast} />
      </div>
    );
  }

  function TimeStatusIcon({ state }) {
    if (state === 'uploaded') {
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-done-fg,#1b8a5a)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
    }
    // 未检测（含已录入待上传）：黄色感叹号
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-pending,#e8a93a)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4 M12 16h.01"/></svg>;
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
    const [tip, setTip] = React.useState(null);
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
        {items.map(([k, v], i) => (
          <div key={i} style={{ position: 'relative', display: 'flex', gap: 8, fontSize: 'var(--fs-base)' }}>
            <span style={{ color: 'var(--text-secondary)', flex: 'none' }}>{k}</span>
            <span
              title={v}
              onClick={(e) => { const el = e.currentTarget; if (el.scrollWidth > el.clientWidth + 1) setTip((t) => (t === i ? null : i)); }}
              style={{ color: 'var(--text-title)', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', cursor: 'pointer' }}>{v}</span>
            {tip === i && (
              <div onClick={() => setTip(null)} style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
                maxWidth: 260, padding: '8px 12px', borderRadius: 'var(--radius-md)',
                background: 'var(--text-title)', color: 'var(--white)',
                fontSize: 'var(--fs-sm)', lineHeight: 1.5, whiteSpace: 'normal', wordBreak: 'break-word',
                boxShadow: '0 8px 24px rgba(0,0,0,0.22)', cursor: 'pointer',
              }}>{v}</div>
            )}
          </div>
        ))}
      </div>
    );
  }
  function PhaseSelect({ value, onChange, readOnly }) {
    const [open, setOpen] = React.useState(false);
    const opts = [{ v: '红', c: 'var(--danger,#e23b3b)' }, { v: '黄', c: 'var(--status-pending,#e8a93a)' }, { v: '绿', c: 'var(--status-done,#1faa54)' }];
    const cur = opts.find((o) => o.v === value);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <label style={{ width: 110, flex: 'none', fontSize: 'var(--fs-base)', color: 'var(--text-body)', display: 'flex', gap: 2 }}>
          <span style={{ color: 'var(--danger)' }}>*</span>相别
        </label>
        <div style={{ flex: 1, position: 'relative' }}>
          <button onClick={() => !readOnly && setOpen((o) => !o)} style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid ' + (open ? 'var(--border-focus)' : 'var(--border-default)'), boxShadow: open ? 'var(--shadow-focus)' : 'none', background: readOnly ? 'var(--surface-sunken)' : 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: readOnly ? 'default' : 'pointer', font: 'var(--font-sans)', fontSize: 'var(--fs-base)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: cur ? 'var(--text-title)' : 'var(--text-placeholder)' }}>
              {cur && <span style={{ width: 10, height: 10, borderRadius: '50%', background: cur.c, flex: 'none' }} />}
              {cur ? cur.v : '请选择相别'}
            </span>
            {!readOnly && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform var(--dur-fast)', transform: open ? 'rotate(180deg)' : 'none' }}><path d="m6 9 6 6 6-6"/></svg>}
          </button>
          {open && (
            <React.Fragment>
              <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 29 }} />
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30, background: 'var(--white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
                {opts.map((o, k) => (
                  <button key={o.v} onClick={() => { onChange(o.v); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px', border: 'none', borderTop: k ? '1px solid var(--divider)' : 'none', background: value === o.v ? 'var(--surface-selected)' : 'transparent', cursor: 'pointer', fontSize: 'var(--fs-base)', color: 'var(--text-title)', fontWeight: value === o.v ? 600 : 400 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: o.c, flex: 'none' }} />{o.v}
                  </button>
                ))}
              </div>
            </React.Fragment>
          )}
        </div>
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
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <label style={{ width: 110, flex: 'none', fontSize: 'var(--fs-base)', color: 'var(--text-body)', display: 'flex', gap: 2 }}>
          {field.required !== false && <span style={{ color: 'var(--danger)' }}>*</span>}
          <span>{field.label}{field.unit ? `（${field.unit}）` : ''}</span>
        </label>
        <select value={value} disabled={readOnly}
          onMouseDown={readOnly && onReadOnlyInteract ? (e) => { e.preventDefault(); onReadOnlyInteract(); } : undefined}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1, height: 44, padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)',
            background: readOnly ? 'var(--surface-sunken,#f5f6f8)' : 'var(--white)', fontSize: 'var(--fs-base)',
            color: value ? 'var(--text-title)' : 'var(--text-placeholder)', outline: 'none', boxSizing: 'border-box',
          }}>
          <option value="">待采集</option>
          {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

export { Collect };
