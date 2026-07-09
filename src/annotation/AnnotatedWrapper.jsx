import React from 'react';
import { useAnnotation, useEffectivePageKey } from './AnnotationContext.jsx';
import { getAnnotation } from './registry.js';

/**
 * 有 overlay 打开时，仅注册位于 .overlay-screen 内的锚点，
 * 避免底层 L1/L2/L3 批注抢占多子项 L4 等上层页面的交互与展示。
 */
function isInActiveLayer(el) {
  if (!el || typeof document === 'undefined') return false;
  const overlays = document.querySelectorAll('.overlay-screen');
  if (!overlays.length) return true;
  return !!el.closest('.overlay-screen');
}

/**
 * 批注锚点包装器：仅绑定 hover + 虚线框，气泡由外侧 AnnotationRail 渲染
 * @param {string} id 批注配置 id
 * @param {'block'|'inline'|'flex'} layout 布局模式
 */
export function AnnotatedWrapper({
  id,
  children,
  layout = 'block',
  placement: _placement,
  pageKey: pageKeyOverride,
  anchorOnly = false,
}) {
  const {
    isAnnotationMode,
    activeAnnotationId,
    setActiveAnnotationId,
    registerAnchor,
    unregisterAnchor,
    layoutTick,
  } = useAnnotation();
  const pageKey = useEffectivePageKey(pageKeyOverride);
  const config = id ? getAnnotation(pageKey, id) : null;
  const anchorRef = React.useRef(null);
  const [activeLayer, setActiveLayer] = React.useState(true);

  React.useLayoutEffect(() => {
    const el = anchorRef.current;
    const next = isInActiveLayer(el);
    setActiveLayer(next);
    if (!config || !id || !next) {
      if (id) unregisterAnchor(id);
      return undefined;
    }
    registerAnchor(id, el, config);
    return () => unregisterAnchor(id);
  }, [id, config, registerAnchor, unregisterAnchor, pageKey, layoutTick]);

  if (!config) return children;

  const highlighted = activeAnnotationId === id;
  const showChrome = isAnnotationMode && activeLayer;

  const wrapperClass = [
    'annotated-wrapper',
    `annotated-wrapper--${layout}`,
    anchorOnly ? 'annotated-wrapper--anchor-only' : '',
    showChrome ? 'annotated-wrapper--on' : '',
    showChrome && highlighted ? 'annotated-wrapper--active' : '',
  ].filter(Boolean).join(' ');

  return (
    <span
      ref={anchorRef}
      className={wrapperClass}
      onMouseEnter={() => { if (activeLayer) setActiveAnnotationId(id); }}
      onMouseLeave={() => setActiveAnnotationId(null)}
    >
      {children}
    </span>
  );
}
