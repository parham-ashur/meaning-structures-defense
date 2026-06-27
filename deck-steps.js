/* deck-steps.js — click-advanced within-slide reveals for the defense deck.
 *
 * Backward-compatible companion to deck-stage.js. A slide opts in simply by
 * containing elements with a `data-step="N"` attribute (N = 1,2,3,…). Pressing
 * →/Space/PageDown reveals the next step IN PLACE; only once every step on the
 * slide is shown does the key fall through to deck-stage and advance the slide.
 * ←/PageUp un-reveals the last step, then falls through to the previous slide.
 *
 * Slides with no [data-step] elements behave exactly as before — deck-stage
 * handles every key. This script registers a CAPTURE-phase keydown listener on
 * window so it runs before deck-stage's (bubble-phase) listener and can consume
 * the event via stopImmediatePropagation when it handles a within-slide step.
 *
 * Entering a slide forward shows step 0 (only always-visible content); entering
 * it backward (←) shows every step, so you never have to re-click a slide you
 * just stepped back into.
 */
(function () {
  'use strict';

  function activeSlide() {
    return document.querySelector('section.slide[data-deck-active]');
  }
  function stepEls(slide) {
    return slide ? Array.from(slide.querySelectorAll('[data-step]')) : [];
  }
  function maxStep(slide) {
    let m = 0;
    for (const el of stepEls(slide)) {
      m = Math.max(m, parseInt(el.getAttribute('data-step') || '0', 10));
    }
    return m;
  }
  // The visible reveal at a given step: step classes, feed-track scroll, and
  // range visibility. Split out so it can be deferred (see apply()).
  function applyContent(slide, cur) {
    for (const el of stepEls(slide)) {
      const s = parseInt(el.getAttribute('data-step') || '0', 10);
      el.classList.toggle('step-shown', s <= cur);
      el.classList.toggle('step-current', s === cur && cur > 0);
      el.classList.toggle('step-past', s < cur);
    }
    var track = slide.querySelector('.feed-track');
    if (track) {
      // Clamp to the last beat so extra steps (e.g. the full-bleed/expand outro)
      // don't scroll the feed past its content.
      var nb = track.querySelectorAll('.pbeat').length || 1;
      var slot = Math.min(cur, nb);
      track.style.transform = 'translateY(' + ((slot - 1) * -100) + '%)';
    }
    // Range visibility: [data-show-from]/[data-show-to] shown only while cur ∈
    // [from, to]. Lets one view replace another (used by the Study 1 slide).
    var ranged = slide.querySelectorAll('[data-show-from]');
    for (var j = 0; j < ranged.length; j++) {
      var rf = parseInt(ranged[j].getAttribute('data-show-from') || '0', 10);
      var rtAttr = ranged[j].getAttribute('data-show-to');
      var rt = (rtAttr === null) ? Infinity : parseInt(rtAttr, 10);
      ranged[j].classList.toggle('range-on', cur >= rf && cur <= rt);
    }
  }

  function apply(slide, cur) {
    if (slide._revealTimer) { clearTimeout(slide._revealTimer); slide._revealTimer = null; }
    var wasExpanded = slide.classList.contains('expanded');
    // Expand immediately so the paper starts opening on the click.
    slide.classList.toggle('expanded', cur > 0);
    slide._curStep = cur;
    // First click on a study spread: let the paper reach ~2/3 BEFORE the first
    // content appears (the rest of the steps reveal immediately).
    if (cur === 1 && !wasExpanded && slide.classList.contains('opener-half')) {
      slide._revealTimer = setTimeout(function () { applyContent(slide, cur); }, 950);
    } else {
      applyContent(slide, cur);
    }
  }
  function reset(slide, direction) {
    if (!slide) return;
    const m = maxStep(slide);
    if (m === 0) return;
    apply(slide, direction === 'back' ? m : 0);
  }

  window.addEventListener('keydown', function (e) {
    const slide = activeSlide();
    if (!slide) return;
    const m = maxStep(slide);
    if (m === 0) return; // no steps here — let deck-stage drive

    const k = e.key;
    const forward = (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Spacebar');
    const backward = (k === 'ArrowLeft' || k === 'PageUp');

    if (forward) {
      const cur = slide._curStep || 0;
      if (cur < m) {
        apply(slide, cur + 1);
        e.stopImmediatePropagation();
        e.preventDefault();
      }
      // when cur === m, do nothing → deck-stage advances to the next slide
    } else if (backward) {
      const cur = slide._curStep || 0;
      if (cur > 0) {
        apply(slide, cur - 1);
        e.stopImmediatePropagation();
        e.preventDefault();
      }
      // when cur === 0, do nothing → deck-stage goes to the previous slide
    }
  }, true); // capture phase

  function init() {
    const stage = document.querySelector('deck-stage');
    if (!stage) return;
    stage.addEventListener('slidechange', function (ev) {
      const d = ev.detail || {};
      const dir = (typeof d.previousIndex === 'number' && d.index < d.previousIndex) ? 'back' : 'fwd';
      reset(d.slide, dir);
    });
    setTimeout(function () {
      reset(activeSlide() || document.querySelector('section.slide'), 'fwd');
    }, 0);
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
