# Layout, data & navigation components

Which component to reach for and how the pieces fit; exact props are on the doc pages
(`references/component-index.md` has the URLs). Cross-cutting rules (`gap` in pixels,
colors, design tokens) live in `references/conventions.md`.

## Layout primitives

Compose structure with components, not raw CSS. Naming quirk: the `Layout` path
segment is **dropped** from the export (`layout/flex` → `FluxFlex`).

- **Flex** - `FluxFlex` (`direction="horizontal|vertical"`, `:gap` a number in px,
  plus `align`, `justify`, `wrap`, `is-inline`, `tag`); `FluxFlexItem` for item-level
  props. Drive **structural** responsive changes (e.g. flipping direction) from
  `useBreakpoints()`, not CSS media queries.
- **Grid** - `FluxGrid` + `FluxGridColumn`.
- **Container & spacing** - `FluxContainer` (max width), `FluxSpacer` (flexible
  space), `FluxSpacing`, `FluxAspectRatio` (media), `FluxDivider` / `FluxSeparator`.
- **Split view** - `FluxSplitView` + `FluxSplitViewPane` (resizable list/detail).
- **Adaptive / overflow** - `FluxAdaptiveGroup` + `FluxAdaptiveSlot`,
  `FluxOverflowBar` (moves overflowing items into a menu).

Stack helpers under `layout/flex/*` export as `Flux*Stack`: `FluxActionStack`,
`FluxBadgeStack`, `FluxButtonStack`, `FluxInfoStack`, `FluxNoticeStack`,
`FluxTagStack`.

## Panes & list rows

`FluxPane` is the standard card/surface (`FluxPane` › `FluxPaneHeader` /
`FluxPaneBody` / `FluxPaneFooter`, plus `FluxPaneGroup`, `FluxClickablePane`,
`FluxPaneMedia`, `FluxLayerPane`). Most content sits in a `FluxPaneBody`;
empty/loading states use `FluxPlaceholder` / `FluxSkeleton`. For a decorative
top-of-pane illustration use `FluxVisualPaneIllustration` from `@flux-ui/visuals`.

List rows use the item family (`FluxItem` + `FluxItemMedia` / `FluxItemContent` /
`FluxItemActions`, stacked in a `FluxItemStack`): **static** rows in a `FluxPane`,
**navigating** rows as `FluxClickablePane` (one per row, not in a shared stack).
Copy-ready skeletons and the `FluxLayerPane` grouping / padding caveats:
`references/patterns.md` §5.

## Tables

Two levels of abstraction, pick deliberately:

- **`FluxDataTable`** - the higher-level, batteries-included table (sorting,
  selection, pagination). First choice for typical list views. Data-driven shape
  (`:items` + per-column scoped slots, sticky headers, row actions):
  `references/patterns.md` §3.
- **`FluxTable` primitives** - `FluxTableHeader`, `FluxTableRow`, `FluxTableCell`,
  `FluxTableActions`, `FluxTableBar`. Compose these for a **small, static** table (no
  pagination). Explicit `#header` (a `FluxTableRow` of `FluxTableHeader`s) and one
  `FluxTableRow` › `FluxTableCell` per row; custom cells read `useTableInjection`.
  **Place a `FluxTable` inside a `FluxPane`** (its cell edge-padding only applies
  within a pane structure); a titled block is `FluxLayerPane` › `FluxPaneHeader` +
  `FluxPane` › `FluxTable` (set `:is-bordered="false"` to drop inner cell borders).

`FluxPagination` (+ `FluxPaginationBar`) for standalone page navigation.

## Other data structures

- **Kanban** - `FluxKanban` › `FluxKanbanColumn` › `FluxKanbanItem`
  (`useKanbanInjection`).
- **Tree view** - `FluxTreeView` (and the form control `FluxFormTreeViewSelect`).
- **Timeline** - `FluxTimeline` › `FluxTimelineItem`.
- **Calendar** - `FluxCalendar` › `FluxCalendarItem` (`useCalendarInjection`);
  standalone `FluxDatePicker`.
- **List items / people** - `FluxItem` family; `FluxComment`, `FluxPersona`,
  `FluxAvatar` for people/content rows.
- **Gallery** - `FluxGallery` › `FluxGalleryItem`.

## Filtering

`FluxFilterBar` hosts the `Flux Filter*` controls (full list:
`references/component-index.md` › Filter). `FluxFilter` is the standalone version
(`v-model` a `FluxFilterState` + the same controls in its default slot) for filtering
a non-table list. Custom controls read `useFilterInjection`; build reusable filters
with `defineFilter` (or the `defineFilterMacro` compile macro from
`@flux-ui/components/vite`).

Each control takes `name` / `label` / `icon`. **`FluxFilterRange` also requires `min`
and `max`** (+ optional `:formatter`); `FluxFilterOption(s)` take `:options`
(`FluxFilterOptionItem[]`, `{ label, value, icon? }`); the async variants take
`:fetch-options` / `:fetch-relevant` / `:fetch-search` (returning
`FluxFilterOptionRow[]`). The value each writes into the `v-model` state (keyed by
`name`) differs by type: **single option → scalar; multi `Options` → array;
`Date` → `DateTime`; `DateRange` / `Range` → 2-tuple** (guard with `Array.isArray`
when applying). Worked skeleton: `references/patterns.md` §3.

## Navigation

- **Breadcrumb** - `FluxBreadcrumb` › `FluxBreadcrumbItem`.
- **Menus** - `FluxMenu` with `FluxMenuItem`, `FluxMenuGroup`, `FluxMenuOptions`,
  `FluxMenuCollapsible`, `FluxMenuTitle`, `FluxMenuSubHeader`. **Always wrap
  `FluxMenuItem`s in a `FluxMenuGroup`** (the group provides the right spacing; bare
  items, including after `FluxApplicationMenuContext`, sit too far apart).
- **Tabs** - `FluxTabs` › `FluxTab` (in-page tabbed content); `FluxTabBar` ›
  `FluxTabBarItem` (top-level/bar-style nav, `useTabBarInjection`).
- **Stepper / wizard** - `FluxStepper` › `FluxStepperSteps` › `FluxStepperStep`.
  Pattern: `https://flux-ui.dev/guide/patterns/stepper-wizard`.
- **Command palette** - `FluxCommandPalette` for ⌘K-style global search/actions. It
  is **`:sources`-driven and has no default slot**: feed a `FluxCommandSource[]` (each
  source: `key`, `label`, optional `tab`, and `items` with
  `{ id, label, subLabel?, icon?, onActivate }`). `FluxCommandPaletteGroup` /
  `FluxCommandPaletteItem` are the internal building blocks it renders from that data,
  **not** components you place yourself.
- **Toolbar** - `FluxToolbar` › `FluxToolbarGroup`.
- **Segmented control** - `FluxSegmentedControl` › `FluxSegmentedControlItem` for a
  small set of mutually exclusive options (`useSegmentedControlInjection`).
- **Links** - `FluxLink` for inline navigation; button `type="route"` / `"link"` for
  button-styled navigation (see `references/conventions.md`).

## Expand / collapse

`FluxExpandable` (+ `FluxExpandableGroup` for accordion behaviour;
`useExpandableGroupInjection` for custom triggers).
