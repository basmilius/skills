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

const DEFAULT_ENDPOINT = 'https://dropoff.sh';

// Arguments that stand on their own rather than taking the next word.
const FLAGS = ['new', 'check', 'force', 'no-project-tag'];

const TYPES = ['doc', 'diagram', 'file'];

const options = parseArguments(process.argv.slice(2));

if (!options.file || (!options.check && (!options.type || !options.title))) {
    fail([
        'Usage: publish.ts --type <doc|diagram|file> --title <title> --file <path> [--description <text>]',
        '                  [--tags a,b] [--no-project-tag] [--path <[user/]yyyy/mm/slug>] [--new] [--force]',
        '       publish.ts --check --file <path>'
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

        console.error('See references/flow-layout.md for what every connector needs, or pass --force to publish anyway.');

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

// A doc and a diagram lead with their short URL, since that is the link worth
// sharing; the long one still follows, for a path a card or an image needs. A
// file has no short URL, so it just prints its own.
if (result.shortUrl) {
    console.log(result.shortUrl);
    console.log(`(also at ${result.url})`);
} else {
    console.log(result.url);
}

console.log(result.replaced ? '(replaced the existing page)' : '(new page)');

if (result.expiresAt) {
    console.log(`(expires ${new Date(result.expiresAt).toISOString().slice(0, 10)})`);
}

if (tags.length > 0) {
    console.log(`(tagged ${tags.join(', ')})`);
}

// A doc may come back with warnings: a card pointing at nothing yet, an unknown
// component, an unknown icon. None of them block the publish, but the author
// should hear them.
if (Array.isArray(result.warnings)) {
    for (const warning of result.warnings) {
        console.log(`(warning: ${warning})`);
    }
}

async function publishPage(): Promise<Record<string, string>> {
    return await send('publish', {
        method: 'POST',
        headers: {
            'authorization': `Bearer ${token}`,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            type: options.type,
            title: options.title,
            description: options.description,
            source,
            path: options.path,
            tags,
            new: options.new === true
        })
    });
}

async function uploadFile(): Promise<Record<string, string>> {
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

    if (project !== null) {
        wanted.unshift(project);
    }

    if (wanted.length === 0) {
        return [];
    }

    const known = await knownTags();
    const resolved = new Set<string>();

    for (const tag of wanted) {
        resolved.add(known.get(compact(tag)) ?? tag);
    }

    return [...resolved];
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
    const root = run('git', ['rev-parse', '--show-toplevel']) ?? process.cwd();
    const name = slug(basename(root));

    return name === '' ? null : name;
}

async function send(path: string, init: RequestInit): Promise<Record<string, string>> {
    const response = await fetch(`${endpoint}/api/${path}`, init);
    const result = await response.json() as Record<string, string>;

    if (!response.ok) {
        fail(`${endpoint} answered ${response.status}: ${result.error ?? 'unknown error'}`);
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
