---
name: review-threads
description: >-
  Work through the open review comments on a GitHub pull request: gather every
  unresolved thread, judge which ones deserve a change, reply in the language of
  each comment as Claude, and resolve the threads that are settled. Use when the
  user runs /review-threads (optionally a PR number, URL or branch) or asks to
  handle / answer / process / go through PR comments, review feedback or a
  reviewer's remarks. Replies only by default; the `fix` argument (or asking to
  fix the comments) adds a pass that writes the code changes the threads call
  for. Every remote action (replies, resolves, commits, the push) waits behind
  one confirmation gate.
argument-hint: "[pr-number | url | branch] [fix]"
license: MIT
---

# Review threads

Turn a pile of review feedback into one pass: **gather -> judge -> fix -> draft
-> confirm -> reply and resolve**. The skill decides nothing on the user's behalf
remotely; everything that lands on the PR passes the gate in step 5.

**Two modes**, set by the arguments:

- **reply mode** (default): judge every thread, answer it, resolve what is
  settled. A comment that deserves a change ends as a `fix` verdict and a line in
  the report, the change itself is left to the user.
- **fix mode** (`fix` as an argument, or the user asking to fix the comments):
  the same pass, plus step 3, which writes the changes the `fix` verdicts call
  for and commits them.

**Boundaries.** Nothing leaves the machine before the gate. Local edits and
staging happen before it (they are reversible, and the gate needs the diff to be
real), commits and the push happen after it. The skill never force-pushes, never
rebases, and never touches a branch other than the PR's head.

## 0. Resolve the pull request

`<slug>` is `owner/name`, `<n>` the PR number. Run every GitHub command with
`--repo <slug>`.

- **Argument given**: a number, a PR URL or a branch name; pass it straight to
  `gh pr view`.
- **No argument**: the PR for the current branch.

```bash
gh pr view <arg> --json number,url,title,state,headRefName,isDraft,author
gh repo view --json nameWithOwner -q .nameWithOwner
```

No PR found -> stop and say so. A closed or merged PR -> report the state and ask
before touching it.

**Fix mode** needs the PR's head branch checked out and a clean tree, so the diff
it produces contains nothing but its own work:

```bash
gh pr checkout <n> --repo <slug>   # skip if already on the head branch
git status --porcelain             # must be empty
```

A dirty tree -> stop, name the files and ask; do not stash on the user's behalf.
A PR from a fork without push access -> fall back to reply mode and say so.

## 1. Gather the comments

Three sources, all of them needed:

**Review threads** (inline comments on code, the only kind that can be
resolved):

```bash
gh api graphql -f query='
  query($owner:String!, $name:String!, $number:Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        reviewThreads(first: 100) {
          nodes {
            id isResolved isOutdated path line
            comments(first: 50) {
              nodes { author { login } body createdAt url }
            }
          }
        }
      }
    }
  }' -F owner=<owner> -F name=<name> -F number=<n> \
  --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved | not)'
```

**Review bodies** (the summary a reviewer writes above the inline comments):

```bash
gh api repos/<slug>/pulls/<n>/reviews --jq '.[] | select(.body != "") | {user: .user.login, state, body}'
```

**Conversation comments** (the PR timeline; these cannot be resolved):

```bash
gh api repos/<slug>/issues/<n>/comments --jq '.[] | {user: .user.login, body, url}'
```

Filter out what is already handled: resolved threads, and threads whose last
comment is one of your own replies without a follow-up question. Keep
**outdated** threads (the code moved under them) but mark them; they are often
already fixed and only need a reply plus a resolve.

Read the diff of each thread's hunk before judging it. Do not trust the quoted
snippet in the comment, it may predate the current head.

## 2. Judge each comment

Give every thread exactly one verdict:

| Verdict | Meaning |
| --- | --- |
| `fix` | The comment is right and the code needs to change. |
| `done` | Already addressed by a later commit; only needs a reply and a resolve. |
| `explain` | The code is correct as is and the reason is not obvious from the diff. |
| `disagree` | The suggestion is wrong or makes things worse; reply with the argument, do not resolve. |
| `defer` | Valid but out of scope for this PR; belongs in an issue or a follow-up. |
| `question` | The reviewer asks something only the user can answer. |

What earns a `fix`: a real bug, a wrong or missing type, a name that misleads, a
missing test for a path the PR introduces, a security or data-loss risk. What
does not: taste that contradicts the project's own conventions, a rewrite of code
this PR only moved, a suggestion that would widen the PR's scope.

Check the suggestion against the project's `CLAUDE.md` / `AGENTS.md`, the
`.editorconfig` and the surrounding code before agreeing with it. A reviewer
who is wrong about this codebase gets a `disagree`, not a change.

**Bot reviewers** (CodeRabbit, Copilot, Sonar and friends) follow the same rules,
with one addition: a batch of nits on untouched code is one `defer` reply on the
review body, not one reply per thread.

A `question` never gets an invented answer. Put the question to the user at the
gate and only reply once they have answered.

## 3. Apply the fixes (fix mode only)

Reply mode skips this step entirely.

