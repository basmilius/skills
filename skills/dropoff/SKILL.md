---
name: dropoff
description: >-
  Publish a document, a diagram, a code snippet, a table, a diff or a small file
  from the terminal to a publishing host (unlisted URL), drawing diagrams with Flux
  Flow. Use when the user asks to publish, post or put something online ("publiceer
  dit plan op dropoff.sh", "zet dit diagram online"), to update something published
  earlier, to upload a small image, or wants a diagram of a process, flow, pipeline
  or architecture ("maak een diagram van het inlogproces", "teken deze pipeline"),
  a snippet or a dataset online, or wants to show a code change as a rich diff
  ("publiceer deze diff", "zet deze wijziging online als diff"). Six kinds: a doc
  (markdown, with components), a diagram (a Flux Flow template with explicit
  coordinates), a code snippet, a sortable table, a single-file diff, and a file
  (raw bytes).
license: MIT
---

# Publishing to a host

A page is published with one request and gets an unlisted URL: public to anyone
holding the link, but with a random code, no index, and `noindex` on the page.
A URL looks like `/k3f9dqm/login-flow-h4p2nx`: a short code that keys the page,
then a slug that is there only to keep the URL readable. Replacing a page later
keeps that code, so its link never moves. A doc or a diagram also gets a shorter
link, `/p/<code>`, the same code on its own, and that is the link to hand a
reader. The host decides the exact URLs, so report what the script prints rather
than assembling one.

## Installing and updating

The script runs on [Bun](https://bun.sh), so that has to be installed:
`brew install oven-sh/bun/bun`, or `curl -fsSL https://bun.sh/install | bash`.

```shell
npx skills add basmilius/skills --skill dropoff
npx skills update dropoff
```

The skill is copied into the agent's skills directory rather than linked, so a
newer version arrives through `npx skills update`, not on its own.

## Setup

One environment variable, and nothing else to configure:

| Variable | Holds |
| --- | --- |
| `DROPOFF_TOKEN` | The bearer token the host issued |
| `DROPOFF_ENDPOINT` | Optional. Another host to publish to, when not `https://dropoff.sh` |

If the token is missing the script says so and stops. Report that rather than
inventing a value or writing a config file: there is no config file to write.

A token is not always enough on its own. An account that signed itself up has to
confirm its email address before it may publish anything, and until it does the
host answers `Verify your email address before publishing.` Nothing the script
does can get past that, so report it and leave the account holder to follow the
link they were mailed.

It has to be readable by the shell the agent runs commands in. On macOS that
means `~/.zshenv`, which zsh reads for every shell it starts; `~/.zshrc` is only
read by interactive ones, so a non-interactive command will not see it. For
Claude Code the `env` block in `~/.claude/settings.json` works too. Keep the
token out of a project's `.claude/settings.json`, since that one is committed.

Nothing is kept on disk. The host remembers what was published where, so
publishing the same title from a second machine lands on the same page.

## Choosing the type

- **doc** for prose: a plan, a summary, notes, a proposal. Written as markdown.
- **diagram** for a process or a flow. Written as a Flux Flow template, which is
  Vue markup rather than markdown.
- **file** for raw bytes: a screenshot, a small photo, a PDF. How large it may be
  is the account's plan speaking, so see below.
- **code** for a single code snippet, highlighted server-side. Needs `--language`
  (a shiki name like `ts` or `python`); the file holds the code.
- **table** for tabular data. The file is CSV or a JSON array; `--format` names
  which, or it is auto-detected. Rendered sortable and filterable.
- **diff** for a single-file unified diff, rendered with a unified/split toggle.
  The file holds exactly what `git diff` or `git show --format=` printed for one
  path, `diff --git` and `index` lines included and no fence around it. A patch
  touching two files is refused, so pass one path at a time.

## Publishing

The script is a black box: run it and read what it prints. There is no need to
open `publish.ts` or its helpers to understand it; everything it checks, refuses
or warns about is described in this skill, references included.

Write the content to a temporary file first, outside the repository unless it
already belongs there, then hand that file to the script; never pass long content
as a shell argument. The examples below use the usual Claude Code skill path; if
this skill lives elsewhere, run the `publish.ts` that sits next to this SKILL.md.

```shell
bun ~/.claude/skills/dropoff/publish.ts \
    --type doc \
    --title "Login flow" \
    --description "How a session is issued, end to end." \
    --tags auth,review \
    --file /path/to/content.md
```

The script prints the URL, whether it replaced an existing page, when it expires
and which tags it carries. A published page leads with the short `/p/<code>` link
and prints the long one after it; report the short link, since that is the one
worth sharing. A file answers on a short link too, but only its long URL spells
out the extension a markdown image needs, so for a file the script prints that
one alone and that is the one to hand back. Either way, reporting the link is the
whole point of the operation.

| Argument | Required | Notes |
| --- | --- | --- |
| `--type` | yes | `doc`, `diagram`, `file`, `code`, `table` or `diff` |
| `--title` | yes | Shown as the page heading and used to derive the slug. At most 200 characters |
| `--file` | yes | Path to the source: markdown, Flow template, code, CSV/JSON, a diff, or the file to upload |
| `--description` | no | One sentence, used for link previews and under the diagram title. At most 300 characters |
| `--tags` | no | Comma separated, on top of the project tag |
| `--no-project-tag` | no | Leave the project out of the tags |
| `--language` | code | A shiki language name for a code snippet, such as `ts` or `python` |
| `--format` | no | A table's source format, `csv` or `json`; auto-detected when left out, and anything else is treated as left out |
| `--folder` | no | File the item under a folder, created on first use. Works for an upload too (Pro) |
| `--path` | no | Publish onto a specific existing page, as its `<code>/<slug>` path or its `/p/<code>` short link |
| `--new` | no | Force a fresh URL even when the title was published before. Ignored alongside `--path`, which names a page outright |
| `--check` | no | Check a diagram's spacing and stop; publishes nothing |
| `--force` | no | Publish a diagram the spacing check objects to. Almost never the right answer: see below |

### Replacing an earlier page

The host keys a page on its title and its type, so publishing the same title
again lands on the same URL and keeps its original date, while a doc and a
diagram of the same name are two pages rather than one. Pick a title specific
enough not to collide with an unrelated page of the same type, and if the output
says `(replaced the existing page)` when you did not mean to replace one, tell
the user and offer `--new`.

- The user gives a URL to update: pass everything after the domain as `--path`.
  For a long URL that is the `<code>/<slug>` path; a short `/p/<code>` link goes
  in as-is, as `p/<code>` or just the code. Either way the code is what lands it
  on the page it names, so the slug beside it need not match.
- The user wants a separate page despite the same title: pass `--new`.

An upload is the exception: it always takes a fresh URL unless `--path` names one
to replace, and a replacement has to carry the same extension, because the
extension is part of the URL.

A doc hands back the markdown it was published from when `.md` is appended to its
long URL, so an earlier page can be read before it is rewritten rather than
republished from memory.

## Tags

Tags are what make something findable again in the host's own admin. The script
adds one for the repository it runs in, so everything published while working on
a project groups together without anyone having to remember to say so. Add your
own with `--tags` for the subject or the kind of work: `auth`, `review`,
`incident`.

That project tag comes from the directory the script runs in, not from where the
source file sits, and the source file usually sits in a temporary folder well
outside the project. So run the script from the project it is about; run from
outside a repository altogether it adds no project tag at all, which is better
than one naming a temporary folder.

Before publishing, the script asks the host which tags already exist and reuses
the spelling it finds, so `auth-flow` and `authflow` do not end up living side by
side. Two or three tags is plenty; past a handful they stop narrowing anything
down, and the host refuses more than ten.

Publishing replaces a page's tags rather than adding to them, so pass `--tags`
again when republishing something that carried tags you want to keep.

## What a plan allows

Every limit below belongs to the account's plan rather than to the script, so the
same command can go through on one account and be refused on another. The script
prints whatever the host answered; relay that instead of retrying.

| Limit | What it means |
| --- | --- |
| Size | A source or an upload over the plan's ceiling is refused. That ceiling is 512 kB on the free and starter plans and 1 MB on pro, and it covers a long markdown doc as much as an image. |
| Live items | A plan may cap how many items exist at once, ten on the free plan. Replacing one is always allowed; a new one past the cap is refused with "upgrade or remove one". |
| Folders | `--folder` needs a plan that carries folders, which is pro. Without one the publish is refused rather than quietly filed at the root. |
| Expiry | A plan may remove a page a set number of days after it was last published, three on the free plan and ninety on starter. Publishing it again starts that clock over. |
| Rate | Thirty publishes and thirty uploads a minute for one account. The script prints when to come back. |

The script prints the expiry when there is one; mention it, because a link that
disappears in three days is a different promise than one that does not. On a plan
that expires pages, a title whose page has already gone gets a fresh URL rather
than the old one back, so a link only truly stays put while the page is live.

## Uploading a file

```shell
bun ~/.claude/skills/dropoff/publish.ts \
    --type file \
    --title "Dashboard sketch" \
    --tags design \
    --file /path/to/sketch.png
```

The extension decides what may be uploaded, and it has to be one of avif, csv,
gif, ico, jpeg, jpg, json, md, pdf, png, svg, txt, webp or zip; anything else is
refused rather than stored under a type nobody can name. How large it may be is
the plan's business, as above. The URL carries the extension, so it can be used
straight in a doc as a normal markdown image:

```markdown
![Dashboard sketch](https://dropoff.sh/p7c2rjs/dashboard-sketch-9wq4mn.png)
```

Upload the image first, then write the doc around the URL it printed.

## Writing a doc

Both page types get a fixed house style, so do not write styling of your own: no
HTML in the markdown, no inline styles, no headings used for visual effect.
Punctuate with hyphens, commas, colons or parentheses, never en or em dashes.

Write the whole document in one language, headings included. Match the language
of the work you are describing rather than defaulting to English, and never mix
the two: English headings over a body in another language is the usual slip. The
work is what decides, not the request: a repository whose code and comments are
English gets an English page even when the ask for it came in another language.

Start the markdown at `##`. The title comes from `--title` and is rendered as the
page heading already, so a leading `#` would give the page two titles. The h2 and
h3 headings become the page's side navigation, so structure a doc with meaningful
ones.

GitHub-flavoured markdown works throughout: tables, task lists (`- [ ]`),
footnotes (`[^1]`), strikethrough. A code fence is highlighted whenever its
language is one shiki knows, which is every language worth naming: go, rust,
kotlin and swift as much as bash, python or typescript. A fence naming something
shiki does not know renders unhighlighted, never as an error, so a made-up
language costs nothing but the colours.

When a doc explains something with moving parts, a process, a flow, an
architecture or a pipeline, a diagram alongside the prose often earns its place.
Publish it first as its own `--type diagram`, then embed it with
`::diagram{path=...}` (see below). Do not force one onto every doc; add it where
a picture saves the reader a paragraph.

A diagram is the only item type a doc embeds. A code, table or diff item is
linked instead, with a `::card` naming its path, and the host fills in its title
and kind. Short code and small tables usually belong in the doc itself as a
fence or a markdown table; publish them separately when they are the thing worth
sharing rather than an aside.

### Components

A doc may also use a small set of components. Rules that make them work: block
components always close with `::`, props are always double-quoted, and an
internal target is a path, not a URL. Derive it from the long URL the script
printed: drop the scheme and domain, keeping the `<code>/<slug>` path
(`k3f9dqm/login-flow-h4p2nx`). The `/p/<code>` short link works just as well,
since the code is what resolves it. On GitHub or in a raw view these degrade to
visible marker lines with the target still readable.

A **card** links to another published item or an external URL. For an internal
target the host fills in the title, description and kind icon at render time,
so write nothing but the path; body text replaces the description. An `icon`
prop (kebab-case Font Awesome Duotone name, same set diagrams use) overrides the
default; an unknown name falls back with a publish warning.

```markdown
::card{to="k3f9dqm/login-flow-h4p2nx"}
::

::card{to="https://flux-ui.dev" icon="paintbrush"}
Optional one-line teaser that replaces the resolved description.
::
```

A **card grid** puts cards side by side where the column allows it. Note the
extra colon on the wrapper:

```markdown
:::cards
::card{to="k3f9dqm/login-flow-h4p2nx"}
::
::card{to="t7b3wqn/checkout-flow-m2xk4p"}
::
:::
```

An **embedded diagram** shows a published diagram inside the doc, in an
interactive frame with a link to the full page. Body text becomes the caption.
Without a `height` the frame takes the reader's own viewport ratio; pass one
(`height="24rem"`) only when a diagram wants less room.

```markdown
::diagram{path="t7b3wqn/checkout-flow-m2xk4p"}
The checkout flow, embedded.
::
```

**Callouts** use GitHub's alert syntax, which GitHub itself also renders:

```markdown
> [!NOTE]
> Docs are cached for five minutes.
```

`NOTE`, `TIP`, `WARNING`, `IMPORTANT` and `CAUTION` are accepted. Note for
context, tip for a shortcut, warning for something that bites.

A **collapsible section** hides detail behind a native disclosure. Put prose,
lists, links or a callout inside, never a code fence or a `::tree`; keep those at
the top level of the doc. This holds for a details group too, since it is made of
these.

```markdown
::details{summary="Why the retry loops"}
Prose, a list, a callout. No code fence or file tree.
::
```

Add `open="true"` for one that starts unfolded, which is worth it when the detail
is the point and the fold is only there to keep the page short.

A **YouTube video** embeds in a frame; a bare id, a watch URL or a share link
all work, and body text becomes the caption:

```markdown
::youtube{id="5UiM7m9tQ80"}
::
```

A **details group** turns several collapsibles into an accordion: one open at
a time, all closed on arrival. Good for FAQs:

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

A **progress bar** states how far something is; `status` is the label, `min` and
`max` default to 0 and 100, colors are the badge colors:

```markdown
::progress{value="60" status="Rollout to production" color="success"}
::
```

A **wide image** breaks out of the text column; the title becomes its caption,
and every image in a doc opens in a lightbox when clicked:

```markdown
![Dashboard sketch](https://dropoff.sh/p7c2rjs/dashboard-sketch-9wq4mn.png "The caption"){.wide}
```

**Steps** dress a plain ordered list as numbered stops on a line, for
instructions and how-tos:

```markdown
::steps
1. Install Bun.
2. Run the script.
::
```

A **facts panel** is a key-value block for metadata at the top of a doc. Every
prop becomes a row and the keys are yours to choose:

```markdown
::facts{status="In review" ticket="IPV3-5924" branch="feature/rich-docs"}
::
```

**Stat tiles** put the numbers of a report in a grid. `hint`, `icon` (the same
Font Awesome Duotone set cards use) and `color` (the badge colors) are all
optional; the color tints the icon, or the value when there is no icon:

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

An **inline badge** is a status chip in running text or a table cell. The text in
`[...]` is the label a reader sees, so make it a real word like `Critical` or
`Blocker`, never the color name. `color` only sets the tint: `gray`, `primary`,
`info`, `success`, `warning`, `danger`:

```markdown
The rollout is :badge[Done]{color="success"}, the docs are :badge[In review]{color="warning"}.
```

A **file tree** renders a plain nested list as a tree. A trailing slash marks a
folder; an entry with children is one already:

```markdown
::tree
- src/
  - worker/
    - index.ts
- package.json
::
```

A **code fence title** names the file above the block, straight after the
language, and gets a copy button either way:

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

A **diff** renders a unified diff the way GitHub does: syntax-highlighted, with
a toggle between unified and split view and a copy button for the raw patch.
`title` names the file above the block. The body is one ```diff fence holding
the patch exactly as `git diff` printed it; the fence is what keeps `---` and
`+++` lines from being read as markdown. One file per block: a multi-file patch
falls back to a plain highlighted fence with a publish warning, so split it
into one `::diff` per file. A bare ```diff fence outside the component stays
what it always was, a simple highlighted snippet, so reach for `::diff` when
the change itself is the story.

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

Publishing a doc never fails over its content, but it may print warnings: a card
target that does not resolve yet, an unknown component (usually a typo like
`::caard`), an unknown icon. Relay them to the user; a target published a moment
later simply starts working.

## Writing a diagram

A diagram is one `<FluxFlow>` element holding positioned nodes and the
connections between them. Publish only the markup: no `<template>` wrapper is
needed, and a `<script>` block is neither needed nor allowed.

```vue
<FluxFlow :padding="24">
    <FluxFlowNode id="start" :x="0" :y="0">
        <FluxFlowTerminal color="info" icon="user" label="Login attempt"/>
    </FluxFlowNode>

    <FluxFlowNode id="check" :x="0" :y="160">
        <FluxFlowConditionCard>Are the credentials valid?</FluxFlowConditionCard>
    </FluxFlowNode>

    <FluxFlowConnection from="start" to="check"/>
</FluxFlow>
```

Everything is static: no state, no data, no event handlers, so a component that
reads a variable will not work. A template carrying one anyway, or a script, or a
`javascript:` URL, is refused outright rather than published with it stripped.

**Read `references/flow-layout.md` before placing anything.** Flow positions
nothing for you, and the numbers that decide whether a diagram reads well are not
guessable: a card is as tall as its text, a connection carrying a label needs
105px of clear space when it runs down the page and 210px when it runs across,
one carrying only an icon 91px, a connector attaches 30px in from an edge, and a
group's frame extends 21px past its nodes plus a 60px title band.

Publishing a diagram checks that spacing and refuses when two connected nodes sit
too close, naming the pairs and the space they need. While drawing,
`--check --file <path>` runs the same check on its own and publishes nothing.

Fix the coordinates rather than reaching for `--force`. The check measures what
Flow will actually draw, so what it objects to is what a reader will see: a badge
lying across two cards, a line with no visible stretch left in it. Every number
it asks for is in the table in `references/flow-layout.md`, and moving a node
down is a one-character edit. `--force` is for the rare diagram whose layout is
deliberate and understood, not for getting past a check that keeps failing.

For which component to reach for and the props it takes, see
`references/flow-components.md`.

### What the host adds

The viewer opens every diagram full screen, centred, on a dotted canvas, and
makes it draggable and zoomable. It applies `interactive`, `background` and
`align` itself, so leave them out unless a diagram needs different values.

Publishing rejects a diagram naming a component the viewer cannot resolve, and an
icon it cannot resolve either: both would render as nothing at all, and Vue drops
its "failed to resolve" warning from a production build, so neither would be
noticed once the page is live. A rejected publish therefore means a typo or a
name that does not exist, not a broken host. The host checks nothing about the
layout; the spacing check runs in `publish.ts`, and everything it does not
measure is yours to get right.
