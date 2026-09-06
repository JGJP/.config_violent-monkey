// ==UserScript==
// @name         GitHub: "Done & next" on the notification shelf
// @namespace    https://github.com/
// @version      1.2.1
// @description  Adds "Done & next" and "Next" buttons to the notification banner shown when you open a PR/issue from the notifications inbox. Jumps to the next notification in the inbox, optionally marking the current one done.
// @match        https://github.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict'

  const MARKER = 'gh-shelf-next'

  const post = (form) =>
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })

  // Read the inbox and return the notification that follows `currentId` in order,
  // falling back to the first entry that isn't the current one.
  const findNext = async (currentId) => {
    const res = await fetch('https://github.com/notifications', { credentials: 'same-origin' })
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
    const list = [...doc.querySelectorAll('li[data-notification-id]')]
      .map((el) => ({
        id: el.getAttribute('data-notification-id'),
        url: el.querySelector('a[href*="notification_referrer_id"]')?.href,
      }))
      .filter((x) => x.url)
    const idx = list.findIndex((x) => x.id === currentId)
    return (idx >= 0 ? list[idx + 1] : list.find((x) => x.id !== currentId)) || null
  }

  const advance = async (shelf, btn, { markDone }) => {
    const archiveForm = shelf.querySelector('form[action="/notifications/beta/archive"]')
    const currentId = shelf.querySelector('[data-notification-id]')?.getAttribute('data-notification-id')
    if (!currentId || (markDone && !archiveForm)) return

    btn.disabled = true
    const label = btn.textContent
    btn.textContent = 'Working…'
    try {
      const next = await findNext(currentId).catch(() => null)
      if (markDone) {
        const archived = await post(archiveForm)
        if (!archived.ok) throw new Error(`archive failed: ${archived.status}`)
      }
      location.href = next ? next.url : 'https://github.com/notifications'
    } catch (err) {
      console.error('[gh-shelf-next]', err)
      btn.textContent = label
      btn.disabled = false
    }
  }

  const makeButton = (shelf, { text, markDone }) => {
    const li = document.createElement('li')
    li.className = 'mr-2'
    const btn = document.createElement('button')
    btn.className = `${MARKER} btn btn-sm btn-primary`
    btn.type = 'button'
    // Positive tabindex puts these ahead of everything at the default 0, so Tab lands here first.
    btn.tabIndex = 1
    btn.textContent = text
    btn.onclick = () => advance(shelf, btn, { markDone })
    li.append(btn)
    return li
  }

  // Insert next to the shelf's own "Done" button, in each action row so it
  // shows at any viewport width (GitHub swaps a mobile/desktop <ul>).
  const addButtons = () => {
    const shelf = document.querySelector('#notification-shelf')
    if (!shelf) return
    shelf.querySelectorAll('li.notification-action-mark-archived').forEach((doneLi) => {
      if (doneLi.parentElement.querySelector(`.${MARKER}`)) return
      doneLi.after(
        makeButton(shelf, { text: 'Done & next', markDone: true }),
        makeButton(shelf, { text: 'Next', markDone: false }),
      )
    })
  }

  addButtons()
  new MutationObserver(addButtons).observe(document.body, { childList: true, subtree: true })

  // super+ctrl+option+shift+F12 triggers the "Done & next" button. Capture phase
  // + e.code so we beat the browser's own F12 handling and Option key remapping.
  document.addEventListener(
    'keydown',
    (e) => {
      if (!(e.metaKey && e.ctrlKey && e.altKey && e.shiftKey && e.code === 'F12')) return
      e.preventDefault()
      e.stopPropagation()
      const btn = [...document.querySelectorAll(`.${MARKER}`)].find((b) => b.textContent === 'Done & next')
      if (btn && !btn.disabled) btn.click()
    },
    true,
  )
})()
