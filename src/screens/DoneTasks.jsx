import React from 'react';
import { AppBar, Card, SearchBar, StatusTag, TestItemCard } from '../design-system.js';
import { MOCK as M } from '../mock.js';
import { AnnotatedWrapper } from '../annotation/index.js';

/* 已检任务（首页「已检任务」入口）
   L1 任务列表 → L3 样品+试验项（主从）→ L4 采集详情（只读复核） */

const NOW = new Date('2026-06-26T18:00:00');

function parse(s) { return new Date((s || '').replace(' ', 'T')); }
function daysAgo(n) { const d = new Date(NOW); d.setDate(d.getDate() - n); return d; }

const RANGES = [
  { value: '7', label: '近7天', from: () => daysAgo(7) },
  { value: '30', label: '近30天', from: () => daysAgo(30) },
  { value: '90', label: '近90天', from: () => daysAgo(90) },
  { value: 'year', label: '本年', from: () => new Date('2026-01-01T00:00:00') },
];

function isOverdueDone(task) {
  if (task.overdueDone) return true;
  if (!task.detectDeadline || !task.doneAt) return false;
  return parse(task.doneAt) > parse(task.detectDeadline + ' 23:59:59');
}

function isOverdueDoneSample(sample, task) {
  if (sample.overdueDone) return true;
  if (task && isOverdueDone(task)) return true;
  return false;
}

function taskSamples(task) {
  return M.samples.filter((s) => s.code.startsWith(task.code) && s.status === 'done');
}

function testCardInfo(t) {
  if (Array.isArray(t.subs) && t.subs.length) {
    const methods = [];
    const names = [];
    t.subs.forEach((sub) => {
      const m = sub.method || sub.device?.method;
      if (m && !methods.includes(m)) methods.push(m);
      const nm = sub.device?.name;
      if (nm && !names.includes(nm)) names.push(nm);
    });
    return { methods, method: methods[0] || 'auto', deviceText: names.join('、') };
  }
  const dev = M.devices.find((d) => d.id === t.device);
  const method = t.method || (dev && dev.method) || 'auto';
  return { methods: [method], method, deviceText: dev ? dev.name : (t.limsLite ? '手工录入' : '') };
}

