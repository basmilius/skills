#!/usr/bin/env bun
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import checkFlowGeometry from './flow-geometry';

type Options = Record<string, string | undefined> & {
    new?: boolean;
    check?: boolean;
    force?: boolean;
    list?: boolean;
    live?: boolean;
    done?: boolean;
    'no-project-tag'?: boolean;
};

/** What the host answers a publish or an upload with, as far as this script reads it. */
type Published = {
    readonly url: string;
    readonly shortUrl: string | null;
    readonly replaced: boolean;
    readonly expiresAt: string | null;
    readonly tags?: readonly string[];

    /** Only a doc carries these, and none of them stopped it from being published. */
    readonly warnings?: readonly string[];
};

/** One row of the account's own index, as far as this script reads it. */
type Item = {
    readonly id: string;
    readonly kind: string;
    readonly path: string;
    readonly url: string;
    readonly shortUrl: string;
    readonly title: string;
    readonly description: string | null;
    readonly tags: readonly string[];
    readonly updatedAt: string;
    readonly expiresAt: string | null;

    /** Whether readers are following this page right now. */
    readonly live?: boolean;

    /** The model the page says wrote it, or null when it says nothing. */
    readonly model?: string | null;

    /** Only a single-item read carries this, and only a file has none. */
    readonly source?: string | null;
};

/** A stored source, and whatever the host wrapped around it to render it. */
type Unwrapped = {
    readonly source: string;
    readonly language?: string;
    readonly format?: string;
};

/** What a request came back as, when the caller wants to decide about a refusal itself. */
type Sent<T> =
    | {ok: true; body: T}
    | {ok: false; status: string; code: string | null; error: string};

/** What a lookup turned up, and whether the host answered it at all. */
type Lookup = {
    readonly item: Item | null;

    /** The host said nothing, which is a different thing from there being nothing. */
    readonly failed: boolean;
};

const DEFAULT_ENDPOINT = 'https://dropoff.sh';

// The host refuses more than this many tags, so the script keeps within it rather
// than letting a publish bounce as a 400.
const MAX_TAGS = 10;

// The largest page the index serves. Nothing looks an item up by its short code,
// so a lookup pages through the list, and a bigger page is one request fewer.
const PER_PAGE = 200;

// Arguments that stand on their own rather than taking the next word. An
// argument missing from here swallows whatever follows it, so --live --path <url>
// would quietly become {live: '--path'} with the URL dropped on the floor.
const FLAGS = ['new', 'check', 'force', 'list', 'live', 'done', 'no-project-tag'];

// Arguments that take a value. Together with FLAGS this is every argument there
// is, which is what lets a typo be named rather than turned into a usage dump
// that says nothing about the word that was actually wrong.
const VALUES = [
    'type', 'title', 'file', 'description', 'tags', 'folder', 'language',
    'format', 'path', 'model', 'read', 'query', 'limit'
];

const TYPES = ['doc', 'diagram', 'file', 'code', 'table', 'diff'];

// A short code is eleven characters, drawn from an alphabet with the shapes that
// misread for one another left out: no l, no 0 and no 1.
const SHORT_CODE = /^[a-km-z2-9]{11}$/;

// Whether the host turned the live flag down, so the closing lines can say so.
// Declared up here because those lines run before the function that sets it is
// ever defined, and a let further down would still be in its dead zone.
let liveRefused = false;

const options = parseArguments(process.argv.slice(2));

if (options.type !== undefined && !TYPES.includes(options.type)) {
    fail(`Unknown type "${options.type}", expected one of ${TYPES.join(', ')}.`);
}

// The host is dropoff.sh unless something says otherwise, which is only ever a
// local worker being tested against.
const endpoint = process.env.DROPOFF_ENDPOINT?.trim().replace(/\/$/, '') || DEFAULT_ENDPOINT;
const token = process.env.DROPOFF_TOKEN?.trim();

// Reading and listing publish nothing, so they answer before the arguments a
// publish needs are asked for at all.
if (options.read !== undefined) {
    await readItem(options.read);
    process.exit(0);
}

