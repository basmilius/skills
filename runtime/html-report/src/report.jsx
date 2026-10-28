/*
 * The building blocks of a report, on @adecore/ui and @adecore/charts. Rendered to HTML when the report is built and
 * hydrated in the browser, so nothing here may touch the DOM outside an effect.
 */
import { Children, cloneElement, createContext, isValidElement, useContext, useEffect, useRef, useState } from 'react';
import i18next from 'i18next';
import { Banner, Meter, PanelHeader, Pill, Segmented, Separator } from '@adecore/ui';
import { ProviderLogo as AdecoreProviderLogo } from '@adecore/agents-react/providers';
import { setFormatSource } from '@adecore/ui/format';
import { Chart, CHARTS_NAMESPACE, CHARTS_RESOURCES } from '@adecore/charts';
import { CircleAlert, Info, Monitor, Moon, Sparkles, Sun, TriangleAlert } from 'lucide-react';
import { hasIcon, pascalCase, staticIcon } from './icons.jsx';
import { PROVIDER_LOGOS } from './providers.js';

export { Chart, createChart, Heatmap, SeriesLegend, Sparkline, Timeline, useChart } from '@adecore/charts';
export { Banner, CopyButton, Kbd, KeyCap, Keys, KeyValueList, Meter, MiddleTruncate, Pill, SegmentBar, Segmented, Separator, Tabs, Tooltip, Wipe } from '@adecore/ui';
export {
    formatBytes,
    formatDay,
    formatDayWithYear,
    formatDecimal,
    formatDuration,
    formatMoney,
    formatNumber,
    formatPercent,
    formatRounded
} from '@adecore/ui/format';

/* Language */

/* Whole locales, the same on every machine, so the build and the browser write numbers and dates alike. */
const REGIONS = { nl: 'nl-NL', en: 'en-US' };

export const i18n = i18next.createInstance();

i18n.init({
    lng: 'nl',
    fallbackLng: 'en',
    resources: Object.fromEntries(Object.entries(CHARTS_RESOURCES).map(([language, words]) => [language, { [CHARTS_NAMESPACE]: words }])),
    interpolation: { escapeValue: false },
    initAsync: false
});

/* Numbers, dates and chart axes follow the language of the report. */
export const formatSource = {
    language: () => i18n.language,
    region: () => REGIONS[i18n.language] ?? 'en-US',
    subscribe(onChange) {
        i18n.on('languageChanged', onChange);

        return () => i18n.off('languageChanged', onChange);
    }
};

/* At once, not only through `UIProvider`: a report formats its numbers while its elements are created, before anything renders. */
setFormatSource(formatSource);

const WORDS = {
    nl: {
        contents: 'Op deze pagina',
        theme: 'Thema',
        system: 'Systeem',
        light: 'Licht',
        dark: 'Donker',
        values: 'Waarden',
        writtenBy: 'Geschreven door',
        model: 'Model',
        provider: 'Provider',
        built: 'Gebouwd',
        doneWhen: 'Klaar als',
        checks: { done: 'Gedaan', failed: 'Mislukt', skipped: 'Overgeslagen' }
    },
    en: {
        contents: 'On this page',
        theme: 'Theme',
        system: 'System',
        light: 'Light',
        dark: 'Dark',
        values: 'Values',
        writtenBy: 'Written by',
        model: 'Model',
        provider: 'Provider',
        built: 'Built',
        doneWhen: 'Done when',
        checks: { done: 'Done', failed: 'Failed', skipped: 'Skipped' }
    }
};

const wordsOf = (lang) => WORDS[lang] ?? WORDS.en;

/* Brand color */

const toLinear = (channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
const toGamma = (channel) => (channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055);

function hexToRgb(hex) {
    const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());

    if (match === null) {
        return null;
    }

    const digits = match[1].length === 3 ? [...match[1]].map((digit) => digit + digit).join('') : match[1];

    return [0, 2, 4].map((offset) => parseInt(digits.slice(offset, offset + 2), 16) / 255);
}

function rgbToOklch([r, g, b]) {
    const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
    const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
    const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, Math.hypot(a, bb), Math.atan2(bb, a)];
}

function oklchToRgb([lightness, chroma, hue]) {
    const a = chroma * Math.cos(hue);
    const b = chroma * Math.sin(hue);
    const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

    return [
        toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
    ];
}

