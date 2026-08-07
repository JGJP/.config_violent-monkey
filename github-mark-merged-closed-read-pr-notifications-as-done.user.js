// ==UserScript==
// @name         GitHub: mark merged/closed/read PR notifications as done
// @namespace    https://github.com/
// @version      1.0.0
// @description  Adds buttons to mark merged, closed, or read PR notifications as done on the notifications page.
// @match        https://github.com/notifications*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict'

  const markMatching = (predicate, label) => {
    const rows = document.querySelectorAll('.notifications-list-item, li.notification-thread')
    let n = 0
    rows.forEach((row) => {
      if (!predicate(row)) return
      const done =
        row.querySelector('button[aria-label="Done"]') ||
        row.querySelector('button[title="Done"]') ||
        row.querySelector('.octicon-check')?.closest('button')
      if (done) { done.click(); n++ }
    })
    console.log(`[gh-pr-done] marked ${n} ${label} notification(s)`)
    return n
  }

  const byIcon = (iconClass) => (row) => !!row.querySelector(iconClass)
  const isUnread = (row) =>
    !!row.querySelector('.octicon-dot-fill') || /\bunread\b/.test(row.className)

  const markMerged = () => markMatching(byIcon('.octicon-git-merge'), 'merged')
  const markClosed = () => markMatching(byIcon('.octicon-git-pull-request-closed'), 'closed')
  const markRead = () => markMatching((row) => !isUnread(row), 'read')

  const makeButton = ({ id, text, background, onclick }) => {
    const btn = document.createElement('button')
    btn.id = id
    btn.textContent = text
    Object.assign(btn.style, {
      padding: '8px 14px',
      background,
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      fontWeight: '600',
      fontSize: '13px',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      whiteSpace: 'nowrap',
    })
    btn.onclick = onclick
    return btn
  }

  const addButtons = () => {
    if (document.getElementById('gh-pr-done-panel')) return
    const panel = document.createElement('div')
    panel.id = 'gh-pr-done-panel'
    Object.assign(panel.style, {
      position: 'fixed',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    })
    // Colors match GitHub's PR state icons: merged = purple, closed = red; read = grey
    panel.append(
      makeButton({ id: 'gh-merged-done-btn', text: 'Mark merged as done', background: '#8250df', onclick: markMerged }),
      makeButton({ id: 'gh-closed-done-btn', text: 'Mark closed as done', background: '#cf222e', onclick: markClosed }),
      makeButton({ id: 'gh-read-done-btn', text: 'Mark read as done', background: '#57606a', onclick: markRead }),
    )
    document.body.appendChild(panel)
  }

  addButtons()
  // Uncomment to run automatically on load:
  // markMerged()
  // markClosed()
  // markRead()
})()
