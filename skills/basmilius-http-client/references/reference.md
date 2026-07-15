# @basmilius/http-client reference

The full public surface. All symbols are named exports from the package root
(`@basmilius/http-client`); the Vite plugin is at `@basmilius/http-client/vite`.
ESM-only.

## Decorators

| Symbol | Signature | Notes |
| --- | --- | --- |
| `dto` | `<T extends Constructor>(clazz: T): T` | Class decorator. Makes the class reactive (Vue `customRef`), cloneable, dirty-trackable, serializable; registers it by `clazz.name`. Throws if it extends another `@dto` class. |
| `adapter` | `<T extends Constructor>(Parent: T): T` | Class decorator. Returns a non-instantiable subclass (constructor throws). Use as a static-only namespace. |
| `bound` | `(): MethodDecorator` | Binds the method to its instance on the prototype descriptor. |
| `debounce` | `(interval: number): MethodDecorator` | Wraps the method with `debounce` from `@basmilius/utils`; trailing-call only, return value is dropped. |

## DTO instance shape

Type `DtoInstance<T>`. Every `@dto` instance gains:

- `clone(): DtoInstance<T>` - deep clone via the constructor + settable props.
- `fill(data: Record<string, unknown>): void` - in-memory update; ignores unknown
  keys and setter-less props. For form edits, not for raw JSON (use an adapter).
- `toJSON(): Record<string, unknown>`.

## DTO helpers

| Symbol | Signature | Notes |
| --- | --- | --- |
| `isDto` | `(obj: unknown): obj is DtoInstance<unknown>` | Truthy name-symbol check. |
| `assertDto` | `(obj: unknown): asserts obj is DtoInstance<never>` | Throws if not a DTO. |
| `cloneDto` | `<T>(obj: T): T` | Asserts, then `obj.clone()`. |
| `isDtoClean` / `isDtoDirty` | `(obj: unknown): boolean` | Dirty state. |
| `markDtoClean` | `(obj: unknown): void` | Cleans the DTO and its dirty children. |
| `markDtoDirty` | `(obj: unknown, key?: string \| number): void` | Marks dirty, propagates up to parents. |
| `executeIfDtoDirtyAndMarkClean` | `<T, R = void>(obj: T, fn: (dto: T & DtoInstance<T>) => Promise<R>): Promise<void>` | Runs `fn` only if dirty, then marks clean. |

## Serialize

| Symbol | Signature | Notes |
| --- | --- | --- |
| `serialize` | `(obj: unknown): string` | Tagged JSON. Handles DTOs, Luxon `DateTime` (ISO, extended zone + offset), arrays, plain objects, primitives, `null`. |
| `deserialize` | `(serialized: string): unknown` | Rebuilds DTOs (by class name from the registry; throws if the name is unknown) and `DateTime`s. Needs `dtoNames` under minification. |

## http layer

### HttpClient

- `new HttpClient(authToken: string \| null, baseUrl: string, dataField = false)`.
- Getters: `authToken` (also settable), `baseUrl`, `dataField`.
- Static `HttpClient.register(client: HttpClient): void`; static getter
  `HttpClient.instance` (throws if none registered).
- `dataField: true` makes the safe runners unwrap `data.data` from the envelope.

### BaseService

- `protected request(path: string, client?: HttpClient): RequestBuilder`.
- Pass an explicit `client` only for multi-client / multi-base-URL apps; the
  singleton is the default.

### RequestBuilder

`new RequestBuilder(path, client?)`. Seeds `{ cache: 'no-cache', method: 'GET' }`.

Config (chainable): `autoCancel(identifier: symbol)`, `bearerToken(token?)`
(falls back to `client.authToken`; if that is null it removes the header),
`body(body, contentType? = 'application/octet-stream')`, `header(name, value)`,
`method(method: HttpMethod)`, `queryString(qs: QueryString)`,
`signal(signal? = null)`. Accessors: `client` (ro), `options` (ro), `path`,
`query`.

