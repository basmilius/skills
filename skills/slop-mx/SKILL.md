---
name: slop-mx
description: >-
  Publish a document or a diagram from the terminal to a publishing host (unlisted
  URL), drawing diagrams with Flux Flow. Use when the user asks to publish, post
  or put something online ("publiceer dit plan op slop.mx", "zet dit
  diagram online"), to update something published earlier, or wants a diagram of
  a process, flow, pipeline or architecture ("maak een diagram van het
  inlogproces", "teken deze pipeline"). Two page kinds: a doc (markdown) and a
  diagram (a Flux Flow template with explicit coordinates).
license: MIT
---

# Publishing to a host

A page is published with one request and gets an unlisted URL: public to anyone
holding the link, but with a random suffix, no index, and `noindex` on the page.
A URL looks like `/2026/07/login-flow-k3f9dq`, dated by the month it was first
published, and replacing a page later keeps that date so its link never moves.

## Setup

Two environment variables, and nothing else:

| Variable | Holds |
| --- | --- |
| `SLOP_MX_ENDPOINT` | The host to publish to, e.g. `https://slop.mx` |
| `SLOP_MX_TOKEN` | The bearer token the host expects |

If either is missing the script says which one and stops. Report that rather than
inventing a value or writing a config file: there is no config file to write.

Set them wherever the agent's shell picks them up, which for Claude Code means a
shell profile or the `env` block in `~/.claude/settings.json`. Keep the token out
of a project's `.claude/settings.json`, since that one is committed.

The one thing kept on disk is state, not configuration: which title was published
where, in `$XDG_STATE_HOME/slop-mx/published.json`, falling back to
`~/.local/state/slop-mx/published.json`.

## Choosing the type

- **doc** for prose: a plan, a summary, notes, a proposal. Written as markdown.
- **diagram** for a process or a flow. Written as a Flux Flow template, which is
  Vue markup rather than markdown.

## Publishing

Write the content to a file first, then hand that file to the script. Never pass
long content as a shell argument.

```shell
bun ~/.claude/skills/slop-mx/publish.ts \
    --type doc \
    --title "Login flow" \
    --description "How a session is issued, end to end." \
    --file /path/to/content.md
```

The script prints the URL and whether it replaced an existing page. Report that
URL back to the user; it is the whole point of the operation.

| Argument | Required | Notes |
| --- | --- | --- |
| `--type` | yes | `doc` or `diagram` |
| `--title` | yes | Shown as the page heading and used to derive the slug |
| `--file` | yes | Path to the markdown or the Flow template |
| `--description` | no | One sentence, used for link previews and under the diagram title |
| `--path` | no | Publish onto a specific existing page, as `2026/07/some-slug` |
| `--new` | no | Force a fresh URL even when the title was published before |
| `--check` | no | Check a diagram's spacing and stop; publishes nothing |
| `--force` | no | Publish a diagram the spacing check objects to |

### Replacing an earlier page

The script remembers what it published in its state file, keyed by title, so
publishing the same title again lands on the same URL.

- The user gives a URL to update: pass everything after the domain as `--path`.
- The user wants a separate page despite the same title: pass `--new`.

## Writing a doc

Both types get a fixed house style, so do not write styling of your own: no HTML
in the markdown, no inline styles, no headings used for visual effect.

Start the markdown at `##`. The title comes from `--title` and is rendered as the
page heading already, so a leading `#` would give the page two titles.

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
reads a variable will not work.

**Read `references/flow-layout.md` before placing anything.** Flow positions
nothing for you, and the numbers that decide whether a diagram reads well are not
guessable: a card is as tall as its text, a connection carrying a label needs
110px of clear space and one carrying only an icon 100px or its badge lands on
both cards, a connector attaches 31px in from an edge, and a group's frame extends
21px past its nodes plus a 45px title band.

Publishing a diagram checks that spacing and refuses when two connected nodes sit
too close, naming the pairs and the space they need. Fix the coordinates rather
than reaching for `--force`. While drawing, `--check --file <path>` runs the same
check on its own and publishes nothing.

For which component to reach for and the props it takes, see
`references/flow-components.md`.

### What the host adds

The viewer opens every diagram full screen, centred, on a dotted canvas, and
makes it draggable and zoomable. It applies `interactive`, `background` and
`align` itself, so leave them out unless a diagram needs different values.

Publishing rejects a diagram naming a component the viewer cannot resolve. Vue
drops its "failed to resolve component" warning from a production build, so a
rejected publish means a typo or a component that does not exist, not a broken
host. The host itself checks nothing about the layout; the spacing check runs in
`publish.ts`, and everything it does not measure is yours to get right.
