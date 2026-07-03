import React from 'react';
import { StatusKind } from '../feedback/StatusTag';

export interface SampleListItemProps {
  /** 序号 */
  index: number | string;
  /** 样品编号 SC2025/00701-01 */
  code: string;
  status?: StatusKind;
  selected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/** 样品列表项（采集详情左栏）。序号 + 编号 + 状态，选中高亮。 */
export function SampleListItem(props: SampleListItemProps): JSX.Element;
