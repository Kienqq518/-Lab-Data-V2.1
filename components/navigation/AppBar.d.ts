import React from 'react';

export interface AppBarProps {
  title: React.ReactNode;
  /** 传入则显示左侧返回箭头 */
  onBack?: () => void;
  /** 右侧操作节点（如扫码按钮） */
  right?: React.ReactNode;
  style?: React.CSSProperties;
}

/** 顶部导航栏：返回 + 居中标题 + 右操作。 */
export function AppBar(props: AppBarProps): JSX.Element;
