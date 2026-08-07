// ==UserScript==
// @name         GitHub PR: approve workflows to run
// @namespace    https://github.com/
// @version      1.0.0
// @description  Automatically clicks the "Approve and run workflows" button on GitHub PR pages.
// @match        https://github.com/*/*/pull/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict'

  const INTERVAL_MS = 800

  // Require both "approve" and "run" so we never hit the plain review "Approve" button.
  const isApproveWorkflows = (el) => {
    const text = (el.textContent || '').trim().toLowerCase()
    return text.includes('approve') && text.includes('run')
  }

  const findButtons = () => {
    const candidates = document.querySelectorAll('button, a[role="button"], [type="button"]')
    return [...candidates].filter(
      (el) => isApproveWorkflows(el) && !el.disabled && el.offsetParent !== null,
    )
  }

  const clickAll = () => {
    for (const btn of findButtons()) btn.click()
  }

  setInterval(clickAll, INTERVAL_MS)

  const observer = new MutationObserver(() => clickAll())
  observer.observe(document.body, { childList: true, subtree: true })
})()
