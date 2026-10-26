import type { Row, Table } from './table';
import { clamp } from './numbers';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

export interface Page {
    readonly rows: readonly Row[];
    readonly offset: number;

    /** `null` once the last page has been read. */
    readonly next: number | null;
}

export function readPage(table: Table, offset: number, limit = DEFAULT_LIMIT): Page {
    if (offset < 0) {
        throw new RangeError(`Offset ${offset} is negative.`);
    }

    const size = clamp(limit, 1, MAX_LIMIT);
    const rows = table.rows.slice(offset, offset + size);
    const end = offset + rows.length;

    return {
        rows,
        offset,
        next: end < table.rows.length ? end : null
    };
}

export function pageLabels(table: Table, limit = DEFAULT_LIMIT): string[] {
    const size = clamp(limit, 1, MAX_LIMIT);

    const labelOf = (start: number): string => {
        const last = Math.min(start + size, table.rows.length);

        return `${start + 1}-${last}`;
    };

    const labels: string[] = [];

    for (let start = 0; start < table.rows.length; start += size) {
        labels.push(labelOf(start));
    }

    return labels;
}

export function firstMatch(table: Table, query: string): Row | null {
    const needle = query.trim().toLowerCase();

    if (needle === '') {
        return null;
    }

    return table.rows.find((row) => row.label.toLowerCase().includes(needle)) ?? null;
}
