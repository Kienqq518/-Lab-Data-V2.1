import React from 'react';

/** L2 任务列表默认排序项（任务编号 / 下发时间 / 检测时效） */
export const TASK_SORT_OPTIONS = [
  { value: 'code:asc', label: '任务编号', dir: '升序' },
  { value: 'code:desc', label: '任务编号', dir: '降序' },
  { value: 'time:asc', label: '下发时间', dir: '最早在前' },
  { value: 'time:desc', label: '下发时间', dir: '最新在前' },
  { value: 'detectDeadline:asc', label: '检测时效', dir: '最紧急在前' },
  { value: 'detectDeadline:desc', label: '检测时效', dir: '最宽松在前' },
];

/** 退回复测排序项（在默认项前追加“退回时间”） */
export const RETURNED_SORT_OPTIONS = [
  { value: 'returnedAt:desc', label: '退回时间', dir: '最新在前' },
  { value: 'returnedAt:asc', label: '退回时间', dir: '最早在前' },
  ...TASK_SORT_OPTIONS,
];

/* 排序图标（上下箭头） */
function SortIcon({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
      <path d="M11 5h10 M11 9h7 M11 13h4 M3 17l3 3 3-3 M6 6v14" />
    </svg>
  );
}

/* 选中勾选标记 */
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-action)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * L2 任务列表排序控件（各聚焦页共用）
 * 触发按钮展示当前排序，点击后从底部弹出排序面板（移动端规范）。
 */
export function TaskListSort({ value, onChange, options = TASK_SORT_OPTIONS, style }) {
  const [open, setOpen] = React.useState(false);
  const current = options.find((o) => o.value === value) || options[0];

  /** 选择排序项并关闭面板 */
  function pick(v) {
    onChange(v);
    setOpen(false);
  }

  return (
    <React.Fragment>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
          minHeight: 36, padding: '0 12px', borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-default)', background: 'var(--white)',
          color: 'var(--text-title)', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer',
          ...style,
        }}
      >
        <SortIcon color="var(--brand-action)" />
        <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>排序</span>
        <span>{current.label}</span>
        {current.dir && <span style={{ color: 'var(--text-tertiary,#9aa3b2)', fontWeight: 400 }}>· {current.dir}</span>}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary,#9aa3b2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {open && (
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(15,23,42,0.28)' }} />
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 90, background: 'var(--white)',
            borderRadius: '18px 18px 0 0', boxShadow: '0 -14px 34px rgba(15,23,42,0.20)', overflow: 'hidden',
            maxHeight: '80%', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ width: 44, height: 4, borderRadius: 'var(--radius-pill)', background: 'var(--border-strong,#cfd6e2)', margin: '10px auto 6px' }} />
            <div style={{ padding: '8px 16px 12px', borderBottom: '1px solid var(--divider)' }}>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text-title)' }}>排序方式</div>
            </div>
            <div style={{ overflow: 'auto', padding: 8 }}>
              {options.map((opt) => {
                const on = opt.value === value;
                return (
                  <button key={opt.value} type="button" onClick={() => pick(opt.value)} style={{
                    width: '100%', minHeight: 52, padding: '12px 12px', borderRadius: 'var(--radius-md)',
                    border: 'none', background: on ? 'var(--surface-selected)' : 'transparent', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, textAlign: 'left',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 'var(--fs-base)', fontWeight: on ? 700 : 500, color: on ? 'var(--brand-action)' : 'var(--text-title)' }}>{opt.label}</span>
                      {opt.dir && <span style={{ fontSize: 'var(--fs-xs)', color: on ? 'var(--brand-action)' : 'var(--text-secondary)' }}>{opt.dir}</span>}
                    </span>
                    {on && <CheckIcon />}
                  </button>
                );
              })}
            </div>
            <div style={{ padding: '10px 16px 16px', borderTop: '1px solid var(--divider)' }}>
              <button type="button" onClick={() => setOpen(false)} style={{
                width: '100%', minHeight: 44, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)',
                background: 'var(--white)', color: 'var(--text-title)', fontSize: 'var(--fs-base)', fontWeight: 600, cursor: 'pointer',
              }}>取消</button>
            </div>
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}
