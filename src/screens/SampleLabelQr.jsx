import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/** 样品标签二维码 payload：与扫码入口一致，编码样品编号 */
export function sampleLabelPayload(sample) {
  return sample?.code || '';
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

/** 样品标签二维码弹窗 */
export function SampleLabelQrModal({ sample, onClose }) {
  if (!sample) return null;
  const payload = sampleLabelPayload(sample);

  return (
    <React.Fragment>
      <div
        role="presentation"
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.45)' }}
      />
      <div
        role="dialog"
        aria-labelledby="sample-label-qr-title"
        style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 210, width: 'min(320px, calc(100% - 48px))',
          background: 'var(--white)', borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 20px 48px rgba(15,23,42,0.22)', overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--divider)' }}>
          <span id="sample-label-qr-title" style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text-title)' }}>样品标签</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, border: 'none', borderRadius: 'var(--radius-sm)',
              background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18 M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-title)', fontVariantNumeric: 'tabular-nums', wordBreak: 'break-all' }}>{sample.code}</div>
            <div style={{ marginTop: 4, fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{sample.name}</div>
          </div>
          <div style={{
            padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--white)',
            border: '1px solid var(--divider)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.6)',
          }}>
            <QRCodeSVG value={payload} size={176} level="M" includeMargin={false} />
          </div>
          <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
            请在上位机使用扫描枪扫描此二维码，以定位该样品的检测任务
          </p>
        </div>
      </div>
    </React.Fragment>
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

/** L4 基础信息区的「查看样品标签二维码」入口 */
export function SampleLabelQrLink({ sample }) {
  const [open, setOpen] = React.useState(false);
  if (!sample?.code) return null;
  return (
    <React.Fragment>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
          border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
          color: 'var(--brand-action)', fontSize: 'var(--fs-sm)', fontWeight: 600,
        }}
      >
        <QrGlyph size={16} />
        查看样品标签二维码
      </button>
      {open && <SampleLabelQrModal sample={sample} onClose={() => setOpen(false)} />}
    </React.Fragment>
  );
}
