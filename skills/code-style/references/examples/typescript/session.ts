import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

export const SessionSchema = z.object({
    id: z.string(),
    startedAt: z.number(),
    endedAt: z.number().nullable()
});
export type Session = z.infer<typeof SessionSchema>;

type Listener = (session: Session) => void;

export class SessionLog {
    readonly #sessions = new Map<string, Session>();
    readonly #listeners = new Set<Listener>();
    readonly #clock: () => number;

    constructor(clock: () => number = Date.now) {
        this.#clock = clock;
    }

    start(id: string): Session {
        const existing = this.#sessions.get(id);

        if (existing?.endedAt === null) {
            return existing;
        }

        const session: Session = { id, startedAt: this.#clock(), endedAt: null };

        this.#sessions.set(id, session);
        this.#emit(session);

        return session;
    }

    end(id: string): void {
        const session = this.#sessions.get(id);

        if (session === undefined || session.endedAt !== null) {
            return;
        }

        const ended = { ...session, endedAt: this.#clock() };

        this.#sessions.set(id, ended);
        this.#emit(ended);
    }

    subscribe(listener: Listener): () => void {
        this.#listeners.add(listener);

        return () => this.#listeners.delete(listener);
    }

    #emit(session: Session): void {
        for (const listener of this.#listeners) {
            listener(session);
        }
    }
}

describe('SessionLog', () => {
    test('a second start returns the open session', () => {
        let now = 1_000;
        const log = new SessionLog(() => now);

        const first = log.start('a');
        now = 2_000;
        const second = log.start('a');

        expect(second).toBe(first);
        expect(second.startedAt).toBe(1_000);
    });

    test('end notifies once with the end time', () => {
        const seen: Session[] = [];
        const log = new SessionLog(() => 5_000);

        log.subscribe((session) => seen.push(session));
        log.start('a');
        log.end('a');
        log.end('a');

        expect(seen.map((session) => session.endedAt)).toEqual([null, 5_000]);
    });
});
