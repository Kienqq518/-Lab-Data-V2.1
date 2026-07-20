/**
 * 数采 Web 原型 · 批注模式运行时
 * 开关 + 左右轨道 + Hover 双向高亮
 */
(function initWebAnnotation() {
  const STORAGE_KEY = 'labdata_web_annotation_mode';
  const RAIL_WIDTH = 300;
  const SIDEBAR_WIDTH = 220;
  const HEADER_HEIGHT = 54;
  const CARD_GAP = 12;

  let enabled = false;
  let activeId = null;
  let toggleEl = null;
  let leftRail = null;
  let rightRail = null;
  let refreshTimer = null;

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

  function createToggle() {
    toggleEl = document.createElement('button');
    toggleEl.type = 'button';
    toggleEl.className = 'web-annotation-toggle';
    toggleEl.innerHTML = '<span class="web-annotation-toggle__dot"></span>批注';
    toggleEl.title = '批注模式（需求评审）';
    toggleEl.addEventListener('click', () => {
      enabled = !enabled;
      saveEnabled(enabled);
      applyEnabled();
      refresh();
    });
    document.body.appendChild(toggleEl);
  }

  function createRails() {
    leftRail = document.createElement('div');
    leftRail.className = 'web-annotation-rail web-annotation-rail--left';
    leftRail.style.display = 'none';
    leftRail.innerHTML = '<div class="web-annotation-rail__body"></div>';

    rightRail = document.createElement('div');
    rightRail.className = 'web-annotation-rail web-annotation-rail--right';
    rightRail.style.display = 'none';
    rightRail.innerHTML = '<div class="web-annotation-rail__body"></div>';

    document.body.appendChild(leftRail);
    document.body.appendChild(rightRail);
  }

  function applyEnabled() {
    document.body.classList.toggle('web-annotation-mode-on', enabled);
    toggleEl.classList.toggle('web-annotation-toggle--on', enabled);
    leftRail.style.display = enabled ? 'block' : 'none';
    rightRail.style.display = enabled ? 'block' : 'none';
    document.querySelectorAll('.web-annotated-anchor').forEach((el) => {
      el.classList.toggle('web-annotated-anchor--on', enabled);
      if (!enabled) el.classList.remove('web-annotated-anchor--active');
    });
    if (!enabled) activeId = null;
  }

  function renderCard(spec) {
    const card = document.createElement('div');
    card.className = 'web-annotation-card';
    card.dataset.annotationCardId = spec.id;
    card.innerHTML = `
      <div class="web-annotation-card__title">${spec.title}</div>
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
    card.addEventListener('mouseenter', () => setActive(spec.id));
    card.addEventListener('mouseleave', () => setActive(null));
    return card;
  }

  function setActive(id) {
    activeId = id;
    document.querySelectorAll('.web-annotated-anchor').forEach((el) => {
      const on = el.dataset.annotationId === id;
      el.classList.toggle('web-annotated-anchor--active', on);
    });
    document.querySelectorAll('.web-annotation-card').forEach((card) => {
      const on = card.dataset.annotationCardId === id;
      card.classList.toggle('web-annotation-card--highlight', on);
      card.classList.toggle('web-annotation-card--dimmed', id && !on);
    });
  }

  function bindAnchor(el, id) {
    el.addEventListener('mouseenter', () => setActive(id));
    el.addEventListener('mouseleave', () => setActive(null));
  }

  function refresh() {
    if (refreshTimer) cancelAnimationFrame(refreshTimer);
    refreshTimer = requestAnimationFrame(() => {
      refreshTimer = null;
      if (!enabled) return;

      const pageKey = detectPageKey();
      const registry = window.WEB_ANNOTATION_REGISTRY || {};
      const config = pageKey ? registry[pageKey] : null;

      const leftBody = leftRail.querySelector('.web-annotation-rail__body');
      const rightBody = rightRail.querySelector('.web-annotation-rail__body');
      leftBody.innerHTML = '';
      rightBody.innerHTML = '';

      if (!config) return;

      const anchors = [...document.querySelectorAll('[data-annotation-id]')].filter((el) => {
        const page = el.closest('[data-annotation-page]');
        return page && page.getAttribute('data-annotation-page') === pageKey;
      });

      anchors.forEach((el, i) => {
        el.classList.add('web-annotated-anchor', 'web-annotated-anchor--on');
        const id = el.dataset.annotationId;
        const spec = config[id];
        if (!spec) return;
        bindAnchor(el, id);

        const rect = el.getBoundingClientRect();
        const top = rect.top - HEADER_HEIGHT + (document.querySelector('[style*="overflow-y:auto"]')?.scrollTop || 0);

        const item = document.createElement('div');
        item.className = 'web-annotation-rail__item';
        item.style.top = `${Math.max(0, rect.top - HEADER_HEIGHT)}px`;
        item.appendChild(renderCard({ ...spec, id }));

        if (i % 2 === 0) leftBody.appendChild(item);
        else rightBody.appendChild(item);
      });

      // 简单纵向错开，避免卡片重叠
      [leftBody, rightBody].forEach((body) => {
        const items = [...body.querySelectorAll('.web-annotation-rail__item')];
        let lastBottom = 0;
        items.sort((a, b) => parseFloat(a.style.top) - parseFloat(b.style.top));
        items.forEach((item) => {
          let top = parseFloat(item.style.top);
          if (top < lastBottom + CARD_GAP) top = lastBottom + CARD_GAP;
          item.style.top = `${top}px`;
          lastBottom = top + item.offsetHeight;
        });
      });

      if (activeId) setActive(activeId);
    });
  }

  function boot() {
    createToggle();
    createRails();
    enabled = loadEnabled();
    applyEnabled();

    const root = document.getElementById('dc-root');
    if (root) {
      new MutationObserver(() => refresh()).observe(root, { childList: true, subtree: true, attributes: true });
    }
    window.addEventListener('resize', refresh);
    document.addEventListener('scroll', refresh, true);
    setTimeout(refresh, 300);
  }

  window.WebAnnotation = { refresh, setEnabled: (v) => { enabled = v; saveEnabled(v); applyEnabled(); refresh(); } };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
