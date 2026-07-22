# @basmilius/common reference

The full export surface. Named exports from the package root
(`@basmilius/common`); one barrel over `composable`, `store`, `router`, `error`,
`util`.

## Composables

| Export | Signature | Role |
| --- | --- | --- |
| `useClickOutside` | `<T>(refs: Ref<T\|null> \| Ref<T\|null>[], enabled: boolean\|Ref<boolean>, onOutside: (e: PointerEvent) => void): void` | Fire on `pointerdown` outside one or more refs. |
| `useComponentId` | `(): ComputedRef<number>` | Stable numeric id of the instance. |
| `useCopy` | `(contents: Ref<string>, onSuccess?: Function): () => Promise<void>` | Returns a fn that copies `contents` to the clipboard. |
| `useDataReport` | `<TData, TFilter>(options: UseDataReportOptions): UseDataReport` | Fetch one filtered/searchable object (non-paginated). |
| `useDataTable` | `<TItem, TFilter>(options: UseDataTableOptions): UseDataTable` | Paginated + searchable + sortable + filterable table. |
| `useDebounced` | `<T extends (...a) => any>(fn: T, delay: number): T` | Debounce a function (delegates to utils' `debounce`). |
| `useDebouncedRef` | `<T>(initial: Ref<T>\|T, delay: number, immediate = false): Ref<T>` | A `customRef` whose writes are debounced. |
| `useDtoForm` | `<T>(dtoRef: Ref<T\|null>): Ref<T>` | Editable, clean-marked deep clone of a DTO. |
| `useEventListener` | `<K>(target: MaybeRefOrGetter<EligibleTarget\|null>, type: K\|K[], listener, options?): StopHandle` | Reactive, auto-disposed `addEventListener`. |
| `useHotKey` | `(shortcuts: string\|string[], handler: (e: KeyboardEvent) => void, options?: UseHotKeyOptions): () => void` | Keyboard shortcuts (`mod`/`ctrl`/`meta`/`shift`/`alt`, aliases, typing-guard). |
| `useInterval` | `(interval: Ref<number>\|number, fn: Function): void` | rAF-aligned loop, started `onMounted`, cleared `onUnmounted`. |
| `useInView` | `<T>(target: MaybeRefOrGetter<T\|null>, options?): Ref<boolean>` | IntersectionObserver visibility flag. |
| `useLoaded` | `(debounce = 0, initial = false): { isLoading: ComputedRef<boolean>; loaded<T>(fn: T): T }` | Task-counter loading tracker. |
| `useLoadedAction` | `<T extends (...a) => Promise<any>>(fn: T): [T, ComputedRef<boolean>]` | One-shot `useLoaded`. |
| `useLocalFile` | `(): { file: Ref<File\|null>; url: Ref<string\|null>; delete(): void; upload(f: File): void }` | Hold a local file plus a managed object URL. |
| `useMounted` | `(): Ref<boolean>` | `true` after `onMounted`. |
| `useMutationObserver` | `<T>(ref: Ref<T\|null>, cb: MutationCallback, options?): void` | Auto-disposed MutationObserver. |
| `usePagination` | `(): { limits, page, perPage, total, setPage, setPerPage, setTotal }` | Bare pagination state (defaults `[5,10,25,50,100]`, page 1, perPage 25). |
| `usePasswordStrength` | `(password: Ref<string>): ComputedRef<{length, rules, strength}\|null>` | `too_weak`/`weak`/`medium`/`strong`. |
| `useResizeObserver` | `<T>(ref: Ref<T\|null>, cb: ResizeObserverCallback, options?): void` | Auto-disposed ResizeObserver. |
| `useScrollPosition` | `(target: MaybeRefOrGetter<EligibleTarget\|null>): { x: Ref<number>; y: Ref<number> }` | Reactive scroll offset. |
| `useService` | `<T extends BaseService>(cls: { new(): T }, ...wrap: ((fn: Function) => Function)[]): T` | Instantiate a service, wrap each prototype method with `guarded` (+ wrappers). |
| `useUrlState` | `(state: UrlStateInput, options?: { prefix?, serializers? }): void` | Two-way sync refs / reactive object with the URL query. |

Type exports:

- `UseHotKeyOptions`
- `useDataTable` family: `DataTableFetcher`, `DataTablePreload`,
  `DataTablePreloadContext`, `DataTableQuery`, `DataTableSort`,
  `DataTableSortDirection`, `UseDataTable`, `UseDataTableOptions`
- `useDataReport` family: `DataReportFetcher`, `DataReportPreload`,
  `DataReportPreloadContext`, `DataReportQuery`, `UseDataReport`,
  `UseDataReportOptions`
- `useUrlState` family: `UrlStateInput`, `UrlStateOptions`, `UrlStatePrimitive`,
  `UrlStateSerializer`, `UrlStateValue`

## Data composable shapes

The exact `useDataTable` / `useDataReport` contracts (the reference the return
type otherwise hides).

```ts
type DataTableSortDirection = 'asc' | 'desc';
type DataTableSort = { readonly direction: DataTableSortDirection; readonly field: string };

type DataTableQuery<TFilter> = {
    readonly filters: TFilter;
    readonly limit: number;
    readonly offset: number;
    readonly search: string;
    readonly sort: DataTableSort | null;
};

type DataTableFetcher<TItem, TFilter> =
    (query: DataTableQuery<TFilter>) => Promise<BaseResponse<Paginated<TItem>> | false>;

type UseDataTableOptions<TItem, TFilter> = {
    readonly fetcher: DataTableFetcher<TItem, TFilter>;
    readonly filters?: TFilter;
    readonly sort?: DataTableSort | null;
    readonly search?: string;
    readonly perPage?: number;
    readonly searchDebounceMs?: number;   // default 300
    readonly dependencies?: MultiWatchSources;
    readonly preload?: (ctx: { filters: Ref<TFilter>; search: Ref<string> }) => void | Promise<void>;
};

type UseDataTable<TItem, TFilter> = {
    readonly items: Ref<TItem[]>;
    readonly isLoading: ComputedRef<boolean>;
    readonly displayEmpty: Ref<boolean>;   // managed empty flag, no flash on first load
    readonly error: Ref<unknown>;
    readonly filters: Ref<TFilter>;
    readonly search: Ref<string>;
    readonly sort: Ref<DataTableSort | null>;
    readonly page: Ref<number>;
    readonly perPage: Ref<number>;
    readonly total: Ref<number>;
    readonly limits: Ref<number[]>;
    reload(): Promise<void>;
    setPage(num: number): void;
    setPerPage(num: number): void;
    setSort(sort: DataTableSort | null): void;
    setTotal(num: number): void;
    toggleSort(field: string): void;       // asc -> desc -> null
};
```

`useDataReport<TData, TFilter>` mirrors this without pagination or sorting.
Options: `fetcher: (query: { filters, search }) => Promise<BaseResponse<TData> | false>`,
plus `filters?`, `search?`, `searchDebounceMs?`, `dependencies?`, `preload?`, and
`isEmpty?: (data: TData) => boolean`. It returns
`{ data: Ref<TData | null>; displayEmpty; error; filters; isLoading; search; reload() }`.

## store

- `defineStore(id, setup)` - the setup-style Pinia wrapper; its ref-returning
  behavior is covered in SKILL.md section 1.
- Re-exports from Pinia: `createPinia`, `getActivePinia`, `setActivePinia`.

## router (vue-router 5 wrappers)

| Export | Signature | Role |
| --- | --- | --- |
| `useIsView` | `(name: string, loose = false): ComputedRef<boolean>` | Matched route name equals (or starts with) `name`. |
| `useNamedRoute` | `(name: Ref<string>\|string): { route; viewKey: ComputedRef<string\|undefined> }` | Named `<router-view>` depth handling; `provide`s `viewDepthKey`. |
| `useNavigate` | `(...wrap: Wrap[]): { navigate(to, replace?), push(to), replace(to) }` | Wrappable `push`/`replace`. `To = Omit<RouteLocationRaw,'replace'>`. |
| `useRouteMeta` | `(): ComputedRef<RouteMeta>` | Merge every matched record's `meta` (inner wins, via `lodash-es` merge). |
| `useRouteNames` | `(): ComputedRef<string[]>` | Matched record names, outer to inner. |
| `useRouteParam` | `(name: string, defaultValue: string\|null = null): Ref<string\|null>` | One route param as a ref with a fallback. |
| `useRouteView` | `(name: Ref<string>\|string): ComputedRef<RouteComponent\|null>` | Resolve a named view's component. |

Overlay / modal routing lives in `@basmilius/routing`, not here.

## error

Empty `Error` subclasses, thrown by the helpers and caught centrally:

- `ForbiddenException` - `guarded` on `403`.
- `UnauthorizedException` - `guarded` on an unsanctioned request.
- `HandledException` - `guarded` after your `onError` ran (already shown; stop
  propagating).
- `UnresolvedDependencyException` - `unrefAll` when a dep is falsy; swallowed by
  `useDataTable` / `useDataReport` to skip a fetch until deps are ready.

## util

| Export | Signature | Role |
| --- | --- | --- |
| `emptyNull` | `(str: string\|undefined\|null): string\|null` | `str \|\| null`. |
| `generateColorPalette` | `(baseHex: string, prefix = 'color'): Record<string,string>` | 12-shade CSS-var palette (`--{prefix}-25`..`-950`) via OKLCH; throws `Invalid color`. |
| `guarded` | `<T extends Function>(fn: T, onError?: (e: Error) => void): T` | The error-mapping wrapper (idempotent). |
| `onError` | `<T extends Function>(onError: (e: Error) => void): T` | Partially-applied `guarded`, usable as a `useService` wrapper. |
| `persistentRef` | `<T>(key: string, defaultValue: T, serialize?, deserialize?): Ref<T\|null>` | Ref mirrored to `localStorage` (deep-watched; `null` removes the key). |
| `persistentStringRef` | `(key: string, defaultValue: string\|null): Ref<string\|null>` | `persistentRef` for nullable strings. |
| `runBefore` | `<T extends Function>(before: () => void): T` | Wrap: run `before()` then the fn. |
| `unrefAll` | `<T extends readonly unknown[]>(...deps: T): UnrefAll<T>` | `unref` each dep; throw `UnresolvedDependencyException` if any is falsy. |
| `unwrapElement` | `<T>(ref: MaybeRef<T\|null>): HTMLElement\|null` | Resolve a ref to an `HTMLElement` (unwraps `$el`). |
| `unwrapTarget` | `(target: MaybeRefOrGetter<EligibleTarget\|null>): HTMLElement\|Window\|Document\|null` | Like `unwrapElement`, also passes `Window`/`Document`. |

## Interrelation

- **`@basmilius/http-client` (optional peer):** `guarded` uses `isRequestError` /
  `isUnsanctionedRequest`; `useService` types the class as `BaseService`;
  `useDataTable` / `useDataReport` fetchers return `BaseResponse<Paginated<T>>` /
  `BaseResponse<T>`; `useDtoForm` uses `cloneDto` / `markDtoClean`.
- **`@basmilius/utils` (hard dependency):** `useDebounced` wraps utils' `debounce`;
  `unwrapElement` / `unwrapTarget` use `isHtmlElement`.
- Also depends on `culori` and `lodash-es` (used by `generateColorPalette` and
  `useRouteMeta`).

## Gotchas

- `useService` walks own prototype methods only: inherited or arrow-assigned
  methods are not wrapped.
- `useDtoForm` re-clones on every source-ref change, discarding pending edits.
- `persistentRef` returns `Ref<T | null>` even with a non-null default.
- Browser-only composables (click-outside, local file, the observers, scroll
  position, `persistentRef`) have no SSR guards.
