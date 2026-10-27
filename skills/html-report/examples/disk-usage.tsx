import { Callout, Chart, Check, Checks, Diff, Figure, Figures, formatBytes, Lead, Plot, Ranking, Report, Section, Status, Step, Steps } from 'html-report';

const GIB = 1024 ** 3;

const folders = [
    { label: '~/Library/Containers/com.docker.docker', value: 61.4 * GIB, note: 'Docker disk image, actual use' },
    { label: '~/Development/clients/atlas/.docker-volumes', value: 28.9 * GIB },
    { label: '~/Library/Developer/Xcode/DerivedData', value: 19.2 * GIB },
    { label: 'node_modules (54 folders under ~/Development)', value: 17.6 * GIB, tone: 'muted' },
    { label: '~/Library/Caches', value: 9.8 * GIB, tone: 'muted' },
    { label: '~/Downloads', value: 7.1 * GIB, tone: 'muted' }
];

const freeSpace = [
    { week: 'w38', free: 142 },
    { week: 'w39', free: 118 },
    { week: 'w40', free: 96 },
    { week: 'w41', free: 71 },
    { week: 'w42', free: 44 },
    { week: 'w43', free: 21 }
];

export default (
    <Report
        title="Where the disk space went"
        kind="Disk usage"
        model="Claude Opus 5.5"
        lang="en"
        layout="wide"
        meta="October 27, 2026 · APFS data volume · measured read-only with df and du"
        brand={{ name: 'MacBook Pro', color: '#0d9488', icon: 'laptop' }}
    >
        <Lead
            aside={
                <p>
                    <b>Method</b>
                    <br />
                    <code>du -d 1 -k</code> per folder with a two-minute timeout; folders that denied access are listed under Limits.
                </p>
            }
        >
            <p>The data volume is 98% full. Three folders hold 110 GB between them, and the Docker image alone can give back about 40 GB without losing a container.</p>
            <Figures>
                <Figure value={formatBytes(905 * GIB)} label="used" />
                <Figure value={formatBytes(21 * GIB)} label="free" delta="-121 GB in six weeks" trend="bad" />
                <Figure value={formatBytes(110 * GIB)} label="in the top three" />
            </Figures>
        </Lead>

        <Section title="Largest folders" aside={<p>Sizes are allocated blocks, so sparse files such as the Docker image count by what they actually use.</p>}>
            <Ranking items={folders} format={(bytes) => formatBytes(bytes)} label="Largest folders by size" />
        </Section>

        <Section title="Free space per week" toc="Free space" aside={<p>From the weekly Time Machine logs, the free space at the start of each week.</p>}>
            <Plot xLabel="Week">
                <Chart.Root data={freeSpace} x="week" xScale="band" y={{ min: 0 }} label="Free space per week" height={200} format={(value) => `${value} GB`}>
                    <Chart.Grid />
                    <Chart.XAxis />
                    <Chart.YAxis />
                    <Chart.Area value="free" label="Free" tone="error" />
                    <Chart.Tooltip />
                </Chart.Root>
            </Plot>
        </Section>

        <Section title="Cleanup">
            <Steps>
                <Step title={<>Prune Docker images and the build cache with <code>docker system prune -a</code>.</>} done="the disk image reports under 25 GB in use." />
                <Step title={<>Remove Xcode's DerivedData, which Xcode rebuilds on demand.</>} done="the folder is gone and the next build succeeds." />
                <Step title={<>Delete <code>node_modules</code> in projects untouched for 90 days.</>} done="every removed project still installs with bun install." />
            </Steps>
            <Callout tone="attention">Docker's prune removes stopped containers too; check the list with docker ps -a first.</Callout>
            <p>To keep the cache from growing back, cap the build cache in Docker's daemon settings:</p>
            <Diff file="~/.docker/daemon.json" start={1}>{`
 {
-  "builder": { "gc": { "enabled": false } }
+  "builder": { "gc": { "enabled": true, "defaultKeepStorage": "20GB" } }
 }`}</Diff>
        </Section>

        <Section title="Limits">
            <Checks>
                <Check>Home folder measured to depth 2</Check>
                <Check status="failed">
                    <code>~/Library/Mail</code> denied access <Status tone="warn">not counted</Status>
                </Check>
                <Check status="skipped">System folders outside the home folder</Check>
            </Checks>
        </Section>
    </Report>
);
