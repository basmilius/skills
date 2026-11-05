import { Callout, Card, Figure, Figures, Intro, Lead, Report, Section, Status, Step, Steps, formatNumber } from 'html-report';
import { ChevronRight } from 'lucide-react';

type Lang = 'nl' | 'en';
type Severity = 'blocking' | 'important' | 'minor';

type Pr = {
    readonly repo: string;
    readonly number: number;
    readonly additions: number;
    readonly deletions: number;
    readonly files: number;
    readonly score: number;
    readonly note: string;
};

type Finding = {
    readonly severity: Severity;
    readonly text: string;
    readonly verified?: boolean;
};

type Review = {
    readonly date: string;
    readonly verdict: string;
    readonly findings: readonly Finding[];
    readonly good: string;
    readonly test: readonly string[];
};

type Bundle = {
    readonly issue: string;
    readonly title: string;
    readonly what: string;
    readonly how: string;
    readonly prs: readonly Pr[];
    readonly feedbackOpen?: boolean;
    readonly review?: Review;
    readonly merged?: string;
};

// Fill in from here: language, header, bundles. Everything below the bundles renders them.

const lang: Lang = 'en';
const title = 'Open pull requests';
const kind = 'PR overview';
const model = 'Claude Opus 5.5';
const updated = 'updated 5 November 2026, 14:10';
const scope = 'acme/backend and acme/frontend';
const brand = { name: 'Acme', color: '#4f46e5' };

const bundles: Bundle[] = [
    {
        issue: 'ABC-123',
        title: 'sign out a deactivated account on its next request',
        what: 'A signed-in user could keep working after the account was deactivated.',
        how: 'The token provider checks on every request, straight from the database, whether the account may still sign in.',
        prs: [
            { repo: 'acme/backend', number: 42, additions: 276, deletions: 16, files: 7, score: 4, note: 'one open thread about a method name.' }
        ],
        review: {
            date: '5 November',
            verdict: 'not mergeable while the open thread is unresolved. The core is correct.',
            findings: [
                { severity: 'important', text: 'The reviewer asks to rename the repository method to `findByToken` (`SessionRepository.php:49`).' },
                { severity: 'minor', text: 'The extra query per request uses primary keys only; an index on `account_id` is assumed.', verified: false }
            ],
            good: 'the rule matches the login check and bypasses the second-level cache.',
            test: [
                'Deactivate a signed-in account: the next request returns a 401.'
            ]
        }
    }
];

const text = {
    nl: {
        what: 'Wat',
        how: 'Hoe',
        good: 'In orde',
        test: 'Testplan',
        verdict: 'Oordeel na review',
        assumed: 'aanname, niet nagelopen',
        notApplicable: 'n.v.t.',
        lines: 'gewijzigde regels',
        files: 'bestanden',
        issue: 'Issue',
        size: 'Grootte',
        score: 'Score',
        status: 'Status',
        severity: { blocking: 'blokkerend', important: 'belangrijk', minor: 'klein' },
        state: { open: 'Nog te reviewen', feedback: 'Feedback open', reviewed: 'Gereviewd', merged: 'Gemerged' },
        scoreLabel: { 1: 'Niet mergebaar', 2: 'Eerst feedback verwerken', 3: 'Grondige review nodig', 4: 'Bijna klaar', 5: 'Klaar voor review' }
    },
    en: {
        what: 'What',
        how: 'How',
        good: 'Fine',
        test: 'Test plan',
        verdict: 'Verdict after review',
        assumed: 'assumed, not verified',
        notApplicable: 'n/a',
        lines: 'changed lines',
        files: 'files',
        issue: 'Issue',
        size: 'Size',
        score: 'Score',
        status: 'Status',
        severity: { blocking: 'blocking', important: 'important', minor: 'minor' },
        state: { open: 'To review', feedback: 'Feedback open', reviewed: 'Reviewed', merged: 'Merged' },
        scoreLabel: { 1: 'Not mergeable', 2: 'Address feedback first', 3: 'Needs a thorough review', 4: 'Nearly there', 5: 'Ready for review' }
    }
}[lang];

const scoreColors: Record<number, string> = {
    1: 'var(--color-error, #d4380d)',
    2: 'var(--color-error, #d4380d)',
    3: 'var(--color-warning, #d48806)',
    4: 'var(--color-success, #389e0d)',
    5: 'var(--color-success, #389e0d)'
};

const severityTones: Record<Severity, 'error' | 'warn' | 'muted'> = {
    blocking: 'error',
    important: 'warn',
    minor: 'muted'
};

const hairline = 'color-mix(in srgb, currentColor 12%, transparent)';
const columns = '18px minmax(0, 1fr) 56px 52px 128px';

