export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

const DEFAULT_STUN: IceServerConfig[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

/**
 * STUN is always included. TURN is added only when TURN_URLS, TURN_USERNAME,
 * and TURN_CREDENTIAL are set. TURN is what lets audio and video cross
 * mobile-data networks where a direct peer connection is blocked.
 */
export function getIceServers(env: NodeJS.ProcessEnv = process.env): IceServerConfig[] {
  const iceServers: IceServerConfig[] = [...DEFAULT_STUN];
  const turnUrls = (env.TURN_URLS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const username = (env.TURN_USERNAME || "").trim();
  const credential = (env.TURN_CREDENTIAL || "").trim();

  if (turnUrls.length > 0 && username && credential) {
    iceServers.push({ urls: turnUrls, username, credential });
  }

  return iceServers;
}

export function hasTurnServer(env: NodeJS.ProcessEnv = process.env): boolean {
  return getIceServers(env).some((server) => {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    return urls.some((url) => url.startsWith("turn:") || url.startsWith("turns:"));
  });
}
