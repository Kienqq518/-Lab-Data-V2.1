import React from 'react';
import { AppBar, Card, CollectBadge, DeviceCard, SearchBar, SegmentedSwitch, StatusTag, TaskCard, TestItemCard } from '../design-system.js';
import { MOCK as M } from '../mock.js';

/* 检测模块 — 工位上下文 + 按设备/按任务双模式 + 钻取试验项
   · 按设备：L1 设备列表 → L2 委托任务 → L3 样品(左)+试验项(右)，仅展示该设备相关样品与试验项
   · 按任务：L2 委托任务列表 → L3 样品(左)+试验项(右) → L4 采集（与按设备 L2/L3/L4 同源逻辑） */

  // 扫码 mock：扫描后固定跳转到该样品的 L3
  const SCAN_SAMPLE_ID = 's1b';

  function Inspect({ stationId, onBack, onCollect, onSwitchStation, onClearStation }) {
    const station = M.stations.find((s) => s.id === stationId) || null;
    const [mode, setMode] = React.useState('device');   // device | task
    const [view, setView] = React.useState('list');     // list | device | task
    const [device, setDevice] = React.useState(null);
    const [task, setTask] = React.useState(null);
    const [taskSample, setTaskSample] = React.useState(null);
    const [cameFrom, setCameFrom] = React.useState('device'); // device | task
    const [nameTip, setNameTip] = React.useState(null);
    const taskRootRef = React.useRef(null);
    const offPanelRef = React.useRef(null);
    const [q, setQ] = React.useState('');
    const [offOpen, setOffOpen] = React.useState(false);
    const [scanOpen, setScanOpen] = React.useState(false);
    const [fromSampleId, setFromSampleId] = React.useState(null);

    React.useEffect(() => { setOffOpen(false); }, [stationId]);

    const stationName = (id) => (M.stations.find((s) => s.id === id) || {}).name || '非工位设备';

    // 清除工位后加载全部设备；选择工位仅作筛选。无工位设备与有工位设备平铺混排
    const devices = station ? M.devices.filter((d) => d.station === station.id) : M.devices;
    const ql = q.trim().toLowerCase();
    const matchDevice = (d) => !ql
      || (d.name && d.name.toLowerCase().includes(ql))
      || (d.code && d.code.toLowerCase().includes(ql))
      || (d.model && d.model.toLowerCase().includes(ql));
    const matchTask = (t) => !ql
      || (t.code && t.code.toLowerCase().includes(ql))
      || (t.sampleName && t.sampleName.toLowerCase().includes(ql))
      || (t.client && t.client.toLowerCase().includes(ql));
    const fDevices = devices.filter(matchDevice);
    const fTasks = M.tasks.filter(matchTask);
    const fOff = M.offDevices.filter(matchDevice);

    /** 切换按设备/按任务时重置钻取状态 */
    function switchMode(next) {
      setMode(next);
      setQ('');
      setView('list');
      setDevice(null);
      setTask(null);
      setTaskSample(null);
      setCameFrom(next === 'task' ? 'task' : 'device');
      setFromSampleId(null);
    }

    function toggleOffOpen() {
      setOffOpen((open) => {
        const next = !open;
        if (next) {
          requestAnimationFrame(() => {
            offPanelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          });
        }
        return next;
      });
    }

    function openDevice(d) { setDevice(d); setQ(''); setView('device'); }

    /** 进入 L3：按设备时仅保留该设备相关样品；按任务展示全部样品 */
    function openTask(t, source) {
      const from = source || (mode === 'task' ? 'task' : 'device');
      const visibleSamples = from === 'device' && device
        ? M.taskSamplesForDevice(t, device)
        : M.taskSamples(t);
      const first = visibleSamples[0] || M.taskSamples(t)[0];
      setTask(t);
      setTaskSample(first ? first.id : null);
      setCameFrom(from);
      setFromSampleId(null);
      setQ('');
      setView('task');
    }

    /** 扫码进入：直达样品所在任务 L3，并高亮该样品 */
    function openScannedSample(s) {
      const t = M.tasks.find((tk) => s.code.startsWith(tk.code))
        || { code: s.code.replace(/-\d+$/, ''), sampleName: s.name, client: s.client, time: '', status: s.status };
      setTask(t);
      setTaskSample(s.id);
      setCameFrom(mode);
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

    // 试验项卡展示信息：复合试验项（含子项）汇总多台设备与多种采集方式
    function testCardInfo(t) {
      return M.testCardInfo(t);
    }

    // 某设备涉及的委托任务（任务下属样品含该设备的试验项）
    function tasksForDevice(dev) {
      if (!dev) return [];
      return M.tasks.filter((t) => M.taskSamplesForDevice(t, dev).length > 0);
    }

    /** 按设备模式：分段切换同行右上角的内联工位选择 */
    function renderInlineStation() {
      const label = station ? station.name : '未选择工位';
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 1, minWidth: 0, justifyContent: 'flex-end' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-action)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span style={{
            fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-title)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 108,
          }} title={label}>{label}</span>
          <button type="button" onClick={onSwitchStation} style={{
            display: 'inline-flex', alignItems: 'center', gap: 2, flex: 'none',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--brand-action)', fontSize: 'var(--fs-sm)', fontWeight: 600, padding: 0,
          }}>
            切换
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          {station && onClearStation && (
            <button type="button" onClick={onClearStation} aria-label="清除工位" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
              width: 20, height: 20, border: 'none', borderRadius: 'var(--radius-sm)',
              background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6 M9 9l6 6"/></svg>
            </button>
          )}
        </div>
      );
    }

    // ===== L1（按设备）/ L2（按任务）：列表入口 =====
    if (view === 'list') {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', position: 'relative' }}>
          <AppBar title="检测" onBack={onBack} />
          <div style={{ flex: 1, minHeight: 0, padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 12 }}>
              <SegmentedSwitch value={mode} onChange={switchMode}
                options={[{ value: 'device', label: '按设备' }, { value: 'task', label: '按任务' }]} />
              {mode === 'device'
                ? renderInlineStation()
                : (
                  <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {fTasks.length} 个任务
                  </span>
                )}
            </div>

            <SearchBar value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={mode === 'device' ? '请输入设备名称、编号、型号搜索' : '请输入任务编号、样品名称、委托单位搜索'}
              onScan={() => setScanOpen(true)} />

            {mode === 'device' && station && (
              <div ref={offPanelRef} style={{ flexShrink: 0, borderRadius: 'var(--radius-md)', border: '1px dashed var(--collect-ble)', background: offOpen ? 'var(--white)' : 'var(--collect-ble-bg)' }}>
                <button type="button" onClick={toggleOffOpen} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--collect-ble)', textAlign: 'left' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 7 10 10-5 5V2l5 5L7 17"/></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>非工位设备/便携设备</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>未绑定工位的设备，点击展开（{M.offDevices.length} 台）</div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: offOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform var(--dur-base) var(--ease-out)' }}><path d="m18 15-6-6-6 6"/></svg>
                </button>
                {offOpen && (
                  <div style={{ padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)' }}>
                    {fOff.length ? fOff.map((d) => (
                      <DeviceCard key={d.id} name={d.name} code={d.code} model={d.model}
                        area="非工位设备" method={d.method} itemCount={d.items.length}
                        onClick={() => openDevice(d)} />
                    )) : (
                      <div style={{ padding: '16px 8px', textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>无匹配非工位设备</div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)' }}>
              {mode === 'device'
                ? (fDevices.length
                    ? fDevices.map((d) => (
                        <DeviceCard key={d.id} name={d.name} code={d.code} model={d.model}
                          area={d.station ? stationName(d.station) : '非工位设备'} method={d.method} itemCount={d.items.length}
                          onClick={() => openDevice(d)} />
                      ))
                    : (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: 'var(--fs-base)' }}>无匹配设备</div>
                      </div>
                    ))
                : (fTasks.length
                    ? fTasks.map((t) => (
                        <TaskCard key={t.code} code={t.code} sampleName={t.sampleName} client={t.client}
                          time={t.time} status={t.status} detectDeadline={t.detectDeadline}
                          onClick={() => openTask(t, 'task')} />
                      ))
                    : (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: 'var(--fs-base)' }}>无匹配委托任务</div>
                      </div>
                    ))}
            </div>
          </div>

          {scanOpen && <ScanOverlay onCancel={() => setScanOpen(false)} onScan={doScan} />}
        </div>
      );
    }

    // ===== 按设备 L2：选委托任务 =====
    if (view === 'device') {
      const dtasks = tasksForDevice(device);
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
          <AppBar title="选择委托任务" onBack={() => setView('list')} />
          <div style={{ padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflow: 'auto' }}>
            <Card padding="14px 16px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>{device.name}</div>
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>编号 {device.code} · 型号 {device.model}</div>
                </div>
                <CollectBadge method={device.method} size="sm" />
              </div>
            </Card>

            <div>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 8 }}>委托任务（{dtasks.length}）</div>
              {dtasks.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)' }}>
                  {dtasks.map((t) => (
                    <TaskCard key={t.code} code={t.code} sampleName={t.sampleName} client={t.client}
                      time={t.time} status={t.status} detectDeadline={t.detectDeadline} onClick={() => openTask(t, 'device')} />
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: 'var(--fs-base)' }}>暂无涉及该设备的委托任务</div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ===== L3：样品(左) + 对应试验项(右) 主从布局（按设备 / 按任务共用）=====
    const tSamples = cameFrom === 'device' && device
      ? M.taskSamplesForDevice(task, device)
      : M.taskSamples(task);
    const cur = tSamples.find((s) => s.id === taskSample) || tSamples[0];
    const ql2 = q.trim().toLowerCase();
    const baseTests = cur
      ? (cameFrom === 'device' && device ? M.sampleTestsForDevice(cur, device) : cur.tests)
      : [];
    const its = baseTests.filter((t) => !ql2
      || t.name.toLowerCase().includes(ql2)
      || (cur.code && cur.code.toLowerCase().includes(ql2)));

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="试验检测" onBack={() => setView(cameFrom === 'task' ? 'list' : 'device')} />
        <div style={{ padding: 'var(--gap-page)', paddingBottom: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {task && (
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
          )}
          <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="请输入试样编号、试验项进行搜索" />
        </div>

        <div ref={taskRootRef} style={{ position: 'relative', display: 'flex', flex: 1, minHeight: 0, padding: 'var(--gap-page)', gap: 12 }}>
          <div style={{ width: 160, flex: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)', overflow: 'auto' }}>
            {tSamples.length ? tSamples.map((s, i) => {
              const on = cur && s.id === cur.id;
              const isFrom = s.id === fromSampleId;
              return (
                <button key={s.id} onClick={() => { setTaskSample(s.id); setNameTip(null); }} style={{
                  position: 'relative',
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
                  <span
                    title={s.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTaskSample(s.id);
                      const btn = e.currentTarget.closest('button');
                      const root = taskRootRef.current;
                      let pos = null;
                      if (btn && root) {
                        const r = btn.getBoundingClientRect();
                        const rr = root.getBoundingClientRect();
                        const scale = (rr.width / root.offsetWidth) || 1;
                        pos = { id: s.id, name: s.name, top: (r.top - rr.top) / scale + 6, left: (r.right - rr.left) / scale + 8 };
                      }
                      setNameTip((p) => (p && p.id === s.id ? null : pos));
                    }}
                    style={{
                      fontSize: 'var(--fs-base)', fontWeight: 600, lineHeight: 1.35,
                      color: 'var(--text-title)',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', wordBreak: 'break-word', cursor: 'pointer',
                    }}>{s.name}</span>
                </button>
              );
            }) : (
              <div style={{ padding: '24px 8px', textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>该设备暂无相关样品</div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)', overflow: 'auto' }}>
            {its.length ? its.map((t, i) => {
              const info = testCardInfo(t);
              return (
                <TestItemCard key={i} name={t.name} device={info.deviceText} method={info.method} methods={info.methods}
                  status={t.status} overdueTag={t.overdueTag}
                  onClick={() => onCollect(M.buildCollectCtx({ sample: cur, item: t, task, stationId }))}
                />
              );
            }) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
                {cur ? '该设备在此样品下暂无相关试验项' : '请选择样品'}
              </div>
            )}
          </div>

          {nameTip && (
            <div onClick={() => setNameTip(null)} style={{
              position: 'absolute', top: nameTip.top, left: nameTip.left, zIndex: 100,
              maxWidth: 240, padding: '8px 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--text-title)', color: 'var(--white)',
              fontSize: 'var(--fs-sm)', fontWeight: 400, lineHeight: 1.5, whiteSpace: 'normal',
              boxShadow: '0 8px 24px rgba(0,0,0,0.22)', cursor: 'pointer',
            }}>{nameTip.name}</div>
          )}
        </div>
      </div>
    );
  }

  /** 扫码取景页（mock）：点击取景框即模拟扫码成功 */
  function ScanOverlay({ onCancel, onScan }) {
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 200, background: '#0b0d10', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', color: '#fff' }}>
          <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 'var(--fs-base)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            取消
          </button>
          <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>扫描样品二维码</span>
          <span style={{ width: 56 }} />
        </div>
        <div style={{ flex: 1, position: 'relative', margin: '0 16px 24px', borderRadius: 'var(--radius-lg,16px)', overflow: 'hidden', background: 'repeating-linear-gradient(135deg,#1a1d22 0 14px,#16191e 14px 28px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={onScan} style={{ position: 'absolute', inset: '20% 14%', border: '2px solid rgba(255,255,255,0.85)', borderRadius: 12, background: 'transparent', cursor: 'pointer' }}>
            {['-1px -1px', '-1px auto auto -1px', 'auto -1px -1px auto', 'auto auto -1px -1px'].map((p, k) => (
              <span key={k} style={{ position: 'absolute', width: 26, height: 26, border: '3px solid var(--brand-action)', ...(k === 0 ? { top: -1, left: -1, borderRight: 'none', borderBottom: 'none' } : k === 1 ? { top: -1, right: -1, borderLeft: 'none', borderBottom: 'none' } : k === 2 ? { bottom: -1, left: -1, borderRight: 'none', borderTop: 'none' } : { bottom: -1, right: -1, borderLeft: 'none', borderTop: 'none' }) }} />
            ))}
            <span style={{ position: 'absolute', bottom: -34, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.85)', fontSize: 'var(--fs-sm)' }}>将样品二维码对准取景框（点击模拟扫码）</span>
          </button>
        </div>
      </div>
    );
  }

export { Inspect };
