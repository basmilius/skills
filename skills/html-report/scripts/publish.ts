/*
 * Publishes a built report to an R2 bucket behind a custom domain under a random id, or takes it down again. The id
 * is kept in `<report>.publish.json` next to the HTML, so publishing again updates the same URL. Configured through
 * the environment; see the Publish section of SKILL.md.
 *
 *   bun publish.ts <report.html> [--unpublish]
 */
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ID_LENGTH = 11;

interface Publication {
    readonly id: string;
    readonly url: string;
    readonly publishedAt: string;
    readonly expiresAt: string | null;
}

const { values, positionals } = parseArgs({ args: Bun.argv.slice(2), allowPositionals: true, options: { unpublish: { type: 'boolean' } } });

if (positionals[0] === undefined) {
    console.error('Usage: bun publish.ts <report.html> [--unpublish]');
    process.exit(1);
}

const { HTML_REPORT_PUBLISH_ACCOUNT_ID: accountId, HTML_REPORT_PUBLISH_BUCKET: bucket, HTML_REPORT_PUBLISH_DOMAIN: domain, HTML_REPORT_PUBLISH_EXPIRY_DAYS: expiryDays } = Bun.env;

if (accountId === undefined || bucket === undefined || domain === undefined) {
    console.error('Publishing is not configured: set HTML_REPORT_PUBLISH_ACCOUNT_ID, HTML_REPORT_PUBLISH_BUCKET and HTML_REPORT_PUBLISH_DOMAIN.');
    process.exit(1);
}

const input = resolve(positionals[0]);
const sidecar = join(dirname(input), `${basename(input, extname(input))}.publish.json`);
const previous: Publication | null = existsSync(sidecar) ? await Bun.file(sidecar).json() : null;

if (values.unpublish) {
    if (previous === null) {
        console.error(`${input} is not published.`);
        process.exit(1);
    }

    await wrangler(['r2', 'object', 'delete', `${bucket}/${previous.id}`, '--remote']);
    await rm(sidecar);
    console.log(`Unpublished ${previous.url}`);
    process.exit(0);
}

if (!existsSync(input)) {
    console.error(`${input} does not exist; build the report first.`);
    process.exit(1);
}

const id = previous?.id ?? randomId();
const html = (await Bun.file(input).text()).replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex, nofollow">');
const now = new Date();

/* A short cache lifetime, so a republished report shows up within minutes without purging the zone. */
await wrangler(['r2', 'object', 'put', `${bucket}/${id}`, '--pipe', '--remote', '--content-type', 'text/html; charset=utf-8', '--cache-control', 'public, max-age=300'], new Blob([html]));

/* The bucket's lifecycle rule deletes the object; the expiry here only tells the reader when that happens. */
const publication: Publication = {
    id,
    url: `https://${domain}/${id}`,
    publishedAt: now.toISOString(),
    expiresAt: expiryDays === undefined ? null : new Date(now.getTime() + Number(expiryDays) * 86_400_000).toISOString()
};

await Bun.write(sidecar, `${JSON.stringify(publication, null, 4)}\n`);
console.log(publication.expiresAt === null ? publication.url : `${publication.url} (expires ${publication.expiresAt.slice(0, 10)})`);

function randomId(): string {
    let id = '';

    /* Bytes from 248 up are skipped, so every character of the 62 is equally likely. */
    while (id.length < ID_LENGTH) {
        for (const byte of crypto.getRandomValues(new Uint8Array(ID_LENGTH * 2))) {
            if (byte < 248 && id.length < ID_LENGTH) {
                id += ID_ALPHABET[byte % ID_ALPHABET.length];
            }
        }
    }

    return id;
}

/* Its own variable, since a CLOUDFLARE_ACCOUNT_ID in the shell would redirect wrangler in every other project. */
async function wrangler(args: string[], stdin?: Blob): Promise<void> {
    const child = Bun.spawn(['bunx', 'wrangler', ...args], {
        env: { ...Bun.env, CLOUDFLARE_ACCOUNT_ID: accountId },
        stdin: stdin ?? 'ignore',
        stdout: 'pipe',
        stderr: 'pipe'
    });

    if ((await child.exited) !== 0) {
        throw new Error(`wrangler ${args.slice(0, 3).join(' ')} failed:\n${await new Response(child.stderr).text()}`);
    }
}
