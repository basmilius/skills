# Components

Everything below is imported from `html-report`, the adecore components and charts
included. The only other modules a report can import are `react` and `lucide-react`.
Props in `code`; `children` is the content between the tags unless the row says
otherwise.

## Page

| Component | Props | Use |
| --- | --- | --- |
| `Report` | `title`, `lang` (`nl` or `en`), `kind`, `model`, `provider`, `meta`, `layout` (`narrow` or `wide`), `brand` | The page: a toolbar with the brand, the `kind` of report and the theme switch; then the title, the meta line (text or JSX) and the report. The contents and the model sit at the right edge of the page where they fit, otherwise the model closes the report. |
| `Section` | `title`, `id`, `toc`, `aside` | A section with an `h2` that appears in the contents. `toc` is a shorter label there. `aside` sits in the margin of a wide report and under the section in a narrow one. |
| `Lead` | `aside` | The opening conclusion in a larger size. Put `<p>` elements in it. In a wide report, `aside` holds the scope and conditions beside it. |
| `Intro` | | A muted line under a section title. |

`brand` is `{ name, color, icon }`. `color` is a hex color; the accent is derived from it
per theme with enough contrast. `icon` is a Lucide name (`'gift'`, drawn in the
accent), or a logo, drawn in its own colors: the path of an `.svg`, `.png` or `.jpg`
file (absolute or relative to the report; the build embeds it), inline SVG markup or
a `data:` URL. Without an icon the mark shows the first letter of
`name` on the accent.

`lang` is required: it sets the words of the interface (contents, theme switch, value
tables), the number and date formats of the charts, and `<html lang>`. The build
warns when it is missing. Only `nl` and `en` exist; other languages fall back to
English for the interface.

`model` is the name of the model that wrote the report (`Claude Sonnet 5.5`). It shows
with the logo of its provider, which is read from the name: Anthropic, OpenAI,
Google, Mistral AI, DeepSeek, Alibaba, Moonshot AI, Meta, xAI or GitHub. Set
`provider` to one of those names when the model name does not give it away. Opened,
the block lists the model, the provider and when the report was built.

## Content

| Component | Props | Use |
| --- | --- | --- |
| `Figures` + `Figure` | `value`, `label`, `delta`, `trend` (`good`, `bad`) | A row of key numbers between hairlines. `trend` colors the delta. |
| `Rows` + `Row` | `title`, `end` | Findings, risks, items. `end` sits on the right: a `Status`, a number, or several in a fragment (`end={<><Status tone="error">High</Status><Status tone="ok">Verified</Status></>}`). Details go in `children`, also `Code` and `Diff`. |
| `Ranking` | `items`, `format`, `max`, `label` | A ranked list as horizontal bars, for categories with long names: each item `{ label, value, tone, color, note }`, the label on the left (with `note` under it), the bar, the value written by `format`. Bars scale to `max` or to the largest value. |
| `Status` | `tone` (`ok`, `warn`, `error`, `muted`, `accent`; `muted` by default) | A small label: severity, verification state, a short number. |
| `Card` | `title` | A surface of its own for the one thing that has to stand apart: a decision, an open question. |
| `Callout` | `tone` (`neutral` by default, `attention`, `error`) | A one-line message with an icon. `neutral` for context the reader needs, `attention` for a caveat (a measurement with a limit, data that is missing), `error` for something that blocks or failed. |
| `Steps` + `Step` | `title`, `done` | Numbered actions. `done` says when an action counts as finished; it follows a "Done when" label, so write only the condition. |
| `Checks` + `Check` | `status` (`done`, `failed`, `skipped`) | What was tested or verified. The status shows as a mark and is spelled out for screen readers. |
| `Milestones` + `Milestone` | `title`, `progress` (0 to 100), `status` | Progress per milestone; `children` is the date line. |
| `Events` + `Event` | `time`, `title`, `tone` | A timeline of moments, such as an incident. |
| `Columns` + `Column` | `title` | Side-by-side lists or text, such as what went well and what did not. |
| `Code` | `file`, `start`, `highlight` | A code excerpt. `start` numbers the lines; `highlight` marks line numbers. |
| `Diff` | `file`, `start` | A unified diff; `+` and `-` lines are colored. `start` numbers the lines of the new version; removed lines get no number. |
| `Plot` | `caption`, `xLabel`, `xFormat` | Wraps a chart or image with a caption. A `Chart.Root` directly inside gets its values as a collapsed table, stacked series included, so the numbers are readable without the chart. `xLabel` heads its first column (the data key otherwise); `xFormat` writes the x values. Dates show as a month, a day or a moment, as precise as the data. |

