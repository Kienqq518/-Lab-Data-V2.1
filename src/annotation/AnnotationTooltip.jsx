import React from 'react';

/**
 * 批注 Tooltip 气泡（pointer-events: none，不阻挡下层点击）
 */
export function AnnotationTooltip({ data, placement = 'right', highlighted, dimmed }) {
  if (!data) return null;

  const className = [
    'annotation-tooltip',
    `annotation-tooltip--${placement}`,
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
    </div>
  );
}
