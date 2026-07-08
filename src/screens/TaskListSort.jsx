import React from 'react';

/** L2 任务列表可选排序项 */
export const TASK_SORT_OPTIONS = [
  { value: 'code:asc', label: '任务编号 ↑' },
  { value: 'code:desc', label: '任务编号 ↓' },
  { value: 'time:asc', label: '下发时间 ↑' },
  { value: 'time:desc', label: '下发时间 ↓' },
  { value: 'detectDeadline:asc', label: '检测时效 ↑' },
  { value: 'detectDeadline:desc', label: '检测时效 ↓' },
];

/**
 * L2 任务列表排序选择器（按设备 / 按任务 / 快捷入口共用）
 */
export function TaskListSort({ value, onChange, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, ...style }}>
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', flex: 'none' }}>排序</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          minWidth: 0,
          height: 36,
          padding: '0 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle, #e5e7eb)',
          background: 'var(--white)',
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-title)',
        }}
      >
        {TASK_SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
