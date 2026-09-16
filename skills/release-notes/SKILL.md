---
name: release-notes
description: >-
  Generate GitHub release notes / a changelog for a project by diffing a base ref
  against origin/main. Use when the user runs /release-notes (optionally a
  project name and/or a base tag) or asks for a changelog / release notes for an
  upcoming or specific version. Works on the current repository or on a workspace
  of sibling repos (picks one project first). With a tag argument that tag is the
  comparison base; with no tag the base is the repo's latest published (non
  pre-release) GitHub release. Output is copy-pasteable English markdown; it
  never creates or publishes a release.
argument-hint: "[project] [base-tag]"
license: MIT
---

# Release notes

Produce release notes for a project by comparing a **base** ref against
**`origin/main`**, classifying every change, and rendering the house format
below. This skill is **read-only**: it writes markdown to the chat and creates,
tags and publishes nothing. It hardcodes no repository, org, or taxonomy; it
detects those, with optional overrides from a `## Releasing` section in the
project's `CLAUDE.md` / `AGENTS.md`.

## 0. Resolve the target repo

Decide which repository these notes cover; `<dir>` is that repo's directory and
`<slug>` its `owner/name` on GitHub. Run **every** git command with
`git -C <dir> ...` and **every** GitHub command with `--repo <slug>`.

1. **Single repo**: if the current directory is inside a git repo
   (`git rev-parse --show-toplevel` succeeds) and it has an `origin`, that is the
   target; `<dir>` is its toplevel. Any argument is then the base tag, **unless**
   the first argument names a sibling folder (then treat it as a workspace).
2. **Sibling-repo workspace**: if the current directory is not itself a repo (or
   the first argument names a sibling), discover the **candidate repos**
   dynamically, never hardcoded: every direct subdirectory with an `origin`
   remote (optionally narrowed by an org filter or folder list from `## Releasing`).
   ```bash
   for sub in */; do
       slug=$(git -C "$sub" remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s/\.git$//')
       [ -n "$slug" ] && echo "${sub%/}  ->  $slug"
   done
   ```
   If the first argument matches a candidate folder name, that is the
   **`<project>`** and `<dir>` is that folder; the remaining token (if any) is
   the base tag. Otherwise show the candidates and **ask which single project**
   to target. Never generate notes for more than one project in a run.
3. **Derive the slug** from the target's remote:
   ```bash
   git -C <dir> remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s/\.git$//'
   ```

## 1. Resolve the comparison range

Refresh tags and read the latest published release:

```bash
git -C <dir> fetch origin --tags --prune
gh release view --repo <slug> --json tagName -q .tagName 2>/dev/null || echo '(none published yet)'
```

