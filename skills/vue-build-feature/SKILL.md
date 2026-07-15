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
components, composables, data access and route behind it. This is about
decomposition and wiring across files. It is library-neutral. For how each
individual `.vue` file is built use `vue-component-anatomy`; for picking UI
components (if the project uses Flux) use `flux-ui`; project-specific rules
(state library, permissions, i18n location) live in the repo's `CLAUDE.md` /
`AGENTS.md`.

## 1. Core principle: views orchestrate, components present

- **The view (page) owns data, state and handlers** and composes the feature.
- **Presentational components are props-in / events-out:** `defineProps`,
  `defineEmits`, `defineModel` only, and no data fetching of their own.
- The view stays the single source of truth: hold state up in the view and pass
  it down via props / `v-model`; children ask for change by emitting.
- **Decompose, do not dump.** A feature is not one giant `.vue`. Split each
  markup-heavy block (toolbar, filter bar, card, list, totals, empty state) into
  its own component as soon as it stands on its own.

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

*Where* each layer physically lives (an in-repo package, `src/service`, an
external client library) differs per project; the *separation of layers* is the
constant. Do not fetch directly from a component - go through the data layer and
a composable.

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
- **Import through the path alias** (`@/component/...`, `@/composable`, ...),
  never through deep relative paths. Use relative imports only for co-located
  children of the same feature.
- **Wire every new file into its barrel** the moment you create it, so the rest
  of the app imports from one stable place.

## 5. Load data in a composable, not in the view

- Put fetch + loading/error + debounce/race-guarding inside a `use<Feature>`
  composable; the view consumes `{ data, isLoading, reload }` and stays about
  composition, not plumbing.
- Do not hand-roll a `watch` + `fetch` + manual debounce inside a view. Reach
  first for the project's existing data helper (a list/table composable, a
  report composable, or a data-fetching library); model a new one on the closest
  existing one rather than inventing a parallel pattern.

## 6. Reset shared / module-level state

- If a composable or store keeps its list in **module-level (singleton) state**
  shared with child/overlay routes, give it a `reset()` and call it in the list
  view's `onUnmounted` (or `watch` a context key and reset on change).
- Otherwise revisiting the page re-renders stale, possibly heavy state
  synchronously before it reloads, which can freeze the UI with no spinner.

## 7. Router and routes

- One route per screen; **lazy-load the view** with a dynamic `import()`.
- Put cross-cutting concerns in route `meta` (guards, permissions, title) and
  read them in a navigation guard, rather than checking inside each view.
- Model modal/overlay screens as routes when the UI needs deep-linking or a back
  action, so the same view can open both inline and as an overlay.
- **Permission and guard specifics are project-specific** - follow the repo's
  `CLAUDE.md`; this skill only prescribes the pattern (declare in `meta`, enforce
  in a guard).

## 8. Cross-cutting

- Register icons in the project's central icon registry; type icon-name values
  as the project's icon-name type, not `string`.
- Put shared formatters in `util/` (barrel-exported), reusing the project's
  utility library instead of inlining `Intl`/formatting logic in templates.
- Route all user-facing text through the project's i18n layer, and add keys for
  every locale the project ships.

## Related skills

- **`vue-component-anatomy`** - how to build each `.vue` file this feature adds.
- **`flux-ui`** - selecting and composing components when the project uses Flux.
- The repo's **`CLAUDE.md` / `AGENTS.md`** - the state/data library, permission
  model, i18n location and other project-specific rules.
