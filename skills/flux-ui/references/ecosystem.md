# Ecosystem: sibling packages

This skill is primarily about **`@flux-ui/components`**, but real apps compose the app
shell and data visualisations from two siblings. Install and import them separately
(not re-exported from `@flux-ui/components`), and **add each one's
`@basmilius/vite-preset` plugin** (`fluxApplication()` / `fluxStatistics()`) or it
loads from dist unstyled. Peers and the plugin rule: `references/conventions.md`.

## `@flux-ui/application` - the app shell

The outer chrome of a Flux app (top bar, side menu, content regions). A typical app
uses `FluxApplication` as the root inside `FluxRoot`, fills the `#menu` slot, and
renders pages into `FluxApplicationContent`.

| Export | Purpose |
| ------ | ------- |
| `FluxApplication` | Root shell; has a `#menu` slot |
| `FluxApplicationTop` | Top bar |
| `FluxApplicationSide` | Side region (still in development, avoid for now) |
| `FluxApplicationContent` | Page content region (e.g. `layout="narrow"`) |
| `FluxApplicationSection` | A section within the content (`title`, `info`) |
| `FluxApplicationHero` | Hero region (marketing/landing headers, not app pages) |
| `FluxApplicationMenu` | The application menu |
| `FluxApplicationMenuAccount` | Account block in the menu |
| `FluxApplicationMenuContext` / `FluxApplicationMenuContextStack` | Context switcher / stack |
| `FluxApplicationMenuPromo` | Promo block in the menu |
| `FluxApplicationMenuToggle` | Menu open/close toggle |

Composables & data: `useApplicationInjection`, `useApplicationMenu`,
`useApplicationContextMenu`, `useApplicationContextRegistration`, the provide/inject
key `FluxApplicationInjectionKey`, and types `FluxApplicationInjection`,
`FluxApplicationContextInfo`, `FluxApplicationLayout`.

**Composition (verified against a production app):**

- **`FluxApplication`** is the shell root (inside `FluxRoot`); fill its `#menu` slot
  with a `FluxApplicationMenu`.
- **`FluxApplicationTop`** - top bar. Props `icon`, `title`; slots `#end`
  (right-aligned: search, notifications, profile) and `#tabs`. ⚠ It renders the
  tab-bar **row whenever the `#tabs` slot is *provided*** (a `<RouterView name="tabs">`
  that renders nothing still counts), so provide it **conditionally**:
  `<template v-if="routeHasTabs" #tabs>` (compute from
  `route.matched.some(r => r.components?.tabs != null)`).
- **`FluxApplicationMenu`** - the sidebar. Slots `#logo`, `#header` (account + context),
  `#footer` (settings/admin), `#context` (`FluxApplicationMenuContextStack`). The nav
  items are plain `@flux-ui/components` `FluxMenuGroup` › `FluxMenuItem`
  (`icon-leading`, `is-active`, `label`, `:to`, `type="route"`), groups split by
  `FluxDivider`.
- **`FluxApplicationContent`** - the page wrapper; `layout` is
  `default | dashboard | full | medium | narrow` (`FluxApplicationLayout`). Use
  `narrow` for forms/settings, `dashboard` for dashboards, `full` for a table/calendar
  (see `references/patterns.md` §3).

**Peers:** `luxon` and `vue-router`.

## `@flux-ui/statistics` - KPIs, charts & meters

Data-visualisation components: a grid, KPI cards, a chart-pane wrapper, and chart types
(the charts wrap **ECharts**). **Peers (required):** `echarts`, `lodash-es`, and
`vue-i18n` (register with `globalInjection: false`, see `references/conventions.md`).

**Containers & summaries:** `FluxStatisticsGrid`, `FluxStatisticsChartPane`,
`FluxStatisticsKpi`, `FluxStatisticsMetric`, `FluxStatisticsChange`,
`FluxStatisticsComparison`, `FluxStatisticsMeter`, `FluxStatisticsPercentageBar`,
`FluxStatisticsRadialBar`, `FluxStatisticsSparkline`, `FluxStatisticsEmpty`.

**Legend:** `FluxStatisticsLegend`, `FluxStatisticsLegendItem`,
`FluxStatisticsLegendScope`. **Details table:** `FluxStatisticsDetailsTable`,
`FluxStatisticsDetailsTableRow`.

**Charts:** `FluxStatisticsChart` (generic) plus `FluxStatisticsAreaChart`,
`FluxStatisticsBarChart`, `FluxStatisticsBoxPlotChart`, `FluxStatisticsBubbleChart`,
`FluxStatisticsCandlestickChart`, `FluxStatisticsDonutChart`,
`FluxStatisticsHeatmapChart`, `FluxStatisticsLineChart`, `FluxStatisticsMixedChart`,
`FluxStatisticsPieChart`, `FluxStatisticsPolarAreaChart`, `FluxStatisticsRadarChart`,
`FluxStatisticsScatterChart`, `FluxStatisticsTreemapChart`. Low-level base:
`FluxStatisticsBase`. Color helper/type: `FluxStatisticsChartColor`.

Verified props:

- **`FluxStatisticsGrid`** - responsive column counts per breakpoint: `xs`, `sm`, `md`,
  `lg`, `xl` (numbers), plus `gap`. E.g. `<FluxStatisticsGrid :sm="2" :md="3" :xl="5">`.
- **`FluxStatisticsKpi`** - `title` (required), `value` (string/number, required),
  `icon`, optional `change` and `footer`.
- **`FluxStatisticsChartPane`** - `title`, `icon`, `aspect-ratio`; `#info` slot for a
  note; put a chart component inside it.

**Chart prop traps (build-verified):** most charts take `:series`, but two don't:
**`FluxStatisticsTreemapChart` takes `:nodes`** (`FluxStatisticsChartTreemapNode[]`) and
**`FluxStatisticsPolarAreaChart` (like pie/donut) takes `:slices`**. Series colors
accept a `FluxStatisticsChartColor` (`FluxColor | #hex | var(--token)`), but
**`FluxStatisticsLegendItem`'s `color` is only `FluxColor | #hex`** (a `var(--…)` is a
type error there). A custom legend goes in the `FluxStatisticsChartPane` **`#legend`**
slot (wrap items in `FluxStatisticsLegendScope`); the auto legend is just
`<FluxStatisticsLegend/>` there. Full dashboard skeleton: `references/patterns.md` §6.

## Other `@flux-ui` packages

- **`@flux-ui/types`** - the shared TypeScript surface (`FluxIconName`, `FluxColor`,
  `FluxTo`, the `*Object` / `*Injection` types). Not re-exported by
  `@flux-ui/components`; import types from here (see `references/conventions.md`).
- **`@flux-ui/visuals`** - decorative visuals (`FluxVisual*`); reuse the components
  theme tokens. Never as load-bearing UI. See `references/component-index.md` › Visual.
- **`@flux-ui/internals`** - internal building blocks; not for direct app use.
- **`@basmilius/vite-preset`** - the build-time `preset()` + `flux()` plugins.
