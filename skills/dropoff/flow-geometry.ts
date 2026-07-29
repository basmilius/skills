type FlowNode = {
    readonly id: string;
    readonly component: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
};

type FlowConnection = {
    readonly from: string;
    readonly to: string;
    readonly label: string;
    readonly icon: string;
    readonly markerStart: string;
    readonly markerEnd: string;
    readonly fromSide: string | undefined;
    readonly toSide: string | undefined;
    readonly fromAlign: string;
    readonly toAlign: string;
    readonly vertical: boolean | null;
    readonly around: boolean;
};

type FlowAnchor = {
    readonly node: string;
    readonly side: string;
    readonly align: string;
    readonly incoming: boolean;
    readonly connection: FlowConnection;
};

type FlowGroup = {
    readonly nodes: readonly string[];

    /** Where the frame starts, which is well above the first node it holds. */
    readonly top: number;
};

type FlowSize = {
    readonly component: string;
    readonly width: number;
    readonly height: number;
};

// Flow's own numbers, not measurements off a screenshot. A connector keeps
// NODE_GAP clear of each node it touches, its label punches a hole the size of
// the badge out of the middle of the line, and the two markers eat into what is
// left. MIN_LINE is the shortest stretch that still reads as a line.
const NODE_GAP = 9;
const BADGE_HEIGHT = 28;
const BADGE_PADDING = 20;
const LABEL_GAP = 6;
const MARKERS = 11;
const MIN_LINE = 15;

// An icon without a label rides the connector as a bare badge: no padding and no
// background, just the icon at 20px. Flow masks the line against it exactly as it
// does a label, and the icon is square, so it asks the same on both axes.
const ICON_SIZE = 20;

// A connector carrying neither needs far less: no hole in the middle, so only the
// markers and a stretch of line on either side of them.
const MIN_GAP = 60;

// What Flow itself leaves between two layers once a connector carries a label,
// straight out of LABELLED_GAP in @flux-ui/flow. Its own auto-layout will not go
// below this, so neither does the check: the sum below can work out lower on a
// short label, and a diagram that only just clears the arithmetic still reads
// cramped next to one Flow laid out itself. A horizontal run asks for far more,
// since a badge there is as wide as its text rather than one line high.
const LABELLED_GAP = {vertical: 105, horizontal: 210};

// Rough type metrics. A card is 300px wide with 15px of padding, so about 36
// characters of 15px text fit on a line; a badge sets 13px text.
const CARD_CHARACTERS = 36;
const NOTE_CHARACTERS = 26;
const BADGE_CHARACTER = 7;
const CARD_LINE = 24;
const NOTE_LINE = 21;

const CARD_COMPONENTS = ['FluxFlowCard', 'FluxFlowActionCard', 'FluxFlowConditionCard', 'FluxFlowTriggerCard'];

// The shapes that are themselves the point where paths meet, so a connector
// touching one carries no marker on that end.
const ANCHOR_COMPONENTS = ['FluxFlowGate', 'FluxFlowJunction'];

// A group draws its frame from the nodes it names rather than from coordinates of
// its own: this much around them, and a title adds a band on top of that. Neither
// is visible while you place nodes, which is how a connector's badge ends up on
// the dashed border long before it would touch a card.
const GROUP_PADDING = 21;
const GROUP_TITLE = 60;

/**
 * Reads a Flow template back and reports every pair of nodes that sits too close
 * for the connector between them, plus every connector still carrying a marker
 * where it meets a junction or a gate. Nothing in Flow lays a diagram out, so
 * this is the only thing standing between a typo in a coordinate and a published
 * diagram with its badge sitting on top of its own line.
 */