if (options.list === true) {
    await listItems();
    process.exit(0);
}

// A live update names a page and replaces what it holds. It branches here, before
// the usage check below, because it needs neither a type nor a title: the page it
// updates already has both, and asking for them again is how a link gets moved by
// accident. Passing --live without --path is not this: that is an ordinary publish
// that happens to mark the page live, and it falls through.
if (options.path !== undefined && (options.live === true || options.done === true)) {
    await pushLiveUpdate();
    process.exit(0);
}

if (options.done === true) {
    fail('--done closes a live session on a page, so name that page with --path.');
}

if (options.live === true && options.type === 'file') {
    fail('An upload has no live updates; re-upload it with --path instead.');
}

if (!options.file || (!options.check && (!options.type || !options.title))) {
    fail([
        'Usage: dropoff.ts --type <doc|diagram|file|code|table|diff> --title <title> --file <path>',
        '                  [--description <text>] [--tags a,b] [--no-project-tag] [--folder <name>]',
        '                  [--language <lang>] [--format <csv|json>] [--path <url | p/code>] [--new] [--force]',
        '                  [--model <name>] [--live]',
        '       dropoff.ts --live --path <url | p/code> --file <path>',
        '       dropoff.ts --done --path <url | p/code> [--file <path>]',
        '       dropoff.ts --check --file <path>',
        '       dropoff.ts --read <url | p/code | code>',
        '       dropoff.ts --list [--tags a,b] [--type <kind>] [--query <text>] [--limit <n>]',
        '',
        'code needs --language (e.g. ts, python); table takes --format (csv or json, else auto);',
        'diff reads a single-file unified diff. --folder files the item under a folder (Pro).',
        '--live publishes a page readers follow and pushes updates to it (Pro); --done closes it.'
    ].join('\n'));
}

// An upload is bytes rather than text, and is read further down.
const source = options.type === 'file' ? '' : readText(options.file!);

// Nothing in Flow lays a diagram out, so a coordinate that leaves two nodes too
// close for the connector between them only shows up once the page is live.
// Checking here is the last moment it can still be fixed cheaply.
if (options.check || options.type === 'diagram') {
    const problems = checkFlowGeometry(source);

    if (problems.length > 0) {
        console.error(`${problems.length === 1 ? 'One problem' : `${problems.length} problems`} with the connectors:`);

        for (const problem of problems) {
            console.error(`  ${problem}`);
        }

        console.error('See references/diagram-layout.md for what every connector needs, or pass --force to publish anyway.');

        if (!options.force) {
            process.exit(1);
        }
    } else if (options.check) {
        console.log('Every connector has room and the right markers.');
    }

    if (options.check) {
        process.exit(0);
    }
}

if (!token) {
    fail('DROPOFF_TOKEN is not set. It should hold the bearer token the host expects.');
}

// The host keys a replacement on the short code alone and refuses every other
// shape, including the very URLs it prints, so whatever the link looked like is
// reduced to that here rather than sent on to bounce as a 400.
const target = options.path === undefined ? null : codeOrFail(options.path);

// A republish rewrites the whole row rather than patching it, so a field left out
// is a field cleared: the host stores no tags at all and a null description. The
// page about to be replaced is therefore read back first, so republishing
// something that carried tags and a description does not quietly strip both.
const replacing = await replacedItem();

// A lookup the host did not answer reads the same as a page that is not there,
// and publishing on into that is the one failure here that destroys something:
// the tags and the description go with it. Named a page outright, that is worth
// refusing over, since the page is known to exist and a retry costs nothing.
if (replacing.failed && (options.tags === undefined || options.description === undefined)) {
    if (target !== null) {
        fail(`${endpoint} would not say what is at /p/${target}, so republishing now would drop its tags and its description. Check DROPOFF_TOKEN, try again, or pass --tags and --description to set them outright.`);
    }

    console.error('(note: could not read this account back, so a page already under this title keeps none of what it carries. Check DROPOFF_TOKEN)');
}

