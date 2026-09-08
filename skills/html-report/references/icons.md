# Icons

Use a small, consistent set of inline SVG icons for report navigation, downloads,
statuses and optional controls. Text must still identify actions and findings.

## Match weight and size

Match the optical weight of nearby text. Use consistent weights for equivalent
roles across the report.

| Adjacent text | Stroke on a 24px grid |
| --- | --- |
| Regular text, 400 weight at 14 to 16px | 1.5px |
| Medium or semibold text, 500 to 600 weight | 2px |
| Bold text or emphasized standalone icon | 2.5px |

Inline icons usually fit at `1em` to `1.25em`. Prefer native 16, 20 or 24px grids
for small standalone glyphs and inspect them at their smallest intended size.
Simplify detailed artwork rather than shrinking it until its strokes disappear.

## One SVG, CSS states

Use `currentColor` for icon strokes or fills. Remove hardcoded colors from imported
icons so hover, active and disabled states use the report's CSS tokens.

```html
<button type="button" class="chart-toggle" aria-pressed="false">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M4 4v16h16M8 16v-4m5 4V8m5 8V5" />
  </svg>
  Toon vergelijking
</button>
```

```css
.chart-toggle {
  color: var(--muted);
}

.chart-toggle:hover:not(:disabled),
.chart-toggle[aria-pressed="true"] {
  color: var(--accent);
}

.chart-toggle:disabled {
  opacity: .6;
}
```

The snippet shows appearance; wire the control to a real comparison before using
it. Meaningful chart series can use separate series colors. The `currentColor`
rule concerns interface icons, not categorical data encoding.

## Outline and fill variants

Use outline icons by default. A fill variant can mark an active filter or saved
selection. Keep the semantic state in text and attributes such as `aria-pressed`;
color or fill alone is insufficient.

For occasional contextual swaps, use the CSS cross-fade in
[animations.md](animations.md). Static navigation and decoration need no motion.

## Direction and accessibility

Give an icon-only control an accessible name. Hide purely decorative SVGs from
assistive technology. A meaningful diagram instead needs its own title,
description and nearby explanation or data table.

Flip directional navigation for right-to-left report languages:

```css
[dir="rtl"] .icon-directional {
  scale: -1 1;
}
```

| Flip with reading direction | Keep orientation |
| --- | --- |
| Back/forward arrows and navigation chevrons | Logos and checkmarks |
| Alignment, list and indent icons | Clocks, cups and pencils |
| Directional send glyphs | Media playback controls |

Inspect composite glyphs by part. An overlay may need to keep its position even
when the directional base flips. Do not mirror plots or physical diagrams merely
because the report language changes.
