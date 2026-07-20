/** OCR 试验场景：规则匹配、默认选中、字段合并、附件按场景覆盖 */

export function getPassedScenarios(ocrScenarios) {
  return (ocrScenarios || []).filter((s) => s.status === 'passed');
}

export function getDefaultScenario(ocrScenarios) {
  const passed = getPassedScenarios(ocrScenarios);
  if (!passed.length) return null;
  return passed.slice().sort((a, b) => {
    const ta = a.passedAt ? Date.parse(a.passedAt) : Infinity;
    const tb = b.passedAt ? Date.parse(b.passedAt) : Infinity;
    return ta - tb;
  })[0];
}

export function mergeOcrFields(existingVals, newVals, fieldKeys) {
  const next = { ...(existingVals || {}) };
  (fieldKeys || []).forEach((key) => {
    if (newVals[key] != null && newVals[key] !== '') next[key] = newVals[key];
  });
  return next;
}

export function upsertScenarioAttachment(attachments, scenario, newAttachment) {
  const list = Array.isArray(attachments) ? attachments : [];
  const rest = list.filter((a) => a.scenario !== scenario);
  return [...rest, { ...newAttachment, scenario }];
}

export function removeScenarioAttachment(attachments, scenarioOrId) {
  const list = Array.isArray(attachments) ? attachments : [];
  return list.filter((a) => a.scenario !== scenarioOrId && a.id !== scenarioOrId);
}

export function getAttachmentForScenario(attachments, scenario) {
  return (attachments || []).find((a) => a.scenario === scenario) || null;
}

export function clearScenarioFields(vals, fieldKeys) {
  const next = { ...(vals || {}) };
  (fieldKeys || []).forEach((key) => { delete next[key]; });
  return next;
}

export function sortAttachmentsByScenario(attachments) {
  return (attachments || []).slice().sort((a, b) => (a.scenario || '').localeCompare(b.scenario || '', 'zh-CN'));
}

/** 从规则 DSL 提取字段 key 列表（mock 用） */
export function parseRuleFieldKeys(rule) {
  if (!rule || rule === '（未配置）') return [];
  return rule.split(',').map((part) => {
    const seg = part.trim().split('-')[0];
    return seg || null;
  }).filter(Boolean);
}
