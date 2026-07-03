import React from 'react';

/**
 * 采集方式徽章。auto(自动⚡) | ocr(拍照📷·camera) | ble(蓝牙🔵) | manual(手工✏️)
 * 图标用 Lucide 路径：zap / camera / bluetooth / pencil。
 */
const MAP = {
  auto:   { c: 'var(--collect-auto)',   bg: 'var(--collect-auto-bg)',   label: '设备直连' },
  ocr:    { c: 'var(--collect-ocr)',    bg: 'var(--collect-ocr-bg)',    label: '拍照识别' },
  ble:    { c: 'var(--collect-ble)',    bg: 'var(--collect-ble-bg)',    label: '蓝牙同步' },
  manual: { c: 'var(--collect-manual)', bg: 'var(--collect-manual-bg)', label: '手工录入' },
};

function MethodIcon({ method, color, size }) {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (method) {
    case 'auto':   return <svg {...c}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case 'ocr':    return <svg {...c}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3" /></svg>;
    case 'ble':    return <svg {...c}><path d="m7 7 10 10-5 5V2l5 5L7 17" /></svg>;
    default:       return <svg {...c}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
  }
}

export function CollectBadge({ method = 'auto', showLabel = true, size = 'md', style, ...rest }) {
  const s = MAP[method] || MAP.auto;
  const sm = size === 'sm';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: showLabel ? (sm ? '2px 8px' : '4px 10px') : (sm ? 4 : 6),
      borderRadius: 'var(--radius-pill)', background: s.bg, color: s.c,
      font: 'var(--font-sans)', fontSize: sm ? 'var(--fs-xs)' : 'var(--fs-sm)', fontWeight: 600,
      lineHeight: 1.3, whiteSpace: 'nowrap', ...style,
    }} {...rest}>
      <MethodIcon method={method} color={s.c} size={sm ? 13 : 15} />
      {showLabel && s.label}
    </span>
  );
}
