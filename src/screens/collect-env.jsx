import React from 'react';

const GUARD_NODE_POOL = [
  { nodeName: '温湿度RK2D', code: 'D1XQ988PK03P' },
  { nodeName: '温湿度PT8F', code: 'D1XQ977QK21M' },
  { nodeName: '温湿度RK1A', code: 'D1XQ912MK88T' },
];

export const MOCK_OCR_REFERENCE = { id: '__mock_ocr_ref__', kind: 'photo', mock: true };

function stableHash(seed) {
  const text = String(seed || 'default');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function resolveEnvMock(seed, options = {}) {
  const hash = stableHash(seed);
  // 展示逻辑对齐 Web「设备配置 → 安全管家配置」：
  // 若该设备试验项绑定了安全管家温湿度节点 → 安全管家（随上位机试验数据回传，只读）；
  // 否则若配置了独立传感器 → 独立传感器（RS-WS-WIFI-6 等）；
  // 两者均未配置 → scheme=none，试验数据区室温/湿度需检测员手工录入。
  // demo：设备直连（auto）统一走安全管家；其余按试验项稳定随机 guard / wifi / none。
  const mode = options.forceGuard ? 'guard' : (['guard', 'wifi', 'none'][hash % 3]);
  const node = GUARD_NODE_POOL[hash % GUARD_NODE_POOL.length];
  const isGuardEnv = mode === 'guard';
  const hasSensor = mode !== 'none';
  return {
    isGuardEnv,
    hasSensor,
    envSrc: mode === 'guard'
      ? { scheme: 'guard', platform: '安全管家', node: node.nodeName, code: node.code }
      : mode === 'wifi'
      ? { scheme: 'wifi', typeLabel: '独立传感器', model: 'RS-WS-WIFI-6' }
      : { scheme: 'none' },
  };
}

/** 每条试验数据附带的室温/湿度字段 */
export const RECORD_ENV_FIELDS = [
  { key: 'wd', label: '室温', unit: '℃' },
  { key: 'sd', label: '湿度', unit: '%RH' },
];

/** 是否已接入环境传感器（安全管家或独立传感器） */
export function hasEnvSensor(envMock) {
  return !!envMock?.hasSensor && envMock?.envSrc?.scheme !== 'none';
}

/** 采集/回填时将环境温湿度写入本条数据 vals（有传感器时） */
export function mergeRecordEnvVals(vals, env, envMock) {
  if (!hasEnvSensor(envMock)) return vals;
  return { ...vals, wd: env.wd, sd: env.sd };
}

/** 试验数据区·室温/湿度字段（回显环境信息或手输） */
export function RecordEnvFields({ env, envMock, vals, readOnly, handInputBlocked, onReadOnlyInteract, onChange, FieldRow }) {
  const sensor = hasEnvSensor(envMock);
  const envReadOnly = readOnly || handInputBlocked || sensor;
  const sourceLabel = envMock.isGuardEnv ? '安全管家' : '独立传感器';
  return (
    <React.Fragment>
      {RECORD_ENV_FIELDS.map((f) => (
        <FieldRow
          key={f.key}
          label={f.label}
          unit={f.unit}
          value={(sensor ? env[f.key] : vals[f.key]) || ''}
          readOnly={envReadOnly}
          placeholder={sensor ? '' : '请输入'}
          onReadOnlyInteract={handInputBlocked ? onReadOnlyInteract : undefined}
          onChange={(e) => onChange(f.key, e.target.value)}
        />
      ))}
      {sensor && (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          由上方「环境信息」{sourceLabel}自动回填，不可手改
        </div>
      )}
      {!sensor && (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          未配置环境传感器，请手工录入本条数据的室温/湿度
        </div>
      )}
    </React.Fragment>
  );
}

export function getOcrReferenceAttachments(attachments, { filled, flowLocked, isOcr }) {
  const list = Array.isArray(attachments) ? attachments : [];
  if (!isOcr || !filled) return list;
  if (list.length > 0) return list;
  return flowLocked ? [MOCK_OCR_REFERENCE] : list;
}

export function EnvInfoSection({ envMock, env, onRefresh, Section, Grid }) {
  const { isGuardEnv, envSrc, hasSensor } = envMock;
  const noSensor = !hasSensor;
  return (
    <Section
      title={(
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          环境信息
          {!noSensor && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999,
            fontSize: 'var(--fs-xs)', fontWeight: 600, lineHeight: 1.6,
            color: isGuardEnv ? 'var(--collect-ble,#0a8a96)' : 'var(--collect-auto,#1d54c4)',
            background: isGuardEnv ? 'rgba(10,138,150,0.10)' : 'rgba(29,84,196,0.10)',
            border: '1px solid ' + (isGuardEnv ? 'rgba(10,138,150,0.25)' : 'rgba(29,84,196,0.25)'),
          }}>
            {isGuardEnv
              ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0 M1.42 9a16 16 0 0 1 21.16 0 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01" /></svg>}
            {isGuardEnv ? '安全管家' : '独立传感器'}
            <span style={{ width: 1, height: 11, background: 'currentColor', opacity: 0.3, margin: '0 1px' }} />
            {isGuardEnv
              ? <React.Fragment><span style={{ fontWeight: 600 }}>{envSrc.node}</span><span style={{ fontWeight: 400, opacity: 0.75, fontFamily: 'var(--font-mono,monospace)' }}>({envSrc.code})</span></React.Fragment>
              : <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono,monospace)' }}>{envSrc.model}</span>}
          </span>
          )}
        </span>
      )}
      icon="thermometer"
      extra={!noSensor ? (
        <button
          type="button"
          onClick={onRefresh}
          style={{ border: 'none', background: 'transparent', color: 'var(--brand-action)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-sm)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
          刷新
        </button>
      ) : null}
    >
      {noSensor
        ? <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>未配置环境传感器（安全管家节点或独立传感器均未绑定），试验数据区每条记录需手工录入室温/湿度。</div>
        : <Grid items={[['环境室温', `${env.wd} ℃`], ['环境湿度', `${env.sd} %RH`]]} />}
    </Section>
  );
}
