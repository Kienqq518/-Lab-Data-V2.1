/* 已检任务（首页「已检任务」入口）—— 已完成检测的委托任务列表
   方案：移动端不长期堆叠历史，默认展示「近 30 天」内本检测员完成的任务；
   可切换 近7天 / 近30天 / 近90天 / 本年；更早数据引导至 Web 端按条件查询。
   「已检任务」= 该任务下分配给本检测员的样品及试验项已全部完成检测。
   每条展示：任务编号 · 样品名称 · 委托方 · 完成时间 · 样品数/试验项数。 */
(function () {
  const { AppBar, Card } = window.DesignSystem_52fd11;
  const M = window.MOCK;
  const NOW = new Date('2026-06-26T18:00:00');

  function parse(s) { return new Date((s || '').replace(' ', 'T')); }
  function daysAgo(n) { const d = new Date(NOW); d.setDate(d.getDate() - n); return d; }

  const RANGES = [
    { value: '7', label: '近7天', from: () => daysAgo(7) },
    { value: '30', label: '近30天', from: () => daysAgo(30) },
    { value: '90', label: '近90天', from: () => daysAgo(90) },
    { value: 'year', label: '本年', from: () => new Date('2026-01-01T00:00:00') },
  ];

  function DoneTasks({ onBack }) {
    const [range, setRange] = React.useState('30');
    const all = M.tasks.filter((t) => t.status === 'done' && t.doneAt).slice().sort((a, b) => parse(b.doneAt) - parse(a.doneAt));
    const cfg = RANGES.find((r) => r.value === range);
    const from = cfg.from();
    const list = all.filter((t) => parse(t.doneAt) >= from);
    const earlier = all.length - list.length;

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="已检任务" onBack={onBack} />

        {/* 时间范围筛选（固定） */}
        <div style={{ padding: 'var(--gap-page)', paddingBottom: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
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

        {/* 列表 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 var(--gap-page) var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)' }}>
          {list.map((t) => <DoneCard key={t.code} t={t} />)}

          {list.length === 0 && (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-placeholder)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              <div style={{ fontSize: 'var(--fs-base)' }}>该时间范围内暂无已检任务</div>
            </div>
          )}

          {/* 更早数据引导 */}
          <div style={{ marginTop: 6, padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)', background: 'var(--white)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              移动端仅保留近一段时间的已检任务便于复核{earlier > 0 ? `，更早还有 ${earlier} 个任务未在「${cfg.label}」范围内` : ''}。
              更早的历史数据请前往 <span style={{ color: 'var(--brand-action)', fontWeight: 600 }}>Web 端 LIMS 系统</span>查询。
            </div>
          </div>
        </div>
      </div>
    );
  }

  function DoneCard({ t }) {
    return (
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{t.code}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--status-done-fg,#1b8a5a)', background: 'var(--status-done-bg,#e6f6ee)', flex: 'none' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            已检
          </span>
        </div>
        <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text-title)', lineHeight: 1.4, marginBottom: 4 }}>{t.sampleName}</div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 10 }}>{t.client}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 10, borderTop: '1px solid var(--divider)', fontSize: 'var(--fs-sm)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            完成于 <span style={{ color: 'var(--text-title)', fontVariantNumeric: 'tabular-nums' }}>{t.doneAt}</span>
          </span>
          <span style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{t.sampleCount ?? '—'} 样品 · {t.testCount ?? '—'} 试验项</span>
        </div>
      </Card>
    );
  }

  window.DoneTasks = DoneTasks;
})();