const tags = await resolveTags(replacing.item);
const envelope = await inheritedEnvelope();
const result = options.type === 'file' ? await uploadFile() : await publishPage();

// A page leads with its short URL, since that is the link worth sharing; the
// long one still follows, for a path a card or an embed needs. A file carries a
// short URL too, but only its long one spells out the extension a markdown image
// wants, so a file leads with that instead.
if (result.shortUrl && options.type !== 'file') {
    console.log(result.shortUrl);
    console.log(`(also at ${result.url})`);
} else {
    console.log(result.url);
}

console.log(result.replaced ? '(replaced the existing page)' : '(new page)');

if (result.expiresAt) {
    console.log(`(expires ${new Date(result.expiresAt).toISOString().slice(0, 10)})`);
}

// The host is what a page is actually tagged with: it sorts them and drops
// anything that normalises away, so its list is the one to report.
const reported = result.tags ?? tags;

if (reported.length > 0) {
    console.log(`(tagged ${reported.join(', ')})`);
}

// A doc may come back with warnings: a card pointing at nothing yet, an unknown
// component, an unknown icon. None of them block the publish, but the author
// should hear them.
for (const warning of result.warnings ?? []) {
    console.log(`(warning: ${warning})`);
}

// Said last, because it is about the publish rather than about the page: the
// document went up either way, and only the following-along part did not.
if (liveRefused) {
    console.log('(note: live pages are a paid feature on this host, so this went up as an ordinary page)');
} else if (options.live === true) {
    console.log('(live: readers follow this page until you pass --done)');
}

/**
 * Pushes a new version of a page that already exists, and nothing else. This is
 * the cheap path: it takes the host's live route, which leaves the short code,
 * the slug, the expiry, the tags and the folder exactly as they were, and it
 * skips every lookup a republish needs to avoid clearing those. One request,
 * where a --path republish costs two to four.
 *
 * That is what makes it usable step by step. Ticking a checklist through an
 * afternoon over the publish route would re-read the page, re-resolve its tags
 * and push its expiry forward on every tick; here nothing moves but the source.
 */
async function pushLiveUpdate(): Promise<void> {
    const done = options.done === true;

    for (const [argument, why] of [
        ['tags', 'does not touch tags'],
        ['no-project-tag', 'does not touch tags'],
        ['folder', 'does not move a page between folders'],
        ['new', 'never starts a second page']
    ] as const) {
        if (options[argument] !== undefined) {
            fail(`A live update ${why}. Drop --live to republish the page in full, which does.`);
        }
    }

    if (options.file === undefined && !done) {
        fail('A live update needs --file, or --done on its own to close the session.');
    }

    if (!token) {
        fail('DROPOFF_TOKEN is not set. It should hold the bearer token the host expects.');
    }

    const code = codeOrFail(options.path!);
    const source = options.file === undefined ? undefined : readText(options.file);

    const result = await trySend<Published>('live', {
        method: 'POST',
        headers: {
            'authorization': `Bearer ${token}`,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            path: code,
            source,
            title: options.title,
            description: options.description,
            language: options.language,
            format: options.format,
            type: options.type,
            model: modelLabel(),
            done
        })
    });

    if (!result.ok) {
        // A plan that lapsed mid-session is worth saying plainly rather than
        // falling back on: a full republish would work, but it would also reset
        // the expiry, which is a different thing than what was asked for.
        if (result.code === 'live_not_available') {
            fail(`${endpoint} answered 402: ${result.error} The page is still there; republish it with --path (without --live) to update it in full.`);
        }

        fail(`${endpoint} answered ${result.status}: ${result.error}`);
    }

    // Two lines, deliberately. This command comes round ten times in a session
    // and the link is not news any of those times; reporting it again after each
    // one buries the work it is meant to be showing.
    console.log(result.body.shortUrl ?? result.body.url);
    console.log(options.file === undefined ? '(live session closed)' : '(live update)');

    if (done && options.file !== undefined) {
        console.log('(live session closed)');
    }

    for (const warning of result.body.warnings ?? []) {
        console.log(`(warning: ${warning})`);
    }
}

