# Typography

Use typography to make long reports readable and comparisons easy to scan.

## Text wrapping

Use `text-wrap: balance` for titles, headings and short statements. Balance is
intended for short blocks; browser line limits vary. Keep long paragraphs and
preformatted evidence out of this rule.

```css
h1, h2, h3 {
  text-wrap: balance;
}

p, li, figcaption, blockquote {
  text-wrap: pretty;
}

.long-excerpt {
  text-wrap: wrap;
}
```

`pretty` improves the final lines of short and medium paragraphs without trying
to equalize every line. Use normal wrapping for very long excerpts. Preserve
whitespace where it carries meaning, such as logs, formulas and code blocks.

| Report element | Wrapping |
| --- | --- |
| Title and section headings | `balance` |
| Paragraphs, captions, findings and action descriptions | `pretty` |
| Long excerpts | Normal wrapping |
| Logs and code | Preserve meaningful whitespace; allow scrolling or wrap for print |

Give long labels room to wrap. Apply `overflow-wrap: anywhere` to URLs and code
references where an unbroken string could widen the page. Keep numeric table
columns aligned and let the table container scroll when the columns need space.

## Font smoothing

Apply smoothing once at the document root for consistent macOS text rendering.
Other platforms can use their native rendering.

```css
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Avoid per-heading smoothing rules that make body text look heavier by comparison.

## Font family

Start with the template's system stack. A report should remain readable offline
without downloading fonts or requiring a commercial typeface.

```css
html {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

If the user supplies a brand typeface, keep a practical system fallback and
package any required, permitted font assets with the report. Font smoothing,
wrapping and numeric alignment do not determine the font family.

## Tabular numbers

Use equal-width digits for measurements, table columns, changing scenario values
and chart labels. This keeps comparisons aligned and prevents shifts on updates.

```css
.stats strong, .numeric, output, .bar-label {
  font-variant-numeric: tabular-nums;
}

td.numeric, th.numeric {
  text-align: right;
}
```

| Use tabular numerals | Usually keep normal numerals |
| --- | --- |
| Measurement tables and comparison metrics | Numbers embedded in prose |
| Updating costs, counts and scenario outputs | Phone numbers and postal codes |
| Aligned chart labels and timers | Version names and decorative display text |

The shape of individual digits can change when tabular numerals are enabled.
Inspect the actual font at the report's reading size. Show units and rounding
consistently; digit alignment cannot compensate for mixed units or precision.
