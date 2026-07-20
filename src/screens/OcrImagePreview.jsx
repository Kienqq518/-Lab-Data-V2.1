import React from 'react';

/** 全屏图片预览：点击缩略图打开，支持关闭与缩放 */
export function OcrImagePreview({ open, scenario, onClose }) {
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    if (open) setScale(1);
  }, [open]);

  if (!open) return null;

  function zoom(delta) {
    setScale((s) => Math.min(3, Math.max(0.5, +(s + delta).toFixed(2))));
  }

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column',
      }}
      onClick={onClose}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', color: '#fff', flex: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 'var(--fs-base)' }}
        >
          关闭
        </button>
        <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>
          {scenario ? `识别参照图 · ${scenario}` : '识别参照图'}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => zoom(-0.25)} style={zoomBtnStyle}>−</button>
          <span style={{ fontSize: 'var(--fs-sm)', minWidth: 44, textAlign: 'center', lineHeight: '32px' }}>{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => zoom(0.25)} style={zoomBtnStyle}>+</button>
        </div>
      </div>
      <div
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 280 * scale, height: 280 * scale, borderRadius: 12,
            background: 'repeating-linear-gradient(135deg,#2a2f38 0 14px,#22262d 14px 28px)',
            border: '2px solid rgba(255,255,255,0.2)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
            transition: 'width .15s, height .15s',
          }}
        >
          <svg width={48 * scale} height={48 * scale} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          {scenario && (
            <span style={{ fontSize: 'var(--fs-sm)', color: 'rgba(255,255,255,0.85)' }}>{scenario}</span>
          )}
        </div>
      </div>
    </div>
  );
}

const zoomBtnStyle = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1,
};