/**
 * The model that wrote this, as the caller named it. There is no way to work it
 * out: a Claude Code session carries CLAUDECODE and AI_AGENT, which say which
 * harness is running, and nothing at all that names the model. So it is passed
 * in or it is left out, and a guess is worse than nothing, because a made-up
 * name in a page footer reads exactly as authoritative as a real one.
 */
function modelLabel(): string | undefined {
    const named = options.model?.trim()
        || process.env.DROPOFF_MODEL?.trim()
        || process.env.ANTHROPIC_MODEL?.trim();

    return named || undefined;
}

async function publishPage(): Promise<Published> {
    const result = await publishRequest(options.live === true);

    if (result.ok) {
        return result.body;
    }

    // The one retry in this script, and it earns its place: the document is
    // written and would otherwise be lost to a plan limit that has nothing to do
    // with it. It goes on the code rather than on the status, because the other
    // 402 a publish can hit is the item limit, and retrying that one would
    // publish in a loop.
    if (result.code === 'live_not_available') {
        const plain = await publishRequest(false);

        if (plain.ok) {
            liveRefused = true;

            return plain.body;
        }
    }

    return fail(`${endpoint} answered ${result.status}: ${result.error}`);
}

function publishRequest(live: boolean): Promise<Sent<Published>> {
    return trySend<Published>('publish', {
        method: 'POST',
        headers: {
            'authorization': `Bearer ${token}`,
            'content-type': 'application/json'
        },
        // JSON.stringify drops the undefined ones, so an argument that was not
        // passed simply never reaches the body.
        body: JSON.stringify({
            type: options.type,
            title: options.title,
            description: options.description ?? replacing.item?.description ?? undefined,
            source,
            path: target ?? undefined,
            tags,
            new: options.new === true,
            language: options.language ?? envelope?.language,
            format: options.format ?? envelope?.format,
            folder: options.folder,
            model: modelLabel(),
            live: live ? true : undefined
        })
    });
}

async function uploadFile(): Promise<Published> {
    const query = new URLSearchParams({
        filename: basename(options.file!),
        title: options.title!
    });

    const description = options.description ?? replacing.item?.description;

    if (description) {
        query.set('description', description);
    }

    if (target !== null) {
        query.set('path', target);
    }

    if (options.folder) {
        query.set('folder', options.folder);
    }

    if (tags.length > 0) {
        query.set('tags', tags.join(','));
    }

    return await send<Published>(`upload?${query}`, {
        method: 'POST',
        headers: {
            'authorization': `Bearer ${token}`
        },
        body: readBytes(options.file!)
    });
}

/**
 * Prints what was published at a link, so a page can be continued rather than
 * rewritten from memory. The account's own pages come back whole, source and all,
 * whatever their type. A link belonging to someone else is still readable when it
 * is a doc, since the host serves every doc's markdown publicly.
 */
