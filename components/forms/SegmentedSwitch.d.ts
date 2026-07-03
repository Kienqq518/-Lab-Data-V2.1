import React from 'react';

export interface SegmentOption { value: string; label: string; }

export interface SegmentedSwitchProps {
  options: SegmentOption[];
  value: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

/** 分段切换。检测模块「按设备 / 按样品」模式切换。滑块带 200ms 平移。 */
export function SegmentedSwitch(props: SegmentedSwitchProps): JSX.Element;
