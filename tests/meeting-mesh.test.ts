import assert from "node:assert/strict";
import { meetingSignalKey, shouldInitiateMeshOffer } from "../src/services/meetingMesh";

assert.equal(shouldInitiateMeshOffer("a", "b"), true);
assert.equal(shouldInitiateMeshOffer("b", "a"), false);
assert.equal(shouldInitiateMeshOffer("user_tex", "user_tex"), false);
assert.equal(shouldInitiateMeshOffer("", "user_tex"), false);

const key = meetingSignalKey({
  fromUserId: "a",
  toUserId: "b",
  type: "offer",
  timestamp: 5,
});
assert.equal(key, "a|b|offer|5");

console.log("meeting mesh checks passed");
