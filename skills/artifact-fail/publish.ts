#!/usr/bin/env bun
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import checkFlowGeometry from './flow-geometry';

type Options = Record<string, string | undefined> & {
    new?: boolean;
    check?: boolean;
    force?: boolean;
};

type Entry = {
    path: string;
    type: string;
    title: string;
    url: string;
    updatedAt: string;
};

// Configuration comes from the environment, so nothing about a host lives on
// disk. What is left on disk is state: which title was published where, which
// belongs under XDG_STATE_HOME rather than alongside configuration.
// Arguments that stand on their own rather than taking the next word.
const FLAGS = ['new', 'check', 'force'];

const STATE_DIRECTORY = join(process.env.XDG_STATE_HOME || join(homedir(), '.local', 'state'), 'artifact-fail');
const REGISTRY_FILE = join(STATE_DIRECTORY, 'published.json');

const options = parseArguments(process.argv.slice(2));

if (!options.file || (!options.check && (!options.type || !options.title))) {
    fail([
        'Usage: publish.ts --type <doc|diagram> --title <title> --file <path> [--description <text>] [--path <yyyy/mm/slug>] [--new] [--force]',
        '       publish.ts --check --file <path>'
    ].join('\n'));
}

if (options.type !== undefined && options.type !== 'doc' && options.type !== 'diagram') {
    fail(`Unknown type "${options.type}", expected "doc" or "diagram".`);
}

const source = read(options.file!);

if (source === null) {
    fail(`Cannot read ${options.file}.`);
}

// Nothing in Flow lays a diagram out, so a coordinate that leaves two nodes too
// close for the connector between them only shows up once the page is live.
// Checking here is the last moment it can still be fixed cheaply.
if (options.check || options.type === 'diagram') {
    const problems = checkFlowGeometry(source);

    if (problems.length > 0) {
        console.error(`${problems.length === 1 ? 'One pair of nodes sits' : `${problems.length} pairs of nodes sit`} too close together:`);

        for (const problem of problems) {
            console.error(`  ${problem}`);
        }

        console.error('See references/flow-layout.md for the spacing every connector needs, or pass --force to publish anyway.');

        if (!options.force) {
            process.exit(1);
        }
    } else if (options.check) {
        console.log('Every connector has room.');
    }

    if (options.check) {
        process.exit(0);
    }
}

const endpoint = process.env.ARTIFACT_FAIL_ENDPOINT?.trim().replace(/\/$/, '');
const token = process.env.ARTIFACT_FAIL_TOKEN?.trim();

if (!endpoint) {
    fail('ARTIFACT_FAIL_ENDPOINT is not set. It should hold the host to publish to, such as https://artifact.fail.');
}

if (!token) {
    fail('ARTIFACT_FAIL_TOKEN is not set. It should hold the bearer token the host expects.');
}

const registry = readRegistry();

// Publishing the same title again should land on the page it landed on before,
// unless a fresh URL was asked for explicitly. When a title has been split over
// several pages with --new, the most recent one is the one being worked on.
const path = options.path ?? (options.new ? undefined : findPrevious()?.path);

const response = await fetch(`${endpoint}/api/publish`, {
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
        path
    })
});

const result = await response.json() as Record<string, string>;

if (!response.ok) {
    fail(`${endpoint} answered ${response.status}: ${result.error ?? 'unknown error'}`);
}

writeRegistry([
    ...registry.filter(entry => entry.path !== result.path),
    {
        path: result.path,
        type: result.type,
        title: result.title,
        url: result.url,
        updatedAt: result.updatedAt
    }
]);

console.log(result.url);
console.log(result.replaced ? '(replaced the existing page)' : '(new page)');

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

function findPrevious(): Entry | undefined {
    return registry
        .filter(entry => entry.title === options.title && entry.type === options.type)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .at(0);
}

function readRegistry(): Entry[] {
    const contents = read(REGISTRY_FILE);

    if (contents === null) {
        return [];
    }

    try {
        return JSON.parse(contents) as Entry[];
    } catch {
        return [];
    }
}

function writeRegistry(entries: Entry[]): void {
    mkdirSync(dirname(REGISTRY_FILE), {recursive: true});
    writeFileSync(REGISTRY_FILE, `${JSON.stringify(entries, null, 4)}\n`);
}

function read(path: string): string | null {
    try {
        return readFileSync(path, 'utf8');
    } catch {
        return null;
    }
}

function fail(message: string): never {
    console.error(message);
    process.exit(1);
}
