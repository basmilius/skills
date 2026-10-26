---
name: code-style
description: >-
  Use before writing, editing, or reviewing code in any language, at the start
  of the task rather than after the code is written. Holds the style of
  TypeScript and JavaScript, Vue single file components, PHP and Rust (blank
  lines, imports, declarations, naming, doc blocks, including tests) and the
  rules for comments in every language: which comment earns its place, which to
  delete, how to cut a long one down. Triggers on any `.ts`, `.tsx`, `.js`,
  `.vue`, `.php` or `.rs` change, on defineProps/defineEmits/defineModel and
  script-setup order, on PHPDoc and JSDoc, and on cleaning up comments.
  Project instructions and existing conventions take precedence.
license: MIT
---

# Code style

Code is right the first time when its style is decided before the first line,
not fixed in a cleanup pass afterwards. At the start of a coding task, look at
the files the change touches and read the references that cover them.

## References

| Files | Read |
| --- | --- |
| `.ts`, `.tsx`, `.mts`, `.js` | [typescript.md](references/typescript.md) |
| `.vue` | [vue.md](references/vue.md), and [typescript.md](references/typescript.md) for `<script setup lang="ts">` where `vue.md` says nothing |
| `.php` | [php.md](references/php.md) |
| `.rs` | [rust.md](references/rust.md) |
| Any file with comments or doc blocks | [comments.md](references/comments.md) |

Read [comments.md](references/comments.md) on every change: it holds for `//`,
`#`, `/* */`, docstrings, PHPDoc and JSDoc alike. A language without a
reference here follows its formatter and the code around it.

## What holds everywhere

- Read `.editorconfig` before writing code; indentation, line endings and the
  final newline come from there.
- Always braces around a control body, also for a one-line early return.
- Names say what they hold. Single letters only where they are conventional
  (`i`, `x`, `y`, `e`).
- Prefer early exits over nesting, so the main path stays at the lowest
  indentation.
- The formatter owns the layout of a line. Run it and the linter on the files
  you changed before you call the work done. A formatter keeps blank lines but
  never adds them, so the whitespace rules in the references still need you.
- When editing existing code, apply the rules to what you touch and leave
  deliberate existing style alone. A pass that only changes whitespace or
  comments belongs in its own commit.

## Order of precedence

1. The project's `CLAUDE.md` or `AGENTS.md`.
2. The project's config: `.editorconfig`, formatter and linter settings,
   `tsconfig.json`, `rustfmt.toml`.
3. The conventions of the file you are in and its neighbors.
4. The references above.

## Related skills

- **`test-audit`** - when the change adds, changes or removes tests.
- **`vue-build-feature`** - a Vue feature that spans views, components,
  composables and a route.
- **`unslop`** - the same instinct applied to prose.
