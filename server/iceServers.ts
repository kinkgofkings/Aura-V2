import { createHmac } from "crypto";

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface IcePayload {
  iceServers: IceServerConfig[];
  turnConfigured: boolean;
  /** Unix ms when a short-lived TURN password expires. Absent for a static password. */
  expiresAt?: number;
}

const DEFAULT_STUN: IceServerConfig[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

const DEFAULT_TURN_TTL_SECONDS = 12 * 60 * 60;

export function splitTurnUrls(raw: string | undefined): string[] {
  return (raw || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Coturn REST credential. The username is "<expiry unix>:<name>" and the
 * password is base64(HMAC-SHA1(secret, username)).
 */
export function mintTurnCredential(
  secret: string,
  ttlSeconds = DEFAULT_TURN_TTL_SECONDS,
  identity = "aura"
): { username: string; credential: string; expiresAt: number } {
  const ttl = Number.isFinite(ttlSeconds) && ttlSeconds >= 60 ? Math.floor(ttlSeconds) : DEFAULT_TURN_TTL_SECONDS;
  const expiresAtSeconds = Math.floor(Date.now() / 1000) + ttl;
  const username = `${expiresAtSeconds}:${identity}`;
  const credential = createHmac("sha1", secret).update(username).digest("base64");
  return { username, credential, expiresAt: expiresAtSeconds * 1000 };
}

function turnConfigured(servers: IceServerConfig[]): boolean {
  return servers.some((server) => {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    return urls.some((url) => url.startsWith("turn:") || url.startsWith("turns:"));
  });
}

/**
 * STUN is always included. A static TURN username is used when TURN_USERNAME
 * and TURN_CREDENTIAL are set. Otherwise TURN_SECRET mints a short-lived
 * Coturn REST password. TURN is what lets audio and video cross mobile-data
 * networks where a direct peer connection is blocked.
 */
export function describeIce(env: NodeJS.ProcessEnv = process.env): IcePayload {
  const iceServers: IceServerConfig[] = [...DEFAULT_STUN];
  const turnUrls = splitTurnUrls(env.TURN_URLS);
  const username = (env.TURN_USERNAME || "").trim();
  const credential = (env.TURN_CREDENTIAL || "").trim();
  const secret = (env.TURN_SECRET || "").trim();
  const ttl = Number(env.TURN_TTL_SECONDS || DEFAULT_TURN_TTL_SECONDS);
  let expiresAt: number | undefined;

  if (turnUrls.length > 0 && username && credential) {
    iceServers.push({
      urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls,
      username,
      credential,
    });
  } else if (turnUrls.length > 0 && secret) {
    const minted = mintTurnCredential(secret, ttl);
    expiresAt = minted.expiresAt;
    iceServers.push({
      urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls,
      username: minted.username,
      credential: minted.credential,
    });
  }

  const payload: IcePayload = {
    iceServers,
    turnConfigured: turnConfigured(iceServers),
  };
  if (expiresAt) payload.expiresAt = expiresAt;
  return payload;
}

export function getIceServers(env: NodeJS.ProcessEnv = process.env): IceServerConfig[] {
  return describeIce(env).iceServers;
}

export function hasTurnServer(env: NodeJS.ProcessEnv = process.env): boolean {
  const urls = splitTurnUrls(env.TURN_URLS);
  const hasStatic = Boolean((env.TURN_USERNAME || "").trim() && (env.TURN_CREDENTIAL || "").trim());
  const hasSecret = Boolean((env.TURN_SECRET || "").trim());
  return urls.some((url) => url.startsWith("turn:") || url.startsWith("turns:")) && (hasStatic || hasSecret);
}
