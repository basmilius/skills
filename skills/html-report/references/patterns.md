# Optional report patterns

These fragments use the inline CSS in `assets/report.html`. Insert only what the
report needs. Replace `{{...}}` tokens, translate labels and give repeated SVGs,
controls and sections unique IDs. The numbers in the plot and slider below are
explicit demonstrations. Replace them with sourced data or a stated model before
using them in a report.

## Metrics and status

Metrics suit a small set of meaningful totals, not decorative scores. Status
labels carry meaning in text as well as color. `confirmed`, `warning`, `danger`
and `info` use semantic colors independent of the project's accent.

```html
<div class="stats">
  <div><strong>{{VALUE}}</strong><span>{{METRIC_AND_UNIT}}</span></div>
  <div><strong>{{OTHER_VALUE}}</strong><span>{{OTHER_METRIC_AND_UNIT}}</span></div>
</div>
<p><span class="badge confirmed">{{VERIFIED_LABEL}}</span> {{VERIFIED_RESULT}}</p>
<p><span class="badge warning">{{OPEN_LABEL}}</span> {{OPEN_QUESTION}}</p>
<p class="note">{{LIMITATION_OR_DECISION}}</p>
```

## Comparison panels and screenshots

Use matching conditions for before/after claims. Captions explain the conditions
and what the image supports. An image pair is optional; a single figure works too.
Use actual images, never screenshots that merely illustrate an invented result.

```html
<div class="split">
  <div class="panel"><h3>{{OPTION_A}}</h3><p>{{TRADEOFF_A}}</p></div>
  <div class="panel"><h3>{{OPTION_B}}</h3><p>{{TRADEOFF_B}}</p></div>
</div>
<div class="split">
  <figure>
    <a href="{{BEFORE_IMAGE}}"><img src="{{BEFORE_IMAGE}}" alt="{{BEFORE_ALT}}"></a>
    <figcaption>{{BEFORE_CONDITIONS}}</figcaption>
  </figure>
  <figure>
    <a href="{{AFTER_IMAGE}}"><img src="{{AFTER_IMAGE}}" alt="{{AFTER_ALT}}"></a>
    <figcaption>{{AFTER_CONDITIONS_AND_OBSERVATION}}</figcaption>
  </figure>
</div>
```

## Tables and evidence

Use `.wide` only when the columns need a minimum width. The focusable wrapper
allows keyboard scrolling. Disclosures start open for print and script-free use.
Source snippets need HTML escaping and enough surrounding context to support the
claim. Keep large logs in a linked artifact.

```html
<div class="table" role="region" aria-label="{{TABLE_LABEL}}" tabindex="0">
  <table class="wide">
    <caption>{{TABLE_CAPTION_AND_CONDITIONS}}</caption>
    <thead><tr><th scope="col">{{SUBJECT_LABEL}}</th><th scope="col">{{OBSERVATION_LABEL}}</th><th scope="col">{{ACTION_LABEL}}</th></tr></thead>
    <tbody><tr><th scope="row">{{SUBJECT}}</th><td>{{OBSERVATION}}</td><td>{{ACTION}}</td></tr></tbody>
  </table>
</div>
<details open>
  <summary>{{EVIDENCE_LABEL}}</summary>
  <p class="caption"><a href="{{SOURCE_URL}}">{{SOURCE_NAME_AND_REVISION}}</a></p>
  <pre><code>{{ESCAPED_SOURCE_EXCERPT}}</code></pre>
  <p>{{WHAT_THIS_ESTABLISHES_AND_WHAT_IT_DOES_NOT}}</p>
</details>
```

## Numbered actions

An ordered list provides the sequence; CSS supplies the visible numbers. Keep
ownership and dependencies only when the plan needs them. Listing a possible
agent assignment does not start or authorize that work.

```html
<ol class="steps">
  <li class="step"><div>
    <h3>{{ACTION}}</h3>
    <p>{{PROBLEM_AND_PROPOSED_CHANGE}}</p>
    <p>{{OBSERVABLE_ACCEPTANCE_CONDITION}}</p>
  </div></li>
  <li class="step"><div>
    <h3>{{NEXT_ACTION}}</h3>
    <p>{{DEPENDENCY_AND_CHANGE}}</p>
    <p>{{NEXT_ACCEPTANCE_CONDITION}}</p>
  </div></li>
</ol>
```

## Inline diagram

The diagram colors follow the project tokens. Replace nodes and connections to
match the actual process. Leave enough width for translated labels; widen the
viewBox or wrap SVG text explicitly when needed. The caption supplies a prose
reading of the diagram.