export default function checkFlowGeometry(source: string): string[] {
    const nodes = readNodes(source);
    const groups = readGroups(source, nodes);
    const axis = readAxis(source);
    const problems: string[] = [];
    const anchors: FlowAnchor[] = [];

    for (const connection of readConnections(source)) {
        const from = nodes.get(connection.from);
        const to = nodes.get(connection.to);

        if (!from || !to) {
            problems.push(`${connection.from} -> ${connection.to}: there is no node with id "${from ? connection.to : connection.from}".`);
            continue;
        }

        if (isAnchor(from) && connection.markerStart !== 'none') {
            problems.push(`${connection.from} -> ${connection.to}: the end touching ${shape(from)} "${from.id}" needs marker-start="none".`);
        }

        if (isAnchor(to) && connection.markerEnd !== 'none') {
            problems.push(`${connection.from} -> ${connection.to}: the end touching ${shape(to)} "${to.id}" needs marker-end="none".`);
        }

        // A connection from a node to itself is drawn as a loop beside that node
        // rather than a run between two, so there is no gap to measure: doing so
        // would report the node as overlapping itself. One that leaves and
        // arrives on the same side swings around the nodes the same way, which is
        // how a retry gets back to the step above it, and measuring the axis that
        // side names would report two nodes in one column as overlapping.
        const vertical = connection.vertical ?? axis ?? isVertical(from, to);

        // A self-loop leaves and arrives on the node it belongs to, so both of
        // its ends sitting there is the shape rather than a clash.
        if (connection.from !== connection.to) {
            const [fromSide, toSide] = resolveSides(connection, from, to, vertical);

            anchors.push({node: from.id, side: fromSide, align: connection.fromAlign, incoming: false, connection});
            anchors.push({node: to.id, side: toSide, align: connection.toAlign, incoming: true, connection});
        }

        if (connection.from === connection.to || connection.around) {
            continue;
        }

        const gap = vertical
            ? distance(from.y, from.height, to.y, to.height)
            : distance(from.x, from.width, to.x, to.width);
        const badge = badgeSize(connection, vertical);
        const plain = requiredGap(connection, badge, vertical);
        const frame = frameGap(from, to, groups, badge, vertical);
        const required = Math.max(plain, frame);

        if (gap < 0) {
            problems.push(`${connection.from} -> ${connection.to}: the nodes overlap by ${-gap}px.`);
        } else if (gap < required) {
            const because = frame > plain ? ', which is what it takes to clear the frame of the group it enters' : '';

            problems.push(`${connection.from} -> ${connection.to}: ${gap}px between them, and ${describe(connection)} needs ${required}px${because}.`);
        }
    }

    problems.push(...checkAnchors(anchors));

    return problems;
}

/**
 * Every point where a line both arrives and leaves. Flow attaches both ends at
 * the same spot, so the incoming chevron lands on the outgoing dot and the flow
 * appears to go back the way it came instead of carrying on. Two lines leaving
 * one point is a branch and two arriving is a merge, both of which read fine, so
 * only the mixed pair is reported.
 */
function checkAnchors(anchors: FlowAnchor[]): string[] {
    const points = new Map<string, FlowAnchor[]>();

    for (const anchor of anchors) {
        const key = `${anchor.node}|${anchor.side}|${anchor.align}`;

        points.set(key, [...(points.get(key) ?? []), anchor]);
    }

    const problems: string[] = [];

    for (const sharing of points.values()) {
        const arriving = sharing.find(anchor => anchor.incoming);
        const leaving = sharing.find(anchor => !anchor.incoming);

        if (arriving === undefined || leaving === undefined) {
            continue;
        }

        const where = arriving.align === 'center' ? `the ${arriving.side} of` : `the ${arriving.align} of the ${arriving.side} side of`;

        problems.push(`${leaving.connection.from} -> ${leaving.connection.to}: it leaves ${where} "${arriving.node}", where ${arriving.connection.from} -> ${arriving.connection.to} already arrives. Send one of the two out of another side.`);
    }

    return problems;
}

/**
 * Which side of each node a connection actually touches, naming the sides Flow
 * itself would pick when the markup leaves them out: a connection running down
 * the page leaves the bottom and arrives at the top, one running across leaves
 * the right and arrives at the left, and either flips when the target sits the
 * other way round.
 */
function resolveSides(connection: FlowConnection, from: FlowNode, to: FlowNode, vertical: boolean): [string, string] {
    const forward = vertical
        ? to.y + to.height / 2 >= from.y + from.height / 2
        : to.x + to.width / 2 >= from.x + from.width / 2;

    const automatic = vertical
        ? (forward ? 'bottom' : 'top')
        : (forward ? 'right' : 'left');

    const fromSide = connection.fromSide ?? (connection.toSide === undefined ? automatic : opposite(connection.toSide)!);

    return [fromSide, connection.toSide ?? opposite(fromSide)!];
}

/**
 * The clear space a connector needs. Without a badge that is only the markers and
 * a stretch of line. With one it is what the badge punches out of the middle plus
 * the room around it, and a labelled connector never goes below what Flow's own
 * layout leaves for one, however short the label.
 */
