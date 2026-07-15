# Conventions, setup & API

Durable conventions that apply across all Flux components, plus install and the
composables / global API. For exact, current detail the Introduction and API guide
pages at flux-ui.dev are authoritative; work against the **latest** published version
(the 3.x line, installed via `@latest`).

## Installation

Flux is SCSS-based and ships a companion Vite preset. Install the Flux package and
the preset with the **`@latest`** dist-tag, not a guessed caret range: the published
versions are on a **3.x** line and a caret won't match a `-next` prerelease, so
guessed ranges fail to resolve.

```sh
bun add @flux-ui/components@latest sass-embedded @basmilius/vite-preset@latest
```

**Peer dependencies** (not bundled; missing ones fail the build or make charts throw):

- **`vue`** → Flux 3.x requires **Vue 3.6**, currently in **beta**. Install
  `vue@^3.6.0-beta.13` (or newer beta); **`vue@latest` (3.5.x) does NOT satisfy the
  peer** and mis-resolves.
- `@flux-ui/components` → **`luxon`** (dates; TS: add `@types/luxon`).
- `@flux-ui/application` → **`luxon`** and **`vue-router`** (the shell is route-driven).
- `@flux-ui/statistics` → **`echarts`**, **`lodash-es`**, and **`vue-i18n`** (must be
  registered on the app or the charts throw; TS: add `@types/lodash-es`).

Icons come from Font Awesome, added **separately** (see Icons below).

Add `preset()` **plus one plugin per Flux package you use** to the Vite config:
`flux()` for `@flux-ui/components`, `fluxApplication()` for `@flux-ui/application`,
`fluxStatistics()` for `@flux-ui/statistics` (and `fluxDashboard()` for
`@flux-ui/dashboard`). Each aliases its package to source (`~flux/<pkg>`) and wires
the tsconfig path.

> **This matters:** if you use `@flux-ui/application` or `@flux-ui/statistics` but only
> add `flux()`, those packages resolve to their **dist** build, whose CSS is a
> separate `style.css` that nothing imports, so the **app shell / charts render
> completely unstyled** (sidebar collapses to a flat list, etc.). Add the matching
> plugin for every Flux package you import.

```ts [vite.config.ts]
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { flux, fluxApplication, fluxStatistics, preset } from '@basmilius/vite-preset';

export default defineConfig({
  // components only:           [vue(), preset(), flux()]
  // + application + statistics (a dashboard):
  plugins: [vue(), preset(), flux(), fluxApplication(), fluxStatistics()]
});
```

**Import the global stylesheet** once (e.g. in `main.ts`). Under the preset (which
aliases each `@flux-ui/*` package to its `src/`), import the SCSS source entry:

```ts
import '@flux-ui/components/css/index.scss';
```

(Without the preset, the prebuilt `@flux-ui/components/style.css` is the equivalent.)
`@flux-ui/application` and `@flux-ui/statistics` ship co-located CSS-module styles
that auto-import once their preset plugin is added. Install guides exist for plain
Vue, **Vue Router**, and **Nuxt**; routing and SSR each need extra setup.

## Internationalization (vue-i18n): avoid raw `flux.*` keys

Flux components have their own built-in English strings, used **only when no global
vue-i18n `$t` is injected**. If a vue-i18n instance injects a global `$t`, Flux
delegates to it, and if your messages lack the `flux.*` keys the UI shows raw keys
like `(flux.optional)`. Because **`@flux-ui/statistics` requires vue-i18n**, configure
i18n so Flux keeps its own strings: set **`globalInjection: false`** (and
`legacy: false`).

```ts
const i18n = createI18n({ legacy: false, globalInjection: false, locale: 'en' });
```

Statistics still works (its components use `useI18n()`, not global `$t`). Flux's
English map is internal and not exported, so you can't merge those keys into a global
`$t`; keep `globalInjection: false` instead.

## Provider: FluxRoot

Mount **one** `FluxRoot` as the application's main wrapper:

```vue
<template>
  <FluxRoot>
    <!-- your application, e.g. <RouterView /> -->
  </FluxRoot>
</template>
<script lang="ts" setup>
  import { FluxRoot } from '@flux-ui/components';
</script>
```

`FluxRoot` internally renders `FluxOverlayProvider`, `FluxSnackbarProvider` and
`FluxTooltipProvider` (you never use those directly). So the programmatic `show*`
dialog functions, `FluxOverlay`, and `FluxTooltip` all depend on a mounted `FluxRoot`;
the `show*` functions **throw if none is present**.

## Icons = registered Font Awesome names

