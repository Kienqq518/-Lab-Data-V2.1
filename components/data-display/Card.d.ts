import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 选中态：蓝边 + 浅蓝底 */
  selected?: boolean;
  /** 标记为可选（手势反馈），即使没有 onClick */
  selectable?: boolean;
  /** 内边距，默认 var(--gap-card) */
  padding?: string;
  children?: React.ReactNode;
}

/** 通用白卡片（可选中）。设备卡/任务卡等的容器。 */
export function Card(props: CardProps): JSX.Element;
