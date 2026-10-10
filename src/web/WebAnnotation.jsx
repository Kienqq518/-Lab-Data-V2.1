import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { WEB_ANNOTATION_REGISTRY } from './annotations.js';

const STORAGE_KEY = 'labdata_web_annotation_mode';

function readEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function placeDot(rect) {
  const size = 28;
  let left = rect.right + 6;
  let top = rect.top + 6;
  if (left + size > window.innerWidth - 12) left = rect.right - size - 8;
  if (left < 12) left = 12;
  if (top < 58) top = 58;
  if (top + size > window.innerHeight - 12) top = Math.max(58, rect.bottom - size - 8);
  return { top, left };
}

export default function WebAnnotation() {
  const [enabled, setEnabled] = useState(readEnabled);
  const [markers, setMarkers] = useState([]);
  const [openedId, setOpenedId] = useState(null);
  const [cardPos, setCardPos] = useState(null);

  useEffect(() => {
    document.body.classList.toggle('web-annotation-mode-on', enabled);
    return () => document.body.classList.remove('web-annotation-mode-on');
  }, [enabled]);

  useEffect(() => {
    const measure = () => {
      if (!enabled) {
        setMarkers([]);
        document.querySelectorAll('.web-annotated-anchor').forEach((element) => {
          element.classList.remove('web-annotated-anchor', 'web-annotated-anchor--on', 'web-annotated-anchor--active');
        });
        return;
      }
      const pages = [...document.querySelectorAll('[data-annotation-page]')];
      const page = pages[pages.length - 1] || null;
      const pageKey = page?.getAttribute('data-annotation-page');
      const masks = [...document.querySelectorAll('.adm-root .lk-mask, .adm-root .adm-mask')]
        .filter((mask) => mask.getBoundingClientRect().width > 0);
      const topMask = masks[masks.length - 1] || null;
      let scope = page;
      if (page && topMask) {
        if (page.contains(topMask)) scope = topMask;
        else if (!topMask.contains(page)) scope = page;
      }
      const config = pageKey ? WEB_ANNOTATION_REGISTRY[pageKey] : null;
      document.querySelectorAll('.web-annotated-anchor').forEach((element) => {
        element.classList.remove('web-annotated-anchor', 'web-annotated-anchor--on', 'web-annotated-anchor--active');
      });
      if (!page || !config) {
        setMarkers([]);
        setOpenedId(null);
        return;
      }
      const next = [];
      [...scope.querySelectorAll('[data-annotation-id]')].forEach((element) => {
        const id = element.getAttribute('data-annotation-id');
        const spec = config[id];
        if (!spec || next.some((item) => item.id === id)) return;
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        element.classList.add('web-annotated-anchor', 'web-annotated-anchor--on');
        if (id === openedId) element.classList.add('web-annotated-anchor--active');
        next.push({ id, index: next.length + 1, title: spec.title, spec, ...placeDot(rect) });
      });
      setMarkers((current) => {
        const same = current.length === next.length && current.every((item, index) => {
          const incoming = next[index];
          return item.id === incoming.id && item.index === incoming.index && item.top === incoming.top && item.left === incoming.left;
        });
        return same ? current : next;
      });
      if (openedId && !next.some((item) => item.id === openedId)) setOpenedId(null);
    };
    measure();
    const root = document.querySelector('.adm-root');
    const observer = new MutationObserver(measure);
    if (root) observer.observe(root, { childList: true, subtree: true });
    window.addEventListener('resize', measure);
    document.addEventListener('scroll', measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      document.removeEventListener('scroll', measure, true);
    };
  }, [enabled, openedId]);

  useEffect(() => {
    if (!openedId || !enabled) {
      setCardPos(null);
      return undefined;
    }
    const anchor = document.querySelector(`[data-annotation-id="${openedId}"]`);
    if (!anchor) return undefined;
    const place = () => {
      const rect = anchor.getBoundingClientRect();
      const cardWidth = Math.min(340, window.innerWidth - 24);
      let left = Math.min(rect.right + 12, window.innerWidth - cardWidth - 12);
      if (left < 12) left = 12;
      let top = Math.max(66, rect.top);
      setCardPos({ left, top, width: cardWidth });
    };
    place();
    return undefined;
  }, [openedId, enabled, markers]);

  const opened = markers.find((item) => item.id === openedId);

  const toggle = () => {
    setEnabled((value) => {
      const next = !value;
      try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
      if (!next) setOpenedId(null);
      return next;
    });
  };

  return (
    <>
      <button type="button" className={`web-annotation-toggle${enabled ? ' web-annotation-toggle--on' : ''}`} onClick={toggle}>
        <span className="web-annotation-toggle__dot" />
        批注
      </button>
      {enabled && createPortal(markers.map((marker) => (
        <button
          type="button"
          key={marker.id}
          className={`web-annotation-marker${openedId === marker.id ? ' web-annotation-marker--active' : ''}`}
          style={{ top: marker.top, left: marker.left }}
          title={marker.title}
          aria-label={`查看批注：${marker.title}`}
          onClick={(event) => {
            event.stopPropagation();
            setOpenedId((current) => (current === marker.id ? null : marker.id));
          }}
        >
          <span className="web-annotation-marker__pulse" />
          <span className="web-annotation-marker__core">{marker.index}</span>
        </button>
      )), document.body)}
      {enabled && opened && cardPos && createPortal(
        <div className="web-annotation-card-host" style={{ left: cardPos.left, top: cardPos.top, width: cardPos.width }}>
          <div className="web-annotation-card">
            <div className="web-annotation-card__header">
              <div className="web-annotation-card__title">{opened.spec.title}</div>
              <button type="button" className="web-annotation-card__close" aria-label="关闭批注" onClick={() => setOpenedId(null)}>×</button>
            </div>
            <div className="web-annotation-card__section">
              <div className="web-annotation-card__label web-annotation-card__label--req">需求逻辑</div>
              <div className="web-annotation-card__text">{opened.spec.requirementLogic}</div>
            </div>
            <div className="web-annotation-card__section">
              <div className="web-annotation-card__label web-annotation-card__label--display">展示规则</div>
              <div className="web-annotation-card__text">{opened.spec.displayRule}</div>
            </div>
            <div className="web-annotation-card__section">
              <div className="web-annotation-card__label web-annotation-card__label--interaction">交互逻辑</div>
              <div className="web-annotation-card__text">{opened.spec.interactionLogic}</div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
