---
name: release
description: >-
  Cut a GitHub release for a project from a bump keyword, then let CI publish. Use
  when the user runs /release <major|minor|patch|stable [beta]> (optionally a
  project name first) or asks to release / cut / publish / ship a version. Works
  on the current repository or on a workspace of sibling repos (picks one project
  first). Derives the next version from the target repo's latest git tag (an
  explicit semver argument is accepted verbatim), runs safeguards (tag does not
  exist, clean working tree, local build/test), generates the changelog using the
  release-notes conventions, and only after explicit confirmation runs `gh
  release create`. It never bumps versions in files, commits, pushes, or
  publishes to a registry; the repo's release workflow does that once the release
  exists.
argument-hint: "[project] <major|minor|patch|stable [beta]> | [project] <version>"
license: MIT
---

# Release

Cut a GitHub release from a bump keyword (`major` / `minor` / `patch`, optionally
`beta`, or `stable`), with an explicit version number as escape hatch. Nothing is
hardcoded: repo, build command and CI behaviour are detected, with optional
overrides in a `## Releasing` section of the project's `CLAUDE.md` / `AGENTS.md`
(see the end of this file). Ask the user only when detection is ambiguous.

**The contract.** Publishing is CI-driven: a release workflow triggers on the
created release, stamps the versions (repo files stay at their placeholder,
commonly `0.0.0`, never committed back), builds and publishes; the release's
`prerelease` flag picks the dist-tag / target environment. So this skill never
bumps versions, creates commits, pushes tags, or publishes. Its only remote
mutation is `gh release create` in step 6, which must not run before the user
confirms in step 5.

## 0. Resolve the target repo

Resolve `<dir>` (the target repo's directory) and `<slug>` (its `owner/name` on
GitHub) exactly as the **release-notes** skill's step 0 does: single repo vs
sibling-repo workspace, dynamic candidate discovery, slug derived from the
`origin` remote. If that skill is not in context, read `../release-notes/SKILL.md`
(relative to this file) first. Run every git command with `git -C <dir> ...` and
every GitHub command with `--repo <slug>`.

Argument parsing: if the first argument matches a candidate folder name, that is
the `<project>` and the remaining tokens are the version **spec** (step 1);
otherwise all arguments form the spec. Never release more than one project in a
run.

## 1. Resolve the target version

The spec is **required**; if empty, stop and ask what to release. Refresh tags
first:

```bash
git -C <dir> fetch origin --tags --prune
```

Resolve the spec to a concrete `<version>`:

1. **Explicit semver**, matching
   `^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$`: use it
   **verbatim** (escape hatch for e.g. an `-rc.1` or a re-cut); a second token is
   ignored, warn briefly.

2. **`major` / `minor` / `patch`**: base = highest **pure stable** tag:
   ```bash
   git -C <dir> tag -l | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1
   ```
   Bump `X.Y.Z`: `major` -> `(X+1).0.0`, `minor` -> `X.(Y+1).0`, `patch` ->
   `X.Y.(Z+1)`. That target stable is `<version>`, unless a second token `beta`
   asks for a pre-release; then bump the target's beta counter:
   ```bash
   git -C <dir> tag -l "<target>-beta.*" | sed -E 's/.*-beta\.//' | sort -n | tail -1
   ```
   Highest `N` -> `<version>` = `<target>-beta.<N+1>`; no matching tags ->
   `<target>-beta.0`.

3. **`stable`** finalises the running beta: strip the pre-release part off the
   highest beta line:
   ```bash
   git -C <dir> tag -l '*-beta.*' | sed -E 's/-beta\.[0-9]+$//' | sort -V | uniq | tail -1
   ```
   No beta tag at all -> stop; nothing to finalise (point at `major|minor|patch`).
   A second token is not valid here. (With parallel beta lines this picks the
   highest-overall line; fine for a linear flow.)

4. **Anything else** -> invalid spec; stop and show the valid forms
   (`major|minor|patch [beta]`, `stable`, or an explicit semver).

`<version>` is a **pre-release** iff it contains a `-` (`-beta.0`, `-rc.1`);
steps 4 and 6 use this. Log the resolution before the heavy work, e.g.
`patch beta -> 1.4.1-beta.0 (base: 1.4.0)` or `stable -> 1.4.0 (from 1.4.0-beta.6)`.

## 2. Run safeguards

1. **Tag / release must not exist** (hard stop). If either resolves, the version
   already exists:
   ```bash
   git -C <dir> rev-parse -q --verify "refs/tags/<version>"   # non-zero exit = absent = good
   gh release view "<version>" --repo <slug> >/dev/null 2>&1   # idem
   ```
