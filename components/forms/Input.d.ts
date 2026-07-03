import React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  /** 前置图标/节点 */
  prefix?: React.ReactNode;
  /** 后置图标/节点（如扫码） */
  suffix?: React.ReactNode;
  /** 右侧单位文字，如 μΩ / ℃ */
  unit?: string;
  readOnly?: boolean;
  size?: 'lg' | 'md' | 'sm';
}

/** 文本输入框。聚焦蓝边 + 外发光；只读态走浅灰底。 */
export function Input(props: InputProps): JSX.Element;
