---
name: pr-report
description: >-
  Build and maintain an overview report of open pull requests, per author,
  repository, organization or label: PRs bundled per issue, a size label and a
  1-5 mergeability score per bundle, one expandable row per bundle with what the
  PRs do and how, and review findings with severity when bundles get reviewed.
  Built on the html-report skill and published from there. Use when asked for a
  "PR report", or an overview, status or triage report of the open PRs in one or
  more repositories (`owner/{a,b}` included) or of one author's PRs, to score
  how mergeable PRs are, to review the next few bundles of such a report with
  sub-agents, or to update one after reviews or merges.
argument-hint: "[repos, e.g. owner/{a,b}] [author]"
license: MIT
---

# PR report

A one-page overview of open pull requests that a team reads together: what is open,
what each bundle does, how far it is from a merge, and what came out of a review.
The report is an `html-report` report; this skill adds the format and the workflow.

## Depends on html-report

Install the `html-report` skill next to this one. Its build and publish scripts live
at `<this skill>/../html-report/scripts/`; when the sibling is missing, look in
`~/.claude/skills/html-report` and `~/.agents/skills/html-report`, and otherwise tell
the user to install it. Follow `html-report` for the brand, the build, the checks
and publishing. This skill never publishes on its own, only when the user asks.

## Workflow

1. **Scope.** Read three things from the request: the repositories, the author
   (optional) and the state (open by default). The common forms:

   | Request | Repositories | Author |
   | --- | --- | --- |
   | "a PR report of all open PRs in X, Y and Z" | `X`, `Y`, `Z` | anyone |
   | "a PR report of all PRs by Stefan in acme/{backend,frontend}" | `acme/backend`, `acme/frontend` | Stefan |
   | "all open PRs of Stefan in acme" | every repository of the `acme` owner | Stefan |

   - Expand brace notation (`acme/{backend,frontend}`) into separate repositories.
   - A bare repository name (`backend`) takes the owner of the other repositories in
     the request or of the current repository's `origin`; ask when neither settles it.
   - Resolve an author given as a name rather than a login to a GitHub login.
     Match the name against the logins and display names of the owner's members
     (`gh api orgs/<owner>/members --paginate -q '.[].login'`, then
     `gh api users/<login> -q .name`) and of the authors of the open PRs in scope.
     Many accounts have no display name, so also match the name case-insensitively
     inside the login (`Stefan` matches `Stefan-Acme`). One clear match: use it and
     say which login you took. None or several: ask.
   - "All PRs" without a state means the open ones; include closed or merged PRs
     only when the request says so.

2. **Gather.** List the PRs with one search per scope, then fetch each PR's details
   in parallel:

   ```sh
   # repositories, any author
   gh search prs --repo acme/backend --repo acme/frontend --state open --limit 200 \
     --json repository,number,title,url,author,isDraft,createdAt,updatedAt
   # repositories and an author
   gh search prs --repo acme/backend --repo acme/frontend --author <login> --state open --limit 200 \
     --json repository,number,title,url,author,isDraft,createdAt,updatedAt
   # every repository of an owner
   gh search prs --owner acme --author <login> --state open --limit 200 --json ...
   gh pr view <n> -R <owner/repo> --json number,title,author,body,baseRefName,headRefName,headRefOid,additions,deletions,changedFiles,mergeable,mergeStateStatus,reviewDecision,reviews,statusCheckRollup,comments,commits
   ```

   Search skips archived repositories. When a search returns its limit, raise it or
   split it per repository. With several authors in the report, name the author per
   bundle in the `what` line or the PR note.

   Count unresolved review threads with GraphQL
   (`pullRequest.reviewThreads.nodes { isResolved }`); `reviewDecision` alone misses
   them. Write raw output to a scratch folder and read it back filtered.
3. **Bundle.** Group PRs that belong to one issue: the issue key in the title or
   branch, and the "related PRs" in the description. A bundle ships together, so it
   is one row with one score, and stacked PRs (one PR based on another's branch)
   belong in the same bundle or say so in the note.
4. **Score** each PR 1-5 (rubric below) and write per bundle a one-sentence *what*
   (the problem) and *how* (the approach), from the description and the diff.
5. **Write** the report from [assets/template.tsx](assets/template.tsx): copy it next
   to where the reports of the project live, fill in the header and the `bundles`,
   then write the lead, the next steps and a decision card only when one is needed.
6. **Build and check** with `html-report`: the overview collapsed and one row
   expanded.

## Score, size and state

| Score | Meaning |
| --- | --- |
| 5 | Small, CI green, no open threads; only an approval missing |
| 4 | Small or well-contained, one trivial point open |
| 3 | Needs a thorough review: new tables, sessions, core logic, or never reviewed |
| 2 | Open feedback, an unresolved request for changes, or stacked on an unmerged PR |
| 1 | Too large to review as one PR; needs splitting |

- A bundle takes the lowest score of its PRs.
- After a review, an open **blocking** finding caps the score at 2 and an open
  **important** finding at 3. Either makes the bundle **not mergeable**; only minor
  findings may stay open on a mergeable bundle. The template applies the caps and
  counts a reviewed bundle as mergeable at score 4 or 5 without open feedback.
- Size counts added plus removed lines of the whole bundle: XS < 100, S < 400,
  M < 1,500, L < 5,000, XL above. Take the numbers from the API, not from a guess.
- State follows from the data: *merged* (`merged` set), *reviewed* (`review` set),
  *feedback open* (`feedbackOpen`: earlier review threads or a request for changes
  still unanswered), otherwise *to review*. The overview sorts open, reviewed,
  merged, and within each by score.

## Reviewing bundles

When the user asks to review bundles (often "the next three"), take them from the
top of the overview's open rows and start one sub-agent per bundle, in one message,
with the brief in [references/review-brief.md](references/review-brief.md). Sub-agents
stay read-only: no checkout, no comments, no approvals.

Check every blocking finding against the code yourself before it enters the report,
and mark what nobody verified as assumed. A reviewed bundle stays in the overview
with state *reviewed*; it does not move to a separate section.

## Acting on PRs

Approve, merge or comment only when the user asks for that PR in this conversation,
and use the merge method they name. After a merge, check that the PR reports merged
before you record it, then set `merged` on the bundle with the merge commit and time.

## Updating the report

- Edit the `.tsx`, keep the section ids and rebuild. When the report was published
  and the user asks, publish again to the same URL.
- Remove a finding from `review.findings` once it is resolved; the caps count every
  finding in the list.
- Every update sets the `updated` line from `date`, never from memory.
- Write in the third person with names when more than one person reads the report,
  and tie each next step to a person and a condition for done.
- A PR whose author has left still needs an owner: put its follow-up under "to be
  assigned" and ask who takes it, instead of assigning it to the author.