```html
<figure class="panel">
  <div class="table" role="region" aria-label="{{DIAGRAM_SCROLL_LABEL}}" tabindex="0">
    <svg class="diagram plot" viewBox="0 0 720 160" role="img" aria-labelledby="flow-title flow-description">
      <title id="flow-title">{{DIAGRAM_TITLE}}</title>
      <desc id="flow-description">{{FLOW_DESCRIPTION}}</desc>
      <defs><marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path class="arrow" d="M0 0 L8 4 L0 8 Z"/></marker></defs>
      <rect class="node" x="20" y="40" width="180" height="80" rx="12"/>
      <rect class="node" x="270" y="40" width="180" height="80" rx="12"/>
      <rect class="node" x="520" y="40" width="180" height="80" rx="12"/>
      <path class="edge" d="M200 80 H258" marker-end="url(#flow-arrow)"/>
      <path class="edge" d="M450 80 H508" marker-end="url(#flow-arrow)"/>
      <text x="110" y="86" text-anchor="middle">{{INPUT}}</text>
      <text x="360" y="86" text-anchor="middle">{{PROCESS}}</text>
      <text x="610" y="86" text-anchor="middle">{{RESULT}}</text>
    </svg>
  </div>
  <figcaption>{{DIAGRAM_CAPTION}}</figcaption>
</figure>
```

## Plot with a readable scale

This demonstration plots A = 20 and B = 35 on a 0 to 40 scale. Bar heights and labels
must change together when using real data. Include units, source and measurement
conditions in the caption; a chart is not evidence by itself.

```html
<figure class="panel">
  <div class="table" role="region" aria-label="Example chart" tabindex="0">
    <svg class="diagram plot" viewBox="0 0 560 240" role="img" aria-labelledby="plot-title plot-description">
      <title id="plot-title">Demonstration values</title>
      <desc id="plot-description">Illustrative values, not measurements. A is 20 units and B is 35 units on a scale from 0 to 40.</desc>
      <path class="grid" d="M65 35 H520 M65 110 H520"/>
      <path class="axis" d="M65 30 V185 H520"/>
      <text x="50" y="40" text-anchor="end">40</text>
      <text x="50" y="115" text-anchor="end">20</text>
      <text x="50" y="190" text-anchor="end">0</text>
      <rect class="series" x="140" y="110" width="100" height="75" rx="4"/>
      <rect class="series" x="330" y="53.75" width="100" height="131.25" rx="4"/>
      <text x="190" y="100" text-anchor="middle">20</text>
      <text x="380" y="44" text-anchor="middle">35</text>
      <text x="190" y="215" text-anchor="middle">A</text>
      <text x="380" y="215" text-anchor="middle">B</text>
    </svg>
  </div>
  <figcaption>Demonstration only. Replace the data, units, conditions and source.</figcaption>
</figure>
```

## Slider and comparison bars

Use a control when changing a parameter helps explain a real relationship. This
standalone example is a linear allocation model: selected share of 100 units.
It is not a measurement or prediction. Initial bars and outputs are valid without
JavaScript. Keep the script at the end of the report body only if this pattern is
used. For a different model, update the formula, initial values, ranges, labels
and prose together. Retain printed results when hiding the control.

```html
<div class="panel">
  <h3>Illustrative allocation</h3>
  <p id="allocation-note">Demonstration model: allocated units = total units × share / 100. The total is 100 units; the initial share is 40%.</p>
  <label for="allocation-share">Allocated share, percent</label>
  <input id="allocation-share" type="range" min="0" max="100" step="1" value="40" aria-describedby="allocation-note">
  <div class="bar-label"><span>Total</span><span>100 units</span></div>
  <div class="bar reference" aria-hidden="true"><span style="width:100%"></span></div>
  <div class="bar-label"><span>Allocated</span><output id="allocation-value" for="allocation-share">40 units, 40%</output></div>
  <div class="bar" aria-hidden="true"><span id="allocation-bar" style="width:40%"></span></div>
  <noscript><p class="caption">The static result shows the initial 40% share.</p></noscript>
</div>
<script>
{
  const slider = document.getElementById('allocation-share');
  const output = document.getElementById('allocation-value');
  const bar = document.getElementById('allocation-bar');
  function updateAllocation() {
    const share = Number(slider.value);
    const total = 100;
    const allocated = total * share / 100;
    output.value = `${allocated} units, ${share}%`;
    bar.style.width = `${share}%`;
  }
  slider.addEventListener('input', updateAllocation);
  updateAllocation();
}
</script>
```

Static comparisons can use the same bars without a control or script. Normalize
both widths to the same stated maximum and show each actual value as text. Use
`.reference` for the baseline; the shorter bar is not automatically better.
