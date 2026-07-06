import React from 'react';
import { AppBar, Card, CollectBadge, DeviceCard, SearchBar, SegmentedSwitch, StationBar, StatusTag, TaskCard, TestItemCard } from '../design-system.js';
import { MOCK as M } from '../mock.js';

/* 检测模块 — 工位上下文 + 按设备/按样品双模式 + 钻取试验项
   · 按设备：L1 设备列表 → L2 委托任务 → L3 样品(左)+试验项(右)，高亮可用该设备的试验项
   · 按样品：L1 样品列表 → L3 该样品所在任务的样品(左)+试验项(右)，顶部展示任务基础信息并高亮进入样品 */

  // 扫码 mock：扫描后固定跳转到该样品的 L3
  const SCAN_SAMPLE_ID = 's1b';

  function Inspect({ stationId, onBack, onCollect, onSwitchStation, onClearStation }) {
    const station = M.stations.find((s) => s.id === stationId) || null;
    const [mode, setMode] = React.useState('device');   // device | sample
    const [view, setView] = React.useState('list');     // list | device | task
    const [device, setDevice] = React.useState(null);
    const [task, setTask] = React.useState(null);
    const [taskSample, setTaskSample] = React.useState(null);
    const [cameFrom, setCameFrom] = React.useState('device'); // device | sample
    const [fromSampleId, setFromSampleId] = React.useState(null);
    const [nameTip, setNameTip] = React.useState(null);
    const taskRootRef = React.useRef(null);
    const [q, setQ] = React.useState('');
    const [offOpen, setOffOpen] = React.useState(false);
    const [scanOpen, setScanOpen] = React.useState(false);

    const stationName = (id) => (M.stations.find((s) => s.id === id) || {}).name || '非工位设备';

    // 清除工位后加载全部设备；选择工位仅作筛选。无工位设备与有工位设备平铺混排
    const devices = station ? M.devices.filter((d) => d.station === station.id) : M.devices;
    const samples = M.samples;
    const ql = q.trim().toLowerCase();
    const matchDevice = (d) => !ql
      || (d.name && d.name.toLowerCase().includes(ql))
      || (d.code && d.code.toLowerCase().includes(ql))
      || (d.model && d.model.toLowerCase().includes(ql));
    const matchSample = (s) => !ql
      || (s.name && s.name.toLowerCase().includes(ql))
      || (s.code && s.code.toLowerCase().includes(ql))
      || (s.tests || []).some((t) => t.name && t.name.toLowerCase().includes(ql));
    const fDevices = devices.filter(matchDevice);
    const fSamples = samples.filter(matchSample);
    const fOff = M.offDevices.filter(matchDevice);

    function openDevice(d) { setDevice(d); setQ(''); setView('device'); }
    function openTask(t) {
      setTask(t);
      const first = M.samples.filter((s) => s.code.startsWith(t.code))[0];
      setTaskSample(first ? first.id : null);
      setCameFrom('device');
      setFromSampleId(null);
      setQ('');
      setView('task');
    }
    // 按样品进入：直达该样品所在任务的 L3（无 L2），并高亮进入样品
    function openSample(s) {
      const t = M.tasks.find((tk) => s.code.startsWith(tk.code))
        || { code: s.code.replace(/-\d+$/, ''), sampleName: s.name, client: s.client, time: '', status: s.status };
      setTask(t);
      setTaskSample(s.id);
      setCameFrom('sample');
      setFromSampleId(s.id);
      setQ('');
      setView('task');
    }
    function doScan() {
      const s = M.samples.find((x) => x.id === SCAN_SAMPLE_ID) || M.samples[0];
      setScanOpen(false);
      if (s) openSample(s);
    }

    // 试验项卡展示信息：复合试验项（含子项）汇总多台设备与多种采集方式
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
      return { methods: [method], method, deviceText: dev ? dev.name : '' };
    }

    // 试验项是否可用当前设备（用于按设备 L3 高亮）
    function deviceUsable(t) {
      if (!device) return false;
      if (t.device === device.id) return true;
      if (Array.isArray(t.subs) && t.subs.some((sub) => sub.device?.id === device.id)) return true;
      return (device.items || []).some((it) => it.name === t.name);
    }

    // 某设备涉及的委托任务（任务下属样品含该设备的试验项）
    function tasksForDevice(dev) {
      if (!dev) return [];
      return M.tasks.filter((t) => M.samples.filter((s) => s.code.startsWith(t.code))
        .some((s) => s.tests.some((te) => te.device === dev.id
          || (Array.isArray(te.subs) && te.subs.some((sub) => sub.device?.id === dev.id)))));
    }

    // ===== 列表层 L1 =====
    if (view === 'list') {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
          <AppBar title="检测" onBack={onBack} />
          <div style={{ padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflow: 'auto' }}>
            <StationBar station={station ? station.name : '未选择工位'} onSwitch={onSwitchStation} onClear={station ? onClearStation : undefined} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <SegmentedSwitch value={mode} onChange={(v) => { setMode(v); setQ(''); }}
                options={[{ value: 'device', label: '按设备' }, { value: 'sample', label: '按样品' }]} />
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                {mode === 'device' ? `${fDevices.length} 台设备` : `${fSamples.length} 个样品`}
              </span>
            </div>

            {/* 搜索：按设备可搜名称/编号/型号；按样品可搜编号/名称/试验项，并支持扫码 */}
            <SearchBar value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={mode === 'device' ? '请输入设备名称、编号、型号搜索' : '请输入样品编号、样品名称、试验项搜索'}
              onScan={mode === 'sample' ? () => setScanOpen(true) : undefined} />

            {/* 非工位设备/便携设备：已选工位时点击展开加载非工位设备列表 */}
            {mode === 'device' && station && (
              <div style={{ borderRadius: 'var(--radius-md)', border: '1px dashed var(--collect-ble)', background: offOpen ? 'var(--white)' : 'var(--collect-ble-bg)', overflow: 'hidden' }}>
                <button onClick={() => setOffOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--collect-ble)', textAlign: 'left' }}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)' }}>
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
                : fSamples.map((s) => (
                    <Card key={s.id} onClick={() => openSample(s)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>{s.name}</span>
                        <StatusTag status={s.status} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{s.code}</span>
                        <span>{s.tests.length} 个试验项</span>
                      </div>
                    </Card>
                  ))}
            </div>
          </div>

          {scanOpen && <ScanOverlay onCancel={() => setScanOpen(false)} onScan={doScan} />}
        </div>
      );
    }

    // ===== 设备详情 L2：选委托任务 =====
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
                      time={t.time} status={t.status} detectDeadline={t.detectDeadline} onClick={() => openTask(t)} />
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

    // ===== L3：样品(左) + 对应试验项(右) 主从布局（按设备 / 按样品共用）=====
    const tSamples = M.samples.filter((s) => task && s.code.startsWith(task.code));
    const cur = tSamples.find((s) => s.id === taskSample) || tSamples[0];
    const ql2 = q.trim().toLowerCase();
    const its = cur ? cur.tests.filter((t) => !ql2
      || t.name.toLowerCase().includes(ql2)
      || (cur.code && cur.code.toLowerCase().includes(ql2))) : [];

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="试验检测" onBack={() => setView(cameFrom === 'sample' ? 'list' : 'device')} />
        <div style={{ padding: 'var(--gap-page)', paddingBottom: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 任务基础信息（按样品进入时展示；含检测时效） */}
          {task && (
            <Card padding="12px 16px">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-title)', fontVariantNumeric: 'tabular-nums' }}>{task.code}</span>
                <StatusTag status={task.status} size="sm" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                {cameFrom === 'sample' && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>委托单位：{task.client || '—'}</span>}
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
          {/* 左：样品列表 */}
          <div style={{ width: 160, flex: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)', overflow: 'auto' }}>
            {tSamples.map((s, i) => {
              const on = cur && s.id === cur.id;
              const isFrom = cameFrom === 'sample' && s.id === fromSampleId;
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
            })}
          </div>

          {/* 右：当前样品的试验项 */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)', overflow: 'auto' }}>
            {its.length ? its.map((t, i) => {
              const dev = M.devices.find((d) => d.id === t.device);
              const tpl = dev ? (dev.items.find((x) => x.name === t.name) || {}).tpl : undefined;
              const itemCtx = { ...t, tpl };
              const info = testCardInfo(t);
              const usable = cameFrom === 'device' && deviceUsable(t);
              return (
                <TestItemCard key={i} name={t.name} device={info.deviceText} method={info.method} methods={info.methods}
                  status={t.status} highlighted={usable} overdueTag={t.overdueTag}
                  style={usable ? { border: '1.5px solid var(--brand-action)', boxShadow: '0 0 0 2px rgba(37,99,235,0.14)' } : undefined}
                  onClick={() => onCollect({ sample: cur, device: dev, item: itemCtx, method: t.method || (dev && dev.method), status: t.status, flow: t.flow, stationId, task })}
                />
              );
            }) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>无匹配试验项</div>
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

  // 扫码取景页（mock）：点击取景框即模拟扫码成功
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
