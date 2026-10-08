import assert from "node:assert/strict";
import { buildIncomingCallPush, callPushTopic, summarizeCallDelivery } from "../server/callDelivery";
import { getIceServers, hasTurnServer } from "../server/iceServers";

const unreachable = summarizeCallDelivery(
  { subscriptions: 0, delivered: 0, failed: 0, removed: 0 },
  0
);
assert.equal(unreachable.reachable, false);
assert.equal(unreachable.reason, "no_push_subscription");

const pushed = summarizeCallDelivery(
  { subscriptions: 1, delivered: 1, failed: 0, removed: 0 },
  0
);
assert.equal(pushed.reachable, true);
assert.equal(pushed.reason, undefined);

const liveSocket = summarizeCallDelivery(
  { subscriptions: 0, delivered: 0, failed: 0, removed: 0 },
  1
);
assert.equal(liveSocket.reachable, true);

const failedPush = summarizeCallDelivery(
  { subscriptions: 2, delivered: 0, failed: 2, removed: 1 },
  0
);
assert.equal(failedPush.reachable, false);
assert.equal(failedPush.reason, "push_failed");

const payload = buildIncomingCallPush({
  callerId: "user_a",
  callerName: "Tex",
  roomId: "room_123",
  isVideo: false,
  pulse: 2,
});
assert.equal(payload.type, "CALL_INCOMING");
assert.equal(payload.action, "incoming_call");
assert.equal(payload.isVideo, false);
assert.match(payload.body, /still calling/);
assert.match(payload.url, /action=incoming_call/);
assert.ok(callPushTopic(payload.roomId).length <= 32);
assert.ok(callPushTopic("room_" + "x".repeat(80)).length <= 32);

const stunOnly = getIceServers({});
assert.equal(hasTurnServer({}), false);
assert.ok(stunOnly.some((server) => String(server.urls).includes("stun:")));

const withTurn = getIceServers({
  TURN_URLS: "turn:turn.example.com:3478, turns:turn.example.com:5349",
  TURN_USERNAME: "aura",
  TURN_CREDENTIAL: "secret",
});
assert.equal(hasTurnServer({
  TURN_URLS: "turn:turn.example.com:3478",
  TURN_USERNAME: "aura",
  TURN_CREDENTIAL: "secret",
}), true);
const turn = withTurn.find((server) => Array.isArray(server.urls));
assert.ok(turn);
assert.deepEqual(turn?.urls, ["turn:turn.example.com:3478", "turns:turn.example.com:5349"]);

console.log("delivery and ice checks passed");