async function readItem(target: string): Promise<void> {
    const code = shortCodeOf(target);

    if (code === null) {
        fail(`"${target}" does not name an item. Pass its URL, its /p/<code> short link, or the code itself.`);
    }

    const own = token ? await itemByCode(code) : {item: null, failed: false};

    // Here the lookup is the operation rather than a convenience beside it, so a
    // host that will not answer has to say so. Reported as a miss it would read as
    // somebody else's link, which is a different thing entirely.
    if (own.failed) {
        fail(`${endpoint} would not say what this account holds. Check DROPOFF_TOKEN, or try again.`);
    }

    if (own.item === null) {
        return await readPublicMarkdown(code);
    }

    const item = await send<Item>(`items/${own.item.id}`, {
        headers: {authorization: `Bearer ${token}`}
    });

    // What the page is goes beside the source rather than into it, so redirecting
    // this to a file captures what was published and nothing else. Both still reach
    // a terminal, which is the only place the two are read together.
    const content = item.source === null || item.source === undefined ? null : unwrap(item.kind, item.source);

    console.error(`(title: ${item.title})`);
    console.error(`(type: ${item.kind})`);

    // A code page needs its language back and a table its format, and neither is
    // anywhere else in the output.
    if (content?.language) {
        console.error(`(language: ${content.language})`);
    }

    if (content?.format) {
        console.error(`(format: ${content.format})`);
    }

    if (item.description) {
        console.error(`(description: ${item.description})`);
    }

    if (item.tags.length > 0) {
        console.error(`(tagged ${item.tags.join(', ')})`);
    }

    if (item.model) {
        console.error(`(model: ${item.model})`);
    }

    // Worth knowing before republishing over it: somebody has this page open, and
    // the session behind it is still somebody's to close.
    if (item.live) {
        console.error('(live: readers are following this page, and the session is still open)');
    }

    console.error(`(at ${item.shortUrl}, updated ${item.updatedAt.slice(0, 10)})`);

    if (item.expiresAt) {
        console.error(`(expires ${item.expiresAt.slice(0, 10)})`);
    }

    // An upload has no source to hand back: its bytes are its own URL, which is
    // where anything that wants them should go.
    if (content === null) {
        console.error(`(a file keeps no source; its bytes are at ${item.url})`);
        return;
    }

    // The source goes out exactly as it came in, so what is captured can be
    // published straight back. console.log would add a newline the source already
    // ends with, which is a difference the next republish would keep.
    console.error('');
    process.stdout.write(content.source);
}

/**
 * The markdown of a page this account does not own, which is all the host offers
 * without a token. It is a doc or it is nothing, so the three ways it can fail
 * are each worth their own sentence.
 */
async function readPublicMarkdown(code: string): Promise<void> {
    const response = await fetch(`${endpoint}/p/${code}.md`);

    if (response.status === 401) {
        fail(`The page at ${endpoint}/p/${code} is password protected, so its source cannot be read here.`);
    }

    if (!response.ok) {
        fail(token
            ? `Nothing of yours at ${endpoint}/p/${code}, and it is not a public doc either.`
            : `Nothing readable at ${endpoint}/p/${code}. Only a doc serves its markdown, and DROPOFF_TOKEN is not set to read anything else.`);
    }

    console.error(token
        ? '(not one of this account\'s pages, so this is its published markdown and nothing else)'
        : '(no token, so this is the published markdown and nothing else)');
    console.error('');
    process.stdout.write(await response.text());
}

/**
 * The account's own pages, newest change first, since the one being looked for is
 * nearly always the one last worked on. The same filters the dashboard offers
 * narrow it down: a tag, a type, or a word from the title or the description.
 */
async function listItems(): Promise<void> {
    if (!token) {
        fail('DROPOFF_TOKEN is not set. It should hold the bearer token the host expects.');
    }

    const query = new URLSearchParams({sort: 'updated', direction: 'desc'});

    query.set('perPage', String(Math.min(Number(options.limit) || 25, PER_PAGE)));

    if (options.type) {
        query.set('kind', options.type);
    }

    if (options.query) {
        query.set('q', options.query);
    }

    // Every named tag has to be present, so a second one narrows the list rather
    // than widening it, which is why they go out as separate parameters.
    for (const tag of (options.tags ?? '').split(',').map(tag => slug(tag)).filter(tag => tag !== '')) {
        query.append('tag', tag);
    }

    const page = await send<{items: Item[]; total: number}>(`items?${query}`, {
        headers: {authorization: `Bearer ${token}`}
    });

    if (page.items.length === 0) {
        console.log('Nothing matches.');
        return;
    }

    for (const item of page.items) {
        const tags = item.tags.length > 0 ? `  (${item.tags.join(', ')})` : '';

        console.log(`${item.shortUrl}  ${item.kind.padEnd(7)}  ${item.updatedAt.slice(0, 10)}  ${item.title}${tags}`);
    }

    console.log(`(${page.items.length} of ${page.total})`);
}

/**
 * The page this publish is about to land on, which the host works out from the
 * path or, failing that, from the title and the type. The same answer is worked
 * out here so a replacement can carry over what the command did not mention.
 */
