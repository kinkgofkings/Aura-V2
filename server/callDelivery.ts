export interface PushSendResult {
  subscriptions: number;
  delivered: number;
  failed: number;
  removed: number;
}

export interface CallDelivery {
  pushSubscriptions: number;
  pushDelivered: number;
  pushFailed: number;
  realtimeDelivered: number;
  reachable: boolean;
  reason?: "no_push_subscription" | "push_failed";
}

export interface IncomingCallPushInput {
  callerId: string;
  callerName?: string;
  callerAvatar?: string;
  roomId: string;
  isVideo?: boolean;
  pulse?: number;
}

export function summarizeCallDelivery(push: PushSendResult, realtimeDelivered: number): CallDelivery {
  const reachable = realtimeDelivered > 0 || push.delivered > 0;
  let reason: CallDelivery["reason"];
  if (!reachable) {
    reason = push.subscriptions === 0 ? "no_push_subscription" : "push_failed";
  }
  return {
    pushSubscriptions: push.subscriptions,
    pushDelivered: push.delivered,
    pushFailed: push.failed,
    realtimeDelivered,
    reachable,
    reason,
  };
}

/** Web Push topics must be at most 32 characters. */
export function callPushTopic(roomId: string): string {
  const raw = `c${roomId}`.replace(/[^A-Za-z0-9_-]/g, "");
  return raw.slice(-32) || "incoming-call";
}

export function buildIncomingCallPush(input: IncomingCallPushInput) {
  const isVideo = input.isVideo !== false;
  const callerName = input.callerName || "Someone";
  const pulse = input.pulse || 0;
  return {
    type: "CALL_INCOMING",
    action: "incoming_call",
    title: `Incoming ${isVideo ? "Video" : "Audio"} Call`,
    body:
      pulse > 0
        ? `${callerName} is still calling on Aura...`
        : `${callerName} is calling you on Aura...`,
    callerId: input.callerId,
    callerName,
    callerAvatar: input.callerAvatar || "/icon.png",
    roomId: input.roomId,
    isVideo,
    ringPulse: pulse,
    url: `/?action=incoming_call&roomId=${encodeURIComponent(input.roomId)}&callerId=${encodeURIComponent(input.callerId)}&isVideo=${isVideo}`,
  };
}
