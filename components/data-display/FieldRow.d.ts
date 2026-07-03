import React from 'react';

export interface FieldRowProps {
  /** 字段标签，如「正向电阻」 */
  label: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /** 单位，如 μΩ / ℃ / %RH */
  unit?: string;
  placeholder?: string;
  required?: boolean;
  /** 已采集只读 */
  readOnly?: boolean;
  style?: React.CSSProperties;
}

/** 试验字段录入行（标签 + 输入 + 单位）。采集详情表单用。 */
export function FieldRow(props: FieldRowProps): JSX.Element;