async function replacedItem(): Promise<Lookup> {
    if (target !== null) {
        return await itemByCode(target);
    }

    // An upload without a path is always a new item, whatever it is called, and a
    // page asked for outright is new by definition.
    if (options.type === 'file' || options.new === true || options.title === undefined) {
        return {item: null, failed: false};
    }

    return await itemByTitle(options.type!, options.title.trim());
}

/** The item a short code names, with everything the host knows about it bar its source. */
function itemByCode(code: string): Promise<Lookup> {
    return findItem(new URLSearchParams(), item => shortCodeOf(item.path) === code);
}

/**
 * The page a publish without a path lands on. The host trims the title, matches
 * it and the type exactly, skips anything that has expired and takes the most
 * recently changed of what is left, so that is what is repeated here.
 */
function itemByTitle(kind: string, title: string): Promise<Lookup> {
    const filters = new URLSearchParams({kind, q: title, sort: 'updated', direction: 'desc'});

    return findItem(filters, item => item.title === title && !expired(item));
}

/**
 * The first item in the index that `matches`, paged through until it turns up or
 * the list runs out. Nothing looks an item up by its code or by an exact title,
 * so both go the same way round; a search narrow enough to fit one page costs one
 * request.
 */
async function findItem(filters: URLSearchParams, matches: (item: Item) => boolean): Promise<Lookup> {
    filters.set('perPage', String(PER_PAGE));

    for (let page = 1; ; page++) {
        filters.set('page', String(page));

        const body = await fetchJson<{items: Item[]; total: number}>(`items?${filters}`);

        if (body === null) {
            return {item: null, failed: true};
        }

        const found = body.items.find(matches);

        if (found !== undefined) {
            return {item: found, failed: false};
        }

        if (body.items.length === 0 || page * PER_PAGE >= body.total) {
            return {item: null, failed: false};
        }
    }
}

/**
 * A GET whose answer is a convenience on top of the operation that was asked for.
 * A host that will not answer it leaves it undone rather than stopping a publish
 * that would otherwise have gone through.
 */
async function fetchJson<T>(path: string): Promise<T | null> {
    try {
        const response = await fetch(`${endpoint}/api/${path}`, {
            headers: {authorization: `Bearer ${token}`}
        });

        return response.ok ? await response.json() as T : null;
    } catch {
        return null;
    }
}

/** An expired page reads as absent to the host, so it is never what gets replaced. */
function expired(item: Item): boolean {
    return item.expiresAt !== null && Date.parse(item.expiresAt) <= Date.now();
}

/** The code behind a link, or a refusal naming the shapes that would have worked. */
function codeOrFail(value: string): string {
    const code = shortCodeOf(value);

    if (code === null) {
        fail(`"${value}" does not name a page. Pass its URL, its /p/<code> short link, or the code itself.`);
    }

    return code;
}

/**
 * The short code behind whatever was handed over: a full URL, the canonical
 * /p/<code>/<slug> path, the /p/<code> short link, or the bare code, with or
 * without the .md a markdown link carries. Every one of those shapes gets pasted
 * at some point, and the host takes only the last of them.
 */
