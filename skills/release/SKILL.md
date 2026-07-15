---
name: release
description: >-
  Cut a GitHub release for a project from a bump keyword, then let CI publish. Use
  when the user runs /release <major|minor|patch|stable [beta]> (optionally a
  project name first) or asks to release / cut / publish / ship a version. Works
  on a single repository (the current one) or on a workspace of sibling repos, in
  which case it picks one project first. Derives the next version from the target
  repo's latest git tag: a bump keyword (major/minor/patch, optionally + beta) is
  resolved against the highest stable tag, beta bumps the existing pre-release
  counter, and `stable` finalises the running beta; an explicit semver argument is
  accepted verbatim. Then runs safeguards (tag does not exist, clean working tree,
  local build/test), generates the changelog using the release-notes conventions,
  shows it for review, and only after explicit confirmation runs `gh release
  create`. It never bumps versions in files, commits, pushes, or publishes to a
  registry; the repo's release workflow does all of that once the release exists.
argument-hint: "[project] <major|minor|patch|stable [beta]> | [project] <version>"
license: MIT
---

# Release

Cut a GitHub release for a project from a bump keyword (`major` / `minor` /
`patch`, optionally `beta`, or `stable`), with an explicit version number accepted
as an escape hatch. Creating the release is the **only** state change this skill
makes; publishing is automated by the repo's CI.

This skill hardcodes no repository, org, build command, or CI behaviour. It
detects those from the target repo, and reads optional overrides from a
`## Releasing` section in the project's `CLAUDE.md` / `AGENTS.md` (see the end of
this file). It asks the user only when detection is ambiguous.

## How releasing works (read first)

Publishing is **CI-driven** wherever a release workflow exists. A repo's
`.github/workflows/*.yml` typically triggers on `release: [prereleased, released]`
and then, on its own, bumps every package's version to the release tag, builds,
and publishes (to npm, a container registry, a CDN deploy, etc.), often picking
the target from the release's `prerelease` flag.

Versions in the repo stay at their placeholder (commonly `0.0.0`) and are stamped
**only in CI**, never committed back. So this skill must **not** bump versions,
create commits, push tags, or publish. It only creates the GitHub release; the
`prerelease` flag on that release is what CI reads to pick the dist-tag / target
environment.

This skill mutates remote state in exactly one place: `gh release create` in step
6. It must not run that before the user confirms in step 5.

## 0. Resolve the target repo

Resolve `<dir>` (the target repo's directory) and `<slug>` (its `owner/name` on
GitHub) exactly as the **release-notes** skill's step 0 does: single repo vs
sibling-repo workspace, dynamic candidate discovery, slug derived from the
`origin` remote. Run **every** git command with `git -C <dir> ...` and **every**
GitHub command with `--repo <slug>`, so the same steps work whether `<dir>` is the
current repo or a sibling.

Release-specific argument parsing: if the first argument matches a candidate
folder name, that is the **`<project>`** and the remaining tokens are the version
**spec** (step 1); otherwise all arguments form the spec. Never release more than
one project in a run.

## 1. Resolve the target version

The spec is the remaining `$ARGUMENTS` after any project token: a **bump keyword**
(first token) plus an optional second token (`beta`). The spec is **required**; if
empty, stop and ask what to release.

Refresh the tags first so the computation reads current state:

```bash
git -C <dir> fetch origin --tags --prune
```

Then resolve the spec to a concrete `<version>`:

1. **Explicit semver**: if the spec already matches
   ```
   ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$
   ```
   use it **verbatim** (escape hatch for e.g. an `-rc.1` or a re-cut). A second
   token is ignored; warn briefly that it has no effect.

2. **`major` / `minor` / `patch`**: take the base = highest **pure stable** tag:
   ```bash
   git -C <dir> tag -l | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1
   ```
   Parse it as `X.Y.Z` and bump:
   - `major` -> `(X+1).0.0`
   - `minor` -> `X.(Y+1).0`
   - `patch` -> `X.Y.(Z+1)`

   This is the **target stable**. With no second token, that is `<version>`.

   With a second token `beta`, find the existing betas of that target and bump the
   counter:
   ```bash
   git -C <dir> tag -l "<target>-beta.*" | sed -E 's/.*-beta\.//' | sort -n | tail -1
   ```
   Highest `N` -> `<version>` = `<target>-beta.<N+1>`; no matching tags ->
   `<target>-beta.0`.

3. **`stable`** finalises the running beta: take the highest beta line and strip
   the pre-release part:
   ```bash
   git -C <dir> tag -l '*-beta.*' | sed -E 's/-beta\.[0-9]+$//' | sort -V | uniq | tail -1
   ```
   The result is `<version>` (the target stable). If there is **no** beta tag,
   stop and tell the user there is nothing to finalise (point them at
   `major|minor|patch`). A second token is not valid here. Known limitation: with
   parallel beta lines this picks the highest-overall line; fine for a linear flow.

