import React from 'react';
import { AppBar, Button, Card, Input, SectionTitle } from '../design-system.js';
import { getApiBaseUrl, setApiBaseUrl } from '../api-config.js';
import { AnnotatedWrapper } from '../annotation/index.js';

/* 独立 IP 配置页 — 登录页双击「欢迎来访」进入；从设置页迁出 */

function IpConfig({ onBack }) {
  const [apiBaseUrl, setApiBaseUrlInput] = React.useState(() => getApiBaseUrl());
  const [toast, setToast] = React.useState(null);
  const timer = React.useRef(null);

  function showToast(msg) {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2000);
  }
  React.useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  /** 保存数采 Web 端连接地址 */
  function saveApiBaseUrl() {
    const value = apiBaseUrl.trim();
    if (!value) {
      showToast('请输入数采 Web 端地址');
      return;
    }
    try {
      const saved = setApiBaseUrl(value);
      setApiBaseUrlInput(saved);
      showToast('连接地址已保存');
    } catch {
      showToast('地址格式无效，请检查后重试');
    }
  }

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      <AppBar title="IP 配置" onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AnnotatedWrapper id="settingsIp" layout="block">
          <div>
            <SectionTitle style={{ marginBottom: 10 }}>IP</SectionTitle>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Input
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrlInput(e.target.value)}
                  placeholder="请设置"
                  style={{ flex: 1 }}
                />
                <Button variant="secondary" onClick={saveApiBaseUrl} style={{ flex: 'none', minWidth: 72, height: 44, padding: '0 16px' }}>设置</Button>
              </div>
              <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                配置当前连接的数采 Web 端环境
              </div>
            </Card>
          </div>
        </AnnotatedWrapper>
      </div>
      {toast && (
        <div style={{ position: 'absolute', left: '50%', bottom: 40, transform: 'translateX(-50%)', zIndex: 120, maxWidth: '80%', padding: '10px 18px', borderRadius: 'var(--radius-pill)', background: 'rgba(15,23,42,0.9)', color: '#fff', fontSize: 'var(--fs-sm)', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export { IpConfig };
