import React from 'react';

export interface UploadStatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** pending未上传(橙) / done已上传(绿) */
  status?: 'pending' | 'done';
  showLabel?: boolean;
  /** 图标尺寸 px */
  size?: number;
}

/** 上传状态：未上传(橙告警) / 已上传(绿对勾)。 */
export function UploadStatus(props: UploadStatusProps): JSX.Element;
