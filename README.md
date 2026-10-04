<a href="https://bas.dev">
    <img src="https://bmcdn.nl/assets/branding/logo.svg" alt="Bas Milius" height="48" />
</a>

---

# Skills

Agent skills for the work I do across my projects: Vue and PHP development, GitHub releases and reviews, documentation and publishing. Each skill gives a coding agent instructions for a specific task, with conventions, examples and supporting files where needed.

Install them with the [skills CLI](https://github.com/vercel-labs/skills) for Claude Code, Codex, Cursor, Copilot and other supported agents.

## Installation

Choose the skills and agents to install for your project:

```sh
npx skills add basmilius/skills
```

Install a single skill:

```sh
npx skills add basmilius/skills --skill vue-component-anatomy
```

Add `--global` to make the skills available across projects. To browse the available skills before installing, run `npx skills add basmilius/skills --list`.

## Skills

### Code

| Skill | Purpose |
| --- | --- |
| [vue-component-anatomy](skills/vue-component-anatomy/SKILL.md) | Structure and conventions for a single Vue 3 component. |
| [vue-build-feature](skills/vue-build-feature/SKILL.md) | Vue 3 features spanning views, components, composables and routing. |
| [flux-ui](skills/flux-ui/SKILL.md) | Vue 3 interfaces with the `@flux-ui` component, application and statistics libraries. |
| [basmilius](skills/basmilius/SKILL.md) | Helpers, DTOs, services and Vue app conventions for `@basmilius/utils`, `http-client` and `common`. |
| [php-style](skills/php-style/SKILL.md) | PHP formatting, declarations, imports, attributes and documentation. |
| [code-comments](skills/code-comments/SKILL.md) | Comments and doc blocks that explain reasons and constraints the code cannot. |

The Vue skills work with any component library. Add `flux-ui` when the project uses Flux and `basmilius` when it uses the corresponding packages.

### GitHub

| Skill | Purpose |
| --- | --- |
| [release](skills/release/SKILL.md) | Prepare and create a GitHub release, then let the project's CI publish it. |
| [release-notes](skills/release-notes/SKILL.md) | Release notes from changes between a base ref and `origin/main`. |
| [review-threads](skills/review-threads/SKILL.md) | Assess and answer PR review comments, optionally applying the requested fixes. |

`release` and `review-threads` prepare the work locally and ask for confirmation before their remote actions. `release-notes` only produces text. The release skills read project-specific overrides from a `## Releasing` section in `CLAUDE.md` or `AGENTS.md`.

### Writing and publishing

| Skill | Purpose |
| --- | --- |
| [unslop](skills/unslop/SKILL.md) | Edit prose to remove filler, inflated language and common AI writing patterns. |
| [html-report](skills/html-report/SKILL.md) | Standalone HTML reports for findings, reviews and action plans, with light and dark themes. |
| [dropoff](skills/dropoff/SKILL.md) | Publish documents, diagrams, snippets, tables, diffs and small files to Dropoff; read and update existing pages. |

Dropoff requires Bun and a `DROPOFF_TOKEN`. Its [setup instructions](skills/dropoff/SKILL.md#setup) cover authentication and an optional custom host.

## Usage

Each skill's description tells the agent when to use it. You can also name a skill in your request:

```text
Use vue-build-feature to build a settings page with profile and notification preferences.
```

```text
Use release-notes to draft the changelog since the latest release.
```

Each linked `SKILL.md` contains the full instructions and any setup requirements. Some skills also include reference guides, scripts or templates.

Update installed skills with `npx skills update`, or update one by name with `npx skills update dropoff`.

## License

[MIT](LICENSE). Copyright (c) Bas Milius.
