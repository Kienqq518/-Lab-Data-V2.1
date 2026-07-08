import React from 'react';

const STORAGE_KEY = 'labdata_annotation_mode';

const AnnotationContext = React.createContext(null);

/**
 * 批注模式全局 Provider：跨路由保持 isAnnotationMode 持久化
 */
export function AnnotationProvider({ pageKey, children }) {
  const [isAnnotationMode, setIsAnnotationMode] = React.useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [activeAnnotationId, setActiveAnnotationId] = React.useState(null);

  /** 切换批注模式并持久化 */
  function toggleAnnotationMode() {
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
  }

  const value = React.useMemo(() => ({
    isAnnotationMode,
    toggleAnnotationMode,
    pageKey,
    activeAnnotationId,
    setActiveAnnotationId,
  }), [isAnnotationMode, pageKey, activeAnnotationId]);

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

/**
 * 子页面覆盖 pageKey（如 Inspect L3）；卸载时恢复
 * @param {string} pageKey 当前页面批注配置 key
 */
export function useAnnotationPage(pageKey) {
  const [localKey, setLocalKey] = React.useState(pageKey);
  React.useEffect(() => {
    setLocalKey(pageKey);
  }, [pageKey]);
  return localKey;
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
