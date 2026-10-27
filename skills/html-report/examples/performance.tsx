import { Chart, Figure, Figures, Lead, Plot, Report, Row, Rows, Section, Status, Step, Steps } from 'html-report';

const releases = [
    { release: '0.36', median: 42, p95: 71 },
    { release: '0.37', median: 39, p95: 66 },
    { release: '0.38', median: 41, p95: 70 },
    { release: '0.39', median: 28, p95: 49 },
    { release: '0.40', median: 18, p95: 31 }
];

const components = [
    { name: 'Heatmap', ms: 63 },
    { name: 'Timeline', ms: 37 },
    { name: 'Bars', ms: 24 },
    { name: 'Area', ms: 21 },
    { name: 'Line', ms: 18 }
];

const hover = [50, 100, 200, 364, 500, 800].map((cells, index) => ({ cells, current: [9, 17, 35, 63, 86, 138][index], memo: [3, 3, 4, 4, 5, 5][index] }));

const ms = (value) => `${value} ms`;

export default (
    <Report
        title="Renderprestaties van @adecore/charts 0.40"
        kind="Prestatierapport"
        model="Claude Opus 5.5"
        lang="nl"
        layout="wide"
        brand={{ name: 'ADE CORE', color: '#7f22fe', icon: 'gift' }}
        meta={<>27 oktober 2026 · <code>main</code> @ <code>4e1c09a</code></>}>
        <Lead
            aside={
                <>
                    <p><b>Meting</b><br />M2 Pro, Chromium 142, mediaan van 50 runs per release.</p>
                    <p><b>Scope</b><br />Chart, Heatmap, Timeline, Sparkline.</p>
                </>
            }
        >
            <p>Release 0.40 tekent een lijn van 10.000 punten in 18 ms, minder dan de helft van 0.38. Alleen Heatmap blijft achter: bij elke hover tekent hij alle cellen opnieuw.</p>
            <Figures>
                <Figure value="18 ms" label="mediaan" delta="-36%" trend="good" />
                <Figure value="31 ms" label="p95" delta="-37%" trend="good" />
                <Figure value="46 kB" label="bundel gzip" delta="+2 kB" />
            </Figures>
        </Lead>

        <Section title="Rendertijd per release" toc="Rendertijd" aside={<p>De sprong in 0.39 komt van tekenen op hele pixels. In 0.40 hergebruikt de lijn zijn path bij een resize.</p>}>
            <Plot>
                <Chart.Root data={releases} x="release" xScale="band" y={{ min: 0 }} label="Rendertijd per release" height={220} format={ms}>
                    <Chart.Grid />
                    <Chart.XAxis />
                    <Chart.YAxis />
                    <Chart.Area value="median" label="Mediaan" tone="accent" />
                    <Chart.Line value="p95" label="p95" tone="needsYou" dots />
                    <Chart.Tooltip />
                    <Chart.Legend />
                </Chart.Root>
            </Plot>
        </Section>

        <Section title="Per component" aside={<p>Eerste render met dezelfde dataset. Boven 30 ms in de accentkleur.</p>}>
            <Plot>
                <Chart.Root data={components} x="name" xScale="band" y={{ min: 0 }} label="Eerste render per component" height={200} format={ms}>
                    <Chart.Grid />
                    <Chart.XAxis />
                    <Chart.YAxis />
                    <Chart.Bar value="ms" label="Rendertijd" tone={(row) => (row.ms > 30 ? 'accent' : 'muted')} valueLabels />
                    <Chart.Tooltip />
                </Chart.Root>
            </Plot>
        </Section>

        <Section title="Hover in Heatmap" aside={<p><b>Lineair met het aantal cellen</b><br />De cursorstatus staat op de root, dus elke cel rendert mee. Het prototype blijft vlak.</p>}>
            <Plot caption="Kosten van één hover tegen het aantal cellen.">
                <Chart.Root data={hover} x="cells" xScale="linear" y={{ min: 0 }} label="Kosten van een hover per aantal cellen" height={220} format={ms}>
                    <Chart.Grid />
                    <Chart.XAxis />
                    <Chart.YAxis />
                    <Chart.Line value="current" label="0.40" tone="accent" dots />
                    <Chart.Line value="memo" label="Prototype met memo per rij" tone="idle" dots />
                    <Chart.Tooltip />
                    <Chart.Legend />
                </Chart.Root>
            </Plot>
        </Section>

        <Section title="Bevindingen">
            <Rows>
                <Row title="Heatmap tekent alle cellen opnieuw bij hover" end={<Status tone="error">Hoog</Status>}>
                    63 ms bij 364 cellen, lineair oplopend.
                </Row>
                <Row title="Timeline berekent de layout twee keer bij inklappen" end={<Status tone="warn">Midden</Status>}>
                    De fold-state wijzigt na de eerste layout; de tweede pass kost 14 ms.
                </Row>
                <Row title="Sparkline zonder regressie" end={<Status tone="ok">In orde</Status>}>
                    Gelijk aan 0.39 binnen de meetruis van 1 ms.
                </Row>
            </Rows>
        </Section>

        <Section title="Acties">
            <Steps>
                <Step title="Cellen per rij memoizen in Heatmap." done="een hover onder 16 ms blijft." />
                <Step title="Layout van Timeline cachen per fold-state." done="inklappen één pass kost." />
                <Step title={<>Perf-gate voor Heatmap in <code>test:perf</code>.</>} done="Faalt boven 20 ms." />
            </Steps>
        </Section>
    </Report>
);
