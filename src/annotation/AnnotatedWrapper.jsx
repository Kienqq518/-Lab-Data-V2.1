import React from 'react';
import { useAnnotation, useEffectivePageKey } from './AnnotationContext.jsx';
import { getAnnotation } from './registry.js';
import { AnnotationTooltip } from './AnnotationTooltip.jsx';

/**
 * 批注锚点包装器：仅绑定 hover，不拦截 click
 * @param {string} id 批注配置 id
 * @param {'block'|'inline'|'flex'} layout 布局模式
 * @param {'right'|'left'|'top'|'bottom'} placement 气泡方位
 */
export function AnnotatedWrapper({
  id,
  children,
  layout = 'block',
  placement = 'right',
  pageKey: pageKeyOverride,
}) {
  const { isAnnotationMode, activeAnnotationId, setActiveAnnotationId } = useAnnotation();
  const pageKey = useEffectivePageKey(pageKeyOverride);
  const config = id ? getAnnotation(pageKey, id) : null;

  if (!config) return children;

  const highlighted = activeAnnotationId === id;
  const dimmed = !!activeAnnotationId && activeAnnotationId !== id;

  const wrapperClass = [
    'annotated-wrapper',
    `annotated-wrapper--${layout}`,
    isAnnotationMode ? 'annotated-wrapper--on' : '',
    highlighted ? 'annotated-wrapper--active' : '',
  ].filter(Boolean).join(' ');

  return (
    <span
      className={wrapperClass}
      onMouseEnter={() => setActiveAnnotationId(id)}
      onMouseLeave={() => setActiveAnnotationId(null)}
    >
      {children}
      {isAnnotationMode && (
        <AnnotationTooltip
          data={config}
          placement={placement}
          highlighted={highlighted}
          dimmed={dimmed}
        />
      )}
    </span>
  );
}
