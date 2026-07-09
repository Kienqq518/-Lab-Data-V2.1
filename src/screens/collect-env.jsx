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
  // 否则 → 独立传感器（RS-WS-WIFI-6 等，协议见《数据采集与其他传感器（温湿度等）通讯协议V1.0》）。
  // demo：设备直连（auto）统一走安全管家；其余按试验项稳定随机选用两种模式。
  const isGuardEnv = options.forceGuard ? true : hash % 2 === 0;
  const node = GUARD_NODE_POOL[hash % GUARD_NODE_POOL.length];
  return {
    isGuardEnv,
    envSrc: isGuardEnv
      ? { scheme: 'guard', platform: '安全管家', node: node.nodeName, code: node.code }
      : { scheme: 'wifi', typeLabel: '独立传感器', model: 'RS-WS-WIFI-6' },
  };
}

export function getOcrReferenceAttachments(attachments, { filled, flowLocked, isOcr }) {
  const list = Array.isArray(attachments) ? attachments : [];
  if (!isOcr || !filled) return list;
  if (list.length > 0) return list;
  return flowLocked ? [MOCK_OCR_REFERENCE] : list;
}

export function EnvInfoSection({ envMock, env, onRefresh, Section, Grid }) {
  const { isGuardEnv, envSrc } = envMock;
  return (
    <Section
      title={(
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          环境信息
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
        </span>
      )}
      icon="thermometer"
      extra={(
        <button
          type="button"
          onClick={onRefresh}
          style={{ border: 'none', background: 'transparent', color: 'var(--brand-action)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-sm)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
          刷新
        </button>
      )}
    >
      <Grid items={[['环境室温', `${env.wd} ℃`], ['环境湿度', `${env.sd} %RH`]]} />
    </Section>
  );
}
