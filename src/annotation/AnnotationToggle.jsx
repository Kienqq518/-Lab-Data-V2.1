import React from 'react';
import { useAnnotation } from './AnnotationContext.jsx';

/**
 * 全局右上角批注模式开关（悬浮）
 */
export function AnnotationToggle() {
  const { isAnnotationMode, toggleAnnotationMode } = useAnnotation();

  return (
    <button
      type="button"
      className={`annotation-toggle${isAnnotationMode ? ' annotation-toggle--on' : ''}`}
      onClick={toggleAnnotationMode}
      aria-pressed={isAnnotationMode}
      title="批注模式（需求评审）"
    >
      <span className="annotation-toggle__dot" />
      批注
    </button>
  );
}
