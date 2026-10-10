import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { EQUIPMENT } from './safety-data.js';
import {
  COLLECT_TABLES,
  INITIAL_COLLECT_CONFIGS,
  THIRD_TABLES,
  equipmentById,
  fieldByKey,
  fieldChip,
  hostFields,
  syncL4Visible,
  tableById,
  thirdById,
} from './collect-config-data.js';

const CollectConfigContext = createContext(null);

export function CollectConfigProvider({ children, onNavigate }) {
  const [rows, setRows] = useState(INITIAL_COLLECT_CONFIGS);
  const [focusId, setFocusId] = useState('');
  const value = useMemo(() => ({
    rows,
    setRows,
    focusId,
    setFocusId,
    openL4: (id) => {
      setFocusId(id || '');
      onNavigate?.('l4-fields');
    },
  }), [rows, focusId, onNavigate]);
  return <CollectConfigContext.Provider value={value}>{children}</CollectConfigContext.Provider>;
}

function useCollectConfigs() {
  const value = useContext(CollectConfigContext);
  if (!value) throw new Error('CollectConfigProvider missing');
  return value;
}

function equipmentName(id) {
  const equipment = equipmentById(id);
  if (!equipment) return '—';
  return equipment.model ? `${equipment.name}（${equipment.code}）` : `${equipment.name} ${equipment.code}`;
}

let seq = 20;
function nextId() {
  seq += 1;
  return `cc${seq}`;
}

