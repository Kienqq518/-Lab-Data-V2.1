export const PHASES = [
  { value: '红', color: 'var(--danger,#e23b3b)' },
  { value: '黄', color: 'var(--status-pending,#e8a93a)' },
  { value: '绿', color: 'var(--status-done,#1faa54)' },
];

const FLOW_LOCK_AFTER = ['组内审核', '数据审核', '报告编制', '报告审核', '报告签发', '报告处理', '收费审批', '报告发放', '任务归档', '任务完成'];

export function isCompositeItem(item) {
  return !!(item && Array.isArray(item.subs) && item.subs.length);
}

export function makeId(prefix, text, index = 0) {
  const body = String(text || index + 1)
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '')
    .slice(0, 24);
  return `${prefix}-${body || index + 1}`;
}

export function getSubItems(ctx) {
  const item = ctx?.item || {};
  if (isCompositeItem(item)) {
    return item.subs.map((sub, index) => ({
      ...sub,
      id: sub.id || makeId('sub', sub.name, index),
      method: sub.method || sub.device?.method || 'manual',
      fields: Array.isArray(sub.fields) ? sub.fields : [],
      device: normalizeDevice(sub.device, sub.method, index),
      candidateDevices: (sub.candidateDevices || []).map((d, i) => normalizeDevice(d, d.method || sub.method, i)),
    }));
  }

  const device = normalizeDevice(ctx?.device, ctx?.method || ctx?.device?.method, 0);
  return [{
    id: item.id || makeId('sub', item.name, 0),
    name: item.name || '试验数据',
    method: ctx?.method || device.method || 'manual',
    fields: item.fields || [],
    phased: !!item.phased,
    count: item.count,
    perPhase: item.perPhase,
    device,
    candidateDevices: [],
  }];
}

export function normalizeDevice(device, method = 'manual', index = 0) {
  const d = device || {};
  return {
    id: d.id || d.code || makeId('device', d.name || 'unknown', index),
    name: d.name || '未配置设备',
    code: d.code || '—',
    model: d.model || '—',
    method: d.method || method || 'manual',
    station: d.station ?? null,
  };
}

export function getPhases(sub) {
  return sub?.phased ? PHASES : [];
}

export function getRepeatCount(sub) {
  if (sub?.phased) return Math.max(1, Number(sub.perPhase ?? 1));
  return Math.max(1, Number(sub?.count ?? 1));
}

export function getCellKey(cell) {
  return [cell.subItemId, cell.phase || 'none', cell.repeatIndex].join('__');
}

export function createCollectCells(ctx) {
  const item = ctx?.item || {};
  return getSubItems(ctx).flatMap((sub) => {
    const device = sub.device;
    const itemFlow = ctx?.flow || ctx?.item?.flow;
    const hasExistingData = ctx?.status === 'done' || isFlowReturned(itemFlow);
    const phases = getPhases(sub);
    const repeats = getRepeatCount(sub);
    const rows = phases.length
      ? phases.flatMap((phase) => Array.from({ length: repeats }, (_, repeatIndex) => ({ phase: phase.value, repeatIndex })))
      : Array.from({ length: repeats }, (_, repeatIndex) => ({ phase: null, repeatIndex }));

    return rows.map((row) => {
      const cell = {
        testItemId: item.id || item.name || 'test-item',
        subItemId: sub.id,
        subName: sub.name,
        deviceId: hasExistingData ? device.id : null,
        phase: row.phase,
        repeatIndex: row.repeatIndex,
        status: hasExistingData ? 'uploaded' : 'idle',
        vals: {},
        attachments: [],
        source: hasExistingData ? device.method || sub.method : null,
        collectedAt: null,
        uploadedAt: hasExistingData ? '2026-06-24 16:02:10' : null,
        operatorId: 'demo-operator',
      };
      return { ...cell, key: getCellKey(cell) };
    });
  });
}

