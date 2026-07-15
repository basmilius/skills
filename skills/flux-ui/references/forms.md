# Forms

Flux forms are **compositional**: a `FluxForm` wraps the form, each control is wrapped
in a `FluxFormField` that supplies the label/hint/error, and the control itself
(`FluxFormInput`, `FluxFormSelect`, ...) goes in the field's default slot. Content
usually sits inside a `FluxPaneBody`. Watch the naming traps (`FluxToggle`,
`FluxQuantitySelector`, `FluxFormRangeSlider`, the `Flux…Input` dates): SKILL.md §3
and `references/component-index.md`.

## Canonical structure (verified)

```vue
<template>
  <FluxPane style="max-width: 390px">
    <FluxForm>
      <FluxPaneBody>
        <FluxFormField label="Label" is-optional
          hint="A helpful hint can be shown here."
          error="Something is wrong with the input!">
          <FluxFormInput placeholder="Any input here!" />
        </FluxFormField>
      </FluxPaneBody>
    </FluxForm>
  </FluxPane>
</template>
<script lang="ts" setup>
  import { FluxForm, FluxFormField, FluxFormInput, FluxPane, FluxPaneBody } from '@flux-ui/components';
</script>
```

## FluxFormField

Props: `label`, `error?`, `hint?`, `is-optional?`, and `max-length?` /
`current-length?` (character counter). Slots: `default ({ id })` (the control; `id`
wires the label), `addition` (extra rows, below), `value` (a value shown next to the
label).

For **more than one** hint/error, use the `#addition` slot with one
`FluxFormFieldAddition` per message (props: `icon`, `mode: "hint" | "error"`,
`message`):

```vue
<FluxFormField label="Label">
  <FluxFormInput placeholder="Any input here!" />
  <template #addition>
    <FluxFormFieldAddition v-for="h in hints" :key="h"
      icon="circle-info" mode="hint" :message="h" />
    <FluxFormFieldAddition v-for="e in errors" :key="e"
      icon="circle-exclamation" mode="error" :message="e" />
  </template>
</FluxFormField>
```

## Controls (wrap each in a FluxFormField)

- Text: `FluxFormInput` (+ `FluxFormInputGroup`, `FluxFormInputAddition`).
- Numeric: `FluxFormNumberInput`, `FluxQuantitySelector`.
- Long text: `FluxFormTextArea`.
- Choice: `FluxFormSelect`, `FluxFormSelectAsync` (async options), `FluxFormCombobox`
  (input + filtered options).
- Boolean: `FluxToggle`, `FluxFormCheckbox` (+ `FluxFormCheckboxGroup`). Bind a plain
  boolean `v-model` (`<FluxToggle v-model />`, no extra props).
- Pick-one: `FluxFormRadioGroup` wrapping `FluxFormRadio` items.
- Range: `FluxFormSlider`, `FluxFormRangeSlider`; inline labeled variants
  `FluxFormFader`, `FluxFormRangeFader` (whole row is the track, label left + value
  right). Note `FluxFormFader` ≠ `FluxFader` (the fade carousel).
- Date/time: `FluxFormDateInput`, `FluxFormDateRangeInput`, `FluxFormDateTimeInput`,
  `FluxFormTimeZonePicker`. (A time-only field is "coming soon".)
- Tags: `FluxFormTagsInput`. Rating: `FluxFormRating`.
- Specialised: `FluxFormPinInput`, `FluxFormTreeViewSelect`, `FluxColorPicker`,
  `FluxColorSelect`.

`FluxFormSelect` options use the `FluxFormSelectEntry` shape; `isFluxFormSelectOption`
and `isFluxFormSelectGroup` are exported to narrow option vs group entries.

## Form layout helpers

`FluxFormSection` (titled section), `FluxFormRow`, `FluxFormColumn`, `FluxFormGrid`
arrange multiple fields. For overall page layout use the layout primitives instead
(`references/components.md`).

> **`FluxFormColumn` has no `span` prop** (it's a plain cell). Column widths come from
> `FluxFormGrid`'s `:columns="n"`, which lays its `FluxFormColumn` children out in **n
> equal tracks**. For uneven widths use `FluxFormRow` (or a different column count).

## Submit

The submit button uses `is-submit`; a primary submit is typically a
`FluxPrimaryButton is-submit`. Pair with `FluxButtonStack` for submit + cancel.

## Pattern: CRUD form

The docs include a worked **CRUD form** at
`https://flux-ui.dev/guide/patterns/crud-form`; read it before building a create/edit
form. A real-app skeleton (page wrapper, `FluxFormSection` / `FluxFormRow` grouping,
`is-submit`, `FluxDropZone` upload) is in `references/patterns.md` §2.
