# Flux Flow components

Nodes carry content; the content components are what you actually choose between.
Full documentation, including runnable examples, is at
[flux-ui.dev](https://flux-ui.dev) under Flow.

| Component | Use for | Key props |
| --- | --- | --- |
| `FluxFlowNode` | Positions one piece of content | `id`, `x`, `y` |
| `FluxFlowConnection` | Wires two nodes together | `from`, `to`, `label`, `icon`, `marker-start`, `marker-end` |
| `FluxFlowTerminal` | The start and the end of a flow | `label`, `icon`, `color` |
| `FluxFlowTriggerCard` | What sets the flow off | `title`, default slot |
| `FluxFlowActionCard` | A step that does something | `title`, default slot |
| `FluxFlowConditionCard` | A decision that branches | `title`, default slot |
| `FluxFlowCard` | A step that fits none of the above | `title`, `subtitle`, `icon`, `color`, `active` |
| `FluxFlowPill` | A compact labelled step | `label`, `icon`, `color` |
| `FluxFlowStep` | A numbered marker down a trunk | `value` |
| `FluxFlowNote` | An aside explaining a step | `title`, default slot |
| `FluxFlowGroup` | A frame around related nodes | `nodes`, `title`, `color`, `padding` |
| `FluxFlowLane` | A horizontal or vertical band | `title`, `y`, `height`, `x`, `width` |
| `FluxFlowJunction` | A point where paths meet | `color` |
| `FluxFlowGate` | An and / or / xor split | `type` |
| `FluxFlowChain` | Places a run of steps and wires them | `x`, `y`, `gap`, `direction`, `auto-connect` |
| `FluxFlowPort` | A named anchor to connect to | `id`, `side` |

The card body is the default slot, so
`<FluxFlowActionCard>Send the code</FluxFlowActionCard>` is the normal way to
write one. Use `title` when a card needs a heading above its body as well.

`FluxFlowGroup` is decoration: it renders behind every card, takes no pointer,
and nothing connects to it. An id naming a node that does not exist is skipped
without a word.

Props are kebab-case in the markup: `marker-start`, not `markerStart`. The
spacing check only reads them in that form, so a camelCase prop is ignored
without a word and its default assumed, which then reads as a marker that is not
there.

The spacing check sees only `FluxFlowNode` elements with a literal `x` and `y`.
Nodes an auto-layout container places (`FluxFlowGraph`, `FluxFlowChain`) and
`FluxFlowPort` anchors are invisible to it, so a connection naming one is
reported as a missing node. Position the nodes yourself in a published diagram.

The viewer supplies the zoom, fit and fullscreen controls, the minimap and any
overlay panels itself, so `FluxFlowControls`, `FluxFlowMinimap` and
`FluxFlowPanel` do not belong in a template; adding one doubles what the viewer
already draws.

## The root

`FluxFlow` holds the shared coordinate space.

| Prop | Notes |
| --- | --- |
| `padding` | Space kept around the content |
| `background` | `dots`, `grid` or `none` |
| `interactive` | Fills its container as a pannable, zoomable viewport |
| `align` | `start` or `center`: where an interactive viewport opens horizontally |
| `start` | Id of a node to centre the viewport on, both axes, at 100% zoom |
| `viewport` | Use with `v-model:viewport` for a controlled viewport |

`start` centres on both axes, so pointing it at the first node of a downward flow
leaves half a screen of air above it. To open at the top, use `align` instead.

## Colours and icons

Colours are the Flux palette: `primary`, `info`, `success`, `warning`, `danger`.
Use `success` for a completed end, `danger` for a failure path, and leave the
rest untinted so the tinted ones mean something.

Icons are Font Awesome names such as `user`, `bolt`, `lock`, `envelope`,
`database`, `clock`, `arrow-right`. The viewer resolves the entire Font Awesome
Pro set, so any Pro name works and there is no registration step. For check,
xmark, plus and minus, always use the circle variants: `circle-check`,
`circle-xmark`, `circle-plus` and `circle-minus`, never the bare glyphs.
