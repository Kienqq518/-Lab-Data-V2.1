import { createRoot } from 'react-dom/client';

const root = document.getElementById('root');
const path = window.location.pathname.replace(/\/+$/, '') || '/';
const isWebAdmin = path === '/web' || path.startsWith('/web/');

if (isWebAdmin) {
  const [{ default: SafetyAdmin }] = await Promise.all([
    import('./web/SafetyAdmin.jsx'),
    import('./web/safety-admin.css'),
  ]);
  createRoot(root).render(<SafetyAdmin />);
} else {
  await Promise.all([
    import('../styles.css'),
    import('./styles/app.css'),
    import('./annotation/annotation.css'),
  ]);
  const { default: App } = await import('./App.jsx');
  createRoot(root).render(<App />);
}
