---
name: php-style
description: >-
  Use when writing, editing, or reviewing PHP code. Covers whitespace,
  imports, declarations, attributes, callbacks and PHPDocs, including tests
  and preservation of existing @since versions. Project instructions and
  existing conventions take precedence.
license: MIT
---

# PHP style

Apply these PHP style conventions directly. Match the project's supported
PHP version, instructions and nearby code; project-specific instructions
take precedence.

## File layout and imports

```php
<?php
declare(strict_types=1);

namespace Example\Catalog;

use DateTimeImmutable;
use Example\Delivery\{DeliveryRequest, LegacyLimit, TrackingState};
use RuntimeException;
use function array_map;
use function trim;
use const PHP_EOL;
```

- Four spaces, UTF-8, LF, and a final newline. No blank line between `<?php`
  and `declare(strict_types=1);`.
- One blank line before the namespace, before the imports, and after them.
  Imports have no blank lines between the class, function and constant groups.
- Import classes first, then `use function`, then `use const`; sort each group
  alphabetically. Use short imported names in code and PHPDocs rather than FQNs.
  Related imports from exactly the same namespace may be grouped, such as
  `use Example\Delivery\{DeliveryRequest, LegacyLimit, TrackingState};`. Sort
  the members alphabetically. Keep different namespaces separate; avoid mixed
  groups such as `use Example\{Model, Query\Builder}`.

## Declarations and expressions

- Nonempty named classes, interfaces, traits and enums put their opening brace
  on the next line. Empty type bodies use ` {}` on the declaration line,
  including empty anonymous classes:

  ```php
  class EmptyClass {}
  interface MarkerInterface {}
  trait EmptyTrait {}
  enum EmptyEnum {}
  ```

- Nonempty methods and named functions also open on the next line. An empty
  method uses ` {}` on the declaration line, including promoted constructors.
  A multiline constructor ends with `) {}` when its body is empty.
- Control blocks and anonymous functions put `{` on the same line. Write
  `} elseif (...) {`, `} else {`, `} catch (...) {`, and `} finally {`.
  Always use braces for control bodies, including one statement.
- Anonymous classes also open on the same line, for example
  `new class($items) implements Countable { ... }`. The next-line class rule
  applies to named classes.
- Ordinary anonymous functions have a space before `(`; arrow functions do not:
  `function (string $value): string { ... }`,
  `static fn(string $value): string => trim($value)`.
  Use `static` when the callback does not need `$this`.
- No space between a method name and `(`. A return type is `): Type`;
  named arguments are `name: $value`. Keep `(int)$value`, `!$active`, and
  array access `$items[$index]` compact.
- Use spaces around assignment, binary operators, concatenation and `=>`;
  use one space after commas. Do not align assignments or array keys in columns.
- Use typed signatures and constructor promotion where appropriate. Do not
  introduce a different class design or newer PHP syntax just to format code.
- Place declaration attributes on their own lines above the declaration.
  Parameter attributes stay with the parameter, such as
  `#[FromQuery] public int $limit = 25`.
- Property hooks keep the property's `{` on the declaration line. Block hooks
  use `get { ... }` or `set { ... }` with a four-space body; expression hooks
  use `get => $expression;`. Asymmetric visibility is `public private(set)`.
- Union and intersection types have no spaces around their operators:
  `Item|null`, `Readable&Writable`, `(Readable&Writable)|null`.
- Keep short arrays, calls and expressions on one line. Do not wrap everything
  at 80 or 120 columns. Break up long expressions when their structure becomes
  hard to read.
- When choosing multiline layout, indent continued items four spaces, with the
  closing delimiter aligned to the start of the declaration or expression.
  Preserve existing trailing commas; do not add them just for formatting.

## Whitespace that separates the work

- Put one blank line immediately inside both ends of every nonempty class,
  trait, interface and enum body: after the opening `{` and before the closing
  `}`. This includes nonempty anonymous classes. Empty type bodies stay on the
  declaration line as ` {}`; they have no padding. Keep empty methods and
  constructors compact too.
- One blank line between methods and named functions. Method, function, control
  and property-hook bodies have no padding inside their braces. Adjacent
  related fields can stay together.
- Separate logical steps within a method with one blank line, especially after
  a guard and before the next operation. Do not pack unrelated statements onto
  one line or add a comment to name each step.
- Leave one blank line before `return` when another statement precedes it in
  that block. Do not put a blank line between `{` and an immediate `return`.
- Preserve deliberate multiline expressions and keep logical steps readable
  when editing existing code.

## PHPDocs

Follow the project's documentation requirements. Library classes, methods and
properties should have the required PHPDocs; test files and fixtures get no
PHPDocs unless the project explicitly requires them.

- Named type headings are `Class Name`, `Interface Name`, `Trait Name`, and `Enum Name`.
  A useful optional description follows the heading with a blank PHPDoc line
  above and below it. Never replace the heading with that description.
  For an anonymous class, document its factory and members rather than
  inventing a class name for a heading.
- Method descriptions explain the caller's contract or a constraint that the
  name cannot convey. Do not leave a newly documented method with only author
  and version tags. Preserve `{@inheritdoc}` where it is the right description.
- `@param` has only the type and name, without a description. Put any format,
  units, limits or meaning of `null` in the method description.
- One blank PHPDoc line separates the description from tags. Consecutive
  `@param` tags form a group, with one blank PHPDoc line after that group before
  `@return`, `@throws` or metadata. Do not align tag columns with padding.
- For methods, place `@return` before `@throws`, followed by the existing
  author/version metadata. Preserve precise generics and array shapes.
- A property description and its `@var` tag are separated by a blank line;
  `*/` has its own line in a multiline block.
- Preserve every existing `@since` value when editing existing code. Use the
  project's planned version only for genuinely new code, not for a small fix,
  reformat or extra parameter.
- In Bas-owned library code, use `@author Bas Milius <bas@mili.us>`; type
  PHPDocs also use their namespace as `@package`. Follow the project's policy
  for property and enum-case metadata. Preserve different ownership metadata
  in other projects rather than replacing it with Bas's name.

```php
/**
 * Class Label
 *
 * Preserves the supplied label while exposing a normalized lookup key.
 *
 * @author Bas Milius <bas@mili.us>
 * @package Example\Catalog
 * @since 1.0.0
 */
final readonly class Label
{

    /**
     * Retains the original spelling for display.
     *
     * @param string $value
     *
     * @author Bas Milius <bas@mili.us>
     * @since 1.0.0
     */
    public function __construct(public string $value) {}

    /**
     * Removes surrounding whitespace for comparisons without changing the label.
     *
     * @return string
     * @author Bas Milius <bas@mili.us>
     * @since 1.0.0
     */
    public function key(): string
    {
        return trim($this->value);
    }

}
```

Ordinary comments explain a reason, workaround or constraint. Keep license
headers, meaningful todos and spec references. Remove comments that only
restate the code or describe behavior that has changed.

## Examples for less familiar constructs

Read the relevant example when the short rules leave room for doubt:

- [Attributes](references/examples/CarrierTag.php) and
  [multiline promoted arguments](references/examples/DeliveryRequest.php).
- [Closures and an anonymous class](references/examples/DeliveryCallbacks.php).
- [Property hooks and asymmetric visibility](references/examples/TrackingState.php).
- [Existing and new version tags together](references/examples/LegacyLimit.php).
- [Pest datasets without PHPDocs](references/examples/DeliveryFixturesTest.php).

These are style examples from an isolated sample library, not application
code to add to the project. Their version numbers belong to those samples.
