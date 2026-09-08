---
name: html-report
description: >-
  Create or update standalone HTML reports with a calm editorial layout and a
  project-appropriate accent color. Use for reviews, findings, status reports,
  measurement reports and action plans, or when asked to reuse this report style.
  Not for application screens or reports that require another file format.
---

# HTML report

Build a readable report with a softly tinted page, system fonts, a large title,
rounded sections and restrained color. Start from [assets/report.html](assets/report.html).
It contains the complete inline CSS and a small report skeleton. Keep the visual
system while adapting the content, language and section order to the request.

## Pick a project color quickly

Use an explicit user color first. Otherwise inspect a few likely sources: an
existing project report, the logo or README, and the app's theme or brand tokens.
Prefer the actual product identity over a token merely named `accent`; scene
materials, syntax highlighting and object colors are not brand palettes.

If there is no clear brand, choose one muted accent that fits the project. Green
suits a home or environment project; blue can suit a technical service. These are
examples, not domain rules. Make the choice without a color research phase or a
mandatory question. A sentence in the handoff is enough to explain it.

Set `--accent` in the template to a dark, readable version of that color. The page,
panels, text, borders, diagram strokes and focus ring derive from it. The green
starter uses `#236746`; `#285e91` is a blue alternative. Keep success, warning and
error tokens independent so project color never changes their meaning. Check text
contrast after changing colors; aim for 4.5:1 for ordinary text and 3:1 for large
text and meaningful graphic strokes. Do not copy a bright logo color directly
into small text.

## Compose the report

Lead with the conclusion, current situation or decision the reader needs. Put the
date, scope and relevant source revision near the top. Use a short contents list
when the report is long enough to benefit from navigation.

Read [references/patterns.md](references/patterns.md) for optional building blocks:
metrics, status badges, comparison panels, screenshot pairs with captions,
scrollable tables, evidence disclosures, diagrams, plots, a slider with bars and
numbered actions. Use only the blocks the material needs. There is no fixed
section count, requirement to add interactivity or requirement to delegate work.

For a review, distinguish verified findings, assumptions and open questions.
Connect proposed work to the observed problem and a concrete acceptance condition.
When measurements matter, retain units, conditions and source links. Keep earlier
results visibly historical if newer work supersedes them. Copy the design, never
old project names, bug lists, measurements, test counts or recommendations.

Write direct prose. Keep evidence close to the claim it supports. Replace every
`{{...}}` token with real content or remove the unused block; example values in
the pattern guide are demonstrations, never evidence. Escape inserted text for
HTML, especially code excerpts. Preserve useful existing report anchors on updates.

If `unslop` is available, using it for the final prose pass is recommended, not
required. Do not install it or stop when it is missing. Without it, remove filler,
promotional claims, repeated conclusions and decorative headings; keep specific
observations, active sentences and the reader's language.

## Report design details

Build report elements with plain HTML, CSS, inline SVG and small inline scripts
when interaction serves the content. Keep the template's styling system. The
references below contain implementation patterns; read the categories needed for
the report rather than adding every pattern to every document.

| Reference | Report use |
| --- | --- |
| [Typography](references/typography.md) | Headings, prose, captions, long labels and numeric comparisons |
| [Surfaces](references/surfaces.md) | Nested panels, optical alignment, shadows, image outlines and hit areas |
| [Animations](references/animations.md) | Optional state changes, icon swaps, press feedback and motion restraint |
| [Icons](references/icons.md) | Inline SVG weight, states, sizing, accessible names and reading direction |
| [Performance](references/performance.md) | Explicit transitions, compositing hints and responsive scenario updates |

### Core principles

1. For closely inset rounded surfaces, outer radius equals inner radius plus
   inset. Treat generously spaced report sections as independent surfaces.
2. Align icons optically when geometric centering looks wrong. Try 2px less
   padding on the icon side of a button; prefer a shared SVG correction for
   asymmetric glyphs.
3. Use borders for section separation, table structure and state. Use layered
   transparent shadows for controls or panels that need elevation.
4. Use interruptible CSS transitions for interactive state changes. Reserve
   keyframes for an occasional sequence that runs once.
5. When an explicitly requested presentation sequence helps explain hierarchy,
   reveal semantic groups about 100ms apart. Do not stagger routine filtering,
   row hovers or repeated navigation.
6. Keep contextual exits softer than entrances. Prefer a small fixed translation
   and about 150ms with `ease-out`; remove immediately when motion adds no context.
7. For occasional contextual icon swaps, cross-fade two inline SVGs using scale
   0.25 to 1, opacity 0 to 1 and blur 4px to 0 over 300ms with
   `cubic-bezier(0.2, 0, 0, 1)`. Keep both in the DOM and use no bounce.
8. Apply font smoothing at the document root for consistent macOS rendering.
9. Use tabular numerals for measurement columns, aligned metrics and updating
   outputs. Keep units and rounding consistent.
10. Balance headings and use natural paragraph wrapping. Use `pretty` for short
    and medium prose, and normal wrapping for long excerpts and evidence.
11. Give images a subtle 1px pure-black outline on light backgrounds, or pure
    white in an explicitly requested dark report. Never tint it with the accent.
12. Use a subtle 0.96 scale for button presses; never go below 0.95. Allow
    `data-static` to disable it when movement distracts or affects dragging.
13. Keep initial report content visible and still. Put initial control states in
    HTML and CSS so loading the report does not replay state-change animations.
14. Name transition properties explicitly. Never use `transition: all`.
15. Add `will-change` only for an observed problem, usually involving transform,
    opacity or filter. Avoid blanket promotion of report rows and cards.
16. Give navigation and standalone controls 44 by 44 CSS pixel touch targets,
    or 40 by 40 in dense desktop layouts. Keep expanded hit areas separate and
    ordinary prose links inline.
17. Match SVG weight to nearby text: roughly 1.5px beside regular text, 2px beside
    semibold and 2.5px beside bold, on a 24px grid. Keep equivalent roles consistent.
18. Use `currentColor` icons with CSS states. Prefer outlines by default and fill
    for active states where useful. Keep text labels and accessible state attributes.
19. Keep frequent interactions immediate or use a color/opacity transition of at
    most 150ms. Every animated change needs static feedback. Respect reduced
    motion and keep print output static and complete.

For optional controls, inspect hover, focus, pressed, disabled and relevant empty
or loading states. If motion is present and rendering is permitted, replay it at
10% speed and check interrupted transitions. Add only states the report needs.

When the user asks to review a report's visual design, use
[references/design-review.md](references/design-review.md) for quick/full coverage,
findings and verification. That review format is separate from the report's own
subject matter; a measurement report does not need a design-audit section.

## Deliver and check

Keep CSS, SVG and any small optional script inline; use no external fonts, CDN,
build step or runtime dependency. Embed images when a single portable file is
required, otherwise use stable relative paths and deliver the image files too.
Use descriptive alt text, captions, table headers and labels. Match the document
language and translate navigation and accessibility labels with it.

Check local links and anchors, placeholder removal, keyboard access, a narrow
viewport and print output. Disclosures containing evidence start open so their
contents remain available without JavaScript and in print. Interactive examples
need meaningful initial values and a written explanation when scripts are off.
Inspect a rendered report when the environment permits; report any checks that
could not be performed. Save in the requested location or the project's existing
report directory and link to the finished file. Publishing or implementing its
action plan is separate work unless the user requested it.