Flux does not take icon components. You **register** Font Awesome definitions once,
then reference them by **kebab-case name string** (typed `FluxIconName`). An
**unregistered** icon simply renders nothing.

```ts [icons.ts]
// Free (no token). Swap to '@fortawesome/pro-regular-svg-icons' if the project has Pro.
export { faCircleCheck, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
```
```ts [register.ts]
import { fluxRegisterIcons } from '@flux-ui/components';
import * as icons from './icons';
fluxRegisterIcons(icons);
```
```vue
<FluxPrimaryButton label="Save" icon-leading="circle-check" />
```

**Free or Pro: ask first.** `fluxRegisterIcons` accepts any Font Awesome
`IconDefinition`, so Flux works with **Free or Pro**; Pro is not required. Pro packages
(`@fortawesome/pro-regular-svg-icons`, ...) need a paid token, so installing one
without it fails. **Ask which tier the user has before adding a Font Awesome
dependency; default to Free.** If a required icon name only exists in Pro, register the
closest Free style (often the solid variant).

**Register each component's "Required icons", not just the ones you pass.** Many
components use icons internally (sort arrows, pagination chevrons, checkmarks, close
✕, ...) that you never reference. Every doc page lists them under **"Required
icons"** (e.g. `data-table` needs `arrow-down-a-z`, `arrow-up-a-z`,
`arrow-up-arrow-down`, `check`, `circle-xmark`, `minus`). Read them off the page
rather than guessing, or the component's sort/pagination controls render blank.

**Validate every icon name against the registry**, including dynamic ones, before
declaring a screen done. Three traps:

- **Substring false-positives.** `grep faCalendarDay` *passes* on `faCalendarDays`,
  yet `calendar-day` is a different, unregistered icon. Match on a word boundary
  (`grep -wE`) or normalize both sides to kebab and compare exact.
- **Dynamic sources.** Icons chosen at runtime (status→icon maps, arrays typed
  `FluxIconName`, `:name="item.icon"`) never appear as a literal, so a template-only
  scan misses them. Resolve those maps/arrays and validate the concrete values.
- **`name=` is not always an icon.** It's an icon prop only on `FluxIcon` /
  `FluxBoxedIcon` (see below); on `FluxFilterOption` and form controls `name` is a
  state/field key.

**Prop-name trap:** `FluxIcon` and `FluxBoxedIcon` take the icon through a **`name`**
prop (`<FluxIcon name="circle-check" />`), *not* `icon`. Everywhere else (buttons,
badges, notices, headers, ...) it comes via `icon` / `icon-leading` / `icon-trailing`.

## Design tokens & colors

- **Design tokens are CSS custom properties** on `:root` (`--background`, `--gray-25`,
  `--primary-500`, ...). They flip automatically in dark mode. Use them in your own
  styles; they are *not* values you pass to props.
- **Spacing / `gap`** props take a **plain number in pixels** (`<FluxFlex :gap="9">`
  renders `gap: 9px`). There is no numeric token scale for these.
- **Colors** on components use **token names** via the `FluxColor` type:
  `gray | primary | danger | info | success | warning` (`color="success"`, ...). The
  palette tokens are `--gray-*`, `--primary-*`, `--danger-*`, `--info-*`, `--success-*`,
  `--warning-*`.
- **Typography** and **dark mode** are handled by the library via these variables.
  Dark mode is built in; don't author separate dark styles per component.

## Content: prop vs default slot (common trap)

Flux is **not** consistent about how text content goes in, so don't assume a
`message` / `title` / `label` prop exists:

- **`label` prop:** `FluxBadge`, `FluxTag`, `FluxChip` (`<FluxBadge label="New" />`).
- **`content` prop:** `FluxTooltip` (`<FluxTooltip content="Delete">`).
- **`message` / `title` prop *or* default slot:** `FluxNotice`, `FluxPlaceholder`.
- **Default slot only, no content prop:** `FluxInfo`, `FluxItemContent`. Write
  `<FluxInfo>Saved.</FluxInfo>`, **not** `<FluxInfo message="Saved." />`.

When unsure, check the doc page; guessing a `:message` / `:title` prop that doesn't
exist renders nothing.

## Two-way binding

Form controls bind with normal Vue 3 `v-model`. The exact model value type varies per
control (string, number, Date, array, ...) and is documented on each control's page.

## Routing

Components that navigate accept Vue Router targets via `type="route"` + `:to` (type
`FluxTo`), once Vue Router integration is installed. For external links use
`type="link"` with `href` / `rel` / `target`.

## TypeScript & types

