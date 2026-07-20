import React from 'react';
import { getDefaultScenario, getPassedScenarios } from './ocr-scenario.js';

const OCR = {
  fg: 'var(--collect-ocr, #7c5cff)',
  bg: 'var(--collect-ocr-bg, #efeaff)',
  border: 'rgba(124, 92, 255, 0.22)',
  borderSoft: 'rgba(124, 92, 255, 0.12)',
};

function CameraIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

/**
 * 场景选择 + 拍照识别操作条（OCR 采集区顶部）
 */
export function OcrCaptureBar({
  ocrScenarios = [],
  value,
  onChange,
  onShoot,
  busy = false,
  style,
}) {
  const passed = getPassedScenarios(ocrScenarios);
  const hasPassed = passed.length > 0;
  const canShoot = hasPassed && !!value && !busy;

  React.useEffect(() => {
    if (!hasPassed || !onChange) return;
    if (value && passed.some((s) => s.name === value)) return;
    const def = getDefaultScenario(ocrScenarios);
    if (def) onChange(def.name);
  }, [ocrScenarios, hasPassed]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 'var(--radius-lg, 12px)',
        background: `linear-gradient(165deg, ${OCR.bg} 0%, var(--white, #fff) 72%)`,
        border: `1px solid ${OCR.borderSoft}`,
        boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', fontWeight: 600, color: OCR.fg, letterSpacing: '0.02em' }}>
          <CameraIcon size={14} />
          图像识别
        </span>
        {hasPassed && value && (
          <span style={{
            fontSize: 10, fontWeight: 600, color: OCR.fg,
            padding: '2px 8px', borderRadius: 'var(--radius-pill)',
            background: 'rgba(124, 92, 255, 0.1)', border: `1px solid ${OCR.borderSoft}`,
          }}>
            {value}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0, height: 40, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--white)', overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}>
          <span style={{
            flex: 'none', height: '100%', display: 'flex', alignItems: 'center',
            padding: '0 12px', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-secondary)',
            background: 'var(--surface-sunken, #f5f6f8)', borderRight: '1px solid var(--border-default)',
          }}>
            场景
          </span>
          <div style={{ position: 'relative', flex: 1, minWidth: 0, height: '100%' }}>
            <select
              value={hasPassed ? (value || '') : ''}
              onChange={(e) => onChange && onChange(e.target.value)}
              disabled={!hasPassed || busy}
              style={{
                width: '100%', height: '100%', border: 'none', outline: 'none',
                padding: '0 32px 0 12px', fontSize: 'var(--fs-sm)',
                color: hasPassed && value ? 'var(--text-title)' : 'var(--text-placeholder)',
                background: 'transparent', appearance: 'none', WebkitAppearance: 'none',
                cursor: hasPassed && !busy ? 'pointer' : 'not-allowed',
              }}
            >
              {!hasPassed && <option value="">请选择场景</option>}
              {hasPassed && passed.map((s) => (
                <option key={s.id || s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
            <span style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-placeholder)', pointerEvents: 'none', display: 'flex',
            }}>
              <ChevronDown />
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onShoot}
          disabled={!canShoot}
          style={{
            flex: 'none', height: 40, padding: '0 16px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${canShoot ? OCR.fg : 'var(--border-default)'}`,
            background: canShoot ? OCR.bg : 'var(--surface-sunken, #f5f6f8)',
            color: canShoot ? OCR.fg : 'var(--text-placeholder)',
            fontSize: 'var(--fs-sm)', fontWeight: 600, whiteSpace: 'nowrap',
            cursor: canShoot ? 'pointer' : 'not-allowed',
            boxShadow: canShoot ? '0 1px 2px rgba(124, 92, 255, 0.12)' : 'none',
            transition: 'background .15s, box-shadow .15s',
          }}
        >
          <CameraIcon size={15} />
          {busy ? '识别中…' : '拍照识别'}
        </button>
      </div>

      {!hasPassed && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '9px 11px', borderRadius: 'var(--radius-md)',
          background: 'rgba(226, 59, 59, 0.06)', border: '1px solid rgba(226, 59, 59, 0.14)',
          fontSize: 'var(--fs-xs)', color: 'var(--danger, #e23b3b)', lineHeight: 1.55,
        }}>
          <AlertIcon />
          <span>该设备与试验项下不存在验证通过的识别规则，请手动录入或联系管理员配置规则</span>
        </div>
      )}

      {hasPassed && !value && (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: 2 }}>
          请先选择采集场景，再拍摄对应界面或报表
        </div>
      )}
    </div>
  );
}

/** @deprecated 使用 OcrCaptureBar */
export { OcrCaptureBar as OcrScenarioSelect };
