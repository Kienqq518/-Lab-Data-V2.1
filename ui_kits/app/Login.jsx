/* 登录页 — 沿用旧 app：欢迎来访 / WELCOME / 账号密码 / 登录 */
(function () {
  const { Button, Input } = window.DesignSystem_52fd11;

  function Login({ onLogin }) {
    const [acct, setAcct] = React.useState('admin');
    const [pwd, setPwd] = React.useState('······');
    return (
      <div style={{ height: '100%', background: 'var(--white)', display: 'flex', flexDirection: 'column' }}>
        {/* 顶部品牌区 */}
        <div style={{ position: 'relative', padding: '72px 40px 48px', background: 'var(--blue-700)', color: '#fff', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', right: 40, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
            <img src="../../assets/logo-mark.png" alt="" style={{ width: 44, height: 44, filter: 'brightness(0) invert(1)' }} />
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>Lab Data</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, marginBottom: 6 }}>欢迎来访</div>
          <div style={{ fontSize: 13, letterSpacing: '0.28em', opacity: 0.85, marginBottom: 14 }}>WELCOME</div>
          <div style={{ fontSize: 19, fontWeight: 500 }}>实验室数智化系统</div>
        </div>
        {/* 表单 */}
        <div style={{ flex: 1, padding: '40px 40px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Field label="账号"><Input value={acct} onChange={(e) => setAcct(e.target.value)} placeholder="请输入账号" size="lg"
            prefix={<Ico d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 7 a4 4 0 1 0 0 0" />} /></Field>
          <Field label="密码"><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="请输入密码" size="lg"
            prefix={<Ico d="M5 11 h14 v10 H5 z M8 11 V7 a4 4 0 0 1 8 0 v4" />} /></Field>
          <Button block size="lg" style={{ marginTop: 10 }} onClick={onLogin}>登录</Button>
          <div style={{ textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>
            杭州数蚕智能科技有限公司 · V2.0
          </div>
        </div>
      </div>
    );
  }
  function Field({ label, children }) {
    return (
      <div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</div>
        {children}
      </div>
    );
  }
  function Ico({ d }) {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
  }
  window.Login = Login;
})();
