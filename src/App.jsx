import React from 'react';
import { BottomTabBar } from './design-system.js';
import { MOCK } from './mock.js';
import { Collect } from './screens/Collect.jsx';
import { DoneTasks } from './screens/DoneTasks.jsx';
import { Home } from './screens/Home.jsx';
import { Inspect } from './screens/Inspect.jsx';
import { Login } from './screens/Login.jsx';
import { Mine } from './screens/Mine.jsx';

function StatusBar({ onBrand }) {
  return (
    <div className={`statusbar${onBrand ? ' onbrand' : ''}`}>
      <span>12:00</span>
      <span className="statusbar-icons">
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
          <rect x="0" y="7" width="3" height="5" rx="1" />
          <rect x="4.5" y="4.5" width="3" height="7.5" rx="1" />
          <rect x="9" y="2" width="3" height="10" rx="1" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <path d="M8 11.5 0.7 4.2a10.3 10.3 0 0 1 14.6 0L8 11.5z" opacity="0.95" />
        </svg>
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none" stroke="currentColor">
          <rect x="0.5" y="0.5" width="22" height="12" rx="3" />
          <rect x="2" y="2" width="17" height="9" rx="1.5" fill="currentColor" stroke="none" />
          <rect x="23.5" y="4" width="2" height="5" rx="1" fill="currentColor" stroke="none" />
        </svg>
      </span>
    </div>
  );
}

function StationSheet({ stationId, onSelect, onClear, onClose }) {
  return (
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title-row">
          <span className="sheet-title">选择工位</span>
          <button className="sheet-clear" onClick={onClear}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            清除选择
          </button>
        </div>
        {MOCK.stations.map((station) => {
          const active = station.id === stationId;
          return (
            <button
              key={station.id}
              className={`station-option${active ? ' active' : ''}`}
              onClick={() => onSelect(station.id)}
            >
              <span className="station-option-name">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--brand-action)' : 'var(--text-secondary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{station.name}</span>
              </span>
              <span className="station-option-meta">{station.deviceCount} 台设备</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function useStageScale() {
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const fit = () => {
      setScale(Math.min(window.innerWidth / 800, window.innerHeight / 1280));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return scale;
}

function App() {
  const scale = useStageScale();
  const [authed, setAuthed] = React.useState(false);
  const [tab, setTab] = React.useState('home');
  const [overlay, setOverlay] = React.useState(null);
  const [stationId, setStationId] = React.useState('zy');
  const [ctx, setCtx] = React.useState(null);
  const [sheet, setSheet] = React.useState(false);

  let body;
  if (!authed) {
    body = <Login onLogin={() => { setAuthed(true); setTab('home'); }} />;
  } else {
    body = (
      <div className="app-shell">
        <div className="screen-body fade" key={tab}>
          {tab === 'home' && (
            <Home
              onEnterInspect={() => setTab('inspect')}
              onQuick={(kind) => { if (kind === 'done') setOverlay('done'); else setTab('inspect'); }}
            />
          )}
          {tab === 'inspect' && (
            <Inspect
              stationId={stationId}
              onSwitchStation={() => setSheet(true)}
              onClearStation={() => setStationId('')}
              onCollect={(collectCtx) => { setCtx(collectCtx); setOverlay('collect'); }}
            />
          )}
          {tab === 'me' && <Mine onLogout={() => setAuthed(false)} />}
        </div>
        <BottomTabBar
          active={tab}
          onChange={setTab}
          items={[
            { key: 'home', label: '首页', icon: 'home' },
            { key: 'inspect', label: '检测', icon: 'clipboard' },
            { key: 'me', label: '我的', icon: 'user' },
          ]}
        />
      </div>
    );
  }

  return (
    <main className="app-viewport">
      <div className="ds-stage" style={{ transform: `scale(${scale})` }}>
        <div className="ds-frame">
          <StatusBar onBrand={!authed} />
          <div className="screen">
            <div className="app-layer fade" key={(authed ? 'a' : 'l') + tab}>{body}</div>
            {authed && overlay === 'collect' && (
              <div className="overlay-screen">
                <Collect
                  ctx={ctx}
                  onBack={() => setOverlay(ctx?.reviewMode ? 'done' : null)}
                  onDone={() => setOverlay(ctx?.reviewMode ? 'done' : null)}
                />
              </div>
            )}
            {authed && overlay === 'done' && (
              <div className="overlay-screen">
                <DoneTasks
                  onBack={() => setOverlay(null)}
                  onCollect={(collectCtx) => { setCtx(collectCtx); setOverlay('collect'); }}
                />
              </div>
            )}
            {sheet && (
              <StationSheet
                stationId={stationId}
                onSelect={(id) => { setStationId(id); setSheet(false); }}
                onClear={() => { setStationId(''); setSheet(false); }}
                onClose={() => setSheet(false)}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
