// ==UserScript==
// @name         GitHub: command palette on Cmd+Alt+P
// @namespace    https://github.com/
// @version      6.0.0
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

  const CANDIDATE_SELECTORS = [
    '[data-target="qbsearch-input.inputButton"]',
    'button[aria-label^="Search or jump to"]',
    'button[aria-label*="Search" i]',
    'button.AppHeader-searchButton',
    '#AppHeader-searchButton',
    'qbsearch-input button',
    '.AppHeader-search button',
    '[data-hotkey~="Mod+k"]',
    '[data-hotkey*="k"]',
  ]

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  const paletteOpen = () => document.querySelector(
    'dialog[open], [role="dialog"], modal-dialog[open], command-palette[data-is-open]',
  )

  const dispatchKey = (target) => {
    for (const mod of [{ metaKey: true }, { ctrlKey: true }]) {
      target.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'k', code: 'KeyK', keyCode: 75, which: 75,
        bubbles: true, cancelable: true, ...mod,
      }))
    }
  }

  // Try each opening strategy in turn, stopping as soon as a dialog appears.
  const openPalette = async ({ diagnose = false } = {}) => {
    let clicked = null
    for (const sel of CANDIDATE_SELECTORS) {
      const el = document.querySelector(sel)
      if (!el) continue
      clicked = { sel, html: el.outerHTML.slice(0, 140) }
      el.click()
      await sleep(300)
      if (paletteOpen()) return true
    }

    for (const target of [document, document.activeElement || document.body, window]) {
      dispatchKey(target)
      await sleep(200)
      if (paletteOpen()) return true
    }

    if (diagnose) {
      const matched = CANDIDATE_SELECTORS.filter((s) => document.querySelector(s))
      alert(
        'VM command-palette debug — nothing opened.\n\n'
        + `clicked: ${JSON.stringify(clicked, null, 2)}\n\n`
        + `matched selectors: ${JSON.stringify(matched, null, 2)}\n\n`
        + `has <command-palette>: ${!!document.querySelector('command-palette')}`,
      )
    }
    return false
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
    btn.addEventListener('click', () => openPalette({ diagnose: true }))
    document.body.prepend(btn)
  }

  if (document.body) addButton()
  else document.addEventListener('DOMContentLoaded', addButton)
})()
