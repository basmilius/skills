# Site menu

A mini site is one doc carrying a menu, plus the pages that menu leads to. The
menu is its own file, passed with `--menu` alongside an ordinary doc publish; the
doc's markdown stays exactly what it was. Every doc in the menu renders it as a
column beside the text, so a reader can move through the site from any page in
it.

```bash
bun ~/.claude/skills/dropoff/dropoff.ts \
  --type doc --title "Deploy guide" --file index.md --menu menu.md
```

## The grammar

A nested list of ordinary markdown links, and nothing else.

```markdown
- [Introduction](p/k3f9dqak2mn)

- Getting started
  - [Installation](p/bcdefghijkm)
  - [Configuration](p/nopqrstuvwx)

- Reference
  - [API](p/mnpqrstuvwx)
  - [Errors](p/qrstuvwxyz2)
```

- A top level item **holding a link** is an entry on its own. All of them are
  gathered into one run above the groups, wherever in the file they were written,
  so write them first if you want to read the menu the way it renders.
- A top level item **holding no link** is a group heading, and the list nested
  under it holds that group's entries.
- **Leave the index out.** The menu already opens with it, and on a first publish
  its link does not exist yet.
- Two levels, no more. A list nested under an entry is reported and ignored.
- Every entry needs its own link text: that text is the label in the menu, and it
  does not have to match the page's title. A link with no text is left out.
- The target is a path, not a URL, the same way a `::card` target is:
  `p/<code>`. Derive it from the URL the script printed by dropping the scheme
  and domain.
- Headings (`##`) are not group labels. The list is the whole grammar.

Limits: 20 groups and 100 entries. Beyond either the publish is refused rather
than truncated.

## What the host does with it

Every code is looked up under the publishing account, and the answer comes back
as counts plus warnings:

```
(menu: 7 pages, 1 not resolving yet)
(warning: "Rollback" points at qrstuvwxyz2, which is not a page of yours. It stays in the menu, greyed out.)
```

| Case | What happens |
| --- | --- |
| The page does not exist, or belongs to another account | Warned about, kept in the menu, rendered greyed out. It starts working once the page exists and the menu is published again, so publishing the menu before the pages is fine |
| The same page twice | The first mention wins, the second is warned about and dropped |
| A page already in another site's menu | Left where it is, and dropped from this menu entirely rather than greyed out, with a warning. A page belongs to one site |
| A page that has since expired or been deleted | Greyed out on its own, without the index being touched |
| A page behind a password | An ordinary entry; the gate does its work when the reader clicks it. Its own locked screen carries no menu |
| An entry that is not a doc | A link out of the site. Code, table, diff and diagram pages do not carry the column, and a file entry is a plain download |

If every entry is refused there is no site at all: the doc goes up as an ordinary
page, and the output says so rather than reporting an empty menu.

## Changing it

The menu lives with the index, so changing it means publishing that doc again:

- **With a new `--menu`**: the menu is replaced outright, and the membership with
  it. A page dropped from the menu goes back to being an ordinary page.
- **Without `--menu`**: the menu is left exactly as it was. An ordinary update to
  the index never has to repeat it.
- **With `--menu ""`**: the site is taken apart. The index and its pages stay,
  each an ordinary page again.

`--read` on the index prints the current menu among its metadata, which is what a
change should start from rather than memory.

Two things a menu does not follow:

- A **live update** (`--live --path`) only replaces the body. It never touches
  the menu, which is what keeps a ticking checklist cheap.
- The **`.md`** form of the index is its markdown alone. The menu is not in it,
  by design; read it with `--read` instead.

## When it is refused

Mini sites are a paid feature. A host that refuses answers with the code
`sites_not_available` and publishes nothing at all, so the doc is still local and
nothing was lost. Relay that to the user rather than retrying without the menu,
unless they ask for the page on its own.

Taking a site apart with `--menu ""` stays allowed on every plan, so a downgrade
never traps one.

A doc that is already an entry in another site's menu cannot become an index of
its own: the host answers 409 and publishes nothing. Take it out of that menu
first, or pick a different doc as the index.
