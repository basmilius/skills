import { Card, Chart, Figure, Figures, Intro, Lead, Milestone, Milestones, Plot, Report, Row, Rows, Section, Status, Step, Steps } from 'html-report';

const weeks = [
    { week: 'w35', done: 3, planned: 4 },
    { week: 'w36', done: 8, planned: 9 },
    { week: 'w37', done: 14, planned: 15 },
    { week: 'w38', done: 19, planned: 20 },
    { week: 'w39', done: 23, planned: 26 },
    { week: 'w40', done: 29, planned: 32 },
    { week: 'w41', done: 33, planned: 38 },
    { week: 'w42', done: 36, planned: 44 },
    { week: 'w43', done: 40, planned: 50 }
];

export default (
    <Report
        title="Voortgang oktober 2026"
        kind="Statusrapport"
        model="Claude Opus 5.5"
        lang="nl"
        meta="27 oktober 2026 · sprint 14 van 18 · vorige rapportage 29 september"
        brand={{ name: 'Groenhuis', color: '#2f7d4f' }}
    >
        <Lead>
            <p>Twee van de vier mijlpalen zijn af. De koppeling met de warmtepomp loopt twee weken uit, omdat de leverancier een firmware-update heeft uitgesteld.</p>
        </Lead>
        <Figures>
            <Figure value="62%" label="gereed" delta="+18 punten" trend="good" />
            <Figure value="2 / 4" label="mijlpalen" />
            <Figure value="2 wk" label="uitloop" delta="1 risico" trend="bad" />
        </Figures>

        <Section title="Mijlpalen">
            <Milestones>
                <Milestone title="Energiemeter uitlezen" progress={100} status={<Status tone="ok">Klaar</Status>}>
                    Opgeleverd 12 september
                </Milestone>
                <Milestone title="Flows voor zonnepanelen" progress={100} status={<Status tone="ok">Klaar</Status>}>
                    Opgeleverd 10 oktober
                </Milestone>
                <Milestone title="Warmtepomp koppelen" progress={45} status={<Status tone="warn">Uitloop</Status>}>
                    Gepland 7 november, verwacht 21 november
                </Milestone>
                <Milestone title="Dashboard en inzichten" progress={10} status={<Status>Op schema</Status>}>
                    Gepland 12 december
                </Milestone>
            </Milestones>
        </Section>

        <Section title="Tempo">
            <Intro>Afgeronde taken per week, cumulatief, tegen de planning.</Intro>
            <Plot>
                <Chart.Root data={weeks} x="week" xScale="band" y={{ min: 0 }} label="Afgeronde taken per week" height={220}>
                    <Chart.Grid />
                    <Chart.XAxis />
                    <Chart.YAxis />
                    <Chart.Line value="planned" label="Planning" tone="muted" dashed />
                    <Chart.Area value="done" label="Gedaan" tone="accent" />
                    <Chart.Tooltip />
                    <Chart.Legend />
                </Chart.Root>
            </Plot>
        </Section>

        <Section title="Risico's">
            <Rows>
                <Row title="Firmware van de warmtepomp blijft uit" end={<Status tone="error">Hoog</Status>}>
                    Zonder de update ontbreekt de lokale API. Terugvaloptie is de cloud-API, met 30 s vertraging.
                </Row>
                <Row title="Homey Pro 2023 heeft te weinig geheugen voor de grafieken" end={<Status tone="warn">Midden</Status>}>
                    Gemeten 84% bij 30 dagen historie. Aggregeren per uur halveert dat.
                </Row>
            </Rows>
            <Card title="Beslissing nodig vóór 1 november">
                <p>Doorgaan met de cloud-API als tussenoplossing, of wachten op de firmware? Doorgaan haalt de uitloop terug naar één week.</p>
            </Card>
        </Section>

        <Section title="Volgende stappen">
            <Steps>
                <Step title="Cloud-API als terugvaloptie inbouwen." done="Alleen bij akkoord op de beslissing." />
                <Step title="Historie per uur aggregeren." done="het geheugen onder 60% blijft." />
                <Step title="Dashboard-ontwerp testen bij drie gebruikers." done="Week 45." />
            </Steps>
        </Section>
    </Report>
);