/* Lowers the chroma until the color fits in sRGB, so the hue survives a lightness the brand never had. */
function fit(lightness, chroma, hue) {
    for (let step = chroma; step > 0; step -= 0.005) {
        const rgb = oklchToRgb([lightness, step, hue]);

        if (rgb.every((channel) => channel >= -0.0001 && channel <= 1.0001)) {
            return rgb;
        }
    }

    return oklchToRgb([lightness, 0, hue]);
}

const channels = (rgb) => rgb.map((channel) => Math.round(Math.min(1, Math.max(0, channel)) * 255)).join(' ');

/* Pins the lightness per theme, so any brand color keeps its contrast: dark enough for white text in light mode, light enough to read on the dark ground. */
function accentTokens(color) {
    const [lightness, chroma, hue] = rgbToOklch(hexToRgb(color) ?? hexToRgb('#155dfc'));
    const light = channels(fit(Math.min(Math.max(lightness, 0.38), 0.55), chroma, hue));
    const dark = channels(fit(Math.max(lightness, 0.72), chroma, hue));

    return [
        `:root, [data-theme="light"] { --accent: rgb(${light}); --accent-rgb: ${light}; --accent-text: #ffffff; }`,
        `[data-theme="dark"] { --accent: rgb(${dark}); --accent-rgb: ${dark}; --accent-text: #0d0d10; }`
    ].join('\n');
}

/* A logo file often sets only `width` and `height`; without a `viewBox` it would not scale down to the mark. */
function scalableSvg(svg) {
    if (/\sviewBox=/.test(svg)) {
        return svg;
    }

    const width = /\swidth="([\d.]+)"/.exec(svg)?.[1];
    const height = /\sheight="([\d.]+)"/.exec(svg)?.[1];

    return width === undefined || height === undefined ? svg : svg.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
}

function BrandMark({ name, icon: given }) {
    /* A logo file the build read, by the path the report names it with. */
    const icon = globalThis.__HTML_REPORT_ASSETS__?.[given] ?? given;

    if (typeof icon === 'string' && icon.trimStart().startsWith('<svg')) {
        return <span className="report-mark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: scalableSvg(icon) }} />;
    }

    if (typeof icon === 'string' && /^(data:|https?:|\.{0,2}\/)/.test(icon)) {
        return <img className="report-mark" src={icon} alt="" />;
    }

    if (typeof icon === 'string' && icon.length > 1 && hasIcon(pascalCase(icon))) {
        const Icon = staticIcon(pascalCase(icon));

        return (
            <span className="report-mark report-mark-icon" aria-hidden="true">
                <Icon />
            </span>
        );
    }

    /* Without a logo or an icon, the first letter on the accent stands in for one. */
    return (
        <span className="report-mark report-mark-letter" aria-hidden="true">
            {(icon ?? name.charAt(0)).toUpperCase()}
        </span>
    );
}

/* Theme */

const storageKey = () => `html-report-theme:${location.pathname}`;

/* A host that embeds the report, such as a chat, sets `--background` to the color behind the frame. */
function hostBackground() {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();

    return value === '' ? null : value;
}

function isDarkColor(color) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;

    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

function readPreference() {
    try {
        const stored = localStorage.getItem(storageKey());

        return stored === 'light' || stored === 'dark' ? stored : 'system';
    } catch {
        return 'system';
    }
}

function applyTheme(preference) {
    const root = document.documentElement;
    const host = preference === 'system' ? hostBackground() : null;
    const dark = preference === 'system' ? (host === null ? matchMedia('(prefers-color-scheme: dark)').matches : isDarkColor(host)) : preference === 'dark';

    root.dataset.theme = dark ? 'dark' : 'light';
    root.toggleAttribute('data-host-background', host !== null);
}

/* Starts at `system` on the server and in the first render alike, and reads the stored choice once hydrated. */
function useTheme() {
    const [preference, setPreference] = useState(null);
    const current = preference ?? 'system';

    useEffect(() => {
        if (preference === null) {
            setPreference(readPreference());

            return;
        }

        const media = matchMedia('(prefers-color-scheme: dark)');
        const update = () => applyTheme(preference);
        const onMessage = (event) => {
            if (event.data?.method === 'ui/notifications/host-context-changed') {
                requestAnimationFrame(update);
            }
        };
        const beforePrint = () => {
            document.documentElement.dataset.theme = 'light';
            document.documentElement.removeAttribute('data-host-background');
        };

        update();
        media.addEventListener('change', update);
        window.addEventListener('message', onMessage);
        window.addEventListener('beforeprint', beforePrint);
        window.addEventListener('afterprint', update);

        return () => {
            media.removeEventListener('change', update);
            window.removeEventListener('message', onMessage);
            window.removeEventListener('beforeprint', beforePrint);
            window.removeEventListener('afterprint', update);
        };
    }, [preference]);

    const choose = (next) => {
        try {
            localStorage.setItem(storageKey(), next);
        } catch {
            // Storage is off in a sandboxed frame; the choice then lasts until reload.
        }

        setPreference(next);
    };

    return [current, choose];
}

