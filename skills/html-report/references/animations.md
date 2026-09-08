# Animations

Keep report content still on initial load. Use motion only when it helps explain
an optional control's state or a meaningful change in a scenario.

## Interruptible transitions

Users can change a filter or reverse a toggle before its transition finishes.
CSS transitions can retarget the current visual value toward the latest state.
Use keyframes for an occasional sequence that should run once.

| Behavior | CSS transition | CSS keyframes |
| --- | --- | --- |
| State changes during motion | Retargets from the current value | Needs explicit handling to reverse or retarget |
| Suitable report use | Hover, toggle, scenario indicator | Occasional explanatory sequence |
| Default content load | Already visible | No entrance sequence by default |

```css
.scenario-marker {
  translate: 0 0;
  transition: translate 180ms ease-out;
}

.scenario-marker.is-selected {
  translate: 0 -2px;
}
```

Avoid starting a new keyframe sequence on every click, hover or keystroke. Keep
keyboard focus and reading position stable while values change.

## Occasional staged entrances

An explicitly requested presentation mode may benefit from revealing a conclusion,
explanation and action in order. Split those into semantic groups and stagger by
about 100ms. Word-level title reveals can use about 80ms, but long report headings
usually read better as a whole.

```css
.reveal-sequence.is-playing > .reveal-item {
  animation: reveal-report-item 400ms ease-out both;
}

.reveal-sequence.is-playing > .reveal-item:nth-child(2) {
  animation-delay: 100ms;
}

.reveal-sequence.is-playing > .reveal-item:nth-child(3) {
  animation-delay: 200ms;
}

@keyframes reveal-report-item {
  from {
    opacity: 0;
    translate: 0 12px;
    filter: blur(4px);
  }
  to {
    opacity: 1;
    translate: 0 0;
    filter: blur(0);
  }
}
```

Add `is-playing` only after the intended user action. The base HTML stays visible
when scripting is absent. Do not apply the sequence to ordinary report loading,
row hovers, tab changes or repeated filtering.

## Subtle exits

If an optional overlay needs an exit, keep it shorter and smaller than its
entrance. About 150ms with a fixed 12px translation is enough to indicate direction.
Use `ease-out`. A full-width exit belongs only to an element whose spatial origin
matters, such as an actual side drawer.

```css
.context-panel {
  opacity: 1;
  translate: 0 0;
  transition: opacity 150ms ease-out, translate 150ms ease-out;
}

.context-panel.is-exiting {
  opacity: 0;
  translate: 0 -12px;
}
```

Keep the panel present until its transition finishes, then hide it and restore
focus to the trigger. Use an immediate hide when motion adds no information or
reduced motion is requested. Never make closing or focus restoration depend
solely on `transitionend`, which may not fire when transitions are disabled.
Native evidence disclosures can open and close immediately without custom motion.

## Contextual icon swaps

For an occasional meaningful state change, keep both icons in the DOM and
cross-fade them. One icon establishes the layout size; the other overlays it.
Use scale `0.25` to `1`, opacity `0` to `1`, blur `4px` to `0`, a 300ms duration
and `cubic-bezier(0.2, 0, 0, 1)`. Use no bounce or overshoot.

This example switches a report's comparison state. The control starts hidden so
it cannot become a dead button when scripts are unavailable. The comparison data
stays readable in the initial HTML.

```html
<button type="button" id="comparison-toggle" aria-pressed="true"
        aria-controls="comparison-data" hidden>
  <span class="icon-swap" aria-hidden="true">
    <svg class="icon-off" width="20" height="20" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2">
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
    <svg class="icon-on" width="20" height="20" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2">
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  </span>
  Vergelijking
</button>
<p id="comparison-data">Referentie: 120 g per maaltijd. Proef: 90 g per maaltijd.
  Deze waarden zijn uitsluitend een voorbeeld.</p>
```

```css
.icon-swap {
  display: inline-grid;
  vertical-align: middle;
}

.icon-swap svg {
  grid-area: 1 / 1;
  transition: opacity 300ms cubic-bezier(0.2, 0, 0, 1),
              scale 300ms cubic-bezier(0.2, 0, 0, 1),
              filter 300ms cubic-bezier(0.2, 0, 0, 1);
}

.icon-on,
[aria-pressed="true"] .icon-off {
  opacity: 0;
  scale: .25;
  filter: blur(4px);
}

[aria-pressed="true"] .icon-on {
  opacity: 1;
  scale: 1;
  filter: blur(0);
}

@media print {
  #comparison-toggle { display: none; }
  #comparison-data[hidden] { display: block !important; }
}
```

```html
<script>
const comparisonToggle = document.getElementById('comparison-toggle');
const comparisonData = document.getElementById('comparison-data');
comparisonToggle.addEventListener('click', () => {
  const show = comparisonToggle.getAttribute('aria-pressed') !== 'true';
  comparisonToggle.setAttribute('aria-pressed', String(show));
  comparisonData.hidden = !show;
});
comparisonToggle.hidden = false;
</script>
```

Both states have static feedback through the checkmark, visible content and
`aria-pressed`. Keep the initial state in HTML and CSS so nothing animates on
first load. For frequent toggling, use immediate feedback or a shorter color or
opacity transition instead of replaying the full icon swap.

| Motion can help | Keep static |
| --- | --- |
| An occasional contextual action or completion state | Navigation icons and decoration |
| An optional scenario overlay entering or leaving | Table rows and routinely updated metrics |
| A meaningful state change needing emphasis | Icons already visible in the default state |

## Scale on press

Use `scale: 0.96` for subtle button feedback. Values below `0.95` feel exaggerated.
Use an interruptible transition and skip the effect on disabled controls.

```css
.report-button {
  transition: scale 150ms ease-out;
}

.report-button:active:not(:disabled):not([data-static]) {
  scale: .96;
}
```

Use `data-static` when movement distracts from reading or changes an active drag
target. A slider thumb should not jump away from the pointer on press.

## Reduced motion and print

Keep initial content visible. Remove unnecessary movement while preserving text,
icons and selected states. Include reduced-motion and print rules after the
animation rules they override.

```css
@media (prefers-reduced-motion: reduce), print {
  .icon-swap svg, .report-button, .scenario-marker, .context-panel {
    transition: none;
  }
  .report-button:active:not(:disabled):not([data-static]) {
    scale: none;
  }
  .reveal-sequence.is-playing > .reveal-item {
    animation: none;
    opacity: 1;
    translate: none;
    filter: none;
  }
}
```

Repeated interactions need immediate feedback or a minimal opacity or background
transition of at most 150ms. Motion must always have a static equivalent. When
rendering is permitted, inspect relevant states slowly and replay animation at
10% speed to catch jumps, mismatched timing and interrupted transitions.
