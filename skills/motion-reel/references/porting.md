# Porting the chosen take into the site

Use this after the person requests integration of a selected take.

1. **Read the existing hero first**: how it sizes its canvas (often larger than its container, offset so
   the glow can spill), its device pixel ratio cap, pointer model, visibility handling (IntersectionObserver,
   `visibilitychange`), reduced-motion handling, and fade-in.
2. **Make a typed module** beside it (for example `hero/<take>.ts`) that exports the box size, the poster
   time and a factory returning `{ update(time, delta, pointer), draw(ctx, time, ...) }`. Keep the take's
   logic as is; translate `env.R` helpers into small local functions, `env.fadeEdges` into a local
   `destination-in` mask, `env.pointer` into the site's pointer (map `nx`, `ny` to its -1..1 values and
   `active`). Rename variables to the repo's conventions (for example no one-letter names) and add the
   non-null assertions the typechecker wants for typed-array and array reads.
3. **Map the box onto the canvas**: compute where the container sits in the canvas's own units and
   `translate` plus `scale` into the 560 x 500 box before calling `draw`. Example: a canvas 150% of its
   container, offset -25% left and -20% top, 800 units wide, container aspect 1.12:
   left = (0.25 / 1.5) * 800, top = (0.2 / 1.12 / 1.5) * 800, width = 800 / 1.5, scale = width / 560.
4. **Fonts**: canvas text cannot read CSS variables; read the family name from the computed style (for
   example `getComputedStyle(el).getPropertyValue('--font-mono-var')` with next/font) and pass it in.
5. **Clock**: start the take at its own t = 0 so it opens on its first beat; in reduced motion draw the
   poster time once.
6. **Clean up what it replaces** if the person says so: pickers, catalogs, other scenes, their state.
7. **Check it in the real site**: run the dev server, screenshot the hero at two moments, then format,
   typecheck and lint the way the repo does before delivery. Commit, push or deploy only within the requested scope.
