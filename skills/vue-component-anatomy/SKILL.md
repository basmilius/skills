---
name: vue-component-anatomy
description: >-
  Use when writing, editing, or reviewing a single Vue 3 Single File Component
  (a `.vue` file with `<script setup lang="ts">`). Covers one component's
  internal anatomy: block order and template root, the compiler-macro order
  (defineProps -> defineModel -> defineEmits -> defineSlots -> defineExpose),
  the ordering inside `<script setup>` (imports -> macros -> state -> composables
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

`defineOptions` (rare) -> `defineProps` -> `defineModel` -> `defineEmits` ->
`defineSlots` -> `defineExpose` (last, and only if a parent needs a ref handle).

- Type each one; do not pass runtime option objects when a type argument says it
  better. `defineExpose` last because it describes the outward surface after the
  inputs are known.

## 3. `<script setup>` ordering

Order the body top to bottom so state is declared before it is used:

1. **imports**
2. **macros** (props / models / emits / slots) - see section 2
3. **reactive state** (`ref`, `reactive`, `shallowRef`)
4. **composables** (`useRouter`, `useI18n`, `use*` - data/state helpers)
5. **computed**
6. **watch / watchEffect**
7. **lifecycle hooks** (`onMounted`, `onUnmounted`, ...)
8. **function declarations** (event handlers and helpers) last

Keep side effects (kick-off fetches, title setters) in the lifecycle step, not
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

- Default to `<style scoped>` or `<style module>`. Prefer **CSS modules**
  (`<style module>` + `$style.someClass`) when class-name collisions or dynamic
  binding matter; use **camelCase** class names so they read as
  `$style.rowActions`.
- **Custom / global / deep-selector CSS is a last resort.** Keep it minimal and
  leave a one-line comment explaining why the scoped/module route did not work.
- Theme through CSS custom properties (design tokens), not by overriding internal
  selectors of other components.

## Related skills

- **`vue-build-feature`** - splitting a feature across a view plus multiple
  components, composables, data access and a route.
- **`flux-ui`** - picking and composing components when the project uses Flux.
- The repo's **`CLAUDE.md` / `AGENTS.md`** - project-specific style, i18n and
  tooling rules that override the neutral defaults here.
