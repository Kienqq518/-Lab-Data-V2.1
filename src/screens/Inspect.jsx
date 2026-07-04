import React from 'react';
import { AppBar, Card, CollectBadge, DeviceCard, SearchBar, SegmentedSwitch, StationBar, StatusTag, TaskCard, TestItemCard } from '../design-system.js';
import { MOCK as M } from '../mock.js';

/* 检测模块 — 工位上下文 + 按设备/按样品双模式 + 钻取试验项 */

  function Inspect({ stationId, onBack, onCollect, onSwitchStation, onClearStation }) {
    const station = M.stations.find((s) => s.id === stationId) || null;
    const [mode, setMode] = React.useState('device');   // device | sample
    const [view, setView] = React.useState('list');     // list | device | sample
    const [device, setDevice] = React.useState(null);
    const [task, setTask] = React.useState(null);
    const [taskSample, setTaskSample] = React.useState(null);
    const [nameTip, setNameTip] = React.useState(null);
    const taskRootRef = React.useRef(null);
    const [sample, setSample] = React.useState(null);
    const [q, setQ] = React.useState('');
    const [offOpen, setOffOpen] = React.useState(false);

    const devices = station ? M.devices.filter((d) => d.station === station.id) : [];
    // 该工位涉及的样品（出现在某试验项绑定的设备属于本工位）
    const samples = M.samples;
    const ql = q.trim().toLowerCase();
    const match = (d) => !ql || (d.name && d.name.toLowerCase().includes(ql)) || (d.code && d.code.toLowerCase().includes(ql));
    const fDevices = devices.filter(match);
    const fSamples = samples.filter(match);
    const fOff = M.offDevices.filter(match);

    function openDevice(d) { setDevice(d); setView('device'); }
    function openTask(t) {
      setTask(t);
      const first = M.samples.filter((s) => s.code.startsWith(t.code))[0];
      setTaskSample(first ? first.id : null);
      setQ('');
      setView('task');
    }
    function openSample(s) { setSample(s); setView('sample'); }

    // 某设备涉及的委托任务（任务下属样品含该设备的试验项）
    function tasksForDevice(dev) {
      if (!dev) return [];
      return M.tasks.filter((t) => M.samples.filter((s) => s.code.startsWith(t.code))
        .some((s) => s.tests.some((te) => te.device === dev.id)));
    }

    // ===== 列表层 =====
    if (view === 'list') {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
          <AppBar title="检测" onBack={onBack} />
          <div style={{ padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflow: 'auto' }}>
            <StationBar station={station ? station.name : '未选择工位'} onSwitch={onSwitchStation} onClear={station ? onClearStation : undefined} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <SegmentedSwitch value={mode} onChange={setMode}
                options={[{ value: 'device', label: '按设备' }, { value: 'sample', label: '按样品' }]} />
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                {mode === 'device' ? `${fDevices.length} 台设备` : `${fSamples.length} 个样品`}
              </span>
            </div>

            {/* 搜索（同时过滤工位设备/样品/非工位设备） */}
            <SearchBar value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={mode === 'device' ? '请输入设备名称、编号搜索' : '请输入样品编号、名称搜索'} />

            {/* 非工位设备/便携设备（可展开） */}
            <div style={{ borderRadius: 'var(--radius-md)', border: '1px dashed var(--collect-ble)', background: offOpen ? 'var(--white)' : 'var(--collect-ble-bg)', overflow: 'hidden' }}>
              <button onClick={() => setOffOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--collect-ble)', textAlign: 'left' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 7 10 10-5 5V2l5 5L7 17"/></svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>非工位设备/便携设备</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>未绑定工位的设备，点击展开</div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: offOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform var(--dur-base) var(--ease-out)' }}><path d="m18 15-6-6-6 6"/></svg>
              </button>
              {(offOpen || (ql && fOff.length > 0)) && (
                <div style={{ padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)' }}>
                  {fOff.map((d) => (
                    <DeviceCard key={d.id} name={d.name} code={d.code} model={d.model}
                      area="非工位设备" method={d.method} itemCount={d.items.length}
                      onClick={() => openDevice(d)} />
                  ))}
                  <button onClick={() => {}} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', border: '1px dashed var(--collect-ble)', borderRadius: 'var(--radius-md)', background: 'var(--collect-ble-bg)', color: 'var(--collect-ble)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--fs-base)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
                    扫码连接新设备
                  </button>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>设备来自 Web「设备管理」维护的非工位设备；扫码连接未维护的设备后，将自动同步新增至数采</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)' }}>
              {mode === 'device'
                ? (station
                    ? fDevices.map((d) => (
                        <DeviceCard key={d.id} name={d.name} code={d.code} model={d.model}
                          area={station.name} method={d.method} itemCount={d.items.length}
                          onClick={() => openDevice(d)} />
                      ))
                    : (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-placeholder)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        <div style={{ fontSize: 'var(--fs-base)' }}>尚未选择工位</div>
                        <div style={{ fontSize: 'var(--fs-sm)', marginTop: 4 }}>点击上方「切换」选择工位，或用「按样品」检索</div>
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
        </div>
      );
    }

    // ===== 设备详情：选委托任务 =====
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
                      time={t.time} status={t.status} onClick={() => openTask(t)} />
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

    // ===== 委托任务详情：样品（左）+ 对应试验项（右）主从布局 =====
    if (view === 'task') {
      const tSamples = M.samples.filter((s) => s.code.startsWith(task.code));
      const cur = tSamples.find((s) => s.id === taskSample) || tSamples[0];
      const ql2 = q.trim().toLowerCase();
      const its = cur ? cur.tests.filter((t) => !ql2
        || t.name.toLowerCase().includes(ql2)
        || (cur.code && cur.code.toLowerCase().includes(ql2))) : [];

      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
          <AppBar title="试验检测" onBack={() => setView('device')} />
          <div style={{ padding: 'var(--gap-page)', paddingBottom: 0 }}>
            <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="请输入试样编号、试验项进行搜索" />
          </div>

          <div ref={taskRootRef} style={{ position: 'relative', display: 'flex', flex: 1, minHeight: 0, padding: 'var(--gap-page)', gap: 12 }}>
            {/* 左：样品列表 */}
            <div style={{ width: 160, flex: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)', overflow: 'auto' }}>
              {tSamples.map((s, i) => {
                const on = cur && s.id === cur.id;
                return (
                  <button key={s.id} onClick={() => { setTaskSample(s.id); setNameTip(null); }} style={{
                    position: 'relative',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
                    padding: '12px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                    border: 'none', borderLeft: `3px solid ${on ? 'var(--brand-action)' : 'transparent'}`,
                    background: on ? 'var(--surface-selected)' : 'var(--white)',
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
                return (
                  <TestItemCard key={i} name={t.name} device={dev ? dev.name : ''} method={t.method || (dev && dev.method)}
                    status={t.status} upload={t.upload}
                    onClick={() => onCollect({ sample: cur, device: dev, item: itemCtx, method: t.method || (dev && dev.method), status: t.status, flow: t.flow })} />
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
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="样品试验项" onBack={() => setView('list')} />
        <div style={{ padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflow: 'auto' }}>
          <Card padding="14px 16px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>{sample.name}</div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{sample.code}</div>
              </div>
              <StatusTag status={sample.status} />
            </div>
          </Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)' }}>
            {sample.tests.map((t, i) => {
              const dev = M.devices.find((d) => d.id === t.device);
              const tpl = dev ? (dev.items.find((x) => x.name === t.name) || {}).tpl : undefined;
              const itemCtx = { ...t, tpl };
              return (
                <TestItemCard key={i} name={t.name} device={dev ? dev.name : ''} method={t.method}
                  status={t.status} upload={t.upload}
                  onClick={() => onCollect({ sample, device: dev, item: itemCtx, method: t.method, status: t.status, flow: t.flow })} />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

export { Inspect };
