import assert from 'node:assert/strict';
import { RecoveryService } from '../server/recoveryService';

console.log('--- Running Recovery Principles & Progress Tests ---');

const recovery = new RecoveryService();

// 1. Save Step 1 progress with notes and action commitment
const userTexId = 'user_tex';
const step1Progress = {
  step: 1,
  isCompleted: false,
  actionCommitted: true,
  userNotes: 'I lay down my son and addictions, pickup my cross and walk with Christ.',
  completedAt: new Date().toISOString()
};

const savedState = recovery.saveUserPrinciple(userTexId, step1Progress);
assert.ok(savedState, 'Saved state should not be null');
assert.ok(savedState[1], 'Step 1 should exist in userPrinciples');
assert.equal(savedState[1].actionCommitted, true, 'actionCommitted must be true');
// When actionCommitted is true, isCompleted should be automatically recognized
assert.equal(savedState[1].isCompleted, true, 'isCompleted must be true when committed');
assert.equal(savedState[1].userNotes, 'I lay down my son and addictions, pickup my cross and walk with Christ.');

console.log('✓ PASS: Step 1 progress and notes successfully recorded');

// 2. Query user principles
const retrieved = recovery.getUserPrinciples(userTexId);
assert.equal(retrieved[1].step, 1);
assert.equal(retrieved[1].isCompleted, true);
assert.equal(retrieved[1].actionCommitted, true);
assert.equal(retrieved[1].userNotes, 'I lay down my son and addictions, pickup my cross and walk with Christ.');

console.log('✓ PASS: Retrieved Step 1 progress matches saved data');

// 3. Test Tex Alias cross-sync
const texAliasRetrieved = recovery.getUserPrinciples('rvnvHGDInTWcFdzy9LZpKFsabgz1');
assert.ok(texAliasRetrieved[1], 'Step 1 must be available for Tex Firebase UID alias');
assert.equal(texAliasRetrieved[1].userNotes, 'I lay down my son and addictions, pickup my cross and walk with Christ.');

console.log('✓ PASS: Tex alias synchronization works across identifiers');

// 4. Test Step 2 toggle
const step2Progress = {
  step: 2,
  isCompleted: true,
  actionCommitted: true,
  userNotes: 'Believing in Christ who delivers and restores.',
};
recovery.saveUserPrinciple(userTexId, step2Progress);
const afterStep2 = recovery.getUserPrinciples(userTexId);
assert.equal(afterStep2[2].isCompleted, true);
assert.equal(Object.keys(afterStep2).length >= 2, true);

console.log('✓ PASS: Multiple steps tracked and persisted correctly');
console.log('All recovery tests passed successfully!');
