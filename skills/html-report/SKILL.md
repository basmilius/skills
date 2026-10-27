---
name: html-report
description: >-
  Create or update a single-file HTML report, written in TSX on the components and
  charts of adecore and built with Bun, in the brand color and icon of the project, with light and dark
  mode. Use for reviews, findings, status reports, incident reviews, measurement
  reports and action plans, or when asked to reuse this report style. Not for
  application screens or reports that require another file format.
license: MIT
---

# HTML report

A report is written as a `.tsx` file and built into one HTML file:

```sh
bun <this skill>/scripts/build.ts report.tsx          # writes report.html next to it
bun <this skill>/scripts/build.ts report.tsx --out reports/review.html
```

The build renders the report to plain HTML and appends the runtime (React,
`@adecore/ui`, `@adecore/charts`, the components, the Lucide icons the report uses)
that brings it to life in the browser. It needs Bun and nothing else: no install, no
project. The HTML file needs no network, so it opens offline and in sandboxed
previews, at about 400 kB.

The text of the report sits as ordinary HTML at the top of the file, so another
agent, `grep` or a browser without JavaScript reads it directly; every chart carries
its values as a table. After the line `<!-- html-report runtime ... -->` follow only
the gzipped scripts; there is no need to read past it.

A report is frozen once it is built: it carries the runtime of that day and never
changes with a later version of this skill. Keep the `.tsx` next to the HTML as the
source for updates.

```tsx
import { Lead, Report, Row, Rows, Section, Status } from 'html-report';

export default (
    <Report title="Review: session restore after restart" kind="Code review" model="Claude Opus 5.5" meta="27 October 2026 · PR #482" lang="en" brand={{ name: 'Ruimte', color: '#155dfc' }}>
        <Lead>
            <p>The conclusion first.</p>
        </Lead>
        <Section title="Blocking">
            <Rows>
                <Row title="Session starts twice after a crash" end={<Status tone="error">High</Status>}>
                    Two windows read the state before either takes the lock.
                </Row>
            </Rows>
        </Section>
    </Report>
);
```

The default export is the `<Report>` element. Always set `lang` (`nl` or `en`) to the
language of the report, and `model` to the name of the model writing it, such as
`Claude Sonnet 5.5`; the report shows it with the logo of its provider. A report imports from `html-report`,
`react` and `lucide-react` only; data can be computed in the file itself. Bun strips
types without checking them. Read [references/components.md](references/components.md)
for every component and the chart API. The [examples](examples) are complete reports
to start from, each as source and built file:

| Example | Shows |
| --- | --- |
| [performance.tsx](examples/performance.tsx) | Wide layout, three charts, notes in the margin |
| [code-review.tsx](examples/code-review.tsx) | Code excerpts and a diff, verified and assumed findings, an open question as a card |
| [status.tsx](examples/status.tsx) | Milestones with progress, pace against plan, risks, a decision as a card |
| [incident.tsx](examples/incident.tsx) | A timeline, a chart with the incident marked, a table of actions |
| [disk-usage.tsx](examples/disk-usage.tsx) | In English: a `Ranking` of long paths, sizes with `formatBytes`, cleanup steps with a condition for done, a numbered diff |

## Brand

The toolbar at the top shows the project's mark and name, the `kind` of report and
the theme switch. Pass the brand as `brand` on `Report`; take each part
(name, color, mark) from the first source that has it:

1. What the user gives.
2. The project's `.ruimte` folder: `name` and `color` from `project.json`, and as the
   mark `.ruimte/icon.png` when it exists (`icon: '/path/to/project/.ruimte/icon.png'`),
   otherwise the `icon` of `project.json`: `{ "kind": "lucide", "value": "gift" }`
   goes in as `icon: 'gift'`.
3. The product's own identity: a logo in the repository, the README, the app's theme
   or brand tokens. A token merely named `accent`, syntax colors or scene materials
   are not a brand.
4. Nothing clear: the project name and one muted color that fits it. Say so in the
   handoff.

A logo goes in as it is, drawn at 22px in its own colors, so do not recolor it. Give
a logo file by its path (absolute or relative to the report): the build embeds an SVG
as markup and an image as a `data:` URL, scaled down to 64px on macOS. A Lucide icon takes the accent color. Without any mark
the first letter of the name stands on the accent. The accent per theme is derived
from `color` with enough contrast, so a bright brand color can go in as it is.
Status colors stay independent of the brand.

## Layout

- `narrow` (default): a centered column of 720px. Fits almost every report.
- `wide`: a centered column of 1000px with a margin beside each section for the
  `aside` of `Section` and `Lead`. Use it for a detailed report with many charts,
  where conditions, sources and remarks belong next to the figure they explain.

The contents, built from the section titles, and the model stand at the right edge
of the page when they fit beside the column (from 1280px for `narrow`, 1560px for
`wide`); otherwise the contents are left out and the model closes the report. On a
narrow screen a wide margin folds under its section.

Sections run on the page without cards. Use a `Card` only for something that has to
stand apart from the flow: a decision the reader has to make, an open question. One
or two per report at most.

## Compose the report

- Lead with the conclusion, decision or current state. Put date, scope and revision
  in `meta`. Follow with `Figures` when a few numbers carry the story.
- One section per question the reader has. Keep evidence (a chart, an excerpt, a
  measurement) in the section of the claim it supports.
- In a review, separate verified findings from assumptions and open questions, and
  tie each action to a condition for done (`Step done="..."`).
- With measurements, keep units, conditions and sources. Mark superseded results as
  historical instead of deleting them.
- Write direct prose in the language of the request; set `lang` to match (`nl` or
  `en`). Use the `unslop` skill for a final pass when it is available.
- Copy the structure of an example, never its names, numbers or findings.

## Theme

The report follows the system's light or dark mode. The switch in the header
overrides it per file and remembers the choice. Embedded in a host that sets
`--background` (a Ruimte chat), the report takes that background and follows the
host's appearance. Printing always uses light mode.

## Deliver and check

Save the `.tsx` and the HTML where the user asks or in the project's existing report
folder, and link to the HTML. When updating, edit the `.tsx`, keep the section ids
and build again.

A mistake in the report fails the build with the file and line. Open the HTML in a
browser to check it when the environment allows: both themes and a narrow window.
Report which checks you could not do.
