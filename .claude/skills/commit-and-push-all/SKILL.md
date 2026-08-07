---
name: commit-and-push-all
description: When the user asks to make a change in this repo (config-violent-monkey), always commit the change and push it to all remotes (github and origin) after finishing.
---

# Commit and Push to All Remotes

Whenever the user asks you to make a change in this repository, after you finish the change you must:

1. Stage and commit the change with a minimal, descriptive, lowercase imperative message (see the `/commit` conventions). Do not add attribution.
2. **Ask the user to confirm before pushing, using the `AskUserQuestion` tool to present a yes/no choice** (do not just ask in plain text). Only if they choose yes, push to **all** remotes (`github` and `origin`) by running this command directly:

```bash
for r in $(git remote); do git push "$r" -u "$(git rev-parse --abbrev-ref HEAD)"; done
```

## Notes

- This applies to any change the user requests here, not just when they explicitly say "commit" or "push".
- If there are multiple logical changes, commit them separately (as in `/commit`) before the final push.
- The command above loops over every configured `git remote` and pushes the current branch with `-u` to each, so it stays correct if remotes are added or renamed.
