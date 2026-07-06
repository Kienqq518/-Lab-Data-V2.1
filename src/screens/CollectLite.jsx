import React from 'react';
import { AppBar, Button, Card, CollectBadge, FieldRow } from '../design-system.js';
import { MOCK as M } from '../mock.js';
import { EnvInfoSection, resolveEnvMock } from './collect-env.jsx';

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
  const method = ctx.method || ctx.item?.method || ctx.device?.method || 'manual';
  const dev = ctx.device || M.devices.find((d) => d.id === ctx.item?.device) || { name: '手工录入', code: '—', model: '—', method: 'manual' };

  const [demoFlow, setDemoFlow] = React.useState(null);
  const flow = demoFlow ? DEMO_FLOWS[demoFlow] : (ctx.flow || ctx.item?.flow || { node: '试验检测' });
  const flowLocked = FLOW_LOCK_AFTER.includes(flow.node);
  const flowReturned = !flowLocked && !!flow.returned;
  const readOnly = isReview || flowLocked;

  const [vals, setVals] = React.useState(() => {
    const init = {};
    fields.forEach((f) => { init[f.key] = demoVals[f.key] ?? ''; });
    return init;
  });
  const [uploaded, setUploaded] = React.useState(isReview);
  const [env, setEnv] = React.useState({ wd: '21.0', sd: '30.7' });
  const envMock = React.useMemo(
    () => resolveEnvMock(`${ctx.sample?.code || ''}|${ctx.item?.name || ''}`),
    [ctx.sample?.code, ctx.item?.name],
  );

  function setField(key, value) {
    if (readOnly || uploaded) return;
    setVals((prev) => ({ ...prev, [key]: value }));
  }

  function upload() {
    setUploaded(true);
  }

  const fail = vals.jl === '不合格';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', position: 'relative' }}>
      <AppBar title={ctx.item?.name || '试验检测'} onBack={onBack} />
      <div style={{ padding: 'var(--gap-page)', paddingBottom: 0 }}>
        <FlowBanner flow={flow} locked={flowLocked} returned={flowReturned} />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-page)', paddingTop: flowLocked || flowReturned ? 0 : 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Section title="基础信息" icon="info">
          <Grid items={[
            ['样品编号', ctx.sample?.code || '—'],
            ['样品名称', ctx.sample?.name || '—'],
            ['试验名称', ctx.item?.name || '—'],
            ...(ctx.task?.detectDeadline ? [['检测时效', ctx.task.detectDeadline]] : []),
          ]} />
          {ctx.item?.overdueTag && M.overdueTagLabel?.[ctx.item.overdueTag] && (
            <div style={{ marginTop: 8, fontSize: 'var(--fs-xs)', color: 'var(--status-overdue-fg,#c53030)' }}>
              {M.overdueTagLabel[ctx.item.overdueTag]}
            </div>
          )}
        </Section>

        <Section title="设备信息" icon="cpu" extra={<CollectBadge method={method} size="sm" />}>
          <Grid items={[['检测设备', dev.name || '—'], ['设备编号', dev.code || '—'], ['设备型号', dev.model || '—']]} />
        </Section>

        <EnvInfoSection
          envMock={envMock}
          env={env}
          onRefresh={() => setEnv({ wd: (20 + Math.random() * 3).toFixed(1), sd: (28 + Math.random() * 8).toFixed(1) })}
          Section={Section}
          Grid={Grid}
        />

        <Card padding="0">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)', fontSize: 'var(--fs-base)', fontWeight: 600 }}>试验参数</div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {measureFields.map((f) => (
              f.options
                ? <SelectField key={f.key} field={f} value={vals[f.key] || ''} readOnly={readOnly || uploaded}
                    onChange={(v) => setField(f.key, v)} />
                : <FieldRow key={f.key} label={f.label} unit={f.unit} required={f.required !== false}
                    value={vals[f.key] || ''} readOnly={readOnly || uploaded}
                    placeholder="请输入"
                    onChange={(e) => setField(f.key, e.target.value)} />
            ))}
          </div>
        </Card>

        <Card padding="0">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)', fontSize: 'var(--fs-base)', fontWeight: 600 }}>结论</div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SelectField field={{ label: '结论', key: 'jl', options: CONCLUSION_OPTIONS, required: true }}
              value={vals.jl || ''} readOnly={readOnly || uploaded}
              onChange={(v) => setField('jl', v)} />
            {fail && (
              <FieldRow label="不合格原因" value={vals.bhgyy || ''} readOnly={readOnly || uploaded}
                placeholder="请输入不合格原因"
                onChange={(e) => setField('bhgyy', e.target.value)} />
            )}
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              轻量 LIMS：参数平铺录入，结论由检测员手工判定，不依赖系统自动回显。
            </div>
          </div>
        </Card>
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

      <div style={{ display: 'flex', gap: 12, padding: 'var(--gap-page)', borderTop: '1px solid var(--border-default)', background: 'var(--white)' }}>
        {isReview
          ? <Button block onClick={onBack}>返回</Button>
          : flowLocked
          ? <Button block onClick={onBack}>返回（数据已锁定）</Button>
          : uploaded
          ? <Button block onClick={onDone}>完成并退出</Button>
          : <Button block onClick={upload}>上传结果</Button>}
      </div>
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