/* Model */

const PROVIDERS = [
    [/claude|anthropic/i, 'Anthropic'],
    [/gpt|codex|openai|\bo[1-9]\b/i, 'OpenAI'],
    [/gemini|gemma|google/i, 'Google'],
    [/mistral|codestral|devstral/i, 'Mistral AI'],
    [/deepseek/i, 'DeepSeek'],
    [/qwen/i, 'Alibaba'],
    [/kimi|moonshot/i, 'Moonshot AI'],
    [/llama|meta/i, 'Meta'],
    [/grok|xai/i, 'xAI'],
    [/copilot/i, 'GitHub']
];

const providerOf = (model) => PROVIDERS.find(([pattern]) => pattern.test(model))?.[1];

/* The providers whose mark adecore draws, by the id it knows them under. */
const ADECORE_PROVIDERS = { Anthropic: 'claude', OpenAI: 'codex', xAI: 'grok', GitHub: 'copilot' };

function ProviderLogo({ provider }) {
    const path = PROVIDER_LOGOS[provider];

    if (ADECORE_PROVIDERS[provider] !== undefined) {
        return <AdecoreProviderLogo provider={ADECORE_PROVIDERS[provider]} size={16} className="report-provider-logo" />;
    }

    if (path === undefined) {
        return <Sparkles className="report-provider-logo" aria-hidden="true" />;
    }

    return (
        <svg className="report-provider-logo" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={path} />
        </svg>
    );
}

/* When the report was built, written by the build in the language of the report, so the server and the browser show the same text. */
const builtAt = () => globalThis.__HTML_REPORT_BUILT__;

/** The model that wrote the report, its provider and when the report was built. */
function ModelDetails({ model, provider, words }) {
    const company = provider ?? providerOf(model);
    const built = builtAt();

    return (
        <details className="report-model">
            <summary>
                <ProviderLogo provider={company} />
                <span>
                    <small>{words.writtenBy}</small>
                    {model}
                </span>
            </summary>
            <dl>
                <dt>{words.model}</dt>
                <dd>{model}</dd>
                {company !== undefined && (
                    <>
                        <dt>{words.provider}</dt>
                        <dd>{company}</dd>
                    </>
                )}
                {built !== undefined && (
                    <>
                        <dt>{words.built}</dt>
                        <dd>{built}</dd>
                    </>
                )}
            </dl>
        </details>
    );
}

/* Report */

const ReportContext = createContext({ layout: 'narrow', lang: 'nl' });

export const useLayout = () => useContext(ReportContext).layout;

function Contents({ headings, label }) {
    const [current, setCurrent] = useState(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.find((entry) => entry.isIntersecting);

                if (visible !== undefined) {
                    setCurrent(visible.target.id);
                }
            },
            { rootMargin: '0px 0px -70% 0px' }
        );

        for (const heading of headings) {
            const element = document.getElementById(heading.id);

            if (element !== null) {
                observer.observe(element);
            }
        }

        return () => observer.disconnect();
    }, [headings]);

    if (headings.length < 2) {
        return null;
    }

    const active = current ?? headings[0].id;

    return (
        <nav className="report-toc" aria-label={label}>
            <b>{label}</b>
            {headings.map((heading) => (
                <a key={heading.id} href={`#${heading.id}`} aria-current={heading.id === active ? 'location' : undefined}>
                    {heading.label}
                </a>
            ))}
        </nav>
    );
}

/*
 * Puts every `<table>` the report writes in a frame that scrolls sideways, so a wide table never widens the page on
 * a phone. Charts are left alone: their children are parts, and some take a function.
 */
function withScrollingTables(node) {
    return Children.map(node, (child) => {
        if (!isValidElement(child)) {
            return child;
        }

        if (child.type === 'table') {
            return <div className="report-table">{child}</div>;
        }

        if (child.type === Chart.Root || child.props.children === undefined || typeof child.props.children === 'function') {
            return child;
        }

        return cloneElement(child, { children: withScrollingTables(child.props.children) });
    });
}

