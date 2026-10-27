import { Card, Check, Checks, Code, Diff, Figure, Figures, Lead, Report, Row, Rows, Section, Status } from 'html-report';

export default (
    <Report
        title="Review: sessieherstel na herstart"
        kind="Code review"
        model="Claude Opus 5.5"
        lang="nl"
        brand={{ name: 'Ruimte', color: '#155dfc' }}
        meta={
            <>
                27 oktober 2026 · PR #482 · <code>feat/session-restore</code> · 14 bestanden, <span className="report-good">+612</span>{' '}
                <span className="report-bad">-188</span>
            </>
        }
    >
        <Lead>
            <p>
                Na een normale herstart herstelt de PR sessies correct. Na een crash kan een sessie twee keer starten, omdat de lock pas na het lezen van
                de state wordt gezet. Niet mergen tot dat is opgelost.
            </p>
        </Lead>
        <Figures>
            <Figure value="2" label="blokkerend" />
            <Figure value="3" label="suggesties" />
            <Figure value="1" label="open vraag" />
        </Figures>

        <Section title="Blokkerend">
            <Rows>
                <Row title="Sessie start twee keer na een crash" end={<Status tone="ok">Geverifieerd</Status>}>
                    <p>
                        Twee vensters lezen dezelfde state voordat een van beide de lock zet. Reproduceerbaar met <code>kill -9</code> en twee vensters.
                    </p>
                    <Code file="apps/desktop/src/sessions/restore.ts:86" start={86} highlight={[87, 88]}>{`
const state = await readState(id);
if (state.running) return;
await acquireLock(id);
await start(state);`}</Code>
                </Row>
                <Row title="Werkmap met spaties gaat verloren" end={<Status tone="ok">Geverifieerd</Status>}>
                    <p>Het pad gaat zonder quotes naar de shell. Voorstel:</p>
                    <Diff file="apps/desktop/src/sessions/spawn.ts:41">{`
-  args.push(\`cd \${cwd}\`);
+  args.push(\`cd \${shellQuote(cwd)}\`);`}</Diff>
                </Row>
            </Rows>
        </Section>

        <Section title="Suggesties">
            <Rows>
                <Row title="Herstel parallel per project" end={<Status tone="warn">Aanname</Status>}>
                    Bij twintig sessies duurt herstel 3,1 s sequentieel. Niet gemeten met een trage schijf.
                </Row>
                <Row title={<>Naam <code>restoreAll</code> dekt de lading niet</>} end={<Status>Smaak</Status>}>
                    Hij herstelt alleen sessies die niet gesloten zijn; <code>restoreOpen</code> zegt dat.
                </Row>
                <Row title="Test voor een lege state ontbreekt" end={<Status>Smaak</Status>}>
                    Een eerste start na installatie heeft nog geen bestand.
                </Row>
            </Rows>
            <Card title="Open vraag">
                <p>Moet een sessie die tijdens de crash een agent draaide opnieuw starten, of alleen terugkomen in de lijst? De PR start hem opnieuw, het issue zegt niets.</p>
            </Card>
        </Section>

        <Section title="Getest">
            <Checks>
                <Check>Normale herstart met drie sessies</Check>
                <Check>
                    Crash met <code>kill -9</code>, één venster
                </Check>
                <Check status="failed">Crash met twee vensters, zie hierboven</Check>
                <Check status="skipped">Windows niet getest</Check>
            </Checks>
        </Section>
    </Report>
);
