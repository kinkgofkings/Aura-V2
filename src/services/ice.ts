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

let cached: IceServerConfig[] | null = null;
let loading: Promise<IceServerConfig[]> | null = null;

export async function loadIceServers(): Promise<IceServerConfig[]> {
  if (cached) return cached;
  if (loading) return loading;

  loading = (async () => {
    try {
      const res = await fetch("/api/webrtc/ice");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          cached = data.iceServers;
          return cached;
        }
      }
    } catch {
      // Fall through to public STUN.
    }
    cached = FALLBACK_ICE;
    return cached;
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
