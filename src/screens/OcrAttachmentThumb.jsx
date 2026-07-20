import React from 'react';

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

/** OCR 识别参照图缩略图：场景标签在图片下方，不遮挡预览区 */
export function OcrAttachmentThumb({
  attachment,
  flowLocked,
  onPreview,
  onRemove,
}) {
  const label = attachment.scenario || (attachment.kind === 'photo' ? '拍照' : '上传');
  const interactive = !attachment.mock && onPreview;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 76 }}>
      <div
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={() => interactive && onPreview(attachment)}
        onKeyDown={(e) => { if (e.key === 'Enter' && interactive) onPreview(attachment); }}
        style={{
          position: 'relative', width: 76, height: 76, borderRadius: 'var(--radius-md)',
          overflow: 'hidden', border: '1px solid var(--border-default)',
          background: 'repeating-linear-gradient(135deg,#eef1f5 0 8px,#e6eaef 8px 16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: interactive ? 'pointer' : 'default',
        }}
      >
        <CameraIcon />
        {!flowLocked && !attachment.mock && onRemove && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(attachment.id); }}
            style={{
              position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%',
              border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer',
              fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        )}
      </div>
      <span
        title={label}
        style={{
          width: '100%', textAlign: 'center', fontSize: 10, fontWeight: 600,
          color: 'var(--collect-ocr, #7c5cff)', lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
}
