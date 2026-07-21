# Laying out a Flux Flow diagram

Coordinates are pixels, `x` to the right and `y` down, and they address a node's
top left corner. Nothing moves them for you, so every number here is one you have
to plan rather than discover after rendering.

The measurements below come from reading Flow's own geometry, not from eyeballing
a screenshot. They are the difference between a diagram that reads and one that
looks almost right.

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

Two pairings come up constantly, both with a fixed correction:

- **A terminal beside a card.** The card attaches 31px down, the terminal at its
  middle. Put the terminal 13px lower than the card and the line runs straight.
- **A junction below a card.** Both attach at their horizontal middle. With a
  300px card at `x`, the junction belongs at `x + 141`: the card's middle less
  half the junction's 18px.

For a terminal hanging below a card, give both ends `from-align="start"` and
`to-align="start"` and put the terminal at the card's `x`. Both then attach 31px
in from the left and the line is straight whatever width the label turns out to
be, which beats guessing at the terminal's width.

## Connections

By default a connection leaves the bottom and arrives at the top, which is what a
downward flow wants.

- `fromSide` / `toSide`: `top`, `right`, `bottom`, `left`. Set these when a
  branch leaves sideways, otherwise the line loops around the card.
- `fromAlign` / `toAlign`: give both `start` on a connection running sideways
  between two cards. The default anchors each end to the middle of its own card,
  so two cards of different heights get a line that kinks on its way across.
- `label`: leave it where it lands. Every badge sits in the middle of its
  connector, so do not reach for `labelPlacement` to nudge one out of trouble. A
  badge wedged against the cards means the two nodes are too close; give them the
  space from the table above and it fixes itself.
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
5. Does every connector between nodes of different heights account for the
   attachment inset, or will it arrive at a slight angle?

`publish.ts --check --file <path>` does the first of these for you and reports
every pair that is too close, which is faster than counting by hand. It runs on
every diagram published as well, and refuses the publish when something is
crowded.
