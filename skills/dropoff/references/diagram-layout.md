# Laying out a diagram

Coordinates are pixels, `x` to the right and `y` down, and they address a node's
top left corner. Nothing moves them for you, so every number here is one to plan
rather than discover after rendering. A fraction is allowed where the arithmetic
lands on one, so a node whose width is odd can still sit dead centre under a
card at `:x="75.5"`.

The measurements come from reading the renderer's own geometry, not from
eyeballing a screenshot. They are the difference between a diagram that reads
and one that looks almost right.

## Sizes

| Node | Size |
| --- | --- |
| Card | 300px wide, `76 + 24 × lines` tall (a line ≈ 36 characters); 62px with no body |
| Terminal | `40 + 8 × label characters` wide, 21px more with an icon, 36px tall |
| Pill | `54 + 8 × label characters` wide, 44px tall |
| Note | 210px wide, `50 + 21 × lines` tall (a line ≈ 26 characters) |
| Step | 36 × 36px |
| Gate | 60 × 60px |
| Junction | 18 × 18px |

Card heights lean low on purpose, so a diagram that clears them clears the real
thing too: 100px for one line of body text, 124px for two, 148px for three.

## Space between two nodes

Measure the space between two nodes, never the distance between their tops. A
card grows with its text, so a fixed distance between tops quietly eats the room
the connector needs, and the taller the card the less is left. The next node
goes at `y + height + spacing`.

Edge to edge, on both axes. Sideways it is the right edge of one node to the left
edge of the next, `x + width + spacing`, not a distance between their lefts and
not a column you measure from. A terminal is as wide as its label, so a column of
them lines up on nothing at all.

| Between | Space |
| --- | --- |
| Two stacked nodes | 60px |
| Two stacked nodes, connection carrying an icon | 91px |
| Two stacked nodes, labelled connection | 105px |
| Two columns | 60px |
| Two columns, connection carrying an icon | 91px |
| Two columns, labelled connection | 210px, and more once the label is long |
| Node above a titled group, to the first node inside it | 90px |
| Into a titled group, connection carrying an icon | 194px |
| Into a titled group, labelled connection | 202px |
| Last node in a group, to the node below it | ~60px |
| Two stacked groups | ~100px |
| Above and below a junction | ~100px |

These are arithmetic rather than padding. A connector stops 9px short of each
node, its badge punches a hole the size of itself plus 6px of air out of the
middle of the line, and the dot and the chevron take another 11px, which leaves
nothing at all below 100px. That is why a label ends up sitting on both cards at
once. Sideways a badge is as wide as its text, so 210px is a floor rather than
an answer, and keeping a label to a word or two is usually the better fix. An
icon rides the connector as a bare 20px badge instead of a 28px pill, which is
why it needs only 91px on either axis.

A worked column, so the arithmetic is concrete. A terminal, a one-line card and
a two-line card stacked at `x = 0` with plain connections:

| Node | Height | y |
| --- | --- | --- |
| `start` (terminal) | 36px | 0 |
| `check` (1 line) | 100px | 0 + 36 + 60 = **96** |
| `save` (2 lines) | 124px | 96 + 100 + 60 = **256** |

A fixed increment (0, 160, 320, ...) only happens to work while every card has
the same height.

A branch off that column works the same way, one axis at a time. Hanging a
`delivered` terminal off the right of `check`, on a connection labelled `yes`:

| | Arithmetic |
| --- | --- |
| `x` | `check` sits at 0 and is 300 wide, and a labelled sideways connection wants 210, so `0 + 300 + 210 = `**510** |
| `y` | the card end takes `from-align="start"`, so the terminal goes 12px below the card: `96 + 12 = `**108** |

The `y` is the sideways rule below rather than a centring sum, because a card's
vertical middle moves as its text grows and the terminal's does not.

Keep the happy path in one straight column and branch sideways. A reader follows
a single spine far more easily than a balanced tree.

## Where a connector attaches

A connector does not attach to the corner of a node. With `align="start"` it
attaches 30px in from the edge, clamped to half the node:

```ts
const clamped = Math.min(inset, extent / 2);   // inset = 30
```

So anything shorter or narrower than 60px attaches at its own middle instead: a
100px card 30px from its top, a 36px terminal at 18px, an 18px junction at 9px.
Two nodes therefore do not line up just because they share a coordinate, and a
line with a small kink in it is the most common flaw in a hand-placed diagram.

On a vertical connection keep the default `center` alignment and do the lining
up with coordinates: both ends attach at their horizontal middle, so a narrower
node above or below a wider one belongs at the wider one's centre,
`x + (wide - narrow) / 2`. Two cases come up constantly:

- **A junction below a 300px card at `x`** goes at `x + 141`: the card's middle
  less half the junction's 18px.
- **A terminal below that card** goes at
  `x + 150 - (40 + 8 × label characters) / 2`, counting another 21px of width
  when it carries an icon. A five-character label makes a plain terminal 80px
  wide, so it goes at `x + 110`.

Sideways the same trick does not work, because a card grows with its text and
its vertical middle moves with it. So **for a terminal beside a card**, give the
card end `align="start"`: the card then attaches 30px down, the terminal at its
own middle, and putting the terminal 12px lower than the card runs the line
straight.

