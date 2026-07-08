import React from 'react';

/** L2 任务列表默认排序项（任务编号 / 下发时间 / 检测时效） */
export const TASK_SORT_OPTIONS = [
  { value: 'code:asc', label: '任务编号 ↑' },
  { value: 'code:desc', label: '任务编号 ↓' },
  { value: 'time:asc', label: '下发时间 ↑' },
  { value: 'time:desc', label: '下发时间 ↓' },
  { value: 'detectDeadline:asc', label: '检测时效 ↑' },
  { value: 'detectDeadline:desc', label: '检测时效 ↓' },
];

/** 退回复测排序项（在默认项前追加“退回时间”） */
export const RETURNED_SORT_OPTIONS = [
  { value: 'returnedAt:desc', label: '退回时间 ↓' },
  { value: 'returnedAt:asc', label: '退回时间 ↑' },
  ...TASK_SORT_OPTIONS,
];

/**
 * L2 任务列表排序选择器（各聚焦页共用，排序项可配置）
 */
export function TaskListSort({ value, onChange, options = TASK_SORT_OPTIONS, style }) {
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
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
