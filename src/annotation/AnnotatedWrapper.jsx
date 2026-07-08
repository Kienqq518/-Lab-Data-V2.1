import React from 'react';
import { useAnnotation, useEffectivePageKey } from './AnnotationContext.jsx';
import { getAnnotation } from './registry.js';

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
  } = useAnnotation();
  const pageKey = useEffectivePageKey(pageKeyOverride);
  const config = id ? getAnnotation(pageKey, id) : null;
  const anchorRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (!config || !id) return undefined;
    const el = anchorRef.current;
    if (el) registerAnchor(id, el, config);
    return () => unregisterAnchor(id);
  }, [id, config, registerAnchor, unregisterAnchor, pageKey]);

  if (!config) return children;

  const highlighted = activeAnnotationId === id;

  const wrapperClass = [
    'annotated-wrapper',
    `annotated-wrapper--${layout}`,
    anchorOnly ? 'annotated-wrapper--anchor-only' : '',
    isAnnotationMode ? 'annotated-wrapper--on' : '',
    highlighted ? 'annotated-wrapper--active' : '',
  ].filter(Boolean).join(' ');

  return (
    <span
      ref={anchorRef}
      className={wrapperClass}
      onMouseEnter={() => setActiveAnnotationId(id)}
      onMouseLeave={() => setActiveAnnotationId(null)}
    >
      {children}
    </span>
  );
}
