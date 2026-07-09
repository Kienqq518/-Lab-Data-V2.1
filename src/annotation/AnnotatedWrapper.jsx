import React from 'react';
import { useAnnotation, useEffectivePageKey } from './AnnotationContext.jsx';
import { getAnnotation } from './registry.js';

/**
 * 批注锚点包装器：仅绑定 hover + 虚线框，气泡由外侧 AnnotationRail 渲染。
 * 有 overlay 时，仅注册位于 .overlay-screen 内的锚点，避免底层 L3 批注泄漏到 L4。
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
    overlayActive,
  } = useAnnotation();
  const pageKey = useEffectivePageKey(pageKeyOverride);
  const config = id ? getAnnotation(pageKey, id) : null;
  const anchorRef = React.useRef(null);

  const shouldRegister = React.useCallback((el) => {
    if (!config || !id || !el) return false;
    if (!overlayActive) return true;
    return !!el.closest('.overlay-screen');
  }, [config, id, overlayActive]);

  React.useLayoutEffect(() => {
    const el = anchorRef.current;
    if (!shouldRegister(el)) {
      if (id) unregisterAnchor(id);
      return undefined;
    }
    registerAnchor(id, el, config);
    return () => unregisterAnchor(id);
  }, [id, config, registerAnchor, unregisterAnchor, shouldRegister]);

  if (!config) return children;

  const inActiveLayer = !overlayActive || !!(anchorRef.current && anchorRef.current.closest('.overlay-screen'));
  const highlighted = activeAnnotationId === id;
  const showChrome = isAnnotationMode && inActiveLayer;

  const wrapperClass = [
    'annotated-wrapper',
    `annotated-wrapper--${layout}`,
    anchorOnly ? 'annotated-wrapper--anchor-only' : '',
    showChrome ? 'annotated-wrapper--on' : '',
    showChrome && highlighted ? 'annotated-wrapper--active' : '',
  ].filter(Boolean).join(' ');

  /** 使用冒泡的 mouseOver/Out：批注开启时 wrapper 为 pointer-events:none，mouseEnter 不会触发 */
  function handleMouseOver(event) {
    // 嵌套锚点：由最内层处理，外层不抢高亮（如结论区嵌在试验数据区内）
    const fromNested = event.target?.closest?.('.annotated-wrapper');
    if (fromNested && fromNested !== anchorRef.current) return;
    if (!overlayActive || anchorRef.current?.closest('.overlay-screen')) {
      setActiveAnnotationId(id);
    }
  }

  function handleMouseOut(event) {
    const next = event.relatedTarget;
    if (next && anchorRef.current?.contains(next)) return;
    // 移入嵌套子锚点时，由子锚点接管，外层不清除
    if (next?.closest?.('.annotated-wrapper') && next.closest('.annotated-wrapper') !== anchorRef.current) return;
    setActiveAnnotationId((cur) => (cur === id ? null : cur));
  }

  return (
    <span
      ref={anchorRef}
      className={wrapperClass}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      {children}
    </span>
  );
}
