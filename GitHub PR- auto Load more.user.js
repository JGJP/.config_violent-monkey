// ==UserScript==
// @name         GitHub PR: auto Load more
// @namespace    https://github.com/
// @version      1.0.0
// @description  Continuously click "Load more" buttons on GitHub PR pages until none remain.
// @author       you
// @match        https://github.com/*/*/pull/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const INTERVAL_MS = 800;

  const isLoadMore = (el) => {
    const text = (el.textContent || '').trim().toLowerCase();
    return text === 'load more' || text === 'load more…' || text === 'load more...';
  };

  const findButtons = () => {
    const candidates = document.querySelectorAll(
      'button, a[role="button"], [type="button"], .ajax-pagination-btn'
    );
    return [...candidates].filter(
      (el) => isLoadMore(el) && !el.disabled && el.offsetParent !== null
    );
  };

  const clickAll = () => {
    for (const btn of findButtons()) btn.click();
  };

  // Poll on a timer — new "Load more" buttons appear after each expansion,
  // and GitHub swaps in content via Turbo without a full reload.
  setInterval(clickAll, INTERVAL_MS);

  // React immediately when the DOM mutates instead of waiting for the tick.
  const observer = new MutationObserver(() => clickAll());
  observer.observe(document.body, { childList: true, subtree: true });
})();
