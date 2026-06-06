# Agent instructions

## Dependency security: `minimumReleaseAge`

When enabled, this project will use **`minimumReleaseAge: 10080`** (7 days) in `pnpm-workspace.yaml` to reduce supply-chain risk from freshly published compromised packages.

**Agents must NEVER change, disable, lower, or bypass `minimumReleaseAge`** (including setting it to `0`, removing it, adding broad `minimumReleaseAgeExclude` entries, or using flags/workarounds to install brand-new versions) to fix dependency issues, lint failures, or CI problems.

If a security fix or dependency update appears blocked by `minimumReleaseAge`:

1. Prefer an **already-published patched version** that satisfies the age requirement.
2. Use **`overrides`** in `pnpm-workspace.yaml` only for a specific, justified transitive fix — not to circumvent the release-age policy globally.
3. **`minimumReleaseAgeExclude`** may only be added for a **named package/version** after **explicit confirmation from the repository owner**, and only when no other patched version is available within the age window.

When in doubt, ask the owner before touching release-age settings.
