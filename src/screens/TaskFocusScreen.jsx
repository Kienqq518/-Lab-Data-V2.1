import React from 'react';
import { AppBar, Card, SearchBar, StatusTag, TaskCard, TestItemCard } from '../design-system.js';
import { MOCK as M } from '../mock.js';
import { SCAN_SAMPLE_ID, ScanSampleOverlay, resolveTaskForSample } from './ScanSampleOverlay.jsx';
import { TaskListSort, TASK_SORT_OPTIONS, RETURNED_SORT_OPTIONS } from './TaskListSort.jsx';
import { AnnotatedWrapper, AnnotationPageKeyProvider } from '../annotation/index.js';
import { filterL3View } from './l3-search-filter.js';

/* 配置驱动的任务聚焦页（方案 A）：L2 任务列表 → L3 样品+试验项 → L4 采集
   一套组件覆盖：待检 / 检测中 / 逾期 / 临期 / 退回复测。
   各维度差异仅在：任务过滤、L3 样品/试验项过滤、排序项与默认排序、文案、是否支持扫码。 */

const FOCUS_CFG = {
  pending: {
    title: '待检任务',
    taskFilter: (t) => M.isPendingTask(t),
    defaultSort: 'detectDeadline:asc',
    scan: true,
  },
  testing: {
    title: '检测中任务',
    taskFilter: (t) => M.isTestingTask(t),
    defaultSort: 'detectDeadline:asc',
    scan: true,
  },
  overdue: {
    title: '逾期任务',
    taskFilter: (t) => M.isOverdueTask(t),
    defaultSort: 'detectDeadline:asc',
    emptyText: '暂无逾期任务',
  },
  dueSoon: {
    title: '3日内到期',
    taskFilter: (t) => M.isDueSoonTask(t),
    defaultSort: 'detectDeadline:asc',
    emptyText: '暂无临期任务',
  },
  returned: {
    title: '退回复测',
    taskFilter: (t) => M.isReturnedTask(t),
    sampleFilter: (s) => M.sampleHasReturned(s),
    testFilter: (t) => M.isReturnedTest(t),
    sortOptions: RETURNED_SORT_OPTIONS,
    defaultSort: 'returnedAt:desc',
    emptyText: '暂无退回复测项',
  },
};

