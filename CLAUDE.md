# CLAUDE.md

Persistent animated atmospheric background for the Nimbus ecosystem. React 18+
peer dependency, **zero dependencies of its own**, SSR-safe.

## Commands

```bash
npm run lint
npm run typecheck
```

No tests and no CI workflow exist. These two scripts are the only checks.

## Guarantees that must not break

- **Zero dependencies.** Do not add one.
- **Navigation-stable.** Cloud positions derive from `performance.now()` **since
  page load**, not from component mount, so navigating never causes a snap or
  reset. **Do not move that state into React state.**
- **GPU-composited.** All movement is `transform: translateX(...)` with
  `will-change: transform` — zero layout work per frame. Never animate layout
  properties.
- **SSR-safe.** Returns a no-op stub in server environments; no `window` or
  `performance` access at import time.
- **Tab-aware.** The RAF loop suspends when hidden and resumes at the correct
  time-derived position.
- Dark mode swaps gradients, accents, and fills — **nothing re-times.** Lightning
  is scheduled from elapsed time for the same reason.


---

## Cross-repo work — the agent team

This repo is one of eight under `~/nimbus`. The couplings between them that
**nothing enforces** — no compiler, no test, no type — are written down in
`~/nimbus/nimbus-tools/docs/CONTRACTS.md`. Break one and nothing goes red; the
system just starts being quietly wrong in production.

### This package is vendored, not installed

It is copied into **three** consumers, each pinning
`"nimbus-atmosphere": "file:./nimbus-atmosphere"` — contract **C3**:

| Consumer | Vendored version | Upstream |
|---|---|---|
| `nimbus-controlplane` | 1.0.1 | 1.0.1 ✅ |
| `nimbus-fe` | **1.0.0** | 1.0.1 ❌ |
| `nimbus-decrypt` | **1.0.0** | 1.0.1 ❌ |

`npm update` will **never** propagate a change — each copy has to be made
deliberately. Fix here first, then propagate through `release-conductor`. A fix
that lands upstream and nowhere else means the same bug gets fixed three times,
differently.

**Ask `contract-guard` before merging anything touching the paths above.** The
full roster and the 14-stage pipeline are in `~/nimbus/nimbus-tools/docs/TEAM.md`
and `PIPELINE.md`; `docs/OPERATIONS.md` records what CI and the environments
actually do.
