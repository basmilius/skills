# Lessons from earlier reels

- **Fonts in headless Chromium**: the page may fail to reach Google Fonts through a proxy
  (`ERR_CERT_AUTHORITY_INVALID`, `ERR_TOO_MANY_RETRIES`). Launch Playwright with `ignoreHTTPSErrors: true`;
  if it still fails, fetch the CSS with curl (send a modern browser User-Agent so it returns woff2), download
  every `url(...)` into `fonts/`, rewrite the URLs, and save it as `fonts.css`. Otherwise every still shows
  fallback fonts and misleads the review.
- **Canvas waits for fonts**: `document.fonts.load()` every face in `R.faces` before the first frame, and
  let takes that cache glyphs (atlases, measured widths) rebuild once fonts arrive.
- **WebGL in headless**: use `--use-angle=swiftshader --enable-unsafe-swiftshader`. It works but is slow;
  the in-page bench of a shader take measures almost nothing because the GPU work is deferred, so compare
  shader takes with each other only.
- **One WebGL context**: browsers cap live contexts (about 16). The harness renders every shader take in one
  shared context and copies the result onto the take's 2D canvas; keep it that way.
- **CSS `color-mix(..., transparent)` inside a gradient** rendered as a huge bright blob in headless
  Chromium, and a `background` shorthand resets `background-clip`, so a translucent border picks up the
  gradient. Use explicit `rgb(r g b / a)` stops and set `background-clip: padding-box` after the shorthand.
- **Box edges**: the elliptical `fadeEdges` can cut the corners of wide compositions (a 3 x 2 grid of cards);
  such takes need their own soft rectangular mask.
- **Scale**: the most common review note is "too small in the frame". A hero box is seen at about 500px;
  aim for the composition to fill 70 to 85% of the width.
- **Brightness**: a full-bright moment next to a headline shouts. Cap large light areas at about 70% on a dark ground; on a light ground, judge contrast and saturation instead.
- **Seeking**: a still at time t is reached by running `update` in 1/60 s steps and drawing once. A take
  that keeps its picture in a persistence buffer will be empty at the poster; compute persistence from t
  instead, or draw during seek.
- **Metadata**: principle names must match the list exactly; check with `node meta.cjs`, which also flags
  em and en dashes.
- **Killing processes**: `pkill -f <pattern>` can match your own shell command and kill it; find PIDs with
  `ps` and `kill` those.
- **Page at rest**: the artifact must look complete on its first frame (the stage draws immediately,
  tiles draw when they scroll in, reduced motion shows posters).
