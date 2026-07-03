import React from 'react';

export interface SearchBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  /** 传入则显示右侧扫码按钮 */
  onScan?: () => void;
}

/** 搜索栏（放大镜 + 可选扫码）。列表页顶部统一用它。 */
export function SearchBar(props: SearchBarProps): JSX.Element;
