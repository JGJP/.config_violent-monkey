# .config/violent-monkey

[Violent Monkey](https://violentmonkey.github.io/) userscripts and settings, mostly quality-of-life tweaks for GitHub.

## Scripts

| Script | What it does |
| --- | --- |
| [`github-pr-state-favicon.user.js`](github-pr-state-favicon.user.js) | Sets the tab favicon to the matching Octicon per PR state (open/draft/merged/closed), re-applying so Firefox actually repaints. |
| [`github-pr-auto-load-more.user.js`](github-pr-auto-load-more.user.js) | Continuously clicks "Load more" buttons on PR pages until none remain. |
| [`github-pr-expand-ci-checks-no-scroll.user.js`](github-pr-expand-ci-checks-no-scroll.user.js) | Keeps the PR checks section expanded at full height, with skipped checks folded. |
| [`github-mark-merged-closed-read-pr-notifications-as-done.user.js`](github-mark-merged-closed-read-pr-notifications-as-done.user.js) | Adds buttons to the notifications page to mark merged, closed, or read PR notifications as done. |

`config.json` is Violent Monkey's exported settings (per-script enabled state and options).

## Style

Userscripts follow [antfu](https://github.com/antfu/eslint-config) conventions: no semicolons, single quotes, 2-space indent, arrow IIFE with `'use strict'`.

## Installing a script

Open a script's raw URL in a browser with Violent Monkey installed, or paste its contents into a new Violent Monkey script. Each targets GitHub only (`@match https://github.com/*`).
