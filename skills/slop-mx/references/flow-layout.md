# Laying out a Flux Flow diagram

Coordinates are pixels, `x` to the right and `y` down, and they address a node's
top left corner. Nothing moves them for you, so every number here is one you have
to plan rather than discover after rendering.

The measurements below come from reading Flow's own geometry, not from eyeballing
a screenshot. They are the difference between a diagram that reads and one that
looks almost right.

## Every constant in one table

The lookup table for while you are placing coordinates; the sections below carry
the reasoning behind each number.

| Constant | Value |
| --- | --- |
| Card width | 300px |
| Card height | `78 + 24 × lines` (a line ≈ 36 characters); 62px with no body |
| Terminal | `40 + 8 × label characters` wide, 36px tall |
| Pill | `54 + 8 × label characters` wide, 44px tall |
| Note width | 210px |
| Step | 36 × 36px |
| Gate | 60 × 60px |
| Junction | 18 × 18px |
| Connector attachment inset | 31px from the edge, clamped to half the node |
| Two stacked nodes | 60px between them |
| Two stacked nodes, labelled connection | 110px |
| Two columns | 120px, plus ~8px per label character when labelled |
| Above the first node of a group | ~90px from the bottom of the node before it |
| Below the last node of a group | ~60px |
| Between two stacked groups | ~100px |
| Frame to next node, labelled connection leaving a group | ~120px |
| Clear space above and below a junction | ~100px |

## Spacing

Measure the space between two nodes, never the distance between their tops. A
card grows with its text, so a fixed distance between tops quietly eats the room
the connector needs, and the taller the card the less is left.

A card is 300px wide and `78 + 24 × lines` tall, where a line is about 36
characters of body text: 102px for one line, 126px for two, 150px for three. A
card with no body at all is 62px. So the next node goes at
`y + height + spacing`, and these are the spacings:

| Between | Space |
| --- | --- |
| Two stacked nodes | 60px |
| Two stacked nodes, labelled connection | 110px |
| Two columns | 120px |
| Two columns, labelled connection | 120px plus about 8px per character of the label |

The labelled numbers are not padding, they are arithmetic. A connector stops 9px
short of each node, its badge punches a hole the size of itself plus 6px of air
out of the middle of the line, and the dot and the chevron take another 11px.
With a 28px badge that leaves nothing at all below 100px, which is why a label
ends up sitting on both cards at once. Sideways the hole is as wide as the badge,
so a long label pushes two columns apart; keeping labels to a word or two is
usually the better fix.

A worked column, so the arithmetic is concrete. A terminal, a one-line card and a
two-line card stacked at `x = 0` with plain connections:

| Node | Height | y |
| --- | --- | --- |
| `start` (terminal) | 36px | 0 |
| `check` (1 line) | 102px | 0 + 36 + 60 = **96** |
| `save` (2 lines) | 126px | 96 + 102 + 60 = **258** |

Each `y` is the previous node's `y + height + spacing`. A fixed increment (0, 160,
320, ...) only happens to work while every card has the same height.

Keep the happy path in one straight column and branch sideways. A reader follows
a single spine far more easily than a balanced tree.

## Where a connector attaches

A connector does not attach to the corner of a node. With `align="start"` it
attaches 31px in from the edge, but Flow clamps that inset to half the node:

```ts
const clamped = Math.min(inset, extent / 2);   // inset = 31
```

So anything shorter or narrower than 62px attaches at its own middle instead:

| Node | Size | Attaches at |
| --- | --- | --- |
| Card | 103px tall | 31px from the top |
| Terminal | 36px tall | 18px, its middle |
| Junction | 18px | 9px, its middle |

Two nodes therefore do not line up just because they share a coordinate. The
result is a line with a small kink in it, and it is the single most common flaw
in a hand-placed diagram.

On a vertical connection, keep the default `center` alignment and do the lining
up with coordinates instead: both ends attach at their horizontal middle, so a
narrower node above or below a wider one belongs at the wider one's centre, at
`x + (wide - narrow) / 2` rather than at its `x`. The widths come from the table
above. Two cases come up constantly:

