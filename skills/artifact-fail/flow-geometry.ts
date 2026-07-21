type FlowNode = {
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
};

type FlowConnection = {
    readonly from: string;
    readonly to: string;
    readonly label: string;
    readonly vertical: boolean | null;
};

type FlowSize = {
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

// A connector without a label needs far less: no hole in the middle, so only the
// markers and a stretch of line on either side of them.
const MIN_GAP = 60;

// Rough type metrics. A card is 300px wide with 15px of padding, so about 36
// characters of 15px text fit on a line; a badge sets 13px text.
const CARD_CHARACTERS = 36;
const NOTE_CHARACTERS = 26;
const BADGE_CHARACTER = 7;
const CARD_LINE = 24;
const NOTE_LINE = 21;

const CARD_COMPONENTS = ['FluxFlowCard', 'FluxFlowActionCard', 'FluxFlowConditionCard', 'FluxFlowTriggerCard'];

/**
 * Reads a Flow template back and reports every pair of nodes that sits too close
 * for the connector between them. Nothing in Flow lays a diagram out, so this is
 * the only thing standing between a typo in a coordinate and a published diagram
 * with its label sitting on top of its own line.
 */
export default function checkFlowGeometry(source: string): string[] {
    const nodes = readNodes(source);
    const problems: string[] = [];

    for (const connection of readConnections(source)) {
        const from = nodes.get(connection.from);
        const to = nodes.get(connection.to);

        if (!from || !to) {
            problems.push(`${connection.from} -> ${connection.to}: there is no node with id "${from ? connection.to : connection.from}".`);
            continue;
        }

        const vertical = connection.vertical ?? isVertical(from, to);
        const gap = vertical
            ? distance(from.y, from.height, to.y, to.height)
            : distance(from.x, from.width, to.x, to.width);
        const required = connection.label ? labelledGap(vertical, connection.label) : MIN_GAP;

        if (gap < 0) {
            problems.push(`${connection.from} -> ${connection.to}: the nodes overlap by ${-gap}px.`);
        } else if (gap < required) {
            problems.push(`${connection.from} -> ${connection.to}: ${gap}px between them, and ${connection.label ? `a connector labelled "${connection.label}"` : 'a connector'} needs ${required}px.`);
        }
    }

    return problems;
}

// The space a labelled connector needs: clear of both nodes, the hole its badge
// punches, the markers, and a visible stretch of line on either side of the
// badge. A vertical badge is always one line tall; a horizontal one is as wide as
// its text, so a long label pushes two columns further apart.
function labelledGap(vertical: boolean, label: string): number {
    const badge = vertical ? BADGE_HEIGHT : BADGE_PADDING + label.length * BADGE_CHARACTER;

    return NODE_GAP * 2 + badge + LABEL_GAP * 2 + MARKERS + MIN_LINE * 2;
}

// The clear space between two nodes on one axis, whichever of the two comes
// first, so a connection drawn upwards measures the same as one drawn down.
function distance(fromStart: number, fromExtent: number, toStart: number, toExtent: number): number {
    return fromStart <= toStart
        ? toStart - (fromStart + fromExtent)
        : fromStart - (toStart + toExtent);
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

        const side = attribute(attributes, 'from-side') ?? opposite(attribute(attributes, 'to-side'));

        connections.push({
            from,
            to,
            label: attribute(attributes, 'label') ?? '',
            vertical: side === undefined ? null : (side === 'top' || side === 'bottom')
        });
    }

    return connections;
}

// What a node measures on the canvas, estimated from the component it holds and
// the text in it. Deliberately on the low side: a card guessed too tall would
// report a gap that is not really too small.
function measure(content: string): FlowSize {
    const component = content.match(/<(FluxFlow[A-Za-z]+)/)?.[1] ?? '';
    const attributes = content.match(/<FluxFlow[A-Za-z]+([^>]*)>/)?.[1] ?? '';
    const label = attribute(attributes, 'label') ?? '';
    const body = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    if (CARD_COMPONENTS.includes(component)) {
        return {width: 300, height: body ? 76 + CARD_LINE * lines(body, CARD_CHARACTERS) : 62};
    }

    switch (component) {
        case 'FluxFlowNote':
            return {width: 210, height: 50 + NOTE_LINE * lines(body, NOTE_CHARACTERS)};
        case 'FluxFlowTerminal':
            return {width: 40 + label.length * 8, height: 36};
        case 'FluxFlowPill':
            return {width: 54 + label.length * 8, height: 44};
        case 'FluxFlowStep':
            return {width: 36, height: 36};
        case 'FluxFlowGate':
            return {width: 60, height: 60};
        case 'FluxFlowJunction':
            return {width: 18, height: 18};
        default:
            return {width: 36, height: 36};
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
