import React from 'react';
import { createPortal } from 'react-dom';
import { Card } from './Card.jsx';
import { Button } from '../forms/Button.jsx';
import { formatTestTiming } from '../../src/screens/collect-model.js';

function getModalRoot() {
  return document.querySelector('.screen') || document.body;
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-action)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function TimingGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
      {items.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', gap: 8, fontSize: 'var(--fs-base)' }}>
          <span style={{ color: 'var(--text-secondary)', flex: 'none' }}>{label}</span>
          <span style={{ color: 'var(--text-title)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function OverwriteConfirmModal({ currentStartedAt, recording, onConfirm, onCancel }) {
  const [root, setRoot] = React.useState(null);

  React.useEffect(() => {
    setRoot(getModalRoot());
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  if (!root) return null;

  return createPortal(
    <React.Fragment>
      <div
        role="presentation"
        onClick={onCancel}
        style={{
          position: 'absolute', inset: 0, zIndex: 250,
          background: 'rgba(15,23,42,0.52)', backdropFilter: 'blur(2px)',
        }}
      />
      <div
        role="dialog"
        aria-labelledby="timing-overwrite-title"
        style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 260, width: 'min(320px, calc(100% - 40px))',
          background: 'var(--white)', borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 24px 56px rgba(15,23,42,0.28)', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 18px 12px' }}>
          <div id="timing-overwrite-title" style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text-title)' }}>
            重新记录开始时间
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 'var(--fs-base)', color: 'var(--text-body)', lineHeight: 1.55 }}>
            是否要重新记录开始时间？当前记录为 {formatTestTiming(currentStartedAt)}。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '0 18px 18px' }}>
          <Button variant="secondary" block onClick={onCancel} disabled={recording}>取消</Button>
          <Button block onClick={onConfirm} disabled={recording}>{recording ? '记录中…' : '确认重新记录'}</Button>
        </div>
      </div>
    </React.Fragment>,
    root,
  );
}

export function TestItemTimingSection({
  timing,
  canRecordStart,
  recording,
  confirmOverwrite,
  toast,
  requireStartBeforeCollect = false,
  isAutoDirect = false,
  onRecordStartClick,
  onConfirmOverwrite,
  onCancelOverwrite,
}) {
  return (
    <React.Fragment>
      <Card padding="0">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--divider)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <ClockIcon />
            <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>试验时间</span>
          </div>
          {canRecordStart && (
            <Button size="sm" variant="secondary" onClick={onRecordStartClick} disabled={recording} style={{ flex: 'none', height: 28, padding: '0 12px' }}>
              {recording ? '记录中…' : '记录开始时间'}
            </Button>
          )}
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TimingGrid items={[
            ['试验开始时间', formatTestTiming(timing.startedAt)],
            ['试验结束时间', formatTestTiming(timing.endedAt)],
          ]} />
          {requireStartBeforeCollect && (
            <div style={{
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--status-pending-bg, #fff8eb)', border: '1px solid var(--status-pending-border, #f0d9a8)',
              fontSize: 'var(--fs-sm)', color: 'var(--status-pending-fg, #97640f)', lineHeight: 1.5,
            }}>
              上传数据前请先点击右上角「记录开始时间」，否则无法上传。
            </div>
          )}
          {isAutoDirect && !canRecordStart && (
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              设备直连 · 试验开始时间由上位机回传，无需手动记录
            </div>
          )}
        </div>
      </Card>
      {confirmOverwrite && (
        <OverwriteConfirmModal
          currentStartedAt={timing.startedAt}
          recording={recording}
          onConfirm={onConfirmOverwrite}
          onCancel={onCancelOverwrite}
        />
      )}
      {toast && (
        <div style={{
          position: 'fixed', left: '50%', bottom: 88, transform: 'translateX(-50%)',
          zIndex: 300, padding: '10px 16px', borderRadius: 'var(--radius-pill)',
          background: 'rgba(15,23,42,0.88)', color: '#fff', fontSize: 'var(--fs-sm)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </React.Fragment>
  );
}
