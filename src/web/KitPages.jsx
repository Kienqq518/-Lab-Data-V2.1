import React, { useEffect, useMemo, useState } from 'react';
import {
  CODE_PREVIEW_SAMPLES,
  INITIAL_DEVICES,
  INITIAL_RELATIONS,
  INITIAL_RULES,
  METHODS,
  REL_ITEMS,
  REL_TABLES,
  RULE_STATUS,
  RULE_TESTS,
  convertCode,
  methodMeta,
  tableLabel,
} from './kit-data.js';

function PageHead({ title, children }) {
  return (
    <div className="lk-head">
      <h1 className="lk-title"><span className="lk-title-bar" />{title}</h1>
      <div className="lk-head-actions">{children}</div>
    </div>
  );
}

function Switch({ on, onClick, disabled, wide }) {
  return (
    <button type="button" className="lk-switch" disabled={disabled} onClick={onClick} aria-pressed={!!on}>
      <span className={`lk-switch-track${on ? ' is-on' : ''}${wide ? ' is-wide' : ''}${disabled ? ' is-disabled' : ''}`}>
        <span className="lk-switch-knob" style={{ left: on ? (wide ? 23 : 19) : (wide ? 3 : 2) }} />
      </span>
    </button>
  );
}

function Pager({ total }) {
  const pages = Math.max(1, Math.ceil(total / 10));
  const shown = Math.min(pages, 4);
  return (
    <div className="lk-pager">
      <span>共 {total} 条</span>
      <span className="lk-pager-size">10条/页 ▾</span>
      <span className="lk-pager-btn is-muted">‹</span>
      {Array.from({ length: shown }, (_, index) => (
        <span key={index} className={`lk-pager-btn${index === 0 ? ' is-active' : ''}`}>{index + 1}</span>
      ))}
      {pages > shown && <span className="lk-pager-btn">{pages}</span>}
      <span className="lk-pager-btn is-muted">›</span>
    </div>
  );
}

