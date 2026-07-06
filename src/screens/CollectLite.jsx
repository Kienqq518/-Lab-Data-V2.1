import React from 'react';
import { AppBar, Button, Card, CollectBadge, FieldRow } from '../design-system.js';

/* 轻量 LIMS 试验项 L4：参数平铺展示，结论由检测员手工录入 */

const CONCLUSION_OPTIONS = ['合格', '不合格'];

function CollectLite({ ctx, onBack, onDone }) {
  const fields = ctx.item?.fields || [];
  const measureFields = fields.filter((f) => f.key !== 'jl' && f.key !== 'bhgyy');
  const isReview = !!(ctx.reviewMode || ctx.status === 'done');
  const demoVals = ctx.item?.doneVals || {};

  const [vals, setVals] = React.useState(() => {
    const init = {};
    fields.forEach((f) => { init[f.key] = demoVals[f.key] ?? ''; });
    return init;
  });
  const [uploaded, setUploaded] = React.useState(isReview);

  function setField(key, value) {
    if (isReview) return;
    setVals((prev) => ({ ...prev, [key]: value }));
  }

  function upload() {
    setUploaded(true);
  }

  const fail = vals.jl === '不合格';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', position: 'relative' }}>
      <AppBar title={ctx.item?.name || '试验检测'} onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card padding="14px 16px">
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', display: 'grid', gap: 6 }}>
            <div>样品编号：<span style={{ color: 'var(--text-title)', fontVariantNumeric: 'tabular-nums' }}>{ctx.sample?.code}</span></div>
            <div>样品名称：<span style={{ color: 'var(--text-title)' }}>{ctx.sample?.name}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span>采集方式</span>
              <CollectBadge method={ctx.method || ctx.item?.method || 'manual'} size="sm" />
            </div>
          </div>
        </Card>

        <Card padding="0">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)', fontSize: 'var(--fs-base)', fontWeight: 600 }}>试验参数</div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {measureFields.map((f) => (
              f.options
                ? <SelectField key={f.key} field={f} value={vals[f.key] || ''} readOnly={isReview || uploaded}
                    onChange={(v) => setField(f.key, v)} />
                : <FieldRow key={f.key} label={f.label} unit={f.unit} required={f.required !== false}
                    value={vals[f.key] || ''} readOnly={isReview || uploaded}
                    placeholder="请输入"
                    onChange={(e) => setField(f.key, e.target.value)} />
            ))}
          </div>
        </Card>

        <Card padding="0">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)', fontSize: 'var(--fs-base)', fontWeight: 600 }}>结论</div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SelectField field={{ label: '结论', key: 'jl', options: CONCLUSION_OPTIONS, required: true }}
              value={vals.jl || ''} readOnly={isReview || uploaded}
              onChange={(v) => setField('jl', v)} />
            {fail && (
              <FieldRow label="不合格原因" value={vals.bhgyy || ''} readOnly={isReview || uploaded}
                placeholder="请输入不合格原因"
                onChange={(e) => setField('bhgyy', e.target.value)} />
            )}
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              轻量 LIMS：参数平铺录入，结论由检测员手工判定，不依赖系统自动回显。
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 12, padding: 'var(--gap-page)', borderTop: '1px solid var(--border-default)', background: 'var(--white)' }}>
        {isReview
          ? <Button block onClick={onBack}>返回</Button>
          : uploaded
          ? <Button block onClick={onDone}>完成并退出</Button>
          : <Button block onClick={upload}>上传结果</Button>}
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
