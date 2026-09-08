# Performance

Keep long reports responsive while scrolling, changing a scenario and printing.

## Transition only what changes

Name the exact properties that should animate. `transition: all` can animate
layout, colors and dimensions that were never meant to move.

```css
.report-button {
  transition: scale 150ms ease-out, background-color 150ms ease-out;
}
```

If a control uses individual transform properties, name them separately from
`transform`. For example, `transition: transform 150ms` does not target `scale`.
Icon swaps can use `opacity`, `scale` and `filter`; most report controls only need
a short color change.

## Use compositing hints sparingly

`will-change` gives the browser advance notice of a likely change. It can consume
memory and alter rendering behavior, so add it only after observing a concrete
first-frame problem. A report with hundreds of rows should not promote every row
or card in advance.

```css
.scenario-overlay.is-preparing {
  will-change: transform, opacity;
}
```

Remove a temporary preparation class when it is no longer needed. Do not use
`will-change: all` or apply the property as a general performance fix.

| Property | Guidance |
| --- | --- |
| `transform`, `opacity` | Common candidates when a measured transition needs help |
| `filter` | Can benefit from compositing; large blurs remain expensive |
| `clip-path` | Behavior depends on browser and shape; measure before relying on it |
| `top`, `left`, `width`, `height` | Usually involve layout; a hint does not remove that work |
| `background`, `border`, `color` | Do not add promotion hints for routine state colors |

## Keep report interactions small

Update the output and chart elements affected by a scenario change. Keep the
source measurements and displayed rounding consistent. Avoid rebuilding a long
evidence table on every slider input when only a summary value changes.

Read any required layout values together before writing styles; alternating
geometry reads and writes in a row loop can force repeated layout. Use transforms
for purely visual movement rather than changing table geometry.

Use CSS and native elements for navigation, disclosures and print layout. Load no
framework or remote runtime for these behaviors. Keep essential content in the
initial HTML, so it remains available without scripts and in print.

Only run browser profiling when the environment permits it. If no runtime check
is allowed, report that limitation and keep changes conservative; do not claim
measured performance from a source inspection.
