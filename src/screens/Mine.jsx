import React from 'react';
import { AppBar, Button, Card, Input, SectionTitle } from '../design-system.js';
import { MOCK as M } from '../mock.js';
import logoMark from '../../assets/logo-mark.png';
import { getApiBaseUrl, setApiBaseUrl } from '../api-config.js';
import {
  CAMERA_ROTATION_OPTIONS,
  getCameraOrientationConfig,
  setCameraOrientationConfig,
} from '../camera-orientation-config.js';
import { AnnotatedWrapper } from '../annotation/index.js';

/* 我的 — 用户信息 / 消息通知 / 设置 / 帮助与反馈
   采用「我的」Tab 内部页面栈：main → 各详情页（AppBar 返回）。 */

  function Mine({ onLogout, onOpenNotify }) {
    const [view, setView] = React.useState('main');
    const [toast, setToast] = React.useState(null);
    const U = M.currentUser;
    const unread = M.unreadNotificationCount();

    /** 轻提示（演示交互反馈，自动消失） */
    const timer = React.useRef(null);
    function showToast(msg) {
      setToast(msg);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), 2000);
    }
    React.useEffect(() => () => timer.current && clearTimeout(timer.current), []);

    let screen;
    if (view === 'profile') screen = <ProfilePage user={U} onBack={() => setView('main')} onToast={showToast} />;
    else if (view === 'settings') screen = <SettingsPage onBack={() => setView('main')} onPrivacy={() => setView('privacy')} onAbout={() => setView('about')} onToast={showToast} />;
    else if (view === 'privacy') screen = <PrivacyPage onBack={() => setView('settings')} />;
    else if (view === 'about') screen = <AboutPage onBack={() => setView('settings')} onService={() => setView('service')} />;
    else if (view === 'service') screen = <ServiceAgreementPage onBack={() => setView('about')} />;
    else if (view === 'password') screen = <PasswordPage onBack={() => setView('main')} onToast={showToast} />;
    else if (view === 'help') screen = <HelpPage onBack={() => setView('main')} onToast={showToast} />;
    else screen = (
      <div style={{ padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-section)' }}>
        {/* 用户信息头（点击进入个人资料） */}
        <Card padding="0" style={{ overflow: 'hidden' }}>
          <button onClick={() => setView('profile')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: 'var(--blue-700)', color: '#fff', width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', color: 'var(--blue-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, flex: 'none' }}>{U.initial}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{U.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, opacity: 0.85 }}>账号 {U.account}</span>
                <RoleTag label={U.role} />
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <InfoRow label="部门" value={U.dept} />
          <InfoRow label="手机号" value={U.phone} last />
        </Card>

        <div>
          <SectionTitle style={{ marginBottom: 14 }}>更多操作</SectionTitle>
          <Card padding="0">
            <Row icon="bell" label="消息通知" badge={unread} onClick={onOpenNotify} />
            <Row icon="settings" label="设置" onClick={() => setView('settings')} />
            <Row icon="key" label="修改密码" onClick={() => setView('password')} />
            <Row icon="help" label="帮助与反馈" onClick={() => setView('help')} />
            <Row icon="logout" label="退出登录" danger onClick={onLogout} last />
          </Card>
        </div>
      </div>
    );

    return (
      <div style={{ position: 'relative', height: '100%', minHeight: '100%' }}>
        {screen}
        {toast && (
          <div style={{ position: 'absolute', left: '50%', bottom: 40, transform: 'translateX(-50%)', zIndex: 120, maxWidth: '80%', padding: '10px 18px', borderRadius: 'var(--radius-pill)', background: 'rgba(15,23,42,0.9)', color: '#fff', fontSize: 'var(--fs-sm)', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            {toast}
          </div>
        )}
      </div>
    );
  }

  /* ===== 个人资料 ===== */
  function ProfilePage({ user, onBack, onToast }) {
    const [avatarOpen, setAvatarOpen] = React.useState(false);
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', position: 'relative' }}>
        <AppBar title="个人资料" onBack={onBack} />
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '8px 0 4px' }}>
              <button onClick={() => setAvatarOpen(true)} style={{ position: 'relative', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--blue-700)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700 }}>{user.initial}</div>
                <span style={{ position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: '50%', background: 'var(--brand-action)', border: '2px solid var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></svg>
                </span>
              </button>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>点击更换头像</span>
            </div>
          </Card>

          <Card padding="0">
            <FieldRow label="姓名" value={user.name} />
            <FieldRow label="账号" value={user.account} />
            <FieldRow label="所属机构" value={user.org} />
            <FieldRow label="部门" value={user.dept} />
            <FieldRow label="手机号" value={user.phone} />
            <FieldRow label="邮箱" value={user.email} last />
          </Card>

        </div>

        {avatarOpen && (
          <ActionSheet
            title="更换头像"
            actions={[
              { label: '拍照', onClick: () => { setAvatarOpen(false); onToast('头像已更新（演示）'); } },
              { label: '从相册选择', onClick: () => { setAvatarOpen(false); onToast('头像已更新（演示）'); } },
            ]}
            onClose={() => setAvatarOpen(false)}
          />
        )}
      </div>
    );
  }

  /* ===== 设置 ===== */
  function SettingsPage({ onBack, onPrivacy, onAbout, onToast }) {
    const [push, setPush] = React.useState(true);
    const [overdue, setOverdue] = React.useState(true);
    const [returned, setReturned] = React.useState(true);
    const [apiBaseUrl, setApiBaseUrlInput] = React.useState(() => getApiBaseUrl());
    const [cameraOrient, setCameraOrient] = React.useState(() => getCameraOrientationConfig());

    function saveCameraOrient(patch) {
      const saved = setCameraOrientationConfig(patch);
      setCameraOrient(saved);
      onToast('相机方向设置已保存');
    }

    /** 保存数采 Web 端连接地址 */
    function saveApiBaseUrl() {
      const value = apiBaseUrl.trim();
      if (!value) {
        onToast('请输入数采 Web 端地址');
        return;
      }
      try {
        const saved = setApiBaseUrl(value);
        setApiBaseUrlInput(saved);
        onToast('连接地址已保存');
      } catch {
        onToast('地址格式无效，请检查后重试');
      }
    }

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="设置" onBack={onBack} />
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

          <AnnotatedWrapper id="settingsCameraOrientation" layout="block">
            <div>
              <SectionTitle style={{ marginBottom: 10 }}>拍照识别</SectionTitle>
              <Card padding="0">
                <ToggleRow
                  label="相机方向锁定"
                  on={cameraOrient.enabled}
                  onChange={(enabled) => saveCameraOrient({ enabled })}
                />
                <div style={{ padding: '4px 16px 14px', opacity: cameraOrient.enabled ? 1 : 0.45, pointerEvents: cameraOrient.enabled ? 'auto' : 'none' }}>
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 10 }}>旋转角度</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {CAMERA_ROTATION_OPTIONS.map((opt) => {
                      const on = cameraOrient.rotation === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={!cameraOrient.enabled}
                          onClick={() => saveCameraOrient({ rotation: opt.value })}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
                            borderRadius: 'var(--radius-md)', cursor: cameraOrient.enabled ? 'pointer' : 'not-allowed',
                            border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
                            background: on ? 'var(--surface-selected)' : 'var(--white)',
                            color: on ? 'var(--brand-action)' : 'var(--text-body)',
                            fontSize: 'var(--fs-sm)', fontWeight: on ? 600 : 400, textAlign: 'left',
                          }}
                        >
                          <span style={{
                            width: 16, height: 16, borderRadius: '50%', flex: 'none',
                            border: '2px solid ' + (on ? 'var(--brand-action)' : 'var(--border-strong)'),
                            background: on ? 'var(--brand-action)' : 'transparent',
                            boxShadow: on ? 'inset 0 0 0 3px var(--white)' : 'none',
                          }} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          </AnnotatedWrapper>

          <div>
            <SectionTitle style={{ marginBottom: 10 }}>消息推送</SectionTitle>
            <Card padding="0">
              <ToggleRow label="接收消息推送" on={push} onChange={setPush} />
              <ToggleRow label="逾期预警提醒" on={overdue && push} disabled={!push} onChange={setOverdue} />
              <ToggleRow label="退回复测提醒" on={returned && push} disabled={!push} onChange={setReturned} last />
            </Card>
          </div>

          <div>
            <SectionTitle style={{ marginBottom: 10 }}>通用</SectionTitle>
            <Card padding="0">
              <Row icon="trash" label="清除缓存" note="12.6 MB" onClick={() => onToast('缓存已清除（演示）')} />
              <Row icon="shield" label="隐私政策" onClick={onPrivacy} />
              <Row icon="info" label="关于我们" note="Lab Data v2.0.0" onClick={onAbout} />
              <Row icon="refresh" label="检查更新" note="已是最新" onClick={() => onToast('当前已是最新版本')} last />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  /* ===== 隐私政策 ===== */
  function PrivacyPage({ onBack }) {
    const P = [
      ['一、我们如何收集和使用信息', '数蚕 Lab Data（以下简称“本应用”）由杭州数蚕科技有限公司提供。为完成实验室检测数据采集与上传，我们会在你使用相应功能时收集必要信息，包括账号与工号、所属机构与部门、检测任务与试验数据、设备与工位信息，以及为拍照识别采集所需的相机权限。'],
      ['二、信息的存储', '你在本应用产生的检测数据将上传至你所属检测机构的数采系统（TestOS 底座）并存储于机构指定的服务器，存储期限遵循机构与相关法律法规要求。'],
      ['三、信息的共享与披露', '除为完成检测业务向你所属检测机构的数采系统同步数据外，未经你同意，我们不会向第三方共享你的个人信息，法律法规另有规定的除外。'],
      ['四、权限与用途', '相机：用于拍照识别采集试验读数；网络：用于任务与数据的同步上传。你可在系统设置中管理相关权限，关闭后可能影响对应功能的使用。'],
      ['五、信息安全', '我们采用加密传输、访问控制等安全措施保护你的信息。账号相关信息统一在数采系统 Web 端 的TestOS 底座维护。'],
      ['六、联系我们', '如对本隐私政策有任何疑问、意见或投诉，可通过“帮助与反馈”提交，或拨打客服电话 400-800-1234 与我们联系。'],
    ];
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="隐私政策" onBack={onBack} />
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-page)' }}>
          <Card>
            <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text-title)', marginBottom: 6 }}>数蚕 Lab Data 隐私政策</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginBottom: 14 }}>更新日期：2026-07-01 · 杭州数蚕科技有限公司</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)', lineHeight: 1.8, marginBottom: 14 }}>
              本政策旨在向你说明本应用如何收集、使用、存储和保护你的个人信息。请在使用前仔细阅读并充分理解本政策的全部内容。
            </div>
            {P.map(([h, body]) => (
              <div key={h} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text-title)', marginBottom: 6 }}>{h}</div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)', lineHeight: 1.8 }}>{body}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    );
  }

  /* ===== 关于我们 ===== */
  function AboutPage({ onBack, onService }) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="关于我们" onBack={onBack} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--gap-page)', gap: 14 }}>
          <div style={{ width: 96, height: 96, borderRadius: 22, background: 'var(--white)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={logoMark} alt="数蚕 Lab Data" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          </div>
          <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text-title)' }}>数蚕 Lab Data v2.0.0</div>
          <div style={{ textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div>Copyright©2024-2026</div>
            <div>杭州数蚕科技有限公司 All rights reserved</div>
          </div>
        </div>
        <div style={{ padding: 'var(--gap-page)', paddingBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={onService} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--brand-action)' }}>服务协议</button>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary,#9aa3b2)' }}>浙ICP备18037361号-3</div>
        </div>
      </div>
    );
  }

  /* ===== 服务协议（mock 详情） ===== */
  function ServiceAgreementPage({ onBack }) {
    const sections = [
      ['一、协议范围', '本服务协议（以下简称“本协议”）由你（检测员用户）与杭州数蚕科技有限公司（以下简称“我们”）就数蚕 Lab Data 移动端应用的使用所订立。使用本应用即表示你已阅读并同意本协议。'],
      ['二、服务内容', '本应用为实验室检测业务提供任务查看、试验数据采集与上传、设备连接、消息通知等功能。具体功能以实际发布版本及你所属检测机构在 TestOS 底座中的配置为准。'],
      ['三、账号与安全', '你应使用机构分配的账号登录，并妥善保管密码。账号相关信息统一在数采系统 Web 端 的TestOS 底座维护，移动端不支持修改部门、手机号、邮箱等账号信息。'],
      ['四、数据与知识产权', '你在检测过程中产生的试验数据归你所属检测机构所有。本应用的界面、程序及相关知识产权归我们所有，未经授权不得复制或用于其他用途。'],
      ['五、免责声明', '因网络、设备故障或不可抗力导致的数据延迟、丢失，我们将在合理范围内协助排查，但不承担超出法律法规规定范围的责任。'],
      ['六、协议变更', '我们可能适时修订本协议，修订后将通过应用内通知或版本更新说明告知。若你继续使用本应用，即视为接受修订后的协议。'],
    ];
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="服务协议" onBack={onBack} />
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-page)' }}>
          <Card>
            <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text-title)', marginBottom: 6 }}>数蚕 Lab Data 服务协议</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginBottom: 14 }}>更新日期：2026-07-01 · 杭州数蚕科技有限公司</div>
            {sections.map(([h, body]) => (
              <div key={h} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text-title)', marginBottom: 6 }}>{h}</div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)', lineHeight: 1.8 }}>{body}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    );
  }

  /* ===== 修改密码 ===== */
  function PasswordPage({ onBack, onToast }) {
    const [oldPwd, setOldPwd] = React.useState('');
    const [newPwd, setNewPwd] = React.useState('');
    const [confirm, setConfirm] = React.useState('');
    const [show, setShow] = React.useState(false);
    const [err, setErr] = React.useState('');

    // 密码强度：长度 + 字符种类
    const strength = React.useMemo(() => {
      if (!newPwd) return 0;
      let s = 0;
      if (newPwd.length >= 8) s += 1;
      if (/[A-Z]/.test(newPwd) && /[a-z]/.test(newPwd)) s += 1;
      if (/\d/.test(newPwd)) s += 1;
      if (/[^A-Za-z0-9]/.test(newPwd)) s += 1;
      return Math.min(s, 3);
    }, [newPwd]);
    const strengthText = ['', '弱', '中', '强'][strength];
    const strengthColor = ['var(--border-default)', 'var(--danger,#e23b3b)', 'var(--status-pending-fg,#97640f)', 'var(--status-done-fg,#1b8a5a)'][strength];

    function submit() {
      if (!oldPwd || !newPwd || !confirm) { setErr('请填写完整的密码信息'); return; }
      if (newPwd.length < 8) { setErr('新密码长度不少于 8 位'); return; }
      if (newPwd === oldPwd) { setErr('新密码不能与原密码相同'); return; }
      if (newPwd !== confirm) { setErr('两次输入的新密码不一致'); return; }
      setErr('');
      onToast('密码修改成功（演示）');
      onBack();
    }

    const eye = (
      <button onClick={() => setShow((v) => !v)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 0 }}>
        {show
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68 M6.61 6.61A13.5 13.5 0 0 0 2 12s3 8 10 8a9.12 9.12 0 0 0 5.39-1.61 M2 2l20 20"/></svg>}
      </button>
    );

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="修改密码" onBack={onBack} />
        <AnnotatedWrapper id="changePassword" layout="block">
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>原密码</label>
            <Input value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} placeholder="请输入原密码" type={show ? 'text' : 'password'} suffix={eye} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>新密码</label>
            <Input value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="至少 8 位，建议含大小写与数字" type={show ? 'text' : 'password'} suffix={eye} />
            {newPwd && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                  {[1, 2, 3].map((n) => (
                    <span key={n} style={{ flex: 1, height: 4, borderRadius: 2, background: n <= strength ? strengthColor : 'var(--border-default)' }} />
                  ))}
                </div>
                <span style={{ fontSize: 'var(--fs-xs)', color: strengthColor, fontWeight: 600, minWidth: 16 }}>{strengthText}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>确认新密码</label>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="请再次输入新密码" type={show ? 'text' : 'password'} suffix={eye} />
          </div>

          {err && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)', color: 'var(--danger,#e23b3b)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4 M12 16h.01"/></svg>
              {err}
            </div>
          )}

          <Button block size="lg" onClick={submit} style={{ marginTop: 4 }}>确认修改</Button>
        </div>
        </AnnotatedWrapper>
      </div>
    );
  }

  /* ===== 帮助与反馈 ===== */
  function HelpPage({ onBack, onToast }) {
    const [openIdx, setOpenIdx] = React.useState(null);
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <AppBar title="帮助与反馈" onBack={onBack} />
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--gap-page)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <SectionTitle style={{ marginBottom: 10 }}>常见问题</SectionTitle>
            <Card padding="0">
              {M.faqs.map((f, i) => {
                const on = openIdx === i;
                return (
                  <div key={i} style={{ borderBottom: i === M.faqs.length - 1 ? 'none' : '1px solid var(--divider)' }}>
                    <button onClick={() => setOpenIdx(on ? null : i)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '14px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ flex: 1, fontSize: 'var(--fs-base)', color: 'var(--text-title)', fontWeight: 500 }}>{f.q}</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-placeholder)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', transform: on ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-base)' }}><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    {on && <div style={{ padding: '0 16px 14px', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.a}</div>}
                  </div>
                );
              })}
            </Card>
          </div>

          <Card padding="0">
            <AnnotatedWrapper id="feedbackEmail" layout="block">
              <Row icon="edit" label="意见反馈" note="feedback@labdata.cn" static />
            </AnnotatedWrapper>
            <Row icon="phone" label="联系客服" note="400-800-1234" onClick={() => onToast('客服电话 400-800-1234（占位）')} last />
          </Card>
        </div>
      </div>
    );
  }

  /* ===== 通用小组件 ===== */
  /** 用户角色标签（展示于头像区账号旁） */
  function RoleTag({ label }) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 'var(--radius-pill)',
        background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.35)',
        fontSize: 11, fontWeight: 600, color: '#fff', lineHeight: 1.4,
      }}>{label}</span>
    );
  }

  function ActionSheet({ title, actions, onClose }) {
    return (
      <React.Fragment>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(15,23,42,0.28)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 90, background: 'var(--white)', borderRadius: '18px 18px 0 0', boxShadow: '0 -14px 34px rgba(15,23,42,0.20)', overflow: 'hidden' }}>
          <div style={{ width: 44, height: 4, borderRadius: 'var(--radius-pill)', background: 'var(--border-strong,#cfd6e2)', margin: '10px auto 6px' }} />
          {title && <div style={{ textAlign: 'center', padding: '6px 16px 10px', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--divider)' }}>{title}</div>}
          {actions.map((a) => (
            <button key={a.label} onClick={a.onClick} style={{ display: 'block', width: '100%', padding: '15px 16px', border: 'none', borderBottom: '1px solid var(--divider)', background: 'transparent', cursor: 'pointer', fontSize: 'var(--fs-base)', color: 'var(--text-title)' }}>{a.label}</button>
          ))}
          <button onClick={onClose} style={{ display: 'block', width: '100%', padding: '15px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 'var(--fs-base)', color: 'var(--text-secondary)', fontWeight: 600 }}>取消</button>
        </div>
      </React.Fragment>
    );
  }

  function ToggleRow({ label, on, onChange, disabled, last }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 16px', borderBottom: last ? 'none' : '1px solid var(--divider)', opacity: disabled ? 0.5 : 1 }}>
        <span style={{ fontSize: 'var(--fs-base)', color: 'var(--text-title)' }}>{label}</span>
        <button onClick={() => !disabled && onChange(!on)} disabled={disabled} style={{
          width: 46, height: 26, flex: 'none', borderRadius: 13, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
          background: on ? 'var(--brand-action)' : 'var(--border-strong,#cfd6e2)', position: 'relative', transition: 'background var(--dur-base)',
        }}>
          <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left var(--dur-base)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
      </div>
    );
  }

  function FieldRow({ label, value, last }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', borderBottom: last ? 'none' : '1px solid var(--divider)' }}>
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', flex: 'none' }}>{label}</span>
        <span style={{ fontSize: 'var(--fs-base)', color: 'var(--text-title)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
      </div>
    );
  }

  function Row({ icon, label, note, badge, danger, onClick, last, static: isStatic }) {
    const paths = {
      key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
      bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0',
      help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01',
      logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
      shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      trash: 'M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
      info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01',
      refresh: 'M3 12a9 9 0 0 1 15-6.7L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-15 6.7L3 16 M3 21v-5h5',
      edit: 'M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z',
      phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
      settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    };
    const color = danger ? 'var(--danger)' : 'var(--text-body)';
    const Tag = isStatic ? 'div' : 'button';
    return (
      <Tag onClick={isStatic ? undefined : onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '15px 16px', border: 'none', borderBottom: last ? 'none' : '1px solid var(--divider)', background: 'transparent', cursor: isStatic ? 'default' : 'pointer', textAlign: 'left' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={paths[icon]} /></svg>
        <span style={{ flex: 1, fontSize: 'var(--fs-base)', color }}>{label}</span>
        {note && <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', flex: 'none' }}>{note}</span>}
        {badge > 0 && (
          <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: 'var(--danger,#e23b3b)', color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: '18px', textAlign: 'center', flex: 'none' }}>{badge}</span>
        )}
        {!isStatic && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-placeholder)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>}
      </Tag>
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
