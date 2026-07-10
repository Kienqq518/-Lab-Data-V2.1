import React from 'react';
import { AppBar, Button, Card, CollectBadge, FieldRow } from '../design-system.js';
import { MOCK as M } from '../mock.js';
import { EnvInfoSection, resolveEnvMock } from './collect-env.jsx';
import { DeviceSwitchDrawer } from './DeviceSwitchDrawer.jsx';
import { resolveInspectStampState } from './collect-model.js';
import { AnnotatedWrapper } from '../annotation/index.js';

/* 轻量 LIMS 试验项 L4：参数平铺展示，结论由检测员手工录入 */

const CONCLUSION_OPTIONS = ['合格', '不合格'];
const FLOW_LOCK_AFTER = ['组内审核', '数据审核', '报告编制', '报告审核', '报告签发', '报告处理', '收费审批', '报告发放', '任务归档', '任务完成'];
const DEMO_FLOWS = {
  normal: { node: '试验检测' },
  returned: { node: '试验检测', returned: true, returnReason: '交流耐压试验值与标称值偏差较大，请复测后重新上传', returnedFrom: '数据审核', by: '张伟', role: '数据审核', at: '06-25 14:30' },
  locked: { node: '组内审核' },
};

function CollectLite({ ctx, onBack, onDone }) {
  const fields = ctx.item?.fields || [];
  const measureFields = fields.filter((f) => f.key !== 'jl' && f.key !== 'bhgyy');
  const isReview = !!(ctx.reviewMode || ctx.status === 'done');
  const demoVals = ctx.item?.doneVals || {};
  const N = ctx.item?.count ?? 1;

  const itemDevices = React.useMemo(() => M.getDeviceDrawerPool(ctx.item), [ctx.item]);

  const initialDev = M.resolveLiteDevice(ctx.item) || ctx.device || itemDevices[0] || { name: '手工录入', code: '—', model: '—', method: 'manual' };

  const [dev, setDev] = React.useState(initialDev);
  const [devSwitchOpen, setDevSwitchOpen] = React.useState(false);
  const method = dev.method || ctx.method || ctx.item?.method || 'manual';

  const [demoFlow, setDemoFlow] = React.useState(null);
  const flow = demoFlow ? DEMO_FLOWS[demoFlow] : (ctx.flow || ctx.item?.flow || { node: '试验检测' });
  const flowLocked = FLOW_LOCK_AFTER.includes(flow.node);
  const flowReturned = !flowLocked && !!flow.returned;

  const [returnTouched, setReturnTouched] = React.useState(false);
  const [vals, setVals] = React.useState(() => {
    const init = {};
    fields.forEach((f) => { init[f.key] = demoVals[f.key] ?? ''; });
    return init;
  });
  const [uploaded, setUploaded] = React.useState(isReview);
  const [uploading, setUploading] = React.useState(false);
  /** 已检任务 L4：流程未锁定（仍在试验检测或未进组内审核）时可编辑；进入组内审核及以后只读 */
  const fieldsReadOnly = flowLocked || (uploaded && !flowReturned && !(isReview && !flowLocked));
  const [env, setEnv] = React.useState({ wd: '21.0', sd: '30.7' });
  const envMock = React.useMemo(
    () => resolveEnvMock(`${ctx.sample?.code || ''}|${ctx.item?.name || ''}`, { forceGuard: method === 'auto' }),
    [ctx.sample?.code, ctx.item?.name, method],
  );

  const filledCount = fields.some((f) => String(vals[f.key] || '').trim() !== '') ? 1 : 0;
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
    if (fieldsReadOnly || uploading) return;
    touchReturn();
    setVals((prev) => ({ ...prev, [key]: value }));
  }

  function upload() {
    touchReturn();
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploaded(true);
    }, 600);
  }

  const fail = vals.jl === '不合格';

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
            ['样品编号', ctx.sample?.code || '—'],
            ['样品名称', ctx.sample?.name || '—'],
            ['试验名称', ctx.item?.name || '—'],
            ['试验次数', `${N} 次`],
            ...(ctx.task?.detectDeadline ? [['检测时效', ctx.task.detectDeadline]] : []),
          ]} />
          {ctx.item?.overdueTag && M.overdueTagLabel?.[ctx.item.overdueTag] && (
            <div style={{ marginTop: 8, fontSize: 'var(--fs-xs)', color: 'var(--status-overdue-fg,#c53030)' }}>
              {M.overdueTagLabel[ctx.item.overdueTag]}
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary,#9aa3b2)' }}>试验次数随任务下发 · 不可修改</div>
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
        </Section>

        <EnvInfoSection
          envMock={envMock}
          env={env}
          onRefresh={() => setEnv({ wd: (20 + Math.random() * 3).toFixed(1), sd: (28 + Math.random() * 8).toFixed(1) })}
          Section={Section}
          Grid={Grid}
        />

        <AnnotatedWrapper id="testParams" layout="block">
        <Card padding="0">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>试验参数</span>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>共 {N} 次</span>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {measureFields.map((f) => (
              f.options
                ? <SelectField key={f.key} field={f} value={vals[f.key] || ''} readOnly={fieldsReadOnly || uploading}
                    onChange={(v) => setField(f.key, v)} />
                : <FieldRow key={f.key} label={f.label} unit={f.unit} required={false}
                    value={vals[f.key] || ''} readOnly={fieldsReadOnly || uploading}
                    placeholder="请输入"
                    onChange={(e) => setField(f.key, e.target.value)} />
            ))}
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              轻量版：展示全部试验参数；暂未配置是否必填，暂不做必填约束
            </div>
          </div>
        </Card>
        </AnnotatedWrapper>

        <AnnotatedWrapper id="conclusionArea" layout="block">
        <Card padding="0">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)', fontSize: 'var(--fs-base)', fontWeight: 600 }}>结论</div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SelectField field={{ label: '结论', key: 'jl', options: CONCLUSION_OPTIONS, required: true }}
              value={vals.jl || ''} readOnly={fieldsReadOnly || uploading}
              onChange={(v) => setField('jl', v)} />
            {fail && (
              <FieldRow label="不合格原因" value={vals.bhgyy || ''} readOnly={fieldsReadOnly || uploading}
                placeholder="请输入不合格原因"
                onChange={(e) => setField('bhgyy', e.target.value)} />
            )}
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              轻量版 LIMS+数采：结论可手输，由检测员手工判定
            </div>
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

function SelectField({ field, value, readOnly, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <label style={{ width: 110, flex: 'none', fontSize: 'var(--fs-base)', color: 'var(--text-body)', display: 'flex', gap: 2 }}>
        {field.required !== false && <span style={{ color: 'var(--danger)' }}>*</span>}
        <span>{field.label}{field.unit ? `（${field.unit}）` : ''}</span>
      </label>
      <select value={value} disabled={readOnly} onChange={(e) => onChange(e.target.value)}
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
