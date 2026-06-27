/* deck-label.js — mirror the active slide's data-label onto <body> so the
 * deck's CSS can react (e.g. body[data-current-label^="04"] …). Hardened to
 * wait for <deck-stage> because, inside a Design Component, this script loads
 * from <helmet> before the stage has streamed in. */
(function () {
  'use strict';
  function update(slide) {
    var label = (slide && slide.getAttribute && slide.getAttribute('data-label')) || '';
    document.body.setAttribute('data-current-label', label);
  }
  function init() {
    var stage = document.querySelector('deck-stage');
    if (!stage) return;
    stage.addEventListener('slidechange', function (e) {
      update(e.detail && e.detail.slide);
    });
    update(document.querySelector('section.slide[data-deck-active]'));
  }
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
