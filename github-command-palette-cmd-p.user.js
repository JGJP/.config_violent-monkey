// ==UserScript==
// @name         GitHub: command palette on Cmd+Alt+P
// @namespace    https://github.com/
// @version      5.0.0
// @description  Open GitHub's command palette with Cmd/Ctrl+Alt+P, plus a debug button at the top of the page.
// @match        https://github.com/*
// @run-at       document-start
// @grant        none
// @updateURL    https://raw.githubusercontent.com/JGJP/.config_violent-monkey/master/github-command-palette-cmd-p.user.js
// @downloadURL  https://raw.githubusercontent.com/JGJP/.config_violent-monkey/master/github-command-palette-cmd-p.user.js
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

  const dispatchCmdK = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k',
      code: 'KeyK',
      keyCode: 75,
      which: 75,
      metaKey: true,
      bubbles: true,
      cancelable: true,
    }))
  }

  const openPalette = () => {
    const trigger = findTrigger()
    if (trigger) trigger.click()
    else dispatchCmdK()
  }

  const onKeydown = (e) => {
    if (!(e.metaKey || e.ctrlKey) || !e.altKey || e.shiftKey || !isP(e)) return

    // Cmd/Ctrl+P is claimed by the browser's print dialog, so use Alt too.
    e.preventDefault()
    e.stopImmediatePropagation()
    openPalette()
  }

  // Capture phase so we win before GitHub's own handlers and the browser.
  document.addEventListener('keydown', onKeydown, true)

  const addButton = () => {
    if (!document.body || document.getElementById('vm-command-palette-btn')) return
    const btn = document.createElement('button')
    btn.id = 'vm-command-palette-btn'
    btn.type = 'button'
    btn.textContent = 'Command palette'
    btn.style.cssText = [
      'position:fixed', 'top:8px', 'left:8px', 'z-index:2147483647',
      'padding:6px 10px', 'background:#1f6feb', 'color:#fff',
      'border:0', 'border-radius:6px', 'font:600 12px system-ui',
      'cursor:pointer', 'box-shadow:0 1px 4px rgba(0,0,0,.3)',
    ].join(';')
    btn.addEventListener('click', openPalette)
    document.body.prepend(btn)
  }

  if (document.body) addButton()
  else document.addEventListener('DOMContentLoaded', addButton)
})()
