# @basmilius/common patterns

Grounded, end-to-end recipes for the primitives that carry the most judgment.

## 1. A store that returns refs

Setup-style, `defineStore` from this package. Destructure straight out: state is a
`Ref`, actions are plain functions.

```ts
// store/counter.ts
import { ref } from 'vue';
import { defineStore } from '@basmilius/common';

export const useCounterStore = defineStore('counter', () => {
    const count = ref(0);

    function increment(): void {
        count.value += 1;
    }

    return { count, increment };
});
```

```vue
<script setup lang="ts">
import { useCounterStore } from '@/store/counter';

const { count, increment } = useCounterStore();
</script>

<template>
    <button @click="increment">{{ count }}</button>
</template>
```

Bootstrap once:

```ts
import { createApp } from 'vue';
import { createPinia } from '@basmilius/common';

createApp(App).use(createPinia()).mount('#app');
```

## 2. Service access with a shared error handler

`useService` auto-`guarded`s every method. Add `onError` for centralized UX; do
not `try/catch` at the call site.

```ts
import { onError, useService } from '@basmilius/common';
import { OrderService } from '@/service/order/OrderService';

// plain: 403 / unsanctioned already map to typed exceptions
const orders = useService(OrderService);
await orders.get(123);

// with shared onError -> HandledException after showing a snackbar
const handle = onError<(fn: Function) => Function>((error) => snackbar.error(error.message));
const ordersHandled = useService(OrderService, handle);
```

## 3. Paginated table view

The flagship. `useDataTable` wires loading, pagination, debounce and
race-guarding; the `fetcher` takes one `DataTableQuery` and returns a
`BaseResponse<Paginated<T>>` (or `false` to skip).

```vue
<script setup lang="ts">
import { useDataTable, useService } from '@basmilius/common';
import { OrderService, type Order } from '@/service/order/OrderService';

type OrderFilters = { status: string }; // '' means all

const orders = useService(OrderService);

const {
    items, isLoading, displayEmpty, error, reload,
    page, perPage, total,
    search, filters, sort, toggleSort, setPage
} = useDataTable<Order, OrderFilters>({
    filters: { status: '' },
    sort: { field: 'createdAt', direction: 'desc' },
    // map the query to the service's own params; the service never imports a common type
    fetcher: (query) => orders.list({
        offset: query.offset,
        limit: query.limit,
        search: query.search,
        status: query.filters.status,
        sort: query.sort
    })
});
</script>
```

Mutate `search` / `filters` / `sort` directly; each resets to page 1 and
refetches. `useDataReport` is the same shape without pagination or sorting.

### Skip until dependencies are ready

Call `unrefAll` at the top of the fetcher; the thrown
`UnresolvedDependencyException` is swallowed, so nothing fetches until every dep
is truthy.

```ts
import { unrefAll } from '@basmilius/common';

const { items } = useDataTable<Order, OrderFilters>({
    fetcher: (query) => {
        const [customerId] = unrefAll(selectedCustomerId); // skips while null
        return orders.listForCustomer(customerId, {
            offset: query.offset,
            limit: query.limit,
            search: query.search,
            status: query.filters.status,
            sort: query.sort
        });
    }
});
```

## 4. Editing a DTO through a form buffer

```ts
import { ref } from 'vue';
import { useDtoForm, useService } from '@basmilius/common';
import { OrderService } from '@/service/order/OrderService';
import type { OrderDto } from '@/service/order/OrderDto';

const orders = useService(OrderService);
const orderRef = ref<OrderDto | null>(null);

// deep clone, marked clean; re-clones when orderRef changes
const form = useDtoForm(orderRef);

orders.get(123).then((response) => {
    orderRef.value = response.data;
});
// edit form.value freely; dirty tracking lives on the clone
```

Do not point `useDtoForm` at a ref that keeps updating while the user edits: each
source change discards pending edits.

## 5. URL-synced view state

```ts
import { ref } from 'vue';
import { useUrlState } from '@basmilius/common';

const query = ref('');
const page = ref(1);
const archived = ref(false);

useUrlState({ query, page, archived }, { prefix: 'orders' });
// ?orders_query=...&orders_page=2 ; values equal to their initial are dropped
```
