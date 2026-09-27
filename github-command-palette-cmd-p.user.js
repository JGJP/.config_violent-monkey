// ==UserScript==
// @name         GitHub: command palette on Cmd+P
// @namespace    https://github.com/
// @version      1.0.0
// @description  Open GitHub's command palette with Cmd/Ctrl+P instead of Cmd/Ctrl+K.
// @match        https://github.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict'

  const isP = (e) => e.code === 'KeyP' || e.key === 'p' || e.key === 'P'

  const onKeydown = (e) => {
    if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || !isP(e)) return

    // Block the browser's print dialog and forward as Cmd/Ctrl+K.
    e.preventDefault()
    e.stopImmediatePropagation()

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

  // Capture phase so we win before GitHub's own handlers and the browser.
  document.addEventListener('keydown', onKeydown, true)
})()