const overviewCss = `
.bundle > summary { list-style: none; cursor: pointer; }
.bundle > summary::-webkit-details-marker { display: none; }
.bundle > summary:hover { background: color-mix(in srgb, currentColor 4%, transparent); }
.bundle .chevron { transition: transform 120ms ease; }
.bundle[open] .chevron { transform: rotate(90deg); }
`;

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function rich(value: string) {
    return value.split('`').map((part, index) => index % 2 === 1 ? <code key={index}>{part}</code> : part);
}

function changedLines(pr: Pr): number {
    return pr.additions + pr.deletions;
}

function sizeLabel(lines: number): string {
    if (lines < 100) {
        return 'XS';
    }

    if (lines < 400) {
        return 'S';
    }

    if (lines < 1500) {
        return 'M';
    }

    if (lines < 5000) {
        return 'L';
    }

    return 'XL';
}

function scoreCap(bundle: Bundle): number {
    const findings = bundle.review?.findings ?? [];

    if (findings.some((finding) => finding.severity === 'blocking')) {
        return 2;
    }

    if (findings.some((finding) => finding.severity === 'important')) {
        return 3;
    }

    return 5;
}

function prScore(bundle: Bundle, pr: Pr): number {
    return Math.min(pr.score, scoreCap(bundle));
}

function bundleScore(bundle: Bundle): number {
    return Math.min(...bundle.prs.map((pr) => prScore(bundle, pr)));
}

function bundleLines(bundle: Bundle): number {
    return bundle.prs.reduce((total, pr) => total + changedLines(pr), 0);
}

function bundleState(bundle: Bundle): { order: number; label: string; tone: 'ok' | 'accent' | 'warn' | 'muted' } {
    if (bundle.merged) {
        return { order: 2, label: text.state.merged, tone: 'ok' };
    }

    if (bundle.review) {
        return { order: 1, label: text.state.reviewed, tone: 'accent' };
    }

    if (bundle.feedbackOpen) {
        return { order: 0, label: text.state.feedback, tone: 'warn' };
    }

    return { order: 0, label: text.state.open, tone: 'muted' };
}

function verdictTone(review: Review): 'error' | 'attention' | 'neutral' {
    if (review.findings.some((finding) => finding.severity === 'blocking')) {
        return 'error';
    }

    if (review.findings.some((finding) => finding.severity === 'important')) {
        return 'attention';
    }

    return 'neutral';
}

function ScoreBars({ score }: { score: number }) {
    const label = text.scoreLabel[score as 1 | 2 | 3 | 4 | 5];

    return (
        <span role="img" aria-label={`${text.score} ${score}/5: ${label}`} title={`${score}/5 · ${label}`} style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map((index) => (
                <span
                    key={index}
                    style={{
                        display: 'inline-block',
                        width: 8,
                        height: 4,
                        borderRadius: 1,
                        background: index <= score ? scoreColors[score] : 'color-mix(in srgb, currentColor 15%, transparent)'
                    }}
                />
            ))}
        </span>
    );
}

function Size({ lines }: { lines: number }) {
    const label = sizeLabel(lines);
    const tone = label === 'XL' ? 'error' : label === 'L' ? 'warn' : 'muted';

    return <span title={`${formatNumber(lines)} ${text.lines}`}><Status tone={tone}>{label}</Status></span>;
}

function PrLine({ bundle, pr }: { bundle: Bundle; pr: Pr }) {
    const name = pr.repo.split('/').at(-1);
    const size = `${sizeLabel(changedLines(pr))}, +${formatNumber(pr.additions)}/-${formatNumber(pr.deletions)}, ${pr.files} ${text.files}, ${prScore(bundle, pr)}/5`;

    return (
        <li>
            <a href={`https://github.com/${pr.repo}/pull/${pr.number}`}>{name}#{pr.number}</a> <span className="report-muted">({size})</span>: {rich(pr.note)}
        </li>
    );
}

function ReviewBlock({ review }: { review: Review }) {
    return (
        <>
            <Callout tone={verdictTone(review)}><strong>{text.verdict} ({review.date}):</strong> {rich(review.verdict)}</Callout>
            <ul>
                {review.findings.map((finding, index) => (
                    <li key={index}>
                        <Status tone={severityTones[finding.severity]}>{text.severity[finding.severity]}</Status> {rich(finding.text)}
                        {finding.verified === false && <span className="report-muted"> ({text.assumed})</span>}
                    </li>
                ))}
            </ul>
            <p><strong>{text.good}:</strong> {rich(review.good)}</p>
            <p><strong>{text.test}:</strong></p>
            <ol>
                {review.test.map((step, index) => <li key={index}>{rich(step)}</li>)}
            </ol>
        </>
    );
}

