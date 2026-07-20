/**
 * 样品编号转换规则库
 *
 * 对接第三方 LIMS 时，原编号可能含汉字、特殊符号或超长字符串，影响上位机兼容性。
 * 后端维护转换规则，生成标准化 ID 用于系统交互；App 展示「转换后编号（原编号）」。
 * 开关由数采 Web「系统设置 · 系统参数」控制，App 只读消费。
 */

const STORAGE_KEY = 'labdata_sample_code_conversion_enabled';

/** 默认转换规则（数采 Web「系统参数」维护，App 通过 API 同步） */
export const DEFAULT_CONVERSION_RULES = [
  { id: 'r1', name: '片段拼接', type: 'segment_join', pattern: '', replacement: '', priority: 1,
    desc: '提取字母数字片段，以 / 或 - 拼接为唯一标准编码' },
  { id: 'r2', name: '长度截断', type: 'max_length', pattern: '', replacement: '32', priority: 2,
    desc: '标准化编号最大 32 字符（上位机兼容）' },
];

/** 默认配置：启用转换（演示第三方 LIMS 场景） */
export const DEFAULT_CONVERSION_CONFIG = {
  enabled: true,
  rules: DEFAULT_CONVERSION_RULES,
};

/** 读取本地缓存的开关状态（原型演示；生产由 API 下发） */
export function isConversionEnabled() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === null) return DEFAULT_CONVERSION_CONFIG.enabled;
    return v === 'true';
  } catch {
    return DEFAULT_CONVERSION_CONFIG.enabled;
  }
}

/** 写入开关状态（Web 端保存后 App 通过 API 同步） */
export function setConversionEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch { /* ignore */ }
}

/** 简单哈希，用于生成短唯一后缀 */
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).toUpperCase().slice(0, 6);
}

/** 提取字母数字片段 */
function extractTokens(text) {
  return (String(text || '').match(/[A-Za-z0-9]+/g) || []).filter(Boolean);
}

/** 合并 SC + 年份 → SC2026 */
function normalizeTokens(tokens) {
  const t = [...tokens];
  if (t[0] === 'SC' && t[1] && /^\d{4}$/.test(t[1])) {
    t.splice(0, 2, `SC${t[1]}`);
  }
  return t;
}

/**
 * 判断编号是否已为标准格式（无需转换）
 * 规则：/ - _ 仅作为字母数字片段之间的单分隔符，不可连续或首尾出现
 */
export function isStandardSampleCode(code) {
  if (!code || code.length > 32) return false;
  return /^[A-Za-z0-9]+([/_-][A-Za-z0-9]+)*$/.test(code);
}

/** 将 token 列表拼接为标准 ID */
function joinTokens(tokens, maxLen = 32) {
  if (!tokens.length) return '';
  const parts = normalizeTokens(tokens);
  let suffix = '';
  if (parts.length >= 2 && /^\d{1,3}$/.test(parts[parts.length - 1])) {
    suffix = parts.pop().padStart(2, '0');
  }
  const main = parts.join('/');
  let result = main && suffix ? `${main}-${suffix}` : (main || suffix);
  if (result.length > maxLen) {
    if (suffix) {
      const budget = Math.max(maxLen - suffix.length - 1, 4);
      result = `${main.slice(0, budget)}-${suffix}`;
    } else {
      result = result.slice(0, maxLen);
    }
  }
  return result;
}

/** 尝试保留原编码中的 / 分段结构 */
function convertPreserveSlashes(originalCode, maxLen) {
  if (!originalCode.includes('/')) return '';
  const segs = originalCode.split('/').map((seg) => joinTokens(extractTokens(seg), maxLen)).filter(Boolean);
  if (!segs.length) return '';
  const result = segs.join('/');
  return isStandardSampleCode(result) && result.length <= maxLen ? result : '';
}

/** 为非标来源追加唯一性片段（哈希 4 位） */
function ensureUnique(base, originalCode) {
  const h = hashCode(originalCode).slice(0, 4);
  if (base.includes('-')) {
    const idx = base.lastIndexOf('-');
    return `${base.slice(0, idx)}/${h}-${base.slice(idx + 1)}`;
  }
  return `${base}/${h}`;
}

function getMaxLen(config) {
  const rule = (config?.rules || DEFAULT_CONVERSION_RULES).find((r) => r.type === 'max_length' && r.on !== false);
  return parseInt(rule?.replacement, 10) || 32;
}

/** 按规则库将原编号转换为标准化唯一 ID */
export function convertSampleCode(originalCode, config = DEFAULT_CONVERSION_CONFIG) {
  if (!originalCode) return '';
  if (isStandardSampleCode(originalCode)) return originalCode;

  const maxLen = getMaxLen(config);

  const preserved = convertPreserveSlashes(originalCode, maxLen);
  if (preserved) return preserved;

  const tokens = extractTokens(originalCode);
  let result = joinTokens(tokens, maxLen);

  if (!result || !isStandardSampleCode(result)) {
    result = `TP/${hashCode(originalCode)}`;
  } else {
    result = ensureUnique(result, originalCode);
    if (result.length > maxLen) {
      result = result.slice(0, maxLen).replace(/[/\-_]+$/, '');
    }
  }

  return isStandardSampleCode(result) ? result : `TP/${hashCode(originalCode)}`;
}

/**
 * 解析样品编号
 * @returns {{ originalCode, standardCode, systemId, displayCode, converted, qrPayload }}
 */
export function resolveSampleCode(sample, config) {
  const cfg = config ?? { ...DEFAULT_CONVERSION_CONFIG, enabled: isConversionEnabled() };
  const originalCode = sample?.originalCode || sample?.code || '';
  const enabled = !!cfg.enabled;

  if (!enabled || isStandardSampleCode(originalCode)) {
    return {
      originalCode,
      standardCode: originalCode,
      systemId: originalCode,
      displayCode: originalCode,
      converted: false,
      qrPayload: originalCode,
    };
  }

  const standardCode = sample?.standardCode || convertSampleCode(originalCode, cfg);
  const converted = standardCode !== originalCode;

  return {
    originalCode,
    standardCode,
    systemId: standardCode,
    displayCode: converted ? `${standardCode}（${originalCode}）` : originalCode,
    converted,
    qrPayload: originalCode,
  };
}

/** 格式化展示文本：转换后编号（原编号） */
export function formatSampleCodeDisplay(sample, config) {
  return resolveSampleCode(sample, config).displayCode;
}

/** 上位机/系统交互用 ID */
export function sampleSystemId(sample, config) {
  return resolveSampleCode(sample, config).systemId;
}

/** 多试样/多芯子编号（基于标准化 ID） */
export function sampleCodeForCell(sample, index, config) {
  const base = String(sampleSystemId(sample, config) || 'SC2026/01001-01').replace(/-\d+$/, '');
  return `${base}-${String(index + 1).padStart(2, '0')}`;
}

/** 搜索匹配：同时匹配原编号与转换后编号 */
export function sampleCodeMatchesKeyword(sample, keyword, config) {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return true;
  const resolved = resolveSampleCode(sample, config);
  return resolved.originalCode.toLowerCase().includes(kw)
    || resolved.standardCode.toLowerCase().includes(kw)
    || resolved.displayCode.toLowerCase().includes(kw);
}
