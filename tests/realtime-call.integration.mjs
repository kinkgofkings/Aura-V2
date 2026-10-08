/**
 * Live server check for call delivery.
 * Usage: node tests/realtime-call.integration.mjs
 * Expects Aura on http://localhost:3000
 */
import assert from "node:assert/strict";
import WebSocket from "ws";

const base = process.env.AURA_BASE_URL || "http://localhost:3000";
const callerId = "delivery_caller_" + Date.now();
const receiverId = "delivery_receiver_" + Date.now();

const health = await fetch(`${base}/api/health`);
assert.equal(health.status, 200);
const healthBody = await health.json();
assert.equal(healthBody.status, "ok");
assert.equal(typeof healthBody.turnConfigured, "boolean");

const ice = await fetch(`${base}/api/webrtc/ice`);
assert.equal(ice.status, 200);
const iceBody = await ice.json();
assert.ok(Array.isArray(iceBody.iceServers) && iceBody.iceServers.length > 0);

const wsUrl = base.replace(/^http/, "ws") + `/ws?userId=${encodeURIComponent(receiverId)}`;
const ws = new WebSocket(wsUrl);
const frames = [];
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("websocket did not open")), 5000);
  ws.on("open", () => {
    clearTimeout(timer);
    resolve();
  });
  ws.on("error", (err) => {
    clearTimeout(timer);
    reject(err);
  });
});
ws.on("message", (raw) => {
  frames.push(JSON.parse(raw.toString()));
});

const roomId = `room_delivery_${Date.now()}`;
const callRes = await fetch(`${base}/api/calls`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    callerId,
    callerName: "Delivery Check",
    callerAvatar: "/icon.png",
    receiverId,
    receiverName: "Receiver",
    receiverAvatar: "/icon.png",
    isVideo: true,
    roomId,
  }),
});
assert.equal(callRes.status, 201);
const callBody = await callRes.json();
assert.equal(callBody.status, "calling");
assert.equal(callBody.delivery.realtimeDelivered >= 1, true);
assert.equal(callBody.delivery.reachable, true);
assert.equal(callBody.delivery.pushSubscriptions, 0);

await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("call:incoming was not delivered over the socket")), 3000);
  const check = () => {
    if (frames.some((frame) => frame.type === "call:incoming" && frame.session?.roomId === roomId)) {
      clearTimeout(timer);
      resolve();
    }
  };
  check();
  ws.on("message", check);
});

const missedCaller = "delivery_caller_closed_" + Date.now();
const missedReceiver = "delivery_receiver_closed_" + Date.now();
const closedRes = await fetch(`${base}/api/calls`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    callerId: missedCaller,
    callerName: "Closed Phone",
    receiverId: missedReceiver,
    receiverName: "Nobody Home",
    isVideo: false,
    roomId: `room_closed_${Date.now()}`,
  }),
});
assert.equal(closedRes.status, 201);
const closedBody = await closedRes.json();
assert.equal(closedBody.delivery.reachable, false);
assert.equal(closedBody.delivery.reason, "no_push_subscription");

const statusRes = await fetch(`${base}/api/calls/${encodeURIComponent(roomId)}/status`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "ended" }),
});
assert.equal(statusRes.status, 200);

ws.close();
console.log("realtime call delivery check passed");
