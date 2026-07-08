import { homeAnnotations } from './pages/home.js';
import { inspectAnnotations } from './pages/inspect.js';
import { focusAnnotations } from './pages/focus.js';

/** 按页面 key 聚合批注配置 */
const REGISTRY = {
  home: homeAnnotations,
  'inspect-l1': inspectAnnotations,
  'inspect-l3': inspectAnnotations,
  'focus-returned': focusAnnotations,
  notify: focusAnnotations,
};

/**
 * 读取指定页面下的批注项
 * @param {string} pageKey 页面标识
 * @param {string} annotationId 批注锚点 id
 * @returns {object|null}
 */
export function getAnnotation(pageKey, annotationId) {
  const page = REGISTRY[pageKey];
  if (!page) return null;
  return page[annotationId] || null;
}

export { REGISTRY };
