import React from 'react';
import { CollectMethod } from '../feedback/CollectBadge';

export interface DeviceCardProps {
  /** 设备名称，如「电缆直流电阻快速测量系统-无人化版」 */
  name: string;
  /** 设备编号，如 YM-WRH-01 */
  code: string;
  /** 型号，如 YRSC-200I */
  model?: string;
  /** 所在区域/工位，如「无人化试验室」 */
  area: string;
  /** 该设备采集方式 */
  method?: CollectMethod;
  /** 该设备可做的试验项数量 */
  itemCount?: number;
  enabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * 设备卡（「按设备」列表项）。
 * @startingPoint section="检测" subtitle="设备列表卡" viewport="700x150"
 */
export function DeviceCard(props: DeviceCardProps): JSX.Element;
