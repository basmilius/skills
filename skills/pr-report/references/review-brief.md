# Review brief for a sub-agent

One sub-agent per bundle, all started in one message so they run in parallel. Each
gets the brief below, filled in. The sub-agent knows only what the brief says, so
name the PRs, restate what they claim to do and point at what deserves a hard look.

```text
Review a pull request, strictly read-only. Write the final report in <language>.

PRs (<issue key>, they ship together): <owner/repo#number "title" (+add/-del, N files)>, ...
Stack: <framework and language per repo, where the conventions live (CLAUDE.md, AGENTS.md)>.
Earlier review: <open requests for changes and unresolved threads, or "none">.

Claimed behavior: <two to five sentences from the PR description>.

How to work:
- Read the PR body, diff and threads with `gh pr view`, `gh pr diff`, `gh api`.
  Read changed files at the PR head with
  `gh api repos/<owner>/<repo>/contents/<path>?ref=<headRefOid>` (a branch name fails for a PR from a fork); a local checkout
  at <path> may be on another branch, read it only for unchanged code.
- Do NOT check out branches, run state-changing git commands, push, comment, approve
  or write to the issue tracker. Other agents run in parallel.
- Load the project's code-style guidance before judging style.
- Focus on: <the risks of this change: correctness at the edges, authorization and
  scoping, concurrency, migrations and existing data, other callers of what changed,
  both clients when there are two, test coverage>.

Return, in <language>, at most ~400 words: a verdict, a mergeability score 1-5,
findings each with severity (blocking / important / minor), file:line and a one-line
reason, separated into verified and assumed, and a manual test plan of at most five
steps.
```

## What to send per kind of change

| Change | Ask about |
| --- | --- |
| Authentication, sessions, rate limits | Every entry path covered, client IP behind the proxy, timing differences, table growth under a flood |
| Scoping and permissions | Ids outside the user's scope, the status code a refusal returns, what a refusal logs |
| Background jobs and mail | Retries after a failure, duplicate or lost messages, time precision of comparisons |
| Migrations and settings | Existing rows, per-tenant databases, whether old data is cleaned up or only new writes |
| Frontend state | Races between requests, stale data on a switch, error paths that show the wrong message |
| Filters and reports | Empty selection, overlapping selections counted twice, old saved values and links |

## After the sub-agent returns

- Check each blocking finding against the code yourself before it goes into the
  report. Mark what you could not check as assumed (`verified: false`).
- A finding the sub-agent assumed stays assumed in the report; never upgrade it
  to verified without reading the code.
- Translate the result into the bundle's `review`: the verdict as one sentence that
  starts with "not mergeable" or "mergeable", every finding with its severity, what is
  fine, and the test plan.
