# Laying out a Flux Flow diagram

Coordinates are pixels, `x` to the right and `y` down, and they address a node's
top left corner. Nothing moves them for you, so every number here is one you have
to plan rather than discover after rendering.

The measurements below come from reading Flow's own geometry, not from eyeballing
a screenshot. They are the difference between a diagram that reads and one that
looks almost right.

## Spacing

- A card is about 300px wide and 100 to 155px tall, depending on its text.
- Put roughly 160px between the tops of two stacked nodes, more when the upper
  one carries two lines of body text.
- Put roughly 300px between the left edges of two columns, and at least 420px
  when a labelled connection runs between them. At 320px the label sits wedged
  against both cards and the connector all but disappears behind it.
- Keep the happy path in one straight column and branch sideways. A reader
  follows a single spine far more easily than a balanced tree.

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
  badge in an awkward spot means the two nodes are too close, and moving the
  nodes fixes it for good.
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

Nothing checks the geometry, so read your own coordinates back. Every node in a
column shares one `x`, and each row's `y` is the previous `y` plus the spacing
above. Crowding never announces itself, so walk these four:

1. Does anything sit within 90px above the first node of a group, or 60px below
   its last?
2. Does a badge on a connection leaving a group have room to sit clear of the
   frame, rather than on top of it?
3. Does a junction sit at the middle of the node after it, and does it have room
   on both sides?
4. Does every connector between nodes of different heights account for the
   attachment inset, or will it arrive at a slight angle?
