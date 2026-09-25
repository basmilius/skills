# Choosing and writing specs

## Choosing

Use the requested count. For a product brief, start from the product; for neutral studies, choose distinct motion ideas. List its nouns, states, features and signature moments, and its
logo when relevant. Then give every take one true thing to say about the product, and one technique and tone. For a full reel, aim for:

- **Variety of technique**: roughly four WebGL takes (raymarching, refraction, metaballs, analytic patterns)
  and the rest Canvas 2D, spread over physics (Verlet ropes, boids, particles), geometry (power diagrams,
  tessellations, transit maps), UI choreography (cards, boards, prompts), kinetic type, illustration and
  narrative, and a retro render or two (ASCII, vector scope).
- **Variety of tone**: calm and hypnotic, tactile and mechanical, playful, literal product, abstract.
- **Coverage**: all twelve principles for a full reel; only relevant principles for a small study (see principles.md).
- **An end card**: a resolved final image, or the logo when the brief calls for it.
- **Order like a reel**: open strong, vary the tempo, end on the mark.

Avoid what the person already rejected. If the existing visuals are abstract particle fields, do not propose
more of those under new names. When a roll feels too abstract, the next roll goes closer to real features:
each take shows one real feature or one real moment of using the product.

## Writing a spec

```
## <id>: <Title>
Principles: <two or three>. Tech: <medium, the one technique that carries it>.
Line: <one sentence a visitor would understand, about the product>.
<What is on screen, in the product's own nouns and colors. What happens over the loop, beat by beat, with
the principle made visible at a specific moment. How it loops. What the pointer does.>
```

Put product facts the designers must get right at the top of the specs file (states and colors, what a
feature really does, what an agent may or may not do), because a take that shows a feature wrongly is worse
than no take.

## Example directions

```
## split-flap: Split-Flap
Principles: Timing, Follow through and overlapping action. Tech: Canvas 2D, mechanical flap cascade.
Line: Every session on one board. It flips when an agent needs you.
A departure board: 5 or 6 rows of split-flap characters, columns: agent, task, status, with a small lamp per
row in the status color (the amber lamp pulses). Every ~2 s one row updates: its characters cycle through
the drum to the new text, a cascade from left to right with a slight random stagger. Each flip is
mechanical: the top half of the old character falls (foreshortened, darkening as it turns), the flap lands
with a small bounce and a tiny rattle. Pointer: hovering a row makes that row flip to its next message.

## phosphor: Phosphor
Principles: Arcs, Timing. Tech: Canvas 2D, beam persistence with speed-weighted brightness.
Line: One clean signal draws the mark, the word, and back.
An oscilloscope vector display: one beam traces a path quickly and the phosphor fades. Brightness per
segment is inversely proportional to beam speed, as on a real scope. The sequence morphs between shapes,
all resampled to the same number of points: Lissajous figures, a circle, a five-petal bloom, back to Lissajous. A faint graticule and mono labels. Pointer: acts like the two
frequency knobs while a Lissajous shows.

## needs-you: Needs You
Principles: Staging, Anticipation. Tech: Canvas 2D, attention choreography.
Line: Twelve agents at work. You only look at the one that waits for you.
A zoomed-out canvas with about twelve compact nodes, all quietly working. One turns amber: a small
anticipation pulse, then the staging: the rest dims, the camera eases toward it, and a prompt card grows
out of the node with two or three options. A cursor picks one, the card folds back, the node goes blue,
the canvas returns. Next cycle another node asks.

## ball-test: The Ball Test
Principles: Squash and stretch, Arcs, Timing. Tech: Canvas 2D, onion skinning and spacing charts.
Line: Every animator starts with a bouncing ball. Ours checks in on your agents.
Four node title bars on a staircase. A ball (a status dot scaled up) bounces from node to node on clean
parabolic arcs, stretched in flight, squashed on impact, a crouch before the big jump. Each landing: the
node dips on a spring and takes the ball's color. Show the craft: onion skins and a dotted spacing chart
with a tick per frame, plus a small timing label ("12f").
```
