/**
 * 数采 Web 原型 · 批注模式运行时
 * 开关 + 锚点打点 + 点击加载批注卡片
 */
(function initWebAnnotation() {
  const STORAGE_KEY = 'labdata_web_annotation_mode';
  const HEADER_HEIGHT = 54;
  const VIEWPORT_PAD = 12;

  let enabled = false;
  let openedId = null;
  let toggleEl = null;
  let markerHost = null;
  let cardHost = null;
  let refreshTimer = null;
  let suppressObserver = false;
  let observerAttached = false;
  /** @type {Map<string, { anchor: HTMLElement, dot: HTMLElement }>} */
  const anchorMap = new Map();

  function getAnnotationId(el) {
    return el.getAttribute('data-annotation-id') || el.dataset?.annotationId || '';
  }

  function loadEnabled() {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  function saveEnabled(val) {
    try {
      localStorage.setItem(STORAGE_KEY, val ? '1' : '0');
    } catch { /* ignore */ }
  }

  function detectPageKey() {
    const page = document.querySelector('[data-annotation-page]');
    return page ? page.getAttribute('data-annotation-page') : null;
  }

  function getRegistryConfig() {
    const pageKey = detectPageKey();
    if (!pageKey) return null;
    return (window.WEB_ANNOTATION_REGISTRY || {})[pageKey] || null;
  }

  function createToggle() {
    toggleEl = document.createElement('button');
    toggleEl.type = 'button';
    toggleEl.className = 'web-annotation-toggle';
    toggleEl.innerHTML = '<span class="web-annotation-toggle__dot"></span>批注';
    toggleEl.title = '批注模式（需求评审）';
    toggleEl.addEventListener('click', (e) => {
      e.stopPropagation();
      enabled = !enabled;
      saveEnabled(enabled);
      applyEnabled();
      refresh();
    });
    document.body.appendChild(toggleEl);
  }

  function createHosts() {
    markerHost = document.createElement('div');
    markerHost.className = 'web-annotation-markers';
    markerHost.style.display = 'none';

    cardHost = document.createElement('div');
    cardHost.className = 'web-annotation-card-host';
    cardHost.style.display = 'none';

    document.body.appendChild(markerHost);
    document.body.appendChild(cardHost);

    markerHost.addEventListener('click', (e) => {
      const dot = e.target.closest('.web-annotation-marker');
      if (!dot) return;
      e.stopPropagation();
      const id = dot.dataset.annotationId;
      if (id) toggleCard(id);
    });

    document.addEventListener('click', (e) => {
      if (!enabled || !openedId) return;
      if (e.target.closest('.web-annotation-markers, .web-annotation-card-host, .web-annotation-toggle')) return;
      closeCard();
    });
  }

  function applyEnabled() {
    document.body.classList.toggle('web-annotation-mode-on', enabled);
    toggleEl.classList.toggle('web-annotation-toggle--on', enabled);
    markerHost.style.display = enabled ? 'block' : 'none';
    if (!enabled) closeCard();
    document.querySelectorAll('.web-annotated-anchor').forEach((el) => {
      el.classList.toggle('web-annotated-anchor--on', enabled);
      if (!enabled) el.classList.remove('web-annotated-anchor--active');
    });
  }

  function renderCard(spec) {
    const card = document.createElement('div');
    card.className = 'web-annotation-card';
    card.dataset.annotationCardId = spec.id;
    card.innerHTML = `
      <div class="web-annotation-card__header">
        <div class="web-annotation-card__title">${spec.title}</div>
        <button type="button" class="web-annotation-card__close" aria-label="关闭批注">×</button>
      </div>
      <div class="web-annotation-card__section">
        <div class="web-annotation-card__label web-annotation-card__label--req">🎯 需求逻辑</div>
        <div class="web-annotation-card__text">${spec.requirementLogic}</div>
      </div>
      <div class="web-annotation-card__section">
        <div class="web-annotation-card__label web-annotation-card__label--display">🎨 展示规则</div>
        <div class="web-annotation-card__text">${spec.displayRule}</div>
      </div>
      <div class="web-annotation-card__section">
        <div class="web-annotation-card__label web-annotation-card__label--interaction">👆 交互逻辑</div>
        <div class="web-annotation-card__text">${spec.interactionLogic}</div>
      </div>`;
    card.querySelector('.web-annotation-card__close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeCard();
    });
    return card;
  }

  function syncActiveStates() {
    suppressObserver = true;
    document.querySelectorAll('[data-annotation-id]').forEach((el) => {
      const id = getAnnotationId(el);
      el.classList.toggle('web-annotated-anchor--active', !!openedId && id === openedId);
    });
    document.querySelectorAll('.web-annotation-marker').forEach((dot) => {
      dot.classList.toggle('web-annotation-marker--active', dot.dataset.annotationId === openedId);
    });
    suppressObserver = false;
  }

  function positionCardHost(anchor) {
    const cardWidth = Math.min(340, window.innerWidth - VIEWPORT_PAD * 2);
    const rect = anchor.getBoundingClientRect();

    cardHost.style.width = `${cardWidth}px`;
    cardHost.style.maxHeight = `calc(100vh - ${HEADER_HEIGHT + VIEWPORT_PAD * 2}px)`;
    cardHost.style.overflow = 'auto';

    let left = Math.min(rect.right + 12, window.innerWidth - cardWidth - VIEWPORT_PAD);
    if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;

    let top = Math.max(HEADER_HEIGHT + VIEWPORT_PAD, rect.top);
    const cardHeight = cardHost.offsetHeight || 320;
    if (top + cardHeight > window.innerHeight - VIEWPORT_PAD) {
      top = Math.max(HEADER_HEIGHT + VIEWPORT_PAD, window.innerHeight - cardHeight - VIEWPORT_PAD);
    }

    cardHost.style.left = `${left}px`;
    cardHost.style.top = `${top}px`;
    cardHost.style.right = 'auto';
  }

  function renderOpenedCard() {
    if (!openedId) {
      cardHost.style.display = 'none';
      cardHost.innerHTML = '';
      return;
    }

    const entry = anchorMap.get(openedId);
    const config = getRegistryConfig();
    const spec = config?.[openedId];
    if (!entry || !spec) {
      cardHost.style.display = 'none';
      cardHost.innerHTML = '';
      return;
    }

    cardHost.innerHTML = '';
    cardHost.appendChild(renderCard({ ...spec, id: openedId }));
    cardHost.style.display = 'block';
    positionCardHost(entry.anchor);
    requestAnimationFrame(() => {
      if (openedId && anchorMap.get(openedId)) positionCardHost(anchorMap.get(openedId).anchor);
    });
  }

  function openCard(id) {
    openedId = id;
    syncActiveStates();
    renderOpenedCard();
  }

  function closeCard() {
    openedId = null;
    syncActiveStates();
    renderOpenedCard();
  }

  function toggleCard(id) {
    if (openedId === id) closeCard();
    else openCard(id);
  }

  function positionDot(dot, anchor) {
    const rect = anchor.getBoundingClientRect();
    const size = 28;
    let top = rect.top + 6;
    let left = rect.right + 6;

    if (left + size > window.innerWidth - VIEWPORT_PAD) {
      left = rect.right - size - 8;
    }
    if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;
    if (top < HEADER_HEIGHT + 4) top = HEADER_HEIGHT + 4;
    if (top + size > window.innerHeight - VIEWPORT_PAD) {
      top = Math.max(HEADER_HEIGHT + 4, rect.bottom - size - 8);
    }

    dot.style.top = `${top}px`;
    dot.style.left = `${left}px`;
  }

  function clearMarkers() {
    anchorMap.clear();
    markerHost.innerHTML = '';
    document.querySelectorAll('.web-annotated-anchor').forEach((el) => {
      el.classList.remove('web-annotated-anchor', 'web-annotated-anchor--on', 'web-annotated-anchor--active');
    });
  }

  function refresh() {
    if (refreshTimer) cancelAnimationFrame(refreshTimer);
    refreshTimer = requestAnimationFrame(() => {
      refreshTimer = null;
      if (!enabled) return;

      const pageKey = detectPageKey();
      const config = getRegistryConfig();
      const prevOpenedId = openedId;

      suppressObserver = true;
      clearMarkers();
      suppressObserver = false;

      if (!config || !pageKey) {
        closeCard();
        return;
      }

      const anchors = [...document.querySelectorAll('[data-annotation-id]')].filter((el) => {
        const page = el.closest('[data-annotation-page]');
        return page && page.getAttribute('data-annotation-page') === pageKey;
      });

      anchors.forEach((anchor, index) => {
        const id = getAnnotationId(anchor);
        const spec = config[id];
        if (!spec) return;

        anchor.classList.add('web-annotated-anchor', 'web-annotated-anchor--on');

        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'web-annotation-marker';
        dot.dataset.annotationId = id;
        dot.title = spec.title;
        dot.setAttribute('aria-label', `查看批注：${spec.title}`);
        dot.innerHTML = `<span class="web-annotation-marker__pulse"></span><span class="web-annotation-marker__core">${index + 1}</span>`;
        if (id === prevOpenedId) dot.classList.add('web-annotation-marker--active');

        positionDot(dot, anchor);
        markerHost.appendChild(dot);
        anchorMap.set(id, { anchor, dot });
      });

      const openedAnchorExists = prevOpenedId && anchorMap.has(prevOpenedId);
      if (prevOpenedId && !openedAnchorExists) {
        closeCard();
      } else if (openedAnchorExists) {
        openedId = prevOpenedId;
        syncActiveStates();
        renderOpenedCard();
      }
    });
  }

  function attachObserver() {
    if (observerAttached) return;
    const root = document.getElementById('dc-root');
    if (!root) return;
    new MutationObserver(() => {
      if (suppressObserver || !enabled) return;
      refresh();
    }).observe(root, { childList: true, subtree: true });
    observerAttached = true;
  }

  function boot() {
    createToggle();
    createHosts();
    enabled = loadEnabled();
    applyEnabled();
    attachObserver();
    window.addEventListener('resize', refresh);
    document.addEventListener('scroll', refresh, true);
    const retry = () => {
      attachObserver();
      refresh();
    };
    setTimeout(retry, 300);
    setTimeout(retry, 1200);
  }

  window.WebAnnotation = {
    refresh,
    setEnabled: (v) => {
      enabled = v;
      saveEnabled(v);
      applyEnabled();
      refresh();
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
