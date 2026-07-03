import React from 'react';

export type StatusKind = 'pending' | 'testing' | 'done' | 'overdue';

export interface StatusTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 状态：pending未检测 / testing检测中 / done已完成 / overdue已逾期 */
  status?: StatusKind;
  /** 覆盖默认文案 */
  children?: React.ReactNode;
  size?: 'sm' | 'md';
}

/**
 * 状态标签（胶囊）。样品检测状态 / 任务状态统一用它。
 * @dsCard feedback
 */
export function StatusTag(props: StatusTagProps): JSX.Element;