Public types live in **`@flux-ui/types`**, and the compiler enforces where they come
from:

- **Type-only aliases come from `@flux-ui/types`**: `FluxIconName`, `FluxColor`,
  `FluxTo`, `FluxButtonSize`, and most component-config types. These are **not**
  re-exported by `@flux-ui/components` (importing `FluxColor` from there is a type
  error): write `import type { FluxColor, FluxIconName } from '@flux-ui/types';`.
- **`@flux-ui/components`** re-exports the runtime API (components, functions,
  composables) and a *subset* of types: the injection types
  (`FluxFormFieldInjection`, ...), `FluxState` / `FluxStore`,
  `FluxFilterDefinitionFactory`, and the select option types. When a type isn't found
  on `@flux-ui/components`, import it from `@flux-ui/types`.

`@flux-ui/types` pulls in Luxon types, so a TS project may need `@types/luxon`. The
`guide/api/types` page documents the full surface.

## Every component must be imported (silent failure)

Flux has **no global registration**: every component used in a `<script setup>`
template must be imported, or Vue treats the unknown PascalCase tag as a native custom
element and renders it literally, lowercased (`<MemberAvatar/>` →
`<memberavatar></memberavatar>`, blank on screen). This is **not** a compile error
(vue-tsc allows custom elements), so it slips past the build. When a `Flux*` (or
local) tag renders as nothing or a literal lowercased tag, the cause is almost always
a missing import.

## Composables

All composables are named exports from `@flux-ui/components`. For exact return shapes
the `guide/composables/*` and `guide/api/*` pages are authoritative.

### Utility composables (call directly)

**`useBreakpoints`** (verified) - reactive viewport tracking:

```ts
import { useBreakpoints } from '@flux-ui/components';
const { currentBreakpoint, xs, sm, md, lg, xl } = useBreakpoints();
// each ref is true when the viewport is at least that wide; if (md.value) { … }
```

Floors: `xs` 0px, `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px. Prefer this over
CSS media queries for **structural** changes (e.g. flipping `FluxFlex` direction).

**`useDisabled`** - reads/propagates disabled state so a control respects an ancestor's
disabled context (pair with `useDisabledInjection` when authoring a custom control).

### Injection composables (for custom components)

Use these only when building a custom component that must integrate with a Flux
parent's context; each returns the injected context (several have an exported
`Flux*Injection` type). If you're only *using* the built-in controls you don't need
them.

`useAdaptiveGroupInjection`, `useCalendarInjection`, `useDisabledInjection`,
`useExpandableGroupInjection`, `useFilterInjection`, `useFlyoutInjection`,
`useFormCheckboxGroupInjection`, `useFormFieldInjection` (custom control reporting into
a `FluxFormField`), `useFormRadioGroupInjection`, `useKanbanInjection`,
`useSegmentedControlInjection`, `useTabBarInjection`, `useTableInjection`,
`useTooltipInjection`.

## Global API & helpers

- **`useFluxStore`** - Flux's reactive global store (`FluxStore`). Underpins app-wide
  state and the dialog/snackbar machinery; also exposes `addSnackbar(spec) → id`,
  `updateSnackbar(id, partial)` and `removeSnackbar(id)` for live-updating snackbars
  (see `references/dialogs-and-feedback.md`). For dialogs prefer the `show*` functions.
- **Filter helpers** - `defineFilter`, `pickFilterCommon`, and the type guards
  `isFluxFilterOptionHeader` / `isFluxFilterOptionItem`; the `defineFilterMacro` macro
  is at the `@flux-ui/components/vite` subpath.
- **Select type guards** - `isFluxFormSelectOption` / `isFluxFormSelectGroup`.
- ⚠ **Not on the package root.** Several source utilities are **not** re-exported from
  `@flux-ui/components`: `generateMultiOptionsLabel`, `isResettable`, `sanitizeUrl`,
  `createLabelForDateRange`, `createDialogRenderer`, the `inputMask` namespace, and the
  internal `english` strings. They exist in source but can't be imported from the root.

## Documented patterns (read before building the real thing)

The guide's Patterns section shows idiomatic end-to-end wiring:

- CRUD form - `https://flux-ui.dev/guide/patterns/crud-form`
- Filterable data table - `https://flux-ui.dev/guide/patterns/filterable-data-table`
- Stepper wizard - `https://flux-ui.dev/guide/patterns/stepper-wizard`
- Programmatic dialogs - `https://flux-ui.dev/guide/patterns/programmatic-dialogs`
  (also summarised in `references/dialogs-and-feedback.md`)
