# Doc components

On top of GitHub-flavoured markdown a doc may use the components below. Three
rules make all of them work: a block component always closes with `::`, props
are always double-quoted, and an internal target is a path rather than a URL.
Derive that path from the URL the script printed, dropping the scheme and domain
(`p/k3f9dqmn2xr/login-flow`); the shorter `p/<code>` form works just as well,
since the code is what resolves it. On GitHub or in a raw view these degrade to
visible marker lines with the target still readable.

Inline markdown works inside a component's body, so bold, links and code spans
come through; where block content is refused it says so below. An `icon` prop,
wherever one appears, takes a kebab-case Font Awesome Duotone name such as
`paper-plane`, `lock` or `circle-check`. There is no list here to look one up
in, so reach for a name you have seen rather than one that sounds right: a doc
publishes either way and names what it could not resolve in a warning.

## Card

Links to another published item or an external URL. For an internal target the
host fills in the title, description and kind icon at render time, so write
nothing but the path; body text replaces the description. An `icon` prop
overrides the kind icon it would pick itself.

```markdown
::card{to="p/k3f9dqmn2xr/login-flow"}
::

::card{to="https://flux-ui.dev" icon="paintbrush"}
Optional one-line teaser that replaces the resolved description.
::
```

A **card grid** puts cards side by side where the column allows it. Note the
extra colon on the wrapper:

```markdown
:::cards
::card{to="p/k3f9dqmn2xr/login-flow"}
::
::card{to="p/t7b3wqnk4pd/checkout-flow"}
::
:::
```

## Embedded diagram

Shows a published diagram inside the doc, in an interactive frame with a link to
the full page. Body text becomes the caption. Without a `height` the frame takes
the reader's own viewport ratio; pass one only when a diagram wants less room.

```markdown
::diagram{path="p/t7b3wqnk4pd/checkout-flow"}
The checkout flow, embedded.
::
```

## Callouts

GitHub's alert syntax, which GitHub itself also renders. `NOTE`, `TIP`,
`WARNING`, `IMPORTANT` and `CAUTION` are accepted: note for context, tip for a
shortcut, warning for something that bites.

```markdown
> [!NOTE]
> Docs are cached for five minutes.
```

## Collapsible section

Folds detail away behind a summary the reader clicks open. Put prose, lists,
links or a callout inside, never a code fence or a `::tree`; keep those at the
top level of the doc. Add `open="true"` for one that starts unfolded, which is worth it when the
detail is the point and the fold is only there to keep the page short.

```markdown
::details{summary="Why the retry loops"}
Prose, a list, a callout. No code fence or file tree.
::
```

A **details group** turns several collapsibles into an accordion: one open at a
time, all closed on arrival. Good for FAQs, and it holds the same rule about
what may go inside.

```markdown
:::details-group
::details{summary="First question"}
The answer.
::
::details{summary="Second question"}
Another answer.
::
:::
```

## Progress bar

States how far something is. `status` is the label, `min` and `max` default to 0
and 100, and the colors are the badge colors.

```markdown
::progress{value="60" status="Rollout to production" color="success"}
::
```

## Stat tiles

Put the numbers of a report in a grid. `hint`, `icon` and `color` are optional;
the color tints the icon, or the value when there is no icon.

```markdown
:::stats
::stat{value="3" label="Blockers" icon="circle-xmark" color="danger"}
::
::stat{value="7" label="Must fix" icon="circle-exclamation" color="warning"}
::
::stat{value="2.0 MB" label="Server bundle" hint="gzip"}
::
:::
```

## Inline badge

A status chip in running text or a table cell. The text in `[...]` is the label
a reader sees, so make it a real word like `Critical` or `Blocker`, never the
color name. `color` only sets the tint: `gray`, `primary`, `info`, `success`,
`warning`, `danger`.

```markdown
The rollout is :badge[Done]{color="success"}, the docs are :badge[In review]{color="warning"}.
```

## Steps

Dresses a plain ordered list as numbered stops on a line, for instructions and
how-tos.

```markdown
::steps
1. Install Bun.
2. Run the script.
::
```

## Facts panel

A key-value block for metadata at the top of a doc. Every prop becomes a row and
the keys are yours to choose.

```markdown
::facts{status="In review" ticket="IPV3-5924" branch="feature/rich-docs"}
::
```

## File tree

Renders a plain nested list as a tree. A trailing slash marks a folder; an entry
with children is one already.

```markdown
::tree
- src/
  - worker/
    - index.ts
- package.json
::
```

## Images

Every image in a doc opens in a lightbox when clicked. A `{.wide}` image breaks
out of the text column, and the title becomes its caption. Upload the image
first as `--type file`, then write the doc around the URL it printed.

```markdown
![Dashboard sketch](https://dropoff.sh/p/p7c2rjsw9qm/dashboard-sketch.png "The caption"){.wide}
```

## YouTube

Embeds in a frame; a bare id, a watch URL or a share link all work, and body
text becomes the caption.

```markdown
::youtube{id="5UiM7m9tQ80"}
::
```

## Code fences

A **fence title** names the file above the block, straight after the language,
and gets a copy button either way:

````markdown
```typescript [server/utils/foo.ts]
const x = 1;
```
````

A **code group** turns consecutive fences into tabs, labelled by their titles:

````markdown
:::code-group
```typescript [a.ts]
const a = 1;
```

```bash [terminal]
bun run dev
```
:::
````

## Diff

Renders a unified diff the way GitHub does: syntax-highlighted, with a toggle
between unified and split view and a copy button for the raw patch. `title`
names the file above the block. The body is one ```diff fence holding the patch
exactly as `git diff` printed it; the fence is what keeps `---` and `+++` lines
from being read as markdown. One file per block: a multi-file patch falls back
to a plain highlighted fence with a publish warning, so split it into one
`::diff` per file. A bare ```diff fence outside the component stays a simple
highlighted snippet, so reach for `::diff` when the change itself is the story.

````markdown
::diff{title="src/app.ts"}
```diff
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,3 +1,3 @@
 import { createApp } from 'vue';
-const app = createApp({});
+const app = createApp(App);
```
::
````

## Warnings

Publishing a doc never fails over its content, but it may print warnings: a card
target that does not resolve yet, an unknown component (usually a typo like
`::caard`), an unknown icon. Relay them; a target published a moment later
simply starts working.