function DoneTasks({ onBack, onCollect }) {
  const [range, setRange] = React.useState('30');
  const [view, setView] = React.useState('list');
  const [task, setTask] = React.useState(null);
  const [taskSample, setTaskSample] = React.useState(null);
  const [q, setQ] = React.useState('');

  const all = M.tasks.filter((t) => t.status === 'done' && t.doneAt).slice().sort((a, b) => parse(b.doneAt) - parse(a.doneAt));
  const cfg = RANGES.find((r) => r.value === range);
  const from = cfg.from();
  const list = all.filter((t) => parse(t.doneAt) >= from);
  const earlier = all.length - list.length;

  function openTask(t) {
    const samples = taskSamples(t);
    setTask(t);
    setTaskSample(samples[0]?.id || null);
    setQ('');
    setView('task');
  }

  function openCollect(sample, item) {
    const dev = item.device ? M.devices.find((d) => d.id === item.device) : null;
    const tpl = dev ? (dev.items.find((x) => x.name === item.name) || {}).tpl : undefined;
    onCollect?.({
      sample,
      device: dev,
      item: { ...item, tpl },
      method: item.method || (dev && dev.method),
      status: 'done',
      reviewMode: true,
      task,
    });
  }

  if (view === 'task' && task) {
    const tSamples = taskSamples(task);
    const cur = tSamples.find((s) => s.id === taskSample) || tSamples[0];
    const ql = q.trim().toLowerCase();
    const its = cur ? cur.tests.filter((t) => t.status === 'done' && (!ql
      || t.name.toLowerCase().includes(ql)
      || (cur.code && cur.code.toLowerCase().includes(ql)))) : [];

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="已检任务详情" onBack={() => { setView('list'); setTask(null); }} />
        <div style={{ padding: 'var(--gap-page)', paddingBottom: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card padding="12px 16px">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-title)', fontVariantNumeric: 'tabular-nums' }}>{task.code}</span>
              <StatusTag status="done" size="sm" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>委托单位：{task.client || '—'}</span>
              <span>样品数：{tSamples.length}</span>
              {task.time && <span style={{ fontVariantNumeric: 'tabular-nums' }}>下发时间：{task.time}</span>}
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>完成于：{task.doneAt}</span>
              {task.detectDeadline && <span style={{ fontVariantNumeric: 'tabular-nums' }}>检测时效：{task.detectDeadline}</span>}
            </div>
            {isOverdueDone(task) && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--status-overdue-fg,#c53030)', background: 'var(--status-overdue-bg)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>逾期完成</span>
              </div>
            )}
          </Card>
          <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="请输入试样编号、试验项进行搜索" />
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0, padding: 'var(--gap-page)', gap: 12 }}>
          <div style={{ width: 160, flex: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)', overflow: 'auto' }}>
            {tSamples.map((s, i) => {
              const on = cur && s.id === cur.id;
              return (
                <button key={s.id} onClick={() => setTaskSample(s.id)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
                  padding: '12px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                  border: 'none', borderLeft: `3px solid ${on ? 'var(--brand-action)' : 'transparent'}`,
                  background: on ? 'var(--surface-selected)' : 'var(--white)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <StatusTag status={s.status} size="sm" />
                      {isOverdueDoneSample(s, task) && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--status-overdue-fg,#c53030)', background: 'var(--status-overdue-bg)', padding: '2px 6px', borderRadius: 'var(--radius-pill)' }}>逾期完成</span>
                      )}
                    </div>
                    <span style={{ fontSize: 'var(--fs-xs)', fontVariantNumeric: 'tabular-nums' }}>序号:{i + 1}</span>
                  </div>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', wordBreak: 'break-all' }}>{s.code}</span>
                  <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600, lineHeight: 1.35, color: 'var(--text-title)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.name}</span>
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)', overflow: 'auto' }}>
            {its.length ? its.map((t, i) => {
              const info = testCardInfo(t);
              return (
                <TestItemCard key={i} name={t.name} device={info.deviceText} method={info.method} methods={info.methods}
                  status="done" overdueTag={t.overdueTag}
                  onClick={() => openCollect(cur, t)} />
              );
            }) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>无匹配试验项</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', minHeight: 0 }}>
      <AppBar title="已检任务" onBack={onBack} />

      <AnnotatedWrapper id="doneRangeTabs" layout="block">
        <div style={{ padding: 'var(--gap-page)', paddingBottom: 10, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {RANGES.map((r) => {
              const on = r.value === range;
              return (
                <button key={r.value} onClick={() => setRange(r.value)} style={{
                  flex: 1, padding: '9px 0', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--fs-sm)', fontWeight: on ? 600 : 400,
                  border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
                  background: on ? 'var(--surface-selected)' : 'var(--white)',
                  color: on ? 'var(--brand-action)' : 'var(--text-body)',
                }}>{r.label}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
            <span>{from.toISOString().slice(0, 10)} 至 {NOW.toISOString().slice(0, 10)}</span>
            <span>共 <span style={{ color: 'var(--brand-action)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{list.length}</span> 个已检任务</span>
          </div>
        </div>
      </AnnotatedWrapper>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 var(--gap-page) var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)' }}>
        <AnnotatedWrapper id="doneTaskList" layout="block">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)' }}>
            {list.map((t) => <DoneCard key={t.code} t={t} onClick={() => openTask(t)} />)}

            {list.length === 0 && (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-placeholder)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                <div style={{ fontSize: 'var(--fs-base)' }}>该时间范围内暂无已检任务</div>
              </div>
            )}
          </div>
        </AnnotatedWrapper>

        <AnnotatedWrapper id="doneHistoryHint" layout="block">
          <div style={{ marginTop: 6, padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)', background: 'var(--white)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              移动端仅保留近一段时间的已检任务便于复核{earlier > 0 ? `，更早还有 ${earlier} 个任务未在「${cfg.label}」范围内` : ''}。
              更早的历史数据请前往 <span style={{ color: 'var(--brand-action)', fontWeight: 600 }}>Web 端 LIMS 系统</span>查询。
            </div>
          </div>
        </AnnotatedWrapper>
      </div>
    </div>
  );
}

function DoneCard({ t, onClick }) {
  const overdue = isOverdueDone(t);
  const sampleN = taskSamples(t).length || t.sampleCount;
  const testN = taskSamples(t).reduce((n, s) => n + s.tests.filter((te) => te.status === 'done').length, 0) || t.testCount;

  return (
    <Card onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{t.code}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flex: 'none' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--status-done-fg,#1b8a5a)', background: 'var(--status-done-bg,#e6f6ee)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            已检
          </span>
          {overdue && (
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--status-overdue-fg,#c53030)', background: 'var(--status-overdue-bg)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>逾期完成</span>
          )}
        </div>
      </div>
      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text-title)', lineHeight: 1.4, marginBottom: 4 }}>{t.sampleName}</div>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 10 }}>{t.client}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 10, borderTop: '1px solid var(--divider)', fontSize: 'var(--fs-sm)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          完成于 <span style={{ color: 'var(--text-title)', fontVariantNumeric: 'tabular-nums' }}>{t.doneAt}</span>
        </span>
        <span style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{sampleN ?? '—'} 样品 · {testN ?? '—'} 试验项</span>
      </div>
    </Card>
  );
}

export { DoneTasks };
