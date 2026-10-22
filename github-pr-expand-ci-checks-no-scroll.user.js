// ==UserScript==
// @name         GitHub PR: expand CI checks (no scroll)
// @namespace    https://github.com/
// @version      4.1.0
// @description  Keep the GitHub PR checks section expanded at full height, with skipped checks folded
// @match        https://github.com/*/*/pull/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict'

  const css = `
    [class*="expandableContent"][class*="isExpanded"] {
      max-height: none !important;
      overflow-y: visible !important;
    }
  `
  const style = document.createElement('style')
  style.textContent = css
  ;(document.head || document.documentElement).appendChild(style)

  const seen = new WeakSet()
  const apply = () => {
    // Expand the checks section when it starts collapsed.
    for (const btn of document.querySelectorAll('button[aria-expanded="false"]')) {
      if (seen.has(btn)) continue
      if (btn.getAttribute('aria-label') !== 'Expand checks') continue
      seen.add(btn)
      btn.click()
    }
    // Fold the skipped checks subgroup by default.
    for (const btn of document.querySelectorAll(
      'button[aria-label*="skipped checks group"]',
    )) {
      if (seen.has(btn)) continue
      seen.add(btn)
      if (btn.getAttribute('aria-expanded') === 'true') btn.click()
    }
  }

  const run = () => requestAnimationFrame(apply)
  document.addEventListener('DOMContentLoaded', run)
  document.addEventListener('turbo:load', run)
  document.addEventListener('pjax:end', run)
  new MutationObserver(run).observe(document.documentElement, {
    childList: true,
    subtree: true,
  })
})()