function TaskFocusScreen({ kind, stationId, onBack, onCollect, restore }) {
  const cfg = FOCUS_CFG[kind] || FOCUS_CFG.pending;
  const sortOptions = cfg.sortOptions || TASK_SORT_OPTIONS;

  const [view, setView] = React.useState(restore?.view || 'list');
  const [task, setTask] = React.useState(restore?.task || null);
  const [taskSample, setTaskSample] = React.useState(restore?.taskSample || null);
  const [fromSampleId, setFromSampleId] = React.useState(restore?.fromSampleId || null);
  const [narrowReturn, setNarrowReturn] = React.useState(!!restore?.narrowReturn);
  const [targetTestName, setTargetTestName] = React.useState(restore?.targetTestName || null);
  const [fromNotify, setFromNotify] = React.useState(!!restore?.fromNotify);
  const [q, setQ] = React.useState('');
  const [taskSort, setTaskSort] = React.useState(restore?.taskSort || cfg.defaultSort);
  const [scanOpen, setScanOpen] = React.useState(false);

  /** L2 任务列表（按维度过滤 + 排除已检归档 + 关键词 + 排序） */
  const allTasks = M.tasks.filter(M.isActiveTask).filter(cfg.taskFilter);
  const ql = q.trim().toLowerCase();
  const filtered = M.sortTaskList(allTasks.filter((t) => !ql
    || t.code.toLowerCase().includes(ql)
    || (t.sampleName && t.sampleName.toLowerCase().includes(ql))
    || (t.client && t.client.toLowerCase().includes(ql))), taskSort);

  /** 取任务在当前维度下应展示的样品（退回复测只展示含退回项的样品；通知深链仅展示目标样品） */
  function visibleSamples(t) {
    let list = cfg.sampleFilter ? M.taskSamples(t).filter(cfg.sampleFilter) : M.taskSamples(t);
    if (narrowReturn && taskSample) list = list.filter((s) => s.id === taskSample);
    return list;
  }

  /** 取样品下应展示的试验项（通知深链仅展示目标退回试验项） */
  function visibleTests(sample) {
    let list = cfg.testFilter ? sample.tests.filter(cfg.testFilter) : sample.tests;
    if (narrowReturn && targetTestName) list = list.filter((t) => t.name === targetTestName);
    return list;
  }

  /** 从 L2 任务列表进入 L3 */
  function openTask(t) {
    const first = visibleSamples(t)[0];
    setTask(t);
    setTaskSample(first?.id || null);
    setFromSampleId(null);
    setQ('');
    setView('task');
  }

  /** 扫码进入 L3，并高亮扫描到的样品 */
  function openScannedSample(s) {
    const t = resolveTaskForSample(s, M.tasks);
    setTask(t);
    setTaskSample(s.id);
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

  /** L3 返回：通知深链直接退出聚焦页，否则回 L2 列表 */
  function backFromTask() {
    if (fromNotify) {
      onBack?.();
      return;
    }
    setView('list');
    setTask(null);
    setTaskSample(null);
    setFromSampleId(null);
    setNarrowReturn(false);
    setTargetTestName(null);
    setFromNotify(false);
  }

  function openCollect(sample, item) {
    onCollect?.(M.buildCollectCtx({
      sample,
      item,
      task,
      stationId,
      extra: {
        focusEntry: kind,
        focusRestore: {
          view: 'task',
          task,
          taskSample: sample.id,
          fromSampleId,
          taskSort,
          narrowReturn,
          targetTestName,
          fromNotify,
        },
      },
    }));
  }

  // ===== L3：样品(左) + 试验项(右) 主从 =====
  if (view === 'task' && task) {
    const tSamples = visibleSamples(task);
    const getBaseTests = (sample) => visibleTests(sample);
    const { samples: filteredSamples, getTests } = filterL3View(tSamples, getBaseTests, q);
    const cur = filteredSamples.find((s) => s.id === taskSample) || filteredSamples[0];
    const its = cur ? getTests(cur) : [];

    return (
      <AnnotationPageKeyProvider pageKey="focus-l3">
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="试验检测" onBack={backFromTask} />
        <div style={{ padding: 'var(--gap-page)', paddingBottom: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnnotatedWrapper id="focusL3Summary" layout="block">
          <Card padding="12px 16px">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-title)', fontVariantNumeric: 'tabular-nums' }}>{task.code}</span>
              <StatusTag status={task.status} size="sm" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>委托单位：{task.client || '—'}</span>
              <span>样品数：{filteredSamples.length}</span>
              {task.time && <span style={{ fontVariantNumeric: 'tabular-nums' }}>下发时间：{task.time}</span>}
              {task.detectDeadline && (
                <span style={{ fontVariantNumeric: 'tabular-nums', color: task.status === 'overdue' ? 'var(--status-overdue-fg,#c53030)' : 'var(--text-secondary)' }}>
                  检测时效：{task.detectDeadline}
                </span>
              )}
            </div>
          </Card>
          </AnnotatedWrapper>
          <AnnotatedWrapper id="focusL3Search" layout="block">
          <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="请输入样品名称、样品编号、试验项搜索" />
          </AnnotatedWrapper>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0, padding: 'var(--gap-page)', gap: 12 }}>
          <AnnotatedWrapper id="focusL3Samples" layout="inline">
          <div style={{ width: 160, flex: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)', overflow: 'auto' }}>
            {filteredSamples.length ? filteredSamples.map((s, i) => {
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
            }) : (
              <div style={{ padding: '24px 8px', textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>暂无相关样品</div>
            )}
          </div>
          </AnnotatedWrapper>

          <AnnotatedWrapper id="focusL3Tests" layout="flex">
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
          </AnnotatedWrapper>
        </div>
      </div>
      </AnnotationPageKeyProvider>
    );
  }

  // ===== L2：任务列表 =====
  const focusPageKey = `focus-${kind}`;
  return (
    <AnnotationPageKeyProvider pageKey={focusPageKey}>
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', position: 'relative' }}>
      <AppBar title={cfg.title} onBack={onBack} />
      <div style={{ flex: 1, minHeight: 0, padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnnotatedWrapper id="focusL2Search" layout="block">
        <SearchBar value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="请输入任务编号、样品名称、委托单位搜索"
          onScan={cfg.scan ? () => setScanOpen(true) : undefined} />
        </AnnotatedWrapper>
        <AnnotatedWrapper id="focusL2Sort" layout="block">
        <TaskListSort value={taskSort} onChange={setTaskSort} options={sortOptions} />
        </AnnotatedWrapper>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)' }}>
          {filtered.length ? filtered.map((t, i) => (
            <AnnotatedWrapper key={t.code} id={i === 0 ? (kind === 'returned' ? 'taskCard' : 'focusL2List') : undefined} layout="block" placement="right">
              <TaskCard code={t.code} sampleName={t.sampleName} client={t.client}
                time={t.time} status={kind === 'returned' ? 'testing' : t.status} detectDeadline={t.detectDeadline} onClick={() => openTask(t)} />
            </AnnotatedWrapper>
          )) : (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 'var(--fs-base)' }}>{cfg.emptyText || `暂无${cfg.title}`}</div>
            </div>
          )}
        </div>
      </div>

      {scanOpen && <ScanSampleOverlay onCancel={() => setScanOpen(false)} onScan={doScan} />}
    </div>
    </AnnotationPageKeyProvider>
  );
}

export { TaskFocusScreen };
