import type { FastifyInstance } from "fastify";
import { EventEmitter } from "events";
export declare const emitter: EventEmitter<[never]>;
export interface DbEvent {
    table: string;
    operation: "insert" | "update" | "delete";
    schema?: string;
    record?: Record<string, unknown>;
    old_record?: Record<string, unknown> | null;
    timestamp: string;
}
/** Publish a DB change event to all connected SSE clients. */
export declare function publishEvent(event: DbEvent): void;
export declare function registerRealtimeRoutes(fastify: FastifyInstance): Promise<void>;
//# sourceMappingURL=realtime.d.ts.map