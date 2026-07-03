import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary实心 / secondary描边 / ghost无底 / danger红 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'lg' | 'md' | 'sm';
  /** 占满整行 */
  block?: boolean;
  /** 前置图标节点（Lucide 等） */
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * 主操作按钮。重置/查询/确定/上传/登录等统一用它。
 * @startingPoint section="表单" subtitle="按钮全变体" viewport="700x140"
 */
export function Button(props: ButtonProps): JSX.Element;
