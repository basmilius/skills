---
name: dropoff
description: >-
  Publish a doc, a diagram, a code snippet, a table, a diff or a small file from
  the terminal, which answers with an unlisted URL, and read back or update
  anything published before. Use when the user asks to publish, post or put
  something online, including as a clause on the end of other work ("publiceer
  dit plan op dropoff.sh", "zet dit diagram online", "... en publiceer dit",
  "plaats dit online", "and publish it when you are done"); when a dropoff.sh
  link appears in the prompt, which is a page to read before answering ("wat
  staat er in deze pagina", "werk deze review bij"); to upload a small image; to
  show a code change as a rich diff ("publiceer deze diff"); or when a process,
  flow, pipeline or architecture wants a diagram ("maak een diagram van het
  inlogproces", "teken deze pipeline").
license: MIT
---

# Dropoff

`dropoff.ts` takes a file and hands back a link, reads a published page back, and
lists what is already up there. It is the whole interface: run it, read what it
prints, report that. Everything it refuses or warns about it says in words, so
there is no need to open the script or guess at the host.

## Setup

The script runs on [Bun](https://bun.sh), and the skill is installed with
`npx skills add basmilius/skills --skill dropoff`, updated with
`npx skills update dropoff`.

| Variable | Holds |
| --- | --- |
| `DROPOFF_TOKEN` | The bearer token the host issued |
| `DROPOFF_ENDPOINT` | Optional. Another host to publish to, when not `https://dropoff.sh` |

The variable has to reach a non-interactive shell, so on macOS it belongs in
`~/.zshenv` or in the `env` block of `~/.claude/settings.json`, never in a
project's `.claude/settings.json`, which is committed. If the token is missing,
or the account still has to confirm its email address, the script says so and
stops. Report that rather than inventing a value or writing a config file: there
is no config file to write.

## Reading the ask

Publishing is usually the last clause of a longer sentence rather than the whole
of it. "Analyse the auth flow and publish it", "zet dit online" on the end of a
review: the work comes first and the page is what it leaves behind. So do the
work, publish its result, and put the link at the end of the reply. Only a plan
meant to be agreed before it is carried out gets published first, and the user
says so when that is what they want.

A dropoff link in the prompt is the other half of the same thing. It is a page to
read before answering rather than a string to repeat back, and `--read` opens it.
Whoever handed it over left the context there on purpose.

## Choosing a type

- **doc** for prose: a plan, a summary, notes, a proposal. Markdown.
- **diagram** for a process, a flow, a pipeline or an architecture, drawn from
  markup you write. A picture that already exists, an exported SVG or a
  screenshot of one, is a **file** instead.
- **code** for one snippet, highlighted server-side. Needs `--language`, a shiki
  name such as `ts` or `python`.
- **table** for tabular data, rendered sortable and filterable. CSV or a JSON
  array.
- **diff** for one file's unified diff, exactly as `git diff` printed it, the
  `diff --git` and `index` lines included and no fence around it. A patch
  touching two files is refused, so pass one path at a time.
- **file** for raw bytes: a screenshot, a small photo, a PDF. The extension has
  to be one of avif, csv, gif, ico, jpeg, jpg, json, md, pdf, png, svg, txt,
  webp or zip.

## Publishing

Write the content to a temporary file first, outside the repository unless it
already belongs there, and hand that file over; never pass long content as a
shell argument. Run the script from the project the page is about, since that is
where the project tag comes from.

```shell
bun ~/.claude/skills/dropoff/dropoff.ts \
    --type doc \
    --title "Login flow" \
    --description "How a session is issued, end to end." \
    --tags auth,review \
    --file /path/to/content.md
```

That is the usual skill path; if this skill lives elsewhere, run the
`dropoff.ts` that sits next to this file.

| Argument | Required | Notes |
| --- | --- | --- |
| `--type` | yes | `doc`, `diagram`, `file`, `code`, `table` or `diff` |
| `--title` | yes | The page heading, and what the slug comes from. At most 200 characters |
| `--file` | yes | Path to the source |
| `--description` | no | One sentence, for link previews. At most 300 characters |
| `--tags` | no | Comma separated, on top of the project tag |
| `--no-project-tag` | no | Leave the project out of the tags |
| `--language` | code | A shiki language name, such as `ts` or `python` |
| `--format` | no | A table's format, `csv` or `json`; auto-detected when left out |
| `--folder` | no | File the item under a folder, created on first use (Pro) |
| `--path` | no | Publish onto an existing page, named by its link in any shape |
| `--new` | no | Force a fresh URL even when the title was published before |
| `--check` | no | Check a diagram's spacing and stop; publishes nothing |
| `--force` | no | Publish a diagram the spacing check objects to |

The script does two other things, each below: `--read` opens a page that is
already up, and `--list` says what is.

Reporting the link is the point of the operation. Everything lives under
`/p/<code>/<slug>`, and dropping the slug lands on the same page. A page leads
with that short `/p/<code>` link and that is the one to hand back; a file leads
with its full URL instead, because only that one spells out the extension a
markdown image needs. Neither follows from the title, since the code is random,
so take both from the output rather than assembling one.

The lines after it say whether a page was replaced, which tags it carries and,
on a plan that expires pages, when this one goes. No expiry line means it stays.
Mention one when it is there: a link that disappears in three days is a
different promise than one that does not.

How large a source may be, how many items may be live at once, whether folders
are available and how often you may publish all belong to the account's plan
rather than to the script. The host answers what it allows and the script prints
it, so relay that instead of retrying.

### Replacing a page

A page is keyed on its title and its type, so publishing the same title again
lands on the same URL and keeps its original date, while a doc and a diagram of
the same name stay two pages. The title is trimmed before it is matched, so
stray space around it makes no second page. Pick a title specific enough not to
collide, and if the output says `(replaced the existing page)` when you did not
mean to replace anything, say so and offer `--new`.

- The user gives a URL to update: hand it to `--path` whole. The full URL, the
  `/p/<code>` short link and the bare code all name the same page, since only the
  code resolves it and the slug beside it is decoration.
- The user wants a second page under the same title: pass `--new`.
- An upload always takes a fresh URL unless `--path` names one to replace, and
  the replacement has to carry the same extension as the file already there.

`--title` is required either way, and on a replacement it becomes the page's new
title while the URL stays exactly as it was. So a page can end up with a slug
that no longer reads like its title, which is fine.

A replacement rewrites a page rather than patching it, so anything the command
leaves out would be cleared. The script reads the page first and carries across
its tags, its description, a code page's language and a table's format; naming
any of them on the command line still replaces it outright. Two things it cannot
carry across, and both are worth a word to the user before doing them: `--type`
overwrites the page's type, so publishing a code snippet onto a doc's link turns
it into a code page, and the expiry is recomputed from scratch, so republishing
pushes an expiring page further out.

### Tags

Tags are what make something findable again. The script adds one for the
repository it runs in; add two or three of your own with `--tags` for the
subject or the kind of work, such as `auth`, `review` or `incident`. The host
sorts them and drops anything that normalises away, so they come back in a
different order than they went out, which means nothing went wrong.

Replacing a page keeps the tags it had, the project tag included or excluded
exactly as it was, so a republish that names none changes none. `--tags` sets the
whole list instead: what it names, plus the project tag again unless
`--no-project-tag`. That is also the only way to take a tag off a page, since
nothing subtracts one, and `--tags ""` leaves a page with none at all.

That project tag only helps while the page really is about the project you are
standing in. When it is not, a scratch demo or something written for someone
else, pass `--no-project-tag`: a tag naming the wrong project is worse than no
tag at all, since it files the page with work it has nothing to do with.

## Reading a page back

`--read` takes a link in any shape and prints what is behind it on two streams at
once. The source goes to standard output, exactly as it was published; everything
about it goes beside it on standard error, as parenthesised lines naming the
title, the type, the description, the tags, a code page's language and the dates.
Together on a terminal they read as one thing, but redirecting the command writes
the source alone, byte for byte, ready to hand straight back through `--file`.
Nothing needs cutting off the top.

```shell
bun ~/.claude/skills/dropoff/dropoff.ts --read https://dropoff.sh/p/4hydssmk2nq
```

That is the source a republish should start from, so a page gets continued rather
than rewritten from memory.

It reaches every type, a diagram's template and a table's CSV included, and
unwraps what the host stores around them. Only an upload has nothing to hand
back: its bytes are its own URL, and that is what it says instead. A link
belonging to somebody else still opens when it is a doc, since every doc serves
its markdown publicly, and the output says so; anything else of theirs is out of
reach.

`--list` is the other way in, for when the page is known to exist but its link is
not at hand. It prints the account's pages, most recently changed first, and
narrows on `--tags`, `--type`, `--query` and `--limit`. Prefer it over asking the
user to go and find a URL.

## Keeping a page current

A page an agent worked out of should not be left describing a world that has
moved on. Read it, do the work, and publish the result back over it with
`--path`, which keeps the link, its date and everything the command did not
mention, bar the expiry above.

Whether to is a judgement about what the page is for. A plan, a review, a
checklist, a handover, a status page: these are read for what is true now, and
going stale is the one way they fail, so bring them up to date as soon as the
work lands and mention that you did. A record of what happened at a point in
time, an incident write-up or a summary of a session, is worth what it froze, and
rewriting it destroys that. When a page could be read either way, ask. Asked
outright to update something, update it, whichever kind it is.

Report the link again afterwards. It has not changed, but the page has, and the
person you hand it to has no other way of knowing.

## Writing a doc

The page carries its own house style, so write none: no HTML, no inline styles,
no headings used for visual effect. Punctuate with hyphens, commas, colons or
parentheses, never en or em dashes.

Start the markdown at `##`, since `--title` is already rendered as the page
heading, and give the h2 and h3 headings meaning: they become the side
navigation. Write the whole document in one language, headings included, and let
the work decide which rather than the request. A repository whose code and
comments are English gets an English page even when the ask for it came in
another language.

GitHub-flavoured markdown works throughout: tables, task lists, footnotes,
strikethrough, and a code fence highlighted for every language shiki knows. On
top of that a doc may use components: cards, an embedded diagram, callouts,
collapsibles, progress bars, stat tiles, badges, file trees, steps, a facts
panel, tabbed code groups and rich diffs. **Read `references/doc-components.md`
before writing one**; the syntax is unforgiving about closing markers and
quoting.

A diagram is the only item a doc embeds, so publish it first as its own
`--type diagram` and embed the path it printed. Add one where a picture saves
the reader a paragraph, not to every doc. A code, table or diff item is linked
with a card instead; short code and small tables belong in the doc itself.

## Building a diagram

A diagram is one root element holding nodes you place yourself, at pixel
coordinates. Nothing lays it out for you, and a coordinate that leaves two nodes
too close only shows up once the page is live, which is what `--check` is for.

Everything is static: no state, no data, no event handlers, no `<script>` block
and no `<template>` wrapper. A template carrying any of those is refused rather
than published without them.

1. Write the flow out as steps first, in prose. One spine down the page and
   branches sideways: a reader follows a single line far more easily than a
   balanced tree.
2. Read `references/diagram-components.md` and pick a component per step.
3. Read `references/diagram-layout.md` and place the nodes from the top down.
   Each `y` is the previous node's `y` plus that node's height plus the space
   its connection needs. Never a fixed increment: a card is as tall as its text.
4. Line them up. A narrow node under a wide one goes at
   `x + (wide - narrow) / 2`, because both ends attach at their own middle.
5. Wire the connections. Markers off at either end that touches a junction or a
   gate, a short label or an icon on a branch, and that choice held across the
   whole diagram.
6. Run `--check --file <path>`, fix what it names, then publish.

Fix coordinates rather than reaching for `--force`. The check measures what the
viewer will actually draw, so what it objects to is what a reader would see: a
badge lying across two cards, a line with no visible stretch left in it. Every
number it asks for is in `references/diagram-layout.md`, and moving a node down
is a one-character edit.

What it measures is the room between two nodes and the markers where they meet a
junction. Where a connector lands is yours to get right: a junction belongs at
the middle of the node after it, and two nodes line up only when you line them
up. A silent check means nothing is crowded, not that the diagram reads well.

The viewer opens every diagram full screen, centred, on a dotted canvas, and
makes it draggable and zoomable, so leave those props out. It rejects a
component or an icon it cannot resolve, since both would render as nothing at
all and the warning never reaches a live page.
