import React from 'react';
import { AppBar, Card, SearchBar, StatusTag, TaskCard, TestItemCard } from '../design-system.js';
import { MOCK as M } from '../mock.js';
import { SCAN_SAMPLE_ID, ScanSampleOverlay, resolveTaskForSample } from './ScanSampleOverlay.jsx';
import { TaskListSort } from './TaskListSort.jsx';

/* 快捷入口 L2 任务列表 → L3 样品+试验项 → L4 采集（与检测模块共用 mock 与上下文） */

const FILTER_CFG = {
  pending: { title: '待检任务', hint: '尚未开始检测的委托任务（含未检测已逾期）' },
  testing: { title: '检测中任务', hint: '已开始检测、存在检测中试验项的委托任务' },
};

function QuickTasks({ filter, stationId, onBack, onCollect, restore }) {
  const cfg = FILTER_CFG[filter] || FILTER_CFG.pending;
  const [view, setView] = React.useState(restore?.view || 'list');
  const [task, setTask] = React.useState(restore?.task || null);
  const [taskSample, setTaskSample] = React.useState(restore?.taskSample || null);
  const [taskBackView, setTaskBackView] = React.useState(restore?.taskBackView || 'list');
  const [fromSampleId, setFromSampleId] = React.useState(restore?.fromSampleId || null);
  const [q, setQ] = React.useState('');
  const [taskSort, setTaskSort] = React.useState('detectDeadline:asc');
  const [scanOpen, setScanOpen] = React.useState(false);

  const allTasks = M.tasks.filter((t) => (filter === 'pending' ? M.isPendingTask(t) : M.isTestingTask(t)));
  const list = M.sortTaskList(allTasks, taskSort);
  const ql = q.trim().toLowerCase();
  const filtered = list.filter((t) => !ql
    || t.code.toLowerCase().includes(ql)
    || (t.sampleName && t.sampleName.toLowerCase().includes(ql))
    || (t.client && t.client.toLowerCase().includes(ql)));

  /** 从 L2 任务列表进入 L3 */
  function openTask(t) {
    const first = M.taskSamples(t)[0];
    setTask(t);
    setTaskSample(first?.id || null);
    setTaskBackView('list');
    setFromSampleId(null);
    setQ('');
    setView('task');
  }

  /** 扫码进入 L3：返回时回到扫码前的 L2 列表 */
  function openScannedSample(s) {
    const t = resolveTaskForSample(s, M.tasks);
    setTask(t);
    setTaskSample(s.id);
    setTaskBackView('list');
    setFromSampleId(s.id);
    setQ('');
    setView('task');
  }

  /** 模拟扫码成功 */
  function doScan() {
    const s = M.samples.find((x) => x.id === SCAN_SAMPLE_ID) || M.samples[0];
    setScanOpen(false);
    if (s) openScannedSample(s);
  }

  /** L3 返回：回到进入 L3 前的页面 */
  function backFromTask() {
    setView(taskBackView);
    setTask(null);
    setTaskSample(null);
    setFromSampleId(null);
  }

  function openCollect(sample, item) {
    onCollect?.(M.buildCollectCtx({
      sample,
      item,
      task,
      stationId,
      extra: {
        quickEntry: true,
        quickRestore: {
          view: 'task',
          task,
          taskSample: sample.id,
          taskBackView,
          fromSampleId,
          filter,
        },
      },
    }));
  }

  if (view === 'task' && task) {
    const tSamples = M.taskSamples(task);
    const cur = tSamples.find((s) => s.id === taskSample) || tSamples[0];
    const ql2 = q.trim().toLowerCase();
    const its = cur ? cur.tests.filter((t) => !ql2
      || t.name.toLowerCase().includes(ql2)
      || (cur.code && cur.code.toLowerCase().includes(ql2))) : [];

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="试验检测" onBack={backFromTask} />
        <div style={{ padding: 'var(--gap-page)', paddingBottom: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card padding="12px 16px">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-title)', fontVariantNumeric: 'tabular-nums' }}>{task.code}</span>
              <StatusTag status={task.status} size="sm" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>委托单位：{task.client || '—'}</span>
              <span>样品数：{tSamples.length}</span>
              {task.time && <span style={{ fontVariantNumeric: 'tabular-nums' }}>下发时间：{task.time}</span>}
              {task.detectDeadline && (
                <span style={{ fontVariantNumeric: 'tabular-nums', color: task.status === 'overdue' ? 'var(--status-overdue-fg,#c53030)' : 'var(--text-secondary)' }}>
                  检测时效：{task.detectDeadline}
                </span>
              )}
            </div>
          </Card>
          <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="请输入试样编号、试验项进行搜索" />
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0, padding: 'var(--gap-page)', gap: 12 }}>
          <div style={{ width: 160, flex: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)', overflow: 'auto' }}>
            {tSamples.map((s, i) => {
              const on = cur && s.id === cur.id;
              const isFrom = s.id === fromSampleId;
              return (
                <button key={s.id} onClick={() => setTaskSample(s.id)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
                  padding: '12px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                  border: isFrom ? '1.5px solid var(--brand-action)' : 'none',
                  borderLeft: `3px solid ${on ? 'var(--brand-action)' : 'transparent'}`,
                  background: on ? 'var(--surface-selected)' : 'var(--white)',
                  boxShadow: isFrom ? '0 0 0 2px rgba(37,99,235,0.14)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, width: '100%' }}>
                    <StatusTag status={s.status} size="sm" />
                    <span style={{ fontSize: 'var(--fs-xs)', fontWeight: on ? 600 : 400, color: 'var(--text-title)', fontVariantNumeric: 'tabular-nums' }}>序号:{i + 1}</span>
                  </div>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', wordBreak: 'break-all' }}>{s.code}</span>
                  <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600, lineHeight: 1.35, color: 'var(--text-title)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.name}</span>
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)', overflow: 'auto' }}>
            {its.length ? its.map((t, i) => {
              const info = M.testCardInfo(t);
              return (
                <TestItemCard key={i} name={t.name} device={info.deviceText} method={info.method} methods={info.methods}
                  status={t.status} overdueTag={t.overdueTag}
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', position: 'relative' }}>
      <AppBar title={cfg.title} onBack={onBack} />
      <div style={{ flex: 1, minHeight: 0, padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{cfg.hint}</div>
        <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="请输入任务编号、样品名称、委托单位搜索" onScan={() => setScanOpen(true)} />
        <TaskListSort value={taskSort} onChange={setTaskSort} />
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)' }}>
          {filtered.length ? filtered.map((t) => (
            <TaskCard key={t.code} code={t.code} sampleName={t.sampleName} client={t.client}
              time={t.time} status={t.status} detectDeadline={t.detectDeadline} onClick={() => openTask(t)} />
          )) : (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 'var(--fs-base)' }}>暂无{cfg.title}</div>
            </div>
          )}
        </div>
      </div>

      {scanOpen && <ScanSampleOverlay onCancel={() => setScanOpen(false)} onScan={doScan} />}
    </div>
  );
}

export { QuickTasks };
