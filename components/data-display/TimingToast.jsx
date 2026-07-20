import React from 'react';

/** L4 试验时间门控提示（页面级，确保采集区操作也能看到） */
export function TimingToast({ message }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', left: '50%', bottom: 88, transform: 'translateX(-50%)',
        zIndex: 300, padding: '10px 16px', borderRadius: 'var(--radius-pill)',
        background: 'rgba(15,23,42,0.88)', color: '#fff', fontSize: 'var(--fs-sm)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)', pointerEvents: 'none',
        maxWidth: 'min(360px, calc(100% - 32px))', textAlign: 'center', lineHeight: 1.45,
      }}
    >
      {message}
    </div>
  );
}
