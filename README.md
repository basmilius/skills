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
| [`release`](skills/release/SKILL.md) | Cut a GitHub release from a bump keyword (`major`/`minor`/`patch`/`stable`, optionally `beta`) and let CI publish; works on a single repo or a sibling-repo workspace. |
| [`release-notes`](skills/release-notes/SKILL.md) | Generate a copy-pasteable changelog by diffing a base tag against `origin/main`; read-only, creates nothing. |

The two `vue-*` skills are library-neutral and pair with `flux-ui` when a project
uses Flux. The `release` and `release-notes` skills are project-neutral: they
auto-detect the repo, build check and CI, and read optional overrides from a
`## Releasing` section in the project's `CLAUDE.md` / `AGENTS.md`.

## Contributing

These skills are refined over time. Open an issue or a pull request with
corrections or additions.

## License

[MIT](LICENSE) - Bas Milius
