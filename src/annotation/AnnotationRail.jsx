import React from 'react';
import { useAnnotation } from './AnnotationContext.jsx';
import { AnnotationToggle } from './AnnotationToggle.jsx';
import { AnnotationTooltip } from './AnnotationTooltip.jsx';

const RAIL_WIDTH = 300;

/**
 * 手机框外侧批注轨道：气泡渲染在留白区，不占用移动端视口
 */
export function AnnotationRail() {
  const {
    isAnnotationMode,
    anchorsRef,
    layoutTick,
    activeAnnotationId,
    requestLayout,
    frameRef,
  } = useAnnotation();
  const railRef = React.useRef(null);
  const [positions, setPositions] = React.useState([]);

  /** 根据锚点与手机框位置，计算外侧气泡坐标 */
  const recompute = React.useCallback(() => {
    const frame = frameRef.current;
    const rail = railRef.current;
    if (!frame || !rail) {
      setPositions([]);
      return;
    }
    const frameRect = frame.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const next = [];

    anchorsRef.current.forEach((entry, id) => {
      const el = entry.element;
      if (!el || !entry.data) return;
      const anchorRect = el.getBoundingClientRect();
      const top = anchorRect.top - railRect.top;
      const maxTop = Math.max(0, frameRect.height - 80);
      next.push({
        id,
        data: entry.data,
        top: Math.min(Math.max(0, top), maxTop),
        anchorMidY: anchorRect.top + anchorRect.height / 2 - railRect.top,
        connectorLeft: frameRect.right - railRect.left,
      });
    });

    next.sort((a, b) => a.top - b.top);
    setPositions(spreadOverlapping(next));
  }, [anchorsRef, frameRef]);

  React.useLayoutEffect(() => {
    recompute();
  }, [recompute, layoutTick, isAnnotationMode]);

  React.useEffect(() => {
    if (!isAnnotationMode) return undefined;
    const frame = frameRef.current;
    const onChange = () => requestLayout();
    window.addEventListener('resize', onChange);
    frame?.addEventListener('scroll', onChange, true);
    const timer = setInterval(onChange, 400);
    return () => {
      window.removeEventListener('resize', onChange);
      frame?.removeEventListener('scroll', onChange, true);
      clearInterval(timer);
    };
  }, [isAnnotationMode, frameRef, requestLayout]);

  return (
    <aside
      ref={railRef}
      className={`annotation-rail${isAnnotationMode ? ' annotation-rail--on' : ''}`}
      style={{ width: isAnnotationMode ? RAIL_WIDTH : 56 }}
    >
      <div className="annotation-rail__header">
        <AnnotationToggle />
      </div>
      {isAnnotationMode && (
        <div className="annotation-rail__body">
          {positions.map((item) => {
            const highlighted = activeAnnotationId === item.id;
            const dimmed = !!activeAnnotationId && activeAnnotationId !== item.id;
            return (
              <div key={item.id} className="annotation-rail__item" style={{ top: item.top }}>
                <svg
                  className="annotation-rail__connector"
                  style={{
                    width: Math.max(8, item.connectorLeft),
                    top: item.anchorMidY - item.top,
                    right: '100%',
                  }}
                  height="2"
                  aria-hidden
                >
                  <line
                    x1="0"
                    y1="1"
                    x2={Math.max(8, item.connectorLeft)}
                    y2="1"
                    stroke="rgba(124,58,237,0.4)"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                </svg>
                <AnnotationTooltip data={item.data} highlighted={highlighted} dimmed={dimmed} />
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

/**
 * 纵向错开重叠的气泡
 * @param {Array} items 已排序项
 * @returns {Array}
 */
function spreadOverlapping(items) {
  const minGap = 8;
  const estHeight = 118;
  let lastBottom = -minGap;
  return items.map((item) => {
    let top = item.top;
    if (top < lastBottom + minGap) top = lastBottom + minGap;
    lastBottom = top + estHeight;
    return { ...item, top };
  });
}