export function CollectConfigPage() {
  const { rows, setRows, openL4 } = useCollectConfigs();
  const [draft, setDraft] = useState({ equipmentId: '', table: '', third: '' });
  const [query, setQuery] = useState(draft);
  const [editor, setEditor] = useState(null);
  const [confirmId, setConfirmId] = useState('');

  const filtered = rows.filter((row) => {
    if (query.equipmentId && row.equipmentId !== query.equipmentId) return false;
    const table = tableById(row.tableId);
    const third = thirdById(row.thirdId);
    if (query.table && !(table?.label || '').toLowerCase().includes(query.table.trim().toLowerCase())) return false;
    if (query.third && !(third?.label || '').toLowerCase().includes(query.third.trim().toLowerCase())) return false;
    return true;
  });

  const save = () => {
    const fieldKeys = editor.fieldKeys;
    const errors = {};
    if (!editor.equipmentId) errors.equipmentId = '请选择试验设备';
    if (!editor.tableId) errors.tableId = '请选择采集表名';
    if (!editor.thirdId) errors.thirdId = '请选择第三方试验表';
    if (!editor.times || editor.times < 1) errors.times = '请填写试验次数';
    if (!fieldKeys.length) errors.fieldKeys = '请至少勾选一个上位机字段';
    if (Object.keys(errors).length) {
      setEditor({ ...editor, errors });
      return;
    }
    setRows((current) => {
      if (!editor.id) {
        return [...current, {
          id: nextId(),
          equipmentId: editor.equipmentId,
          tableId: editor.tableId,
          thirdId: editor.thirdId,
          times: editor.times,
          remark: editor.remark.trim(),
          fieldKeys,
          l4Visible: [...fieldKeys],
        }];
      }
      return current.map((row) => (row.id === editor.id ? {
        ...row,
        equipmentId: editor.equipmentId,
        tableId: editor.tableId,
        thirdId: editor.thirdId,
        times: editor.times,
        remark: editor.remark.trim(),
        fieldKeys,
        l4Visible: syncL4Visible(fieldKeys, row.fieldKeys, row.l4Visible),
      } : row));
    });
    setEditor(null);
  };

  const toggleField = (key) => {
    const fieldKeys = editor.fieldKeys.includes(key)
      ? editor.fieldKeys.filter((item) => item !== key)
      : [...editor.fieldKeys, key];
    setEditor({ ...editor, fieldKeys, errors: { ...editor.errors, fieldKeys: '' } });
  };

  const catalog = hostFields(editor?.tableId);

  return (
    <div className="lk-page">
      <div className="lk-banner">
        这里勾选的是上位机采集字段。字段中文名与上位机保持一致，数采才能完成映射。App L4 显示哪些、按什么顺序，在「L4 字段展示」里单独配置，不会改这里的映射。
      </div>
      <div className="lk-head">
        <h1 className="lk-title"><span className="lk-title-bar" />设备采集配置</h1>
        <button
          type="button"
          className="lk-btn lk-btn-primary"
          onClick={() => setEditor({
            id: '',
            equipmentId: '',
            tableId: '',
            thirdId: '',
            times: 1,
            remark: '',
            fieldKeys: [],
            errors: {},
          })}
        >
          + 新增
        </button>
      </div>
      <div className="lk-filters">
        <label>设备名称
          <select value={draft.equipmentId} onChange={(event) => setDraft({ ...draft, equipmentId: event.target.value })}>
            <option value="">请选择</option>
            {EQUIPMENT.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>采集表名
          <input value={draft.table} placeholder="请输入" onChange={(event) => setDraft({ ...draft, table: event.target.value })} />
        </label>
        <label>第三方试验表
          <input value={draft.third} placeholder="请输入" onChange={(event) => setDraft({ ...draft, third: event.target.value })} />
        </label>
        <div className="lk-filter-actions">
          <button type="button" className="lk-btn" onClick={() => { const empty = { equipmentId: '', table: '', third: '' }; setDraft(empty); setQuery(empty); }}>重置</button>
          <button type="button" className="lk-btn lk-btn-primary" onClick={() => setQuery(draft)}>查询</button>
        </div>
      </div>
      <div className="cc-table">
        <div className="cc-tr cc-th">
          <span>序号</span><span>试验设备</span><span>采集表名</span><span>第三方试验表</span>
          <span>试验次数</span><span>试验字段</span><span>备注</span><span>操作</span>
        </div>
        {filtered.map((row, index) => (
          <div className="cc-tr" key={row.id}>
            <span className="is-muted">{index + 1}</span>
            <span>{equipmentName(row.equipmentId)}</span>
            <span>{tableById(row.tableId)?.label}</span>
            <span>{thirdById(row.thirdId)?.label}</span>
            <span>{row.times}</span>
            <span className="cc-keys" title={row.fieldKeys.join(',')}>{row.fieldKeys.join(',')}</span>
            <span>{row.remark || '—'}</span>
            <span className="cc-ops">
              <button
                type="button"
                className="lk-link"
                onClick={() => setEditor({
                  id: row.id,
                  equipmentId: row.equipmentId,
                  tableId: row.tableId,
                  thirdId: row.thirdId,
                  times: row.times,
                  remark: row.remark,
                  fieldKeys: [...row.fieldKeys],
                  errors: {},
                })}
              >
                编辑
              </button>
              <button type="button" className="lk-link" onClick={() => openL4(row.id)}>L4展示</button>
              <button type="button" className="lk-link is-danger" onClick={() => setConfirmId(row.id)}>删除</button>
            </span>
          </div>
        ))}
        {!filtered.length && <div className="cc-empty">没有符合条件的采集配置</div>}
        <div className="lk-pager"><span>共 {filtered.length} 条</span></div>
      </div>
      {editor && (
        <div className="lk-mask is-center" onMouseDown={() => setEditor(null)}>
          <div className="cc-dialog" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lk-drawer-hd">
              <b>{editor.id ? '编辑详情' : '新增详情'}</b>
              <button type="button" onClick={() => setEditor(null)}>×</button>
            </div>
            <div className="lk-dialog-bd">
              <label className="cc-req">试验设备
                <select
                  value={editor.equipmentId}
                  onChange={(event) => setEditor({ ...editor, equipmentId: event.target.value, errors: { ...editor.errors, equipmentId: '' } })}
                >
                  <option value="">请选择</option>
                  {EQUIPMENT.map((item) => <option key={item.id} value={item.id}>{equipmentName(item.id)}</option>)}
                </select>
                {editor.errors.equipmentId && <em>{editor.errors.equipmentId}</em>}
              </label>
              <label className="cc-req">采集表名
                <select
                  value={editor.tableId}
                  onChange={(event) => {
                    const table = COLLECT_TABLES.find((item) => item.id === event.target.value);
                    const allowed = new Set(hostFields(table?.id).map((field) => field.key));
                    setEditor({
                      ...editor,
                      tableId: event.target.value,
                      thirdId: table?.thirdId || editor.thirdId,
                      fieldKeys: editor.fieldKeys.filter((key) => allowed.has(key)),
                      errors: { ...editor.errors, tableId: '', thirdId: '' },
                    });
                  }}
                >
                  <option value="">请选择</option>
                  {COLLECT_TABLES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
                {editor.errors.tableId && <em>{editor.errors.tableId}</em>}
              </label>
              <label className="cc-req">第三方试验表
                <select
                  value={editor.thirdId}
                  onChange={(event) => setEditor({ ...editor, thirdId: event.target.value, errors: { ...editor.errors, thirdId: '' } })}
                >
                  <option value="">请选择</option>
                  {THIRD_TABLES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
                {editor.errors.thirdId && <em>{editor.errors.thirdId}</em>}
              </label>
              <label className="cc-req">试验次数
                <input
                  type="number"
                  min="1"
                  value={editor.times}
                  onChange={(event) => setEditor({ ...editor, times: Number(event.target.value), errors: { ...editor.errors, times: '' } })}
                />
                {editor.errors.times && <em>{editor.errors.times}</em>}
              </label>
              <div className="cc-fields">
                <div className="cc-fields-hd">
                  <span>试验字段</span>
                  <button
                    type="button"
                    className="lk-link"
                    disabled={!catalog.length}
                    onClick={() => setEditor({
                      ...editor,
                      fieldKeys: editor.fieldKeys.length === catalog.length ? [] : catalog.map((field) => field.key),
                      errors: { ...editor.errors, fieldKeys: '' },
                    })}
                  >
                    全选
                  </button>
                </div>
                <p>只能勾选该采集表里的上位机字段。中文名不可改，须与上位机一致。勾选与否决定能否映射，不决定 App 展示顺序。</p>
                <div className="cc-chips">
                  {catalog.map((field) => {
                    const on = editor.fieldKeys.includes(field.key);
                    return (
                      <button type="button" key={field.key} className={`cc-chip${on ? ' is-on' : ''}`} onClick={() => toggleField(field.key)}>
                        {fieldChip(field)}
                        {on && <i>×</i>}
                      </button>
                    );
                  })}
                  {!catalog.length && <span className="is-muted">请先选择采集表名</span>}
                </div>
                {editor.errors.fieldKeys && <em className="cc-err">{editor.errors.fieldKeys}</em>}
              </div>
              <label>备注
                <textarea
                  maxLength={100}
                  placeholder="请输入"
                  value={editor.remark}
                  onChange={(event) => setEditor({ ...editor, remark: event.target.value })}
                />
                <small>{editor.remark.length}/100</small>
              </label>
            </div>
            <div className="lk-drawer-ft">
              <button type="button" className="lk-btn" onClick={() => setEditor(null)}>取消</button>
              <button type="button" className="lk-btn lk-btn-primary" onClick={save}>确定</button>
            </div>
          </div>
        </div>
      )}
      {confirmId && (
        <div className="lk-mask is-center" onMouseDown={() => setConfirmId('')}>
          <div className="lk-dialog" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lk-drawer-hd"><b>删除采集配置</b><button type="button" onClick={() => setConfirmId('')}>×</button></div>
            <div className="lk-dialog-bd">删除后，该设备采集表的上位机字段映射和 L4 展示配置会一起去掉。</div>
            <div className="lk-drawer-ft">
              <button type="button" className="lk-btn" onClick={() => setConfirmId('')}>取消</button>
              <button
                type="button"
                className="lk-btn lk-btn-primary"
                onClick={() => {
                  setRows((current) => current.filter((row) => row.id !== confirmId));
                  setConfirmId('');
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function L4FieldPage() {
  const { rows, setRows, focusId, setFocusId } = useCollectConfigs();
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!focusId) return;
    setActiveId(focusId);
    setFocusId('');
  }, [focusId, setFocusId]);

  const active = rows.find((row) => row.id === activeId) || null;

  const move = (key, direction) => {
    setRows((current) => current.map((row) => {
      if (row.id !== activeId) return row;
      const order = [...row.l4Visible];
      const index = order.indexOf(key);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= order.length) return row;
      const [item] = order.splice(index, 1);
      order.splice(next, 0, item);
      return { ...row, l4Visible: order };
    }));
  };

  const hide = (key) => {
    setRows((current) => current.map((row) => (row.id === activeId
      ? { ...row, l4Visible: row.l4Visible.filter((item) => item !== key) }
      : row)));
  };

  const show = (key) => {
    setRows((current) => current.map((row) => (row.id === activeId && !row.l4Visible.includes(key)
      ? { ...row, l4Visible: [...row.l4Visible, key] }
      : row)));
  };

  return (
    <div className="lk-page">
      <div className="lk-head">
        <h1 className="lk-title"><span className="lk-title-bar" />L4 字段展示</h1>
      </div>
      <div className="lk-banner">
        只控制数采 App L4 试验字段的显示和顺序。可选范围是「设备采集配置」里已经勾选、且中文名与上位机一致的字段。在这里隐藏或排序，不会改变上位机映射。
      </div>
      <div className="cc-table">
        <div className="cc-tr l4-tr cc-th">
          <span>试验设备</span><span>采集表名</span><span>L4 展示字段</span><span>隐藏</span><span>操作</span>
        </div>
        {rows.map((row) => {
          const hidden = row.fieldKeys.filter((key) => !row.l4Visible.includes(key));
          const names = row.l4Visible.map((key) => fieldByKey(row.tableId, key)?.name).filter(Boolean);
          return (
            <div className="cc-tr l4-tr" key={row.id}>
              <span>{equipmentName(row.equipmentId)}</span>
              <span>{tableById(row.tableId)?.label}</span>
              <span className="cc-keys" title={names.join('、')}>{names.join('、') || '全部隐藏'}</span>
              <span>{hidden.length ? `${hidden.length} 个` : '—'}</span>
              <span className="cc-ops">
                <button type="button" className="lk-link" onClick={() => setActiveId(row.id)}>调整</button>
              </span>
            </div>
          );
        })}
      </div>
      {active && (
        <div className="lk-mask" onMouseDown={() => setActiveId('')}>
          <aside className="lk-drawer l4-drawer" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lk-drawer-hd">
              <b>调整 L4 展示</b>
              <button type="button" onClick={() => setActiveId('')}>×</button>
            </div>
            <div className="lk-drawer-bd">
              <div className="lk-note">
                {equipmentName(active.equipmentId)} · {tableById(active.tableId)?.label}
                <br />
                映射字段 {active.fieldKeys.length} 个，当前展示 {active.l4Visible.length} 个。
              </div>
              <div className="l4-block-title">展示中 · 上到下即 App 顺序</div>
              {active.l4Visible.map((key, index) => {
                const field = fieldByKey(active.tableId, key);
                return (
                  <div className="l4-row" key={key}>
                    <span className="l4-index">{index + 1}</span>
                    <span>
                      <b>{field?.name}</b>
                      <small>{fieldChip(field)}</small>
                    </span>
                    <span className="l4-row-ops">
                      <button type="button" disabled={index === 0} onClick={() => move(key, -1)}>上移</button>
                      <button type="button" disabled={index === active.l4Visible.length - 1} onClick={() => move(key, 1)}>下移</button>
                      <button type="button" onClick={() => hide(key)}>隐藏</button>
                    </span>
                  </div>
                );
              })}
              {!active.l4Visible.length && <div className="cc-empty">当前没有展示字段</div>}
              <div className="l4-block-title">不在 L4 展示</div>
              {active.fieldKeys.filter((key) => !active.l4Visible.includes(key)).map((key) => {
                const field = fieldByKey(active.tableId, key);
                return (
                  <div className="l4-row is-hidden" key={key}>
                    <span />
                    <span>
                      <b>{field?.name}</b>
                      <small>{fieldChip(field)}</small>
                    </span>
                    <span className="l4-row-ops">
                      <button type="button" onClick={() => show(key)}>展示</button>
                    </span>
                  </div>
                );
              })}
              {active.fieldKeys.every((key) => active.l4Visible.includes(key)) && <div className="cc-empty">映射字段已全部展示</div>}
              <div className="l4-preview">
                <div className="l4-block-title">App L4 预览</div>
                {active.l4Visible.map((key) => (
                  <div className="l4-preview-row" key={key}>
                    <span>{fieldByKey(active.tableId, key)?.name}</span>
                    <i>请输入</i>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
