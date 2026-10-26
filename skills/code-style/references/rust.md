# Rust style

Apply these Rust style conventions directly. Match the project's edition,
`rustfmt.toml`, instructions and nearby code; project-specific instructions
take precedence.

rustfmt owns the layout of a line: indentation, wrapping, brace placement,
trailing commas and import sorting. Run `cargo fmt` and never hand-format
against it. rustfmt keeps blank lines but never adds them, so the rules
below about whitespace are yours to apply.

## File layout and imports

```rust
//! Name resolution: what a name in a statement stands for.

use std::collections::HashMap;
use std::path::Path;

use serde::Deserialize;
use sql_syntax::{Dialect, SyntaxNode};

use crate::ast::{child, children, has_token};
use crate::catalog::{Catalog, TableId};
```

- Four spaces, UTF-8, LF, and a final newline.
- A module doc comment (`//!`) comes first when the module needs one, followed
  by one blank line.
- Imports form three groups in this order, separated by one blank line:
  `std`/`core`/`alloc`, external crates (including the workspace's own crates),
  then `crate`, `super` and `self`. rustfmt sorts within a group.
- One `use` per module path. Items from the same path share braces:
  `use crate::ast::{child, children, has_token};`. Do not nest paths inside
  braces, such as `use crate::{ast::child, catalog::Catalog};`.
- Glob imports only for `use super::*;` in a test module and for enum
  variants that a module matches on constantly, such as `use SyntaxKind::*;`.
- `mod` declarations come before the imports, `pub use` re-exports after them.

## Declarations and expressions

- Name closure parameters after what they hold: `|extension|`, `|folder|`,
  `|reference|`. Single letters only where they are conventional (`i`, `x`,
  `y`, `e`). The same holds for `let` bindings and match bindings.
- Prefer early exits over nesting: `let ... else { return ...; };`, `?`, and
  a guard `if` that returns. Keep the main path at the lowest indentation.
- Use `matches!` for a boolean pattern test and `is_some_and`/`is_ok_and`
  over `map(...).unwrap_or(false)`.
- Keep `pub` as narrow as the use: `pub(crate)` for what other modules of the
  crate need, private for the rest.
- Derives in the order the project uses; otherwise `Clone, Copy, Debug,
  Default, PartialEq, Eq, PartialOrd, Ord, Hash`, then third-party derives such
  as `Serialize, Deserialize`.
- No `unwrap()` in library code where the input can fail; `expect("...")`
  states the invariant that makes it safe. Tests may unwrap.
- Do not introduce a newer edition feature, a new dependency or a different
  type design just to restyle code.

## Whitespace that separates the work

Inside every block (function bodies, closures with braces, `if`, `match` arm
blocks, loops):

- One blank line after a statement that ends in a block (`if`, `if let`,
  `match`, `for`, `while`, `loop`, a bare block) when anything follows it, and
  one blank line before such a statement when anything precedes it.
- One blank line around any statement that spans several lines, such as a
  wrapped method chain, a multiline `let ... = match`, a `let ... else` or a
  wrapped macro call. Consecutive assertions are the exception, see below.
- One blank line before `return`, `break`, `continue` and the tail expression
  when another statement precedes them in that block. Do not put a blank line
  between `{` and an immediate `return` or tail expression.
- Consecutive single-line statements that form one step stay together: a run
  of `let`s, a run of `push` calls, a run of `assert_eq!`s. Split a long run
  with a blank line where the step changes; do not add a comment to name the
  step.
- A run of assertions is one step even when rustfmt wraps some of them: no
  blank lines between consecutive `assert!`, `assert_eq!` and `assert_ne!`
  calls. The run as a whole gets a blank line before and after it.
- No blank line directly after `{` or before `}`: block, `impl`, `trait` and
  `mod` bodies have no padding.
- A nested item (`fn`, `struct`, `const`) inside a function gets a blank line
  on both sides; consecutive `use` lines inside a function stay together.

```rust
pub fn symbols_at(index: &Index, root: &SyntaxNode, offset: u32) -> Option<(TextRange, Vec<Symbol>)> {
    let ctx = FileContext::new(index, root);

    if let Some(found) = key_symbol_at(index, root, offset) {
        return Some(found);
    }

    let token = token_at(root, offset)?;
    let symbols = symbols_of_token(&ctx, &token);

    if symbols.is_empty() {
        return None;
    }

    Some((last_segment_of_token(&token), symbols))
}
```

Between declarations:

- One blank line between items at module level and inside `impl`, `trait`
  and inline `mod` bodies. Consecutive `use` lines stay together, and so do
  runs of single-line items of the same kind, such as `mod a;` lines, `const`s
  or associated `type`s.
- An item in such a run that has its own doc comment gets one blank line
  before and after it. A doc comment that describes the whole run sits above
  the first item and keeps the run together.
- In a struct or enum, a field or variant with a doc comment or with
  attributes on their own lines (`#[serde(...)]`, `#[error(...)]`) gets one
  blank line before and after it. Plain single-line fields and variants stay
  together.

```rust
pub enum SourceKind {
    Table(TableId),

    /// A common table expression, by its `CTE` node.
    Cte(SyntaxNode),

    /// A subquery in `FROM`, by its query.
    Derived(SyntaxNode),
}

pub struct UpdateProduct {
    pub name: Option<String>,
    pub platform: Option<String>,

    #[serde(default, deserialize_with = "present")]
    pub retention_days: Option<Option<i64>>,
}
```

When editing existing code, apply these rules to the blocks you touch and
leave deliberate existing spacing alone.

## Doc comments

Follow the project's documentation requirements. Public items in a library
crate get a `///` doc comment; private helpers get one when the name and
signature leave a question open. Test functions get none: their name is the
description.

- The first sentence says what the item is or does in terms the caller cares
  about, in a full sentence ending with a period. Do not repeat the name or
  the signature.
- No `# Arguments` or `# Returns` sections that list parameters. Put units,
  formats, limits and what `None` means in the prose.
- Keep `# Panics`, `# Errors` and `# Safety` when the item can panic, returns
  a meaningful error, or is `unsafe`.
- Link types with intra-doc links (`[`Index`]`) instead of writing the path.
- A module doc (`//!`) explains what the module covers and the rules it
  follows, not the list of its functions.

Ordinary `//` comments explain a reason, workaround or constraint. Keep
license headers, meaningful todos and spec references. Remove comments that
only restate the code or describe behavior that has changed.

## Examples

Read the relevant example when the short rules leave room for doubt:

- [Functions, closures, guards and tail expressions](examples/rust/placeholders.rs).
- [Structs, enums, impls and a test module](examples/rust/catalog.rs).

These are style examples from an isolated sample crate, not application code
to add to the project.