`Code` and `Diff` take the code as a template string; a first and last empty line are
dropped, so the code can start on the line after the backtick. Escape a backtick as
`` \` `` and `${` as `\${` inside it.

Plain HTML is styled too: `<p>`, `<ul>`, `<ol>`, `<table>` (add `data-numeric` to
`<th>` and `<td>` for right-aligned numbers), `<code>`, `<a>`, `<h3>`. Utility classes:
`report-muted`, `report-good`, `report-bad`.

## Numbers

`formatNumber`, `formatDecimal` (one decimal), `formatRounded(value, decimals)`,
`formatPercent` (takes 12.5 for 12.5%), `formatBytes` (steps of 1024, written as KB,
MB, GB), `formatDuration` (milliseconds), `formatMoney(value, currency)`, `formatDay`
and `formatDayWithYear` write in the language of the report, also when called while
the report's elements are created. Use them rather than `toLocaleString`, and keep one
unit per report.

## Charts

From `@adecore/charts`: `Chart`, `Heatmap`, `Timeline`, `Sparkline`, `SeriesLegend`,
`createChart`, `useChart`. Docs and demos: https://adecore.dev/charts/.

```jsx
<Plot caption="Median of 50 runs.">
    <Chart.Root data={rows} x="release" xScale="band" y={{ min: 0 }} label="Render time per release" height={220} format={(value) => `${value} ms`}>
        <Chart.Grid />
        <Chart.XAxis />
        <Chart.YAxis />
        <Chart.Area value="median" label="Median" tone="accent" />
        <Chart.Line value="p95" label="p95" tone="needsYou" dots />
        <Chart.Tooltip />
        <Chart.Legend />
    </Chart.Root>
</Plot>
```

- `xScale` is `band` for categories, `time` for `Date` values, `linear` or `log` for numbers.
- `y` takes `min`, `max`, `include` (values the axis must reach), `integer`, `step` and `headroom` (`tick`, `step` or `none`).
- Series: `Chart.Line` (`dots`, `dashed`), `Chart.Area`, `Chart.Bar` (`valueLabels`; `tone` may be a function of the row). Columns are vertical only and the x axis thins its labels from about eight columns on; for more categories or long names use `Ranking`.
- Stacked columns: `Chart.Bar` elements inside `<Chart.Bars stack>`.
- Annotations: `Chart.Band` (`from`, `to`, `label`), `Chart.Marker` (`at`, `label`), `Chart.Rule` (`value`, `label`).
- Tones: `accent`, `error`, `needsYou`, `idle`, `running`, `muted`, or `{ color: 'var(--chart-2)' }`. The categorical colors are `--chart-1` (the accent) to `--chart-6` and repeat after six; group the rest into "other".
- `label` on the root names the chart for screen readers. `Chart.Table` adds a table of the values after hydration only; rely on `Plot` for values in the HTML.
- `Heatmap` takes `rows`, `columns`, `values`, `label`, `valueLabel`, `tone`.

## Interface pieces

From `@adecore/ui`: `Pill`, `Tooltip`, `Tabs`, `KeyValueList`, `Meter`, `SegmentBar`,
`Segmented`, `Kbd`, `Keys`, `Separator`, `Banner`, `CopyButton`, `Wipe` (a before and
after slider for two images), `MiddleTruncate`. Docs: https://adecore.dev/ui/.

- `Meter`: `value` (null for not measured), `min` (0), `max` (100), `marks` (lines for a target or a limit), `label` (required, for screen readers), `valueText`, `className` (its width, such as `w-full`).
- `Pill`: `tone` (`muted`, `raised`, `idle`, `needsYou`, `error`, `accent`), `size` (`md`, `sm`), `icon`, `mono`. `Status` is a `Pill` with the report's tones.
- `SegmentBar`: one bar split into parts, for shares of a whole: `parts` (`{ value, label, color }` each), `range`, `size` (`sm`, `md`), `label`.

Icons: import Lucide icons by name from `lucide-react` (`import { Rocket } from
'lucide-react'`); the build puts only those in the file and stops at an unknown name.
They take `size`, `strokeWidth`, `color`, `className`, `style` and `aria-label`.
React hooks come from `react`, so a
report can hold state, such as a `Segmented` that switches between two charts; put
that in a component of its own inside the report, since the built HTML shows its
first state until the page is hydrated.

The CSS is compiled ahead, so only a fixed set of Tailwind utilities exists for
layout around the components: `flex`, `grid`, `grid-cols-1` to `-4` (also `sm:` and
`md:`), `gap-`, `mt-`, `mb-`, `p-`, `px-`, `py-` with 1, 2, 3, 4, 6 or 8, alignment,
`w-full`, `min-w-0`, `grow`, `truncate`, the text sizes `xs` to `lg`, `font-medium`,
`font-semibold`, `font-mono`, `tabular-nums` and the colors `text-text`,
`text-text-muted`, `text-text-faint` and `text-accent`. Use the `style` prop for
anything else.
