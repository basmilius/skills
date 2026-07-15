---
name: release-notes
description: >-
  Generate GitHub release notes / a changelog for a project by diffing a base ref
  against its main branch. Use when the user runs /release-notes (optionally a
  project name and/or a base tag) or asks for a changelog / release notes for an
  upcoming or specific version. Works on a single repository (the current one) or
  on a workspace of sibling repos, in which case it picks one project first. With
  a tag argument that tag is the comparison base; with no tag the base is that
  repo's latest published (non pre-release) GitHub release. The head is always
  origin/main. Output is copy-pasteable English markdown; it never creates or
  publishes a release.
argument-hint: "[project] [base-tag]"
license: MIT
---

# Release notes

Produce release notes (a changelog) for a project by comparing a **base** ref
against **`origin/main`**, classifying every change, and rendering them in the
house format below.

This skill is **read-only**: it gathers git/GitHub data and writes markdown to the
chat. It does **not** create tags, releases, commits, or publish anything. It
hardcodes no repository, org, or taxonomy; it detects those, and reads optional
overrides from a `## Releasing` section in the project's `CLAUDE.md` / `AGENTS.md`.

## 0. Resolve the target repo

Decide which repository these notes cover, then derive its slug. From here on,
`<dir>` is that repo's directory and `<slug>` is its `owner/name` on GitHub. Run
**every** git command with `git -C <dir> ...` and **every** GitHub command with
`--repo <slug>`.

1. **Single repo**: if the current directory is inside a git repo
   (`git rev-parse --show-toplevel` succeeds) and it has an `origin`, that is the
   target. `<dir>` is its toplevel. Any argument is then the base tag, **unless**
   the first argument names a sibling folder (then treat it as a workspace, below).
2. **Sibling-repo workspace**: if the current directory is not itself a repo (or
   the first argument names a sibling), discover the **candidate repos**
   dynamically, do not hardcode them: every direct subdirectory with an `origin`
   remote (optionally narrowed by an org filter or folder list from `## Releasing`).
   ```bash
   for sub in */; do
       slug=$(git -C "$sub" remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s/\.git$//')
       [ -n "$slug" ] && echo "${sub%/}  ->  $slug"
   done
   ```
   If the first argument matches a candidate folder name, that is the
   **`<project>`** and `<dir>` is that folder; the remaining token (if any) is the
   base tag. Otherwise show the candidate list and **ask which single project** to
   target. Never generate notes for more than one project in a run.
3. **Derive the slug** from the target's remote:
   ```bash
   git -C <dir> remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s/\.git$//'
   ```

## 1. Resolve the comparison range

Refresh tags and gather the latest published release, then reuse those values:

```bash
git -C <dir> fetch origin --tags --prune
gh release view --repo <slug> --json tagName -q .tagName 2>/dev/null || echo '(none published yet)'
```

1. **Head** is always `origin/main`.
2. **Base**:
   - If a base tag was given (the token after the project, or the only token when
     it is not a project name), treat it as the base ref. Verify it resolves:
     `git -C <dir> rev-parse "<base>"`. If it fails, stop and tell the user the tag
     was not found.
   - Otherwise, use the **latest published release** (GitHub marks it "Latest";
     pre-releases are excluded automatically). If none exists yet, use the first
     commit as base (`git -C <dir> rev-list --max-parents=0 HEAD | tail -1`) and
     say so.
3. If `base` and `origin/main` point at the same commit, say there are no changes
   since the base and stop.

## 2. Gather the diff

Run these against `<base>..origin/main` inside the target repo:

```bash
git -C <dir> log --oneline --no-merges <base>..origin/main   # commit subjects
git -C <dir> diff --name-status <base>..origin/main          # added/removed/modified files
git -C <dir> diff --stat <base>..origin/main                 # scale
```

Read the actual diff wherever a commit subject is ambiguous. Confirm structural
claims from file status rather than trusting messages alone:

- **Removed public API** (deleted exported files, removed endpoints, deleted
  components) is likely breaking; open the diff to confirm.
- **Renamed/removed props, params, or response fields** are breaking; inspect the
  touched file's diff with `git -C <dir> diff <base>..origin/main -- <file>`.

## 3. Classify

Assume **Conventional Commits**, and note that a single squashed subject often
**concatenates several `type(scope): ...` entries** on one line. Split each subject
into individual entries before classifying, and **dedupe** identical entries that
appear across multiple commits.

Map each entry to a section by its type and content:

| Signal | Section |
|---|---|
| `!` after type (`feat!:`, `fix!:`), a `BREAKING CHANGE:` footer, a deleted exported/component file, or a removed/renamed public API, prop, param or response field | **⚠️ Breaking changes** |
| An added component/module/public file | **✨ New components** |
| `feat(scope): ...` adding features, props, slots, methods, behaviour | **🚀 Features** (grouped by scope/area) |
| Any entry about a11y (scope or text mentions accessibility, aria, role, keyboard, focus, roving tabindex, screen reader) | **♿ Accessibility** |
| `fix: ...` | **🐛 Fixes** |
| `perf: ...` | **⚡ Performance** |
| `style(...)`, styling/token/`.scss`- or `.css`-only changes | **🎨 Styles** |

Rules:
- An a11y-flavoured `feat` goes under **Accessibility**, not Features.
- Omit pure docs/examples/test/CI/dep-bump churn (`docs:`, `test:`, `ci:`,
  `chore: bump deps`) unless it is user-facing.
- Lead the **Breaking changes** section with the highest-impact items (removed
  public API / components first) and state the migration as a short follow-up
  sentence.
- Group **Features** by scope (e.g. **Tables**, **Forms**, **Shop**) when there
  are several; a short flat list is fine for a small release.
- A project may add or rename domain sections (e.g. a **📊 Statistics** section)
  via its `## Releasing` notes; use those when present, and drop the generic
  sections that do not fit its domain.

## 4. Render

Output **one fenced ` ```markdown ` code block** so it is copy-pasteable, in
**English**. Use only the sections that have content, in this order. Include the
pre-release banner line only when the target is a pre-release.

````markdown
> Pre-release. Install the `next` / `@<version>` build.
> <one-sentence summary of the release's theme>. **Contains breaking changes** (see below).

## ⚠️ Breaking changes

- **<Area>** <what changed>. <Migration in one sentence>.

## ✨ New components

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

Rendering rules:
- **Never use em dashes or en dashes anywhere in the output.** Phrase each
  entry as a complete sentence; do not separate a name from its description with a
  dash. Use "now" for behavioural and fix entries, and use commas, parentheses or
  separate sentences elsewhere.
- Build the compare link from the slug and refs:
  `https://github.com/<slug>/compare/<base>...origin/main`. When preparing notes
  for a specific tag that already exists, use that tag instead of `origin/main`.
- Drop the pre-release banner and the breaking-changes mention in the summary line
  when they do not apply.

## 5. After the block

Below the code block, add 2 to 4 short bullets (in the user's language) covering:
the resolved range (`<base> -> origin/main` for `<slug>`), the most important
breaking changes to highlight, whether a11y items were summarised or listed per
component, and an offer to expand any section. Do **not** create the release.