4. **Anything else** -> invalid spec; stop and show the valid forms
   (`major|minor|patch [beta]`, `stable`, or an explicit semver).

Determine **pre-release** status from `<version>`: it is a pre-release iff it
contains a `-` (e.g. `-beta.0`, `-rc.1`). Remember this for steps 4 and 6.

Finally, **log the resolution** so the chosen version is visible before the heavy
work, e.g. `patch beta -> 1.4.1-beta.0 (base: 1.4.0)` or
`stable -> 1.4.0 (from 1.4.0-beta.6)`.

## 2. Run safeguards

Tags were refreshed in step 1. Run all three safeguards. **Stop** on a hard
failure; **warn but continue** where noted.

1. **Tag / release must not exist** (hard stop), checked against `<version>`. If
   either resolves, that version already exists, so stop.
   ```bash
   git -C <dir> rev-parse -q --verify "refs/tags/<version>"   # non-zero exit = good (absent)
   gh release view "<version>" --repo <slug> >/dev/null 2>&1   # non-zero exit = good (absent)
   ```
2. **Clean working tree** (warn, do not block). The release is cut from
   `origin/main`, so uncommitted local changes are **not** included. If
   `git -C <dir> status --porcelain` is non-empty, tell the user which files are
   dirty and that they will not be part of the release, then continue.
3. **Local build / test sanity check**, see step 3.

Also capture the target commit for later:

```bash
git -C <dir> rev-parse origin/main   # target SHA the release is cut from
```

The release is always cut from `origin/main` (never `develop` or a feature branch,
even if that is the checked-out branch). If the repo's default branch is not
`main`, use it consistently instead, or read it from `## Releasing`.

## 3. Local build / test sanity check

Run the same check CI runs, so a green local result means CI should be green too.
This tests the **local working tree** (assumed in sync with `origin/main`) and can
take a few minutes. Resolve the check in this order:

1. **`## Releasing` override**: if the project's `CLAUDE.md` / `AGENTS.md` names a
   release check command, run exactly that.
2. **Auto-detect from manifests** (in `<dir>`):
   - `composer.json` present -> run the PHP test suite (`<dir>/vendor/bin/pest`, or
     `composer test` if defined). Pest/PHPUnit is the safety net; there is no build.
   - `package.json` with a `build` script -> run it with the repo's package manager,
     detected from the lockfile (`bun.lock*` -> `bun`, `pnpm-lock.yaml` -> `pnpm`,
     `yarn.lock` -> `yarn`, else `npm`), e.g. `bun --cwd <dir> run build`.
   - A monorepo with several buildable packages -> build each package CI builds,
     in dependency order, plus any post-build step (e.g. a `.d.ts` transform).
3. **Ambiguous or nothing found** -> **ask** the user what CI runs; never skip the
   check silently.

If the check fails, **stop** and show the output; do not create a release on a
broken build.

## 4. Generate the release notes

Produce the changelog by following the **release-notes** skill conventions (same
gathering, classification, sectioning, and house format) for `<dir>` / `<slug>`,
with these release-specific settings:

- **Base** depends on the pre-release status from step 1:
  - **Stable target** (no `-`) -> the latest *published* (non pre-release) release:
    ```bash
    gh release view --repo <slug> --json tagName -q .tagName
    ```
  - **Pre-release target** (contains `-`) -> the most recently *published* release
    of **any** kind, so successive betas diff against the previous beta instead of
    re-listing everything since the last stable:
    ```bash
    gh release list --repo <slug> --exclude-drafts --limit 1 --json tagName -q '.[0].tagName'
    ```
    For the first beta of a new line this falls back to the latest stable
    automatically (no newer pre-release exists).
- **Head** = `origin/main` (the target SHA from step 2).
- **Version in the body**: write `<version>` wherever the notes reference the
  release. The compare link is
  `https://github.com/<slug>/compare/<base>...<version>`; that tag exists right
  after step 6 and points at the target SHA.

### House format (embedded, so it holds without `release-notes` in context)

Classify each entry (split concatenated squash subjects first, then dedupe) into an
**emoji-prefixed** section. The emoji is fixed; the noun after `✨` adapts to the
repo domain (`New components` for a component library, `New packages` for a package
workspace, `New modules` otherwise):

