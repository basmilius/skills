---
name: vue-component-anatomy
description: >-
  Use when writing, editing, or reviewing a single Vue 3 Single File Component
  (a `.vue` file with `<script setup lang="ts">`). Covers one component's
  internal anatomy: block order and template root, the compiler-macro order
  (defineEmits -> defineModel -> defineProps -> defineSlots, with defineExpose
  last), the ordering inside `<script setup>` (imports -> macros -> state -> composables
  -> computed -> watch -> lifecycle -> functions), function-vs-arrow style, prop
  and emit typing, v-model via defineModel, and scoped/module styling. Triggers
  on editing any `.vue` file, on defineProps/defineEmits/defineModel/defineSlots,
  on script-setup ordering questions, and on prop typing. For splitting a feature
  across multiple components and layers use `vue-build-feature`; if the project
  uses the Flux UI library see `flux-ui`.
---

# Vue component anatomy

How one Vue 3 Single File Component is built on the inside. This is about the
shape of a single `.vue` file: the order of its blocks, its macros, its script,
and its styles. It is deliberately library-neutral. For how a feature is split
across several components use `vue-build-feature`; for choosing UI components (if
the project uses Flux) use `flux-ui`; project-specific rules live in the repo's
`CLAUDE.md` / `AGENTS.md`.

Assume `<script setup lang="ts">` and Vue 3.5+ unless the repo says otherwise.

## 1. SFC skeleton and template root

- **Block order:** `<template>` first, then `<script setup lang="ts">`, then
  `<style>`. Keep it consistent across the codebase.
- **Prefer a single root element** in the template: it gives predictable
  attribute fallthrough (`class`, `@click`, `v-bind="$attrs"` land on one node)
  and is required by many `<Transition>` setups. Vue 3 allows fragments
  (multiple roots), but reach for them deliberately, not by accident: with more
  than one root, `$attrs` is not auto-inherited and you must bind it explicitly.
- Render teleported/overlay children (dialogs, tooltips) inside the root, not as
  a sibling of it, so transitions and fallthrough stay intact.

## 2. Macro order (top of `<script setup>`)

Declare the compiler macros first, in this order, so the component's contract is
readable at a glance:

`defineOptions` (rare) -> `defineEmits` -> `defineModel` -> `defineProps` ->
`defineSlots`.

`defineExpose` is the exception: it goes at the very bottom of the script (after
the function declarations, see section 3), and only if a parent needs a ref
handle. It describes the outward surface, so it reads last once everything it
exposes is defined.

- Type each one; do not pass runtime option objects when a type argument says it
  better.

## 3. `<script setup>` ordering

Order the body top to bottom so state is declared before it is used:

1. **imports**
2. **macros** (emits / models / props / slots) - see section 2
3. **reactive state** (`ref`, `reactive`, `shallowRef`, and template refs)
4. **composables** (`useRouter`, `useI18n`, `use*` - data/state helpers)
5. **computed**
6. **watch / watchEffect**
7. **lifecycle hooks** (`onMounted`, `onUnmounted`, ...)
8. **function declarations** (event handlers and helpers)
9. **`defineExpose`** last of all, only if a parent needs a ref handle

- **Template refs use `useTemplateRef('name')`** (Vue 3.5+) and sit with the
  reactive state; the string argument matches the `ref="name"` in the template.
- Keep side effects (kick-off fetches, title setters) in the lifecycle step, not
  scattered between declarations.

## 4. `function` vs arrow

- **Named handlers and helpers** are `function` declarations
  (`function onSubmit(): void { ... }`): they hoist, read cleanly in the
  template, and stack-trace with a name.
- **Arrow functions** only for inline callbacks and closures (watchers,
  `array.map`, `.filter`, event options).

## 5. Props and their types

- Type props with the generic form: `defineProps<{ readonly id: number }>()`.
  Mark fields `readonly` - props are immutable.
- **Defaults:** use `withDefaults(defineProps<...>(), { ... })`, or reactive
  props destructuring with defaults (Vue 3.5+):
  `const { size = 'md' } = defineProps<{ size?: Size }>()`.
- **`type` over `interface`** for prop and data shapes. Use `interface` only
  where declaration merging is required (module augmentation, `declare global`).
- **Inline the props type** in `defineProps<{ ... }>()` when it is used only
  there. Promote it to a named, exported `type Props` only when it is reused
  elsewhere (for example passed to another generic).
- **Do not destructure props that are only read in the template** in `<script>`;
  destructure in script only when you need a default or a local binding.

## 6. Emits and models

- **Type emits:** `const emit = defineEmits<{ submit: [id: number]; cancel: [] }>()`.
- **Two-way binding is `defineModel`,** not a hand-rolled `modelValue` prop plus
  an `update:modelValue` emit: `const value = defineModel<string>()`. Named
  models: `defineModel<number>('page')` pairs with `v-model:page` on the parent.
- **Model defaults use a runtime option object** (the exception to section 2):
  `defineModel<string>({ default: '' })`. Give an array or object model a factory
  default so its value is never `undefined`:
  `defineModel<string[]>({ default: () => [] })`.
- Keep the child dumb: emit an event or write the model; let the parent own the
  decision.

## 7. Template conventions

- **`v-for` always has a stable `:key`** (an id, not the array index when the
  list reorders).
- **No heavy logic in the template.** Move anything past a simple expression into
  a `computed` or a named function.
- Bind named models with `v-model:x`; stop propagation on nested interactive
  elements (`@click.stop`) when the parent also handles the event.

## 8. Styling

- **Default to `<style module>`** (`$style.someClass`) with **camelCase** class
  names. Name classes after the component: a base class matching the component
  (`$style.tagInput`), child parts as `base + suffix` (`$style.tagInputChip`,
  `$style.tagInputField`), and state as a separate `is*` modifier on the same
  element (`.tagInput.isDisabled`). This prefix already isolates the classes, so
  scoping is largely redundant; use `<style scoped>` only if the project does.
- Toggle modifiers with an array/object binding:
  `:class="[$style.tagInput, { [$style.isDisabled]: disabled }]"`.
- **Custom / global / deep-selector CSS is a last resort.** Keep it minimal and
  leave a one-line comment explaining why the module route did not work.
- **Theme through CSS custom properties** (design tokens), not by overriding
  internal selectors of other components. When the project has no token set, a
  standalone component can expose its own `var(--x, fallback)` properties so
  consumers can override them.

## 9. Whitespace

- **One blank line between the top-level groups** in `<script setup>` (imports,
  each macro block, state, composables, computed, watch, lifecycle) and between
  every `function` declaration.
- **No blank line between adjacent single-line declarations** in the same group
  (a run of refs or composables stays together).
- **Inside a function, one blank line separates logical steps:** after a
  guard/early-return block, and between setup and the action that follows.
- **In the template, one blank line between logically separate element groups.**
- One blank line between the `<template>`, `<script>`, and `<style>` blocks.

## Related skills

- **`vue-build-feature`** - splitting a feature across a view plus multiple
  components, composables, data access and a route.
- **`flux-ui`** - picking and composing components when the project uses Flux.
- The repo's **`CLAUDE.md` / `AGENTS.md`** - project-specific style, i18n and
  tooling rules that override the neutral defaults here.
