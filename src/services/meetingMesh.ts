/** Lower id starts the offer so two people never both create the call. */
export function shouldInitiateMeshOffer(localUserId: string, remoteUserId: string): boolean {
  if (!localUserId || !remoteUserId || localUserId === remoteUserId) return false;
  return localUserId < remoteUserId;
}

export function meetingSignalKey(signal: {
  fromUserId: string;
  toUserId?: string;
  type: string;
  timestamp: number;
}): string {
  return `${signal.fromUserId}|${signal.toUserId || ''}|${signal.type}|${signal.timestamp}`;
}