| Signal | Section |
|---|---|
| `feat!:`/`fix!:`, `BREAKING CHANGE:`, removed/renamed public API, prop, param or response field | **⚠️ Breaking changes** |
| An added component/module/package/public file | **✨ New components / packages / modules** |
| `feat(scope): ...` adding features, props, slots, methods, behaviour | **🚀 Features** (grouped by scope) |
| a11y (aria, role, keyboard, focus, roving tabindex, screen reader) | **♿ Accessibility** |
| `fix: ...` | **🐛 Fixes** |
| `perf: ...` | **⚡ Performance** |
| `style(...)`, styling/token/`.scss`/`.css`-only | **🎨 Styles** |
| a notable dependency bump the repo wants listed | **🧹 Chores** (single line) |

Render the body with these headers, in this order, using only sections that have
content:

```markdown
> Pre-release. Install the `next` / `@<version>` build.
> <one-sentence theme>. **Contains breaking changes** (see below).

## ⚠️ Breaking changes
- **<Area>** <what changed>. <Migration in one sentence>.

## ✨ New components
- **`ThingX`** <one-line purpose>.

## 🚀 Features
**<Area>**
- <change>.

## ♿ Accessibility
- **<Component>** now <change>.

## 🐛 Fixes
- <fixed behaviour>, now <correct behaviour>.

## ⚡ Performance
- <change>.

## 🎨 Styles
- <change>.

**Full Changelog:** https://github.com/<slug>/compare/<base>...<version>
```

**The emoji format is mandatory, not a style choice:**

- Every `##` header MUST start with its house emoji. A header without one is wrong.
- **Never** emit the generic GitHub / Keep-a-Changelog style: no `What's Changed`,
  no `What's new`, no bare `### Added` / `### Changed` / `### Removed` /
  `### Features` / `### Fixes` / `### Chores` without the emoji.
- **Never** append PR or commit numbers (`(#26)`, `(#5389625)`); rewrite each
  commit subject as a complete sentence.
- **Never** use em dashes or en dashes; do not separate a name from its
  description with a dash.
- Do **not** mirror a previous release that lacks emoji; this format is
  authoritative, so bring such a repo up to it.

Write the **raw changelog markdown** (the section content, not wrapped in a
```` ```markdown ```` fence, and without the release-notes "after the block"
summary) to a temporary file in the scratchpad, e.g.
`<scratchpad>/release-<slug-basename>-<version>.md`. That file becomes the release
body via `--notes-file` in step 6.

## 5. Review gate (mandatory)

Show the user the generated changelog for review (render it inside a
```` ```markdown ```` block so it reads cleanly), and state the release plan in
one line: **repo** (slug), **version**, **pre-release or stable**, **target SHA
(short)**, and the **base** it was diffed against (labelled, e.g.
`base: 1.4.0-beta.5 (previous beta)` vs `base: 1.4.0 (latest stable)`).

Then **ask for explicit confirmation**. Do **not** run `gh release create` until
the user clearly approves (e.g. "yes", "ja", "ship it"). If they ask for edits,
revise the notes file and show it again. If they decline, stop; nothing is created.

## 6. Create the release

Only after approval:

```bash
gh release create "<version>" --repo <slug> \
    --target "<target-sha>" \
    --title "Release <version>" \
    --notes-file "<scratchpad>/release-<slug-basename>-<version>.md" \
    <flag>
```

Notes:
- `<flag>` is `--prerelease` when step 1 marked the version a pre-release, else
  `--latest`.
- `--target <sha>` pins the tag to the exact commit the notes were diffed against
  (the `origin/main` SHA from step 2), avoiding a race with new pushes.
- Title format is `Release <version>`, matching existing releases.
- `--notes-file` avoids shell-escaping the markdown body.

## 7. After creating

Creating the release **starts CI** where a release workflow exists. Tell the user,
in their language:

- the release URL (`gh release view <version> --repo <slug> --json url -q .url`),
- what CI now does for this repo (from the `## Releasing` notes if present, else
  described generically): a release workflow, if any, is now running and will
  publish / deploy; a pre-release goes to the pre-release channel, a stable release
  to the default one,
- a pointer to watch it (`gh run list --repo <slug>` or the Actions tab, when a
  workflow exists),
- a one-line reminder that no local versions/commits were changed.

Do **not** run a publish command, push tags, or create commits yourself; CI owns
that.

## Optional `## Releasing` overrides

A consuming project may add a `## Releasing` section to its `CLAUDE.md` /
`AGENTS.md`. Everything is auto-detected otherwise; use this only to override.
Recognised hints:

- the build / test check command CI relies on (step 3),
- a candidate-repo filter for workspace mode: an org or an explicit folder list
  (step 0),
- extra or renamed changelog sections (release-notes step 3),
- a one-line description of what CI publishes, for the step 7 hand-off message,
- the default branch, if not `main`.