/**
 * The page: header with the brand and the model that wrote the report, title, meta line, theme switch and contents
 * on the right. `brand` is `{ name, color, icon }`; `icon` is a Lucide name, inline SVG markup or an image URL.
 */
export function Report({ title, kind, meta, model, provider, layout = 'narrow', lang = 'nl', brand = {}, children }) {
    const name = brand.name ?? 'Report';
    const words = wordsOf(lang);
    const [preference, setPreference] = useTheme();
    const [headings, setHeadings] = useState([]);
    const content = useRef(null);

    if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
    }

    useEffect(() => {
        const found = [...content.current.querySelectorAll('h2[id]')].map((element) => ({
            id: element.id,
            label: element.dataset.toc ?? element.textContent
        }));

        setHeadings(found);
    }, [children]);

    const themes = [
        { id: 'system', label: words.system, icon: Monitor },
        { id: 'light', label: words.light, icon: Sun },
        { id: 'dark', label: words.dark, icon: Moon }
    ];

    return (
        <ReportContext.Provider value={{ layout, lang }}>
            <style>{accentTokens(brand.color)}</style>
            <PanelHeader className="report-toolbar">
                <BrandMark name={name} icon={brand.icon} />
                <strong>{name}</strong>
                {kind !== undefined && (
                    <>
                        <Separator />
                        <span>{kind}</span>
                    </>
                )}
                <span className="report-toolbar-end">
                    <Segmented value={preference} onValueChange={setPreference} options={themes} label={words.theme} size="sm" iconOnly className="report-theme" />
                </span>
            </PanelHeader>
            <div className={`report report-${layout}`}>
                <main ref={content} className="report-main">
                    <h1 className="report-title">{title}</h1>
                    {meta !== undefined && <p className="report-meta">{meta}</p>}
                    {withScrollingTables(children)}
                    {model !== undefined && (
                        <footer className="report-footer">
                            <ModelDetails model={model} provider={provider} words={words} />
                        </footer>
                    )}
                </main>
                <aside className="report-side">
                    <Contents headings={headings} label={words.contents} />
                    {model !== undefined && <ModelDetails model={model} provider={provider} words={words} />}
                </aside>
            </div>
        </ReportContext.Provider>
    );
}

/* Blocks */

const PILL_TONES = { ok: 'idle', warn: 'needsYou', error: 'error', muted: 'muted', accent: 'accent' };
const CALLOUT_ICONS = { neutral: Info, attention: TriangleAlert, error: CircleAlert };

