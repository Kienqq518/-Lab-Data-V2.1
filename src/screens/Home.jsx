import React from 'react';
import { Card, SectionTitle, SegmentedSwitch, StatCard } from '../design-system.js';
import { MOCK as M } from '../mock.js';

/* 首页（检测员）— 公司名 / 工作概览 / 快捷入口 / 个人检测统计 */

  function Home({ onEnterInspect, onQuick, onFocus, onOpenNotify }) {
    const pendingCount = M.tasks.filter(M.isPendingTask).length;
    const testingCount = M.tasks.filter(M.isTestingTask).length;
    const doneCount = M.tasks.filter((t) => t.status === 'done' && t.doneAt).length;
    const metrics = M.inspectorWorkMetrics();
    const unread = M.unreadNotificationCount();

    return (
      <div style={{ padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-section)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <SectionTitle style={{ marginBottom: 0 }}>杭州数蚕智能科技有限公司</SectionTitle>
          <button type="button" onClick={onOpenNotify} aria-label="消息通知" style={{ position: 'relative', width: 40, height: 40, flex: 'none', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-title)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            {unread > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: 'var(--danger,#e23b3b)', color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: '16px', textAlign: 'center' }}>{unread}</span>
            )}
          </button>
        </div>

        {/* 品牌条（压扁） */}
        <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--blue-700)', color: '#fff', padding: '16px 20px' }}>
          <div style={{ position: 'absolute', right: -24, top: -24, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4, letterSpacing: '0.1em' }}>实验室数智化系统</div>
          <div style={{ fontSize: 19, fontWeight: 600 }}>试验数据 · 实时自动采集</div>
          <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 4 }}>采集即上传，杜绝人工抄录改数</div>
        </div>

        {/* 工作概览：替代轮播，聚焦逾期/临期/退回三类异常待办 */}
        <WorkOverview metrics={metrics} onFocus={onFocus} />

        {/* 快捷入口（统计维度：委托任务） */}
        <div>
          <SectionTitle style={{ marginBottom: 12 }}>快捷入口</SectionTitle>
          <div style={{ display: 'flex', gap: 12 }}>
            <Quick label="待检任务" count={pendingCount} tone="pending" icon="inbox" onClick={() => onQuick?.('pending')} />
            <Quick label="检测中任务" count={testingCount} tone="testing" icon="loader" onClick={() => onQuick?.('testing')} />
            <Quick label="已检任务" count={doneCount} tone="done" icon="check" onClick={() => onQuick?.('done')} />
          </div>
        </div>

        {/* 个人检测统计 */}
        <div>
          <SectionTitle style={{ marginBottom: 14 }}>个人检测统计</SectionTitle>
          <StatsPanel />
        </div>
      </div>
    );
  }

  /** 今日工作概览：逾期 / 临期 / 退回三类异常待办，各自进入专属聚焦页 */
  function WorkOverview({ metrics, onFocus }) {
    return (
      <div>
        <SectionTitle style={{ marginBottom: 6 }}>今日工作概览</SectionTitle>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
          优先处理逾期与退回项，关注 3 日内到期任务
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <StatCard label="逾期任务" value={metrics.overdueTasks} tone="overdue" onClick={() => onFocus?.('overdue')} />
          <StatCard label="3日内到期" value={metrics.dueSoonTasks} tone="pending" onClick={() => onFocus?.('dueSoon')} />
          <StatCard label="退回复测" value={metrics.returnedTests} tone="brand" onClick={() => onFocus?.('returned')} />
        </div>
      </div>
    );
  }

  function Quick({ label, count, tone, icon, onClick }) {
    const color = { pending: 'var(--status-pending)', testing: 'var(--status-testing-fg)', done: 'var(--status-done)' }[tone];
    const bg = { pending: 'var(--status-pending-bg)', testing: 'var(--status-testing-bg)', done: 'var(--status-done-bg)' }[tone];
    const paths = {
      inbox: 'M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
      loader: 'M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M2 12h4 M18 12h4',
      check: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3',
    };
    return (
      <button onClick={onClick} style={{ flex: 1, border: '1px solid var(--border-default)', background: 'var(--white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: '16px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={paths[icon]} /></svg>
        </div>
        <span style={{ fontSize: 22, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{count}</span>
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{label}</span>
      </button>
    );
  }

  function StatsPanel() {
    const [range, setRange] = React.useState('month'); // 默认本月
    const cfg = buildSeries(range);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* 时间区间 + 快捷切换 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
            <DateField text={cfg.start} /><span style={{ color: 'var(--text-placeholder)' }}>—</span><DateField text={cfg.end} />
          </div>
          <SegmentedSwitch value={range} onChange={setRange}
            options={[{ value: 'year', label: '本年' }, { value: 'quarter', label: '本季' }, { value: 'month', label: '本月' }]} />
        </div>
        <ChartCard title="样品检测量" color="var(--blue-500)" data={cfg.sample} labels={cfg.labels} />
        <ChartCard title="试验检测量" color="#f59e0b" data={cfg.test} labels={cfg.labels} />
      </div>
    );
  }

  function ChartCard({ title, color, data, labels }) {
    return (
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>{title}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
            <span style={{ position: 'relative', width: 20, height: 2, background: color, display: 'inline-block' }}>
              <span style={{ position: 'absolute', left: 6, top: -3, width: 8, height: 8, borderRadius: '50%', border: '2px solid ' + color, background: '#fff' }} />
            </span>
            检测员1（仅本人）
          </span>
        </div>
        <LineChart data={data} labels={labels} color={color} />
      </Card>
    );
  }

  function DateField({ text }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, height: 36, padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--white)', color: 'var(--text-body)', fontSize: 'var(--fs-sm)', fontVariantNumeric: 'tabular-nums' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4 M8 2v4 M3 10h18"/></svg>
        {text}
      </div>
    );
  }

  function buildSeries(range) {
    const rnd = (seed) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
    const gen = (seed, len, base, span) => { const r = rnd(seed); return Array.from({ length: len }, () => base + Math.floor(r() * span)); };
    if (range === 'year') {
      const sample = gen(7, 12, 40, 80), test = gen(17, 12, 35, 82);
      const labels = sample.map((_, i) => ({ i, text: (i + 1) + '月' })).filter((_, i) => i % 2 === 0 || i === 11);
      return { start: '2026-01-01', end: '2026-12-31', sample, test, labels };
    }
    if (range === 'quarter') {
      const sample = gen(23, 3, 60, 90), test = gen(31, 3, 55, 88);
      const labels = [0, 1, 2].map((i) => ({ i, text: (i + 4) + '月' }));
      return { start: '2026-04-01', end: '2026-06-30', sample, test, labels };
    }
    const sample = gen(6, 30, 0, 13), test = gen(16, 30, 0, 12);
    const labels = [0, 5, 10, 15, 20, 25, 29].map((i) => ({ i, text: '06-' + String(i + 1).padStart(2, '0') }));
    return { start: '2026-06-01', end: '2026-06-30', sample, test, labels };
  }

  function LineChart({ data, labels, color }) {
    const W = 700, H = 200, padL = 38, padR = 10, padT = 12, padB = 24;
    const n = data.length;
    const max = Math.max.apply(null, data.concat(1));
    const niceMax = Math.max(50, Math.ceil(max / 50) * 50);
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const X = (i) => padL + (n <= 1 ? 0 : (i * plotW) / (n - 1));
    const Y = (v) => padT + plotH - (v / niceMax) * plotH;
    const ticks = []; for (let t = 0; t <= niceMax + 0.1; t += niceMax / 5) ticks.push(t);
    const dPath = data.map((v, i) => `${i ? 'L' : 'M'} ${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        {ticks.map((t, k) => (
          <g key={k}>
            <line x1={padL} y1={Y(t)} x2={W - padR} y2={Y(t)} stroke="var(--gray-200)" strokeWidth="1" />
            <text x={padL - 6} y={Y(t) + 4} textAnchor="end" fontSize="11" fill="var(--text-secondary)">{Math.round(t)}</text>
          </g>
        ))}
        <path d={dPath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r="2.4" fill="#fff" stroke={color} strokeWidth="1.5" />)}
        {labels.map((l, k) => (
          <text key={k} x={X(l.i)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--text-secondary)">{l.text}</text>
        ))}
      </svg>
    );
  }

export { Home };
