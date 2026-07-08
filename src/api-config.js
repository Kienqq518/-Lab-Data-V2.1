/** 数采 Web 端 API 基址在 localStorage 中的键名 */
const STORAGE_KEY = 'labdata_api_base_url';

/** 默认数采环境地址（演示） */
const DEFAULT_API_BASE_URL = 'http://8.149.129.137:8086/api/';

/**
 * 规范化用户输入的 API 基址：补全协议、去除首尾空格、保证以 / 结尾
 * @param {string} raw 用户输入
 * @returns {string} 规范化后的 URL
 */
export function normalizeApiBaseUrl(raw) {
  let url = String(raw || '').trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  if (!url.endsWith('/')) url += '/';
  return url;
}

/**
 * 读取当前配置的数采 Web API 基址
 * @returns {string}
 */
export function getApiBaseUrl() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeApiBaseUrl(saved);
  } catch {
    /* 非浏览器环境忽略 */
  }
  return DEFAULT_API_BASE_URL;
}

/**
 * 保存数采 Web API 基址
 * @param {string} raw 用户输入
 * @returns {string} 保存后的规范化地址
 */
export function setApiBaseUrl(raw) {
  const normalized = normalizeApiBaseUrl(raw);
  if (!normalized) throw new Error('empty');
  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    /* 忽略存储失败 */
  }
  return normalized;
}

export { DEFAULT_API_BASE_URL, STORAGE_KEY };