function Badge({ meta }) {
  return (
    <span className="lk-badge" style={{ background: meta.bg, color: meta.fg }}>
      <i style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

const LIMS_DIRECT_KEY = 'labdata_lims_direct';
const LIMS_ADDRESS_KEY = 'labdata_lims_address';
const LIMS_MODE_EVENT = 'labdata-lims-mode';
export const DEFAULT_LIMS_ADDRESS = 'http://test.lims.shucantech.cn/prod-api';
export const LIMS_ADDRESS_OPTIONS = [
  DEFAULT_LIMS_ADDRESS,
  'http://127.0.0.1:28086',
];

export function readLimsMode() {
  let direct = true;
  let address = DEFAULT_LIMS_ADDRESS;
  try {
    const storedDirect = localStorage.getItem(LIMS_DIRECT_KEY);
    const storedAddress = localStorage.getItem(LIMS_ADDRESS_KEY);
    if (storedDirect !== null) direct = storedDirect === '1';
    if (storedAddress !== null) address = storedAddress;
  } catch { /* ignore */ }
  return { direct, address, active: direct && address.trim().length > 0 };
}

export function writeLimsMode({ direct, address }) {
  try {
    localStorage.setItem(LIMS_DIRECT_KEY, direct ? '1' : '0');
    localStorage.setItem(LIMS_ADDRESS_KEY, address);
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(LIMS_MODE_EVENT));
}

function useLimsMode() {
  const [mode, setMode] = useState(readLimsMode);
  useEffect(() => {
    const sync = () => setMode(readLimsMode());
    window.addEventListener(LIMS_MODE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(LIMS_MODE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return mode;
}

function emptyDevice() {
  return { index: null, name: '', model: '', code: '', area: '', dept: '', method: 'direct', external: false, error: '' };
}

export function DevicePage() {
  const [rows, setRows] = useState(INITIAL_DEVICES);
  const lims = useLimsMode();
  const direct = lims.active;
  const [draft, setDraft] = useState({ code: '', name: '', method: '' });
  const [query, setQuery] = useState({ code: '', name: '', method: '' });
  const [drawer, setDrawer] = useState(null);
  const [notice, setNotice] = useState('');

  const filtered = rows.filter((row) => {
    if (query.code && !row.code.toLowerCase().includes(query.code.trim().toLowerCase())) return false;
    if (query.name && !row.name.includes(query.name.trim())) return false;
    if (query.method && row.method !== query.method) return false;
    return true;
  });

  useEffect(() => {
    if (!direct) return;
    setDrawer((current) => (current?.index == null ? null : current));
  }, [direct]);

  const openEdit = (index) => {
    const row = rows[index];
    setDrawer({
      index,
      name: row.name,
      model: row.model,
      code: row.code,
      area: row.area,
      dept: row.dept,
      method: row.method,
      external: !!row.external,
      error: '',
    });
  };

  const saveDrawer = () => {
    if (!drawer) return;
    const external = drawer.method === 'serial' ? !!drawer.external : false;
    if (direct) {
      if (drawer.index == null) {
        setDrawer(null);
        return;
      }
      const previous = rows[drawer.index];
      const changed = previous.method !== drawer.method || !!previous.external !== external;
      setRows((current) => current.map((row, index) => (index === drawer.index
        ? { ...row, method: drawer.method, external }
        : row)));
      setDrawer(null);
      setNotice(changed ? `「${previous.name}」的采集方式已与 LIMS 双向同步` : '采集方式未变更，未向 LIMS 同步');
      window.setTimeout(() => setNotice(''), 4000);
      return;
    }
    const name = drawer.name.trim();
    const model = drawer.model.trim();
    const code = drawer.code.trim();
    const area = drawer.area.trim();
    const dept = drawer.dept.trim();
    if (!name || !code) {
      setDrawer({ ...drawer, error: '请填写设备名称和设备编号' });
      return;
    }
    if (rows.some((row, index) => row.code === code && index !== drawer.index)) {
      setDrawer({ ...drawer, error: '设备编号已存在' });
      return;
    }
    const next = { name, model, code, area, dept, method: drawer.method, external, on: drawer.index == null ? true : rows[drawer.index].on };
    setRows((current) => (
      drawer.index == null
        ? [...current, next]
        : current.map((row, index) => (index === drawer.index ? { ...row, ...next } : row))
    ));
    setDrawer(null);
  };

  const editing = drawer?.index != null ? rows[drawer.index] : null;
  const identity = (field) => (direct ? (editing?.[field] || '—') : (drawer?.[field] ?? ''));
  const setIdentity = (field) => (value) => setDrawer((current) => (current ? { ...current, [field]: value, error: '' } : current));

  return (
    <div className="lk-page" data-annotation-page="web-devices">
      <div className={`lk-banner${direct ? ' lk-banner-warn' : ''}`} data-annotation-id="directMode">
        {direct
          ? '当前为数蚕 LIMS 直连（来源：系统设置 → 系统参数）。设备基本信息请在 LIMS 修改。本页不可新增、导入或启停；采集方式可改，并与 LIMS 双向同步。'
          : '当前未直连（系统参数未开启直连，或未选择数蚕 LIMS 地址）。设备信息和采集方式在本页维护，不同步 LIMS。'}
      </div>
      {notice && <div className="lk-banner">{notice}</div>}
      <PageHead title="设备管理">
        <button type="button" className="lk-btn lk-btn-primary" disabled={direct} onClick={() => { if (!direct) setDrawer(emptyDevice()); }}>+ 新增</button>
        <button type="button" className="lk-btn lk-btn-navy" disabled={direct}>导入</button>
      </PageHead>
      <div className="lk-filters">
        <label>设备编号<input value={draft.code} placeholder="请输入" onChange={(event) => setDraft({ ...draft, code: event.target.value })} /></label>
        <label>设备名称<input value={draft.name} placeholder="请输入" onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
        <label>采集方式
          <select value={draft.method} onChange={(event) => setDraft({ ...draft, method: event.target.value })}>
            <option value="">请选择</option>
            {Object.entries(METHODS).map(([key, method]) => <option key={key} value={key}>{method.label}</option>)}
          </select>
        </label>
        <div className="lk-filter-actions">
          <button type="button" className="lk-btn" onClick={() => { const empty = { code: '', name: '', method: '' }; setDraft(empty); setQuery(empty); }}>重置</button>
          <button type="button" className="lk-btn lk-btn-primary" onClick={() => setQuery(draft)}>查询</button>
        </div>
      </div>
      <div className="lk-table">
        <div className="lk-tr lk-th">
          <span className="w-no">序号</span><span className="w-code">设备编号</span><span className="w-grow">设备名称</span>
          <span className="w-model">型号</span><span className="w-dept">所属部门</span><span className="w-area">所在区域（工位）</span>
          <span className="w-method">采集方式</span><span className="w-switch" data-annotation-id="deviceEnable">启用状态</span><span className="w-op" data-annotation-id="deviceEdit">操作</span>
        </div>
        {filtered.map((row, index) => {
          const sourceIndex = rows.indexOf(row);
          return (
            <div className="lk-tr" key={row.code}>
              <span className="w-no is-muted">{index + 1}</span>
              <span className="w-code">{row.code}</span>
              <span className="w-grow">{row.name}</span>
              <span className="w-model">{row.model}</span>
              <span className="w-dept">{row.dept}</span>
              <span className="w-area">{row.area}</span>
              <span className="w-method"><Badge meta={methodMeta(row)} /></span>
              <span className="w-switch">
                <Switch
                  on={row.on}
                  disabled={direct}
                  onClick={() => {
                    if (direct) return;
                    setRows((current) => current.map((item, itemIndex) => (itemIndex === sourceIndex ? { ...item, on: !item.on } : item)));
                  }}
                />
              </span>
              <span className="w-op"><button type="button" className="lk-link" onClick={() => openEdit(sourceIndex)}>编辑</button></span>
            </div>
          );
        })}
        <Pager total={filtered.length} />
      </div>
      {drawer && (
        <div className="lk-mask" onMouseDown={() => setDrawer(null)}>
          <aside className="lk-drawer" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lk-drawer-hd">
              <b>{editing ? '编辑设备' : '新增设备'}</b>
              <button type="button" onClick={() => setDrawer(null)}>×</button>
            </div>
            <div className="lk-drawer-bd">
              <label className={direct ? 'is-locked' : ''} data-annotation-id="lockedIdentity">
                设备名称
                {direct ? <div className="lk-readonly">{identity('name')}</div> : <input value={identity('name')} onChange={(event) => setIdentity('name')(event.target.value)} />}
              </label>
              <label className={direct ? 'is-locked' : ''}>
                设备型号
                {direct ? <div className="lk-readonly">{identity('model')}</div> : <input value={identity('model')} onChange={(event) => setIdentity('model')(event.target.value)} />}
              </label>
              <div className="lk-split">
                <label className={direct ? 'is-locked' : ''}>
                  设备编号
                  {direct ? <div className="lk-readonly">{identity('code')}</div> : <input value={identity('code')} onChange={(event) => setIdentity('code')(event.target.value)} />}
                </label>
                <label className={direct ? 'is-locked' : ''}>
                  所在区域（工位）
                  {direct ? <div className="lk-readonly">{identity('area')}</div> : <input value={identity('area')} onChange={(event) => setIdentity('area')(event.target.value)} />}
                </label>
              </div>
              <label className={direct ? 'is-locked' : ''}>
                所属部门
                {direct ? <div className="lk-readonly">{identity('dept')}</div> : <input value={identity('dept')} onChange={(event) => setIdentity('dept')(event.target.value)} />}
              </label>
              {drawer.error && <div className="lk-error">{drawer.error}</div>}
              <div className="lk-label" data-annotation-id="deviceEdit">采集方式 <span>{direct ? '两边都可改，并与 LIMS 双向同步' : '可直接修改，不同步 LIMS'}</span></div>
              {Object.entries(METHODS).map(([key, method]) => (
                <button type="button" key={key} className={`lk-method${drawer.method === key ? ' is-on' : ''}`} onClick={() => setDrawer({ ...drawer, method: key })}>
                  <i className={drawer.method === key ? 'is-on' : ''} />
                  <span>
                    <strong>{method.label}</strong>
                    <Badge meta={{ label: method.tag, bg: method.bg, fg: method.fg, dot: method.dot }} />
                    <em>{method.desc}</em>
                  </span>
                </button>
              ))}
              {drawer.method === 'serial' && (
                <div className="lk-ext">
                  <Switch wide on={drawer.external} onClick={() => setDrawer({ ...drawer, external: !drawer.external })} />
                  <div>
                    <b>外部程序采集（电子天平类）</b>
                    <p>受串口/通讯协议限制，由工业平板上的采集程序与设备通讯并写库。开启后 App 该设备不显示采集按钮，仅保留手工录入与查看已采数据。</p>
                  </div>
                </div>
              )}
              <div className="lk-note">手工录入对前三种方式均为通用兜底（直采/识别失败时回退）；「图像采集」下 App 是否显示「拍照/上传图片」，还取决于该试验项在数据识别规则中的「验证状态 = 已通过」。</div>
            </div>
            <div className="lk-drawer-ft">
              <button type="button" className="lk-btn" onClick={() => setDrawer(null)}>取消</button>
              <button type="button" className="lk-btn lk-btn-primary" onClick={saveDrawer}>确定</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export function RulesPage() {
  const [rows, setRows] = useState(INITIAL_RULES);
  const [draft, setDraft] = useState({ scenario: '', status: '' });
  const [query, setQuery] = useState({ scenario: '', status: '' });
  const [modal, setModal] = useState(null);

  const filtered = rows.filter((row) => {
    if (query.scenario && !(row.scenario || '').includes(query.scenario.trim())) return false;
    if (query.status && row.status !== query.status) return false;
    return true;
  });

  const deviceOptions = useMemo(() => {
    const test = RULE_TESTS.find((item) => item.code === modal?.table);
    return test ? test.devices.map((device) => ({ value: `${device[0]}|${device[1]}`, label: `${device[0]}（${device[1]}）` })) : [];
  }, [modal?.table]);

  const save = () => {
    const scenario = modal.scenario.trim();
    if (!modal.table || !modal.device || !scenario) {
      setModal({ ...modal, error: '「试验表名」「设备」与「场景」均为必填项' });
      return;
    }
    const duplicated = rows.findIndex((row, index) => row.table === modal.table && row.device === modal.device && row.scenario === scenario && index !== modal.index);
    if (duplicated !== -1) {
      setModal({ ...modal, error: '该「试验表 + 设备 + 场景」已存在识别规则，不可重复创建（请改为编辑）' });
      return;
    }
    const rule = modal.rule.trim() || '（未配置）';
    setRows((current) => {
      if (modal.index == null) return [...current, { table: modal.table, device: modal.device, scenario, rule, status: 'pending' }];
      return current.map((row, index) => (index === modal.index ? { ...row, table: modal.table, device: modal.device, scenario, rule } : row));
    });
    setModal(null);
  };

  return (
    <div className="lk-page">
      <PageHead title="数据识别规则">
        <button type="button" className="lk-btn lk-btn-primary" onClick={() => setModal({ index: null, table: '', device: '', scenario: '', rule: '', error: '' })}>+ 新增</button>
      </PageHead>
      <div className="lk-banner">一条规则 = 一个试验表 + 一个设备（型号·名称）+ 一个场景。同一设备可配置多个场景，每场景仅一条识别规则；LIMS 页所选设备型号与名称一致即可命中。</div>
      <div className="lk-filters">
        <label>场景<input value={draft.scenario} placeholder="请输入" onChange={(event) => setDraft({ ...draft, scenario: event.target.value })} /></label>
        <label>验证状态
          <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
            <option value="">请选择</option>
            {Object.entries(RULE_STATUS).map(([key, status]) => <option key={key} value={key}>{status.label}</option>)}
          </select>
        </label>
        <div className="lk-filter-actions">
          <button type="button" className="lk-btn" onClick={() => { const empty = { scenario: '', status: '' }; setDraft(empty); setQuery(empty); }}>重置</button>
          <button type="button" className="lk-btn lk-btn-primary" onClick={() => setQuery(draft)}>查询</button>
        </div>
      </div>
      <div className="lk-table">
        <div className="lk-tr lk-th">
          <span className="w-no">序号</span><span className="w-table">试验表名</span><span className="w-device">设备（型号·名称）</span>
          <span className="w-scene">场景</span><span className="w-grow">数据识别规则</span><span className="w-status">验证状态</span><span className="w-ops">操作</span>
        </div>
        {filtered.map((row) => {
          const index = rows.indexOf(row);
          const [name, model] = row.device.split('|');
          const status = RULE_STATUS[row.status] || RULE_STATUS.pending;
          return (
            <div className="lk-tr" key={`${row.table}-${row.device}-${row.scenario}`}>
              <span className="w-no is-muted">{filtered.indexOf(row) + 1}</span>
              <span className="w-table">{tableLabel(row.table)}</span>
              <span className="w-device"><b>{name}</b><small>{model}</small></span>
              <span className="w-scene">{row.scenario}</span>
              <span className="w-grow lk-mono">{row.rule}</span>
              <span className="w-status"><Badge meta={{ label: status.label, bg: status.bg, fg: status.fg, dot: status.dot }} /></span>
              <span className="w-ops">
                <button type="button" className="lk-link" onClick={() => setModal({ index, table: row.table, device: row.device, scenario: row.scenario, rule: row.rule, error: '' })}>编辑</button>
                <button type="button" className="lk-link is-danger" onClick={() => setRows((current) => current.filter((_, itemIndex) => itemIndex !== index))}>删除</button>
              </span>
            </div>
          );
        })}
        <Pager total={filtered.length} />
      </div>
      {modal && (
        <div className="lk-mask is-center" onMouseDown={() => setModal(null)}>
          <div className="lk-dialog" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lk-drawer-hd"><b>{modal.index == null ? '新增数据识别规则' : '编辑数据识别规则'}</b><button type="button" onClick={() => setModal(null)}>×</button></div>
            <div className="lk-dialog-bd">
              <div className="lk-form-line"><span>规则来源</span><div className="lk-readonly">手动配置</div></div>
              <div className="lk-form-grid">
                <label>试验表名
                  <select value={modal.table} onChange={(event) => setModal({ ...modal, table: event.target.value, device: '', error: '' })}>
                    <option value="">请选择试验表</option>
                    {RULE_TESTS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
                  </select>
                </label>
                <label>设备（型号·名称）
                  <select value={modal.device} disabled={!modal.table} onChange={(event) => setModal({ ...modal, device: event.target.value, error: '' })}>
                    <option value="">{modal.table ? '请选择设备' : '请先选择试验表'}</option>
                    {deviceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label>场景<input value={modal.scenario} placeholder="如：屏幕界面" onChange={(event) => setModal({ ...modal, scenario: event.target.value, error: '' })} /></label>
              </div>
              <label className="lk-block">数据识别规则
                <button type="button" className="lk-link" onClick={() => setModal({ ...modal, rule: modal.rule.split(',').map((item) => item.trim()).filter(Boolean).join(',\n') })}>格式化</button>
                <textarea value={modal.rule} placeholder="多个字段以逗号分隔" onChange={(event) => setModal({ ...modal, rule: event.target.value })} />
              </label>
              {modal.error && <div className="lk-error">{modal.error}</div>}
            </div>
            <div className="lk-drawer-ft">
              <button type="button" className="lk-btn" onClick={() => setModal(null)}>取消</button>
              <button type="button" className="lk-btn lk-btn-primary" onClick={save}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function RelationsPage() {
  const [rows, setRows] = useState(INITIAL_RELATIONS);
  const [draft, setDraft] = useState({ item: '', table: '' });
  const [query, setQuery] = useState({ item: '', table: '' });
  const [modal, setModal] = useState(null);
  const [synced, setSynced] = useState('');

  const filtered = rows.filter((row) => {
    if (query.item && !row.item.includes(query.item.trim())) return false;
    if (query.table && !row.table.includes(query.table.trim())) return false;
    return true;
  });

  const save = () => {
    if (!modal.item || !modal.table) {
      setModal({ ...modal, error: '「试验项」与「采集表」均为必填项' });
      return;
    }
    setRows((current) => {
      if (modal.index == null) return [{ item: modal.item, table: modal.table }, ...current];
      return current.map((row, index) => (index === modal.index ? { item: modal.item, table: modal.table } : row));
    });
    setModal(null);
  };

  return (
    <div className="lk-page">
      <PageHead title="采集表与试验项关系">
        <button type="button" className="lk-btn lk-btn-primary" onClick={() => { setSynced('已按当前试验表清单完成同步'); window.setTimeout(() => setSynced(''), 4000); }}>一键同步试验表</button>
      </PageHead>
      {synced && <div className="lk-banner">{synced}</div>}
      <div className="lk-filters">
        <label>试验项<input value={draft.item} placeholder="请输入" onChange={(event) => setDraft({ ...draft, item: event.target.value })} /></label>
        <label>采集表<input value={draft.table} placeholder="请输入" onChange={(event) => setDraft({ ...draft, table: event.target.value })} /></label>
        <div className="lk-filter-actions">
          <button type="button" className="lk-btn" onClick={() => { const empty = { item: '', table: '' }; setDraft(empty); setQuery(empty); }}>重置</button>
          <button type="button" className="lk-btn lk-btn-primary" onClick={() => setQuery(draft)}>查询</button>
          <button type="button" className="lk-btn lk-btn-navy" onClick={() => setModal({ index: null, item: '', table: '', error: '' })}>+ 新增</button>
        </div>
      </div>
      <div className="lk-table">
        <div className="lk-tr lk-th">
          <span className="w-no">序号</span><span className="w-item">试验项</span><span className="w-grow">采集表</span><span className="w-ops">操作</span>
        </div>
        {filtered.map((row) => {
          const index = rows.indexOf(row);
          return (
            <div className="lk-tr" key={`${row.item}-${index}`}>
              <span className="w-no is-muted">{filtered.indexOf(row) + 1}</span>
              <span className="w-item">{row.item}</span>
              <span className="w-grow">{row.table}</span>
              <span className="w-ops">
                <button type="button" className="lk-link" onClick={() => setModal({ index, item: row.item, table: row.table, error: '' })}>编辑</button>
                <button type="button" className="lk-link is-danger" onClick={() => setRows((current) => current.filter((_, itemIndex) => itemIndex !== index))}>删除</button>
              </span>
            </div>
          );
        })}
        <Pager total={filtered.length} />
      </div>
      {modal && (
        <div className="lk-mask is-center" onMouseDown={() => setModal(null)}>
          <div className="lk-dialog" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lk-drawer-hd"><b>{modal.index == null ? '新增详情' : '编辑详情'}</b><button type="button" onClick={() => setModal(null)}>×</button></div>
            <div className="lk-dialog-bd">
              <div className="lk-form-grid">
                <label>试验项
                  <select value={modal.item} onChange={(event) => setModal({ ...modal, item: event.target.value, error: '' })}>
                    <option value="">请选择</option>
                    {REL_ITEMS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>采集表
                  <select value={modal.table} onChange={(event) => setModal({ ...modal, table: event.target.value, error: '' })}>
                    <option value="">请选择</option>
                    {REL_TABLES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
              </div>
              {modal.error && <div className="lk-error">{modal.error}</div>}
            </div>
            <div className="lk-drawer-ft">
              <button type="button" className="lk-btn" onClick={() => setModal(null)}>取消</button>
              <button type="button" className="lk-btn lk-btn-primary" onClick={save}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CODE_KEY = 'labdata_sample_code_conversion_enabled';

export function SettingsPage() {
  const initialLims = readLimsMode();
  const [tab, setTab] = useState('params');
  const [limsDirect, setLimsDirect] = useState(initialLims.direct);
  const [limsAddress, setLimsAddress] = useState(initialLims.address);
  const [imageCompress, setImageCompress] = useState(false);
  const [codeOn, setCodeOn] = useState(true);
  const addressOptions = limsAddress && !LIMS_ADDRESS_OPTIONS.includes(limsAddress)
    ? [limsAddress, ...LIMS_ADDRESS_OPTIONS]
    : LIMS_ADDRESS_OPTIONS;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CODE_KEY);
      if (stored !== null) setCodeOn(stored === 'true');
    } catch { /* ignore */ }
  }, []);

  const toggleCode = () => {
    setCodeOn((value) => {
      const next = !value;
      try { localStorage.setItem(CODE_KEY, next ? 'true' : 'false'); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <div className="lk-page">
      <div className="lk-settings">
        <div className="lk-settings-tabs">
          <button type="button" className={tab === 'enum' ? 'is-on' : ''} onClick={() => setTab('enum')}>枚举值设置</button>
          <button type="button" className={tab === 'params' ? 'is-on' : ''} onClick={() => setTab('params')}>参数设置</button>
        </div>
        {tab === 'enum' ? (
          <div className="lk-empty">枚举值设置（原型占位）</div>
        ) : (
          <div data-annotation-page="web-settings" className="lk-settings-body">
            <div className="lk-setting-row">
              <span>数蚕lims直连</span>
              <div>
                <Switch wide on={limsDirect} onClick={() => {
                  const next = !limsDirect;
                  setLimsDirect(next);
                  writeLimsMode({ direct: next, address: limsAddress });
                }} />
                <em className={limsDirect ? 'is-on' : ''}>{limsDirect ? '开启' : '关闭'}</em>
              </div>
            </div>
            <div className="lk-setting-row is-top">
              <span>数蚕lims地址</span>
              <div>
                <select
                  value={limsAddress}
                  disabled={!limsDirect}
                  onChange={(event) => {
                    const address = event.target.value;
                    setLimsAddress(address);
                    writeLimsMode({ direct: limsDirect, address });
                  }}
                >
                  <option value="">请选择</option>
                  {addressOptions.map((address) => <option key={address} value={address}>{address}</option>)}
                </select>
                <p>打开直连并选择地址后，设备管理进入直连模式。直连不可改设备基本信息，采集方式双向同步；关闭或未选地址时，本页直接改设备信息和采集方式，不同步 LIMS。</p>
              </div>
            </div>
            <div className="lk-setting-row">
              <span>图采压缩开关</span>
              <div><Switch wide on={imageCompress} onClick={() => setImageCompress((value) => !value)} /><em className={imageCompress ? 'is-on' : ''}>{imageCompress ? '开启' : '关闭'}</em></div>
            </div>
            <div className="lk-setting-row is-top" data-annotation-id="sampleCodeConversion">
              <span>启用样品编号转换</span>
              <div>
                <div className="lk-setting-line">
                  <Switch wide on={codeOn} onClick={toggleCode} />
                  <em className={codeOn ? 'is-on' : ''}>{codeOn ? '开启' : '关闭'}</em>
                </div>
                <p>对接第三方 LIMS 时，将非标编号转换为唯一标准 ID（如 SC2026/01001-01）；App 展示「转换后编号（原编号）」。</p>
              </div>
            </div>
            {codeOn && (
              <div data-annotation-id="sampleCodePreview" className="lk-preview">
                <div className="lk-preview-title">转换预览（第三方 LIMS 非标编号示例）</div>
                <div className="lk-table">
                  <div className="lk-tr lk-th">
                    <span className="w-grow">原编号（LIMS 下发）</span>
                    <span className="w-arrow">→</span>
                    <span className="w-grow">标准 ID（系统交互）</span>
                    <span className="w-grow">App 展示格式</span>
                  </div>
                  {CODE_PREVIEW_SAMPLES.map((original) => {
                    const standard = convertCode(original);
                    const display = standard !== original ? `${standard}（${original}）` : original;
                    return (
                      <div className="lk-tr" key={original}>
                        <span className="w-grow lk-mono">{original}</span>
                        <span className="w-arrow">→</span>
                        <span className="w-grow lk-standard">{standard}</span>
                        <span className="w-grow">{display}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
