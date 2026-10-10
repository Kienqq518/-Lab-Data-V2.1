import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DevicePage, RelationsPage, RulesPage, SettingsPage } from './KitPages.jsx';
import { CollectConfigPage, CollectConfigProvider } from './CollectConfigPages.jsx';
import WebAnnotation from './WebAnnotation.jsx';
import {
  EQUIPMENT,
  FIELD_OPTIONS,
  MENU,
  NODE_TYPES,
  TEST_ITEMS,
  buildNodes,
  createInitialBindings,
  createInitialConfigs,
  createInitialManagers,
  equipmentLabel,
  findMenuItem,
  itemLabel,
  managerLabel,
  nextManagerName,
} from './safety-data.js';

const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10条/页' },
  { value: '20', label: '20条/页' },
  { value: '50', label: '50条/页' },
];

let idSeq = 20;
function uid(prefix) {
  idSeq += 1;
  return `${prefix}${idSeq}`;
}

function rememberBinding(bindings, managerId, equipmentId) {
  if (!managerId || !equipmentId) return bindings;
  if (bindings.some((item) => item.managerId === managerId && item.equipmentId === equipmentId)) return bindings;
  return [...bindings, { managerId, equipmentId }];
}

function Icon({ name }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  if (name === 'home') {
    return (
      <svg {...common}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" /></svg>
    );
  }
  if (name === 'db') {
    return (
      <svg {...common}><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></svg>
    );
  }
  if (name === 'task') {
    return (
      <svg {...common}><path d="M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2z" /></svg>
    );
  }
  if (name === 'base') {
    return (
      <svg {...common}><path d="M12 3 4 7l8 4 8-4-8-4zM4 12l8 4 8-4M4 17l8 4 8-4" /></svg>
    );
  }
  if (name === 'device') {
    return (
      <svg {...common}><rect x="4" y="4" width="16" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>
    );
  }
  if (name === 'image') {
    return (
      <svg {...common}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="m8 14 2.5-2.5L14 15l2-2 2 2" /><circle cx="9" cy="9" r="1" /></svg>
    );
  }
  if (name === 'log') {
    return (
      <svg {...common}><path d="M7 3h8l4 4v14H7z" /><path d="M15 3v5h5M9 13h6M9 17h6" /></svg>
    );
  }
  if (name === 'settings') {
    return (
      <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M4.9 6.6l1.6 1.6M17.5 15.8l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.4l1.6-1.6M17.5 8.2l1.6-1.6" /></svg>
    );
  }
  if (name === 'gear') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    );
  }
  if (name === 'user') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19.2c1.4-2.6 3.7-3.8 6.5-3.8s5.1 1.2 6.5 3.8" />
      </svg>
    );
  }
  if (name === 'menu') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder = '请选择',
  multiple = false,
  disabled = false,
  error = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const current = multiple ? (value || []) : value;
  const selected = multiple
    ? options.filter((option) => current.includes(option.value))
    : options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return undefined;
    const measure = () => {
      const element = triggerRef.current;
      if (!element) return;
      const box = element.getBoundingClientRect();
      const spaceBelow = window.innerHeight - box.bottom;
      const openUp = spaceBelow < 220 && box.top > spaceBelow;
      setRect({
        left: box.left,
        width: box.width,
        top: openUp ? 'auto' : box.bottom + 4,
        bottom: openUp ? window.innerHeight - box.top + 4 : 'auto',
        maxHeight: Math.max(120, Math.min(256, (openUp ? box.top : spaceBelow) - 16)),
      });
    };
    measure();
    const onDoc = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open]);

  const choose = (next) => {
    if (multiple) {
      const list = current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
      onChange(list);
      return;
    }
    onChange(next);
    setOpen(false);
  };

  const empty = multiple ? current.length === 0 : !selected;

  return (
    <div className={`adm-select${multiple ? ' is-multiple' : ''}${error ? ' is-error' : ''}${disabled ? ' is-disabled' : ''} ${className}`} ref={wrapRef}>
      <button
        type="button"
        className={`adm-select-trigger${empty ? ' is-placeholder' : ''}`}
        ref={triggerRef}
        disabled={disabled}
        onClick={() => setOpen((visible) => !visible)}
      >
        <span className="adm-select-value">
          {multiple && !empty ? current.map((item) => (
            <span className="adm-chip" key={item}>
              {options.find((option) => option.value === item)?.label || item}
              <i
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(current.filter((entry) => entry !== item));
                }}
              >
                ×
              </i>
            </span>
          )) : (selected?.label || placeholder)}
        </span>
      </button>
      <span className="adm-select-arrow"><Icon name="chevron" /></span>
      {open && rect && (
        <div
          className="adm-dropdown"
          style={{
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            top: rect.top,
            bottom: rect.bottom,
            maxHeight: rect.maxHeight,
            zIndex: 4000,
          }}
        >
          {options.length === 0 && <div className="adm-dropdown-empty">暂无数据</div>}
          {options.map((option) => {
            const active = multiple ? current.includes(option.value) : value === option.value;
            return (
              <button
                type="button"
                key={option.value}
                className={`adm-dropdown-item${active ? ' is-active' : ''}`}
                onClick={() => choose(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children, footer, wide, narrow, centerFooter, annotationPage }) {
  return (
    <div className="adm-mask" onMouseDown={onClose}>
      <div
        className={`adm-modal${wide ? ' is-wide' : ''}${narrow ? ' is-narrow' : ''}`}
        data-annotation-page={annotationPage || undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="adm-modal-hd">
          <span>{title}</span>
          <button type="button" className="adm-modal-x" onClick={onClose} aria-label="关闭">×</button>
        </div>
        <div className="adm-modal-bd">{children}</div>
        {footer && <div className={`adm-modal-ft${centerFooter ? ' is-center' : ''}`}>{footer}</div>}
      </div>
    </div>
  );
}

function FormRow({ label, children, error, annotationId }) {
  return (
    <div className="adm-form-row" data-annotation-id={annotationId || undefined}>
      <div className="adm-form-label">{label}</div>
      <div className="adm-form-control">
        {children}
        {error && <div className="adm-error">{error}</div>}
      </div>
    </div>
  );
}

function emptyBlock() {
  return { key: uid('b'), itemId: '', nodeType: '', fields: [] };
}

export default function SafetyAdmin() {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState({ device: true });
  const [tags, setTags] = useState([
    { key: 'home', label: '首页', closable: false },
    { key: 'safety', label: '安全管家配置', closable: true },
    { key: 'collect-config', label: '设备采集配置', closable: true },
  ]);
  const [pageKey, setPageKey] = useState('safety');
  const [managers, setManagers] = useState(createInitialManagers);
  const [bindings, setBindings] = useState(createInitialBindings);
  const [configs, setConfigs] = useState(createInitialConfigs);
  const [activeManagerId, setActiveManagerId] = useState('sm01');
  const [hoverManagerId, setHoverManagerId] = useState('');
  const [draft, setDraft] = useState({ equipment: '', item: '', nodeType: '' });
  const [query, setQuery] = useState({ equipment: '', item: '', nodeType: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jump, setJump] = useState('1');
  const [hoverGroup, setHoverGroup] = useState('');
  const [hoverRow, setHoverRow] = useState('');
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const nodeScrollRef = useRef(null);

  useEffect(() => {
    document.title = '安全管家配置 - 实验室数智化系统';
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (confirm) setConfirm(null);
      else setModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirm]);

  const equipmentMap = useMemo(() => Object.fromEntries(EQUIPMENT.map((item) => [item.id, item])), []);
  const itemMap = useMemo(() => Object.fromEntries(TEST_ITEMS.map((item) => [item.id, item])), []);
  const activeManager = managers.find((item) => item.id === activeManagerId) || null;

  const filtered = useMemo(() => {
    const equipmentText = query.equipment.trim().toLowerCase();
    const itemText = query.item.trim().toLowerCase();
    return configs
      .filter((row) => row.managerId === activeManagerId)
      .filter((row) => {
        const equipment = equipmentMap[row.equipmentId];
        const item = itemMap[row.itemId];
        const equipmentHit = !equipmentText || equipmentLabel(equipment, true).toLowerCase().includes(equipmentText);
        const itemHit = !itemText || itemLabel(item).toLowerCase().includes(itemText);
        const nodeHit = !query.nodeType || row.nodeType === query.nodeType;
        return equipmentHit && itemHit && nodeHit;
      })
      .map((row, index) => ({ ...row, serial: index + 1 }));
  }, [configs, activeManagerId, query, equipmentMap, itemMap]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const groups = [];
  pageRows.forEach((row) => {
    const last = groups[groups.length - 1];
    if (!last || last.equipmentId !== row.equipmentId) groups.push({ equipmentId: row.equipmentId, rows: [row] });
    else last.rows.push(row);
  });

  useEffect(() => {
    setJump(String(safePage));
    if (page !== safePage) setPage(safePage);
  }, [safePage, page]);

  const openPage = (key) => {
    const item = findMenuItem(key);
    if (!item || item.children) {
      setOpenGroups((current) => ({ ...current, [key]: !current[key] }));
      return;
    }
    setTags((current) => (current.some((tag) => tag.key === key)
      ? current
      : [...current, { key, label: item.label, closable: key !== 'home' }]));
    setPageKey(key);
  };

  const closeTag = (key) => {
    setTags((current) => {
      const index = current.findIndex((tag) => tag.key === key);
      const next = current.filter((tag) => tag.key !== key);
      if (pageKey === key) {
        const fallback = next[Math.max(0, index - 1)] || next[0];
        setPageKey(fallback?.key || 'home');
      }
      return next;
    });
  };

  const showToast = (text) => setToast(text);

  const openAdd = (equipmentId = '') => {
    setModal({
      type: 'add',
      managerId: activeManagerId || managers[0]?.id || '',
      equipmentId,
      blocks: [emptyBlock()],
      errors: {},
    });
  };

  const openEdit = (row) => {
    setModal({
      type: 'edit',
      id: row.id,
      managerId: row.managerId,
      equipmentId: row.equipmentId,
      itemId: row.itemId,
      nodeType: row.nodeType,
      fields: [...row.fields],
      errors: {},
    });
  };

  const applyQuery = () => {
    setQuery({ ...draft });
    setPage(1);
  };

  const resetQuery = () => {
    const empty = { equipment: '', item: '', nodeType: '' };
    setDraft(empty);
    setQuery(empty);
    setPage(1);
  };

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.action === 'delete') {
      setConfigs((current) => current.filter((row) => row.id !== confirm.id));
      showToast('删除成功');
    }
    if (confirm.action === 'unbind-manager') {
      setManagers((current) => current.filter((item) => item.id !== confirm.id));
      setBindings((current) => current.filter((item) => item.managerId !== confirm.id));
      setConfigs((current) => current.filter((row) => row.managerId !== confirm.id));
      setActiveManagerId((current) => {
        if (current !== confirm.id) return current;
        const rest = managers.filter((item) => item.id !== confirm.id);
        return rest[0]?.id || '';
      });
      setModal(null);
      showToast('已解绑安全管家');
    }
    if (confirm.action === 'unbind-equipment') {
      setBindings((current) => current.filter((item) => !(item.managerId === confirm.managerId && item.equipmentId === confirm.equipmentId)));
      setConfigs((current) => current.filter((row) => !(row.managerId === confirm.managerId && row.equipmentId === confirm.equipmentId)));
      setModal(confirm.keepList ? { type: 'bound', managerId: confirm.managerId } : null);
      showToast('已解除设备绑定');
    }
    setConfirm(null);
  };

  const saveAdd = () => {
    const errors = {};
    if (!modal.managerId) errors.managerId = '请选择安全管家';
    if (!modal.equipmentId) errors.equipmentId = '请选择试验设备';
    const blockErrors = {};
    modal.blocks.forEach((block) => {
      const itemError = {};
      if (!block.itemId) itemError.itemId = '请选择试验项';
      if (!block.nodeType) itemError.nodeType = '请选择节点类型';
      if (!block.fields.length) itemError.fields = '请选择字段';
      if (block.itemId && modal.managerId) {
        const duplicated = configs.some((row) => row.managerId === modal.managerId && row.equipmentId === modal.equipmentId && row.itemId === block.itemId)
          || modal.blocks.filter((entry) => entry.itemId === block.itemId).length > 1;
        if (duplicated) itemError.itemId = '该试验项在当前安全管家下已存在';
      }
      if (Object.keys(itemError).length) blockErrors[block.key] = itemError;
    });
    if (Object.keys(blockErrors).length) errors.blocks = blockErrors;
    if (Object.keys(errors).length) {
      setModal({ ...modal, errors });
      return;
    }
    const created = modal.blocks.map((block) => ({
      id: uid('c'),
      managerId: modal.managerId,
      equipmentId: modal.equipmentId,
      itemId: block.itemId,
      nodeType: block.nodeType,
      fields: [...block.fields],
    }));
    setConfigs((current) => [...current, ...created]);
    setBindings((current) => rememberBinding(current, modal.managerId, modal.equipmentId));
    setActiveManagerId(modal.managerId);
    setPage(1);
    setModal(null);
    showToast('新增成功');
  };

  const saveEdit = () => {
    const errors = {};
    if (!modal.managerId) errors.managerId = '请选择安全管家';
    if (!modal.equipmentId) errors.equipmentId = '请选择试验设备';
    if (!modal.itemId) errors.itemId = '请选择试验项';
    if (!modal.nodeType) errors.nodeType = '请选择节点类型';
    if (!modal.fields.length) errors.fields = '请选择字段';
    const duplicated = configs.some((row) => row.id !== modal.id && row.managerId === modal.managerId && row.equipmentId === modal.equipmentId && row.itemId === modal.itemId);
    if (duplicated) errors.itemId = '该试验项在当前安全管家下已存在';
    if (Object.keys(errors).length) {
      setModal({ ...modal, errors });
      return;
    }
    setConfigs((current) => current.map((row) => (row.id === modal.id ? {
      ...row,
      managerId: modal.managerId,
      equipmentId: modal.equipmentId,
      itemId: modal.itemId,
      nodeType: modal.nodeType,
      fields: [...modal.fields],
    } : row)));
    setBindings((current) => rememberBinding(current, modal.managerId, modal.equipmentId));
    setActiveManagerId(modal.managerId);
    setModal(null);
    showToast('保存成功');
  };

  const nextBind = () => {
    const deviceNo = modal.deviceNo.trim();
    const apiKey = modal.apiKey.trim();
    const errors = {};
    if (!deviceNo) errors.deviceNo = '请输入设备编号';
    if (!apiKey) errors.apiKey = '请输入 API Key';
    if (deviceNo && managers.some((item) => item.deviceNo.toLowerCase() === deviceNo.toLowerCase())) {
      errors.deviceNo = '该设备编号已绑定';
    }
    if (Object.keys(errors).length) {
      setModal({ ...modal, errors, deviceNo, apiKey });
      return;
    }
    setModal({
      ...modal,
      deviceNo,
      apiKey,
      errors: {},
      step: 2,
      nodes: buildNodes(deviceNo),
    });
  };

  const finishBind = () => {
    const manager = {
      id: uid('sm'),
      name: nextManagerName(managers),
      deviceNo: modal.deviceNo,
      apiKey: modal.apiKey,
      nodes: modal.nodes,
    };
    setManagers((current) => [...current, manager]);
    setActiveManagerId(manager.id);
    setPage(1);
    setModal(null);
    showToast('绑定成功');
  };

  const managerOptions = managers.map((item) => ({ value: item.id, label: managerLabel(item) }));
  const equipmentOptions = EQUIPMENT.map((item) => ({ value: item.id, label: equipmentLabel(item, true) }));
  const nodeOptions = NODE_TYPES.map((item) => ({ value: item, label: item }));
  const fieldOptions = FIELD_OPTIONS.map((item) => ({ value: item, label: item }));
  const boundEquipment = bindings
    .filter((item) => item.managerId === activeManagerId)
    .map((item) => ({
      ...item,
      equipment: equipmentMap[item.equipmentId],
      configCount: configs.filter((row) => row.managerId === item.managerId && row.equipmentId === item.equipmentId).length,
    }));

  const renderSafety = () => (
    <>
      <div className="adm-title-row">
        <h1 className="adm-title">安全管家配置</h1>
        <button type="button" className="adm-btn adm-btn-primary" onClick={() => openAdd()}>+ 新增配置</button>
      </div>
      <div className="adm-filters">
        <label className="adm-field">
          <span>试验设备</span>
          <input
            className="adm-input"
            placeholder="请输入"
            value={draft.equipment}
            onChange={(event) => setDraft({ ...draft, equipment: event.target.value })}
            onKeyDown={(event) => { if (event.key === 'Enter') applyQuery(); }}
          />
        </label>
        <label className="adm-field">
          <span>试验项</span>
          <input
            className="adm-input"
            placeholder="请输入"
            value={draft.item}
            onChange={(event) => setDraft({ ...draft, item: event.target.value })}
            onKeyDown={(event) => { if (event.key === 'Enter') applyQuery(); }}
          />
        </label>
        <div className="adm-field">
          <span>节点类型</span>
          <Select
            value={draft.nodeType}
            placeholder="请选择"
            options={nodeOptions}
            onChange={(nodeType) => setDraft({ ...draft, nodeType })}
          />
        </div>
        <div className="adm-filter-actions">
          <button type="button" className="adm-btn" onClick={resetQuery}>重置</button>
          <button type="button" className="adm-btn adm-btn-plain" onClick={applyQuery}>查询</button>
        </div>
      </div>
      <div className="adm-mgr-bar">
        <div className="adm-mgr-tabs">
          {managers.map((manager) => (
            <div
              key={manager.id}
              className={`adm-mgr-tab${manager.id === activeManagerId ? ' is-active' : ''}`}
              onMouseEnter={() => setHoverManagerId(manager.id)}
              onMouseLeave={() => setHoverManagerId('')}
            >
              <button type="button" className="adm-mgr-name" onClick={() => { setActiveManagerId(manager.id); setPage(1); }}>
                {manager.name}
              </button>
              {hoverManagerId === manager.id && (
                <button
                  type="button"
                  className="adm-mgr-gear"
                  title="设备"
                  aria-label="设备"
                  onClick={() => setModal({ type: 'device', managerId: manager.id, tab: '全部节点' })}
                >
                  <Icon name="gear" />
                </button>
              )}
            </div>
          ))}
          <div className="adm-mgr-tab is-bind">
            <button
              type="button"
              className="adm-mgr-bind"
              onClick={() => setModal({ type: 'bind', step: 1, deviceNo: '', apiKey: '', errors: {} })}
            >
              + 绑定设备
            </button>
          </div>
        </div>
        <button
          type="button"
          className="adm-bound-entry"
          disabled={!activeManager}
          onClick={() => activeManager && setModal({ type: 'bound', managerId: activeManager.id })}
        >
          已绑试验设备
          <span>{boundEquipment.length}</span>
        </button>
      </div>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <colgroup>
            <col style={{ width: 88 }} />
            <col />
            <col style={{ width: 180 }} />
            <col style={{ width: 280 }} />
          </colgroup>
          <thead>
            <tr>
              <th>序号</th>
              <th>试验项</th>
              <th>字段</th>
              <th>关联节点类型</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td className="adm-empty" colSpan={4}>
                  {!activeManager
                    ? '请先绑定安全管家'
                    : boundEquipment.length
                      ? '当前没有可展示的试验项参数。设备绑定仍保留，可从「已绑试验设备」继续新增配置或解绑。'
                      : '暂无数据'}
                </td>
              </tr>
            )}
            {groups.map((group) => {
              const equipment = equipmentMap[group.equipmentId];
              return (
                <React.Fragment key={`${group.equipmentId}-${group.rows[0].id}`}>
                  <tr
                    className="adm-group"
                    onMouseEnter={() => setHoverGroup(group.equipmentId)}
                    onMouseLeave={() => setHoverGroup('')}
                  >
                    <td colSpan={4}>
                      <div className="adm-group-inner">
                        <span>试验设备：{equipmentLabel(equipment)}</span>
                        {hoverGroup === group.equipmentId && (
                          <span className="adm-row-actions">
                            <button type="button" className="adm-btn-link" onClick={() => openAdd(group.equipmentId)}>新增配置</button>
                            <button
                              type="button"
                              className="adm-btn-link"
                              onClick={() => setModal({ type: 'manage', managerId: activeManagerId, equipmentId: group.equipmentId })}
                            >
                              管理设备
                            </button>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr
                      key={row.id}
                      className="is-data"
                      onMouseEnter={() => setHoverRow(row.id)}
                      onMouseLeave={() => setHoverRow('')}
                    >
                      <td>{row.serial}</td>
                      <td>{itemMap[row.itemId]?.name}</td>
                      <td>{row.fields.join(',')}</td>
                      <td>
                        <div className="adm-cell-actions">
                          <span>{row.nodeType}</span>
                          {hoverRow === row.id && (
                            <span className="adm-row-actions">
                              <button type="button" className="adm-btn-link" onClick={() => openEdit(row)}>编辑</button>
                              <button
                                type="button"
                                className="adm-btn-link"
                                onClick={() => setConfirm({
                                  action: 'delete',
                                  id: row.id,
                                  title: '提示',
                                  content: '确认删除该配置？',
                                })}
                              >
                                删除
                              </button>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="adm-pager">
        <span>共 {filtered.length} 条</span>
        <Select
          className="adm-pager-size"
          value={String(pageSize)}
          options={PAGE_SIZE_OPTIONS}
          onChange={(value) => { setPageSize(Number(value)); setPage(1); }}
        />
        <button type="button" className="adm-pager-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>&lt;</button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
          <button
            type="button"
            key={number}
            className={`adm-pager-num${number === safePage ? ' is-active' : ''}`}
            onClick={() => setPage(number)}
          >
            {number}
          </button>
        ))}
        <button type="button" className="adm-pager-btn" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>&gt;</button>
        <span className="adm-pager-jump">
          前往
          <input
            className="adm-input"
            value={jump}
            onChange={(event) => setJump(event.target.value.replace(/[^\d]/g, ''))}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              const target = Math.min(pageCount, Math.max(1, Number(jump) || 1));
              setPage(target);
            }}
            onBlur={() => {
              const target = Math.min(pageCount, Math.max(1, Number(jump) || safePage));
              setPage(target);
              setJump(String(target));
            }}
          />
          页
        </span>
      </div>
    </>
  );

  const renderPlaceholder = () => {
    const item = findMenuItem(pageKey);
    return (
      <div className="adm-placeholder">
        <div className="adm-title-row">
          <h1 className="adm-title">{item?.label || '首页'}</h1>
        </div>
        <div className="adm-placeholder-body">
          {pageKey === 'home'
            ? '实验室数智化系统 Web 管理后台。可进入设备管理、设备采集配置、关系配置、数据识别规则、安全管家配置和系统参数。'
            : '该菜单为原型占位。可交互页面包括设备管理、设备采集配置、关系配置、数据识别规则、安全管家配置和系统参数。'}
          {pageKey !== 'safety' && (
            <div style={{ marginTop: 16 }}>
              <button type="button" className="adm-btn adm-btn-primary" onClick={() => openPage('safety')}>进入安全管家配置</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const deviceManager = modal?.type === 'device' ? managers.find((item) => item.id === modal.managerId) : null;
  const manageEquipment = modal?.type === 'manage' ? equipmentMap[modal.equipmentId] : null;
  const manageManager = modal?.type === 'manage' ? managers.find((item) => item.id === modal.managerId) : null;
  const visibleNodes = deviceManager
    ? deviceManager.nodes.filter((node) => modal.tab === '全部节点' || node.type === modal.tab)
    : [];
  const nodeTabs = ['全部节点', ...NODE_TYPES.filter((type) => deviceManager?.nodes.some((node) => node.type === type))];

  return (
    <CollectConfigProvider>
    <div className="adm-root">
      <aside className={`adm-side${collapsed ? ' is-collapsed' : ''}`}>
        <div className="adm-brand">
          <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#fff" />
            <path d="M22 12.1c-.8-2.1-2.6-3.4-5-3.4-3.2 0-5.3 2-5.3 4.4 0 2.9 2.2 4 5.7 4.7 2.5.5 3.5 1.2 3.5 2.5 0 1.4-1.4 2.3-3.3 2.3-2.1 0-3.6-1-4.2-2.5" fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          {!collapsed && <span className="adm-brand-name">Lab Data</span>}
        </div>
        <nav className="adm-menu">
          {MENU.map((item) => (
            <div key={item.key}>
              <button
                type="button"
                className={`adm-menu-item${pageKey === item.key ? ' is-active' : ''}`}
                title={item.label}
                onClick={() => openPage(item.key)}
              >
                <Icon name={item.icon} />
                {!collapsed && <span className="adm-menu-label">{item.label}</span>}
                {!collapsed && item.children && (
                  <span className={`adm-chevron${openGroups[item.key] ? ' is-open' : ''}`}><Icon name="chevron" /></span>
                )}
              </button>
              {!collapsed && item.children && openGroups[item.key] && item.children.map((child) => (
                <button
                  type="button"
                  key={child.key}
                  className={`adm-submenu-item${pageKey === child.key ? ' is-active' : ''}`}
                  onClick={() => openPage(child.key)}
                >
                  <span className="adm-menu-label">{child.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        {!collapsed && <div className="adm-version">版本：V2.0</div>}
      </aside>
      <section className="adm-main">
        <header className="adm-header">
          <button type="button" className="adm-icon-btn" aria-label="折叠菜单" onClick={() => setCollapsed((value) => !value)}>
            <Icon name="menu" />
          </button>
          <div className="adm-tags">
            {tags.map((tag) => (
              <button
                type="button"
                key={tag.key}
                className={`adm-page-tag${pageKey === tag.key ? ' is-active' : ''}`}
                onClick={() => setPageKey(tag.key)}
              >
                {tag.key === 'home' && <Icon name="home" />}
                {tag.label}
                {tag.closable && (
                  <span
                    className="adm-page-tag-x"
                    onClick={(event) => {
                      event.stopPropagation();
                      closeTag(tag.key);
                    }}
                  >
                    ×
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="adm-header-right">
            <WebAnnotation />
            <span className="adm-system-name">实验室数智化系统</span>
            <span className="adm-avatar" aria-label="当前用户"><Icon name="user" /></span>
          </div>
        </header>
        <div className="adm-content">
          {pageKey === 'safety' && <div className="adm-card">{renderSafety()}</div>}
          {pageKey === 'devices' && <div className="adm-legacy"><DevicePage /></div>}
          {pageKey === 'relations' && <div className="adm-legacy"><RelationsPage /></div>}
          {pageKey === 'rules' && <div className="adm-legacy"><RulesPage /></div>}
          {pageKey === 'settings' && <div className="adm-legacy"><SettingsPage /></div>}
          {pageKey === 'collect-config' && <div className="adm-legacy"><CollectConfigPage /></div>}
          {!['safety', 'devices', 'relations', 'rules', 'settings', 'collect-config'].includes(pageKey) && (
            <div className="adm-card">{renderPlaceholder()}</div>
          )}
        </div>
      </section>

      {modal?.type === 'add' && (
        <Modal
          title="新增配置"
          annotationPage="web-safety-add"
          onClose={() => setModal(null)}
          footer={(
            <>
              <button type="button" className="adm-btn" onClick={() => setModal(null)}>取消</button>
              <button type="button" className="adm-btn adm-btn-primary" onClick={saveAdd}>确定</button>
            </>
          )}
        >
          <FormRow label="安全管家" error={modal.errors.managerId}>
            <Select
              value={modal.managerId}
              options={managerOptions}
              error={!!modal.errors.managerId}
              onChange={(managerId) => setModal({ ...modal, managerId, errors: { ...modal.errors, managerId: '' } })}
            />
          </FormRow>
          <FormRow label="试验设备" annotationId="addEquipment" error={modal.errors.equipmentId}>
            <Select
              value={modal.equipmentId}
              options={equipmentOptions}
              error={!!modal.errors.equipmentId}
              onChange={(equipmentId) => setModal({
                ...modal,
                equipmentId,
                errors: { ...modal.errors, equipmentId: '' },
                blocks: modal.blocks.map((block) => {
                  const item = itemMap[block.itemId];
                  return item && item.equipmentId !== equipmentId ? { ...block, itemId: '' } : block;
                }),
              })}
            />
          </FormRow>
          {modal.blocks.map((block, index) => {
            const blockError = modal.errors.blocks?.[block.key] || {};
            const itemOptions = TEST_ITEMS
              .filter((item) => item.equipmentId === modal.equipmentId)
              .map((item) => ({ value: item.id, label: itemLabel(item) }));
            return (
              <div key={block.key} data-annotation-id={index === 0 ? 'addBlock' : undefined}>
                <div className="adm-step">
                  <span className="adm-step-line" />
                  <span className="adm-step-no">{index + 1}</span>
                  <span className="adm-step-line" />
                  {index > 0 && (
                    <button
                      type="button"
                      className="adm-btn-link"
                      onClick={() => setModal({ ...modal, blocks: modal.blocks.filter((entry) => entry.key !== block.key) })}
                    >
                      删除
                    </button>
                  )}
                </div>
                <FormRow label="试验项" error={blockError.itemId}>
                  <Select
                    value={block.itemId}
                    options={itemOptions}
                    disabled={!modal.equipmentId}
                    error={!!blockError.itemId}
                    onChange={(itemId) => setModal({
                      ...modal,
                      blocks: modal.blocks.map((entry) => (entry.key === block.key ? { ...entry, itemId } : entry)),
                    })}
                  />
                </FormRow>
                <FormRow label="节点类型" error={blockError.nodeType}>
                  <Select
                    value={block.nodeType}
                    options={nodeOptions}
                    error={!!blockError.nodeType}
                    onChange={(nodeType) => setModal({
                      ...modal,
                      blocks: modal.blocks.map((entry) => {
                        if (entry.key !== block.key) return entry;
                        const fields = !entry.fields.length && nodeType === '温湿度节点' ? ['wd', 'sd'] : entry.fields;
                        return { ...entry, nodeType, fields };
                      }),
                    })}
                  />
                </FormRow>
                <FormRow label="字段" error={blockError.fields}>
                  <Select
                    multiple
                    value={block.fields}
                    options={fieldOptions}
                    error={!!blockError.fields}
                    onChange={(fields) => setModal({
                      ...modal,
                      blocks: modal.blocks.map((entry) => (entry.key === block.key ? { ...entry, fields } : entry)),
                    })}
                  />
                </FormRow>
              </div>
            );
          })}
          <button
            type="button"
            className="adm-btn adm-btn-dashed"
            data-annotation-id="addMore"
            onClick={() => setModal({ ...modal, blocks: [...modal.blocks, emptyBlock()] })}
          >
            + 新增
          </button>
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal
          title="编辑"
          onClose={() => setModal(null)}
          footer={(
            <>
              <button type="button" className="adm-btn" onClick={() => setModal(null)}>取消</button>
              <button type="button" className="adm-btn adm-btn-primary" onClick={saveEdit}>确定</button>
            </>
          )}
        >
          <FormRow label="安全管家" error={modal.errors.managerId}>
            <Select value={modal.managerId} options={managerOptions} error={!!modal.errors.managerId} onChange={(managerId) => setModal({ ...modal, managerId })} />
          </FormRow>
          <FormRow label="试验设备" error={modal.errors.equipmentId}>
            <Select
              value={modal.equipmentId}
              options={equipmentOptions}
              error={!!modal.errors.equipmentId}
              onChange={(equipmentId) => {
                const item = itemMap[modal.itemId];
                setModal({
                  ...modal,
                  equipmentId,
                  itemId: item && item.equipmentId !== equipmentId ? '' : modal.itemId,
                });
              }}
            />
          </FormRow>
          <FormRow label="试验项" error={modal.errors.itemId}>
            <Select
              value={modal.itemId}
              error={!!modal.errors.itemId}
              options={TEST_ITEMS.filter((item) => item.equipmentId === modal.equipmentId).map((item) => ({ value: item.id, label: itemLabel(item) }))}
              onChange={(itemId) => setModal({ ...modal, itemId })}
            />
          </FormRow>
          <FormRow label="节点类型" error={modal.errors.nodeType}>
            <Select
              value={modal.nodeType}
              options={nodeOptions}
              error={!!modal.errors.nodeType}
              onChange={(nodeType) => setModal({
                ...modal,
                nodeType,
                fields: !modal.fields.length && nodeType === '温湿度节点' ? ['wd', 'sd'] : modal.fields,
              })}
            />
          </FormRow>
          <FormRow label="字段" error={modal.errors.fields}>
            <Select multiple value={modal.fields} options={fieldOptions} error={!!modal.errors.fields} onChange={(fields) => setModal({ ...modal, fields })} />
          </FormRow>
        </Modal>
      )}

      {modal?.type === 'bind' && (
        <Modal
          title="绑定安全管家"
          onClose={() => setModal(null)}
          footer={modal.step === 1 ? (
            <>
              <button type="button" className="adm-btn" onClick={() => setModal(null)}>取消</button>
              <button type="button" className="adm-btn adm-btn-primary" onClick={nextBind}>下一步</button>
            </>
          ) : (
            <>
              <button type="button" className="adm-btn" onClick={() => setModal({ ...modal, step: 1 })}>上一步</button>
              <button type="button" className="adm-btn adm-btn-primary" onClick={finishBind}>确定</button>
            </>
          )}
        >
          {modal.step === 1 ? (
            <>
              <FormRow label="设备编号" error={modal.errors.deviceNo}>
                <input
                  className={`adm-input${modal.errors.deviceNo ? ' is-error' : ''}`}
                  placeholder="请输入"
                  value={modal.deviceNo}
                  onChange={(event) => setModal({ ...modal, deviceNo: event.target.value, errors: { ...modal.errors, deviceNo: '' } })}
                />
              </FormRow>
              <FormRow label="API Key" error={modal.errors.apiKey}>
                <input
                  className={`adm-input${modal.errors.apiKey ? ' is-error' : ''}`}
                  placeholder="请输入"
                  value={modal.apiKey}
                  onChange={(event) => setModal({ ...modal, apiKey: event.target.value, errors: { ...modal.errors, apiKey: '' } })}
                />
              </FormRow>
            </>
          ) : (
            <>
              <div className="adm-info-grid">
                <div className="adm-info-card">
                  <div className="adm-info-label">设备编号</div>
                  <div className="adm-info-value">{modal.deviceNo}</div>
                </div>
                <div className="adm-info-card">
                  <div className="adm-info-label">API Key</div>
                  <div className="adm-info-value">{modal.apiKey}</div>
                </div>
              </div>
              <div className="adm-node-panel">
                <div style={{ marginBottom: 8, color: '#8c8c8c' }}>已获取 {modal.nodes.length} 个物联节点</div>
                <div className="adm-node-grid">
                  {modal.nodes.map((node) => (
                    <div className="adm-node-card" key={node.code}>
                      <div className="adm-node-name">{node.name}</div>
                      <div className="adm-node-code">{node.code}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </Modal>
      )}

      {modal?.type === 'device' && deviceManager && (
        <Modal
          wide
          title={deviceManager.name}
          onClose={() => setModal(null)}
          footer={(
            <button
              type="button"
              className="adm-btn adm-btn-danger"
              onClick={() => setConfirm({
                action: 'unbind-manager',
                id: deviceManager.id,
                title: '解绑安全管家',
                content: '确认解绑该安全管家？解绑后，该管家下的试验配置将一并删除。',
                danger: true,
              })}
            >
              解绑该安全管家
            </button>
          )}
        >
          <div className="adm-info-grid">
            <div className="adm-info-card">
              <div className="adm-info-label">设备编号</div>
              <div className="adm-info-value">{deviceManager.deviceNo}</div>
            </div>
            <div className="adm-info-card">
              <div className="adm-info-label">API Key</div>
              <div className="adm-info-value">{deviceManager.apiKey}</div>
            </div>
          </div>
          <div className="adm-node-tabs">
            <button type="button" className="adm-node-arrow" aria-label="向左" onClick={() => nodeScrollRef.current?.scrollBy({ left: -180, behavior: 'smooth' })}>&lt;</button>
            <div className="adm-node-scroll" ref={nodeScrollRef}>
              {nodeTabs.map((tab) => (
                <button
                  type="button"
                  key={tab}
                  className={`adm-node-tab${modal.tab === tab ? ' is-active' : ''}`}
                  onClick={() => setModal({ ...modal, tab })}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button type="button" className="adm-node-arrow" aria-label="向右" onClick={() => nodeScrollRef.current?.scrollBy({ left: 180, behavior: 'smooth' })}>&gt;</button>
          </div>
          <div className="adm-node-panel">
            {visibleNodes.length === 0 ? (
              <div className="adm-node-empty">暂无该类型节点</div>
            ) : (
              <div className="adm-node-grid">
                {visibleNodes.map((node) => (
                  <div className="adm-node-card" key={node.code}>
                    <div className="adm-node-name">{node.name}</div>
                    <div className="adm-node-code">{node.code}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {modal?.type === 'bound' && (() => {
        const boundManager = managers.find((item) => item.id === modal.managerId);
        const rows = bindings
          .filter((item) => item.managerId === modal.managerId)
          .map((item) => ({
            ...item,
            equipment: equipmentMap[item.equipmentId],
            configCount: configs.filter((row) => row.managerId === item.managerId && row.equipmentId === item.equipmentId).length,
          }));
        return (
          <Modal wide title="已绑定试验设备" onClose={() => setModal(null)}>
            <p className="adm-bound-note">
              {boundManager ? `${boundManager.name} 下已绑定 ${rows.length} 台试验设备。` : ''}
              主列表只展示仍有试验项参数的设备。参数全部删除后，设备不会从绑定关系里消失，可在这里继续新增配置或解绑。
            </p>
            {rows.length === 0 ? (
              <div className="adm-bound-empty">当前安全管家还没有绑定试验设备。新增配置并选择试验设备后，会记入此列表。</div>
            ) : (
              <div className="adm-bound-table">
                <div className="adm-bound-tr is-head">
                  <span>设备名称</span>
                  <span>设备编号</span>
                  <span>试验项参数</span>
                  <span>操作</span>
                </div>
                {rows.map((row) => (
                  <div className="adm-bound-tr" key={row.equipmentId}>
                    <span>
                      <b>{row.equipment?.name || '—'}</b>
                      {row.equipment?.model ? <small>{row.equipment.model}</small> : null}
                    </span>
                    <span>{row.equipment?.code || '—'}</span>
                    <span className={row.configCount === 0 ? 'is-zero' : ''}>{row.configCount === 0 ? '0 条 · 列表中不展示' : `${row.configCount} 条`}</span>
                    <span className="adm-bound-ops">
                      <button type="button" className="adm-btn-link" onClick={() => openAdd(row.equipmentId)}>新增配置</button>
                      <button
                        type="button"
                        className="adm-btn-link is-danger"
                        onClick={() => setConfirm({
                          action: 'unbind-equipment',
                          managerId: modal.managerId,
                          equipmentId: row.equipmentId,
                          keepList: true,
                          title: '解除设备绑定',
                          content: '确认解绑该设备与当前安全管家的绑定？解绑后，该设备下剩余的试验项参数也会一并移除。',
                          danger: true,
                        })}
                      >
                        解绑
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Modal>
        );
      })()}

      {modal?.type === 'manage' && manageEquipment && manageManager && (
        <Modal
          narrow
          centerFooter
          title="管理试验设备"
          onClose={() => setModal(null)}
          footer={(
            <button
              type="button"
              className="adm-btn adm-btn-danger"
              onClick={() => setConfirm({
                action: 'unbind-equipment',
                managerId: manageManager.id,
                equipmentId: manageEquipment.id,
                title: '解除设备绑定',
                content: '确认解绑该设备与当前安全管家的绑定？解绑后，该设备下的试验配置将从当前安全管家移除。',
                danger: true,
              })}
            >
              解绑该设备与当前安全管家的绑定
            </button>
          )}
        >
          <div className="adm-info-grid">
            <div className="adm-info-card is-full">
              <div className="adm-info-label">安全管家</div>
              <div className="adm-info-value">{managerLabel(manageManager)}</div>
            </div>
            <div className="adm-info-card">
              <div className="adm-info-label">设备名称</div>
              <div className="adm-info-value">{manageEquipment.name}</div>
            </div>
            <div className="adm-info-card">
              <div className="adm-info-label">设备编号</div>
              <div className="adm-info-value">{manageEquipment.code}</div>
            </div>
          </div>
        </Modal>
      )}

      {confirm && (
        <div className="adm-mask is-top" onMouseDown={() => setConfirm(null)}>
          <div className="adm-confirm" onMouseDown={(event) => event.stopPropagation()}>
            <div className="adm-confirm-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#faad14" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <rect x="11" y="6.5" width="2" height="7" rx="1" fill="#fff" />
                <rect x="11" y="15.5" width="2" height="2" rx="1" fill="#fff" />
              </svg>
              {confirm.title}
            </div>
            <div className="adm-confirm-body">{confirm.content}</div>
            <div className="adm-confirm-ft">
              <button type="button" className="adm-btn" onClick={() => setConfirm(null)}>取消</button>
              <button type="button" className={`adm-btn ${confirm.danger ? 'adm-btn-danger' : 'adm-btn-primary'}`} onClick={runConfirm}>确定</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="adm-toast">
          <span className="adm-toast-dot">✓</span>
          {toast}
        </div>
      )}
    </div>
    </CollectConfigProvider>
  );
}
