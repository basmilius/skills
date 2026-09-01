---
name: code-comments
description: >-
  Use whenever writing, editing, or reviewing code that carries comments or doc
  blocks, in any language. Covers the test a comment has to pass to earn its
  place, the comments to delete (restating the code, listing fields a doc block
  sits above, boilerplate copied across files, a comment that drifted away from
  the line it explains), how to cut a four-line comment down to one without
  losing the reason, and what belongs in a doc block versus what the signature
  already says. Also covers the comments that always stay: todos, license
  headers, security boundaries, workarounds, and references to an external spec.
  Apply on every code change, not only when asked to clean up comments.
---

# Code comments

Nothing compiles a comment and no test covers one, so comments drift away from
the code while multiplying across files. Keep the ones that carry something the
code cannot. Cut the rest.

Language-neutral: the rules hold for `//`, `#`, `/* */`, `<!-- -->`, docstrings,
PHPDoc and JSDoc alike. A project's `CLAUDE.md` / `AGENTS.md` wins where it
disagrees, and so does an existing convention in the surrounding file.

## 1. The test

Write the code first. Read it back as someone who has not seen it before. Add a
comment only for what you could not work out from the code itself.

A comment earns its place when it carries one of these:

- **A reason that is not visible.** Why this approach and not the obvious one.
- **A constraint from outside the file.** An API that returns a sentinel, a
  column that collates case-insensitively, a library that ships no base CSS.
- **A deliberate deviation.** Code that looks wrong until you know what broke.
- **A boundary.** This function is the one that sanitizes; this comparison is
  constant-time on purpose.
- **A pointer to a source.** A spec paragraph, a legacy behavior being matched,
  an issue number for work already tracked.

Everything else goes. The code says what it does.

```ts
// A node id in this set is collapsed; its children are dropped from the rows.
const collapsed = reactive(new Set<number>());
```

The name says it, the type says it, the usage says it. Delete the line.

## 2. If the comment defends the code, fix the code

A comment that needs a paragraph to explain why the code is acceptable is
reporting a problem, not documenting one. Extract a named function, rename the
variable, split the branch. The comment disappears with the confusion.

The same holds for a comment that narrates a block. `// Build the rows, then
sort them` in front of twenty lines wants to be two functions with those names.

## 3. Comments to delete on sight

**Restating the next line.** The comment and the code say the same thing, so one
of them is maintenance for free.

**Listing what is right below it.** A doc block on a data class that names its
fields ("identity, date window, whether it is archived") repeats the property
list ten lines down, and goes stale the moment a field is added.

**Section headers inside a function.** `// --- validation ---` marks a seam that
should be a function call.

**Commented-out code.** Version control keeps it. Delete it, including the empty
`try { /* ... */ } catch {}` it left behind.

**A comment that drifted.** When you move or reorder code, the comment above it
often stays put and ends up explaining its new neighbor. Check what the comment
claims against what is actually under it. If it belongs elsewhere, move it; if
its subject is gone, delete it.

**The same block in five files.** Copied boilerplate stops being read. Cut it to
one line at each site, or move it once to the shared thing it describes.

## 4. Cutting a long comment down

Most long comments are one reason plus its restatements. Keep the reason.

Drop the consequence that follows from the reason. Drop the alternative that was
never on the table. Drop the second sentence that rephrases the first. Drop the
adjectives.

```php
// Rounded to roughly ten meters: two people in the same street share a range, and
// a rounding difference should not cost another request. The rounded position is
// what gets measured as well, so the polygon under a key is the one that key
// describes rather than whoever asked for it first.
```

becomes

```php
// Rounded to roughly ten meters, so two people in the same street share a range. The
// rounded position is measured as well, so a key describes the polygon under it.
```

Two sentences, both load-bearing: why the rounding, and why the rounded value is
also what gets measured.

Aim for one line. Take two when the second says something the first does not.
Take a second paragraph only when it covers a genuinely separate concern, such
as a historical column the current code has to keep matching.

## 5. Doc blocks

Where a project documents every class and function (PHPDoc, JSDoc, docstrings),
that convention stands. Keep the block, keep it short.

**The description says what the name cannot.** One or two sentences on what the
thing is for and what a caller has to know. If it only expands the name into a
sentence, the block is better with the description gone.

**Tags carry type and name, not prose.** `@param int $limit` is complete. Add
text only when it tells you something the signature cannot: a unit, a format, a
domain term, what `null` means, an accepted range.

```php
@param int $requestId                  // nothing to add
@param string $date Date in `Y-m-d` format.
@param int|null $branchId Narrows to this branch and everything below it.
@param float $wtf The werktijdfactor, not the raw stored integer.
```

**Array and object shapes are worth the space.** `@return array{items: Row[],
total: int}` or a typed generic beats a sentence describing the same shape.

**Do not describe the caller's world.** Which screen calls this, which tab it
backs, which release added it: none of that survives a refactor. Name the
behavior instead.

## 6. What always stays

- **Todos and notes,** with an owner and a condition:
  `// todo(Bas): drop this once frontend 1.0 is gone.` A todo without a name or
  a trigger is a comment that will never be resolved.
- **License and copyright headers,** where the project uses them.
- **Security boundaries.** The reason a comparison is constant-time, the reason
  a value is escaped here rather than at the call site.
- **Workarounds,** with the version or condition that lifts them. `Node < 20`,
  `until the API returns a proper status`.
- **External references.** A spec paragraph, a cao or regulation article, a
  vendor quirk, an upstream bug link.
- **Legacy behavior being matched deliberately,** including the column or
  endpoint that no longer exists. Nobody can derive that from the code.

## 7. Placement and language

Put the comment directly above what it explains, at the same indentation. A
comment above a group of declarations belongs to the whole group; if it is about
one of them, move it down to that one.

Write comments in the language the codebase already uses, matching its spelling
convention. Match the surrounding density too: a file with no comments is making
a statement about how much explanation its code needs.

## 8. Reviewing an existing file

Read the comments before the code, and ask of each one whether you would write
it now. Three passes catch most of it:

1. Does the line under it already say this? Delete.
2. Is this about the line under it at all? Move or delete.
3. Can this reason survive in half the words? Cut.

On a heavily commented file, removing a third to a half of the comment lines is
a normal outcome. If nothing came out, either the file was already tight or the
passes were not honest.

## Related skills

- **`unslop`** - the same instinct applied to prose: cut the padding, keep the
  point.
- The repo's **`CLAUDE.md` / `AGENTS.md`** - project rules on comment language,
  doc block requirements and header conventions, which override the defaults
  here.
