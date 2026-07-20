import React from 'react';
import { getDefaultScenario, getPassedScenarios } from './ocr-scenario.js';

/**
 * 场景下拉 + 无已通过规则时的提示。
 * value/onChange 由父组件控制；未传 value 时内部按 passedAt 最早默认选中。
 */
export function OcrScenarioSelect({
  ocrScenarios = [],
  value,
  onChange,
  disabled = false,
  style,
}) {
  const passed = getPassedScenarios(ocrScenarios);
  const hasPassed = passed.length > 0;

  React.useEffect(() => {
    if (!hasPassed || !onChange) return;
    if (value && passed.some((s) => s.name === value)) return;
    const def = getDefaultScenario(ocrScenarios);
    if (def) onChange(def.name);
  }, [ocrScenarios, hasPassed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasPassed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', flex: 'none' }}>场景</span>
          <select
            disabled
            value=""
            style={{
              flex: 1, minWidth: 0, height: 34, borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)', background: 'var(--surface-sunken)',
              color: 'var(--text-placeholder)', fontSize: 'var(--fs-sm)', padding: '0 10px',
            }}
          >
            <option value="">请选择场景</option>
          </select>
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger,#e23b3b)', lineHeight: 1.5 }}>
          该设备与试验项下不存在验证通过的识别规则
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', flex: 'none' }}>场景</span>
      <select
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={disabled}
        style={{
          flex: 1, minWidth: 0, height: 34, borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)', background: 'var(--white)',
          color: 'var(--text-body)', fontSize: 'var(--fs-sm)', padding: '0 10px',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {passed.map((s) => (
          <option key={s.id || s.name} value={s.name}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}
