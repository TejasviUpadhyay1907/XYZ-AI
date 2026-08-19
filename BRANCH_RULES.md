# Branch Rules for AI Assistants

## IMPORTANT — Read Before Any Commit or Push

This repository uses two parallel development branches:

| Branch | Assigned To | Rule |
|--------|------------|------|
| `branch-1` | Claude (Anthropic) | Claude ONLY works here |
| `branch-2` | Kiro (Amazon) | Kiro ONLY works here |
| `main` | Nobody | Base code — do NOT push here |

## If You Are Claude

```bash
git checkout branch-1
# Make your changes
git push origin branch-1
```

NEVER push to `branch-2` or `main`.

## If You Are Kiro

```bash
git checkout branch-2
# Make your changes
git push origin branch-2
```

NEVER push to `branch-1` or `main`.

## Why This Matters

Both AI assistants are building the same project independently so the developer
can compare the two approaches. Cross-branch commits contaminate the comparison.
