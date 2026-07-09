import React from 'react';
import { useAnnotation } from './AnnotationContext.jsx';
import { AnnotationToggle } from './AnnotationToggle.jsx';
import { AnnotationTooltip } from './AnnotationTooltip.jsx';
import {
  RAIL_WIDTH,
  RAIL_WIDTH_COLLAPSED,
  splitItemsToSides,
  spreadNonOverlapping,
} from './annotation-layout.js';

/**
 * 单侧批注轨道列
 */
function AnnotationRailColumn({ side, showToggle, items, frameRef, onContentHeight }) {
  const { isAnnotationMode, activeAnnotationId } = useAnnotation();
  const railRef = React.useRef(null);
  const heightRefs = React.useRef({});
  const [positions, setPositions] = React.useState([]);
  const [measurePass, setMeasurePass] = React.useState(0);

  React.useEffect(() => {
    setMeasurePass(0);
  }, [items, isAnnotationMode]);

  /** 根据锚点计算初始纵向位置 */
  const buildRawItems = React.useCallback(() => {
    const frame = frameRef.current;
    const rail = railRef.current;
    if (!frame || !rail || !items.length) return [];

    const frameRect = frame.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const bodyTop = railRect.top + (showToggle ? 52 : 0);

    return items.map((item) => {
      const anchorRect = item.anchorRect;
      const top = anchorRect.top - bodyTop;
      const anchorMidY = anchorRect.top + anchorRect.height / 2 - bodyTop;
      const connectorLen = side === 'left'
        ? frameRect.left - railRect.right
        : frameRect.right - railRect.left;

      return {
        ...item,
        top: Math.max(0, top),
        anchorMidY,
        connectorLen: Math.max(12, connectorLen + 8),
      };
    }).sort((a, b) => a.top - b.top);
  }, [items, frameRef, showToggle, side]);

  /** 测量高度后重新排布，消除重叠 */
  React.useLayoutEffect(() => {
    if (!isAnnotationMode || !items.length) {
      setPositions([]);
      return;
    }

    const raw = buildRawItems();
    const heightMap = {};
    raw.forEach((item) => {
      heightMap[item.id] = heightRefs.current[item.id]?.offsetHeight || 0;
    });

    setPositions(spreadNonOverlapping(raw, heightMap, 14));

    const needRemeasure = raw.some((item) => !heightMap[item.id]) && measurePass < 4;
    if (needRemeasure) {
      requestAnimationFrame(() => setMeasurePass((p) => p + 1));
    }
  }, [isAnnotationMode, items, buildRawItems, measurePass]);

  const width = isAnnotationMode ? RAIL_WIDTH : RAIL_WIDTH_COLLAPSED;
  const bodyMinHeight = React.useMemo(() => {
    if (!positions.length) return 1280 - 52;
    const last = positions[positions.length - 1];
    const bottom = (last.top || 0) + (last.measuredHeight || 240) + 160;
    return Math.max(1280 - 52, bottom);
  }, [positions]);

  const railHeight = isAnnotationMode ? bodyMinHeight + 52 : 1280;

  React.useEffect(() => {
    if (!onContentHeight) return;
    onContentHeight(side, isAnnotationMode ? railHeight : 1280);
  }, [onContentHeight, side, isAnnotationMode, railHeight]);

  return (
    <aside
      ref={railRef}
      className={`annotation-rail annotation-rail--${side}${isAnnotationMode ? ' annotation-rail--on' : ''}`}
      style={{ width, minHeight: railHeight, height: isAnnotationMode ? railHeight : undefined }}
    >
      {showToggle && (
        <div className="annotation-rail__header">
          <AnnotationToggle />
        </div>
      )}
      {isAnnotationMode && (
        <div className="annotation-rail__body" style={{ minHeight: bodyMinHeight, paddingBottom: 200 }}>
          {positions.map((item) => {
            const highlighted = activeAnnotationId === item.id;
            const dimmed = !!activeAnnotationId && activeAnnotationId !== item.id;
            const connectorTop = item.anchorMidY - item.top;

            return (
              <div key={item.id} className="annotation-rail__item" style={{ top: item.top }}>
                <svg
                  className={`annotation-rail__connector annotation-rail__connector--${side}`}
                  style={{
                    width: item.connectorLen,
                    top: connectorTop,
                    ...(side === 'left' ? { left: '100%' } : { right: '100%' }),
                  }}
                  height={Math.max(2, Math.abs(connectorTop) + 2)}
                  aria-hidden
                >
                  <line
                    x1={side === 'left' ? 0 : item.connectorLen}
                    y1={connectorTop < 0 ? Math.abs(connectorTop) + 1 : 1}
                    x2={side === 'left' ? item.connectorLen : 0}
                    y2={1}
                    stroke="rgba(124,58,237,0.42)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                </svg>
                <div ref={(el) => { heightRefs.current[item.id] = el; }}>
                  <AnnotationTooltip data={item.data} highlighted={highlighted} dimmed={dimmed} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

/**
 * 双侧批注布局：左轨 | 手机框 children | 右轨
 */
export function AnnotationSideRails({ frameRef, children }) {
  const {
    isAnnotationMode,
    anchorsRef,
    layoutTick,
    requestLayout,
    frameRef: contextFrameRef,
    setRailContentHeight,
  } = useAnnotation();
  const effectiveFrameRef = frameRef || contextFrameRef;
  const sideHeightsRef = React.useRef({ left: 1280, right: 1280 });

  const anchorItems = React.useMemo(() => {
    const list = [];
    anchorsRef.current.forEach((entry, id) => {
      const el = entry.element;
      if (!el || !entry.data) return;
      list.push({ id, data: entry.data, anchorRect: el.getBoundingClientRect() });
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorsRef, layoutTick]);

  const { left, right } = React.useMemo(() => {
    if (!anchorItems.length) return { left: [], right: [] };
    return splitItemsToSides(anchorItems.map((item) => ({ ...item, top: item.anchorRect.top })));
  }, [anchorItems]);

  const handleContentHeight = React.useCallback((side, height) => {
    sideHeightsRef.current[side] = height;
    const next = Math.max(1280, sideHeightsRef.current.left || 0, sideHeightsRef.current.right || 0);
    setRailContentHeight((prev) => (prev === next ? prev : next));
  }, [setRailContentHeight]);

  React.useEffect(() => {
    if (!isAnnotationMode) {
      setRailContentHeight(1280);
      sideHeightsRef.current = { left: 1280, right: 1280 };
    }
  }, [isAnnotationMode, setRailContentHeight]);

  React.useEffect(() => {
    if (!isAnnotationMode) return undefined;
    const frame = effectiveFrameRef.current;
    const onChange = () => requestLayout();
    window.addEventListener('resize', onChange);
    frame?.addEventListener('scroll', onChange, true);
    const timer = setInterval(onChange, 500);
    return () => {
      window.removeEventListener('resize', onChange);
      frame?.removeEventListener('scroll', onChange, true);
      clearInterval(timer);
    };
  }, [isAnnotationMode, effectiveFrameRef, requestLayout]);

  return (
    <div className="prototype-row" style={{ minHeight: isAnnotationMode ? undefined : 1280, alignItems: 'flex-start' }}>
      <AnnotationRailColumn side="left" showToggle={false} items={left} frameRef={effectiveFrameRef} onContentHeight={handleContentHeight} />
      {children}
      <AnnotationRailColumn side="right" showToggle items={right} frameRef={effectiveFrameRef} onContentHeight={handleContentHeight} />
    </div>
  );
}

/** 兼容旧导出 */
export { AnnotationSideRails as AnnotationRail };
