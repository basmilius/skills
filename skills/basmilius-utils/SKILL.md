---
name: basmilius-utils
description: >-
  Use in a project that depends on `@basmilius/utils` (by Bas Milius): reach for
  its ready-made helpers before hand-rolling date, number, color, download, DOM,
  timing, geo or PRNG logic. Trigger on any import from `@basmilius/utils` and on
  tasks like formatDate / formatDateTime / formatNumber / formatPercentage, color
  conversions (hexToRGB, rgbToHEX, hslToRGB, hsvToRGB), debounce / waitFor,
  downloadBlob / downloadUrl / printHtml, viewTransition, mulberry32,
  isPointInPolygon, getSeason / getMoonPhase / getZodiacSign. Dates are Luxon
  `DateTime` based. For the data layer see `basmilius-http-client`; for app and
  state primitives see `basmilius-common`.
license: MIT (skill content); @basmilius/utils is MIT, by Bas Milius
---

# Bas Milius utils

`@basmilius/utils` is a set of ~45 small, tree-shakeable, framework-agnostic
TypeScript helpers: dates (Luxon), colors, numbers and math, downloads, DOM,
timing, geo/astro and a seeded PRNG. This skill exists so you **reach for what is
already there instead of reinventing it**, and dodge the per-function traps. The
full, categorized catalog with signatures is `references/function-index.md`.

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

Signatures live in the reference; this is the "does it already exist" map.

- **Date and time** (Luxon): `formatDate`, `formatDateFull`, `formatDateTime`,
  `formatTime`, `formatMonth`, `formatMonthYear`, `isToday`, plus day-part /
  season / moon / zodiac helpers (`getDayPeriod`, `getSeason`, `getMoonPhase`,
  `getZodiacSign`, ...).
- **Number and math:** `formatNumber`, `formatPercentage`, `countDecimals`,
  `roundStep`, `clampWithStepPrecision`, `generateStepTicks`, `mulberry32` (PRNG).
- **Color:** `hexToRGB`, `rgbToHEX`, `rgbToHSL`, `rgbToHSV`, `hslToRGB`,
  `hsvToRGB`, `hslToHSV`, `hsvToHSL`.
- **Download / print / navigate:** `downloadBlob`, `downloadString`,
  `downloadUrl`, `openUrl`, `printHtml`.
- **DOM / view:** `isHtmlElement`, `viewTransition`.
- **Timing:** `debounce`, `waitFor`.
- **Object / reflection:** `getPrototypeChain`, `setObjectMethod`,
  `setObjectValue`.
- **Geo:** `isNorthernHemisphere`, `isPointInPolygon`.

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
- **Color ranges differ per space:** RGB channels `0-255`, HEX `#rrggbb`, HSL
  `h 0-360`, `s,l 0-100`, HSV all `0-1`. Feed the wrong range and you get
  garbage, not an error.
- **`hueToRGB` is a low-level primitive** used inside `hslToRGB`, not a
  color-space converter. Do not reach for it to convert a hue.
- **`downloadUrl` throws unless the scheme is `http(s):` or `blob:`.**
- **Browser-only helpers:** the downloads, `openUrl`, `printHtml`,
  `viewTransition` and `formatPercentage` need DOM globals; `isHtmlElement` and
  `formatNumber` degrade gracefully. Guard the rest to client code.
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

- `references/function-index.md` - every exported function grouped by category,
  with exact signatures, return types and the browser-vs-pure split. **Start
  here for signatures.**

## Related skills

- **`basmilius-http-client`** - the DTO/service data layer (uses these utils
  under the hood).
- **`basmilius-common`** - Vue app and state primitives (composables, store, data
  tables) built on top of these utils.
- **`vue-component-anatomy`** / **`vue-build-feature`** - the library-neutral Vue
  patterns these helpers slot into.
