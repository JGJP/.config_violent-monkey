// ==UserScript==
// @name         GitHub: command palette on Cmd+Alt+P
// @namespace    https://github.com/
// @version      4.0.0
// @description  Open GitHub's command palette with Cmd/Ctrl+Alt+P instead of Cmd/Ctrl+K.
// @match        https://github.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict'

  const isP = (e) => e.code === 'KeyP' || e.key === 'p' || e.key === 'P'

  // The header search button is what Cmd+K activates; clicking it is honored by
  // GitHub's React handlers, whereas a synthetic Cmd+K keydown is often ignored.
  const findTrigger = () => document.querySelector(
    '[data-target="qbsearch-input.inputButton"], '
    + 'button[aria-label^="Search or jump to"], '
    + 'button.AppHeader-searchButton, '
    + '#AppHeader-searchButton',
  )

  const dispatchCmdK = (e) => {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k',
      code: 'KeyK',
      keyCode: 75,
      which: 75,
      metaKey: e.metaKey,
      ctrlKey: e.ctrlKey,
      bubbles: true,
      cancelable: true,
    }))
  }

  const onKeydown = (e) => {
    if (!(e.metaKey || e.ctrlKey) || !e.altKey || e.shiftKey || !isP(e)) return

    // Cmd/Ctrl+P is claimed by the browser's print dialog, so use Alt too.
    e.preventDefault()
    e.stopImmediatePropagation()

    const trigger = findTrigger()
    if (trigger) trigger.click()
    else dispatchCmdK(e)
  }

  // Capture phase so we win before GitHub's own handlers and the browser.
  document.addEventListener('keydown', onKeydown, true)
})()