- **A junction below a 300px card at `x`** goes at `x + 141`: the card's middle
  less half the junction's 18px.
- **A terminal below that card** goes at `x + 150 - (40 + 8 × label characters) / 2`.
  A five-character label makes the terminal 80px wide, so it goes at `x + 110`.

Sideways the same trick does not work, because a card grows with its text and
its vertical middle moves with it. So **for a terminal beside a card**, give the
card end `align="start"`: the card then attaches 31px down, the terminal at its
own middle, and putting the terminal 13px lower than the card runs the line
straight.

## Connections

By default a connection leaves the bottom and arrives at the top, which is what a
downward flow wants.

- `fromSide` / `toSide`: `top`, `right`, `bottom`, `left`. Set these when a
  branch leaves sideways, otherwise the line loops around the card.
- `fromAlign` / `toAlign`: give both `start` on a connection running sideways
  between two cards. The default anchors each end to the middle of its own card,
  so two cards of different heights get a line that kinks on its way across. On
  a vertical connection, leave both at the default `center` and line up the
  nodes' horizontal middles with their coordinates instead.
- `label`: leave it where it lands. Every badge sits in the middle of its
  connector, so do not reach for `labelPlacement` to nudge one out of trouble. A
  badge wedged against the cards means the two nodes are too close; give them the
  space from the table above and it fixes itself.
- `icon`: a Font Awesome name; without a `label` the icon renders inline on the
  connector. Where a word would say no more than a mark, prefer the icon alone:
  `circle-check` and `circle-xmark` on the two sides of a condition instead of
  "Yes" and "No" badges.
- `color`: use it to separate a failure path from the happy path.

```vue
<FluxFlowConnection from="check" to="rejected" from-side="right" to-side="left" from-align="start" to-align="start" label="No" color="danger"/>
```

Props are kebab-case in markup: `from-side`, not `fromSide`.

## Groups need room you cannot see

A group draws its frame from the nodes it names, not from coordinates of its own:
21px around them, plus a 45px band at the top when it has a title. That frame is
invisible while you count node positions, which is how a group ends up touching
the card above it.

So budget for the frame, not for the nodes:

- Leave about 90px between a node outside the group and the first node inside it,
  measured from the bottom of the one above. Normal spacing puts the frame within
  a few pixels of it.
- Leave about 60px below the last node in the group.
- A labelled connection leaving the group needs enough length that its middle
  clears the frame, since that is where the badge sits. About 120px between the
  frame and the node below it keeps the badge off the dashed border.

Two stacked groups need roughly 100px between them, or their frames nearly touch.

## Junctions

A junction is where paths come back together, so put it at the horizontal middle
of the node that follows it. Then the line leaving it runs straight down instead
of doubling back across the lines it just merged.

Give it about 100px of clear space above and below. A junction wedged between two
nodes is where connectors start overlapping, because several lines are converging
in the space one line normally uses.

Do not route a junction into a marker column. If the flow's trunk runs through
numbered steps on the left and its cards sit to the right, a junction that joins
the two produces a long detour. Pick one spine and keep the junction on it.

## Before you publish

Read your own coordinates back. Every node in a column shares one `x`, and each
row's `y` is the previous `y` plus that card's height plus the spacing. Walk
these five:

1. Does every pair of connected nodes have the space from the table above,
   counted from the bottom of the upper card rather than from its top?
2. Does anything sit within 90px above the first node of a group, or 60px below
   its last?
3. Does a badge on a connection leaving a group have room to sit clear of the
   frame, rather than on top of it?
4. Does a junction sit at the middle of the node after it, and does it have room
   on both sides?
5. Does every connector attach straight: `start` on both card ends of a
   sideways connection, and horizontal middles lined up on a vertical one?

`publish.ts --check --file <path>` does the first of these for you and reports
every pair that is too close, which is faster than counting by hand. It runs on
every diagram published as well, and refuses the publish when something is
crowded.
