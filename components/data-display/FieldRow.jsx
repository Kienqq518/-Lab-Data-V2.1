import React from 'react';
import { Input } from '../forms/Input.jsx';

/**
 * 试验字段录入行。采集详情页的字段，如「正向电阻 [μΩ]」。
 * required 显示红星；readOnly 显示已采集只读值（灰底）。
 */
export function FieldRow({
  label, value, onChange, unit, placeholder = '数值', required = false,
  readOnly = false, style,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, ...style }}>
      <label style={{
        width: 110, flex: 'none', fontSize: 'var(--fs-base)', color: 'var(--text-body)',
        display: 'flex', gap: 2,
      }}>
        {required && <span style={{ color: 'var(--danger)' }}>*</span>}<span>{label}{unit ? `（${unit}）` : ''}</span>
      </label>
      <Input
        value={value} onChange={onChange} placeholder={placeholder}
        readOnly={readOnly} style={{ flex: 1 }}
      />
    </div>
  );
}