2. **Clean working tree** (warn, do not block). The release is cut from
   `origin/main`, so uncommitted changes are not included; if
   `git -C <dir> status --porcelain` is non-empty, name the dirty files and say
   they will not be part of the release.
3. **Local build / test sanity check** (step 3; hard stop on failure).

Capture the target commit: `git -C <dir> rev-parse origin/main`. The release is
always cut from `origin/main`, never a feature branch, even if that is checked
out. If the default branch is not `main`, use it consistently instead (or read it
from `## Releasing`).

## 3. Local build / test sanity check

Run the same check CI runs (against the local working tree, assumed in sync with
`origin/main`; may take minutes). Resolution order:

1. A `## Releasing` check command from the project's `CLAUDE.md` / `AGENTS.md`:
   run exactly that.
2. Auto-detect from manifests in `<dir>`:
   - `composer.json` -> `<dir>/vendor/bin/pest` (or `composer test` if defined);
     the test suite is the safety net, there is no build.
   - `package.json` with a `build` script -> run it with the package manager from
     the lockfile (`bun.lock*` -> `bun`, `pnpm-lock.yaml` -> `pnpm`, `yarn.lock`
     -> `yarn`, else `npm`), e.g. `bun --cwd <dir> run build`. A monorepo: build
     each package CI builds, in dependency order, plus any post-build step.
3. Ambiguous or nothing found -> **ask** what CI runs; never skip silently.

If the check fails, **stop** and show the output.

## 4. Generate the release notes

Follow the **release-notes** skill, steps 2 to 4 (gather, classify, render), for
`<dir>` / `<slug>`; its emoji house format is mandatory here too. Read
`../release-notes/SKILL.md` first if it is not in context. Release-specific
settings:

- **Base** (by pre-release status from step 1):
  - **Stable target** -> the latest *published* non pre-release release:
    ```bash
    gh release view --repo <slug> --json tagName -q .tagName
    ```
  - **Pre-release target** -> the most recently *published* release of **any**
    kind, so successive betas diff against the previous beta (the first beta of a
    new line falls back to the latest stable automatically):
    ```bash
    gh release list --repo <slug> --exclude-drafts --limit 1 --json tagName -q '.[0].tagName'
    ```
- **Head** = `origin/main` (the target SHA from step 2).
- **Version in the body**: write `<version>` wherever the notes reference the
  release; the compare link is
  `https://github.com/<slug>/compare/<base>...<version>` (that tag exists right
  after step 6).

Two deviations from release-notes' rendering step:

- Write the **raw changelog markdown** (not wrapped in a ```` ```markdown ````
  fence) to `<scratchpad>/release-<slug-basename>-<version>.md`; that file
  becomes the release body via `--notes-file` in step 6.
- Skip release-notes' "after the block" summary; the review gate below replaces it.

## 5. Review gate (mandatory)

Show the generated changelog (inside a ```` ```markdown ```` block) and state the
plan in one line: **repo**, **version**, **pre-release or stable**, **target SHA
(short)**, and the labelled **base** (e.g. `base: 1.4.0-beta.5 (previous beta)`).

Then ask for explicit confirmation. Do **not** run `gh release create` until the
user clearly approves ("yes", "ja", "ship it"). Edits requested -> revise the
notes file and show it again. Declined -> stop; nothing is created.

## 6. Create the release

Only after approval:

```bash
gh release create "<version>" --repo <slug> \
    --target "<target-sha>" \
    --title "Release <version>" \
    --notes-file "<scratchpad>/release-<slug-basename>-<version>.md" \
    <flag>
```

`<flag>` is `--prerelease` for a pre-release, else `--latest`. `--target` pins
the tag to the exact commit the notes were diffed against (no race with new
pushes); the title format `Release <version>` matches existing releases;
`--notes-file` avoids shell-escaping the body.

## 7. After creating

Creating the release starts CI where a release workflow exists. Tell the user, in
their language: the release URL
(`gh release view <version> --repo <slug> --json url -q .url`), what CI now does
(from `## Releasing` if present, else generic: the workflow publishes / deploys,
pre-releases to the pre-release channel), how to watch it
(`gh run list --repo <slug>` or the Actions tab), and that no local versions or
commits were changed. Do **not** publish, push tags, or commit yourself; CI owns
that.

## Optional `## Releasing` overrides

A consuming project's `CLAUDE.md` / `AGENTS.md` may override detection with a
`## Releasing` section. Recognised hints: the build/test check command (step 3),
a candidate-repo filter for workspace mode (step 0), extra or renamed changelog
sections (release-notes step 3), a one-line description of what CI publishes
(step 7), and the default branch if not `main`.
