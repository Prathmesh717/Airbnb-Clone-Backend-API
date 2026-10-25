import { getThread } from "../../../../../../server/messaging";
import { requireAuth } from "../../../../../../lib/server/auth";
import { subscribeToThread } from "../../../../../../lib/server/events";
import { withApiErrors } from "../../../../../../lib/server/http";

type RouteContext = { params: { id: string } };

export async function GET(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const context = await requireAuth(request);
    await getThread(context, params.id);
    const encoder = new TextEncoder();
    let unsubscribe: () => void = () => {};
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };
        send("ready", { threadId: params.id });
        unsubscribe = subscribeToThread(params.id, (messageEvent) => send(messageEvent.type, messageEvent));
        heartbeat = setInterval(() => send("ping", { at: new Date().toISOString() }), 25_000);
        request.signal.addEventListener("abort", () => {
          unsubscribe();
          if (heartbeat) clearInterval(heartbeat);
          try {
            controller.close();
          } catch {
            // The stream may already be closed by the runtime.
          }
        });
      },
      cancel() {
        unsubscribe();
        if (heartbeat) clearInterval(heartbeat);
      },
    });
    return new Response(stream, {
      headers: {
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "content-type": "text/event-stream",
      },
    });
  });
}
