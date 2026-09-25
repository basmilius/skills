# Brief for every take (template)

<!-- Copy this file to the workspace as BRIEF.md and fill in every <angle-bracket> part from the project.
     Everything outside the brackets was written for a real reel and holds for any project. -->

We are making <count> new hero animations ("takes") for <subject>, shown together on one page like a
motion designer's showreel. The preview uses a neutral headline beside the animation on a <light or dark> ground. Each take has to be good enough to be that one. It
also has to prove a craft: every take names two or three of Disney's twelve principles of animation, and
the motion has to show them unmistakably. Think of it as a CV where each entry is a piece of motion.

## Subject

<For neutral studies, describe the motion ideas instead of a product. Omit product-only details below.>

<One paragraph in plain words: what the product does, for whom, its nouns (the objects people see in it),
its states and their colors, its signature features, its logo and what it looks like. Name only facts you
read in the project: README, docs, the site's copy, the UI code. Every take draws from this paragraph.>

## The contract

A take is one file, `pieces/<id>.js`, that calls `Reel.add({...})`. Read the relevant parts of `harness.js` once.

```js
Reel.add({
    id: 'patch-bay',
    title: 'Patch Bay',
    line: 'One short sentence describing the idea.',
    principles: ['Follow through and overlapping action', 'Secondary action'],
    tech: 'Canvas 2D, Verlet ropes',
    hint: 'Move to pluck the cables',   // shown on hover; start with a verb
    poster: 6.5,                         // a time in seconds that makes the best still frame
    create(env) {
        // set up once; return the instance
        return {
            update(t, dt) {},   // optional: simulation only, no drawing. dt is at most 1/20 s.
            draw(t) {},         // required: draw the whole frame for time t (seconds since start)
            resize() {},        // optional: the canvas changed size (buffers were cleared)
            destroy() {}        // optional
        };
    }
});
```

Principle names, use exactly these strings: `Squash and stretch`, `Anticipation`, `Staging`,
`Straight ahead and pose to pose`, `Follow through and overlapping action`, `Slow in and slow out`,
`Arcs`, `Secondary action`, `Timing`, `Exaggeration`, `Solid drawing`, `Appeal`.

`env` gives you:

- `env.ctx`: the 2D context, already transformed so you draw in a **logical 560 x 500 box** (y down),
  whatever the real size is (a 280px tile or a 700px stage, at 1x or 2x). Never read `canvas.width`
  for layout; use `env.W` and `env.H` (560, 500). `env.scale` is physical pixels per logical unit, for
  when you need crisp 1-device-pixel lines (`lineWidth = 1 / env.scale`).
- `env.clear()`, `env.fadeEdges(inner, outer)`: the canvas is **transparent**; it sits on the
  selected light or dark ground from `theme.js`. Never paint a solid background
  rectangle. Content has to dissolve before it reaches the edges of the box; `fadeEdges` applies an
  elliptical `destination-in` mask to whatever is drawn so far (call it last). A box edge that shows is
  a bug.
- `env.pointer`: `{ x, y }` smoothed logical position, `tx, ty` raw target, `nx, ny` in -1..1,
  `active` 0..1 (eases in while the pointer is over the take, back to 0 after it leaves; when it leaves
  x/y drift back to the center), `inside`, `down`. Every take reacts to the pointer in a way that fits
  its idea, and still looks complete and alive with no pointer at all (most people will never hover).
- `env.quality`: 1 on the big stage, about 0.55 on the small tiles. Scale particle counts with it.
- `env.rand`: a seeded random (same sequence on every instance), `env.R`: helpers (below).
- `env.buffer()`: an offscreen `{ canvas, ctx }` at the take's resolution with the logical transform set.
  For trails and persistence. Composite with `env.ctx.drawImage(buffer.canvas, 0, 0, env.W, env.H)`.
- `env.shader(fragSource)`: returns `{ draw(uniforms, composite) }`. The harness owns one WebGL1
  context shared by all takes; `draw` renders your fragment shader over the whole box and copies it onto
  your 2D canvas (you can draw 2D on top afterwards). The prelude gives you `precision highp float`,
  `u_res` (physical px), `u_time`, `u_scale`, `u_pointer` (vec4: logical x, logical y, active, inside),
  `FC` (fragment coord relative to your box, px, y up) and `vec2 logical()` (560 x 500, y down).
  Output **premultiplied** alpha: `gl_FragColor = vec4(rgb * a, a)`. Uniform values: numbers, arrays
  (flattened for vec arrays), or a canvas for a `sampler2D` (`{ canvas, dirty: true }` re-uploads it
  that frame). Textures are uploaded flipped, so `texture2D(tex, FC / u_res)` is upright. WebGL1 GLSL:
  loops need constant bounds. `OES_standard_derivatives` is enabled (`fwidth`).

