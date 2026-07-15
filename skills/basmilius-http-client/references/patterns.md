# @basmilius/http-client patterns

End-to-end, grounded recipes. Keep every decorated class in a standalone `.ts`
file (never in `<script setup>`), and group a resource's DTO, adapter and service
under `service/<domain>/` with an `index.ts` barrel.

## 0. Register the client once, at boot

```ts
// app/http-client.ts
import { HttpClient } from '@basmilius/http-client';

const client = new HttpClient(null, 'https://api.example.com');
HttpClient.register(client);

export function setAuthToken(token: string | null): void {
    client.authToken = token;
}
```

## 1. Define a DTO

Private `#fields` with getter/setter pairs; all state constructor-fed.

```ts
// service/user/UserDto.ts
import { dto } from '@basmilius/http-client';

@dto
export class UserDto {
    get id(): string { return this.#id; }
    set id(value: string) { this.#id = value; }

    get email(): string { return this.#email; }
    set email(value: string) { this.#email = value; }

    #id: string;
    #email: string;

    constructor(id: string, email: string) {
        this.#id = id;
        this.#email = email;
    }
}
```

## 2. Adapter: snake_case JSON to DTO

```ts
// service/user/UserAdapter.ts
import { adapter, type ForeignData } from '@basmilius/http-client';
import { UserDto } from './UserDto';

@adapter
export class UserAdapter {
    static parseUser(data: ForeignData): UserDto {
        return new UserDto(data.id, data.email);
    }
}
```

## 3. Service: one class per resource group

Set the verb with `.method(...)`, pass the adapter method by reference, end with a
runner. There is no `.get()` shortcut.

```ts
// service/user/UserService.ts
import { BaseResponse, BaseService, Paginated, QueryString } from '@basmilius/http-client';
import { UserAdapter } from './UserAdapter';
import type { UserDto } from './UserDto';

export class UserService extends BaseService {
    async get(id: string): Promise<BaseResponse<UserDto>> {
        return await this
            .request(`/users/${id}`)
            .method('get')
            .bearerToken()
            .runAdapter(UserAdapter.parseUser);
    }

    async list(offset: number, limit: number): Promise<BaseResponse<Paginated<UserDto>>> {
        return await this
            .request('/users')
            .method('get')
            .queryString(QueryString.builder().append('offset', offset).append('limit', limit))
            .bearerToken()
            .runPaginatedAdapter(UserAdapter.parseUser);
    }

    async update(user: UserDto): Promise<BaseResponse<UserDto>> {
        return await this
            .request(`/users/${user.id}`)
            .method('put')
            .bearerToken()
            .body(user)
            .runAdapter(UserAdapter.parseUser);
    }
}
```

`.body(user)` hands the DTO to the builder, which JSON-stringifies it (via its
`toJSON`) and sets `application/json`; never stringify it yourself.

## 4. Call it

```ts
const users = new UserService();
const response = await users.get('user-123');

if (response.ok) {
    console.log(response.data.email);
}
```

`204` and unauthenticated responses without a body resolve as
`BaseResponse(null, ...)`, so check `response.data !== null` when a body is
optional.

## 5. Error handling (raw client)

Check the guards in order: aborted, then validation, then generic request error.
`ValidationError` is a structural sibling of `RequestError`, so it must come
first.

```ts
import {
    isRequestAborted, isRequestError, isUnsanctionedRequest, isValidationError
} from '@basmilius/http-client';

try {
    await users.update(user);
} catch (error) {
    if (isRequestAborted(error)) {
        return;
    }

    if (isValidationError(error)) {
        showFieldErrors(error.errors);
        return;
    }

    if (isRequestError(error)) {
        if (isUnsanctionedRequest(error)) {
            redirectToLogin();
            return;
        }

        showToast(error.errorDescription);
        return;
    }

    throw error;
}
```

In a `@basmilius/common` app, prefer `useService(UserService)`: it wraps every
method with `guarded`, which turns these into typed exceptions for a global
handler, so the call site stays free of `try/catch`. See `basmilius-common`.

## 6. Dirty-tracking save

Run the request only when the DTO actually changed.

```ts
import { executeIfDtoDirtyAndMarkClean } from '@basmilius/http-client';

await executeIfDtoDirtyAndMarkClean(user, async (dirty) => {
    await users.update(dirty);
});
```

## 7. Serialize / deserialize

Round-trips DTOs and Luxon `DateTime`s by class name (localStorage, history
state, `postMessage`).

```ts
import { deserialize, serialize } from '@basmilius/http-client';

localStorage.setItem('user', serialize(user));
const restored = deserialize(localStorage.getItem('user')!) as UserDto;
```

Because rehydration is keyed by `clazz.name`, minifiers break it. Add the plugin:

```ts
// vite.config.ts
import { dtoNames } from '@basmilius/http-client/vite';

export default defineConfig({
    plugins: [dtoNames()]
});
```

## tsconfig

Legacy decorators must be enabled, and class-field defines off:

```jsonc
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "useDefineForClassFields": false
    }
}
```
