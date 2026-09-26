# Film brief (template)

<!-- Copy to the workspace as FILM-BRIEF.md and fill in every <angle-bracket> part. -->

We are making <n> variants of a <duration>-second introduction film for <product>. Each shows <the features that
matter> through one story: <the story subject>. The person choosing will pick one (or parts of one) to put on
<where> and to share. Every variant has to be good enough to be that one.

Read first: the product facts (<file>: get every one right), `harness.js`, `film.js`, and an existing reel
`BRIEF.md` if supplied. Record the complete look, palette, type and theme in this brief either way. Study how the product looks in <paths to the site's
or app's own UI code>, and in any reel takes in `pieces/` that already draw the product faithfully.

## The contract

One file, `films/<id>.js`:

```js
Film.define({
    id: 'launch-day',
    title: 'Launch Day',
    duration: 60,
    create(v) {
        // v.ctx (2D, 1920 x 1080, filled with the ground before each frame), v.W, v.H, v.R (the reel helpers),
        // v.fps (30), v.rand, v.take(id, { width, options }) to place a reel take.
        return {
            draw(t, dt) {} // called for every frame in order, t = frame / 30
        };
    }
});
```

- `v.take(id, { width, options })` returns an off-screen take you advance yourself (`take.tick(dt)`, or
  `take.seek(time)` to jump), steer (`take.point(x, y, active)` in its 560 x 500 box) and place
  (`take.draw(ctx, x, y, w, alpha)`; height is w * 500 / 560). Takes are transparent with soft edges, so they
  sit on the ground. Only tick a take while it is on screen or about to be.
- <The wordmark: which take or drawing opens and closes the film, for example a kinetic-type take from the
  reel placed with `v.take('<id>', { width, options: { word: '<Name>' } })`; pick the stretch you need with seek
  and tick, or copy its code into the film and drive it yourself.>
- You may copy any code from `pieces/` into your film to build full-frame scenes (16:9 compositions look
  better than a take pasted in the middle). Do not edit shared files (harness.js, film.js, film.html,
  film-render.mjs, pieces/, other films).

## The story bible (the same in every variant)

<One fictional but believable project the whole film is about, with its names, pages, dates, the agents or
people in it and what they say, the questions asked, the machines. Every variant uses exactly these names,
so the films can be cut together and nothing contradicts the product. Invent nothing about the product that
the product facts or the site do not say.>

## Look and craft

- 1920 x 1080 at 30 fps, silent (it autoplays muted on the site): every feature is legible without sound.
  A short lower-third caption names each feature as it appears (<project font> around 30 px, text color, one line,
  fades in and out, never more than about seven words). Big title
  cards only at the start and the end.
- Open on the wordmark and end on a card: the wordmark, <the tagline> and <the URL>.
- Cinematography: one idea per shot, a clear focal point, strong slow-in and slow-out on every camera move,
  match cuts and continuous moves over hard cuts where you can, overlap between shots, nothing popping in.
  The same principles as the reel, now across the whole film: timing and staging carry the film.
- UI must look exactly like the product (its components, typography, layout and states), crisp at 1080p. Text people should read stays on screen long enough (about 2 seconds for a line).
- <Ground, accent and status colors from the project's tokens; the accent used with intent.>

## Tools

```
node film-render.mjs <id> --stills 2,6,10,14,...     # contact sheet of frames at those seconds -> renders/<id>-stills.png
node film-render.mjs <id> --from 20 --to 26 --scale 0.5   # a short clip to check motion -> renders/<id>-600-780.mp4
node film-render.mjs <id>                             # the full film, 1080p H.264 -> renders/<id>.mp4
```

Inspect stills with the available image viewer. Rendering uses a software renderer, so a full film takes several minutes;
use stills while you work and render the full film once at the end. Keep a frame cheap (no per-frame
allocation storms; embed only the takes a shot needs).

When done, reply with a short report (under 300 words): the shot list with timings, which features appear,
the render path, and anything you are unsure about.
