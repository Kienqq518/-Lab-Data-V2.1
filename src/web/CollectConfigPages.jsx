import React, { createContext, useContext, useMemo, useState } from 'react';
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

export function CollectConfigProvider({ children }) {
  const [rows, setRows] = useState(INITIAL_COLLECT_CONFIGS);
  const value = useMemo(() => ({ rows, setRows }), [rows]);
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

function keptOnApp(fieldKeys, l4Visible) {
  return (l4Visible || []).filter((key) => fieldKeys.includes(key));
}

export function CollectConfigPage() {
  const { rows, setRows } = useCollectConfigs();
  const [draft, setDraft] = useState({ equipmentId: '', table: '', third: '' });
  const [query, setQuery] = useState(draft);
  const [editor, setEditor] = useState(null);
  const [sorter, setSorter] = useState(null);
  const [sortQuery, setSortQuery] = useState('');
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
          l4Visible: keptOnApp(fieldKeys, editor.l4Visible),
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
        l4Visible: keptOnApp(fieldKeys, editor.l4Visible),
      } : row));
    });
    closeEditor();
  };

  const toggleField = (key) => {
    const selected = editor.fieldKeys.includes(key);
    const fieldKeys = selected
      ? editor.fieldKeys.filter((item) => item !== key)
      : [...editor.fieldKeys, key];
    const l4Visible = selected
      ? editor.l4Visible.filter((item) => item !== key)
      : editor.l4Visible.includes(key) ? editor.l4Visible : [...editor.l4Visible, key];
    setEditor({ ...editor, fieldKeys, l4Visible, errors: { ...editor.errors, fieldKeys: '' } });
  };

  const closeEditor = () => {
    setEditor(null);
    setSorter(null);
    setSortQuery('');
  };

  const closeSorter = () => {
    setSorter(null);
    setSortQuery('');
  };

  const toggleSorter = (key) => {
    setSorter((current) => (current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key]));
  };

  const toggleSorterAll = (keys) => {
    setSorter((current) => {
      const allOn = keys.length > 0 && keys.every((key) => current.includes(key));
      if (allOn) return current.filter((key) => !keys.includes(key));
      const next = [...current];
      keys.forEach((key) => {
        if (!next.includes(key)) next.push(key);
      });
      return next;
    });
  };

  const moveSorter = (key, direction) => {
    setSorter((current) => {
      const order = [...current];
      const index = order.indexOf(key);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= order.length) return current;
      const [item] = order.splice(index, 1);
      order.splice(next, 0, item);
      return order;
    });
  };

  const catalog = hostFields(editor?.tableId);

  return (
    <div className="lk-page">
      <div className="lk-banner">
        这里勾选的是上位机采集字段。中文名与上位机一致才能完成映射。勾选之后，用「筛选排序」决定数采 App 保留哪些字段，以及它们的展示顺序。
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
            l4Visible: [],
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
                  l4Visible: keptOnApp(row.fieldKeys, row.l4Visible),
                  errors: {},
                })}
              >
                编辑
              </button>
              <button type="button" className="lk-link is-danger" onClick={() => setConfirmId(row.id)}>删除</button>
            </span>
          </div>
        ))}
        {!filtered.length && <div className="cc-empty">没有符合条件的采集配置</div>}
        <div className="lk-pager"><span>共 {filtered.length} 条</span></div>
      </div>
      {editor && (
        <div className="lk-mask is-center" onMouseDown={closeEditor}>
          <div className="cc-dialog" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lk-drawer-hd">
              <b>{editor.id ? '编辑详情' : '新增详情'}</b>
              <button type="button" onClick={closeEditor}>×</button>
            </div>
            <div className="lk-dialog-bd">
              <label>
                <span className="cc-req">试验设备</span>
                <select
                  value={editor.equipmentId}
                  onChange={(event) => setEditor({ ...editor, equipmentId: event.target.value, errors: { ...editor.errors, equipmentId: '' } })}
                >
                  <option value="">请选择</option>
                  {EQUIPMENT.map((item) => <option key={item.id} value={item.id}>{equipmentName(item.id)}</option>)}
                </select>
                {editor.errors.equipmentId && <em>{editor.errors.equipmentId}</em>}
              </label>
              <label>
                <span className="cc-req">采集表名</span>
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
                      l4Visible: editor.l4Visible.filter((key) => allowed.has(key)),
                      errors: { ...editor.errors, tableId: '', thirdId: '' },
                    });
                  }}
                >
                  <option value="">请选择</option>
                  {COLLECT_TABLES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
                {editor.errors.tableId && <em>{editor.errors.tableId}</em>}
              </label>
              <label>
                <span className="cc-req">第三方试验表</span>
                <select
                  value={editor.thirdId}
                  onChange={(event) => setEditor({ ...editor, thirdId: event.target.value, errors: { ...editor.errors, thirdId: '' } })}
                >
                  <option value="">请选择</option>
                  {THIRD_TABLES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
                {editor.errors.thirdId && <em>{editor.errors.thirdId}</em>}
              </label>
              <label>
                <span className="cc-req">试验次数</span>
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
                  <span className="cc-fields-actions">
                    <button
                      type="button"
                      className="lk-link"
                      disabled={!catalog.length}
                      onClick={() => {
                        const all = catalog.map((field) => field.key);
                        const clear = editor.fieldKeys.length === catalog.length;
                        setEditor({
                          ...editor,
                          fieldKeys: clear ? [] : all,
                          l4Visible: clear ? [] : syncL4Visible(all, editor.fieldKeys, editor.l4Visible),
                          errors: { ...editor.errors, fieldKeys: '' },
                        });
                      }}
                    >
                      全选
                    </button>
                    <button
                      type="button"
                      className="lk-link"
                      disabled={!editor.fieldKeys.length}
                      onClick={() => {
                        setSortQuery('');
                        setSorter(keptOnApp(editor.fieldKeys, editor.l4Visible));
                      }}
                    >
                      筛选排序
                    </button>
                  </span>
                </div>
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
              <button type="button" className="lk-btn" onClick={closeEditor}>取消</button>
              <button type="button" className="lk-btn lk-btn-primary" onClick={save}>确定</button>
            </div>
          </div>
        </div>
      )}
      {editor && sorter && (
        <FilterSortDialog
          editor={editor}
          sorter={sorter}
          query={sortQuery}
          onQuery={setSortQuery}
          onClose={closeSorter}
          onToggle={toggleSorter}
          onToggleAll={toggleSorterAll}
          onMove={moveSorter}
          onConfirm={() => {
            setEditor({ ...editor, l4Visible: sorter });
            closeSorter();
          }}
        />
      )}
      {confirmId && (
        <div className="lk-mask is-center" onMouseDown={() => setConfirmId('')}>
          <div className="lk-dialog" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lk-drawer-hd"><b>删除采集配置</b><button type="button" onClick={() => setConfirmId('')}>×</button></div>
            <div className="lk-dialog-bd">删除后，该设备采集表的上位机字段映射和数采 App 展示配置会一起去掉。</div>
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

function FilterSortDialog({ editor, sorter, query, onQuery, onClose, onToggle, onToggleAll, onMove, onConfirm }) {
  const pool = hostFields(editor.tableId).filter((field) => editor.fieldKeys.includes(field.key));
  const keyword = query.trim().toLowerCase();
  const filtered = pool.filter((field) => !keyword
    || field.key.toLowerCase().includes(keyword)
    || field.name.toLowerCase().includes(keyword));
  const allOn = filtered.length > 0 && filtered.every((field) => sorter.includes(field.key));

  return (
    <div className="lk-mask is-center is-front" onMouseDown={onClose}>
      <div className="cc-sort" onMouseDown={(event) => event.stopPropagation()}>
        <div className="lk-drawer-hd">
          <b>筛选排序</b>
          <button type="button" onClick={onClose}>×</button>
        </div>
        <div className="cc-sort-bd">
          <section className="cc-sort-col">
            <div className="cc-sort-tools">
              <h3>选择字段<span>{pool.length}</span></h3>
              <label className="cc-sort-all">
                <input type="checkbox" checked={allOn} disabled={!filtered.length} onChange={() => onToggleAll(filtered.map((field) => field.key))} />
                全选
              </label>
            </div>
            <input
              className="cc-sort-search"
              value={query}
              placeholder="输入中文名或英文名"
              onChange={(event) => onQuery(event.target.value)}
            />
            <div className="cc-sort-table">
              {filtered.map((field) => {
                const on = sorter.includes(field.key);
                return (
                  <label className={`cc-sort-check${on ? ' is-on' : ''}`} key={field.key}>
                    <input type="checkbox" checked={on} onChange={() => onToggle(field.key)} />
                    <b>{field.key}</b>
                    <span>{field.name}</span>
                  </label>
                );
              })}
              {!filtered.length && <div className="cc-empty">{pool.length ? '没有匹配的字段' : '请先勾选上位机字段'}</div>}
            </div>
          </section>
          <section className="cc-sort-col">
            <h3>预览<span>{sorter.length}</span></h3>
            <div className="cc-sort-table">
              <div className="cc-sort-tr is-head">
                <span>序号</span>
                <span>英文名</span>
                <span>中文名</span>
                <span>排序</span>
              </div>
              {sorter.map((key, index) => {
                const field = fieldByKey(editor.tableId, key);
                return (
                  <div className="cc-sort-tr" key={key}>
                    <span className="is-muted">{index + 1}</span>
                    <b>{field?.key}</b>
                    <span>{field?.name}</span>
                    <span className="cc-sort-ops">
                      <button type="button" disabled={index === 0} onClick={() => onMove(key, -1)}>上移</button>
                      <button type="button" disabled={index === sorter.length - 1} onClick={() => onMove(key, 1)}>下移</button>
                    </span>
                  </div>
                );
              })}
              {!sorter.length && <div className="cc-empty">勾选后在这里预览顺序</div>}
            </div>
          </section>
        </div>
        <div className="lk-drawer-ft">
          <button type="button" className="lk-btn" onClick={onClose}>取消</button>
          <button type="button" className="lk-btn lk-btn-primary" onClick={onConfirm}>确定</button>
        </div>
      </div>
    </div>
  );
}
