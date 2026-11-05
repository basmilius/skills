---
name: council
description: >-
  Bring in a council of delegates from different providers, each delegated as
  a Ruimte task, to review or give feedback on the work. By default the council
  is the newest Claude Opus and the newest GPT Sol; the prompt can name other
  members. Collects their findings and scores, fixes what holds up and runs
  fresh rounds (at most three) until every delegate is satisfied. Use when the user says
  "council" or asks for a council review, a second opinion from several models,
  or a review by models of different providers together.
argument-hint: "[member models] [request]"
license: MIT
---

# Council

Delegates from different providers review the work, you weigh what they find,
fix what holds up, and run another round until they are satisfied. You stay the
owner of the work and of its scope.

## 1. Prepare the work

Before an audit, address outstanding PR comments, fix known issues and run the
relevant checks. Give the council the updated implementation; do not defer
known fixes until the reviews return. If the user wants to discard the
implementation and explore new ideas, skip fixes to code that will be replaced.

## 2. Pick the members

By default the council has two members:

| Provider (`cli`) | Pick |
| --- | --- |
| `claude` | The newest Opus |
| `codex` | The newest Sol |

The user's prompt overrides this. Members it names replace the defaults
entirely ("council with Fable and Argon" is a council of those two). A prompt
that adds to the council ("council plus Argon", "also ask Grok") keeps the
defaults and adds the named members. A named provider without a model gets
its newest flagship. Ask when the prompt leaves unclear whether it replaces
or adds.

Resolve every member to a model id from `guide` topic `models` at the time you
run the skill; never copy ids from an earlier run. Set `effort` to `high`
where the model offers it and leave it out where it does not, unless the
prompt names another effort.

If a provider has no usable model, or a named member is unavailable, report
that and stop. Do not substitute another provider or model.

## 3. Start a round

Delegate one task per member: one `agent_start` call per member in the same
turn, so the delegates run in parallel. Each call gets:

- `cli`: the member's provider
- `model` and `effort`: from step 2
- `task`: `Council round <n>: <model display name>`; the task's result returns
  to this chat and wakes you
- `prompt`: the brief below
- leave `mode` and `view` out unless the user asks for them

Each `prompt` holds the request and the context the delegate needs: the goal,
the branch or files, the PR when there is one, the checks you ran and what you
already ruled out. A prompt is at most 2000 characters, so point at files and
the diff (`git diff main...HEAD`) instead of pasting them.

For review or feedback, state in the prompt that the work is read-only: no
edits, no commits, no comments on the PR. Read-only does not mean `supervised`
mode; the instruction in the prompt is the boundary. Do not edit the files
yourself while a round runs.

For a code review, ask each delegate to end with a score out of 10 and a short
list of findings, each with file, line, severity and the change it proposes.

End your turn after delegating; do not poll. Each delegate wakes you when its
task completes. Wait until every member has reported before you weigh anything.

## 4. Weigh the results

Collect the responses and summarize:

- the findings that hold up, deduplicated across delegates
- the points where delegates disagree, with your judgment
- the findings you reject, with the reason
- the recommended next steps

Check a finding against the code before you accept it. A delegate's confidence
is no evidence.

## 5. Fix and run another round

Make the changes you agree with, run the relevant checks and start a fresh
round with new tasks for the same members. Its prompts name what changed since
the previous round and which earlier findings you rejected and why, so delegates
do not raise them again without new arguments.

Each full review pass counts as one round. Continue until all delegates are
satisfied with the outcome. Stop after three rounds, or earlier when a round
brings no new findings that hold up; report what is still open and ask the user
whether another round should follow.

Repeated reviews tend to grow the scope. Hold it to the original request. A
finding outside that request goes into the summary as a follow-up, not into the
change.

## 6. Report

For a code review, record each delegate's score per round. A delegate that
gives no score gets `no score`; never invent one.

If the work ends in a pull request, put the results in the PR description,
before the model and harness line at the end. If the PR is open, edit the
description; do not post a comment for this.

```markdown
## Council review

Rounds: 2

| Delegate | Round 1 | Round 2 |
| --- | --- | --- |
| Claude Opus 5.5 | 7/10 | 9/10 |
| GPT-6.1 Sol | 8/10 | 10/10 |
```

Without a PR, put the same table in the final reply only.

## Outside Ruimte

Without Ruimte's `agent_start`, use the harness's own subagent tools to start
one delegate per model in parallel. The rest of the skill stays the same,
including the rule to report rather than substitute a missing member.
