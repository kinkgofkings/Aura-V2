export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

const FALLBACK_ICE: IceServerConfig[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

let cached: { servers: IceServerConfig[]; expiresAt: number } | null = null;
let loading: Promise<IceServerConfig[]> | null = null;

export async function loadIceServers(): Promise<IceServerConfig[]> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.servers;
  if (loading) return loading;

  loading = (async () => {
    try {
      const res = await fetch("/api/webrtc/ice");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          const expiresAt = typeof data.expiresAt === "number"
            ? data.expiresAt
            : Date.now() + 10 * 60 * 1000;
          cached = { servers: data.iceServers, expiresAt };
          return cached.servers;
        }
      }
    } catch {
      // Fall through to public STUN.
    }
    cached = { servers: FALLBACK_ICE, expiresAt: Date.now() + 60 * 1000 };
    return cached.servers;
  })();

  try {
    return await loading;
  } finally {
    loading = null;
  }
}

export function iceConfiguration(servers: IceServerConfig[]): RTCConfiguration {
  return { iceServers: servers };
}
