# Subsystem campaigns

Use this mode when the user asks to audit the whole test set owned by a plugin,
package, or core area. Apply the main skill's retention rules and
[audit workflow](audit.md) to every batch. A campaign is complete when every
in-scope test has a resolved disposition and validation is complete.

## Establish the scope

Identify the subsystem's production entry points, owned test files, shared test
support, generated tests, and CI jobs. Include tests outside the subsystem's
directory that exercise its contracts. Mark shared ownership and exclusions
explicitly. Do not silently widen a plugin audit into an audit of its framework.

Record the starting revision, working-tree changes, runner commands, and a
finite baseline run. If baseline failures block safe evaluation, investigate or
report them before deleting affected coverage. Keep user changes intact.
Record each file's baseline result and test/support LOC separately from
production. Finish this baseline before editing affected coverage.

## Build an inventory

Assign every file or scenario to one production-owner lane. Track every test
declaration; split parameter rows when their dispositions differ.
Use a working note or the requested report; create a project tracking file only
when the task calls for one. Record:

- The behavior and production owner.
- Keep, rewrite/consolidate, delete, or investigate, with supporting evidence.
- Dependencies on other proposed changes and the proof that must remain.
- Discovery, edit, and validation status.

Read all inventoried files before calling discovery complete. Pattern searches
help find candidates; search hits and coverage counts do not replace reading.
An unresolved item stays visible as investigate.

## Review the layer plan

After inventory, reassess whole layers. Name each contract's retained suite,
assertions to transfer, files to retire, and seams to remove. A per-test ledger
alone is not the edit plan. Resolve evidence conflicts before cutover.

## Sequence the work

Group changes by production owner or shared contract. Establish or move the
remaining proof before deleting tests that depend on it. Audit shared helpers
once and check each consumer's distinct wiring or lifecycle risks separately.

If discovery is delegated, assign disjoint ownership and merge the findings
before editing. Keep a single record of retained proof and batch dependencies,
including known sibling PRs. Apply the audit workflow's remaining-proof rule
before deleting or weakening a test used by another batch.
Serialize shared harness edits through one owner. Update existing test routing
and inventories when suites move; validate each batch before continuing.

Finish and validate one coherent batch before starting another. Keep PRs small
enough to review as a single argument about preserved confidence. Landing one
batch does not authorize landing later batches; use the authorization already
given for the campaign and ask only when the next action exceeds it.

After a batch lands, refresh the agreed target branch, reread changed owners
and overlapping tests, and update the inventory before the next edit. If work
stays local, use the current validated state and record which earlier batches
later ones depend on.
Check newly added regressions in deleted files and preserve their contracts in
the retained suites. Follow repository merge/rebase policy.

## Completion and continuation

Reconcile the inventory with runner discovery and CI inclusion. Run the
subsystem suite and the repository-required gates; validate shared consumers
when production or shared support changed. Review the combined diff for lost
contracts, not just each batch in isolation.
For gaps found during preservation review, use a controlled fault when practical
to verify the repaired assertion detects the defect, following the main skill's
[temporary-change rules](../SKILL.md#focused-validation).

Report audited scope, dispositions, retained proof, baseline and final results,
separate production and test LOC, landing state, and outstanding candidates.
If time, access, or evidence leaves items unresolved, call the campaign partial
and name the next coherent batch. Do not label uninspected tests as retained or
claim an entire subsystem is complete while investigate items remain.
