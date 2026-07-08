import React from 'react';
import { AppBar, Button } from '../design-system.js';
import { MOCK as M } from '../mock.js';

/* 消息通知中心（首页铃铛 / 我的·消息通知 共用）
   L1 通知列表（退回复测 / 任务下发 / 逾期预警）→ L2 通知详情
   退回复测类详情提供「去处理」深链到退回复测聚焦页。 */

// 通知类型元数据：图标、主题色、标签
const TYPE_META = {
  returned: { label: '退回复测', color: 'var(--danger,#e23b3b)', bg: 'var(--status-overdue-bg,#fdecec)',
    icon: 'M3 7v6h6 M21 17a9 9 0 0 0-15-6.7L3 13' },
  assigned: { label: '任务下发', color: 'var(--brand-action)', bg: 'var(--blue-50)',
    icon: 'M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z' },
  overdue: { label: '逾期预警', color: 'var(--status-pending-fg,#97640f)', bg: 'var(--status-pending-bg,#fdf3df)',
    icon: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01' },
};

function TypeIcon({ type, size = 20 }) {
  const meta = TYPE_META[type] || TYPE_META.assigned;
  return (
    <span style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={meta.icon} /></svg>
    </span>
  );
}

function Notifications({ onBack, onGoReturned }) {
  const [items, setItems] = React.useState(() => M.notifications.map((n) => ({ ...n })));
  const [activeId, setActiveId] = React.useState(null);
  const unread = items.filter((n) => !n.read).length;
  const active = items.find((n) => n.id === activeId) || null;

  /** 打开详情并标记已读 */
  function openDetail(id) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setActiveId(id);
  }

  /** 全部标记已读 */
  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  // ===== 通知详情 =====
  if (active) {
    const meta = TYPE_META[active.type] || TYPE_META.assigned;
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="通知详情" onBack={() => setActiveId(null)} />
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <TypeIcon type={active.type} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text-title)' }}>{active.title}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: meta.color, background: meta.bg, padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>{meta.label}</span>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{active.at}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14, borderTop: '1px solid var(--divider)' }}>
              {active.taskCode && <DetailLine label="任务编号" value={active.taskCode} />}
              {active.sampleCode && <DetailLine label="样品编号" value={active.sampleCode} />}
              {active.testName && <DetailLine label="试验项" value={active.testName} />}
              {active.by && <DetailLine label="来源" value={active.by} />}
            </div>

            <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken,#f5f6f8)', fontSize: 'var(--fs-sm)', color: 'var(--text-body)', lineHeight: 1.7 }}>
              {active.desc}
            </div>
          </div>

          {active.type === 'returned' && (
            <Button block size="lg" onClick={() => onGoReturned?.()}>去处理</Button>
          )}
        </div>
      </div>
    );
  }

  // ===== 通知列表 =====
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      <AppBar title="消息通知" onBack={onBack}
        right={unread > 0 ? (
          <button type="button" onClick={markAllRead} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--brand-action)', fontSize: 'var(--fs-sm)', fontWeight: 600, whiteSpace: 'nowrap', padding: '0 4px' }}>全部已读</button>
        ) : null} />
      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-list)' }}>
        {items.length ? items.map((n) => {
          const meta = TYPE_META[n.type] || TYPE_META.assigned;
          return (
            <button key={n.id} type="button" onClick={() => openDetail(n.id)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', textAlign: 'left',
              padding: '14px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)',
              background: n.read ? 'var(--white)' : 'var(--blue-50)', cursor: 'pointer',
            }}>
              <TypeIcon type={n.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text-title)' }}>{n.title}</span>
                  {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger,#e23b3b)', flex: 'none' }} />}
                  <span style={{ marginLeft: 'auto', fontSize: 'var(--fs-xs)', fontWeight: 600, color: meta.color, background: meta.bg, padding: '2px 8px', borderRadius: 'var(--radius-pill)', flex: 'none' }}>{meta.label}</span>
                </div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.desc}</div>
                <div style={{ marginTop: 6, fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary,#9aa3b2)', fontVariantNumeric: 'tabular-nums' }}>{n.at}</div>
              </div>
            </button>
          );
        }) : (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 'var(--fs-base)' }}>暂无消息通知</div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailLine({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', flex: 'none' }}>{label}</span>
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-title)', fontWeight: 500, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

export { Notifications };