function requiredGap(connection: FlowConnection, badge: number | null, vertical: boolean): number {
    if (badge === null) {
        return MIN_GAP;
    }

    const room = NODE_GAP * 2 + badge + LABEL_GAP * 2 + MARKERS + MIN_LINE * 2;

    return connection.label ? Math.max(room, LABELLED_GAP[vertical ? 'vertical' : 'horizontal']) : room;
}

// How much of the line the badge covers, or null when there is no badge at all. A
// labelled badge is one line tall whichever way the connector runs, but as wide as
// its text, so a long label pushes two columns further apart; an icon beside that
// label widens it again. A bare icon is square and asks for the same on both axes.
function badgeSize(connection: FlowConnection, vertical: boolean): number | null {
    if (connection.label) {
        if (vertical) {
            return BADGE_HEIGHT;
        }

        const icon = connection.icon ? ICON_SIZE + LABEL_GAP : 0;

        return BADGE_PADDING + icon + connection.label.length * BADGE_CHARACTER;
    }

    return connection.icon ? ICON_SIZE : null;
}

/**
 * The space a connection needs on top of its own when it comes down into a group
 * from outside. The frame starts above the first node the group holds, a title
 * puts a band above that again, and the badge rides the middle of the connector,
 * so the two nodes have to stand twice that distance apart for the badge to land
 * clear of the dashed border. Zero for every connection that crosses no frame,
 * and for one leaving a group, since only the top edge carries the band.
 */
function frameGap(from: FlowNode, to: FlowNode, groups: FlowGroup[], badge: number | null, vertical: boolean): number {
    if (!vertical || from.y >= to.y) {
        return 0;
    }

    const entered = groups.find(group => group.nodes.includes(to.id) && !group.nodes.includes(from.id));

    if (entered === undefined) {
        return 0;
    }

    const offset = to.y - entered.top;

    // Without a badge nothing rides the line, so the node above only has to stay
    // off the frame itself.
    return badge === null
        ? offset + NODE_GAP
        : Math.ceil(2 * (offset + badge / 2 + LABEL_GAP));
}

function isAnchor(node: FlowNode): boolean {
    return ANCHOR_COMPONENTS.includes(node.component);
}

// "junction" or "gate", so a report reads as the diagram does rather than naming
// the component.
function shape(node: FlowNode): string {
    return node.component.replace('FluxFlow', '').toLowerCase();
}

// Names the connector the way the diagram writes it, so a reported pair can be
// found back in the template.
function describe(connection: FlowConnection): string {
    if (connection.label) {
        return `a connector labelled "${connection.label}"`;
    }

    return connection.icon ? `a connector carrying the icon "${connection.icon}"` : 'a connector';
}

// The clear space between two nodes on one axis, whichever of the two comes
// first, so a connection drawn upwards measures the same as one drawn down.
function distance(fromStart: number, fromExtent: number, toStart: number, toExtent: number): number {
    return fromStart <= toStart
        ? toStart - (fromStart + fromExtent)
        : fromStart - (toStart + toExtent);
}

/**
 * The groups in a template, each with the top edge of the frame it will draw. An
 * id naming a node that does not exist is dropped rather than reported: Flow
 * skips it too, so a group listing one simply draws around the rest.
 */
function readGroups(source: string, nodes: Map<string, FlowNode>): FlowGroup[] {
    const groups: FlowGroup[] = [];
    const pattern = /<FluxFlowGroup\b([^>]*?)\/?>/g;

    for (const [, attributes] of source.matchAll(pattern)) {
        const named = (attribute(attributes, 'nodes') ?? '')
            .split(',')
            .map(id => id.replace(/[^\w-]/g, ''))
            .filter(id => nodes.has(id));

        if (named.length === 0) {
            continue;
        }

        const band = attribute(attributes, 'title') === undefined ? 0 : GROUP_TITLE;
        const first = Math.min(...named.map(id => nodes.get(id)!.y));

        groups.push({nodes: named, top: first - GROUP_PADDING - band});
    }

    return groups;
}

// `<FluxFlow axis="...">` settles the axis for every connection that does not
// name a side of its own, so it wins over the heuristic below the same way it
// does in Flow. Null when the root leaves it open, which is the usual case.
function readAxis(source: string): boolean | null {
    const axis = attribute(source.match(/<FluxFlow\b([^>]*)>/)?.[1] ?? '', 'axis');

    return axis === undefined ? null : axis === 'vertical';
}

