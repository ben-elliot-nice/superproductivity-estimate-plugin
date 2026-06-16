# Project Instructions

## Branch Model

- `dev` — active development. All day-to-day work happens here.
- `main` — stable releases only. Never commit directly to main. Changes arrive via PR from dev.

## Version Bumping

Both `package.json` and `public/manifest.json` must always have the same version. Update both together.

### On `dev`
Bump the **patch** version on every meaningful change (feature, fix, refactor). Not every commit needs a bump, but every logical unit of work should have one before pushing.

```
1.1.0 → 1.1.1 → 1.1.2 → ...
```

### Before PR to `main`
Bump **minor** or **major** before opening (or updating) the PR. The CI version gate will block the merge if only a patch has been incremented relative to main.

- **Minor** (`1.1.x → 1.2.0`) — new features or meaningful improvements
- **Major** (`1.x.x → 2.0.0`) — breaking changes or significant rewrites

The version gate reads `public/manifest.json` on both branches and compares minor/major. Patch-only changes fail the gate.

## Changelog (`public/manifest.json`)

### During dev (patch bumps)
Add a concise entry for every patch version bumped. Write it as a plain-language description of what changed — not a commit hash, not "misc fixes".

```json
"changelog": {
  "1.1.3": "Fix scroll position lost on estimate update",
  "1.1.2": "Exclude done subtasks from schedule propagation",
  "1.1.1": "Colour-coded scheduled badge by timing"
}
```

### On PR to `main` (minor/major bump)
**Collapse all patch entries from this dev cycle into a single entry** for the new minor/major version. Do not carry forward the individual patch entries — they exist in git history.

```json
"changelog": {
  "1.2.0": "Filter bar redesign, scheduled badge colours, Now button, subtask schedule propagation with confirmation, scroll preservation"
}
```

Remove the patch entries (1.1.x) that are being rolled up. The new entry should read as a coherent summary of the release, not a concatenation of patch notes.

### Retention rule
**Always keep all minor and major version entries.** Never delete them. The changelog in `manifest.json` is the permanent, human-readable history of stable releases.

```json
"changelog": {
  "1.2.0": "...",  ← keep forever
  "1.1.0": "...",  ← keep forever
  "1.0.0": "..."   ← keep forever
}
```

## CI / Release Behaviour

- Push to `dev` → CI builds, publishes a **pre-release** tagged `v{version}-dev`
- Push to `main` (via merged PR) → CI builds, publishes a **stable release** tagged `v{version}`
- The version gate runs on every PR targeting main and fails if minor/major hasn't been bumped

### Downloading a release artifact

`scripts/download-release.sh` polls the GitHub Releases API until the asset is available, then downloads the zip to `~/scratch`.

```sh
./scripts/download-release.sh              # auto-detects tag from branch + manifest version
./scripts/download-release.sh v1.2.0       # specific tag
./scripts/download-release.sh --interval 5 --timeout 120
```

## What Counts as Minor vs Major

- **Minor** — new user-visible features, UI changes, new API usage, performance improvements
- **Major** — breaking changes to the plugin's contract with SP (manifest fields, hook names, permission changes), or a full rewrite

When in doubt, use minor. Major should be rare.

## Commit Messages

Prefix commits with the new version number when bumping:

```
1.1.3 fix scroll position on estimate update
1.1.4 exclude done subtasks from schedule propagation
```

For non-version-bump commits (refactors, chores, docs):

```
chore: add changelog to manifest
fix: correct version gate baseline
```

## Sync Check

Before any version bump, confirm:
1. `package.json` version === `public/manifest.json` version
2. A changelog entry exists for the new version in `manifest.json`
3. The new entry is present before committing — not added as a follow-up