function shortCodeOf(target: string): string | null {
    const segments = target
        .trim()
        .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
        .replace(/[?#].*$/, '')
        .replace(/^\/+|\/+$/g, '')
        .split('/');

    // Everything published lives under /p/, so the segment after it is the code
    // wherever the link was cut off. Without one, the whole thing is the code.
    const index = segments.indexOf('p');
    const code = (index === -1 ? segments[0] : segments[index + 1])?.replace(/\.[a-z0-9]{1,8}$/i, '');

    return code !== undefined && SHORT_CODE.test(code) ? code : null;
}

/**
 * The source as it was handed to the script that published it, and the one thing
 * about it that lives nowhere else. A doc and a diagram are stored as written;
 * the other three are wrapped in a small envelope carrying what the renderer
 * needs, and it is the payload inside that a round trip should get back.
 */
function unwrap(kind: string, source: string): Unwrapped {
    if (kind === 'doc' || kind === 'diagram') {
        return {source};
    }

    try {
        const envelope = JSON.parse(source) as {code?: string; language?: string; data?: string; format?: string; patch?: string};

        if (envelope.code !== undefined) {
            return {source: envelope.code, language: envelope.language};
        }

        if (envelope.data !== undefined) {
            return {source: envelope.data, format: envelope.format};
        }

        if (envelope.patch !== undefined) {
            return {source: envelope.patch};
        }
    } catch {
        // Not an envelope after all, so the stored bytes are the source themselves.
    }

    return {source};
}

/**
 * What a code or a table page carries beside its source: the language the host
 * insists on every single time, and the format it would otherwise go back to
 * guessing at. Neither is in a listing, so the page is read for them rather than
 * a republish being made to name what has not changed.
 */
async function inheritedEnvelope(): Promise<Unwrapped | null> {
    const missing = (options.type === 'code' && options.language === undefined)
        || (options.type === 'table' && options.format === undefined);

    if (!missing || replacing.item === null) {
        return null;
    }

    const full = await fetchJson<Item>(`items/${replacing.item.id}`);

    return full?.source ? unwrap(options.type!, full.source) : null;
}

/**
 * The tags this publish carries: what was asked for, plus the project it was run
 * in. A tag is only worth having if the same idea always spells the same way, so
 * anything that matches a tag the host already knows takes that spelling rather
 * than introducing a near-duplicate next to it.
 *
 * Replacing a page that already carried tags, and naming none, keeps the ones it
 * had. Passing `--tags` still replaces them outright, and `--tags ""` is how a
 * page is deliberately left with none.
 */
async function resolveTags(replacing: Item | null): Promise<string[]> {
    // A replacement that names no tags keeps exactly the ones the page had. The
    // project tag stays out of that: adding it would tag a page that never carried
    // it, purely because this republish happened to be run somewhere else.
    const inherited = options.tags === undefined && replacing !== null;

    const wanted = (options.tags ?? replacing?.tags?.join(',') ?? '')
        .split(',')
        .map(tag => slug(tag))
        .filter(tag => tag !== '');

    // Asking for no tags is a statement rather than an omission, so the project tag
    // yields to it as well and `--tags ""` leaves a page with none rather than one.
    const cleared = options.tags !== undefined && wanted.length === 0;

    const project = inherited || cleared || options['no-project-tag'] === true ? null : projectTag();

    if (wanted.length === 0 && project === null) {
        return [];
    }

    const known = await knownTags();
    const spell = (tag: string): string => known.get(compact(tag)) ?? tag;

    // The user's own tags come first and unique, spelled the way the host already
    // knows them so a near-duplicate collapses onto the existing spelling.
    const resolved: string[] = [];

    for (const tag of wanted) {
        const spelled = spell(tag);

        if (!resolved.includes(spelled)) {
            resolved.push(spelled);
        }
    }

    // The project tag is a convenience the user did not ask for, so it yields the
    // last slot rather than taking it: added only when the user's own tags left
    // room, and dropped with a note when they already filled all ten.
    if (project !== null) {
        const spelled = spell(project);
        const present = resolved.includes(spelled);

        if (!present && resolved.length < MAX_TAGS) {
            resolved.push(spelled);
        } else if (!present) {
            console.error(`(note: left the project tag "${spelled}" off, already at the ${MAX_TAGS}-tag limit)`);
        }
    }

    // A user who passed more than ten tags themselves would trip the same limit, so
    // the list is capped either way rather than handed on to be refused.
    if (resolved.length > MAX_TAGS) {
        console.error(`(note: kept the first ${MAX_TAGS} tags, the host allows no more)`);
    }

    return resolved.slice(0, MAX_TAGS);
}

async function knownTags(): Promise<Map<string, string>> {
    const body = await fetchJson<{tags: {tag: string}[]}>('tags');

    return new Map((body?.tags ?? []).map(entry => [compact(entry.tag), entry.tag]));
}

/**
 * The repository this was run in, which is nearly always the thing the page is
 * about. It makes everything published while working on one project findable
 * together without anyone having to remember to say so.
 */
function projectTag(): string | null {
    const root = run('git', ['rev-parse', '--show-toplevel']);

    // Run from outside a repository there is no project to name, and the working
    // directory is as likely to be the temporary folder the content was written
    // to as anything else. A tag reading "scratchpad" names nothing and would sit
    // beside the real ones for good, so nothing is added at all.
    if (root === null) {
        return null;
    }

    const name = slug(basename(root));

    return name === '' ? null : name;
}

/**
 * The same request, with the refusal handed back as a value instead of ending the
 * run. Only a caller that has something else to try needs this; everything else
 * goes through send, which is this with the refusal turned into the one-line exit
 * every other failure gets, so the wording lives in one place.
 */
async function trySend<T>(path: string, init: RequestInit = {}): Promise<Sent<T>> {
    let response: Response;

    // A host that cannot be reached at all, a DNS failure or a refused connection,
    // throws rather than answering, and a stack trace is no use to whoever asked
    // for a page. It becomes the same one-line refusal every other failure gets.
    try {
        response = await fetch(`${endpoint}/api/${path}`, init);
    } catch (error) {
        return fail(`${endpoint} could not be reached: ${error instanceof Error ? error.message : String(error)}`);
    }

    const body = await response.text();

    // The edge can answer a 5xx with an HTML page rather than JSON, so the body is
    // read as text first and parsed defensively: a failed parse leaves an empty
    // result and the status below carries the message, not an uncaught TypeError.
    let result = {} as T & {error?: string; code?: string};

    try {
        result = JSON.parse(body) as T & {error?: string; code?: string};
    } catch {
        // Not JSON; the status is what the caller gets told about instead.
    }

    if (response.ok) {
        return {ok: true, body: result};
    }

    // A rate limit says when to come back in a header rather than the body, so
    // it is surfaced next to the status when it is there. Retry-After is either
    // a number of seconds or an HTTP date, and only the former gets a unit.
    const retryAfter = response.status === 429 ? response.headers.get('retry-after') : null;
    const when = retryAfter === null
        ? ''
        : `, retry after ${/^\d+$/.test(retryAfter) ? `${retryAfter}s` : retryAfter}`;

    return {
        ok: false,
        status: `${response.status}${when}`,
        code: result.code ?? null,
        error: result.error ?? 'unknown error'
    };
}

async function send<T>(path: string, init: RequestInit = {}): Promise<T> {
    const result = await trySend<T>(path, init);

    if (!result.ok) {
        fail(`${endpoint} answered ${result.status}: ${result.error}`);
    }

    return result.body;
}

function parseArguments(argv: string[]): Options {
    const parsed: Record<string, string | boolean | undefined> = {};

    for (let index = 0; index < argv.length; index++) {
        const argument = argv[index];

        if (!argument.startsWith('--')) {
            continue;
        }

        const name = argument.slice(2);

        if (FLAGS.includes(name)) {
            parsed[name] = true;
            continue;
        }

        if (!VALUES.includes(name)) {
            fail(`Unknown argument "${argument}".`);
        }

        parsed[name] = argv[++index];
    }

    return parsed as Options;
}

function slug(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 32)
        .replace(/-+$/g, '');
}

/** A tag stripped to what it means, so `auth-flow` and `authflow` compare equal. */
function compact(value: string): string {
    return value.replace(/[^a-z0-9]/g, '');
}

function run(command: string, args: string[]): string | null {
    const result = Bun.spawnSync([command, ...args], {stderr: 'ignore'});

    return result.success ? result.stdout.toString().trim() : null;
}

function readText(path: string): string {
    try {
        return readFileSync(path, 'utf8');
    } catch {
        return fail(`Cannot read ${path}.`);
    }
}

function readBytes(path: string): Buffer {
    try {
        return readFileSync(path);
    } catch {
        return fail(`Cannot read ${path}.`);
    }
}

function fail(message: string): never {
    console.error(message);
    process.exit(1);
}