`body(...)` **JSON-stringifies a plain object or array and sets
`Content-Type: application/json` for you**; a `FormData` passes through with no
content type (the browser sets the boundary); a string or `Blob` is sent as-is
with the given content type. Do not pre-stringify a DTO: pass it directly, since
`JSON.stringify` uses its `toJSON()`.

Runners:

| Runner | Returns | Use |
| --- | --- | --- |
| `run<T>()` | `Promise<BaseResponse<T>>` | Normalized JSON body. |
| `runAdapter<T>(fn)` | `Promise<BaseResponse<T>>` | Single object through `fn(item)`. |
| `runArrayAdapter<T>(fn)` | `Promise<BaseResponse<T[]>>` | Array through `fn`. |
| `runPaginatedAdapter<T>(fn)` | `Promise<BaseResponse<Paginated<T>>>` | `{items,page,page_size,pages,total}` envelope. |
| `runEmpty()` | `Promise<BaseResponse<never>>` | No body expected. |
| `runData<T>()` | `Promise<BaseResponse<T>>` | Unwraps the `data` field. |
| `runDataKey<T, K extends keyof T>(key)` | `Promise<BaseResponse<T[K]>>` | Unwraps `data[key]`. |
| `runStatusCode()` | `Promise<HttpStatusCode>` | Status only. |
| `fetch<T>()` | `Promise<T>` | Raw JSON, NO error normalization. Trusted endpoints only. |
| `fetchBlob()` | `Promise<BlobResponse>` | File download. |

### BaseResponse

`new BaseResponse(data: T, response: Response)`. Getters: `data: T`,
`headers: Headers`, `ok: boolean` (200-299), `response: Response`,
`statusCode: HttpStatusCode`.

### QueryString

`QueryString.builder()`. Methods: `append`, `appendArray(name, values | null)`,
`delete`, `get`, `getAll`, `has`, `set`, `build(): string`. Value type
`boolean | number | string | null`; falsy values (except `false`) are skipped.

## Value classes (`dto/`)

Each is itself a `@dto`. These are the shapes the client builds and throws.

| Class | Constructor | Getters |
| --- | --- | --- |
| `Paginated<T>` | `(items: T[], page, pageSize, pages, total)` | `items`, `page`, `pageSize`, `pages`, `total`. |
| `BlobResponse` | `(blob: Blob, name: string)` | `blob`, `name`. |
| `RequestError` | `(code: number, error, errorDescription, statusCode)` | `code`, `error`, `errorDescription`, `statusCode`. |
| `ValidationError` | `(code, error, errorDescription, errors: Record<string, ValidationError>, params)` | plus recursive `errors`, `params`. |

## Guards and errors

- `RequestAbortedError extends Error`.
- `isRequestAborted(obj): obj is RequestAbortedError`.
- `isRequestError(obj): obj is RequestError`.
- `isValidationError(obj): obj is ValidationError` (check this before
  `isRequestError`; they are structural siblings).
- `isUnsanctionedRequest(statusCode: unknown): boolean` - true for 401/403;
  accepts a `RequestError` or a raw code.

## HttpAdapter (built-in `@adapter`)

- `parsePaginatedAdapter<T>(data: ForeignData, fn: (item: object) => T): Paginated<T>`.
- `parseFileNameFromContentDispositionHeader(header): string`.
- `parseRequestError(data: ForeignData, statusCode: HttpStatusCode): RequestError`.
- `parseValidationError(data: ForeignData): ValidationError` (recursive).

## Types

- `HttpMethod = 'connect' | 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put' | 'trace'`.
- `HttpStatusCode` - literal union of standard codes (100-511).
- `ForeignData = Record<string, any>` - raw snake_case JSON input for adapters.

## Vite plugin (`@basmilius/http-client/vite`)

- `dtoNames(options?): Plugin`, an `enforce: 'pre'` plugin that pins each `@dto`
  class's runtime `.name` so name-keyed rehydration survives minification.
- `Options = { readonly decorator?: string; readonly filter?: (id: string) => boolean }`.
  `decorator` defaults to `'dto'` (change if you alias the decorator); `filter`
  defaults to JS/TS module extensions.
