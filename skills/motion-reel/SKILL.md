---
name: motion-reel
description: Build a showreel of Canvas and WebGL hero animations with a shared runtime, a neutral hero preview, and a chosen light or dark theme. Use for hero animation concepts, animated illustrations, motion studies, or a set of animation options to compare. Can also port a selected take into an existing site when requested.
---

# Motion reel

Build a page of animation studies, called takes. Each names the animation principles it demonstrates.
Show them beside a neutral headline so the person can compare them and choose one to develop further.

Use the requested number of takes. For an open-ended reel, twenty is a useful default; a small study can
be two. Match the scope of the brief, including whether the subject is a product or abstract motion.
Porting a take into a site is a separate step after the person chooses it and requests integration.

The `motion-*` family also includes **motion-film** for finished product films with a timed edit,
optional music and MP4 delivery. A film can reuse this skill's takes. Each skill works independently.

## 1. Set the subject and theme

For a product brief, read the relevant README, copy, components and design tokens. Collect the product's
nouns, states, signature features and visual conventions. Point designers at existing illustrations when
they need to reproduce the product's objects. For a neutral or random study, choose distinct motion ideas
without inventing a product or turning the current repository into the subject.

Choose **light** or **dark** before building. Follow an explicit preference, otherwise use the intended
site's theme or choose the one that suits the study. Record the choice in the brief and set
`DEFAULT_THEME` in `theme.js`. Its palettes supply both page CSS variables and `R.pal` in the canvas.
`R.theme` reports the selected mode. A `?theme=light` or `?theme=dark` URL overrides it for review.
Keep canvas labels, outlines, shadows and shader colors legible on that ground. Use semantic palette
colors instead of assuming white text or a black background. Glow-heavy reference takes may need their
blend modes and luminance adapted for light mode; a page palette alone cannot do that.

## 2. Set up the workspace

Keep generated reels in a scratch directory unless the person asks to keep them in the repo:

```bash
W=<scratch-directory>/reel
mkdir -p "$W/pieces" "$W/out" "$W/shots"
cp -R <skill>/assets/. "$W/"
cp <skill>/scripts/* "$W/"
cd "$W"
```

The scripts need Node.js, Playwright and its Chromium browser. They try a workspace installation first,
then a global installation. If needed, install them in the scratch workspace with
`npm install --no-save playwright` and `npx playwright install chromium`.

- `theme.js`: select the mode and adapt palette tokens when the brief has a brand. Keep keys used by takes.
- `harness.js`: adapt `fonts` and `faces` only when needed. Match `fonts.css` and the page's font loading.
  For an offline reel, use system font stacks, set `faces` to `[]`, and remove web-font links and imports.
  To retain custom fonts offline, use local files as described in `references/lessons.md`.
- `page.html`: keep the neutral hero with a headline, short paragraph and animation slot. No fake browser,
  product navigation, logo or download buttons. Keep the clapper stripe black in both themes. Change its copy if the study needs it. Recreate a real
  site's hero only when explicitly requested.
- `app.js`: fill `ROLLS` with exactly the chosen take ids and suitable titles. Counts come from the takes.
- Before building new takes, copy one reference into `pieces/` and run
  `node shot.mjs <id> --t 1 --w 360`. Remove this sanity take before building the requested set.

The contract is a logical 560 by 500 box, transparent canvas, simulation in `update(t, dt)`, drawing in
`draw(t)`, and one shared WebGL context. Read `references/brief-template.md` for the API. Change `W`/`H`
and the aspect ratios in both page templates together if another aspect is needed.

## 3. Write the brief and specs

Write `BRIEF.md` from `references/brief-template.md`, including subject, count and theme.
Write `SPECS.md` with one entry per requested take. Read `references/specs.md` for variety and examples.
Each spec gives an id, title, principles, technique, caption, loop and pointer response. Leave designers
room to improve the idea. Cover all twelve principles in a full reel; a small study only needs the
principles that its takes actually demonstrate.

## 4. Build the takes

For a full reel, split related techniques among background designer subagents, for example four agents
with five takes each. For a small study, build directly or use one agent. Use the available CLI's subagents
and `references/agent-prompt.md`; do not open sessions in a separate app unless requested. While designers
work, assemble the page. Keep each agent's output to its assigned files.

## 5. Review

Look at every take in a strip (`node shot.mjs <id> --t 1,4,8,12 --w 300`) and at hero size (`--w 560`).
Both `shot.mjs` and `page-shot.mjs` accept `--theme light|dark`. Check the selected theme; check both if
both are promised. Inspect the PNGs with the available image viewer. Common problems are content too
small in the frame, harsh box edges, unreadable text and a bright or busy moment beside the headline.
Send concrete polish notes to the same designer, leaving good takes alone.

Run `node errors.mjs` against the built page and `node meta.cjs` to check metadata. Coverage is reported;
use `node meta.cjs --full` to require all twelve principles for a full reel. A two-take study should not
claim to cover all twelve.

## 6. Deliver

`node build.mjs` writes `out/hero-reel.html`. Each take has its own script tag so a syntax error in one
cannot prevent the others from registering. Check the page at desktop and mobile widths:

```bash
node page-shot.mjs 1440 page.png --h 1000
node page-shot.mjs 400 mobile.png --full
```

Deliver the HTML and a short description of the takes. Publish online only when requested, through an
available publishing tool. Keep the sources in the scratch directory unless asked to add them to the repo.
For another round, keep earlier takes on the page and continue their numbering if useful.

When asked to integrate the chosen take, read `references/porting.md`.

## What makes a take good

- One clear idea, grounded in the subject when there is one.
- Two or three animation principles visible in the motion: spacing, arcs, anticipation, overlap or weight.
- A readable silhouette at 280px, one focal point and calm edges beside the headline.
- A seamless loop or stable steady state, complete without pointer input.
- A pointer response that fits the idea and a finished still for reduced motion.
- Modest rendering cost: a stage and several tiles can run together.

`references/principles.md` names the twelve principles. `references/lessons.md` records practical traps.
`assets/example-takes/` contains a vector scope, bouncing-ball study, split-flap board and WebGL metaballs
as technique references. Adapt their subject and contrast to the brief.
