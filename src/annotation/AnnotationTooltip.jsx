import React from 'react';

/**
 * 批注 Tooltip 气泡（pointer-events: none，由外侧轨道定位）
 */
export function AnnotationTooltip({ data, highlighted, dimmed }) {
  if (!data) return null;

  const className = [
    'annotation-tooltip',
    highlighted ? 'annotation-tooltip--highlight' : '',
    dimmed ? 'annotation-tooltip--dimmed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={className} role="note">
      <div className="annotation-tooltip__title">{data.title}</div>
      <div className="annotation-tooltip__section">
        <div className="annotation-tooltip__label annotation-tooltip__label--req">🎯 需求逻辑</div>
        <div className="annotation-tooltip__text">{data.requirementLogic}</div>
      </div>
      <div className="annotation-tooltip__section">
        <div className="annotation-tooltip__label annotation-tooltip__label--display">🎨 展示规则</div>
        <div className="annotation-tooltip__text">{data.displayRule}</div>
      </div>
      <div className="annotation-tooltip__section">
        <div className="annotation-tooltip__label annotation-tooltip__label--interaction">👆 交互逻辑</div>
        <div className="annotation-tooltip__text">{data.interactionLogic}</div>
      </div>
      {data.elementAnalysis && (
        <div className="annotation-tooltip__section">
          <div className="annotation-tooltip__label annotation-tooltip__label--elements">🧩 元素解析</div>
          <div className="annotation-tooltip__text annotation-tooltip__text--elements">{data.elementAnalysis}</div>
        </div>
      )}
    </div>
  );
}
