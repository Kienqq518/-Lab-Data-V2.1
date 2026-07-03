import React from 'react';

export interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** 右侧操作区，如「更多」链接 */
  extra?: React.ReactNode;
}

/** 区块标题：左 4px 蓝竖条 + 标题（数蚕标志性样式）。 */
export function SectionTitle(props: SectionTitleProps): JSX.Element;
