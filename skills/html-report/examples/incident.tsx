import { Chart, Column, Columns, Event, Events, Figure, Figures, Intro, Lead, Plot, Report, Section } from 'html-report';

const failures = [0.2, 0.1, 0.3, 12, 31, 41, 39, 37, 22, 8, 1, 0.3, 0.2].map((percent, index) => ({
    at: new Date(Date.UTC(2026, 9, 21, 11, 50 + index * 5)),
    percent
}));

export default (
    <Report
        title="API 38 minuten onbereikbaar op 21 oktober"
        kind="Incidentreview"
        model="Claude Opus 5.5"
        lang="nl"
        meta="27 oktober 2026 · INC-2026-031 · productie, regio eu-west"
        brand={{ name: 'Ledger API', color: '#0f766e' }}
    >
        <Lead>
            <p>
                Een migratie zette een lock op de tabel <code>entries</code>. Daardoor liep de connection pool vol en faalde 41% van de verzoeken. Er is
                geen data verloren gegaan.
            </p>
        </Lead>
        <Figures>
            <Figure value="38 min" label="duur" />
            <Figure value="41%" label="verzoeken gefaald, piek" />
            <Figure value="0" label="boekingen verloren" />
        </Figures>

        <Section title="Verloop">
            <Events>
                <Event time="14:02" title="Deploy met migratie 0147 start">
                    Voegt een index toe aan <code>entries</code>, zonder <code>CONCURRENTLY</code>.
                </Event>
                <Event time="14:04" title="Foutpercentage stijgt boven 5%" tone="error">
                    Alert gaat af, on-call bevestigt na 3 minuten.
                </Event>
                <Event time="14:19" title="Oorzaak gevonden" tone="warn">
                    <code>pg_locks</code> toont de migratie als houder van een <code>SHARE</code>-lock.
                </Event>
                <Event time="14:26" title="Migratie afgebroken, pool herstart" tone="warn" />
                <Event time="14:40" title="Foutpercentage terug op normaal" tone="ok">
                    Wachtrij met 2.300 boekingen verwerkt binnen 6 minuten.
                </Event>
            </Events>
        </Section>

        <Section title="Impact">
            <Intro>Gefaalde verzoeken per 5 minuten, in UTC+2.</Intro>
            <Plot>
                <Chart.Root data={failures} x="at" xScale="time" y={{ min: 0, max: 50 }} label="Gefaalde verzoeken in procenten" height={220} format={(value) => `${value}%`}>
                    <Chart.Grid />
                    <Chart.Band from={failures[3].at} to={failures[10].at} label="Incident" tone="error" />
                    <Chart.XAxis />
                    <Chart.YAxis ticks={3} />
                    <Chart.Area value="percent" label="Gefaald" tone="error" />
                    <Chart.Tooltip />
                </Chart.Root>
            </Plot>
        </Section>

        <Section title="Oorzaak">
            <p>De index werd binnen een transactie gemaakt. Schrijvers wachtten op de lock en hielden hun verbinding vast tot de pool van 40 vol zat.</p>
            <Columns>
                <Column title="Ging goed">
                    <ul>
                        <li>Alert binnen 2 minuten</li>
                        <li>Wachtrij hield alle boekingen vast</li>
                        <li>Rollback zonder dataverlies</li>
                    </ul>
                </Column>
                <Column title="Ging niet goed">
                    <ul>
                        <li>Migratie niet getest op productievolume</li>
                        <li>Geen timeout op de lock</li>
                        <li>15 minuten tot de oorzaak bekend was</li>
                    </ul>
                </Column>
            </Columns>
        </Section>

        <Section title="Acties">
            <table>
                <thead>
                    <tr>
                        <th>Actie</th>
                        <th>Eigenaar</th>
                        <th data-numeric>Deadline</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            Indexen altijd <code>CONCURRENTLY</code> maken, lint in CI
                        </td>
                        <td>Platform</td>
                        <td data-numeric>4 nov</td>
                    </tr>
                    <tr>
                        <td>
                            <code>lock_timeout</code> van 5 s voor migraties
                        </td>
                        <td>Platform</td>
                        <td data-numeric>4 nov</td>
                    </tr>
                    <tr>
                        <td>Migraties draaien tegen een kopie van productie</td>
                        <td>Data</td>
                        <td data-numeric>18 nov</td>
                    </tr>
                </tbody>
            </table>
        </Section>
    </Report>
);
