// ==UserScript==
// @name         GitHub: "Done & next" on the notification shelf
// @namespace    https://github.com/
// @version      1.0.0
// @description  Adds a "Done & next" button to the notification banner shown when you open a PR/issue from the notifications inbox. Marks the notification done and jumps to the next one in the inbox.
// @match        https://github.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict'

  const BTN_ID = 'gh-done-and-next-btn'

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

  const doneAndNext = async (shelf, btn) => {
    const archiveForm = shelf.querySelector('form[action="/notifications/beta/archive"]')
    const currentId = shelf.querySelector('[data-notification-id]')?.getAttribute('data-notification-id')
    if (!archiveForm || !currentId) return

    btn.disabled = true
    const label = btn.textContent
    btn.textContent = 'Working…'
    try {
      const next = await findNext(currentId).catch(() => null)
      const archived = await post(archiveForm)
      if (!archived.ok) throw new Error(`archive failed: ${archived.status}`)
      location.href = next ? next.url : 'https://github.com/notifications'
    } catch (err) {
      console.error('[gh-done-and-next]', err)
      btn.textContent = label
      btn.disabled = false
    }
  }

  const addButton = () => {
    const shelf = document.querySelector('#notification-shelf')
    if (!shelf || shelf.querySelector(`#${BTN_ID}`)) return
    const backLink = shelf.querySelector('.js-notifications-back-to-inbox')
    if (!backLink) return

    const btn = document.createElement('button')
    btn.id = BTN_ID
    btn.type = 'button'
    btn.className = 'btn btn-sm btn-primary mr-2'
    btn.textContent = 'Done & next'
    btn.onclick = () => doneAndNext(shelf, btn)
    backLink.after(btn)
  }

  addButton()
  new MutationObserver(addButton).observe(document.body, { childList: true, subtree: true })
})()
