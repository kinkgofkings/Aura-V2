import type { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

interface SocketClient {
  ws: WebSocket;
  userId: string;
}

const clients = new Set<SocketClient>();
let wss: WebSocketServer | null = null;

export function attachRealtime(server: HttpServer) {
  wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = request.url || "";
    if (!url.startsWith("/ws")) {
      return;
    }
    wss?.handleUpgrade(request, socket, head, (ws) => {
      wss?.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws, request) => {
    const host = request.headers.host || "localhost";
    let userId = "";
    try {
      const parsed = new URL(request.url || "/ws", `http://${host}`);
      userId = (parsed.searchParams.get("userId") || "").trim();
    } catch {
      userId = "";
    }

    const client: SocketClient = { ws, userId };
    clients.add(client);

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data?.type === "hello" && typeof data.userId === "string") {
          client.userId = data.userId.trim();
        } else if (data?.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", at: Date.now() }));
        }
      } catch {
        // Ignore malformed client frames.
      }
    });

    ws.on("close", () => {
      clients.delete(client);
    });

    ws.on("error", () => {
      clients.delete(client);
    });

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "ready", userId }));
    }
  });

  return wss;
}

export function pushToUser(userId: string, event: Record<string, unknown>): number {
  const target = String(userId || "").trim();
  if (!target) return 0;
  const payload = JSON.stringify(event);
  let delivered = 0;
  for (const client of clients) {
    if (client.userId === target && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
      delivered += 1;
    }
  }
  return delivered;
}

export function countSockets(userId?: string): number {
  if (!userId) return clients.size;
  const target = String(userId).trim();
  let count = 0;
  for (const client of clients) {
    if (client.userId === target && client.ws.readyState === WebSocket.OPEN) count += 1;
  }
  return count;
}
