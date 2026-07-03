import React from 'react';
import { TestState } from '../feedback/StatusDot';
import { CollectMethod } from '../feedback/CollectBadge';

export interface TestItemCardProps {
  /** 试验项名称，如「直流电阻」 */
  name: string;
  /** 检测设备名称 */
  device?: string;
  /** 试验状态 */
  status?: TestState;
  /** 采集方式 */
  method?: CollectMethod;
  /** 上传状态（可选） */
  upload?: 'pending' | 'done';
  onClick?: () => void;
  style?: React.CSSProperties;
}

/** 试验项卡。试验项 + 状态圆点 + 设备 + 采集方式 + 上传状态。 */
export function TestItemCard(props: TestItemCardProps): JSX.Element;
