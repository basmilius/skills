# Dialogs & feedback

Flux offers **two distinct ways** to show a dialog; choosing the right one is the main
decision and the APIs don't mix. All four `show*` functions are named exports from
`@flux-ui/components` and require a mounted `FluxRoot` (they **throw** otherwise, see
`references/conventions.md`).

## Decision: programmatic vs template-driven

| Use case | Reach for |
| -------- | --------- |
| Complex form, wizard, or deep-link/route target | `FluxOverlay` (or `FluxSlideOver`), via `v-if`/route |
| Confirm a destructive action ("Are you sure?") | `showConfirm` |
| One-off message after an action | `showSnackbar` |
| Ask for a single value (rename, enter URL, ...) | `showPrompt` |
| Fatal error / forced acknowledgement | `showAlert` |

Rule of thumb: **more than one input, or must survive a reload (deep-link) →
`FluxOverlay` via the router.** Anything short and ephemeral → a programmatic `show*`.
Do **not** mount a `FluxOverlay` from inside a programmatic handler; route to the
overlay and `router.push` instead. All `show*` specs share `title` (**required**),
`message` (**required**) and optional `icon`.

## The show* functions and their return types

**`showConfirm` → `Promise<boolean>`.** The dominant real-app loop is
**confirm → act → snackbar** (see `references/patterns.md` §4); bail on `false`:

```ts
import { showConfirm, showSnackbar } from '@flux-ui/components';

async function deleteProject(project: Project): Promise<void> {
  const confirmed = await showConfirm({
    icon: 'trash',
    title: 'Delete project',
    message: `Delete "${project.name}"? This cannot be undone.`
  });
  if (!confirmed) return;

  await api.deleteProject(project.id);
  showSnackbar({ icon: 'circle-check', color: 'success', message: 'Project deleted.' });
}
```

**`showPrompt` → `Promise<string | false>`** (resolves to the string, or **`false`**
when cancelled, not `null`). Adds `fieldLabel` (required), optional `fieldPlaceholder`
/ `fieldType`. Guard with `if (name !== false)`.

**`showAlert` → `Promise<void>`** for fatal errors / forced acknowledgement. Spec:
`icon?`, `title`, `message`.

**`showSnackbar` → `Promise<void>`** (resolves when the snackbar closes). **It does not
return an updatable handle.** Fields: `icon`, `title`, `message`, `subMessage`,
`color`, `isCloseable`, `isLoading`, `actions`, `duration`, and the progress fields
`progressIndeterminate` / `progressValue` / `progressMin` / `progressMax` /
`progressStatus`.

### Live-updating a snackbar (progress)

`showSnackbar` alone can't be updated; drive progress through the store, which returns
the id and an update method:

```ts
import { useFluxStore } from '@flux-ui/components';

const store = useFluxStore();
const id = store.addSnackbar({ icon: 'cloud-arrow-up', title: 'Uploading…',
  progressIndeterminate: true, isCloseable: false });

await uploadFile(file, progress => {
  store.updateSnackbar(id, { progressIndeterminate: false, progressValue: progress,
    progressMax: 100, progressStatus: `${progress}%` });
});

store.updateSnackbar(id, { icon: 'circle-check', color: 'success', title: 'Uploaded', isCloseable: true });
// store.removeSnackbar(id) to dismiss programmatically
```

## Template-driven surfaces

`FluxOverlay` (modal, `v-if` or route), `FluxSlideOver` (same, slides from the edge),
`FluxFlyout` (anchored popover for menus/pickers), `FluxTooltip` (hover/focus;
`useTooltipInjection` for custom anchors, also needs `FluxRoot`).

> ⚠ **Put the `v-if` on the pane *inside* the overlay/slide-over, never on the
> `FluxOverlay` / `FluxSlideOver` itself.** Keep `@close` (and `is-closeable`) on the
> surface; toggle only its content:
> ```vue
> <FluxSlideOver is-closeable @close="selected = null">
>   <FluxPane v-if="selected"> … uses selected.* … </FluxPane>
> </FluxSlideOver>
> ```
> Both run through `createDialogRenderer`, which sets *visible = there is a non-Comment
> child*. A `v-if="false"` renders a Comment node, so the surface **stays mounted and
> plays its leave transition** (keeping its focus-trap and Esc handling). A `v-if` on
> the surface element unmounts it immediately, skipping the exit animation.
> (Route-driven overlays, a named `overlay`/`over` `<RouterView>` in
> `references/patterns.md` §1, use no `v-if`; they mount/unmount with the route.)

## Inline (non-blocking) feedback

`FluxNotice` (+ `FluxNoticeStack`), `FluxBadge`, `FluxTag`, `FluxChip`, `FluxInfo`,
`FluxProgressBar`, `FluxSpinner`, `FluxSkeleton`. `FluxProgressBar` takes `value` (0-1,
or set `:max`), optional `status`, and a `color` (`FluxColor`, default `primary`);
reach for it instead of a hand-rolled track/fill `<div>`.

> **Two conventions:** (1) put **more than one** notice/badge/tag/info in its **stack**
> (`FluxNoticeStack`, `FluxBadgeStack`, `FluxTagStack`, `FluxInfoStack`) rather than
> loose siblings; the stack owns the spacing. (2) `FluxNotice`'s **`is-fluid` is only
> for a genuinely full-width context** (e.g. an app-level banner directly in
> `FluxApplication`). Inside a constrained `FluxApplicationContent` section it overruns,
> so leave it off there.
