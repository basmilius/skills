# @basmilius/utils guide

`@basmilius/utils` is a set of ~45 small, tree-shakeable, framework-agnostic
TypeScript helpers: dates (Luxon), colors, numbers and math, downloads, DOM,
timing, geo/astro and a seeded PRNG. This guide exists so you **reach for what is
already there instead of reinventing it**, and dodge the per-function traps. The
full, categorized catalog with signatures is `utils-function-index.md`.

## 1. The rule: look before you write one

Before hand-rolling a date formatter, a color conversion, a debounce, a download
trigger, a number formatter or a point-in-polygon test, check the catalog. These
helpers are stable, single-purpose and already used across the projects; a local
copy just drifts from them.

## 2. Import and shape

- **Named imports from the package root:** `import { formatDate, hexToRGB } from
  '@basmilius/utils'`. Each helper is one file re-exported by name, so unused
  ones tree-shake away.
- **Dates take a Luxon `DateTime`,** not a JS `Date`:
  `formatDate(DateTime.now())`. `luxon` is a peer install.

## 3. What is in there (category map)

Categories: date/time (Luxon, plus day-part / season / moon / zodiac); number and
math (step rounding, seeded PRNG); color conversions (HEX / RGB / HSL / HSV);
download / print / navigate; DOM and view transitions; debounce / wait-for;
object reflection; geo. Every function with its exact signature is in
`utils-function-index.md`; scan the matching category there before writing
a helper.

## 4. Traps that bite (durable judgment)

- **Date helpers are pure and take a `DateTime`.** They do not read the clock, so
  you pass the moment in: `isToday(value, DateTime.now())` needs `today`
  explicitly. The one exception is `getDayPeriodRange`, which anchors to
  `DateTime.now()` itself.
- **`getSeason(countryCode, date)` takes the country code first** and returns
  `Season | null` (hemisphere depends on the country; an unknown code is `null`).
  The docs' one-argument example is stale; trust the signature.
- **`formatPercentage` reads `navigator.language` with no guard** and throws
  where there is no `navigator` (Node/SSR); `formatNumber` falls back to `nl-NL`.
  Guard percentage formatting on the server.
- **Color ranges differ per space.** Feed the wrong range and you get garbage,
  not an error; the exact ranges per space are in the reference's color section.
- **`hueToRGB` is a low-level primitive** used inside `hslToRGB`, not a
  color-space converter. Do not reach for it to convert a hue.
- **`downloadUrl` throws unless the scheme is `http(s):` or `blob:`.**
- **Several helpers need DOM globals.** The reference's browser-vs-pure split
  says which; guard those to client code.
- **No currency formatter.** There is `formatNumber` and `formatPercentage` but no
  `formatCurrency`. For money use `Intl.NumberFormat(locale, { style: 'currency',
  currency })` directly, or wrap `formatNumber` with the ISO code.

## 5. Constants and types

- **Glyph and no-op constants:** `CHECK`, `CROSS`, `MDASH`, `NDASH` (the em and
  en dash characters) and `NOOP` (an empty `Function` default).
- **Domain unions** ship with the date helpers that return them: `DayPeriod`,
  `WorkdayPeriod`, `CircadianPhase`, `Season`, `SeasonMood`, `MoonPhase`,
  `ZodiacSign`, plus general `Constructor` / `Descriptors` and `Mulberry32`.

## Reference files

- `utils-function-index.md` - every exported function grouped by category,
  with exact signatures, return types and the browser-vs-pure split. **Start
  here for signatures.**

## Related

- **`http-client.md`** - the DTO/service data layer (uses these utils under the
  hood).
- **`common.md`** - Vue app and state primitives (composables, store, data
  tables) built on top of these utils.
- The **`vue-component-anatomy`** / **`vue-build-feature`** skills - the
  library-neutral Vue patterns these helpers slot into.
