# basmilius/skills

A collection of [Agent Skills](https://vercel.com/docs/agent-resources/skills) by
[Bas Milius](https://github.com/basmilius), installable with `npx skills`.

Skills are portable instructions that teach an AI coding agent (Claude Code,
Cursor, Copilot, and many others) how to do a specific kind of work well.

## Install

Install all skills:

```bash
npx skills add basmilius/skills
```

Install a single skill:

```bash
npx skills add basmilius/skills --skill vue-component-anatomy
```

List what the repo offers without installing:

```bash
npx skills add basmilius/skills --list
```

Update what you already installed, all of them or one by name:

```bash
npx skills update
npx skills update dropoff
```

`npx skills` uses GitHub as its registry and installs each skill into your
agent's skills directory (for example `.claude/skills/` or `.agents/skills/`).
See [vercel-labs/skills](https://github.com/vercel-labs/skills) and
[skills.sh](https://skills.sh).

## Skills

| Skill | What it covers |
| --- | --- |
| [`vue-component-anatomy`](skills/vue-component-anatomy/SKILL.md) | The internal anatomy of a single Vue 3 SFC: block order, macro order, `<script setup>` ordering, prop/emit typing, styling. |
| [`vue-build-feature`](skills/vue-build-feature/SKILL.md) | Building a Vue 3 feature across multiple components and layers: view-orchestrates / components-present, feature folders and barrels, composables, routing, the build sequence. |
| [`flux-ui`](skills/flux-ui/SKILL.md) | Building, editing and reviewing Vue 3 UIs with the [Flux](https://flux-ui.dev) design system: picking the right component, imports and composition, the naming traps. |
| [`basmilius`](skills/basmilius/SKILL.md) | The `@basmilius` npm scope as one stack: the `@basmilius/utils` helper catalog, the `@basmilius/http-client` DTO data layer (`@dto` / `@adapter` / `BaseService`) and the `@basmilius/common` Vue 3 app primitives (`defineStore`, `useService`, `useDataTable`, composables). |
| [`dropoff`](skills/dropoff/SKILL.md) | Publish a markdown doc, a diagram, a code snippet, a sortable table, a single-file diff or a small file from the terminal to your own host, tagged so it can be found back, and lay the diagram out so its connectors actually line up. Reads a published page back and republishes over it, so a plan or a review stays current instead of going stale. Host and token come from configuration. |
| [`release`](skills/release/SKILL.md) | Cut a GitHub release from a bump keyword (`major`/`minor`/`patch`/`stable`, optionally `beta`) and let CI publish; works on a single repo or a sibling-repo workspace. |
| [`release-notes`](skills/release-notes/SKILL.md) | Generate a copy-pasteable changelog by diffing a base tag against `origin/main`; read-only, creates nothing. |
| [`unslop`](skills/unslop/SKILL.md) | Editing prose so it stops reading as AI generated: the tells to cut (puffery, "not just X but Y", em dashes, rule of three, hedging, abstract metaphor nouns) and the voice to put back. |
| [`code-comments`](skills/code-comments/SKILL.md) | Keeping comments and doc blocks worth reading: the test a comment has to pass, the ones to delete (restating the code, listing fields, copied boilerplate, a comment that drifted off its line), cutting a long one down, and what belongs in a doc block. |
| [`html-report`](skills/html-report/SKILL.md) | Standalone HTML reports with a calm editorial layout, a project-specific accent color and optional evidence, comparisons, charts and action plans. |

The two `vue-*` skills are library-neutral and pair with `flux-ui` when a project
uses Flux. The `basmilius` skill covers the `@basmilius/*` sibling libraries
with a guide per package. The `release` and `release-notes`
skills are project-neutral: they
auto-detect the repo, build check and CI, and read optional overrides from a
`## Releasing` section in the project's `CLAUDE.md` / `AGENTS.md`. `unslop`
covers writing rather than code, so it applies to any prose the agent produces:
docs, release notes, commit bodies and UI copy. `code-comments` is its counterpart
inside the code and is language-neutral, so it applies to every file the agent
touches.

## Contributing

These skills are refined over time. Open an issue or a pull request with
corrections or additions.

## License

[MIT](LICENSE) - Bas Milius
