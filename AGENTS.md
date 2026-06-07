# Agent instructions

## Dependency security: `minimumReleaseAge`

When enabled, this project will use **`minimumReleaseAge: 10080`** (7 days) in `pnpm-workspace.yaml` to reduce supply-chain risk from freshly published compromised packages.

**Agents must NEVER change, disable, lower, or bypass `minimumReleaseAge`** (including setting it to `0`, removing it, adding broad `minimumReleaseAgeExclude` entries, or using flags/workarounds to install brand-new versions) to fix dependency issues, lint failures, or CI problems.

If a security fix or dependency update appears blocked by `minimumReleaseAge`:

1. Prefer an **already-published patched version** that satisfies the age requirement.
2. Use **`overrides`** in `pnpm-workspace.yaml` only for a specific, justified transitive fix — not to circumvent the release-age policy globally.
3. **`minimumReleaseAgeExclude`** may only be added for a **named package/version** after **explicit confirmation from the repository owner**, and only when no other patched version is available within the age window.

When in doubt, ask the owner before touching release-age settings.

## Cursor Cloud specific instructions

PostLabel is a single-package Astro 6 static site (React island for PDF processing). There is no database, Docker, or backend API.

### Node.js version

The repo requires **Node 24** (see `.nvmrc` and `package.json` `engines`). Cloud VMs may have `/exec-daemon/node` (v22) earlier on `PATH` than nvm — prepend Node 24 before running pnpm:

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
export PATH="$NVM_DIR/versions/node/$(cat .nvmrc).0/bin:$PATH"  # or pin v24.16.0
```

### Commands

See `README.md` for the canonical list. Quick reference:

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Dev server | `pnpm dev` → http://localhost:4321 |
| Lint | `pnpm lint` (oxlint + `tsc --noEmit`) |
| Typecheck | `pnpm typecheck` (`astro check`) |
| Build | `pnpm build` |
| Preview prod build | `pnpm preview` |

### Dev server

- Start with `pnpm dev` (add `--host 0.0.0.0` if accessing from outside the VM).
- Core workflow lives at `/print/` — upload Royal Mail / eBay / ParcelForce PDFs; processing is entirely client-side.
- PostHog analytics (`PUBLIC_POSTHOG_KEY` in `.env`) is optional for local dev.

### Known environment caveats

- `astro check` can OOM on constrained VMs; use `NODE_OPTIONS="--max-old-space-size=8192"` if needed. `pnpm build` is the more reliable compile check.
- `pnpm lint` runs `tsc --noEmit`, which may report `import.meta.env.MODE` typing separately from `astro build` (Astro injects `MODE` at build time).
