export type RealtimeHandler = (event: any) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private handlers = new Map<string, Set<RealtimeHandler>>();
  private retry = 0;
  private stopped = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(userId: string) {
    if (!userId || typeof window === "undefined") return;
    if (
      this.userId === userId &&
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    this.stopped = false;
    this.userId = userId;
    this.open();
  }

  disconnect() {
    this.stopped = true;
    this.userId = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  on(type: string, handler: RealtimeHandler) {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler);
    return () => {
      set?.delete(handler);
    };
  }

  private open() {
    if (this.stopped || !this.userId || typeof window === "undefined") return;
    if (this.ws) {
      this.ws.onclose = null;
      try {
        this.ws.close();
      } catch {
        // Already closing.
      }
    }

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(
      `${proto}://${window.location.host}/ws?userId=${encodeURIComponent(this.userId)}`
    );
    this.ws = ws;

    ws.onopen = () => {
      this.retry = 0;
      ws.send(JSON.stringify({ type: "hello", userId: this.userId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const type = data?.type;
        if (!type) return;
        this.handlers.get(type)?.forEach((handler) => {
          try {
            handler(data);
          } catch (err) {
            console.warn("Realtime handler error:", err);
          }
        });
      } catch {
        // Ignore malformed frames.
      }
    };

    ws.onclose = () => {
      if (this.ws === ws) this.ws = null;
      if (this.stopped) return;
      const delay = Math.min(10000, 500 * 2 ** this.retry);
      this.retry += 1;
      this.reconnectTimer = setTimeout(() => this.open(), delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }
}

export const realtime = new RealtimeClient();
