// ==UserScript==
// @name         GitHub: command palette on Cmd+Alt+P
// @namespace    https://github.com/
// @version      7.0.0
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
  ]

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  const visible = (el) => !!el && !!el.getClientRects().length

  // A real, visibly-open overlay — ignore the hidden dialogs GitHub keeps in the DOM.
  const openOverlay = () => [
    ...document.querySelectorAll('dialog[open], [role="dialog"], modal-dialog'),
  ].find(visible)

  const dispatchKey = (target) => {
    for (const mod of [{ metaKey: true }, { ctrlKey: true }]) {
      target.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'k', code: 'KeyK', keyCode: 75, which: 75,
        bubbles: true, cancelable: true, ...mod,
      }))
    }
  }

  const openPalette = async () => {
    for (const sel of CANDIDATE_SELECTORS) {
      const el = document.querySelector(sel)
      if (!el) continue
      el.click()
      await sleep(250)
      if (openOverlay()) return true
    }
    for (const target of [document, document.activeElement || document.body, window]) {
      dispatchKey(target)
      await sleep(150)
      if (openOverlay()) return true
    }
    return false
  }

  const describe = (el) => el
    ? `<${el.tagName.toLowerCase()}${el.id ? ` id="${el.id}"` : ''}`
      + ` aria-label="${el.getAttribute('aria-label') || ''}"`
      + ` class="${(el.className || '').toString().slice(0, 60)}">`
    : 'null'

  const report = async () => {
    const lines = ['=== VM command-palette probe ===', location.href, '']

    lines.push('-- candidate selectors --')
    for (const sel of CANDIDATE_SELECTORS) {
      lines.push(`${document.querySelector(sel) ? '[HIT]' : '[   ]'} ${sel}`)
      const el = document.querySelector(sel)
      if (el) lines.push(`        ${describe(el)}`)
    }

    lines.push('', '-- elements with data-hotkey --')
    const hk = [...document.querySelectorAll('[data-hotkey]')]
    if (!hk.length) lines.push('(none)')
    for (const el of hk.slice(0, 20)) {
      lines.push(`  ${el.getAttribute('data-hotkey')}  ${describe(el)}`)
    }

    lines.push('', `<command-palette> present: ${!!document.querySelector('command-palette')}`)

    lines.push('', '-- attempting open --')
    const ok = await openPalette()
    lines.push(`openPalette() -> ${ok}`)
    lines.push(`visible overlay after attempt: ${describe(openOverlay())}`)

    return lines.join('\n')
  }

  const onKeydown = (e) => {
    if (!(e.metaKey || e.ctrlKey) || !e.altKey || e.shiftKey || !isP(e)) return
    e.preventDefault()
    e.stopImmediatePropagation()
    openPalette()
  }

  document.addEventListener('keydown', onKeydown, true)

  const showReport = async () => {
    document.getElementById('vm-command-palette-report')?.remove()
    const box = document.createElement('textarea')
    box.id = 'vm-command-palette-report'
    box.readOnly = true
    box.value = 'running probe…'
    box.style.cssText = [
      'position:fixed', 'top:44px', 'left:8px', 'z-index:2147483647',
      'width:520px', 'height:360px', 'padding:8px',
      'background:#0d1117', 'color:#7ee787', 'border:1px solid #30363d',
      'border-radius:6px', 'font:12px/1.4 ui-monospace,monospace',
    ].join(';')
    document.body.prepend(box)
    box.value = await report()
    box.select()
  }

  const addButton = () => {
    if (!document.body || document.getElementById('vm-command-palette-btn')) return
    const btn = document.createElement('button')
    btn.id = 'vm-command-palette-btn'
    btn.type = 'button'
    btn.textContent = 'Command palette (debug)'
    btn.style.cssText = [
      'position:fixed', 'top:8px', 'left:8px', 'z-index:2147483647',
      'padding:6px 10px', 'background:#1f6feb', 'color:#fff',
      'border:0', 'border-radius:6px', 'font:600 12px system-ui',
      'cursor:pointer', 'box-shadow:0 1px 4px rgba(0,0,0,.3)',
    ].join(';')
    btn.addEventListener('click', showReport)
    document.body.prepend(btn)
  }

  if (document.body) addButton()
  else document.addEventListener('DOMContentLoaded', addButton)
})()
