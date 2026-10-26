# TypeScript style

Apply these TypeScript style conventions directly. Match the project's
`tsconfig.json`, `.editorconfig`, formatter config, instructions and nearby
code; project-specific instructions take precedence. New code is TypeScript
unless the environment cannot run it; the rules hold for JavaScript too, minus
the types.

The formatter (Prettier, oxfmt, Biome, dprint) owns the layout of a line:
indentation, wrapping, quotes, semicolons and trailing commas. Run it and
never hand-format against it. Formatters keep blank lines but never add them,
so the rules below about whitespace are yours to apply.

## Imports and exports

```ts
import { useState } from 'react';
import type { AgentKind } from '@scope/contracts';
import { accountsOfKind, type AccountEntry } from '../agents/accounts';
import { useProviders } from '../state/providers';
```

- Imports form one block at the top of the file. Packages come before
  relative paths, and a path closer to the file comes later.
- One import per module. A type from a module you also import values from
  goes inline (`{ accountsOfKind, type AccountEntry }`); a module you only
  import types from gets `import type`.
- Named exports. A default export only where a framework requires one, such
  as a route module or a config file.
- A barrel lists its names explicitly. `export *` hides what a module
  publishes and lets a rename slip through unnoticed.

## Declarations and expressions

- Name callback parameters after what they hold: `(entry) =>`,
  `(folder) =>`, `(row) =>`. Single letters only where they are conventional
  (`i`, `x`, `y`, `e`). The same holds for variables and destructured names.
- Always braces around the body of `if`, `else`, `for` and `while`, also for a
  one-line early return.
- Prefer early exits over nesting: a guard `if` that returns or throws keeps
  the main path at the lowest indentation.
- A top-level function and a named component are `function` declarations.
  Inside a function, a helper is an arrow function bound to a `const`.
- A class method is a method, never an arrow function assigned to a
  property. Bind it where it is handed off instead.
- `const` by default, `let` only for a binding that is reassigned, never
  `var`.
- Use the syntax the compile target supports: `?.`, `??`, `??=`, `.at(-1)`,
  `Object.hasOwn`, `structuredClone`. Do not raise the target or add a
  polyfill just to restyle code.
- Types describe the shape. Prefer `readonly` on what a caller must not
  change, a union of string literals over an enum, and `unknown` over `any`
  for input you still have to check. Let inference carry local variables;
  annotate exported functions with their return type when it is not
  obvious from one line.
- No non-null assertion (`!`) where a check is cheap. Where the invariant is
  outside the code, a comment states it.

## Whitespace that separates the work

Inside every block (function bodies, arrow functions with braces, `if`,
`case` blocks, loops, `try`):

- One blank line after a statement that ends in a block (`if`, `for`,
  `while`, `switch`, `try`, a call whose callback spans several lines) when
  anything follows it, and one blank line before such a statement when
  anything precedes it.
- One blank line around any statement that spans several lines, such as a
  wrapped call chain, a multiline object or array literal assigned to a
  `const`, or a multiline JSX expression.
- One blank line before `return`, `throw`, `break` and `continue` when
  another statement precedes them in that block. Do not put a blank line
  between `{` and an immediate `return`.
- Consecutive single-line statements that form one step stay together: a run
  of `const`s, a run of hook calls, a run of `push` calls. Split a long run
  with a blank line where the step changes; do not add a comment to name the
  step.
- A run of assertions is one step even when the formatter wraps some of
  them: no blank lines between consecutive `expect(...)` or `assert` calls.
  The run as a whole gets a blank line before and after it.
- No blank line directly after `{` or before `}`, and never two blank lines in
  a row.
- A helper declared inside a function (an arrow `const` with a block body, a
  nested `function`) gets a blank line on both sides.

```ts
export function useAccountChoice(kind: AgentKind | null, account: string | undefined): AccountChoice | null {
    const accounts = useProviderAccounts((row) => row.accounts);
    const providerName = useProviderName(kind);

    if (kind === null || accounts === null) {
        return null;
    }

    const entries = accountsOfKind(accounts, kind);

    if (!hasAccountChoice(entries)) {
        return null;
    }

    const currentId = account ?? kind;

    return {
        accounts,
        currentId,
        current: entries.find((entry) => entry.id === currentId) ?? null,
        nameOf: (entry: AccountEntry) => accountName(entry, providerName)
    };
}
```

Between declarations:

- One blank line between declarations at module level and between class
  members. The import block stays together, and so does a run of
  `export ... from` lines, also when one wraps.
- Runs of single-line declarations of the same kind stay together: a run of
  `const`s, a run of single-line `type` aliases, a run of single-line class
  fields. A declaration in such a run that has its own doc comment gets one
  blank line before and after it.
- A type derived from the value right above it stays attached to that value,
  such as `type Account = z.infer<typeof AccountSchema>` under its schema.
- In an interface or object type, a member with a doc comment gets one blank
  line before and after it. Plain single-line members stay together.

```ts
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

export const AccountSchema = z.object({
    id: z.string(),
    label: z.string()
});
export type Account = z.infer<typeof AccountSchema>;

export interface QueryOptions {
    readonly table: string;
    readonly offset: number;

    /** Rows per page, clamped to `MAX_LIMIT`. */
    readonly limit?: number;
}
```

When editing existing code, apply these rules to the blocks you touch and
leave deliberate existing spacing alone. A pass that only adds blank lines
belongs in its own commit, so the review of the real change stays readable.

## Doc comments

Follow the project's documentation requirements. Exported functions, types
and components of a library get a `/** */` doc comment when the name and
signature leave a question open; internal helpers get one on the same terms.
Test cases get none: their name is the description.

- The first sentence says what the item is or does in terms the caller cares
  about, in a full sentence ending with a period. Do not repeat the name or
  the signature.
- No `@param` or `@returns` tags that only repeat a name or a type
  TypeScript already carries. Keep a tag when it adds a unit, a format, a
  range or what `null` and `undefined` mean.
- Keep `@deprecated` with what to use instead, and `@throws` when a caller
  is expected to catch it.
- Link other symbols with `{@link Name}` instead of writing their path.

Ordinary `//` comments explain a reason, workaround or constraint. Keep
license headers, meaningful todos and spec references. Remove comments that
only restate the code or describe behavior that has changed.

## Examples

Read the relevant example when the short rules leave room for doubt:

- [Functions, guards, inner helpers and returns](examples/typescript/pagination.ts).
- [A class, a schema with its type, and a test](examples/typescript/session.ts).

These are style examples from an isolated sample, not application code to
add to the project.
