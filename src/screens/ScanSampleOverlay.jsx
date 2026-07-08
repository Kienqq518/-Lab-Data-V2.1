import React from 'react';

/** 扫码 mock 默认样品 id */
export const SCAN_SAMPLE_ID = 's1b';

/**
 * 扫码取景页（mock）：点击取景框即模拟扫码成功
 */
export function ScanSampleOverlay({ onCancel, onScan }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, background: '#0b0d10', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', color: '#fff' }}>
        <button type="button" onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 'var(--fs-base)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          取消
        </button>
        <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>扫描样品二维码</span>
        <span style={{ width: 56 }} />
      </div>
      <div style={{ flex: 1, position: 'relative', margin: '0 16px 24px', borderRadius: 'var(--radius-lg,16px)', overflow: 'hidden', background: 'repeating-linear-gradient(135deg,#1a1d22 0 14px,#16191e 14px 28px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button type="button" onClick={onScan} style={{ position: 'absolute', inset: '20% 14%', border: '2px solid rgba(255,255,255,0.85)', borderRadius: 12, background: 'transparent', cursor: 'pointer' }}>
          {['-1px -1px', '-1px auto auto -1px', 'auto -1px -1px auto', 'auto auto -1px -1px'].map((p, k) => (
            <span key={k} style={{ position: 'absolute', width: 26, height: 26, border: '3px solid var(--brand-action)', ...(k === 0 ? { top: -1, left: -1, borderRight: 'none', borderBottom: 'none' } : k === 1 ? { top: -1, right: -1, borderLeft: 'none', borderBottom: 'none' } : k === 2 ? { bottom: -1, left: -1, borderRight: 'none', borderTop: 'none' } : { bottom: -1, right: -1, borderLeft: 'none', borderTop: 'none' }) }} />
          ))}
          <span style={{ position: 'absolute', bottom: -34, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.85)', fontSize: 'var(--fs-sm)' }}>将样品二维码对准取景框（点击模拟扫码）</span>
        </button>
      </div>
    </div>
  );
}

/** 根据样品解析所属任务（mock 扫码跳转用） */
export function resolveTaskForSample(sample, tasks) {
  return tasks.find((tk) => sample.code.startsWith(tk.code))
    || {
      code: sample.code.replace(/-\d+$/, ''),
      sampleName: sample.name,
      client: sample.client,
      time: '',
      status: sample.status,
    };
}
