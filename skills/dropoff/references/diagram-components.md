# Diagram components

A diagram is one `<FluxFlow>` element holding positioned nodes and the
connections between them. Publish that markup on its own: no `<template>`
wrapper, and a `<script>` block is neither needed nor allowed.

```vue
<FluxFlow :padding="24">
    <FluxFlowNode id="start" :x="67.5" :y="0">
        <FluxFlowTerminal color="info" icon="user" label="Login attempt"/>
    </FluxFlowNode>

    <FluxFlowNode id="check" :x="0" :y="96">
        <FluxFlowConditionCard>Are the credentials valid?</FluxFlowConditionCard>
    </FluxFlowNode>

    <FluxFlowConnection from="start" to="check"/>
</FluxFlow>
```

Both coordinates are worked out rather than picked: the card is 300px wide and
the terminal 165px, so it sits at `(300 - 165) / 2`, and the card starts 96px
down, the terminal's 36px plus the 60px a plain connection needs. See
`diagram-layout.md` for both sums.

A coordinate is a number, so bind it: `:x="120"`, never `x="120"`. An unbound
one arrives as a string and every sum it takes part in turns into
concatenation, which moves the node off the canvas entirely. The spacing check
reads both forms, so this is one it cannot catch for you.

## Nodes and content

A prop in **bold** is one the component will not do without.

| Component | Use for | Key props |
| --- | --- | --- |
| `FluxFlowNode` | Positions one piece of content | **`id`**, `x`, `y` |
| `FluxFlowConnection` | Wires two nodes together | **`from`**, **`to`**, `label`, `icon`, `marker-start`, `marker-end` |
| `FluxFlowTerminal` | The start and the end of a flow | **`label`**, `icon`, `color` |
| `FluxFlowTriggerCard` | What sets the flow off | `title`, default slot |
| `FluxFlowActionCard` | A step that does something | `title`, default slot |
| `FluxFlowConditionCard` | A decision that branches | `title`, default slot |
| `FluxFlowCard` | A step that fits none of the above | `title`, `subtitle`, `icon`, `color`, `active` |
| `FluxFlowPill` | A compact labelled step | **`label`**, **`icon`**, `color` |
| `FluxFlowStep` | A numbered marker down a trunk | `value` |
| `FluxFlowNote` | An aside explaining a step | `title`, default slot |
| `FluxFlowGroup` | A frame around related nodes | **`nodes`**, `title`, `color`, `padding` |
| `FluxFlowLane` | A horizontal or vertical band | `title`, `y`, `height`, `x`, `width` |
| `FluxFlowJunction` | A point where paths meet | `color` |
| `FluxFlowGate` | An and / or / xor split | **`type`** |
| `FluxFlowPort` | A named anchor to connect to | **`id`**, `side` |

The card body is the default slot, so
`<FluxFlowActionCard>Send the code</FluxFlowActionCard>` is the normal way to
write one. Use `title` when a card needs a heading above its body as well.

`FluxFlowGroup` is decoration: it renders behind every card, takes no pointer,
and nothing connects to it. Its `nodes` is an array of node ids and has to be
bound as one, `:nodes="['check', 'save']"`; an id naming a node that does not
exist is skipped without a word, so a group drawn around the wrong nodes is a
typo in that list.

Props are kebab-case in markup: `marker-start`, not `markerStart`. The spacing
check only reads them in that form, so a camelCase prop is ignored without a
word and its default assumed, which then reads as a marker that is not there.

The spacing check sees only `FluxFlowNode` elements with a literal `x` and `y`.
Nodes an auto-layout container places (`FluxFlowGraph`, `FluxFlowChain`) and
`FluxFlowPort` anchors are invisible to it, so a connection naming one is
reported as a missing node. Position the nodes yourself.

The viewer supplies the zoom, fit and fullscreen controls, the minimap and any
overlay panels itself, so `FluxFlowControls`, `FluxFlowMinimap` and
`FluxFlowPanel` do not belong in a template. It leaves a set of your own alone
rather than drawing a second one beside it, but then they sit wherever you put
them instead of where every other diagram keeps them.

## The root

`FluxFlow` holds the shared coordinate space. The viewer applies `interactive`,
`background` and `align` itself, so leave those out unless a diagram needs
different values.

| Prop | Notes |
| --- | --- |
| `padding` | Space kept around the content |
| `background` | `dots`, `grid` or `none` |
| `interactive` | Fills its container as a pannable, zoomable viewport |
| `align` | `start` or `center`: where an interactive viewport opens horizontally |
| `axis` | `vertical` or `horizontal`: the axis every connection leaves and enters on, unless it names a side itself |
| `start` | Id of a node to centre the viewport on, both axes, at 100% zoom |

`start` centres on both axes, so pointing it at the first node of a downward
flow leaves half a screen of air above it. To open at the top, use `align`.

## Colours and icons

Colours are `primary`, `info`, `success`, `warning` and `danger`. Use `success`
for a completed end and `danger` for a failure path, and leave the rest untinted
so the tinted ones mean something.

Icons are Font Awesome duotone names such as `user`, `bolt`, `lock`, `envelope`,
`database`, `clock` or `arrow-right`. Publishing checks every one against the
set the host ships and refuses a diagram naming one that is not in it, since an
icon that cannot be resolved renders as nothing at all. So reach for a name you
have seen rather than one that sounds right, and if a publish comes back naming
it, pick the nearest name that exists. For check, xmark, plus and minus, always
use the circle variants: `circle-check`, `circle-xmark`, `circle-plus` and
`circle-minus`, never the bare glyphs.