Work one `fix` verdict at a time, smallest first. Per thread: make the change,
keep it inside the scope the comment names, stage it, and note the `path:line`
for the reply.

- **Scope**: the change the comment asks for, nothing else. A fix that turns into
  a refactor, touches files this PR does not, or rewrites code the PR only moved
  becomes a `defer` instead; say so at the gate and leave the code alone.
- **Conventions first**: the project's `CLAUDE.md` / `AGENTS.md`, its
  `.editorconfig` and the surrounding code outrank the reviewer's phrasing. A
  suggestion written in another project's style gets the intent, not the letter.
- **Comments and tests**: follow the `code-comments` skill, and add a test when
  the project has a suite and the comment is about behavior.
- **A fix that turns out to be wrong** mid-way: revert that file
  (`git checkout -- <path>`), move the verdict to `disagree` or `question`, and
  explain it at the gate. A half-applied fix is worse than none.

After the last fix, run the project's own check (a Pest suite, the `build`
script, the linter) and show the result. A failing check does not get papered
over: revert the fix that caused it, or stop and report.

Commits are prepared but **not created** here: draft one conventional-commit
subject per thread (or one for a cluster of threads that share a fix) and show
them at the gate. `git commit` runs in step 6, after approval.

## 4. Draft the replies

One reply per thread, written before anything is sent.

- **Language**: the language of the comment, per comment, not per PR. A Dutch
  comment gets a Dutch reply even when the rest of the PR is English.
- **Attribution**: every reply says it comes from Claude. Put it on its own
  closing line, for example `_Beantwoord door Claude._` or
  `_Answered by Claude._`, and keep it identical across the run.
- **Content**: what changed and where (`path:line`, or the commit SHA once it
  exists), or why nothing changed. Two or three sentences. No thanking, no
  restating the comment, no "great catch".
- **Fix mode**: the reply names what changed and carries the commit SHA. The SHA
  only exists after step 6, so leave a `<commit>` placeholder in the draft and
  fill it in before posting.
- **Reply mode, or a `fix` nobody committed**: say what *will* change, not that
  it is done. A reply claiming a fix that is not pushed is a lie the reviewer
  acts on.

Drafts go into a scratchpad file per thread, so the body reaches `gh` without
shell escaping trouble.

## 5. Confirmation gate (mandatory)

Show one table: thread (`path:line` or "conversation"), reviewer, verdict, and
the draft reply, plus the list of what happens next:

- in fix mode, the diff of the staged work (`git diff --cached --stat`, with the
  full diff on request) and the commit subjects it becomes;
- replies to be posted, and where;
- threads to be resolved;
- commits to be pushed, including any that were already waiting
  (`git log origin/<branch>..<branch> --oneline`).

Then ask for explicit confirmation, in the user's language. Nothing before this
point touched the PR; nothing after it runs without a clear "yes". Edits asked
for -> revise the drafts and show the table again. Declined -> stop, leave the
staged changes in place, and hand back the verdicts so the work is not lost.

## 6. Post the replies, commit and push

In fix mode, commit and push first, so every reply can carry a SHA that the
reviewer can actually open:

```bash
git commit -m "<conventional-commit subject>"   # once per prepared commit
git push origin HEAD
```

Then substitute each `<commit>` placeholder with the short SHA of the commit that
carries that thread's fix.

Reply **in** the thread, never as a new top-level comment. `<comment-id>` is the
first comment of the thread, from the REST list
(`gh api repos/<slug>/pulls/<n>/comments`); GraphQL thread ids are not
interchangeable with it.

```bash
gh api repos/<slug>/pulls/<n>/comments/<comment-id>/replies -F body=@<scratchpad>/reply-<comment-id>.md
```

A review body or a conversation comment gets one PR comment instead:

```bash
gh pr comment <n> --repo <slug> --body-file <scratchpad>/reply-conversation.md
```

In reply mode, push commits that were already waiting only if the gate covered
them, and only to the PR's own head branch.

## 7. Resolve what is settled

Resolve a thread only after its reply is posted, and only for `done`, `explain`
and a `fix` whose commit is pushed. A fix that is staged but not pushed (the user
approved the replies but not the push) leaves its thread open:

```bash
gh api graphql -f query='
  mutation($threadId:ID!) {
    resolveReviewThread(input: {threadId: $threadId}) {
      thread { id isResolved }
    }
  }' -F threadId=<thread-id>
```

Leave open: `disagree` (the reviewer decides), `question` (unanswered), `defer`
(unless the user says the follow-up issue closes it), and anything the user
excluded at the gate. Resolving a thread hides it, so a thread resolved too early
costs the reviewer more than one left open.

`resolveReviewThread` needs write access on the repo. A permission error means
the account cannot resolve; report which threads stayed open and why, rather than
retrying.

## 8. Report

One short list, in the user's language: replied and resolved, replied and left
open (with the reason), skipped, and anything that still needs a code change. In
fix mode, add the commits that were pushed and the result of the project's check.
In reply mode, name the `fix` verdicts explicitly, they are the work the PR is now
waiting on.
