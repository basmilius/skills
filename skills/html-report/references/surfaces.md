# Surfaces

Use rounded sections, borders and restrained depth to separate report content.

## Concentric border radius

For closely nested rounded surfaces, calculate the outer radius from the inner
radius and the inset between them:

```text
outer radius = inner radius + inset
```

```css
.comparison-frame {
  padding: 8px;
  border-radius: 20px;
}

.comparison-frame > .comparison-image {
  border-radius: 12px;
}
```

Equal radii on both tightly nested layers make the inner corners look pinched.
When padding is larger than about 24px, or the elements read as separate report
sections, choose each radius independently. A card inside a large section does
not need strict concentric geometry.

## Optical alignment

Use optical adjustment when mathematical centering leaves an icon looking
off-center. For a trailing icon, try 2px less padding on its side, then inspect
the result at the intended size.

```css
.download-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-inline: 16px 14px;
}
```

A triangular play icon can need a small horizontal shift. This applies only when
the report actually includes playable media.

```css
.play-button svg {
  translate: 2px 0;
}
```

For asymmetric stars, arrows and carets, prefer correcting the SVG path or
viewBox so every use shares the correction. A small margin is a local fallback.

## Shadows and borders

Keep borders that separate report sections, table rows and evidence, or indicate
focus and selection. Use soft layered shadows when an element needs elevation,
such as a floating control or an elevated download button.

The template defines `--shadow-border` and `--shadow-border-hover` for both color
schemes. In light mode the first shadow supplies a ring, the second a small lift
and the third ambient depth. In dark mode a white ring replaces them, because dark
shadows barely show on a dark page.

```css
.elevated-control {
  border: 0;
  box-shadow: var(--shadow-border);
  transition: background-color 120ms ease, scale 120ms ease, box-shadow 150ms ease-out;
}

.elevated-control:hover:not(:disabled) {
  box-shadow: var(--shadow-border-hover);
}
```

The ring replaces the template's button border, so remove the border to avoid a
double edge. A `transition` declaration replaces the button's own transitions;
repeat them next to `box-shadow`. Avoid adding hover elevation to static cards
that have no action.

| Element | Treatment |
| --- | --- |
| Table boundaries, dividers and section separation | Border |
| Selected, focused and input states | Visible state border or outline |
| Floating controls and popovers | Restrained elevation shadow |
| Static findings and comparison cards | Template background and structural border as needed |

## Image outlines

Give screenshots and images a subtle 1px inset outline. Use pure black in light
mode and pure white in dark mode. Keep the outline independent of the project
accent, ink and tinted neutral palette.

The template sets `--image-outline` for both color schemes.

```css
figure img {
  outline: 1px solid var(--image-outline);
  outline-offset: -1px;
}
```

The equivalent colors are `oklch(0 0 0 / 0.1)` and `oklch(1 0 0 / 0.1)`.
An outline preserves image dimensions; the negative offset keeps it inset.
Tinted outlines can give screenshot edges a dirty appearance.

## Hit areas and focus

Navigation links and standalone controls should offer a 44 by 44 CSS pixel hit
area for touch. Dense desktop controls may use 40 by 40. Normal prose links stay
inline. Keep a visible focus ring and distinct hover and pressed states.

Prefer sizing the actual button or label. If an icon must remain small, expand
the owning control's hit area with a pseudo-element.

```css
.small-icon-button {
  position: relative;
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
  padding: 0;
}

.small-icon-button::after {
  content: "";
  position: absolute;
  inset: -12px;
}

.small-icon-button:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 4px;
}
```

Reserve enough surrounding space for the expanded area. If targets overlap,
adjust layout or reduce the expansion. Neighboring controls must never compete
for the same hit area. Keep disabled controls recognizable and prevent their
hover and pressed effects.
