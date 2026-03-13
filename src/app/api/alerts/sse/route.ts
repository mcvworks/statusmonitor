import { alertEventBus } from "@/lib/polling/event-bus";
import type { Alert } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

interface SSEEvent {
  type: "alert:new" | "alert:updated" | "alert:resolved";
  alert: Alert;
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      function send(event: SSEEvent) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          // Stream closed, cleanup will handle unsubscribe
        }
      }

      // Send heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      const onNew = (alert: Alert) =>
        send({ type: "alert:new", alert });
      const onUpdated = (alert: Alert) =>
        send({ type: "alert:updated", alert });
      const onResolved = (alert: Alert) =>
        send({ type: "alert:resolved", alert });

      alertEventBus.on("alert:new", onNew);
      alertEventBus.on("alert:updated", onUpdated);
      alertEventBus.on("alert:resolved", onResolved);

      // Cleanup on client disconnect
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Store cleanup refs for cancel
      (controller as unknown as Record<string, unknown>).__cleanup = () => {
        clearInterval(heartbeat);
        alertEventBus.off("alert:new", onNew);
        alertEventBus.off("alert:updated", onUpdated);
        alertEventBus.off("alert:resolved", onResolved);
      };
    },
    cancel(controller) {
      const cleanup = (controller as unknown as Record<string, unknown>)
        .__cleanup as (() => void) | undefined;
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