1. **Head** is always `origin/main`.
2. **Base**: a given base tag (verify with `git -C <dir> rev-parse "<base>"`;
   stop if it does not resolve). Otherwise the **latest published release**
   (GitHub's "Latest", pre-releases excluded). If none exists, use the first
   commit (`git -C <dir> rev-list --max-parents=0 HEAD | tail -1`) and say so.
3. If base and `origin/main` point at the same commit, say there are no changes
   and stop.

## 2. Gather the diff

Run against `<base>..origin/main`:

```bash
git -C <dir> log --oneline --no-merges <base>..origin/main   # commit subjects
git -C <dir> diff --name-status <base>..origin/main          # added/removed/modified files
git -C <dir> diff --stat <base>..origin/main                 # scale
```

Read the actual diff wherever a subject is ambiguous, and confirm structural
claims from file status rather than messages alone: deleted exported
files/endpoints/components are likely breaking, and renamed/removed props,
params or response fields are breaking; inspect with
`git -C <dir> diff <base>..origin/main -- <file>`.

## 3. Fold follow-ups on work introduced in this range

Release notes describe the state at `origin/main` relative to the state at
`<base>`, not the commit history. A feature added after `<base>` and then
tuned, fixed or restyled before release is still just that feature: the reader
never saw it behave differently, so those follow-up commits are **not** fixes,
performance work or style changes. Fold them before classifying.

Detect what already existed at the base, then check which files each commit
touches:

```bash
git -C <dir> ls-tree -r --name-only <base> > /tmp/base-files
git -C <dir> log --name-only --format='@@%h %s' <base>..origin/main
```

For every `fix`, `perf`, `style` or `refactor` commit:

- All touched files absent from `base-files` (or the entry carries the same
  `(scope)` as a `feat` in this range and that scope did not exist at the
  base): the commit only touches new work. **Drop it silently.** If it changes
  what the feature does, the feature's line describes the final behaviour.
- Some touched files existed at the base: keep only the part that affects
  pre-existing behaviour as a separate entry; inspect the diff to split it.
- Unsure whether a commit touches pre-existing behaviour: read the diff
  (`git -C <dir> show <hash>`), do not guess.

Also apply the same "final state" reading to features themselves:

- A feature (or component/module/file) added and removed again within the range
  is omitted entirely.
- A feature added and then renamed within the range is listed once, under its
  final name.
- A `!` marker or `BREAKING CHANGE:` footer on something that did not exist at
  the base is not breaking; treat the entry as part of the new feature.
- A fix to a feature that **did** exist at the base stays a fix, even when that
  feature was also extended in this range.

Keep a count of folded commits per feature for step 5.

## 4. Classify

Assume **Conventional Commits**. A squashed subject often concatenates several
`type(scope): ...` entries on one line: split them first, then **dedupe**
identical entries across commits. Map each entry to a section:

| Signal | Section |
|---|---|
| `!` after type (`feat!:`, `fix!:`), a `BREAKING CHANGE:` footer, a deleted exported/component file, or a removed/renamed public API, prop, param or response field | **⚠️ Breaking changes** |
| An added component/module/public file/package | **✨ New components** (noun adapts, see step 5) |
| `feat(scope): ...` adding features, props, slots, methods, behaviour | **🚀 Features** (grouped by scope/area) |
| Any entry about a11y (accessibility, aria, role, keyboard, focus, roving tabindex, screen reader) | **♿ Accessibility** |
| `fix: ...` | **🐛 Fixes** |
| `perf: ...` | **⚡ Performance** |
| `style(...)`, styling/token/`.scss`- or `.css`-only changes | **🎨 Styles** |

Rules:
- An a11y-flavoured `feat` goes under **Accessibility**, not Features.
- Omit pure docs/examples/test/CI/dep-bump churn unless user-facing. A notable
  dependency or maintenance line a repo does want goes under `## 🧹 Chores` as a
  single line, never as a bare `### Chores`.
- Lead **Breaking changes** with the highest-impact items (removed public API /
  components first); state the migration as a short follow-up sentence.
- Group **Features** by scope (e.g. **Tables**, **Forms**) when there are
  several; a short flat list is fine for a small release.
- A project may add or rename domain sections (e.g. **📊 Statistics**) via its
  `## Releasing` notes; use those and drop generic sections that do not fit.

## 5. Render

Output **one fenced ` ```markdown ` code block** (copy-pasteable), in
**English**, using only the sections that have content, in this order:

````markdown
> Pre-release. Install the `next` / `@<version>` build.
> <one-sentence summary of the release's theme>. **Contains breaking changes** (see below).

## ⚠️ Breaking changes

- **<Area>** <what changed>. <Migration in one sentence>.

## ✨ New components

<!-- noun adapts to the repo: "New components" | "New packages" | "New modules" -->
- **`ThingX`** <one-line purpose as a predicate>.

## 🚀 Features

**<Area, e.g. Tables>**
- <change>.

## ♿ Accessibility

- **<Component or group>** now <change>.

## 🐛 Fixes

- <fixed behaviour>, now <correct behaviour>.

## ⚡ Performance

- <change>.

## 🎨 Styles

- <change>.

**Full Changelog:** https://github.com/<slug>/compare/<base>...origin/main
````

**The emoji house format is mandatory, not a style choice:**

- Every `##` header MUST start with its house emoji (`⚠️`, `✨`, `🚀`, `♿`,
  `🐛`, `⚡`, `🎨`, `🧹`); the noun after it adapts to the repo's domain
  (`New components` for a component library, `New packages` for a package
  workspace, `New modules` otherwise).
- **Never** emit the generic GitHub / Keep-a-Changelog style: no `What's
  Changed`, no `What's new`, no bare `### Added` / `### Changed` / `### Removed`
  / `### Fixed` / `### Features` / `### Fixes` / `### Chores` without the emoji.
- **Never** append PR or commit numbers (`(#26)`, `(#5389625)`) unless the
  repo's own emoji releases demonstrably do; rewrite each commit subject as a
  complete sentence instead of copying it verbatim (`feat(form): add ...`).
- **Never** use em dashes or en dashes; do not separate a name from its
  description with a dash. Use "now" for behavioural and fix entries; commas,
  parentheses or separate sentences elsewhere.
- Do **not** mirror a previous release that lacks emoji; this template is
  authoritative, so bring such a repo up to it.
- Build the compare link from the slug and refs; when preparing notes for a tag
  that already exists, use that tag instead of `origin/main`. Drop the
  pre-release banner and the breaking-changes mention when they do not apply.

## 6. After the block

Below the code block, add 2 to 5 short bullets in the user's language: the
resolved range (`<base> -> origin/main` for `<slug>`), the most important
breaking changes, how many follow-up commits were folded into which features
(step 3, so the user can verify), whether a11y items were summarised or listed
per component, and an offer to expand any section. Do **not** create the
release.