`env.R` (also on `Reel.R`): `W H TAU clamp lerp invlerp smoothstep fract mod dist phase(t,start,dur)`,
`ease.*` (linear, in/out/inOut Quad Cubic Quart Quint Sine Expo, inBack/outBack/inOutBack(t, s),
outElastic, outBounce, smoother, `bezier(x1,y1,x2,y2)` returning a function), `rng(seed)`, `hash(n)`,
`noise(x,y,z)` (Perlin, -1..1), `fbm`, `Spring` (`new R.Spring(v, {stiffness, damping, mass})`,
`.target`, `.step(dt)`, `.x`, `.v`), `pal` (colors, below), `rgba(hex, a)`, `mix(hexA, hexB, t, a)`,
`vec3(hex)` (0..1 floats), `fonts.display|sans|mono|hand`, `roundRect(ctx, x, y, w, h, r)` (a path).

## Look

- Theme: <light or dark>, set in `theme.js` before any take loads. `R.pal` and page CSS share this
  palette; `R.theme` gives its name. Use palette colors for text, strokes and fills, and adapt blend
  modes and shader lighting to the chosen ground.

- Ground: <the page color behind the hero>. Palette, from the project's tokens (`R.pal`): <list each token
  with its hex and its role; say which one is the brand accent and that it is used with intent>.
  <Borders: how the project draws them, e.g. white at 7% or 13% alpha.>
- Type: <which family `R.fonts.display`, `sans`, `mono` (and any special face) are, and which weights are
  loaded>. Canvas text uses them directly: `ctx.font = '600 40px ' + R.fonts.display`.
- <What the product's own UI objects look like, measured from its code: radii, paddings, title bars,
  status dots, lines between things. A take that draws the product must look like the product.>
- <Product rules that apply to pictures, e.g. "never highlight the grid in the accent color".>
- Text drawn in takes: <language and spelling>. No em dashes or en dashes. No emoji.
- Restraint: a hero visual supports a headline. Keep the mass of the image in the box, calm edges, one
  clear focal point, a readable silhouette at 280px wide. Premium, precise, quiet confidence; the wow
  comes from motion quality (spacing, arcs, overlap, weight), not from clutter or neon.
- Loops: every take runs forever. Either it is a steady state, or its sequence loops seamlessly (plan the
  cycle; no visible jump at the wrap). A cycle between 8 and 20 seconds is typical.
- Reduced motion: the page shows the take frozen at `poster`, reached through `update` steps and one
  `draw`. Choose a poster time that reads as a finished picture.

## Budget

A frame of your take must stay light: the page runs one big stage plus six to eight tiles at once. Aim
for under 4 ms per frame on the stage at quality 1 in a normal browser (the bench below runs on a
software renderer, so its number is only relative: keep it under ~25 ms at 560px for 2D takes). No
allocation-heavy code in the hot path (reuse arrays, avoid creating gradients per particle). Shader
takes: at most ~64 raymarch steps, keep it simple enough for an integrated GPU at 1400 x 1250.

## Test it

```
node shot.mjs <id> --t 1,4,8,12 --w 360        # a strip of stills at those times -> shots/<id>.png
node shot.mjs <id> --t 5 --w 560 --p 400,200    # one frame with the pointer at logical 400,200
node shot.mjs <id> --t 2 --w 560 --bench         # adds ms per frame
```

Then inspect the PNG with the available image viewer. Errors print to the terminal. Stills cannot show motion, so
think the motion through in code (easing, spacing, overlap), and use a few strips at close times
(e.g. `--t 3.0,3.1,3.2,3.3`) to check a key moment. Do a handful of looks per take, not dozens.

## Rules for the code

- Plain browser JavaScript, no imports, no libraries. Everything inside the `create` closure.
- Deterministic: use `env.rand` / `R.hash` / `R.noise`, never `Math.random`, so the stage and the tile
  of the same take match and a poster is stable.
- `draw(t)` must produce the same frame for the same state; time-based choreography should be a pure
  function of `t` where possible. Simulations advance in `update(t, dt)` only.
- 4-space indent, curly braces always, no one-letter variable names except `i`, `e`, `x`, `y` (loop
  counters `j`, `k` are fine too), comments only for WHY.
- Do not touch `harness.js`, `test.html` or other people's files. If the harness is missing something,
  work around it inside your take and mention it in your report.
