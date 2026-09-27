// ==UserScript==
// @name         GitHub: command palette on Cmd+Alt+P
// @namespace    https://github.com/
// @version      8.0.0
// @description  Open GitHub's search/command dialog with Cmd/Ctrl+Alt+P instead of Cmd/Ctrl+K.
// @match        https://github.com/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/JGJP/.config_violent-monkey/master/github-command-palette-cmd-p.user.js
// @downloadURL  https://raw.githubusercontent.com/JGJP/.config_violent-monkey/master/github-command-palette-cmd-p.user.js
// ==/UserScript==

(() => {
  'use strict'

  const isP = (e) => e.code === 'KeyP' || e.key === 'p' || e.key === 'P'

  // GitHub's header uses Primer React with hashed class names, so target the
  // stable aria-label of the search button (what Cmd+K activates natively).
  const findTrigger = () => document.querySelector(
    'button[aria-label*="quick search" i], '
    + 'button[aria-label*="search dialog" i], '
    + 'button[aria-label^="Search or jump to"]',
  )

  const openPalette = () => {
    const trigger = findTrigger()
    if (trigger) trigger.click()
  }

  const onKeydown = (e) => {
    if (!(e.metaKey || e.ctrlKey) || !e.altKey || e.shiftKey || !isP(e)) return

    // Cmd/Ctrl+P is claimed by the browser's print dialog, so use Alt too.
    e.preventDefault()
    e.stopImmediatePropagation()
    openPalette()
  }

  document.addEventListener('keydown', onKeydown, true)
})()
