# Focused audits

Read this workflow for focused test sweeps and subsystem campaigns, together
with the main skill's authoring gate, suspect patterns, and retention bar.

## Discovery

Keep discovery read-only and present candidate evidence before editing. If the
user already authorized fixes, continue after presenting the evidence; otherwise
finish with findings. Do not turn a review-only request into edits.

Read the complete candidate test and its production owner, then inspect entry
points, callers, callees, sibling implementations, overlapping coverage, CI
routing, and relevant history far enough to establish the claimed redundancy.
Inspect dependency source or types when the claim relies on their behavior.
Unavailable history or dependencies are uncertainty to report, not proof that
a test has no value.

Prefer a few high-confidence candidates. For broad audits, use separate discovery
lanes for core/packages, plugins/extensions, UI/tooling, and cross-cutting
patterns. Share ownership and evidence so lanes do not independently delete
each other's remaining proof.

Before treating production code as dead, check dynamic registration, reflection,
generated consumers, configuration, and published entry points. No in-repository
callers does not prove an exported API is unused. Removing a published export
can break consumers even if only tests call it locally. Leave it in investigate
unless removal is covered by the requested scope and compatibility policy.

## Candidate evidence

Before deleting a test or its supporting code, record:

- Exact test name and location, and the failure it actually detects.
- Production callers of any seam proposed for removal, including dynamic or
  external consumers; mark this field not applicable for a test-only deletion.
- Remaining proof, with exact test locations and why it catches the same
  failure, or evidence that the behavior is obsolete and no proof is needed.
- Relevant history and the reason the test or seam exists. Mark unavailable
  history explicitly; retain the candidate if its purpose remains unresolved.
- Any production or test-support deletion unlocked, or "none."
- Risk, confidence, and the focused validation command.

Classify candidates as keep, rewrite/consolidate, delete, or investigate. Missing
evidence keeps a deletion candidate in investigate. If redundancy is uncertain,
introduce the suspected fault locally and check the claimed remaining proof
when practical, following the main skill's
[temporary-change rules](../SKILL.md#focused-validation). A green suite after
deletion alone does not establish redundancy.

A test named as remaining proof must stay effective and discoverable. Remove or
weaken it only after moving equivalent proof or reclassifying dependent deletion
candidates as keep. Include local batches and known sibling PRs in this check.
If a change outside your control plans to remove that proof, treat it as absent,
defer dependent deletions, and report the conflict. Recheck these dependencies
before final validation and landing.

## Edit shape

Choose one coherent batch around the production behavior being tested. Move
retained regressions to their primary owner and preserve distinct risks when
consolidating. Remove obsolete test-only exports, globals, wrappers, and dead
paths only after checking their consumers. Consolidate repeated package or
dependency checks when one generic contract exercises the relevant differences.

Production simplification is a benefit, not a quota. Do not expand the task to
achieve net-negative LOC or trade clear tests for abstractions that hide their
inputs and assertions. Keep unrelated cleanup and uncertain candidates separate.

If a retained test fails on the baseline, reproduce and report it as a possible
product bug. Do not delete it to make the suite pass. Repair the owner when the
requested scope includes that fix; otherwise hand off the finding.

## Validation

Apply the main skill's focused-validation rules and the repository testing guide.

1. Establish the relevant baseline before edits, then run the smallest owner
   and sibling tests after the change. Confirm retained or relocated tests are
   still discovered by the runner and included in the relevant CI job.
2. For removed source greps or plan assertions, run the executable script or
   dry-run that owns the real contract when one exists. Otherwise identify the
   independent guard that remains.
3. Run applicable formatting and `git diff --check`, then the changed-file or
   CI gate required by repository policy. Broaden validation when the changed
   production code affects other callers.
4. Inspect the full diff, including newly created files, for accidental behavior
   changes, lost independent coverage, or leftover test-only code.
5. Inspect `git diff --numstat`; report production/tooling separately from tests
   and test support, with additions and deletions rather than a net total alone.

Report commands actually run and their results. Distinguish passing checks from
skipped, blocked, pre-existing, or flaky failures. Coverage and mutation results
can support a decision; neither a percentage nor a passing suite proves that
all removed assertions were redundant.

## Landing and handoff

Commit, push, open a PR, or merge only within the user's authorization. Complete
local work and validation first. Continue broader audits in coherent follow-up
batches. Use the campaign guide for sequencing a subsystem-wide audit.

For an audit, report removed categories and their causes, production
simplifications, retained false positives, validation and limitations, production
versus test LOC, PR/merge state when relevant, and named follow-ups.
