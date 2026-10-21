export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

const FALLBACK_ICE: IceServerConfig[] = [
  // Fast Google & Cloudflare STUN
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  // OpenRelay Global TURN Servers (Essential for mobile LTE / 5G / Symmetric NAT bypass)
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp',
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

let cached: IceServerConfig[] | null = null;
let loading: Promise<IceServerConfig[]> | null = null;

export async function loadIceServers(): Promise<IceServerConfig[]> {
  if (cached) return cached;
  if (loading) return loading;

  loading = (async () => {
    try {
      const res = await fetch('/api/webrtc/ice');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          cached = data.iceServers;
          return cached;
        }
      }
    } catch {
      // Fall through to fallback STUN + TURN
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
  return {
    iceServers: servers.length > 0 ? servers : FALLBACK_ICE,
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceCandidatePoolSize: 10,
  };
}