export function summarizeCells(cells) {
  const list = Object.values(cells || {});
  const total = list.length;
  const filled = list.filter((c) => c.status === 'filled' || c.status === 'uploaded' || c.status === 'failed').length;
  const uploaded = list.filter((c) => c.status === 'uploaded').length;
  const failed = list.filter((c) => c.status === 'failed').length;
  const pendingUpload = list.filter((c) => c.status === 'filled' || c.status === 'failed').length;
  const inspectState = total > 0 && uploaded === total ? 'done' : uploaded > 0 ? 'doing' : 'todo';

  const bySub = list.reduce((acc, cell) => {
    const cur = acc[cell.subItemId] || { total: 0, filled: 0, uploaded: 0, failed: 0, pendingUpload: 0, state: 'pending', label: '待采集' };
    cur.total += 1;
    if (cell.status === 'filled' || cell.status === 'uploaded' || cell.status === 'failed') cur.filled += 1;
    if (cell.status === 'uploaded') cur.uploaded += 1;
    if (cell.status === 'failed') cur.failed += 1;
    if (cell.status === 'filled' || cell.status === 'failed') cur.pendingUpload += 1;
    cur.state = cur.failed > 0 ? 'failed' : cur.uploaded === cur.total ? 'uploaded' : cur.filled > 0 ? 'doing' : 'pending';
    cur.label = cur.failed > 0 ? '上传失败' : cur.uploaded === cur.total ? '已上传' : cur.filled > 0 ? '待上传' : '待采集';
    acc[cell.subItemId] = cur;
    return acc;
  }, {});

  return { total, filled, uploaded, failed, pendingUpload, inspectState, allUploaded: total > 0 && uploaded === total, bySub };
}

export function getMethodCapabilities(method, ocrVerified = true) {
  const ocrReady = method === 'ocr' && ocrVerified !== false;
  return {
    canBatch: method === 'auto' || method === 'external',
    canCollectOne: method === 'ble' || ocrReady,
    canEdit: method === 'ble' || method === 'manual' || method === 'external' || (method === 'ocr' && !ocrReady),
    canAttach: method === 'external' || ocrReady,
    isReadOnlySource: method === 'auto',
    ocrReady,
  };
}

export function isFlowLocked(flow) {
  return FLOW_LOCK_AFTER.includes(flow?.node);
}

export function isFlowReturned(flow) {
  return !isFlowLocked(flow) && !!flow?.returned;
}

/** 计算 L4 右上角状态水印（退回复测在未修改/重置前不展示） */
export function resolveInspectStampState({ flowReturned, returnTouched, filledCount, uploadedCount, total }) {
  if (flowReturned && !returnTouched) return null;
  if (flowReturned && returnTouched) {
    if (filledCount === 0) return 'todo';
    if (total > 0 && uploadedCount >= total) return 'done';
    return 'doing';
  }
  if (total > 0 && uploadedCount >= total) return 'done';
  if (uploadedCount > 0 || filledCount > 0) return 'doing';
  return 'todo';
}

export function toCellMap(cells) {
  return Object.fromEntries((cells || []).map((cell) => [cell.key, cell]));
}

export function updateCell(cells, key, updater) {
  const cell = cells[key];
  if (!cell) return cells;
  return { ...cells, [key]: updater(cell) };
}

export function markCellFilled(cells, key, vals, options = {}) {
  return updateCell(cells, key, (cell) => ({
    ...cell,
    vals: vals ?? cell.vals,
    status: 'filled',
    uploadedAt: null,
    collectedAt: options.collectedAt || cell.collectedAt || '2026-07-04 12:00:00',
    deviceId: options.deviceId || cell.deviceId,
    source: options.source || cell.source,
  }));
}

export function markCellUploaded(cells, key) {
  return updateCell(cells, key, (cell) => ({
    ...cell,
    status: 'uploaded',
    uploadedAt: '2026-07-04 12:02:00',
  }));
}

export function markCellFailed(cells, key) {
  return updateCell(cells, key, (cell) => ({
    ...cell,
    status: 'failed',
  }));
}