const slug = (text) =>
    String(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

const linesOf = (text) =>
    String(text)
        .replace(/^\n|\n\s*$/g, '')
        .split('\n');

/** A section with an `h2` that shows up in the contents. `aside` goes in the margin of a wide report, under the section in a narrow one. */
export function Section({ title, id, toc, aside, children }) {
    const layout = useLayout();
    const body = (
        <div className="report-section-body">
            <h2 id={id ?? slug(title)} data-toc={toc}>
                {title}
            </h2>
            {children}
        </div>
    );

    if (layout === 'wide') {
        return (
            <section className="report-section report-row">
                {body}
                <aside className="report-aside">{aside}</aside>
            </section>
        );
    }

    return (
        <section className="report-section">
            {body}
            {aside !== undefined && <aside className="report-aside">{aside}</aside>}
        </section>
    );
}

/** The opening conclusion, in a larger size. */
export function Lead({ aside, children }) {
    const layout = useLayout();
    const lead = <div className="report-lead">{children}</div>;

    if (layout === 'wide' && aside !== undefined) {
        return (
            <div className="report-row">
                {lead}
                <aside className="report-aside report-aside-lead">{aside}</aside>
            </div>
        );
    }

    return lead;
}

export function Intro({ children }) {
    return <p className="report-intro">{children}</p>;
}

export function Figures({ children }) {
    return <div className="report-figures">{children}</div>;
}

/** A key number. `trend` ("good" or "bad") colors the `delta`. */
export function Figure({ value, label, delta, trend }) {
    return (
        <div className="report-figure">
            <b>{value}</b>
            <span>
                {label}
                {delta !== undefined && <span className={trend === undefined ? undefined : `report-${trend}`}> {delta}</span>}
            </span>
        </div>
    );
}

/** A label with a tone: ok, warn, error, muted or accent. */
export function Status({ tone = 'muted', children }) {
    return (
        <Pill tone={PILL_TONES[tone] ?? 'muted'} size="sm">
            {children}
        </Pill>
    );
}

export function Rows({ children }) {
    return <ul className="report-rows">{children}</ul>;
}

/** A finding, risk or item: a bold title, something on the right (`end`), details under it. */
export function Row({ title, end, children }) {
    return (
        <li className="report-row-item">
            <div className="report-row-head">
                <strong>{title}</strong>
                {end !== undefined && <span className="report-row-end">{end}</span>}
            </div>
            {children !== undefined && <div className="report-row-body">{children}</div>}
        </li>
    );
}

/** A surface of its own, for the one thing that has to stand apart: a decision, an open question. */
export function Card({ title, children }) {
    return (
        <div className="report-card">
            {title !== undefined && <h3>{title}</h3>}
            {children}
        </div>
    );
}

/** A one-line message with an icon; `tone` is neutral, attention or error. */
export function Callout({ tone = 'neutral', children }) {
    return <Banner icon={CALLOUT_ICONS[tone]} tone={tone} message={children} placement="inline" className="report-callout" />;
}

export function Steps({ children }) {
    return <ol className="report-steps">{children}</ol>;
}

/** An action; `done` says when it counts as finished, after a "Done when" in the report's language. */
export function Step({ title, done, children }) {
    const words = wordsOf(useContext(ReportContext).lang);

    return (
        <li>
            <strong>{title}</strong>
            {done !== undefined && (
                <span className="report-muted">
                    {' '}
                    <span className="report-done">{words.doneWhen}</span> {done}
                </span>
            )}
            {children}
        </li>
    );
}

export function Checks({ children }) {
    return <ul className="report-checks">{children}</ul>;
}

/** A checked item; `status` is done, failed or skipped, also spelled out for a screen reader. */
export function Check({ status = 'done', children }) {
    const words = wordsOf(useContext(ReportContext).lang);

    return (
        <li data-status={status}>
            <span className="report-sr">{words.checks[status] ?? status}: </span>
            {children}
        </li>
    );
}

export function Milestones({ children }) {
    return <ul className="report-milestones">{children}</ul>;
}

/** A milestone with `progress` from 0 to 100. */
export function Milestone({ title, progress, status, children }) {
    return (
        <li>
            <strong>{title}</strong>
            <Meter value={progress} label={typeof title === 'string' ? title : 'Progress'} valueText={`${progress}%`} className="w-full" />
            <span>{status}</span>
            {children !== undefined && <small>{children}</small>}
        </li>
    );
}

export function Events({ children }) {
    return <ol className="report-events">{children}</ol>;
}

/** A moment on a timeline, with a colored dot per `tone`. */
export function Event({ time, title, tone = 'muted', children }) {
    return (
        <li data-tone={tone}>
            <time>{time}</time>
            <div>
                <strong>{title}</strong>
                {children !== undefined && <div className="report-muted">{children}</div>}
            </div>
        </li>
    );
}

export function Columns({ children }) {
    return <div className="report-columns">{children}</div>;
}

export function Column({ title, children }) {
    return (
        <div>
            {title !== undefined && <b className="report-column-title">{title}</b>}
            {children}
        </div>
    );
}

/** A code excerpt. `start` numbers the lines, `highlight` marks lines by that number. */
export function Code({ file, start, highlight = [], children }) {
    return (
        <figure className="report-code">
            {file !== undefined && <figcaption>{file}</figcaption>}
            <pre>
                {linesOf(children).map((line, index) => {
                    const number = (start ?? 1) + index;

                    return (
                        <span key={index} data-mark={highlight.includes(number) ? 'hit' : undefined}>
                            {start !== undefined && <span className="report-line-number">{number}</span>}
                            {line}
                        </span>
                    );
                })}
            </pre>
        </figure>
    );
}

/** A unified diff: lines that start with `+` or `-` are colored. `start` numbers the lines of the new version; a removed line has no number. */
export function Diff({ file, start, children }) {
    let next = start ?? 1;

    return (
        <figure className="report-code">
            {file !== undefined && <figcaption>{file}</figcaption>}
            <pre>
                {linesOf(children).map((line, index) => {
                    const removed = line.startsWith('-');
                    const number = removed ? '' : next++;

                    return (
                        <span key={index} data-mark={line.startsWith('+') ? 'add' : removed ? 'del' : undefined}>
                            {start !== undefined && <span className="report-line-number">{number}</span>}
                            {line}
                        </span>
                    );
                })}
            </pre>
        </figure>
    );
}

/** A ranked list as horizontal bars: each item a `label`, a `value` and optionally a `tone`, a `color` and a `note` under the label. */
export function Ranking({ items, format = String, max, label }) {
    const top = max ?? Math.max(0, ...items.map((item) => item.value));

    return (
        <table className="report-ranking" aria-label={label}>
            <tbody>
                {items.map((item, index) => (
                    <tr key={index}>
                        <th scope="row">
                            {item.label}
                            {item.note !== undefined && <small>{item.note}</small>}
                        </th>
                        <td className="report-ranking-bar">
                            <span
                                data-tone={item.tone ?? 'accent'}
                                style={{ width: `${top > 0 ? Math.min(100, (item.value / top) * 100) : 0}%`, background: item.color }}
                            />
                        </td>
                        <td data-numeric="">{format(item.value)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

/* Values table */

const SERIES = new Set([Chart.Line, Chart.Area, Chart.Bar]);

const read = (row, accessor) => (typeof accessor === 'function' ? accessor(row) : row[accessor]);

/* The series of a chart, also inside `Chart.Bars`, a group or a layer. */
const seriesIn = (children) =>
    Children.toArray(children).flatMap((child) => {
        if (!isValidElement(child) || child.type === Chart.Root) {
            return [];
        }

        return SERIES.has(child.type) ? [child] : seriesIn(child.props.children);
    });

/*
 * Dates as precise as the data: a month when every date is the first at midnight, a day when every one is at
 * midnight, a moment otherwise. Midnight counts in local time or in UTC, as data built with `Date.UTC` is.
 */
function dateFormat(values, lang) {
    const dates = values.filter((value) => value instanceof Date);
    const atMidnight = (utc) => dates.every((date) => (utc ? date.getUTCHours() + date.getUTCMinutes() : date.getHours() + date.getMinutes()) === 0);
    const utc = !atMidnight(false) && atMidnight(true);
    const midnight = utc || atMidnight(false);
    const firsts = midnight && dates.every((date) => (utc ? date.getUTCDate() : date.getDate()) === 1);
    const options = firsts ? { year: 'numeric', month: 'short' } : midnight ? { dateStyle: 'medium' } : { dateStyle: 'medium', timeStyle: 'short' };

    return (value) => value.toLocaleString(REGIONS[lang] ?? lang, utc ? { ...options, timeZone: 'UTC' } : options);
}

const textOf = (value, formatDate) => (value instanceof Date ? formatDate(value) : value === null || value === undefined ? '' : String(value));

/* The data of a `Chart.Root` among the children, as a header and rows, or null when there is none. */
function chartValues(children, lang, xLabel, xFormat) {
    const root = Children.toArray(children).find((child) => isValidElement(child) && child.type === Chart.Root);

    if (root === undefined || !Array.isArray(root.props.data)) {
        return null;
    }

    const series = seriesIn(root.props.children);

    if (series.length === 0) {
        return null;
    }

    const xs = root.props.data.map((row) => read(row, root.props.x));
    const formatDate = dateFormat(xs, lang);
    const formatX = xFormat ?? ((value) => textOf(value, formatDate));
    const format = root.props.format ?? String;
    const rows = root.props.data.map((row, index) => [
        formatX(xs[index]),
        ...series.map((serie) => {
            const value = read(row, serie.props.value);

            return typeof value === 'number' ? format(value) : textOf(value, formatDate);
        })
    ]);

    return { head: [xLabel ?? (typeof root.props.x === 'string' ? root.props.x : ''), ...series.map((serie) => serie.props.label)], rows };
}

/**
 * A chart or other figure with a caption under it. A chart's values follow as a collapsed table, readable without the
 * chart; `xLabel` heads its first column and `xFormat` writes its values.
 */
export function Plot({ caption, xLabel, xFormat, children }) {
    const { lang } = useContext(ReportContext);
    const values = chartValues(children, lang, xLabel, xFormat);

    return (
        <figure className="report-plot">
            {children}
            {caption !== undefined && <figcaption>{caption}</figcaption>}
            {values !== null && (
                <details className="report-values">
                    <summary>{wordsOf(lang).values}</summary>
                    <div className="report-table">
                    <table>
                        <thead>
                            <tr>
                                {values.head.map((cell, index) => (
                                    <th key={index} data-numeric={index > 0 ? '' : undefined}>
                                        {cell}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {values.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.map((cell, index) => (
                                        <td key={index} data-numeric={index > 0 ? '' : undefined}>
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </details>
            )}
        </figure>
    );
}
