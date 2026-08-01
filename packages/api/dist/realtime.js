import { EventEmitter } from "events";
export const emitter = new EventEmitter();
emitter.setMaxListeners(500);
/** Publish a DB change event to all connected SSE clients. */
export function publishEvent(event) {
    emitter.emit("db-change", event);
}
export async function registerRealtimeRoutes(fastify) {
    fastify.get("/api/v1/events", async (request, reply) => {
        const query = request.query;
        const token = request.headers.authorization ?? (query.token ? `Bearer ${query.token}` : undefined);
        if (!token?.startsWith("Bearer ")) {
            return reply.status(401).send({ error: "Missing Authorization header" });
        }
        reply.raw.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        });
        // Send initial connection ping
        reply.raw.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
        const handler = (event) => {
            reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
        };
        emitter.on("db-change", handler);
        request.raw.on("close", () => {
            emitter.off("db-change", handler);
        });
        // Keep connection alive with periodic pings
        const keepAlive = setInterval(() => {
            reply.raw.write(`:ping\n\n`);
        }, 30_000);
        request.raw.on("close", () => {
            clearInterval(keepAlive);
        });
    });
}
