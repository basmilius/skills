#!/usr/bin/env bun
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import checkFlowGeometry from './flow-geometry';

type Options = Record<string, string | undefined> & {
    new?: boolean;
    check?: boolean;
    force?: boolean;
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

    /** Present instead of everything above when the host refused. */
    readonly error?: string;
};

const DEFAULT_ENDPOINT = 'https://dropoff.sh';

// The host refuses more than this many tags, so the script keeps within it rather
// than letting a publish bounce as a 400.
const MAX_TAGS = 10;

// Arguments that stand on their own rather than taking the next word.
const FLAGS = ['new', 'check', 'force', 'no-project-tag'];

const TYPES = ['doc', 'diagram', 'file', 'code', 'table', 'diff'];

const options = parseArguments(process.argv.slice(2));

if (!options.file || (!options.check && (!options.type || !options.title))) {
    fail([
        'Usage: publish.ts --type <doc|diagram|file|code|table|diff> --title <title> --file <path>',
        '                  [--description <text>] [--tags a,b] [--no-project-tag] [--folder <name>]',
        '                  [--language <lang>] [--format <csv|json>] [--path <url | p/code>] [--new] [--force]',
        '       publish.ts --check --file <path>',
        '',
        'code needs --language (e.g. ts, python); table takes --format (csv or json, else auto);',
        'diff reads a single-file unified diff. --folder files the item under a folder (Pro).'
    ].join('\n'));
}

if (options.type !== undefined && !TYPES.includes(options.type)) {
    fail(`Unknown type "${options.type}", expected one of ${TYPES.join(', ')}.`);
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

// The host is dropoff.sh unless something says otherwise, which is only ever a
// local worker being tested against.
const endpoint = process.env.DROPOFF_ENDPOINT?.trim().replace(/\/$/, '') || DEFAULT_ENDPOINT;
const token = process.env.DROPOFF_TOKEN?.trim();

if (!token) {
    fail('DROPOFF_TOKEN is not set. It should hold the bearer token the host expects.');
}

const tags = await resolveTags();
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

async function publishPage(): Promise<Published> {
    return await send('publish', {
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
            description: options.description,
            source,
            path: options.path,
            tags,
            new: options.new === true,
            language: options.language,
            format: options.format,
            folder: options.folder
        })
    });
}

async function uploadFile(): Promise<Published> {
    const query = new URLSearchParams({
        filename: basename(options.file!),
        title: options.title!
    });

    if (options.description) {
        query.set('description', options.description);
    }

    if (options.path) {
        query.set('path', options.path);
    }

    if (options.folder) {
        query.set('folder', options.folder);
    }

    if (tags.length > 0) {
        query.set('tags', tags.join(','));
    }

    return await send(`upload?${query}`, {
        method: 'POST',
        headers: {
            'authorization': `Bearer ${token}`
        },
        body: readBytes(options.file!)
    });
}

/**
 * The tags this publish carries: what was asked for, plus the project it was run
 * in. A tag is only worth having if the same idea always spells the same way, so
 * anything that matches a tag the host already knows takes that spelling rather
 * than introducing a near-duplicate next to it.
 */
async function resolveTags(): Promise<string[]> {
    const wanted = (options.tags ?? '')
        .split(',')
        .map(tag => slug(tag))
        .filter(tag => tag !== '');

    const project = options['no-project-tag'] === true ? null : projectTag();

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
    try {
        const response = await fetch(`${endpoint}/api/tags`, {
            headers: {authorization: `Bearer ${token}`}
        });

        if (!response.ok) {
            return new Map();
        }

        const body = await response.json() as {tags: {tag: string}[]};

        return new Map(body.tags.map(entry => [compact(entry.tag), entry.tag]));
    } catch {
        return new Map();
    }
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

async function send(path: string, init: RequestInit): Promise<Published> {
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
    let result = {} as Published;

    try {
        result = JSON.parse(body) as Published;
    } catch {
        // Not JSON; the status is what the caller gets told about instead.
    }

    if (!response.ok) {
        // A rate limit says when to come back in a header rather than the body, so
        // it is surfaced next to the status when it is there. Retry-After is either
        // a number of seconds or an HTTP date, and only the former gets a unit.
        const retryAfter = response.status === 429 ? response.headers.get('retry-after') : null;
        const when = retryAfter === null
            ? ''
            : `, retry after ${/^\d+$/.test(retryAfter) ? `${retryAfter}s` : retryAfter}`;

        fail(`${endpoint} answered ${response.status}${when}: ${result.error ?? 'unknown error'}`);
    }

    return result;
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
