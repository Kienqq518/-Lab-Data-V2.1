import React from 'react';

export interface StatCardProps {
  label: string;
  value: number | string;
  /** 配色基调 */
  tone?: 'pending' | 'testing' | 'done' | 'overdue' | 'brand';
  onClick?: () => void;
  style?: React.CSSProperties;
}

/** 统计卡（首页任务状态统计）。大数字 + 标签 + 状态点。 */
export function StatCard(props: StatCardProps): JSX.Element;
