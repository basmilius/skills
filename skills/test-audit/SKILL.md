---
name: test-audit
description: >-
  Use when writing, changing, or reviewing tests, or when asked to audit tests,
  prune low-value tests, or find duplicate coverage. Check whether each test
  protects observable behavior or an independent contract; identify redundant
  tests, implementation coupling, and unnecessary test-only production code.
license: MIT
---

# Test audit

Protect confidence while reducing maintenance cost. Judge tests by the failures
they detect, not by their count, size, speed, or coverage percentage.

For ordinary test authoring or review, use the gate, suspect patterns, retention
bar, and focused validation below. Audit mode adds
[references/audit.md](references/audit.md) for a focused sweep or cleanup.
Campaign mode also adds [references/campaign.md](references/campaign.md) when the
user asks to audit a whole subsystem. Read only the references for the current
mode. Ordinary test work does not authorize a repository-wide sweep or cleanup.
Follow root and scoped `AGENTS.md` / `CLAUDE.md` and the repository testing guide.

## Authoring gate

Before adding or changing a test, answer these questions. Keep the answers
brief; put them in the handoff only when they explain a disputed decision.

1. What observable behavior, invariant, or independent contract does it protect?
2. What credible regression makes it fail, and which assertion detects it?
3. Why would existing coverage miss that failure? Identify the primary test
   owner: the boundary that exercises the responsible production code with
   reliable, specific feedback. Another layer needs a distinct risk, such as
   transport, wiring, persistence, or lifecycle behavior that the owner test
   cannot reach. Prefer a table case over a near-duplicate test. Share setup
   when it remains readable and isolates each test's state.
4. Does it require a production export, flag, wrapper, or injection hook solely
   to inspect internals? Prefer testing through the real entry point. Dependency
   injection for clocks, randomness, I/O, or external services can be a valid
   design boundary. Prefer suitable repository or runner fakes over adding a
   production parameter solely for a test. Judge isolation and design cost;
   global fakes are not automatically better than an explicit dependency.

Put shared input cases at the boundary that owns their behavior. A private
helper with no independent contract should be exercised through its entry
point. A unit with its own stable contract, including an internal module used
by production callers, can own the detailed cases; outer tests then focus on
distinct integration risks. Sharing inputs alone does not prove redundancy.

Missing answers mean the test needs more investigation before it is added.
Check the [suspect patterns](#suspect-patterns) and
[retention bar](#retention-bar). A pattern is evidence to investigate, not a
verdict. Rewrite the test being added or changed if it breaks under refactors
preserving the relevant contract, unless the structure itself is that contract.

For bug regressions, demonstrate that the test fails on pre-fix code for the
intended reason and passes after the repair in the environment where the bug
occurs. Pin relevant timezone, locale, and clock settings in the test or runner
configuration so CI exercises the same conditions. Do not rely on the developer's
shell environment; report any conditions the test cannot reproduce automatically.

If pre-fix code cannot run, report the limitation and use a narrowly controlled
fault in the same pinned environment when practical, following the temporary-change
rules in [focused validation](#focused-validation). Report this as a fault-check,
not historical red/green proof. Claim historical red/green only after observing
the intended failure on pre-fix code and a pass after the repair. Keep a useful
regression even when historical execution is unavailable. Additional layers must
prove a separate failure mode.

## Suspect patterns

- Assertion-free coverage probes, unless the runner treats compilation, exit
  status, or absence of a thrown error as the meaningful assertion.
- Self-comparisons, identity copiers, or expected values computed by the helper
  or renderer under test. Independently specified properties and metamorphic
  relations can be valid oracles.
- Copied fixtures, inventories, manifests, or export lists that only mirror the
  implementation; exact source, import, or string greps with no stable contract.
- Private predicate or call-shape tests duplicated at real entry points;
  repeated invocations of one contract; provider-local replays of shared helpers.
- Tests that only preserve test-only exports, globals, or wrappers; production
  code whose only apparent callers are tests.
- Mocks that implement the asserted behavior, or identical mocks substituted
  for APIs whose differences matter to the claim.
- Fixtures that pre-supply the receipt, admission, callback order, or side
  effect that production should produce; persistence assertions against a store
  the exercised path never writes.
- Capability tests that restate flags without exercising the promised delivery
  or acknowledgement.
- Negative controls that pass for an unrelated reason, such as another guard's
  denial or a rejection the production path never reaches.
- Names or fixtures that promise more than the input exercises, such as a
  "retires the window" test that never checks retirement.

## Retention bar

Keep tests that independently enforce public API, SDK, protocol, configuration,
migration, storage, security, platform, default, prompt-byte, cross-language,
package, release, or architecture contracts. A category name alone does not
justify a test; identify the actual contract and failure it catches. Also keep:

- Call ordering when order affects observable behavior, including externally
  required interactions with no useful return value.
- Regressions with a credible failure mode that remaining coverage cannot catch.
- Source inspection when it is the cheapest independent guard of a stable key,
  byte, path, or architecture rule and survives unrelated identifier refactors.
- Compile-time, property-based, and smoke tests with meaningful failure signals,
  even when they have no conventional assertions.

A checked-in API manifest can independently enforce a reviewed compatibility
baseline. Compare it against the actual published exports and review changes
as API decisions. A list mechanically copied from the implementation with no
compatibility decision only mirrors it. If its purpose is unclear, investigate
rather than delete it.

Static or slow is not a deletion reason. Resembling implementation is not proof
of low value. Multiple layers can be worth keeping when they detect distinct
failures or the repository deliberately requires defense in depth. Do not
replace fast, diagnostic unit tests with broad, flaky checks merely to reduce
overlap.

## Focused validation

For ordinary test work, run the relevant tests and repository-required checks;
report the behavior protected and the results actually observed. Use finite
runs and avoid editing during runs that would make results ambiguous. Stop
watchers you started before editing; do not interrupt someone else's watcher
without authorization. Audit inventories, LOC accounting, and the audit-specific
validation checklist apply only to audit and campaign mode.

For any temporary fault injection, guard bypass, or pre-fix control, use an
isolated checkout or a reversible change that preserves user work. Restore only
your temporary changes before final validation, including when the check fails.

For a negative control, satisfy the other guards and assert the intended
denial or failure. When the rejecting guard is ambiguous, temporarily bypass
only the target guard under these rules and confirm the test fails.
