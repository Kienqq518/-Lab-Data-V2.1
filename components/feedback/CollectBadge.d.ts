import React from 'react';

export type CollectMethod = 'auto' | 'ocr' | 'ble' | 'manual';

export interface CollectBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** auto自动采集(联网) / ocr拍照识别(老旧) / ble蓝牙同步(便携) / manual手工录入(单机) */
  method?: CollectMethod;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

/** 采集方式徽章（图标 + 文案）。决定采集详情页的录入交互。 */
export function CollectBadge(props: CollectBadgeProps): JSX.Element;
