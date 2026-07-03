import React from 'react';

export interface StationBarProps {
  /** 当前工位名，如「无人化试验室」 */
  station: string;
  /** 点击切换工位 */
  onSwitch?: () => void;
  /** 传入则显示清除工位按钮 */
  onClear?: () => void;
  style?: React.CSSProperties;
}

/**
 * 工位上下文条（检测模块顶部常驻）。当前工位 + 切换。
 * @startingPoint section="检测" subtitle="工位上下文条" viewport="700x80"
 */
export function StationBar(props: StationBarProps): JSX.Element;
