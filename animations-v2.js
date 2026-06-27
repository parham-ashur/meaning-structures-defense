/* v2.2 animations — purposive, not ambient. */
(function () {
  'use strict';

  // ── Format helpers for hero number count-ups ──────────────────────────
  function formatValue(v, fmt) {
    if (fmt === 'int') {
      return Math.round(v).toLocaleString();
    }
    if (fmt === 'signed3') {
      const sign = v < 0 ? '−' : (v > 0 ? '+' : '');
      const abs = Math.abs(v);
      return sign + abs.toFixed(3);
    }
    if (fmt === 'years') {
      return Math.round(v).toLocaleString() + ' yrs';
    }
    return String(v);
  }

  function animateCount(el) {
    const target = parseFloat(el.getAttribute('data-countup'));
    const fmt = el.getAttribute('data-countup-fmt') || 'int';
    const duration = parseInt(el.getAttribute('data-countup-dur') || '1200', 10);
    const start = performance.now();
    const from = 0;
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const v = from + (target - from) * eased;
      el.textContent = formatValue(v, fmt);
      if (t < 1) {
        el._raf = requestAnimationFrame(step);
      } else {
        el.textContent = formatValue(target, fmt);  // exact final
        el._raf = null;
      }
    }
    if (el._raf) cancelAnimationFrame(el._raf);
    el._raf = requestAnimationFrame(step);
  }

  function runCounters(slide) {
    if (!slide) return;
    const counters = slide.querySelectorAll('[data-countup]');
    for (const el of counters) animateCount(el);
  }

  // ── Process-model staged build ─────────────────────────────────────────
  function runProcessModelBuild(slide) {
    const elements = slide.querySelectorAll('[data-pm-step]');
    const stepDelayMs = 600;
    for (const el of elements) {
      const step = parseInt(el.getAttribute('data-pm-step') || '0', 10);
      el.classList.remove('pm-revealed');
      void el.offsetHeight;
      setTimeout(() => el.classList.add('pm-revealed'), step * stepDelayMs);
    }
  }

  // ── Anchor dot ────────────────────────────────────────────────────────
  function ensureAnchorDot() {
    const stage = document.querySelector('deck-stage');
    if (!stage) return null;
    let dot = stage.querySelector(':scope > .anchor-dot');
    if (dot) return dot;
    dot = document.createElement('div');
    dot.className = 'anchor-dot';
    dot.setAttribute('aria-hidden', 'true');
    stage.appendChild(dot);
    return dot;
  }

  function onSlideEnter(slide) {
    if (!slide) return;
    runCounters(slide);
    if (slide.matches('[data-pm-build]')) {
      runProcessModelBuild(slide);
    }
  }

  function init() {
    const stage = document.querySelector('deck-stage');
    ensureAnchorDot();
    if (!stage) return;
    setTimeout(() => {
      const active = document.querySelector('section.slide[data-deck-active]') ||
                     document.querySelector('section.slide');
      onSlideEnter(active);
    }, 0);
    stage.addEventListener('slidechange', (e) => {
      onSlideEnter(e.detail.slide);
    });
  }

  // In a Design Component, this script loads (from <helmet>) before the
  // <deck-stage> element has streamed in. Poll until it exists, then init.
  function boot() {
    if (document.querySelector('deck-stage')) { init(); return; }
    setTimeout(boot, 50);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
