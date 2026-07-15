---
name: vue-build-feature
description: >-
  Use when building, porting, or refactoring a Vue 3 feature that spans multiple
  components and layers: a page/view plus its presentational components,
  composables, data access, a router route and shared utilities. Covers the
  view-orchestrates / components-present split, feature-folder structure with a
  barrel (index.ts) and path-alias imports, encapsulating data loading and state
  in composables, resetting shared/module-level state, router wiring, and the
  recommended build sequence across layers. Triggers on building a new
  screen/view/feature, on splitting a large `.vue` into smaller components, on
  adding a data model/service, and on wiring a router route. For a single
  component's internal anatomy use `vue-component-anatomy`; if the project uses
  the Flux UI library see `flux-ui`.
---

# Vue build feature

How to build a Vue 3 feature that does not fit in one component: a page and the
components, composables, data access and route behind it, and how they wire
together across files. It is library-neutral. For how each individual `.vue` file
is built use `vue-component-anatomy`; for picking UI
components (if the project uses Flux) use `flux-ui`; project-specific rules
(state library, permissions, i18n location) live in the repo's `CLAUDE.md` /
`AGENTS.md`.

## 1. Core principle: views orchestrate, components present

- **The view (page) is the single orchestrator:** it owns the data, state and
  handlers by instantiating the feature composable (section 5). The state lives
  in the composable; the view is the only place that wires it to children via
  props / `v-model`. Children never own canonical state - they emit or write a
  model to ask for change.
- **Presentational components are props-in / events-out:** `defineProps`,
  `defineEmits`, `defineModel` only, and no data fetching of their own.
- **Decompose, do not dump.** Split each markup-heavy block (toolbar, filter,
  card, list, totals, empty state) into its own component once it stands alone.

## 2. The layers of one feature

A non-trivial feature usually touches these layers. Keep them separate:

| Layer | What it holds |
| --- | --- |
| Data access | Types/models and a service/client that talks to the API |
| Composable | Fetch + loading/error + derived state for the view |
| Components | Presentational pieces in a feature folder + a barrel |
| View / page | Orchestrator: owns state, composes components |
| Route | Router entry (lazy import, guards, meta) |
| Cross-cutting | Shared utils/formatters, icons, user-facing text (i18n) |

*Where* each layer lives differs per project; the *separation* is the constant.
Never fetch inside a component - go through the data layer and a composable.

## 3. Build sequence (bottom-up)

Build from the layer with the fewest dependencies upward, so each layer compiles
against the one below:

1. **Data access** - types/models + the service method(s).
2. **Composable** - wrap loading and state for the view.
3. **Presentational components** - one per block, with a feature barrel.
4. **View** - wire the composable to the components.
5. **Route** - register the view.
6. **Cross-cutting** - utils/formatters, icons, i18n keys.

## 4. Structure and barrels

- Group a feature's components in one folder, e.g.
  `component/<domain>/<feature>/`, with a `types.ts` for shared shapes and an
  `index.ts` **barrel** that re-exports the folder.
- **Domain-shared components sit directly in `component/<domain>/`,** next to
  the feature sub-folders, not in a `common/` sub-bucket. Keep feature-specific
  pieces in their `component/<domain>/<feature>/` sub-folder, and put truly
  app-generic components in a top-level `component/common/`.
- **Import a domain-shared component by its own path**
  (`@/component/<domain>/<Name>.vue`), not through the domain barrel: the barrel
  re-exports the feature that imports it, so routing through it creates an import
  cycle.
- **Import through the path alias** (`@/component/...`, `@/composable`, ...),
  never through deep relative paths. Use relative imports only for co-located
  children of the same feature.
- **Wire every new file into its barrel** the moment you create it, so the rest
  of the app imports from one stable place.

```
component/
  common/                 app-generic components (AppIcon, layout, ...)
  <domain>/
    <Domain>Badge.vue     shared directly across the domain's features
    index.ts              barrel: shared pieces + the feature barrels
    <feature>/            one feature's presentational pieces
      types.ts            shapes shared within the feature
      index.ts            barrel: re-exports the folder
```

## 5. Load data in a composable, not in the view

- Put fetch + loading/error + debounce/race-guarding inside a `use<Feature>`
  composable; the view consumes it (`{ data, isLoading, isEmpty, error, reload }`)
  and stays about composition, not plumbing.
- **Expose empty and error, not just loading.** Derive `isEmpty` so it cannot
  flash mid-fetch (`loaded && !isLoading && count === 0`) and render the states
  in order: skeleton while loading, then error, then empty, then data.
- Do not hand-roll a `watch` + `fetch` + manual debounce in a view. Reach first
  for the project's existing data helper (a list/table or report composable, or a
  data-fetching library) and model a new one on the closest match. **If none
  exists** (greenfield), write one small race-guarded primitive (fetch + loading +
  error + a request token that drops stale responses) and model each feature
  composable on it.
- **If the project uses `@basmilius/common`,** its `useDataTable` /
  `useDataReport` are that data helper (see `basmilius-common`), backed by
  `@basmilius/http-client` services and DTOs (see `basmilius-http-client`).

## 6. Reset shared / module-level state

- If a composable or store keeps its list in **module-level (singleton) state**
  shared with child/overlay routes, give it a `reset()` and call it in the list
  view's `onUnmounted` (or `watch` a context key and reset on change).
- Otherwise revisiting the page re-renders stale, possibly heavy state
  synchronously before it reloads, which can freeze the UI with no spinner.
- **Component-scoped composable state needs no `reset()`.** State created inside
  a composable the view instantiates is torn down with the view; only
  module-level (singleton) or store state that outlives the view does.
- **`reset()` must not trigger a refetch.** If the composable refetches by
  watching its filter inputs, clearing them in `reset()` during teardown
  schedules a stale fetch; reset the inputs and cached data together without
  re-firing the fetch.

## 7. Router and routes

- One route per screen; **lazy-load the view** with a dynamic `import()`.
- Put cross-cutting concerns in route `meta` (guards, permissions, title) and
  read them in a navigation guard, rather than checking inside each view.
- Model modal/overlay screens as routes for deep-linking or a back action. Make
  the overlay a **child route** of the list so the list stays mounted underneath
  (also why its `reset()` fires only on leaving the feature, section 6), rendered
  through a nested `<RouterView>`. Pass route params as **props** (`props: true`),
  not `useRoute()`, and **close by navigating to the parent route**, not
  `router.back()`, so a cold deep link still has an exit.
- **Permission/guard specifics are project-specific** (follow the repo's
  `CLAUDE.md`); the pattern is: declare in `meta`, enforce in a guard.

## 8. Cross-cutting

- Register icons in the project's central icon registry; type icon-name values
  as the project's icon-name type, not `string`.
- Put shared formatters in `util/` (barrel-exported), reusing the project's
  utility library instead of inlining `Intl`/formatting logic in templates.
- Route user-facing text through the project's i18n layer, with keys for every locale it ships.

## Related skills

- **`vue-component-anatomy`** - how to build each `.vue` file this feature adds.
- **`flux-ui`** - selecting and composing components when the project uses Flux.
- **`basmilius-http-client`** / **`basmilius-common`** - if the project uses these
  (by Bas Milius), the concrete data layer (DTO services) and the state/composable
  layer (`useDataTable`, stores) this skill leaves project-specific.
- The repo's **`CLAUDE.md` / `AGENTS.md`** - the state/data library, permission
  model, i18n location and other project-specific rules.
