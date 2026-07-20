import React from 'react';
import { createPortal } from 'react-dom';

function getToastRoot() {
  return (
    document.querySelector('.overlay-screen')
    || document.querySelector('.screen')
    || document.querySelector('.ds-frame')
    || document.body
  );
}

/** L4 试验时间门控提示（挂载到 overlay/手机框内，避免 fixed 被裁切） */
export function TimingToast({ message }) {
  const [root, setRoot] = React.useState(() => (typeof document !== 'undefined' ? getToastRoot() : null));

  React.useEffect(() => {
    setRoot(getToastRoot());
  }, []);

  if (!message || !root) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute', left: '50%', bottom: 96, transform: 'translateX(-50%)',
        zIndex: 1000, padding: '11px 18px', borderRadius: 'var(--radius-pill)',
        background: 'rgba(15,23,42,0.94)', color: '#fff', fontSize: 'var(--fs-sm)',
        boxShadow: '0 10px 28px rgba(0,0,0,0.32)', pointerEvents: 'none',
        maxWidth: 'min(360px, calc(100% - 32px))', textAlign: 'center', lineHeight: 1.45,
      }}
    >
      {message}
    </div>,
    root,
  );
}
