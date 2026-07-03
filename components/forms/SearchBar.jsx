import React from 'react';

/**
 * 搜索栏。左侧放大镜、右侧可选扫码按钮（现场扫样品/设备条码）。
 * 沿用旧 app："请输入试验编号、试验名称进行搜索" + 扫码。
 */
export function SearchBar({ value, onChange, placeholder = '请输入编号或名称搜索', onScan, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...style }} {...rest}>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 14px',
        background: 'var(--white)', borderRadius: 'var(--radius-md)',
        border: `1px solid ${focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
        boxShadow: focus ? 'var(--shadow-focus)' : 'none',
        transition: 'border var(--dur-fast), box-shadow var(--dur-fast)',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-placeholder)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            font: 'var(--font-sans)', fontSize: 'var(--fs-base)', color: 'var(--text-title)',
          }}
        />
      </div>
      {onScan && (
        <button onClick={onScan} aria-label="扫码" style={{
          width: 44, height: 44, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--white)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--brand-action)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="7" y1="12" x2="17" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
}
