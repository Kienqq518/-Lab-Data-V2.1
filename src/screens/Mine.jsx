import React from 'react';
import { Card, SectionTitle } from '../design-system.js';

/* 我的 — 用户信息 / 我的权限 / 更多操作 */

  function Mine({ onLogout }) {
    return (
      <div style={{ padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-section)' }}>
        {/* 用户信息头 */}
        <Card padding="0" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: 'var(--blue-700)', color: '#fff' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', color: 'var(--blue-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, flex: 'none' }}>梁</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 600 }}>梁倩</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>账号 lq</div>
            </div>
          </div>
          <InfoRow label="部门" value="数蚕智能 · 安全工器具检测组" />
          <InfoRow label="手机号" value="176 8248 4331" last />
        </Card>

        <div>
          <SectionTitle style={{ marginBottom: 14 }}>更多操作</SectionTitle>
          <Card padding="0">
            <Row icon="settings" label="设置" />
            <Row icon="key" label="修改密码" />
            <Row icon="bell" label="消息通知" />
            <Row icon="help" label="帮助与反馈" />
            <Row icon="logout" label="退出登录" danger onClick={onLogout} last />
          </Card>
        </div>
      </div>
    );
  }

  function Row({ icon, label, danger, onClick, last }) {
    const paths = {
      key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
      bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0',
      help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01',
      logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
      settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    };
    const color = danger ? 'var(--danger)' : 'var(--text-body)';
    return (
      <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '15px 16px', border: 'none', borderBottom: last ? 'none' : '1px solid var(--divider)', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={paths[icon]} /></svg>
        <span style={{ flex: 1, fontSize: 'var(--fs-base)', color }}>{label}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-placeholder)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    );
  }

  function InfoRow({ label, value, last }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 18px', borderBottom: last ? 'none' : '1px solid var(--divider)' }}>
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', flex: 'none' }}>{label}</span>
        <span style={{ fontSize: 'var(--fs-base)', color: 'var(--text-title)', fontWeight: 500, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      </div>
    );
  }

export { Mine };
