// ==UserScript==
// @name         GitHub PR: state favicon
// @namespace    https://github.com/
// @version      7.1.1
// @description  Sets the tab favicon to the matching Octicon per pull request state. For open/draft PRs the CI rollup takes over the icon: amber disc while checks run, red x-circle when they fail. Bursts re-applies across the load-settle window (and on turbo/pjax nav) and then polls once a second, re-applying with a fresh URL whenever the state changes or GitHub reclaims the icon (a fresh URL forces Firefox to repaint).
// @match        https://github.com/*/*/pull/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict'

  const LOG = (...a) => console.debug('%c[pr-favicon]', 'color:#8250df', ...a)

  const STATES = {
    open: {
      color: '#1f883d',
      path: 'M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z',
    },
    draft: {
      color: '#656d76',
      path: 'M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 14a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM14 7.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm0-4.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z',
    },
    merged: {
      color: '#8250df',
      path: 'M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z',
    },
    closed: {
      color: '#cf222e',
      path: 'M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 5.5a.75.75 0 0 1 .75.75v3.378a2.251 2.251 0 1 1-1.5 0V7.25a.75.75 0 0 1 .75-.75Zm-2.03-5.273a.75.75 0 0 1 1.06 0l.97.97.97-.97a.748.748 0 0 1 1.265.332.75.75 0 0 1-.205.729l-.97.97.97.97a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-.97-.97-.97.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l.97-.97-.97-.97a.75.75 0 0 1 0-1.06ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z',
    },
  }

  // CI rollup icons — swapped in for open/draft PRs so the tab tells you if checks are running or broke
  const CI_ICONS = {
    // amber solid disc = checks in progress
    pending: { color: '#bf8700', path: 'M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2Z' },
    // red x-circle (evenodd punches the x out) = checks failed
    failure: { color: '#cf222e', fillRule: 'evenodd', path: 'M2.343 13.657A8 8 0 1 1 13.658 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.749.749 0 0 0 .326 1.275.749.749 0 0 0 .734-.215L8 9.06l1.97 1.97a.749.749 0 0 0 1.275-.326.749.749 0 0 0-.215-.734L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z' },
  }

  // GitHub's aggregate check-rollup octicon encodes the state (same set used next to commits)
  const CI_BY_OCTICON = {
    'octicon-x': 'failure',
    'octicon-x-circle-fill': 'failure',
    'octicon-stop': 'failure',
    'octicon-alert': 'failure',
    'octicon-dot-fill': 'pending',
    'octicon-dot': 'pending',
    'octicon-clock': 'pending',
    'octicon-hourglass': 'pending',
    'octicon-check': 'success',
    'octicon-check-circle-fill': 'success',
    'octicon-skip': 'success',
  }
  const CI_BY_COLOR = {
    'color-fg-danger': 'failure',
    'color-fg-severe': 'failure',
    'color-fg-attention': 'pending',
    'color-fg-success': 'success',
  }

  const fromText = (t) => {
    const k = (t || '').trim().toLowerCase()
    return STATES[k] ? k : null
  }

  const detectState = () => {
    // Current React UI: first StateLabel in DOM is the PR header state
    const label = document.querySelector('[class*="StateLabel"]')
    const fromLabel = fromText(label?.textContent)
    if (fromLabel) return fromLabel
    // Legacy UI fallback only (scoped to a real .State badge, not stray State-- widgets)
    const legacy = document.querySelector('.State[class*="State--"]')
    const cls = (legacy?.className || '').toString()
    if (/State--merged/.test(cls)) return 'merged'
    if (/State--draft/.test(cls)) return 'draft'
    if (/State--closed/.test(cls)) return 'closed'
    if (/State--open/.test(cls)) return 'open'
    return null
  }

  // Aggregate CI state from GitHub's check rollup (only rendered on the Conversation tab).
  // Returns 'failure' | 'pending' | 'success' | null (null = unknown, keep the state icon).
  const detectCI = () => {
    // Every commit row carries its own "N / M checks OK" rollup; the LAST in the document is the
    // HEAD commit (newest push) — the only state that matters. Taking the first would pin the icon
    // to a stale earlier commit, so a green HEAD never clears a prior push's red/amber.
    const svgs = [...document.querySelectorAll('svg[aria-label]')].filter((el) => {
      const a = el.getAttribute('aria-label') || '' // rollup reads e.g. "13 / 17 checks OK"
      return /\bchecks?\b/i.test(a) && [...el.classList].some((c) => CI_BY_OCTICON[c])
    })
    const svg = svgs[svgs.length - 1]
    if (!svg) return null
    const octicon = [...svg.classList].find((c) => CI_BY_OCTICON[c])
    if (octicon) return CI_BY_OCTICON[octicon]
    for (let el = svg; el; el = el.parentElement) {
      const c = [...(el.classList || [])].find((x) => CI_BY_COLOR[x])
      if (c) return CI_BY_COLOR[c]
    }
    return null
  }

  // CI status owns the icon while a PR is still open/draft; merged/closed always keep the state icon
  const pickIcon = (state, ci) => {
    if ((state === 'open' || state === 'draft') && (ci === 'failure' || ci === 'pending')) return CI_ICONS[ci]
    return STATES[state]
  }

  let nonce = 0
  let currentKey = null // last state:ci we drew, so we can catch in-place changes (Merge, or CI finishing)
  // Fresh URL each call (invisible nonce pixel) so Firefox is forced to repaint
  const buildHref = ({ color, path, fillRule }) => {
    nonce += 1
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    ctx.scale(2, 2)
    ctx.fillStyle = color
    const p = new Path2D(path)
    fillRule ? ctx.fill(p, fillRule) : ctx.fill(p)
    ctx.fillStyle = `rgba(${nonce % 256},${(nonce >> 8) % 256},0,0.004)`
    ctx.fillRect(0, 0, 1, 1)
    return canvas.toDataURL('image/png')
  }

  const setFavicon = (href) => {
    document.querySelectorAll('link[rel~="icon"]').forEach((l) => l.remove())
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.href = href
    link.dataset.prFavicon = '1'
    document.head.appendChild(link)
  }

  // Unconditional apply with a brand-new URL -> guaranteed repaint even if the DOM already looked "ours"
  const applyForced = (why) => {
    if (!/\/pull\/\d+/.test(location.pathname)) return
    const state = detectState()
    if (!state) { LOG('no state yet', why); return }
    const ci = detectCI()
    setFavicon(buildHref(pickIcon(state, ci)))
    currentKey = state + ':' + (ci || '')
    LOG('applied', state, 'ci=' + ci, '(' + why + ')')
  }

  // Burst of re-applies spanning the load-settle window; each is a fresh URL Firefox will honor
  const burst = (label) => [0, 400, 1200, 2500, 5000].forEach((ms) => setTimeout(() => applyForced(`${label}+${ms}ms`), ms))

  // Poll drives the steady state: first paint (favicon isn't ours yet), GitHub reclaiming the icon,
  // in-place PR state changes (Merge/Close), CI finishing, and SPA navigations (DOM is re-read each tick).
  const poll = () => {
    if (!/\/pull\/\d+/.test(location.pathname)) return
    const state = detectState()
    if (!state) return
    const key = state + ':' + (detectCI() || '')
    const links = document.querySelectorAll('link[rel~="icon"]')
    const ours = links.length === 1 && links[0].dataset.prFavicon === '1'
    if (!ours) applyForced('reclaim')
    else if (key !== currentKey) applyForced('state-change')
  }

  burst('load')
  setInterval(poll, 1000)
  document.addEventListener('turbo:load', () => burst('turbo'))
  document.addEventListener('pjax:end', () => burst('pjax'))
})()
