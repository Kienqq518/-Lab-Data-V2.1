import React from 'react';

/**
 * 上传状态图标 + 文案。
 * status: pending(未上传·橙告警) | done(已上传·绿对勾)
 * 图标采用 Lucide alert-circle / check-circle 路径。
 */
function Icon({ name, color, size }) {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  if (name === 'check') {
    return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
  }
  return <svg {...common}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
}

export function UploadStatus({ status = 'pending', showLabel = true, size = 16, style, ...rest }) {
  const done = status === 'done';
  const color = done ? 'var(--upload-done)' : 'var(--upload-pending)';
  const label = done ? '已上传' : '未上传';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      color, font: 'var(--font-sans)', fontSize: 'var(--fs-sm)', fontWeight: 600, ...style,
    }} {...rest}>
      <Icon name={done ? 'check' : 'alert'} color={color} size={size} />
      {showLabel && label}
    </span>
  );
}
