import React from 'react';

const STORAGE_KEY = 'labdata_annotation_mode';

const AnnotationContext = React.createContext(null);

/**
 * 批注模式全局 Provider：跨路由保持 isAnnotationMode 持久化，并管理锚点注册
 * @param {boolean} overlayActive 是否有全屏 overlay（collect/done/focus/notify），用于屏蔽底层页批注
 */
export function AnnotationProvider({ pageKey, frameRef: frameRefProp, overlayActive = false, children }) {
  const [isAnnotationMode, setIsAnnotationMode] = React.useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [activeAnnotationId, setActiveAnnotationId] = React.useState(null);
  const [layoutTick, setLayoutTick] = React.useState(0);
  /** 批注轨道内容所需高度（含错开后的底部卡片），供舞台纵向扩展避免裁切 */
  const [railContentHeight, setRailContentHeight] = React.useState(1280);
  const anchorsRef = React.useRef(new Map());
  const internalFrameRef = React.useRef(null);
  const frameRef = frameRefProp || internalFrameRef;

  /** 切换批注模式并持久化 */
  const toggleAnnotationMode = React.useCallback(() => {
    setIsAnnotationMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* 忽略 */
      }
      if (!next) setActiveAnnotationId(null);
      return next;
    });
  }, []);

  /** 注册批注锚点（内容未变时不触发 layoutTick，避免死循环白屏） */
  const registerAnchor = React.useCallback((id, element, data) => {
    if (!id || !element || !data) return;
    const prev = anchorsRef.current.get(id);
    if (prev && prev.element === element && prev.data === data) return;
    anchorsRef.current.set(id, { element, data });
    setLayoutTick((t) => t + 1);
  }, []);

  /** 注销批注锚点 */
  const unregisterAnchor = React.useCallback((id) => {
    if (anchorsRef.current.delete(id)) {
      setLayoutTick((t) => t + 1);
    }
  }, []);

  /** 请求外侧轨道重新计算气泡位置 */
  const requestLayout = React.useCallback(() => {
    setLayoutTick((t) => t + 1);
  }, []);

  const value = React.useMemo(() => ({
    isAnnotationMode,
    toggleAnnotationMode,
    pageKey,
    overlayActive: !!overlayActive,
    activeAnnotationId,
    setActiveAnnotationId,
    anchorsRef,
    layoutTick,
    registerAnchor,
    unregisterAnchor,
    requestLayout,
    frameRef,
    railContentHeight,
    setRailContentHeight,
  }), [isAnnotationMode, pageKey, overlayActive, activeAnnotationId, layoutTick, toggleAnnotationMode, registerAnchor, unregisterAnchor, requestLayout, frameRef, railContentHeight]);

  return (
    <AnnotationContext.Provider value={value}>
      {children}
    </AnnotationContext.Provider>
  );
}

/** 获取批注上下文 */
export function useAnnotation() {
  const ctx = React.useContext(AnnotationContext);
  if (!ctx) throw new Error('useAnnotation must be used within AnnotationProvider');
  return ctx;
}

/** 供 Provider 外部读取 pageKey 覆盖（Inspect 等嵌套页） */
export const AnnotationPageKeyContext = React.createContext(null);

export function AnnotationPageKeyProvider({ pageKey, children }) {
  return (
    <AnnotationPageKeyContext.Provider value={pageKey}>
      {children}
    </AnnotationPageKeyContext.Provider>
  );
}

export function useEffectivePageKey(fallbackKey) {
  const override = React.useContext(AnnotationPageKeyContext);
  const { pageKey } = useAnnotation();
  return override || pageKey || fallbackKey;
}