// Mirrors `autoSides` in Flow: without explicit sides, a connection runs along
// whichever axis separates the two centres most.
function isVertical(from: FlowNode, to: FlowNode): boolean {
    const dx = (to.x + to.width / 2) - (from.x + from.width / 2);
    const dy = (to.y + to.height / 2) - (from.y + from.height / 2);

    return Math.abs(dy) >= Math.abs(dx);
}

function readNodes(source: string): Map<string, FlowNode> {
    const nodes = new Map<string, FlowNode>();
    const pattern = /<FluxFlowNode\b([^>]*?)(?:\/>|>([\s\S]*?)<\/FluxFlowNode>)/g;

    for (const [, attributes, content] of source.matchAll(pattern)) {
        const id = attribute(attributes, 'id');
        const x = number(attribute(attributes, 'x'));
        const y = number(attribute(attributes, 'y'));

        // A coordinate that is not a plain number cannot be checked, and neither
        // can a node nothing connects to by name.
        if (id === undefined || x === null || y === null) {
            continue;
        }

        nodes.set(id, {id, x, y, ...measure(content ?? '')});
    }

    return nodes;
}

function readConnections(source: string): FlowConnection[] {
    const connections: FlowConnection[] = [];
    const pattern = /<FluxFlowConnection\b([^>]*?)\/?>/g;

    for (const [, attributes] of source.matchAll(pattern)) {
        const from = attribute(attributes, 'from');
        const to = attribute(attributes, 'to');

        if (from === undefined || to === undefined) {
            continue;
        }

        const fromSide = attribute(attributes, 'from-side');
        const toSide = attribute(attributes, 'to-side');
        const side = fromSide ?? opposite(toSide);

        connections.push({
            from,
            to,
            label: attribute(attributes, 'label') ?? '',
            icon: attribute(attributes, 'icon') ?? '',
            markerStart: attribute(attributes, 'marker-start') ?? 'dot',
            markerEnd: attribute(attributes, 'marker-end') ?? 'chevron',
            fromSide,
            toSide,
            fromAlign: attribute(attributes, 'from-align') ?? 'center',
            toAlign: attribute(attributes, 'to-align') ?? 'center',
            vertical: side === undefined ? null : (side === 'top' || side === 'bottom'),
            around: fromSide !== undefined && fromSide === toSide
        });
    }

    return connections;
}

// What a node measures on the canvas, estimated from the component it holds and
// the text in it, along with the name of that component. Sizes are deliberately
// on the low side: a card guessed too tall would report a gap that is not really
// too small.
function measure(content: string): FlowSize {
    const component = content.match(/<(FluxFlow[A-Za-z]+)/)?.[1] ?? '';
    const attributes = content.match(/<FluxFlow[A-Za-z]+([^>]*)>/)?.[1] ?? '';
    const label = attribute(attributes, 'label') ?? '';
    const body = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    if (CARD_COMPONENTS.includes(component)) {
        return {component, width: 300, height: body ? 76 + CARD_LINE * lines(body, CARD_CHARACTERS) : 62};
    }

    switch (component) {
        case 'FluxFlowNote':
            return {component, width: 210, height: 50 + NOTE_LINE * lines(body, NOTE_CHARACTERS)};
        case 'FluxFlowTerminal':
            // A terminal is a capsule of 18px padding either side; an icon on it
            // adds its own 15px and the 6px gap after it.
            return {component, width: 40 + label.length * 8 + (attribute(attributes, 'icon') ? 21 : 0), height: 36};
        case 'FluxFlowPill':
            return {component, width: 54 + label.length * 8, height: 44};
        case 'FluxFlowStep':
            return {component, width: 36, height: 36};
        case 'FluxFlowGate':
            return {component, width: 60, height: 60};
        case 'FluxFlowJunction':
            return {component, width: 18, height: 18};
        default:
            return {component, width: 36, height: 36};
    }
}

function lines(text: string, perLine: number): number {
    return Math.max(1, Math.ceil(text.length / perLine));
}

function opposite(side: string | undefined): string | undefined {
    switch (side) {
        case 'top':
            return 'bottom';
        case 'bottom':
            return 'top';
        case 'left':
            return 'right';
        case 'right':
            return 'left';
        default:
            return undefined;
    }
}

function attribute(attributes: string, name: string): string | undefined {
    return attributes.match(new RegExp(`(?:^|\\s):?${name}\\s*=\\s*"([^"]*)"`))?.[1];
}

function number(value: string | undefined): number | null {
    const parsed = Number(value);

    return value !== undefined && value !== '' && Number.isFinite(parsed) ? parsed : null;
}