function BundleBody({ bundle }: { bundle: Bundle }) {
    return (
        <>
            {bundle.merged && <p className="report-muted">{bundle.merged}</p>}
            <p><strong>{text.what}:</strong> {rich(bundle.what)}</p>
            <p><strong>{text.how}:</strong> {rich(bundle.how)}</p>
            <ul>
                {bundle.prs.map((pr) => <PrLine key={`${pr.repo}#${pr.number}`} bundle={bundle} pr={pr} />)}
            </ul>
            {bundle.review && <ReviewBlock review={bundle.review} />}
        </>
    );
}

function Overview() {
    const rows = [...bundles].sort((a, b) => bundleState(a).order - bundleState(b).order || bundleScore(b) - bundleScore(a));
    const cell = { display: 'grid', gridTemplateColumns: columns, gap: 12, alignItems: 'center', padding: '10px 4px' };

    return (
        <div>
            <style dangerouslySetInnerHTML={{ __html: overviewCss }} />
            <div className="text-xs text-text-muted" style={{ ...cell, borderBottom: `1px solid ${hairline}` }}>
                <span />
                <span>{text.issue}</span>
                <span>{text.size}</span>
                <span>{text.score}</span>
                <span>{text.status}</span>
            </div>
            {rows.map((bundle) => {
                const state = bundleState(bundle);

                return (
                    <details key={bundle.issue} className="bundle" style={{ borderBottom: `1px solid ${hairline}` }}>
                        <summary style={cell}>
                            <ChevronRight className="chevron text-text-muted" size={16} aria-hidden />
                            <span className="min-w-0">
                                <span className="font-medium" style={{ display: 'block' }}>{bundle.issue}</span>
                                <span className="text-text-muted truncate" style={{ display: 'block' }} title={capitalize(bundle.title)}>{capitalize(bundle.title)}</span>
                            </span>
                            <span><Size lines={bundleLines(bundle)} /></span>
                            <span>{bundle.merged ? <span className="report-muted text-xs">{text.notApplicable}</span> : <ScoreBars score={bundleScore(bundle)} />}</span>
                            <span><Status tone={state.tone}>{state.label}</Status></span>
                        </summary>
                        <div style={{ padding: '4px 4px 16px 34px' }}>
                            <BundleBody bundle={bundle} />
                        </div>
                    </details>
                );
            })}
        </div>
    );
}

const openPrs = bundles.filter((bundle) => !bundle.merged).reduce((total, bundle) => total + bundle.prs.length, 0);
const reviewedCount = bundles.filter((bundle) => bundle.review && !bundle.merged).length;
const mergeableCount = bundles.filter((bundle) => bundle.review && !bundle.merged && scoreCap(bundle) === 5).length;
const mergedCount = bundles.filter((bundle) => bundle.merged).length;

// The prose below (lead, actions, decision) is written per report, in the report's language.

export default (
    <Report title={title} kind={kind} model={model} lang={lang} meta={`${updated} · ${scope}`} brand={brand}>
        <Lead>
            <p>The conclusion first: how many PRs are open, what is mergeable, what blocks the rest.</p>
        </Lead>
        <Figures>
            <Figure value={String(openPrs)} label="open PRs" />
            <Figure value={String(reviewedCount)} label="reviewed" delta={`${mergeableCount} mergeable`} trend={mergeableCount > 0 ? 'good' : 'bad'} />
            <Figure value={String(mergedCount)} label="merged" trend="good" />
        </Figures>

        <Section title="Overview" id="overview" toc="Overview">
            <Intro>Open bundles first, then the reviewed ones, then the merged ones. Expand a row for what the PRs do, how, and the review.</Intro>
            <Overview />
        </Section>

        <Section title="How the score works" id="score" toc="Score">
            <p>Five bars per bundle: the closer to five, the less stands between the PRs and a merge. The score weighs size, open threads, an open request for changes, stacked base branches and the risk of the area. A bundle takes the lowest score of its PRs, because they ship together.</p>
            <p>After a review a bundle is mergeable only without open blocking or important findings. An important finding caps the score at three, a blocking one at two.</p>
            <p>The size label counts changed lines (added plus removed) of the whole bundle: XS under 100, S under 400, M under 1,500, L under 5,000, XL above.</p>
        </Section>

        <Section title="Next steps" id="next" toc="Next steps">
            <h3>Name</h3>
            <Steps>
                <Step title="One action, tied to a person" done="the condition that makes it done" />
            </Steps>
        </Section>

        <Section title="Decision needed" id="decision" toc="Decision">
            <Card title="Only when a bundle needs a decision">
                <p>Remove this section when there is none.</p>
            </Card>
        </Section>
    </Report>
);
