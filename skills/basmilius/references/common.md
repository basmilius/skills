# @basmilius/common guide

`@basmilius/common` is a set of opinionated Vue 3 app primitives: a `defineStore`
that hands back refs, data composables (`useDataTable` / `useDataReport`), a
`useService` + `guarded` error model, a large composable catalog, thin
`vue-router` wrappers, domain exceptions and small reactive utilities. It assumes
Vue Router and Pinia, and unlocks its data composables when
`@basmilius/http-client` is present. Everything is a named export from the package
root. Full catalogs live in `common-reference.md`; worked code in
`common-patterns.md`.

**Versions (package.json is the source of truth):** `pinia@^4`,
`vue-router@^5`, `vue@^3.6.0-beta`. The docs' `installation.md` still says
pinia 3 / vue-router 4; ignore that.

## 1. Stores: `defineStore` returns refs

- Use **`defineStore` from this package**, setup-style, never Pinia's directly.
  The returned composable runs `storeToRefs` for you: **state and getters come
  back as `Ref`s, actions pass through as plain functions**, so you can
  destructure directly and keep reactivity.
- Bootstrap with the **re-exported `createPinia`** (`import { createPinia } from
  '@basmilius/common'`).
- Do not give a public store key a `$` or `_` prefix; those are filtered out.
  A worked store is in `common-patterns.md` section 1.

## 2. Data access: `useService` + `guarded`

- **Reach the API through `useService(ServiceClass)`.** It instantiates the
  `BaseService` and wraps every prototype method with `guarded`, which maps `403`
  to `ForbiddenException`, an unsanctioned request to `UnauthorizedException`, and
  otherwise runs your `onError` then throws `HandledException`.
- **Do not `try/catch` guarded calls at the call site.** Let the typed exceptions
  bubble to a global handler; use `onError` / `HandledException` for the
  "already shown to the user" case.
- Methods must live on the class **prototype** (inherited or arrow-assigned
  methods are not wrapped).
- **Install one central handler** for what these throw: the app's
  `app.config.errorHandler` (plus a router error hook) treats `HandledException`
  as a no-op and routes `UnauthorizedException` / `ForbiddenException` (for
  example a login redirect). The library throws; the app catches in one place.

## 3. Data composables (the flagship)

`useDataTable` is the concrete answer to `vue-build-feature` section 5's "reach
for the project's list/table composable". It composes loading, pagination, debounce
and race-guarding for you.

- Call it with an **options object**; the `fetcher` receives one
  `DataTableQuery<TFilter>` (`{ offset, limit, search, filters, sort }`) and
  returns `BaseResponse<Paginated<TItem>> | false`. The full return shape is
  typed in `common-reference.md`; bind its managed `displayEmpty` instead of
  computing your own empty state.
- **Keep the service independent of `@basmilius/common`:** map the
  `DataTableQuery` to the service's own params inside the fetcher, so the data
  layer depends only on `@basmilius/http-client`, not on this table type.
- **Mutate `search` / `filters` / `sort` directly** - each resets to page 1 and
  refetches (`filters` is deep-watched). Return `false` to skip an update.
- **Skip until dependencies are ready:** call `unrefAll(depA, depB)` at the top of
  the fetcher (and list external deps in the `dependencies` option); the
  `UnresolvedDependencyException` it throws is swallowed. Real fetch errors land
  in `error`; narrow with `isRequestError`.
- **`useDataReport`** is the non-paginated sibling: it returns `data`
  (`Ref<TData | null>`), `displayEmpty`, `error`, `filters`, `isLoading`, `search`
  and `reload`; pass an `isEmpty(data)` predicate as an option.

## 4. Forms and reactive state helpers

- **`useDtoForm(dtoRef)`** mirrors a DTO into an editable, clean-marked deep clone
  (a form buffer). It **re-clones whenever the source ref changes**, so never
  point it at a ref that updates while the user is editing. `form.value` is
  `undefined` until the source DTO is non-null; gate the form UI on it.
- **`useUrlState(state, { prefix })`** two-way syncs refs / a reactive object with
  the URL query string; the serializer is inferred from the initial value, and
  values equal to their initial are dropped from the URL.
- **`persistentRef` / `persistentStringRef`** back a ref with `localStorage`; they
  return `Ref<T | null>` and setting `null` deletes the key.

## 5. The composable catalog

Signatures in `common-reference.md`. Grouped by what they do:

- **DOM and observers:** `useClickOutside`, `useEventListener`,
  `useResizeObserver`, `useMutationObserver`, `useInView`, `useScrollPosition`.
  These are browser-only (no SSR guards); keep them to client code.
- **Interaction:** `useHotKey`, `useCopy`, `useLocalFile`, `usePasswordStrength`.
- **Timing and lifecycle:** `useInterval`, `useMounted`, `useComponentId`,
  `useDebounced`, `useDebouncedRef`.
- **Loading:** `useLoaded` (task-counter tracker) and `useLoadedAction` (one-shot
  `[wrappedFn, isLoading]`).
- **Pagination:** `usePagination` (bare state, used by `useDataTable`).

## 6. Router helpers

Thin `vue-router@5` wrappers: `useRouteParam`, `useRouteMeta` (merges matched
records' `meta`, inner wins), `useRouteNames`, `useIsView`, `useNavigate`
(wrappable `push` / `replace`), `useNamedRoute` / `useRouteView` (named-view
depth). **Overlay / modal routing is NOT here** - that lives in the separate
`@basmilius/routing` package, which builds on these primitives. Until a dedicated
skill covers `@basmilius/routing`, model overlays by hand per `vue-build-feature`
section 7 (child route + nested `<RouterView>`).

## 7. Exceptions

Four empty `Error` subclasses (`ForbiddenException`, `UnauthorizedException`,
`HandledException`, `UnresolvedDependencyException`), **thrown by the helpers and
caught centrally**, never constructed with messages. Per-exception meaning is in
`common-reference.md`; sections 2 and 3 above cover how they flow.

## Reference files

- `common-reference.md` - the full composable catalog with signatures, the
  `store` / `router` / `error` / `util` exports, and how they interrelate with
  `@basmilius/http-client` and `@basmilius/utils`.
- `common-patterns.md` - stores, `useService` + `onError`, the `useDataTable`
  view, `useDtoForm`, `useUrlState`.

## Related

- **`http-client.md`** - the DTO client that `useService`, `useDataTable`
  and `useDtoForm` build on.
- **`utils.md`** - standalone helpers (this package uses `debounce` /
  `isHtmlElement` from it).
- The **`vue-build-feature`** / **`vue-component-anatomy`** skills - the neutral
  Vue architecture and SFC patterns these primitives slot into.
