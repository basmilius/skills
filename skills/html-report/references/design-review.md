# Report design review

Use this format when asked to review or improve an HTML report's visual design.
Keep the report's content and purpose separate from the review of its presentation.

## Scope and coverage

Use full mode if the user requests a design review without specifying a mode.

| Mode | Coverage | Finding cap |
| --- | --- | --- |
| Quick | Main reading path and frequently used controls; high and medium issues | 5 |
| Full | Requested scope across typography, surfaces, animations, icons and performance | 15 |

State the mode, report file, styling conventions and inspection boundaries.
Record what was actually inspected in all five categories.

| Category | Evidence inspected | Result |
| --- | --- | --- |
| Typography | Source sections, rendered headings and measurement table | Findings count, clear, or not reviewed with a reason |

Mark unused categories as not applicable. Mark unavailable checks as not verified.
A source-only inspection cannot establish that a narrow screen or printed page
looks correct.

## Common mistakes

| Observed problem | Correction |
| --- | --- |
| Pinched corners on tightly nested panels | Calculate outer radius from inner radius and inset |
| Icon looks off-center beside text | Adjust optically or correct the shared SVG |
| Border is being used solely to fake depth | Use a restrained layered shadow; retain structural borders |
| Jarring contextual entrance or exit | Use a shorter, smaller transition suited to the interaction |
| Numbers shift during scenario changes | Apply tabular numerals and consistent alignment |
| Inconsistent text weight on macOS | Apply smoothing once at the root |
| Content animates whenever the document opens | Render the default state directly in HTML/CSS |
| Unintended properties animate | Replace `transition: all` with named properties |
| First-frame stutter | Profile when permitted; add a specific hint only if justified |
| Small or overlapping control targets | Expand hit areas and adjust spacing |
| Thin icon beside heavy text | Match stroke weight to the text role |
| Separate colored assets per icon state | Use inline SVG with `currentColor` and CSS states |
| Filled icons compete with the content | Use outlines by default, fill for meaningful active state |
| Every hover or keystroke starts an entrance | Use immediate feedback or a minimal color/opacity change |

## Findings

Group findings by principle. Use a table with severity, location, before, after
and why columns. Include all changes made or proposed within the reviewed scope.
Consolidate repeated issues into one row and list the affected locations.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| Low | `report.html:42` | Both tightly nested panels use a 12px radius with an 8px inset | Outer 20px, inner 12px | Concentric corners keep the inner panel from looking pinched |
| Medium | `report.html:87` | Scenario values use proportional digits | Add `font-variant-numeric: tabular-nums` | Updated values keep their alignment |

The rows above demonstrate the format, not actual findings.

- High: inaccessible, misleading, unreadable or repeatedly disruptive behavior.
- Medium: noticeable usability or consistency problem.
- Low: isolated polish; include only in full mode.

Cite the report's source path and line, or an exact section and element when no
source location is available. Show an actionable replacement. Omit empty
principles and never pad the review to its finding cap.

## Considered changes

If there were real borderline candidates, record why they were rejected. Aim for
one to three in quick mode or two to five in full mode when that many exist.
Do not invent candidates to fill a quota.

| Location | Candidate | Rejected because |
| --- | --- | --- |
| Comparison card | Increase elevation | The card is static and its existing border already separates the evidence |

## Verification and verdict

List checks actually run and their results. When permitted, inspect the main
reading path, narrow layout, keyboard navigation, control states and print.
Replay relevant motion at 10% speed and check rapid reversal. Respect environment
restrictions; record the checks that could not be performed.

Use Block when a high finding remains, Needs changes for remaining medium or low
findings, and Approve only when no actionable findings remain. Keep the verdict
scoped to the inspected evidence and place every unverified check beside it.
This is a review assessment, not a deployment or publication approval gate.

If there are no findings, omit the findings table and state that no actionable
report-design findings were found within the inspected scope. Include verification
and any real rejected candidates.
