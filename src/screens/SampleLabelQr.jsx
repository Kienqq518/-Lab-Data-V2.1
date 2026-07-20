import React from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';

/** 样品标签二维码 payload：与扫码入口一致，编码样品编号 */
export function sampleLabelPayload(sample) {
  return sample?.code || '';
}

function getModalRoot() {
  return document.querySelector('.screen') || document.body;
}

function QrGlyph({ size = 18, color = 'var(--brand-action)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h2v2h-2z M18 14h3v3h-3z M14 18h2v3h-2z M18 21v-2 M21 18h-2 M21 21h.01" />
    </svg>
  );
}

/** 样品标签二维码弹窗（挂载到 .screen，覆盖整页居中） */
export function SampleLabelQrModal({ sample, onClose }) {
  const [root, setRoot] = React.useState(null);

  React.useEffect(() => {
    setRoot(getModalRoot());
  }, []);

  React.useEffect(() => {
    if (!sample) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sample, onClose]);

  if (!sample || !root) return null;
  const payload = sampleLabelPayload(sample);

  return createPortal(
    <React.Fragment>
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0, zIndex: 250,
          background: 'rgba(15,23,42,0.52)', backdropFilter: 'blur(2px)',
        }}
      />
      <div
        role="dialog"
        aria-labelledby="sample-label-qr-title"
        style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 260, width: 'min(300px, calc(100% - 40px))',
          background: 'var(--white)', borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 24px 56px rgba(15,23,42,0.28)', overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px solid var(--divider)',
        }}>
          <span id="sample-label-qr-title" style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text-title)' }}>样品标签</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, border: 'none', borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-subtle, #f3f5f8)', cursor: 'pointer',
              color: 'var(--text-secondary)', padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18 M6 6l12 12" /></svg>
          </button>
        </div>

        <div style={{ padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{
              fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-title)',
              fontVariantNumeric: 'tabular-nums', wordBreak: 'break-all', lineHeight: 1.35,
            }}>{sample.code}</div>
            <div style={{
              marginTop: 6, fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.45,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{sample.name}</div>
          </div>

          <div style={{
            padding: 10, borderRadius: 'var(--radius-md)', background: '#fff',
            border: '1px solid var(--border-default, #e2e8f0)',
            boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
          }}>
            <QRCodeSVG value={payload} size={168} level="M" includeMargin={false} />
          </div>

          <div style={{
            width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
            background: 'var(--blue-50, #eff6ff)', border: '1px solid var(--blue-100, #dbeafe)',
          }}>
            <p style={{
              margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-title)',
              textAlign: 'center', lineHeight: 1.55, fontWeight: 500,
            }}>
              请在上位机使用扫描枪扫描此二维码，以定位该样品的检测任务
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%', height: 40, border: 'none', borderRadius: 'var(--radius-md)',
              background: 'var(--brand-action)', color: '#fff',
              fontSize: 'var(--fs-base)', fontWeight: 600, cursor: 'pointer',
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </React.Fragment>,
    root,
  );
}

/** L3 样品卡片上的样品标签 icon */
export function SampleLabelQrIcon({ sample, size = 18 }) {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <button
        type="button"
        aria-label="查看样品标签二维码"
        title="样品标签"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
          width: 22, height: 22, border: 'none', borderRadius: 'var(--radius-sm)',
          background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--brand-action)',
        }}
      >
        <QrGlyph size={size} />
      </button>
      {open && <SampleLabelQrModal sample={sample} onClose={() => setOpen(false)} />}
    </React.Fragment>
  );
}

/** L4 基础信息区的「查看样品标签二维码」入口
 *  - placement=footerEnd：卡片内容区右下角（基础信息 Section 底部）
 *  - placement=headerEnd：标题栏 extra（已弃用，保留兼容）
 */
export function SampleLabelQrLink({ sample, placement = 'inline' }) {
  const [open, setOpen] = React.useState(false);
  if (!sample?.code) return null;
  const isFooterEnd = placement === 'footerEnd';
  const isHeaderEnd = placement === 'headerEnd';
  const isCompact = isFooterEnd || isHeaderEnd;
  return (
    <React.Fragment>
      <button
        type="button"
        aria-label="查看样品标签二维码"
        onClick={() => setOpen(true)}
        style={{
          marginTop: isFooterEnd ? 0 : isHeaderEnd ? 0 : 10,
          display: 'inline-flex', alignItems: 'center', gap: isCompact ? 4 : 6,
          border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
          color: 'var(--brand-action)', fontSize: isCompact ? 'var(--fs-xs)' : 'var(--fs-sm)',
          fontWeight: 600, flex: 'none', whiteSpace: 'nowrap',
        }}
      >
        <QrGlyph size={isCompact ? 14 : 16} />
        查看样品标签二维码
      </button>
      {open && <SampleLabelQrModal sample={sample} onClose={() => setOpen(false)} />}
    </React.Fragment>
  );
}