## Connections

A connection leaves the bottom and arrives at the top by default, which is what
a downward flow wants. Props are kebab-case in markup: `from-side`, not
`fromSide`.

- `fromSide` / `toSide`: `top`, `right`, `bottom`, `left`. Set these when a
  branch leaves sideways, otherwise the line loops around the card.
- `fromAlign` / `toAlign`: give both `start` on a connection running sideways
  between two cards, or two cards of different heights get a line that kinks on
  its way across. On a vertical connection leave both at the default `center`
  and line the nodes' horizontal middles up instead.
- `label`: leave it where it lands. Every badge sits in the middle of its
  connector, so do not reach for `labelPlacement` to nudge one out of trouble. A
  badge wedged against the cards means the two nodes are too close; give them
  the space from the table above and it fixes itself.
- `icon`: a Font Awesome name, rendered inline on the connector when there is no
  label. An icon is enough when the node it leaves already asks the question, so
  a card reading "Are the credentials valid?" can branch into `circle-check` and
  `circle-xmark`. A word earns its badge when the branch carries something a
  mark cannot: a third outcome, a retry, a reason such as "expired" or "over
  quota", or a condition whose wording leaves which side is which open. Decide
  it once for the branches of a diagram, so two arms of one question never come
  out as a mark and a word.
- `markerStart` / `markerEnd`: what the line ends in, a dot and a chevron by
  default. Give the end `none` whenever it meets a junction or a gate: those
  shapes already are the point where the paths come together, and on an 18px
  junction the marker lands on top of it. The other end keeps its marker.
- `color`: use it to separate a failure path from the happy path.

A connection whose `from` and `to` name the same node draws a loop beside that
node, which is how a retry says it retries without a second card. It needs no
space between two nodes, so the check leaves it alone; give the node itself room
on the side the loop swings out to.

Going back up the page works the same way without naming one node twice. A step
that hands the flow to an earlier one leaves and arrives on the same side, so
the line swings out past that side rather than running between the two nodes.
Give both ends that same side and let the connection running down the page own
the spacing; the check skips this one for the reason it skips a self-loop.

```vue
<FluxFlowConnection from="attempts" to="attempt" from-side="left" to-side="left" label="No" color="warning"/>
```

```vue
<FluxFlowConnection from="check" to="rejected" from-side="right" to-side="left" from-align="start" to-align="start" label="No" color="danger"/>
```

## Groups need room you cannot see

A group draws its frame from the nodes it names, not from coordinates of its
own: 21px around them, plus a 60px band at the top when it has a title. That
frame is invisible while you count node positions, which is how a group ends up
touching the card above it, so budget for the frame rather than for the nodes.
The spacing table has the numbers.

Coming in from above is where it bites, because the badge sits halfway along the
connector and the frame starts 81px above the first node inside. The two nodes
therefore need twice that clearance: 202px for a label, 194px for an icon, and
90px for a plain connection, which only has to keep the node itself off the
frame. An untitled group asks for none of it, since 21px of padding is less than
a labelled connector already needs. Leaving a group is the same story and works
out lower again, so the ordinary spacing covers it.

## Junctions

A junction is where paths come back together, so put it at the horizontal middle
of the node that follows it. Then the line leaving it runs straight down instead
of doubling back across the lines it just merged. Give it about 100px of clear
space above and below, or connectors start overlapping where several lines
converge in the room one line normally uses.

Do not route a junction into a marker column. If the trunk runs through numbered
steps on the left and the cards sit to the right, a junction joining the two
produces a long detour. Pick one spine and keep the junction on it.

Every line touching a junction ends bare: one arriving carries
`marker-end="none"`, one leaving `marker-start="none"`, and one running from a
junction to another junction carries both. Three connectors converging with
their default dots and chevrons intact bury an 18px shape under its own
arrowheads. A gate is the same shape of thing and takes the same treatment, even
though it is 60px and hides it better.

```vue
<FluxFlowConnection from="check" to="merge" marker-end="none"/>
<FluxFlowConnection from="retry" to="merge" marker-end="none"/>
<FluxFlowConnection from="merge" to="save" marker-start="none"/>
```

## Read your coordinates back

1. Does every pair of connected nodes have the space from the table above,
   counted from the bottom of the upper node rather than from its top?
2. Does a connection coming down into a titled group have the length its badge
   needs to clear the frame?
3. Does a junction sit at the middle of the node after it, with room on both
   sides?
4. Does every connector attach straight: `start` on both card ends of a sideways
   connection, and horizontal middles lined up on a vertical one?
5. Does every end touching a junction or a gate carry `marker-start="none"` or
   `marker-end="none"`, whichever end that is?

`dropoff.ts --check --file <path>` does the first two and the last for you and
names every connector it objects to, which is faster than counting by hand. It
runs on every diagram published as well, and refuses the publish when something
is crowded or a marker is left on. The two it cannot do are the ones about where
a connector lands rather than how much room it has: nothing measures whether a
junction sits at the middle of what follows it, or whether two nodes line up, so
read those back yourself.
