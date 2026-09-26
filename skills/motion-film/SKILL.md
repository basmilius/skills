---
name: motion-film
description: Build product intro, launch, feature and explainer films in code. Plan story variants, draw deterministic Canvas scenes, optionally reuse motion-reel takes, compose Web Audio music, and render 1080p H.264 MP4s. Use for product videos, launch films, demo reels or a "video van een minuut".
---

# Motion film

A product film made in code: every shot is a function of time drawn on a canvas, so it is exact, repeatable
and re-renderable whenever the product changes, with no screen recordings. The subject, the product facts and
the look come from the project you are in. You are the director of photography and the producer: you
propose, brief, build or delegate variants, and deliver the MP4s.

The `motion-*` family covers animation studies and finished films. This skill pairs with **motion-reel**:
takes from a reel can be placed inside a film shot (`v.take(id)`), and a reel's kinetic wordmark makes a
good opening. It works without a reel too.

## Workflow

### 1. Propose variants

Learn the product first (README, docs, the site, the UI code, its tokens and type). Follow the requested
number, duration and concept. If those are open, propose three variants of about 60 seconds in chat, each
with a concept line, a tone, a timed beat sheet naming the feature in every beat, and one honest strength
and weakness. Make them differ in form, not only in content:

- **One continuous camera** over the product's main surface (calm, for a homepage).
- **Rhythm**: an edit locked to a tempo, one idea per bar, a deliberate stop (energetic, for social).
- **A story with stakes**: a clock, a deadline, a person, the product doing the thing only it does
  (memorable, says why it is different).

Use one consistent scenario across variants when a story helps explain the product. Give it concrete
names, dates and questions; label invented demo data and never invent product capabilities. Recommend
one variant or a blend within the requested scope. If the user already chose a concept, proceed with it.
`references/proposals.md` contains proposals from a previous project, for structure only.

### 2. Set up the workspace

```bash
W=<scratchpad>/film
mkdir -p "$W/films" "$W/renders"
cp -R <skill>/assets/. "$W/"
cp <skill>/scripts/* "$W/"
cd "$W"
```

The scripts need Node.js, Playwright with Chromium, and ffmpeg with libx264 and AAC. Reuse existing
installations. If needed, install Playwright in the scratch workspace with `npm install --no-save playwright`
and `npx playwright install chromium`. Set `FFMPEG` to a suitable executable; the scripts also recognize
Python's optional `imageio-ffmpeg` package and system `ffmpeg`.

- `harness.js`: set the project's palette, fonts and `faces` at the `PROJECT TOKENS` and `PROJECT TYPE` markers.
  Choose light or dark to fit the brief, and match the background in `film.html`. This skill is standalone;
  it does not require motion-reel to be installed.
- `fonts.css`: load the same families; local copies when the headless browser cannot reach a font host.
- If a motion reel exists, put its takes in `pieces/` so films can place them.
- Prove the pipeline with a three-second test film: stills, a short clip, a score (`references/lessons.md`).

### 3. Write the briefs

- `FILM-BRIEF.md` from `references/film-brief-template.md`: the contract, the story bible (the same names in
  every variant), the look, captions (silent-first: one short lower third per feature), opening and end card.
- `SCORE-BRIEF.md` from `references/score-brief.md`, unless the request is for a silent film.
- The product facts file the brief points to: states, what features really do, what agents or users may do.

### 4. Build the films

For one variant, build directly or use one director. For several variants, use one background director
per variant with the available CLI's subagents, preserving any model the user requested. Do not open
sessions in another app unless asked. Use `references/agent-prompts.md`: persona, variant, beat sheet,
the weakness to fix, "stills often, render once".
Scoring can be part of the same agent or a separate composer agent after the picture is locked; a composer
never changes the picture.

While they work, keep the person informed: send new contact sheets in batches, and send each MP4 after
its render process has exited successfully. A growing file is not finished. See `references/lessons.md`.
If the person says they will judge the films themselves, relay without reviewing.

### 5. Deliver

Send the final `<id>-music.mp4` files (1080p30 H.264 with AAC), or `<id>.mp4` for silent films.
Summarize each in a few lines: what happens when, the key and tempo if scored, and any unresolved concerns. Keep the sources (films, briefs,
tools) and renders in a scratch directory unless the person asks to keep them in the repo.

## The contract in short

```js
Film.define({
    id: 'launch-day', title: 'Launch Day', duration: 60,
    cuts: [4, 14, 24],                       // optional, marked in the score's loudness picture
    create(v) {                              // v.ctx 1920 x 1080, v.R helpers, v.take(id, { width, options })
        return { draw(t, dt) {} };           // every frame in order; t = frame / 30
    },
    score(kit) {}                            // optional: Web Audio instruments from score.js
});
```

- `node film-render.mjs <id> --stills 2,6,10` makes a contact sheet; `--from 20 --to 26 --scale 0.5` a clip;
  no flags renders the full film to `renders/<id>.mp4`.
- `node film-score.mjs <id>` renders the score to WAV, draws a loudness picture with the cuts, and muxes
  `renders/<id>-music.mp4`.

## What makes a film good

- Every feature is legible without sound: one idea per shot, a caption of a few words, text on screen long
  enough to read (about two seconds a line). Wide shots are for context; a close-up follows before anything
  must be read.
- The product looks exactly like the product: take measures from its own UI code.
- The camera obeys the same principles as a reel: slow in and slow out on every move, match cuts and
  continuous moves over hard cuts, overlap between shots, nothing popping in.
- The score follows the edit: bar lines on cuts, a stop where the film stops, a lift for the ending, a
  resolved chord on the end card that decays before the last frame, peak under 0.95.
- The story bible holds: the same names, dates and questions in every shot and every variant.

`assets/example-films/` holds two finished films from a real run (a rhythm edit and a story with a clock),
scored, as references for structure, shot helpers and scoring. They contain Ruimte-specific copy and UI;
do not treat those as facts about the current product. `night-before.js` also requires a `letterspace` take
from that original project, which is not bundled. Adapt or replace that wordmark before rendering it.
