# @basmilius/utils function index

Every public export from `@basmilius/utils`, grouped by category with its exact
signature. The public surface is `src/index.ts`: ~45 functions, 5 constants and a
handful of types. Framework-agnostic (no Vue), with Luxon as the only peer, used
by the date helpers. Import named from the root: `import { formatDate } from
'@basmilius/utils'`.

## Date and time (Luxon)

Each takes a Luxon `DateTime` you pass in; none reads the clock except
`getDayPeriodRange`.

| Function | Signature | Description |
| --- | --- | --- |
| `formatDate` | `(dateTime: DateTime): string` | Localized date, e.g. "1 January 2024". |
| `formatDateFull` | `(dateTime: DateTime): string` | Localized date with weekday, no year, e.g. "Monday, 1 January". |
| `formatDateTime` | `(dateTime: DateTime): string` | Localized date plus 2-digit time. |
| `formatMonth` | `(dateTime: DateTime): string` | Full month name only. |
| `formatMonthYear` | `(dateTime: DateTime): string` | Full month name plus year. |
| `formatTime` | `(dateTime: DateTime): string` | 2-digit hour:minute. |
| `isToday` | `(dateTime: DateTime, today: DateTime): boolean` | Same calendar day as the supplied `today`. Does not read the clock. |
| `getCircadianPhase` | `(date: DateTime): CircadianPhase` | Hour to `alert` (6-10) / `focused` (10-18) / `wind_down` (18-22) / `sleep`. |
| `getDayPeriod` | `(date: DateTime): DayPeriod` | Hour to `morning` (5-12) / `afternoon` (12-17) / `evening` (17-22) / `night`. |
| `getDayPeriodRange` | `(period: DayPeriod): [DateTime, DateTime]` | Start/end range for a period, anchored to `DateTime.now()`. The only date helper that reads the clock. |
| `getWorkdayPeriod` | `(date: DateTime): WorkdayPeriod` | `off` on weekends, else `work`/`break`/`off` by hour (9-12 work, 12-13 break, 13-17 work). |
| `getMoonPhase` | `(date: DateTime): MoonPhase` | Moon phase (Conway's algorithm), one of 8 phases. |
| `getSeason` | `(countryCode: CountryCode, date: DateTime): Season \| null` | Meteorological season for the country's hemisphere; `null` if the code is unknown. |
| `getSeasonalMood` | `(season: Season): SeasonMood` | spring `fresh`, summer `energetic`, autumn `cozy`, winter `warm`. |
| `getZodiacSign` | `(date: DateTime): ZodiacSign` | Western zodiac sign from month/day. |

## Number, formatting and math

| Function | Signature | Description |
| --- | --- | --- |
| `formatNumber` | `(value: number, decimals = 0): string` | `Intl.NumberFormat` on `navigator.language`; falls back to `nl-NL` when `navigator` is missing. |
| `formatPercentage` | `(value: number): string` | Percent (max 1 fraction digit). Reads `navigator.language` with NO fallback guard: throws in Node/SSR. |
| `countDecimals` | `(value: number): number` | Decimal places in the number's string form (0 for integers). |
| `roundStep` | `(value: number, step: number): number` | Rounds to the nearest multiple of `step`. |
| `clampWithStepPrecision` | `(value: number, min: number, max: number, step: number): number` | Maps a normalized value into `[min, max]`, snaps to `step`, clamps, trims to 4 significant digits. |
| `generateStepTicks` | `(lower: number, upper: number, target = 5, isSmall?: boolean): number[]` | "Nice" axis tick values aiming for ~`target` ticks; `isSmall` adds 0.1/0.5 sizes. |
| `mulberry32` | `(seed: number): Mulberry32` | Seeded deterministic PRNG: `{ next(): number; nextBetween(min, max): number; fork(): Mulberry32 }`. |

## Color conversion

Pure array conversions. RGB channels `0-255`; HEX `#rrggbb`; HSL `h 0-360`,
`s,l 0-100`; HSV all `0-1`.

| Function | Signature | Description |
| --- | --- | --- |
| `hexToRGB` | `(hex: string): [number, number, number]` | Hex (`#` optional) to `[r, g, b]`. |
| `rgbToHEX` | `(r: number, g: number, b: number): string` | RGB to `#rrggbb`. |
| `rgbToHSL` | `(r: number, g: number, b: number): [number, number, number]` | RGB to `[h(0-360), s(0-100), l(0-100)]`. |
| `rgbToHSV` | `(r: number, g: number, b: number): [number, number, number]` | RGB to `[h(0-1), s(0-1), v(0-1)]`. |
| `hslToRGB` | `(h: number, s: number, l: number): [number, number, number]` | HSL to RGB. |
| `hslToHSV` | `(h: number, s: number, v: number): [number, number, number]` | HSL to HSV (composed via RGB). |
| `hsvToRGB` | `(h: number, s: number, v: number): [number, number, number]` | HSV (all 0-1) to RGB. |
| `hsvToHSL` | `(h: number, s: number, v: number): [number, number, number]` | HSV to HSL (composed via RGB). |
| `hueToRGB` | `(p: number, q: number, t: number): number` | Low-level hue-to-channel primitive used by `hslToRGB`. Not a color-space converter. |

## Download, print and navigation (browser)

| Function | Signature | Description |
| --- | --- | --- |
| `downloadBlob` | `(blob: Blob, filename: string): void` | Object-URL the blob, trigger a download, revoke. |
| `downloadString` | `(data: string, filename: string, type: string): void` | Wrap a string in a `Blob` of `type` and download. |
| `downloadUrl` | `(url: string, filename: string): void` | Download a URL via a temporary anchor. Throws unless scheme is `http(s):` or `blob:`. |
| `openUrl` | `(url: string): void` | Navigate to `url`; breaks out to `_top` inside an iframe, else sets `location.href`. |
| `printHtml` | `(html: string): Promise<void>` | Render HTML in a hidden iframe, wait for images, `print()`, remove the frame. Async. |

## DOM and view (browser)

| Function | Signature | Description |
| --- | --- | --- |
| `isHtmlElement` | `(elm: unknown): elm is HTMLElement` | Type guard; returns `false` (not throws) when there is no `document`. SSR-safe. |
| `viewTransition` | `(fn: Function): void` | Runs `fn` inside `document.startViewTransition` when available, else calls it directly. |

## Timing

| Function | Signature | Description |
| --- | --- | --- |
| `debounce` | `<F extends (...args: any[]) => any>(fn: F, interval: number, $this?: object): Function` | Debounced wrapper; each call returns a `Promise` of the eventual result. Optional `$this` binds context. |
| `waitFor` | `(ms: number): Promise<void>` | Resolves after `ms` milliseconds. |

## Object and reflection

| Function | Signature | Description |
| --- | --- | --- |
| `getPrototypeChain` | `(obj: Function): Descriptors` | Walks the prototype chain collecting getter/setter descriptors; skips `constructor`/`clone`/`toJSON`. |
| `setObjectMethod` | `(obj: Function, key: string, fn: Function): void` | Assigns `fn` onto `obj.prototype[key]`. |
| `setObjectValue` | `(obj: object, key: symbol \| string, value: unknown): void` | `Object.defineProperty` with a non-enumerable, non-writable, non-configurable value. |

## Geo

| Function | Signature | Description |
| --- | --- | --- |
| `isNorthernHemisphere` | `(countryCode: CountryCode): boolean \| null` | True if the country's latitude is >= 0; `null` if the code is unknown. |
| `isPointInPolygon` | `(point: [number, number], polygon: [number, number][]): boolean` | Ray-casting point-in-polygon test. |

## Constants

| Name | Value | Description |
| --- | --- | --- |
| `CHECK` | check-mark glyph | Boolean-true indicator. |
| `CROSS` | cross glyph | Counterpart to `CHECK`. |
| `MDASH` | em dash character | Long dash glyph. |
| `NDASH` | en dash character | Range dash glyph. |
| `NOOP` | `() => void 0` | No-op default callback, typed `Function`. |

## Types

- `Constructor<T = {}> = new (...args: any[]) => T`
- `Descriptors = Record<string | symbol, TypedPropertyDescriptor<unknown> | PropertyDescriptor>`
- `CircadianPhase = 'alert' | 'focused' | 'sleep' | 'wind_down'`
- `DayPeriod = 'afternoon' | 'evening' | 'morning' | 'night'`
- `WorkdayPeriod = 'break' | 'off' | 'work'`
- `Season = 'autumn' | 'spring' | 'summer' | 'winter'`
- `SeasonMood = 'cozy' | 'energetic' | 'fresh' | 'warm'`
- `MoonPhase` = 8-value union (`new_moon` ... `waning_crescent`)
- `ZodiacSign` = 12-value union (`aries` ... `pisces`)
- `Mulberry32 = { fork(): Mulberry32; next(): number; nextBetween(min: number, max: number): number }`

`CountryCode` comes from an internal `data/countries` module consumed by
`getSeason` / `isNorthernHemisphere`; it is not re-exported from the root.

## Browser vs pure (SSR)

- **Needs DOM/globals (fails in plain Node/SSR):** `downloadBlob`,
  `downloadString`, `downloadUrl`, `openUrl`, `printHtml`, `viewTransition`,
  `formatPercentage`.
- **DOM-aware but SSR-safe (degrade gracefully):** `isHtmlElement`,
  `formatNumber`.
- **Pure (framework and DOM agnostic):** all color conversions, all math
  (`countDecimals`, `roundStep`, `clampWithStepPrecision`, `generateStepTicks`,
  `mulberry32`), geo (`isPointInPolygon`, `isNorthernHemisphere`), object helpers,
  timing (`debounce`, `waitFor`), and the date helpers (pure given a `DateTime`).

## Luxon notes

- Most date files `import type { DateTime }` only, so at runtime they call methods
  on the `DateTime` you pass; no Luxon code is bundled for them.
- `getDayPeriodRange` is the exception: it value-imports `DateTime` and calls
  `DateTime.now()`, so it has a hard Luxon runtime dependency and reads the clock.
- Install `luxon` yourself (peer). The `format*` helpers use Luxon's
  `toLocaleString` with `Intl` options; locale comes from Luxon/`Intl` defaults,
  not `navigator`.
