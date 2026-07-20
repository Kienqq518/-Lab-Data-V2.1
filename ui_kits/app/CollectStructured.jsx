/* 采集详情（L4·结构尺寸检查—导体&绝缘厚度&金属屏蔽）
   —— 一个试验项含多个「试验子项」，每个子项关联一台设备、一种采集方式。
   · 设备信息区域：在该试验项关联的多台设备间切换；切换设备＝切换子项，下方录入区按采集方式变换样式。
   · 试验数据：仅展示「测量值」；按相别（红/黄/绿）逐相录入，部分字段（如绝缘各测量点厚度）需多次测量→多个输入框。
   · 结论：按相别分组，相同相别合并判定为 1 个结论，三个相别 → 3 个结论；无相别子项仅 1 个结论。
   · 采集方式：auto=设备直连（整批写库·只读·无附件图片）；ble=蓝牙数显卡尺（逐相连接·可手输·可附图）；manual=台式测厚仪（手工录入）。 */
(function () {
  const DS = window.DesignSystem_52fd11;
  const { AppBar, FieldRow, Button, CollectBadge, Card, SegmentedSwitch } = DS;
  const Input = DS.Input;

  const PHASES = [
    { v: '红', c: 'var(--danger,#e23b3b)' },
    { v: '黄', c: 'var(--status-pending,#e8a93a)' },
    { v: '绿', c: 'var(--status-done,#1faa54)' },
  ];

  // 测量值示例生成（read-only/示例填充用）
  const FIXED = { jg: '紧压绞合圆形' };
  const BASE = { gs: 8, zj: 8.00, tdhd: 10.00, tk1: 13, dg1: 14, tk2: 15, dg2: 14, tk3: 13, dg3: 14, tk4: 15, dg4: 14, tk5: 13, dg5: 14 };
  const DEC = { gs: 0, zj: 2, tdhd: 2, tk1: 1, dg1: 1, tk2: 1, dg2: 1, tk3: 1, dg3: 1, tk4: 1, dg4: 1, tk5: 1, dg5: 1 };
  function genVal(field, pi) {
    if (FIXED[field.key]) return FIXED[field.key];
    if (field.multi) return Array.from({ length: field.multi }, (_, k) => (12 + k + pi * 0.2).toFixed(1));
    const b = BASE[field.key]; if (b == null) return '';
    const jit = b * 0.01 * (((pi * 3 + field.key.length) % 5) - 2) / 2;
    return (b + jit).toFixed(DEC[field.key] ?? 2);
  }

  function CollectStructured({ ctx, onBack, onDone }) {
    const subs = ctx.item.subs;
    const N = subs[0].phased ? PHASES.length : 1;            // 每个子项的相别数 = 试验次数
    const subConcl = ['合格', '不合格', '合格'];              // 各子项相别结论（示例，对应附件图：绝缘厚度不合格）

    const [activeSub, setActiveSub] = React.useState(0);
    const [activeDevice, setActiveDevice] = React.useState(0);
    const [activePhase, setActivePhase] = React.useState(0);
    const blank = () => subs.map(() => Array.from({ length: N }, () => ({ filled: false, uploaded: false, vals: {} })));
    const [cells, setCells] = React.useState(blank);
    const [busy, setBusy] = React.useState(null);            // 'all' | 'c-si-pi' | 'up-si-pi'
    const [attach, setAttach] = React.useState({});          // { 'si-pi': [{id}] }
    const [env] = React.useState({ wd: '21.0', sd: '30.7' });

    const sub = subs[activeSub];
    // 设备与试验子项联动：切换子项时，上方设备信息随当前子项配置刷新
    const devices = [];
    subs.forEach((s) => { if (s.device && !devices.some((d) => d.code === s.device.code)) devices.push({ ...s.device, method: s.method }); });
    React.useEffect(() => {
      const current = subs[activeSub];
      if (!current?.device) return;
      const list = [];
      subs.forEach((s) => { if (s.device && !list.some((d) => d.code === s.device.code)) list.push({ ...s.device, method: s.method }); });
      const idx = list.findIndex((d) => d.id === current.device.id || d.code === current.device.code);
      if (idx >= 0) setActiveDevice(idx);
    }, [activeSub, subs]);
    const dev = devices[activeDevice] || {};
    const method = dev.method || 'auto';
    const phased = !!sub.phased;
    const editable = method !== 'auto';

    function fillCell(si, pi) {
      const v = {}; subs[si].fields.forEach((f) => { v[f.key] = genVal(f, pi); });
      setCells((prev) => prev.map((s, a) => a !== si ? s : s.map((c, b) => b !== pi ? c : { ...c, filled: true, vals: v })));
    }
    function setField(si, pi, key, value, idx) {
      setCells((prev) => prev.map((s, a) => a !== si ? s : s.map((c, b) => {
        if (b !== pi) return c;
        let nv;
        if (idx != null) { const arr = Array.isArray(c.vals[key]) ? c.vals[key].slice() : []; arr[idx] = value; nv = arr; }
        else nv = value;
        return { ...c, filled: true, vals: { ...c.vals, [key]: nv } };
      })));
    }
    function captureAll(si) {
      setBusy('all');
      setTimeout(() => {
        const v = (pi) => { const o = {}; subs[si].fields.forEach((f) => { o[f.key] = genVal(f, pi); }); return o; };
        setCells((prev) => prev.map((s, a) => a !== si ? s : s.map((c, b) => ({ ...c, filled: true, vals: v(b) }))));
        setBusy(null);
      }, 1000);
    }
    function connectCell(si, pi) {
      setBusy('c-' + si + '-' + pi);
      setTimeout(() => { fillCell(si, pi); setBusy(null); }, 1100);
    }
    function uploadCell(si, pi) {
      setBusy('up-' + si + '-' + pi);
      setTimeout(() => {
        setCells((prev) => prev.map((s, a) => a !== si ? s : s.map((c, b) => b !== pi ? c : { ...c, uploaded: true })));
        setBusy(null);
      }, 800);
    }
    function uploadAll() {
      setBusy('all');
      setTimeout(() => {
        setCells((prev) => prev.map((s) => s.map((c) => c.filled ? { ...c, uploaded: true } : c)));
        setBusy(null);
      }, 1100);
    }
    function reset() { setCells(blank()); setAttach({}); }
    function addAttach(si, pi) {
      setAttach((p) => ({ ...p, [si + '-' + pi]: [...(p[si + '-' + pi] || []), { id: Date.now() + Math.random() }] }));
    }
    function removeAttach(si, pi, id) {
      setAttach((p) => ({ ...p, [si + '-' + pi]: (p[si + '-' + pi] || []).filter((a) => a.id !== id) }));
    }

    const flat = cells.flat();
    const totalCells = flat.length;
    const uploadedCount = flat.filter((c) => c.uploaded).length;
    const filledCount = flat.filter((c) => c.filled).length;
    const pendingUpload = flat.filter((c) => c.filled && !c.uploaded).length;
    const allUploaded = totalCells > 0 && uploadedCount === totalCells;
    const inspectState = allUploaded ? 'done' : uploadedCount > 0 ? 'doing' : 'todo';

    const methodHint = {
      auto: '设备直连 · 上位机算毕整批写库，点下方「一键采集」整批回填，不可手输',
      ble: '蓝牙数显卡尺 · 逐相连接同步读数，也可手动输入；可附识别参照图',
      manual: '台式测厚仪为单机设备 · 无通讯接口，读数由检测员手工录入',
    }[method];

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', position: 'relative' }}>
        <AppBar title="检测任务" onBack={onBack} />
        <Stamp state={inspectState} />

        <div style={{ padding: 'var(--gap-page)', paddingBottom: 0 }}>
          <Section title="基础信息" icon="info">
            <Grid items={[
              ['样品编号', ctx.sample.code], ['样品名称', ctx.sample.name],
              ['试验名称', ctx.item.name], ['试验次数', `${N} 次`],
            ]} />
            <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary,#9aa3b2)' }}>含 {subs.length} 个试验子项 · 试验次数随任务下发，不可修改</div>
          </Section>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 设备信息（可切换：本试验项关联多台设备，切设备只改采集方式/录入样式） */}
          <Section title="设备信息" icon="cpu" extra={<CollectBadge method={method} size="sm" />}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {devices.map((d, i) => {
                const on = i === activeDevice;
                return (
                  <button key={i} onClick={() => setActiveDevice(i)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                    border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
                    background: on ? 'var(--surface-selected)' : 'var(--white)',
                    color: on ? 'var(--brand-action)' : 'var(--text-body)', fontSize: 'var(--fs-sm)', fontWeight: on ? 600 : 400,
                  }}>
                    <CollectDot method={d.method} on={on} />
                    {d.name}
                  </button>
                );
              })}
            </div>
            <Grid items={[['检测设备', dev.name || '—'], ['设备编号', dev.code || '—'], ['设备型号', dev.model || '—']]} />
            <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, lineHeight: 1.5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="M8 3H5a2 2 0 0 0-2 2v3 M21 8V5a2 2 0 0 0-2-2h-3 M3 16v3a2 2 0 0 0 2 2h3 M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
              该试验项关联 {devices.length} 台设备，当前设备随试验子项联动；切子项改测量值字段，切设备改采集方式/录入样式
            </div>
          </Section>

          {/* 试验子项切换 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-action)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z"/></svg>
              <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>试验子项</span>
            </div>
            <SegmentedSwitch value={String(activeSub)} onChange={(v) => { setActiveSub(+v); setActivePhase(0); }}
              options={subs.map((s, i) => ({ value: String(i), label: s.name }))} />
          </div>

          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', margin: '0 2px', lineHeight: 1.5 }}>{methodHint}</div>

          {/* 设备直采：整批操作入口 */}
          {method === 'auto' && cells[activeSub].some((c) => !c.filled) && (
            <Card padding="18px">
              <div style={{ textAlign: 'center' }}>
                {busy === 'all'
                  ? <div style={{ color: 'var(--brand-action)' }}><Spinner /><div style={{ fontSize: 'var(--fs-sm)', marginTop: 10 }}>正在从数据库整批取值…</div></div>
                  : <Button size="lg" onClick={() => captureAll(activeSub)}>⚡ 一键采集（{N} 个相别）</Button>}
              </div>
            </Card>
          )}

          {/* 试验数据：左=相别，右=该相别测量值 */}
          <Card padding="0">
            <div style={{ display: 'flex', minHeight: 280 }}>
              {/* 左：相别列表 */}
              <div style={{ width: 132, flex: 'none', borderRight: '1px solid var(--divider)', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', overflow: 'auto', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}>
                {Array.from({ length: N }, (_, pi) => {
                  const on = pi === activePhase;
                  const c = cells[activeSub][pi];
                  const state = c.uploaded ? 'uploaded' : c.filled ? 'done' : 'pending';
                  const ph = PHASES[pi % 3];
                  return (
                    <button key={pi} onClick={() => setActivePhase(pi)} style={{
                      display: 'flex', alignItems: 'center', gap: 9, padding: '13px 11px', cursor: 'pointer', textAlign: 'left',
                      border: 'none', borderBottom: '1px solid var(--divider)',
                      borderLeft: `3px solid ${on ? 'var(--brand-action)' : 'transparent'}`,
                      background: on ? 'var(--white)' : 'transparent',
                    }}>
                      <TimeStatusIcon state={state} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-base)', fontWeight: on ? 700 : 600, color: on ? 'var(--brand-action)' : 'var(--text-title)' }}>
                          {phased && <span style={{ width: 9, height: 9, borderRadius: '50%', background: ph.c, flex: 'none' }} />}
                          {phased ? ph.v + '相' : '第 1 次'}
                        </div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: state === 'uploaded' ? 'var(--status-done-fg,#1b8a5a)' : 'var(--text-tertiary,#9aa3b2)', whiteSpace: 'nowrap' }}>
                          {state === 'uploaded' ? '已上传' : c.filled ? '待上传' : '待采集'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 右：当前相别测量值 */}
              <div style={{ flex: 1, minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(() => {
                  const pi = activePhase;
                  const c = cells[activeSub][pi];
                  const busyCell = busy === 'c-' + activeSub + '-' + pi;
                  const akey = activeSub + '-' + pi;
                  return (
                    <React.Fragment>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>测量值{phased ? ` · ${PHASES[pi % 3].v}相` : ''}</span>
                        {method === 'ble' && !c.filled && <Button onClick={() => connectCell(activeSub, pi)} disabled={busyCell}>🔵 连接采集</Button>}
                        {method === 'manual' && !c.filled && <Button variant="secondary" onClick={() => fillCell(activeSub, pi)}>录入本相读数</Button>}
                      </div>

                      {busyCell
                        ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--brand-action)' }}><Spinner /><div style={{ fontSize: 'var(--fs-sm)', marginTop: 10 }}>正在连接设备…</div></div>
                        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {sub.fields.map((f) => f.multi
                              ? <MultiField key={f.key} field={f} values={c.vals[f.key]}
                                  readOnly={!editable}
                                  onChange={(idx, val) => setField(activeSub, pi, f.key, val, idx)} />
                              : <FieldRow key={f.key} label={f.label} unit={f.unit} required
                                  value={c.vals[f.key] || ''} placeholder={c.filled ? '' : '待采集'}
                                  readOnly={!editable}
                                  onChange={(e) => setField(activeSub, pi, f.key, e.target.value)} />)}

                            {method === 'auto' && (
                              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--collect-auto,#1d54c4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                                设备直采数据，不可修改
                              </div>
                            )}
                            {method === 'manual' && (
                              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--collect-manual,#828c9c)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                台式测厚仪无通讯接口 · 读数手工录入
                              </div>
                            )}

                            {/* 附件图片：仅蓝牙/手输需要；设备直采不需要 */}
                            {method === 'ble' && c.filled && (
                              <div style={{ paddingTop: 10, borderTop: '1px dashed var(--divider)' }}>
                                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 8 }}>识别参照图 <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-placeholder)' }}>· 随数据一起上传归档</span></div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                  {(attach[akey] || []).map((a) => (
                                    <div key={a.id} style={{ position: 'relative', width: 76, height: 76, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-default)', background: 'repeating-linear-gradient(135deg,#eef1f5 0 8px,#e6eaef 8px 16px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></svg>
                                      <button onClick={() => removeAttach(activeSub, pi, a.id)} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                    </div>
                                  ))}
                                  <button onClick={() => addAttach(activeSub, pi)} style={{ width: 76, height: 76, borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)', background: 'var(--bg-app)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                                    <span style={{ fontSize: 10 }}>拍照/上传</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {c.filled && (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 2, paddingTop: 12, borderTop: '1px dashed var(--divider)' }}>
                                {c.uploaded
                                  ? <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-done-fg,#1b8a5a)', display: 'flex', alignItems: 'center', gap: 5 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>本相已上传</span>
                                  : <Button variant="secondary" onClick={() => uploadCell(activeSub, pi)} disabled={busy === 'up-' + activeSub + '-' + pi}>{busy === 'up-' + activeSub + '-' + pi ? '上传中…' : '确认并上传本相'}</Button>}
                              </div>
                            )}
                          </div>}
                    </React.Fragment>
                  );
                })()}
              </div>
            </div>
          </Card>

          {/* 结论：按相别分组，每相一个结论 */}
          <Card padding="0">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--divider)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-action)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>结论</span>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: phased ? N : 1 }, (_, pi) => {
                const ph = PHASES[pi % 3];
                const c = cells[activeSub][pi];
                const ok = subConcl[activeSub] === '合格';
                const show = c && c.uploaded;
                return (
                  <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <label style={{ width: 110, flex: 'none', fontSize: 'var(--fs-base)', color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {phased && <span style={{ width: 9, height: 9, borderRadius: '50%', background: ph.c, flex: 'none' }} />}
                      {phased ? `结论（${ph.v}相）` : '结论'}
                    </label>
                    <div style={{ flex: 1, height: 44, padding: '0 12px', display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--surface-sunken,#f5f6f8)', fontSize: 'var(--fs-base)', color: show ? (ok ? 'var(--status-done-fg,#1b8a5a)' : 'var(--danger,#e23b3b)') : 'var(--text-placeholder)', fontWeight: show ? 600 : 400 }}>
                      {show ? subConcl[activeSub] : '本相上传后回显'}
                    </div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4 M12 8h.01"/></svg>
                <span>{phased ? '相同相别的测量数据（一次或多次）合并判定为一个结论；' : ''}结论不在本端录入，由 LIMS 按计算与结果判定配置自动回显</span>
              </div>
            </div>
          </Card>

          <div style={{ height: 8 }} />
        </div>

        {/* 底部操作 */}
        <div style={{ display: 'flex', gap: 12, padding: 'var(--gap-page)', borderTop: '1px solid var(--border-default)', background: 'var(--white)' }}>
          <Button variant="secondary" block onClick={reset}>重置全部</Button>
          <Button block disabled={allUploaded ? false : (pendingUpload === 0 || busy === 'all')}
            onClick={allUploaded ? onDone : uploadAll}>
            {busy === 'all' ? '上传中…' : allUploaded ? '完成并退出' : `上传全部（${pendingUpload}/${totalCells}）`}
          </Button>
        </div>
      </div>
    );
  }

  // 多次测量字段：多个输入框（如「绝缘各测量点厚度」）
  function MultiField({ field, values, readOnly, onChange }) {
    const arr = Array.isArray(values) ? values : [];
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <label style={{ width: 110, flex: 'none', fontSize: 'var(--fs-base)', color: 'var(--text-body)', display: 'flex', gap: 2, paddingTop: 11 }}>
          <span style={{ color: 'var(--danger)' }}>*</span><span>{field.label}{field.unit ? `（${field.unit}）` : ''}</span>
        </label>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {Array.from({ length: field.multi }, (_, k) => (
            <div key={k} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--text-placeholder)', pointerEvents: 'none' }}>{k + 1}</span>
              <input value={arr[k] || ''} readOnly={readOnly}
                onChange={(e) => onChange(k, e.target.value)} placeholder="—"
                style={{ width: '100%', height: 40, padding: '0 8px 0 22px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: readOnly ? 'var(--surface-sunken,#f5f6f8)' : 'var(--white)', fontSize: 'var(--fs-sm)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-title)', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  function CollectDot({ method, on }) {
    const col = { auto: 'var(--collect-auto)', ble: 'var(--collect-ble)', manual: 'var(--collect-manual)', ocr: 'var(--collect-ocr)' }[method] || 'var(--collect-auto)';
    return <span style={{ width: 8, height: 8, borderRadius: '50%', background: col, flex: 'none', opacity: on ? 1 : 0.7 }} />;
  }

  function TimeStatusIcon({ state }) {
    if (state === 'uploaded') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-done-fg,#1b8a5a)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-pending,#e8a93a)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4 M12 16h.01"/></svg>;
  }

  function Section({ title, icon, extra, children }) {
    const paths = {
      info: 'M12 16v-4 M12 8h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
      cpu: 'M4 4h16v16H4z M9 9h6v6H9z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 14h3 M1 9h3 M1 14h3',
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
            <span title={v} style={{ color: 'var(--text-title)', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
          </div>
        ))}
      </div>
    );
  }
  function Stamp({ state }) {
    const C = { todo: { label: '未检测', color: '#E8A93A', fill: 'rgba(245,196,99,0.14)' }, doing: { label: '检测中', color: '#5B95E8', fill: 'rgba(127,176,242,0.16)' }, done: { label: '已检测', color: '#4FB97E', fill: 'rgba(134,214,166,0.16)' } }[state];
    const cx = 110, cy = 110, R = 100;
    const stars = Array.from({ length: 30 }, (_, i) => {
      const a = (i / 30) * Math.PI * 2 - Math.PI / 2; const r = R - 9;
      return <circle key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={i % 2 ? 2.2 : 3.4} fill={C.color} />;
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
  function Spinner() {
    return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'lk-spin 0.9s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
  }

  window.CollectStructured = CollectStructured;
})();
