---
name: basmilius-http-client
description: >-
  Use when building or reviewing the data layer of a Vue 3 app that uses
  `@basmilius/http-client` (by Bas Milius): a typed HTTP client where every
  request/response body is a `@dto` class, every endpoint group is a
  `BaseService` subclass, and raw snake_case JSON is mapped to DTOs by a static
  `@adapter` class. Trigger on `@dto` / `@adapter`, on `HttpClient`,
  `RequestBuilder`, `BaseService`, `BaseResponse`, `Paginated`, `ForeignData`,
  `QueryString`, on `.runAdapter` / `.runPaginatedAdapter`, on `RequestError` /
  `ValidationError`, or the `dtoNames` Vite plugin. This is the concrete data
  layer that `vue-build-feature` defers to. For app/state primitives (useService,
  useDataTable, stores) see `basmilius-common`; for standalone helpers see
  `basmilius-utils`.
license: MIT (skill content); @basmilius/http-client is MIT, by Bas Milius
---

# Bas Milius http-client

`@basmilius/http-client` is a typed HTTP client for Vue 3. You model **every
payload and response body as a `@dto` class**, **every endpoint group as a
`BaseService` subclass**, and translate raw JSON to DTOs through a static
`@adapter`. This skill encodes the model and the traps; exhaustive signatures live
in `references/reference.md` and worked code in `references/patterns.md`.

The data flow is one line: **service method -> `RequestBuilder` -> `fetch` ->
JSON -> adapter -> DTO -> `BaseResponse`**.

## 1. Setup (the parts that silently break)

- **One `HttpClient` singleton, registered at boot.**
  `HttpClient.register(new HttpClient(authToken, baseUrl))`. `RequestBuilder`
  falls back to `HttpClient.instance`, which **throws if none is registered**;
  import this module first in `main.ts`, before routers and stores, so the client
  exists before any service runs.
- **Legacy decorators must be on.** `tsconfig.json` needs
  `"experimentalDecorators": true` AND `"useDefineForClassFields": false`. These
  are TypeScript legacy decorators, not the TC39 stage-3 ones.
- **Never put `@dto` / `@adapter` classes in `<script setup>`.** Most SFC
  pipelines (esbuild) do not support legacy decorators in `.vue` blocks. Define
  decorated classes in **standalone `.ts` files** and import them.
- **Minification trap:** if you `serialize` / `deserialize` / `cloneDto` in a
  production build, add the `dtoNames()` plugin from `@basmilius/http-client/vite`
  to `vite.config.ts`. DTO rehydration is keyed by class name, which minifiers
  rename. See `references/patterns.md`.
- **Peers:** `vue@^3.6.0-beta`, `luxon`. (`vite` is an optional peer, only for the
  plugin.)

## 2. DTOs (`@dto`)

- **Private `#fields` plus public getter/setter pairs.** Bare class fields
  (`name = ''`) are invisible to the reactivity, `clone()`, `fill()` and
  `toJSON()` machinery, which only sees getter/setter descriptors.
- **Constructor arguments are the canonical shape.** `clone()` re-runs the
  constructor with the original args, so every field must be constructor-fed.
- **A `@dto` class may not extend another `@dto` class** (the decorator throws).
  Compose by reference, not inheritance.
- DTO instances are **reactive** (Vue `customRef` backed): use them directly in
  templates, `computed` and `watch` with no `.value`.

## 3. Adapters (`@adapter`)

- **A static-only class**, one static `parseXxx(data: ForeignData): XxxDto` per
  shape. `@adapter` makes the constructor throw, so it is a namespace, not an
  instance.
- **`ForeignData` is the raw snake_case JSON** (`Record<string, any>`); DTOs are
  camelCase. The adapter is the one place case translation happens.
- Pass the parse method **by reference** into a runner:
  `.runAdapter(UserAdapter.parseUser)`.

## 4. Services (`BaseService`)

- **Subclass `BaseService`, one class per resource group**, named `XxxService`,
  no constructor (`new UserService()` is enough).
- Build with `this.request(path)`, **set the verb explicitly** with
  `.method('get' | 'post' | ...)` (there is no `.get()` shortcut), chain config
  (`.queryString(...)`, `.bearerToken()`, `.body(...)`; `.body()` JSON-stringifies
  an object or array for you, so do not pre-stringify), and **always end with a
  runner**.
- **Runners** (full list in the reference): `run` / `runAdapter` /
  `runArrayAdapter` / `runPaginatedAdapter` / `runEmpty` / `runData` /
  `runDataKey` / `runStatusCode`, plus raw `fetch` / `fetchBlob`. The `run*`
  family normalizes errors; bare **`fetch<T>()` does not**, so prefer `run*`.
- **Backend contract** the normalizer expects: errors as
  `{ code, error, error_description }` (validation adds a nested `errors` map);
  paginated endpoints as `{ items, page, page_size, pages, total }`.

## 5. Calling and error handling

- Instantiate and call: `const res = await new UserService().get(id);` then guard
  on `res.ok` and read `res.data`.
- **Catch order matters** (structural siblings): `isRequestAborted` ->
  `isValidationError` -> `isRequestError`, and `isUnsanctionedRequest` for
  401/403. See `references/patterns.md`.
- **`204` and unauthenticated responses without a body resolve as
  `BaseResponse(null, ...)`** rather than throwing: handle `data === null`.
  Network-level `fetch` rejections bubble up unwrapped.
- **In a `@basmilius/common` app you usually do not try/catch here.** Wrap the
  service in `useService()` so `guarded` turns these into typed exceptions for a
  global handler. See `basmilius-common`.

## 6. Dirty tracking and serialization

- DTOs track dirtiness: `markDtoDirty` / `markDtoClean`, and
  `executeIfDtoDirtyAndMarkClean(dto, fn)` to run a save only when something
  changed.
- `serialize` / `deserialize` round-trip DTOs and Luxon `DateTime`s by class name
  (needs the `dtoNames` plugin under minification). Details in
  `references/patterns.md`.

## Reference files

- `references/reference.md` - the full export surface: decorators, DTO helpers,
  `RequestBuilder` runners and config, `BaseResponse`, `QueryString`, the value
  classes (`Paginated`, `BlobResponse`, `RequestError`, `ValidationError`),
  guards, `HttpAdapter`, types and the Vite plugin options.
- `references/patterns.md` - the end-to-end recipe (DTO -> adapter -> service ->
  call), error handling, the dirty-save pattern, serialize/deserialize and the
  `dtoNames` setup.

## Related skills

- **`basmilius-common`** - `useService` (auto-`guarded`), `useDataTable` /
  `useDataReport` and `useDtoForm` build directly on this client.
- **`basmilius-utils`** - standalone helpers this package uses internally.
- **`vue-build-feature`** - the neutral feature architecture; this client is the
  concrete "data access" layer it leaves project-specific.
