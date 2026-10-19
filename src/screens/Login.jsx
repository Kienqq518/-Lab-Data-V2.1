import React from 'react';
import logoMark from '../../assets/logo-mark.png';
import { Button, Input } from '../design-system.js';
import { IpConfig } from './IpConfig.jsx';
import { AnnotatedWrapper, AnnotationPageKeyProvider } from '../annotation/index.js';

/* 登录页 — 欢迎来访 / WELCOME / 账号密码 / 登录
   双击「欢迎来访」进入独立 IP 配置页（隐蔽入口，设置页不再提供）。 */

function Login({ onLogin }) {
  const [acct, setAcct] = React.useState('lq');
  const [pwd, setPwd] = React.useState('123456');
  const [showPwd, setShowPwd] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [view, setView] = React.useState('login');
  const summaryRef = React.useRef(null);

  function submit(event) {
    event.preventDefault();
    const next = {};
    if (!acct.trim()) next.acct = '请输入账号';
    if (!pwd) next.pwd = '请输入密码';
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    onLogin?.();
  }

  function focusField(id) {
    document.getElementById(id)?.focus();
  }

  if (view === 'ip') {
    return (
      <AnnotationPageKeyProvider pageKey="login-ip">
        <IpConfig onBack={() => setView('login')} />
      </AnnotationPageKeyProvider>
    );
  }

  const errorItems = [
    errors.acct ? { id: 'login-acct', text: errors.acct } : null,
    errors.pwd ? { id: 'login-pwd', text: errors.pwd } : null,
  ].filter(Boolean);

  return (
    <div style={{ height: '100%', background: 'var(--white)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', padding: '56px 40px 40px', background: 'var(--blue-700)', color: '#fff', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', right: 40, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <img src={logoMark} alt="" style={{ width: 44, height: 44, filter: 'brightness(0) invert(1)' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0, lineHeight: 1.2 }}>Lab Data</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>TestOS</div>
          </div>
        </div>
        <AnnotatedWrapper id="welcomeTap" layout="inline">
          <div
            role="button"
            tabIndex={0}
            onDoubleClick={() => setView('ip')}
            onKeyDown={(e) => { if (e.key === 'Enter') setView('ip'); }}
            style={{ fontSize: 26, fontWeight: 600, marginBottom: 6, cursor: 'default', userSelect: 'none', display: 'inline-block' }}
          >
            欢迎来访
          </div>
        </AnnotatedWrapper>
        <div style={{ fontSize: 13, letterSpacing: '0.28em', opacity: 0.85, marginBottom: 10 }}>WELCOME</div>
        <div style={{ fontSize: 19, fontWeight: 500 }}>实验室数智化系统</div>
      </div>

      <form onSubmit={submit} noValidate style={{ flex: 1, padding: '36px 40px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {errorItems.length > 0 && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            aria-labelledby="login-error-title"
            style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--status-overdue-bg, #fdecec)', color: 'var(--danger)' }}
          >
            <div id="login-error-title" style={{ fontSize: 'var(--fs-sm)', fontWeight: 650, marginBottom: 6 }}>请先补全登录信息</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              {errorItems.map((item) => (
                <button key={item.id} type="button" onClick={() => focusField(item.id)} style={{ border: 'none', background: 'transparent', padding: 0, color: 'inherit', font: 'inherit', fontSize: 'var(--fs-sm)', cursor: 'pointer', textDecoration: 'underline' }}>
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        )}

        <Field label="账号" htmlFor="login-acct">
          <Input
            id="login-acct"
            name="username"
            autoComplete="username"
            value={acct}
            invalid={!!errors.acct}
            aria-invalid={errors.acct ? 'true' : undefined}
            aria-describedby={errors.acct ? 'login-acct-error' : undefined}
            onChange={(e) => { setAcct(e.target.value); if (errors.acct) setErrors((prev) => ({ ...prev, acct: undefined })); }}
            placeholder="请输入账号"
            size="lg"
            prefix={<Ico d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />}
          />
          {errors.acct && <FieldError id="login-acct-error">{errors.acct}</FieldError>}
        </Field>

        <Field label="密码" htmlFor="login-pwd">
          <Input
            id="login-pwd"
            name="password"
            autoComplete="current-password"
            type={showPwd ? 'text' : 'password'}
            value={pwd}
            invalid={!!errors.pwd}
            aria-invalid={errors.pwd ? 'true' : undefined}
            aria-describedby={errors.pwd ? 'login-pwd-error' : undefined}
            onChange={(e) => { setPwd(e.target.value); if (errors.pwd) setErrors((prev) => ({ ...prev, pwd: undefined })); }}
            placeholder="请输入密码"
            size="lg"
            prefix={<Ico d="M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4" />}
            suffix={(
              <button
                type="button"
                aria-label={showPwd ? '隐藏密码' : '显示密码'}
                aria-pressed={showPwd}
                onClick={() => setShowPwd((on) => !on)}
                style={{ width: 44, height: 44, marginRight: -8, border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ico d={showPwd
                  ? 'M3 3l18 18 M10.6 10.6a2 2 0 0 0 2.8 2.8 M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 9.3 3.1 11 7a11.8 11.8 0 0 1-4.1 5.1 M6.1 6.1A11.8 11.8 0 0 0 1 12c1.7 3.9 6 7 11 7 1.6 0 3.1-.3 4.5-.9'
                  : 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'} />
              </button>
            )}
          />
          {errors.pwd && <FieldError id="login-pwd-error">{errors.pwd}</FieldError>}
        </Field>

        <Button block size="lg" type="submit" style={{ marginTop: 6 }}>登录</Button>
        <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--text-body)', paddingTop: 16 }}>
          杭州数蚕智能科技有限公司 · V2.0
        </div>
      </form>
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

function FieldError({ id, children }) {
  return (
    <div id={id} style={{ marginTop: 6, fontSize: 'var(--fs-sm)', color: 'var(--danger)', lineHeight: 1.4 }}>{children}</div>
  );
}

function Ico({ d }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export { Login };
