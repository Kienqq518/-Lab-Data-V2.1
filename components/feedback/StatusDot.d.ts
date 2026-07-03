import React from 'react';

export type TestState = 'pending' | 'testing' | 'done';

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** pending未检测 / testing检测中 / done已检测 */
  status?: TestState;
  /** 文案；传 false 只显示圆点，传字符串覆盖默认 */
  label?: React.ReactNode | false;
  /** 圆点直径 px */
  size?: number;
}

/** 试验状态圆点（可带文案）。 */
export function StatusDot(props: StatusDotProps): JSX.Element;
