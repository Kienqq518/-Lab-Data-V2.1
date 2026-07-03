import React from 'react';

export interface TabItem {
  key: string;
  label: string;
  /** 图标名：home / user / clipboard */
  icon?: 'home' | 'user' | 'clipboard';
}

export interface BottomTabBarProps {
  items: TabItem[];
  active: string;
  onChange?: (key: string) => void;
  style?: React.CSSProperties;
}

/** 底部 Tab 栏（检测员：首页 / 我的）。 */
export function BottomTabBar(props: BottomTabBarProps): JSX.Element;
