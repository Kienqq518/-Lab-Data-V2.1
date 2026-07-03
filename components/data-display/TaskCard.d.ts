import React from 'react';
import { StatusKind } from '../feedback/StatusTag';

export interface TaskCardProps {
  /** 任务编号，如 SC2025/0293 */
  code: string;
  sampleName: string;
  /** 委托单位 */
  client: string;
  /** 下发时间 2025-08-27 13:18:10 */
  time: string;
  status?: StatusKind;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/** 任务卡（任务列表项）。任务编号 + 样品/委托单位/时间 + 状态标签。 */
export function TaskCard(props: TaskCardProps): JSX.Element;
