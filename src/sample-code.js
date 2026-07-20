/**
 * 样品编号转换规则库
 *
 * 对接第三方 LIMS 时，原编号可能含汉字、特殊符号或超长字符串，影响上位机兼容性。
 * 后端维护转换规则，生成标准化 ID 用于系统交互；App 展示「转换后编号（原编号）」。
 * 开关由数采 Web「系统设置」控制，App 只读消费。
 */

const STORAGE_KEY = 'labdata_sample_code_conversion_enabled';

/** 默认转换规则（数采 Web「系统设置」维护，App 通过 API 同步） */
export const DEFAULT_CONVERSION_RULES = [
  { id: 'r1', name: '去除非法字符', type: 'sanitize', pattern: '', replacement: '', priority: 1,
    desc: '仅保留 A-Z、a-z、0-9、-、_，其余替换为 _' },
  { id: 'r2', name: '统一前缀', type: 'prefix', pattern: '', replacement: 'SC2026TP', priority: 2,
    desc: '为标准化编号添加系统前缀' },
  { id: 'r3', name: '长度截断', type: 'max_length', pattern: '', replacement: '32', priority: 3,
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

/** 判断编号是否已为标准格式（无需转换） */
export function isStandardSampleCode(code) {
  if (!code) return true;
  return /^[A-Za-z0-9/_-]+$/.test(code) && code.length <= 32;
}

/** 按规则库将原编号转换为标准化 ID */
export function convertSampleCode(originalCode, config = DEFAULT_CONVERSION_CONFIG) {
  if (!originalCode) return '';
  if (isStandardSampleCode(originalCode)) return originalCode;

  const rules = [...(config.rules || DEFAULT_CONVERSION_RULES)].sort((a, b) => a.priority - b.priority);
  let result = originalCode;

  for (const rule of rules) {
    switch (rule.type) {
      case 'sanitize':
        result = result.replace(/[^A-Za-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
        break;
      case 'regex_replace':
        if (rule.pattern) {
          try {
            result = result.replace(new RegExp(rule.pattern, 'g'), rule.replacement || '');
          } catch { /* invalid regex */ }
        }
        break;
      case 'prefix':
        if (rule.replacement && !result.startsWith(rule.replacement)) {
          result = rule.replacement + hashCode(originalCode);
        }
        break;
      case 'max_length': {
        const max = parseInt(rule.replacement, 10) || 32;
        if (result.length > max) result = result.slice(0, max);
        break;
      }
      default:
        break;
    }
  }

  if (!result) result = 'SC' + hashCode(originalCode);
  return result;
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
